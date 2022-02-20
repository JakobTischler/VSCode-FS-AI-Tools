import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getFileContents, plural, showError } from '../../helpers';

type TAirports = Map<string, string>;

export async function GenerateAirports() {
	console.log('GenerateAirports()');

	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	const document = editor.document;
	const filename = path.basename(document.uri.path).toLocaleLowerCase();
	if ('file' !== document.uri.scheme || !filename.startsWith('flightplans')) return;

	/**
	 * Master airports data
	 */
	const masterAirports: TAirports | null = await getMasterAirports(
		'D:\\P3D Addons\\AI Flightplans\\ZZ_Airports\\Airports__MASTER.txt'
	);
	if (!masterAirports) {
		showError(`Master airports file couldn't be parsed.`);
		return;
	}

	/**
	 * Airports existing in flightplan, with duplicates removed, sorted alphabetically.
	 */
	const airports = collectAirports(document.getText(), masterAirports);
	if (!airports) {
		showError(`No airports could be found in flightplan.`);
		return;
	}

	await writeToAirportsTxtFile(airports, document.uri.path);
}

// TODO store/load in session   /   remember file hash, check for changes → re-read
async function getMasterAirports(filePath: string) {
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

	return airports;
}

/**
 * It takes a string and returns an array of unique airport codes.
 * @param {string} text - The text to search for airports in.
 * @returns A set of airport codes, with duplicates removed, sorted alphabetically.
 */
function collectAirports(text: string, masterAirports: TAirports) {
	const matches = [...text.trim().matchAll(/,[FfRr],\d+,([A-Za-z0-9]{3,4})/gm)];
	if (!matches?.length) return null;

	const airportCodes = new Set(matches.map((match) => match[1]).sort());

	const ret: string[] = [];
	for (const code of airportCodes.values()) {
		if (code?.length && masterAirports.has(code)) {
			const data = masterAirports.get(code);
			ret.push(data!);
		}
	}
	return new Set(ret.sort());
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
		vscode.window.showInformationMessage(`${plural('airport', airports.size)} generated, ${fileName} file written`);
	});
}
