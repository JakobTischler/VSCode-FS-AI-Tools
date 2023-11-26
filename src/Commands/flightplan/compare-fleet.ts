import * as vscode from 'vscode';
import {
	TParsedAircraftTxtData,
	getAircraftTypeMetaData,
	parseAircraftTxt,
} from '../../Content/Aircraft/parseAircraftTxt';
import { getFlightplanFiles, showError } from '../../Tools/helpers';
import path from 'path';

interface IFleetCompareData {
	typeCode: string;
	thisCount: number;
	otherCount: number;
}

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
	const compareData = await getCompareData(fleets);
	const formattedText = getFormattedText(
		compareData,
		[fleets[0].totalAircraftCount, fleets[1].totalAircraftCount],
		[thisFile, otherFile]
	);
	console.log({ formattedText });

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

async function getCompareData(fleets: TParsedAircraftTxtData[]) {
	// throw new Error('Function not implemented.');
	const metaData = await getAircraftTypeMetaData();
	const includedTypes = [...fleets[0].aircraftTypes.keys(), ...fleets[1].aircraftTypes.keys()];
	const includedTypesSorted = metaData.list.filter((typeCode) => includedTypes.includes(typeCode));

	const rows: IFleetCompareData[] = includedTypesSorted.map((typeCode) => {
		const thisCount = fleets[0].aircraftTypes.get(typeCode)?.aircraftCount || 0;
		const otherCount = fleets[1].aircraftTypes.get(typeCode)?.aircraftCount || 0;

		return { typeCode, thisCount, otherCount };
	});

	return rows;
}

/*
| TYPE | Filename1.txt | Filename2.txt |
| ---- | ------------- | ------------- |
| A320 |      0        |      17       |
*/
function getFormattedText(data: IFleetCompareData[], total: number[], files: vscode.Uri[]) {
	const fileNames: string[] = files.map((file) => path.parse(file.path).base);

	const colWidths = [5, fileNames[0].length, fileNames[1].length];
	for (const entry of data) {
		colWidths[0] = Math.max(colWidths[0], entry.typeCode.length);
		colWidths[1] = Math.max(colWidths[1], String(entry.thisCount).length);
		colWidths[2] = Math.max(colWidths[2], String(entry.otherCount).length);
	}

	const separator = `| ${'-'.repeat(colWidths[0])} | ${'-'.repeat(colWidths[1])} | ${'-'.repeat(colWidths[2])} |`;

	const output = [`| TYPE  | ${fileNames[0]} | ${fileNames[1]} |`, separator];

	for (const row of data) {
		const t = row.typeCode.padEnd(colWidths[0], ' ');
		const tc: string = row.thisCount ? row.thisCount.pad(colWidths[1], ' ') : ' '.repeat(colWidths[1]);
		const oc: string = row.otherCount ? row.otherCount.pad(colWidths[2], ' ') : ' '.repeat(colWidths[2]);

		output.push(`| ${t} | ${tc} | ${oc} |`);
	}

	output.push(separator, `| TOTAL | ${total[0].pad(colWidths[1], ' ')} | ${total[1].pad(colWidths[2], ' ')} |`);

	// console.log(data, output);
	return output;
}
