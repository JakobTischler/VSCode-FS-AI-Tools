import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getFileContents, plural, showError } from '../../Tools/helpers';
import { LocalStorageService } from '../../Tools/LocalStorageService';
import { Airport, TAirportCodeCount } from '../../Classes/Airport';
import { FlightplanRaw } from '../../Classes/Flightplan';

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
	const airports = await collectFlightplanAirports(document.getText(), masterAirports);
	if (!airports) {
		return;
	}

	await writeToAirportsTxtFile(airports, document.uri.path, masterAirportsFilePath);
}

/**
 * Parses the file defined in `filePath` to create a master airport data Map.
 * Saves it to local storage, and retrieves it if used another time. If the
 * master file has changed (checked via timestamp), it is parsed regardless.
 * @param filePath Path to the master airports .txt file
 * @param storageManager The LocalStorageService manager to store and retrieve
 * the master airport data.
 * @returns A Map of the master airports (`Map<ICAO, Airports.txt line>`)
 */
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
					const icao = line.trim().split(',')[0];

					return [icao, line];
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
 * TODO move into Flightplan / FlightplanRaw class
 * @param {string} flightplanText -
 * @returns A set of airport codes, with duplicates removed, sorted alphabetically.
 */
async function collectFlightplanAirports(flightplanText: string, masterAirports: TAirports) {
	const flightplan = new FlightplanRaw(flightplanText);

	const airportCodes = flightplan.collectAirportCodes();
	if (!airportCodes) {
		showError('No airports could be found in the flightplan.');
		return null;
	}

	const found: Airport[] = [];
	const missing: string[] = [];
	for (const airport of airportCodes.values()) {
		if (airport.icao.length && masterAirports.has(airport.icao)) {
			const data = masterAirports.get(airport.icao);

			found.push(new Airport(data!));
		} else {
			missing.push(airport.icao);
		}
	}

	return {
		found,
		missing,
	};
}

/**
 * Writes the airports to the airports.txt file in the current directory. Creates file if it doesn't exist.
 * @param airports - Airports list as `Set<Airport>`
 * @param {string} flightplansTxtPath - The path to the flightplans.txt file.
 */
async function writeToAirportsTxtFile(
	airports: { found: Airport[]; missing: string[] },
	flightplansTxtPath: string,
	masterAirportsFilePath: string
) {
	let continueWriting = true;

	// Missing airports → Tell user and wait for deciscion to open the master file, cancel, or continue
	if (airports.missing.length) {
		const title = `${plural('airport', airports.missing.length)} not found in the master file`;
		const msg = airports.missing
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

	const dirPath = path.dirname(flightplansTxtPath).replace(/^\/+/, '');
	const fileName = path.basename(flightplansTxtPath).replace(/^flightplans/i, 'Airports');
	const filePath = vscode.Uri.file(path.join(dirPath, fileName));

	const text = airports.found.map((airport) => airport.line).join('\n');

	const edit = new vscode.WorkspaceEdit();
	edit.createFile(filePath, { ignoreIfExists: true });
	edit.delete(filePath, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(9999, 9999)));
	edit.insert(filePath, new vscode.Position(0, 0), text);
	await vscode.workspace.applyEdit(edit);

	vscode.workspace.openTextDocument(filePath).then((doc: vscode.TextDocument) => {
		doc.save();
		vscode.window.showInformationMessage(
			`${plural('airport', airports.found.length)} generated, "${fileName}" file written`
		);
	});
}
