import * as vscode from 'vscode';
import {
	TParsedAircraftTxtData,
	getAircraftTypeMetaData,
	parseAircraftTxt,
} from '../../Content/Aircraft/parseAircraftTxt';
import { getFlightplanFiles, showError } from '../../Tools/helpers';
import path from 'path';
import { getWebviewContent } from '../../Webviews/compare-fleet/get-content';

interface IFleetCompareData {
	typeCode: string;
	thisCount: number;
	otherCount: number;
}
export interface IFleetCompareResultData {
	compareData: IFleetCompareData[];
	total: { thisFleet: number; otherFleet: number };
	files: { thisFile: vscode.Uri; otherFile: vscode.Uri };
}

export async function CompareFleet(context: vscode.ExtensionContext) {
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
	 * Create output table content (formatted text table)
	 */
	const compareData = await getCompareData(fleets);
	const resultData: IFleetCompareResultData = {
		compareData,
		total: {
			thisFleet: fleets[0].totalAircraftCount,
			otherFleet: fleets[1].totalAircraftCount,
		},
		files: {
			thisFile,
			otherFile,
		},
	};
	const formattedText = getFormattedText(resultData);
	console.log({ formattedText });

	/*
	 * Create output table content (webview)
	 */
	createPanel(context, resultData);
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

/**
 * Takes in an array of parsed aircraft data and returns a comparison of the
 * aircraft counts for each type of aircraft in the two fleets.
 * @param {TParsedAircraftTxtData[]} fleets - Array of `TParsedAircraftTxtData`
 * objects. "This" file's fleet is to be at index 0, the other file's fleet at
 * index 1.
 * @returns An array of objects of type `IFleetCompareData`, respectively
 * containing each aircraft type in any of the two fleets and its respective
 * count in each fleet.
 */
async function getCompareData(fleets: TParsedAircraftTxtData[]) {
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
function getFormattedText(data: IFleetCompareResultData) {
	const thisFilename = path.parse(data.files.thisFile.path).base;
	const otherFilename = path.parse(data.files.otherFile.path).base;

	// const fileNames: string[] = files.map((file) => path.parse(file.path).base);

	const colWidths = [5, thisFilename.length, otherFilename.length];
	for (const entry of data.compareData) {
		colWidths[0] = Math.max(colWidths[0], entry.typeCode.length);
		colWidths[1] = Math.max(colWidths[1], String(entry.thisCount).length);
		colWidths[2] = Math.max(colWidths[2], String(entry.otherCount).length);
	}

	const separator = `| ${'-'.repeat(colWidths[0])} | ${'-'.repeat(colWidths[1])} | ${'-'.repeat(colWidths[2])} |`;

	const output = [`| TYPE  | ${thisFilename} | ${otherFilename} |`, separator];

	for (const row of data.compareData) {
		const t = row.typeCode.padEnd(colWidths[0], ' ');
		const tc: string = row.thisCount ? row.thisCount.pad(colWidths[1], ' ') : ' '.repeat(colWidths[1]);
		const oc: string = row.otherCount ? row.otherCount.pad(colWidths[2], ' ') : ' '.repeat(colWidths[2]);

		output.push(`| ${t} | ${tc} | ${oc} |`);
	}

	output.push(
		separator,
		`| TOTAL | ${data.total.thisFleet.pad(colWidths[1], ' ')} | ${data.total.otherFleet.pad(colWidths[2], ' ')} |`
	);

	// console.log(data, output);
	return output;
}

async function createPanel(context: vscode.ExtensionContext, data: IFleetCompareResultData) {
	// const config = vscode.workspace.getConfiguration('fs-ai-tools.airlineView', undefined);

	// Define localResourceRoots
	const localResourceRoots = [
		vscode.Uri.file(path.join(context.extensionPath, 'res/Webviews/compare-fleet')),
		// vscode.Uri.file(flightplanDir),
	];

	/* const logoDirectoryPath = config.get('logoDirectoryPath') as string;
	if (logoDirectoryPath?.length) {
		localResourceRoots.push(vscode.Uri.file(logoDirectoryPath));
	} */

	const panel = vscode.window.createWebviewPanel('compareFleet', `Compare Fleet`, vscode.ViewColumn.Active, {
		enableScripts: true,
		localResourceRoots,
	});

	panel.webview.html = await getWebviewContent(data);

	return panel;
}
