import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getFileContents, plural, showError } from '../../Tools/helpers';
import { LocalStorageService } from '../../Tools/LocalStorageService';

type TAirports = Map<string, string>;

export async function GenerateAirports(storageManager: LocalStorageService) {
	console.log('GenerateAirports()');

	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	const document = editor.document;
	const filename = path.basename(document.uri.path).toLocaleLowerCase();
	if ('file' !== document.uri.scheme || !filename.startsWith('flightplans')) return;

	// Get master airports data
	const masterAirportsFilePath: string | undefined = vscode.workspace
		.getConfiguration('fs-ai-tools.generateAirports', undefined)
		.get('masterAirportsFilePath');
	if (!masterAirportsFilePath?.length) {
		showError('Master airports file path has not been set in settings.');
		return;
	}
	const masterAirports: TAirports | null = await getMasterAirports(masterAirportsFilePath, storageManager);
	if (!masterAirports || !masterAirports.size) {
		return;
	}

	/**
	 * Airports existing in flightplan, with duplicates removed, sorted alphabetically.
	 */
	const airports = await collectAirports(document.getText(), masterAirports, masterAirportsFilePath);
	if (!airports) {
		return;
	}

	await writeToAirportsTxtFile(airports, document.uri.path);
}

async function getMasterAirports(filePath: string, storageManager: LocalStorageService) {
	if (!fs.existsSync(filePath)) {
		showError(`Master airports file at _"${filePath}"_ couldn't be found`);
		return null;
	}

	// Check for changes since last use
	const savedModifiedTime = storageManager.getValue('airportMasterModifiedTime');
	const modifiedTime = fs.statSync(filePath).mtimeMs;

	let loadFromStorage = savedModifiedTime && savedModifiedTime === modifiedTime;

	// Load storage data
	if (loadFromStorage) {
		const storedData = storageManager.getValue<TAirports>('airportMasterData');

		if (storedData?.size) {
			return storedData;
		}
		loadFromStorage = false;
	}

	// Read and parse file, save to storage
	if (!loadFromStorage) {
		const fileContents = await getFileContents(filePath);
		if (!fileContents) return null;

		const airports: TAirports = new Map(
			fileContents
				.split('\n')
				.filter((line) => line.length)
				.map((line) => {
					const lineTrimmed = line.trim();
					const code = lineTrimmed.split(',')[0];

					return [code, lineTrimmed];
				})
		);

		// Save to storage
		storageManager.setValue<Number>('airportMasterModifiedTime', modifiedTime);
		storageManager.setValue<TAirports>('airportMasterData', airports);

		return airports;
	}

	showError(`Master airports file couldn't be parsed.`);
	return null;
}

/**
 * It takes a string and returns an array of unique airport codes.
 * @param {string} text - The text to search for airports in.
 * @returns A set of airport codes, with duplicates removed, sorted alphabetically.
 */
async function collectAirports(text: string, masterAirports: TAirports, masterAirportsFilePath: string) {
	const matches = [...text.trim().matchAll(/,[FfRr],\d+,([A-Za-z0-9]{3,4})/gm)];
	if (!matches?.length) {
		showError('No airports could be found in the flightplan.');
		return null;
	}

	const airportCodes = new Set(matches.map((match) => match[1]).sort());

	const found: string[] = [];
	const missing: string[] = [];
	for (const code of airportCodes.values()) {
		if (code?.length && masterAirports.has(code)) {
			const data = masterAirports.get(code);
			found.push(data!);
		} else {
			missing.push(code);
		}
	}

	let continueWriting = true;
	if (missing.length) {
		const title = `${plural('airport', missing.length)} not found in the master file`;
		const msg = missing
			.sort()
			.map((code) => `• ${code}`)
			.join('\n');

		await vscode.window
			.showErrorMessage(title, { modal: true, detail: msg }, 'Continue anyway', 'Open Master File')
			.then((buttonText) => {
				if (!buttonText) {
					continueWriting = false;
					showError('Generating airports has been canceled.');
				} else if (buttonText === 'Continue anyway') {
					continueWriting = true;
				} else if (buttonText === 'Open Master File') {
					continueWriting = false;

					const uri = vscode.Uri.file(masterAirportsFilePath);
					vscode.workspace.openTextDocument(uri).then((doc) => {
						vscode.window.showTextDocument(doc).then((editor) => {
							// Jump to last line
							const pos = new vscode.Position(doc.lineCount + 1, 0);

							// Selection with same position twice → cursor jumps there
							editor.selections = [new vscode.Selection(pos, pos)];
							editor.revealRange(new vscode.Range(pos, pos));
						});
					});
				}
			});
	}

	if (continueWriting) return new Set(found.sort());

	return null;
}

/**
 * Writes the airports to the airports.txt file in the current directory. Creates file if it doesn't exist.
 * @param airports - Airports list as `Set<string>`
 * @param {string} flightplansTxtPath - The path to the flightplans.txt file.
 */
async function writeToAirportsTxtFile(airports: Set<string>, flightplansTxtPath: string) {
	const dirPath = path.dirname(flightplansTxtPath).replace(/^\/+/, '');
	const fileName = path.basename(flightplansTxtPath).replace(/^flightplans/i, 'Airports');
	const filePath = vscode.Uri.file(path.join(dirPath, fileName));

	const edit = new vscode.WorkspaceEdit();
	edit.createFile(filePath, { ignoreIfExists: true });
	edit.delete(filePath, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(9999, 9999)));
	edit.insert(filePath, new vscode.Position(0, 0), [...airports].join('\n'));
	await vscode.workspace.applyEdit(edit);

	vscode.workspace.openTextDocument(filePath).then((doc: vscode.TextDocument) => {
		doc.save();
		vscode.window.showInformationMessage(
			`${plural('airport', airports.size)} generated, "${fileName}" file written`
		);
	});
}
