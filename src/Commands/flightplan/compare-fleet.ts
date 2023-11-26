import * as vscode from 'vscode';
import {
	TParsedAircraftTxtData,
	getAircraftTypeMetaData,
	parseAircraftTxt,
} from '../../Content/Aircraft/parseAircraftTxt';
import { getFlightplanFiles, showError } from '../../Tools/helpers';
import path from 'path';

export async function CompareFleet() {
	const thisFile = vscode?.window?.activeTextEditor?.document.uri;
	if (!thisFile) {
		vscode.window.showErrorMessage(`Current flightplan document not found.`);
		return false;
	}

	/*
	 * Get user selected other file
	 */
	const otherFile = await getOtherFile(thisFile);
	if (!otherFile) return;

	/*
	 * Get flightplans' fleets
	 */
	const fleets = await getFleets(thisFile, otherFile);
	if (!fleets) return;

	/*
	 * Create output table content
	 */
	const formattedOutput = formatOutput(fleets, [thisFile, otherFile]);
	console.log({ formattedOutput });

	// -------------------------------------------------------------------------
}

/**
 * Asynchronous function that prompts the user to select a flightplan file and
 * returns the selected file if it is different from the current file.
 * @param thisFile - URI of the current file that is being compared to another
 * file.
 * @returns Promise of the selected flightplan file as a `vscode.Uri` object.
 */
async function getOtherFile(thisFile: vscode.Uri) {
	const otherFile = await vscode.window.showOpenDialog({
		title: `Select the flightplan to compare`,
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: false,
		openLabel: 'Select',
		filters: {
			Flightplans: ['txt'],
		},
	});

	if (!otherFile?.length) {
		return;
	}
	// console.log({ thisFile, otherFile });

	//TODO specifically check against "thisFile" flightplan (could be called from aircraft.txt)
	if (thisFile.path.toLowerCase() === otherFile[0].path.toLowerCase()) {
		vscode.window.showErrorMessage(`Both flightplans are identical.`);
		return;
	}

	return otherFile[0];
}

/**
 * Asynchronous function that retrieves and parses aircraft data from two files
 * and returns an array of parsed data.
 * @param thisFile - `vscode.Uri` object representing the URI of a file. It is
 * used to specify the path of a file that is being processed.
 * @param otherFile - `vscode.Uri` object that represents the URI of another
 * file
 * @returns Promise of an array of `TParsedAircraftTxtData` objects.
 */
async function getFleets(thisFile: vscode.Uri, otherFile: vscode.Uri) {
	const fleets: TParsedAircraftTxtData[] = [];
	for (const filePath of [thisFile.path, otherFile.path]) {
		let dirPath = path.parse(filePath).dir;
		dirPath = dirPath.replace(/^\/+/, '');
		const fileData = await getFlightplanFiles(dirPath, true);
		if (!fileData.aircraft || !fileData.flightplans) {
			const name = fileData.aircraft ? 'Flightplans' : 'Aircraft';
			showError(`${name}….txt file couldn't be found in "${dirPath}".`);
			return;
		}

		const parsedData = await parseAircraftTxt(fileData, true);
		if (!parsedData) return;

		fleets.push(parsedData);
	}

	if (fleets.length !== 2) {
		return;
	}

	return fleets;
}

async function formatOutput(fleets: TParsedAircraftTxtData[], files: vscode.Uri[]) {
	// throw new Error('Function not implemented.');
	const metaData = await getAircraftTypeMetaData();
	const includedTypes = [...fleets[0].aircraftTypes.keys(), ...fleets[1].aircraftTypes.keys()];
	const includedTypesSorted = metaData.list.filter((typeCode) => includedTypes.includes(typeCode));

	const fileNames: string[] = files.map((file) => path.parse(file.path).base);

	const colWidths = [4, fileNames[0].length, fileNames[1].length];

	const rows: { typeCode: string; thisCount: number; otherCount: number }[] = includedTypesSorted.map((typeCode) => {
		const thisCount = fleets[0].aircraftTypes.get(typeCode)?.aircraftCount || 0;
		const otherCount = fleets[1].aircraftTypes.get(typeCode)?.aircraftCount || 0;

		// colWidths[0] = Math.max(colWidths[0], typeCode.length);
		colWidths[1] = Math.max(colWidths[1], String(thisCount).length);
		colWidths[2] = Math.max(colWidths[2], String(otherCount).length);

		return { typeCode, thisCount, otherCount };
	});

	/*
	| TYPE | Filename1.txt | Filename2.txt |
	| ---- | ------------- | ------------- |
	| A320 |      0        |      17       |
	*/

	const output = [
		`| TYPE | ${fileNames[0]} | ${fileNames[1]} |`,
		`| ---- | ${'-'.repeat(colWidths[1])} | ${'-'.repeat(colWidths[2])} |`,
	];

	for (const row of rows) {
		const tc: string = row.thisCount ? row.thisCount.pad(colWidths[1], ' ') : ' '.repeat(colWidths[1]);
		const oc: string = row.otherCount ? row.otherCount.pad(colWidths[2], ' ') : ' '.repeat(colWidths[2]);

		output.push(`| ${row.typeCode} | ${tc} | ${oc} |`);
	}

	console.log(rows, output);

	return { output, rows };
}
