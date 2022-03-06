import * as vscode from 'vscode';
import * as Path from 'path';
import { getFlightplanFiles, showError, writeTextToClipboard } from '../../Tools/helpers';
import '../../Extenders/string';
import * as aircraftNaming from '../../data/aircraft-naming.json';
import { parseAircraftTxt } from '../../Content/Aircraft/parseAircraftTxt';
import { TAircraftTypesByTypeCode } from '../../Content/Aircraft/AircraftType';

export async function ShowAircraftList() {
	/*
	1. Get aircraft list from current dir's aircraft file (map(acNum, acTitle))
	2. Count each acNum in current dir's flightplan file
	3. For each AC in map, try to get ICAO code (create new dictionary, sum up counts for matching ACs)
	4. Based on pre-defined excel sheet AC list, display tsv data
	*/

	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	const filePath = editor.document.uri.path;
	const dirPath = Path.dirname(filePath).replace(/^\/+/, '');

	// Get Aicraft…, Flightplans… file paths
	const fileData = await getFlightplanFiles(dirPath, true);
	if (!fileData.aircraft || !fileData.flightplans) {
		const name = !fileData.aircraft ? 'Aircraft' : 'Flightplans';
		showError(`${name}….txt file couldn't be found in current directory.`);
		return;
	}

	const parsedData = await parseAircraftTxt(fileData, true);
	if (!parsedData) return;

	// Show formatted message with "copy" button
	const formattedList = getFormattedAircraftList(
		parsedData.aircraftTypes,
		parsedData.totalAircraftCount,
		parsedData.nonMatches
	);
	const showGoogleSheetsButton = vscode.workspace
		.getConfiguration('fs-ai-tools.showAircraftList', undefined)
		.get('showGoogleSheetsButton');
	if (showGoogleSheetsButton) {
		vscode.window
			.showInformationMessage(
				formattedList.title,
				{ modal: true, detail: formattedList.text },
				'Copy for Google Sheets'
			)
			.then((buttonText) => {
				if (buttonText) {
					const sheetsOutput = generateGoogleSheetsOutput(aircraftNaming, parsedData.aircraftTypes);
					writeTextToClipboard(sheetsOutput, 'Google Sheets aircraft count copied to clipboard');
				}
			});
	} else {
		vscode.window.showInformationMessage(formattedList.title, {
			modal: true,
			detail: formattedList.text,
		});
	}
}

/**
 * Generates a string representing the count cells for all possible aircraft
 * types. If the count for an aircraft type is 0, the cell is left blank.
 * The cells are joined with a tab (`\t`).
 *
 * Note: uses the order and values of the `list` array in `aircraft-naming.json`.
 * @param data The `aircraft-naming` reference object
 * @param aircraftTypes The list of matched aircraft types
 * @returns The genereated cell output for Google Sheets
 */
function generateGoogleSheetsOutput(data: typeof aircraftNaming, aircraftTypes: TAircraftTypesByTypeCode) {
	return data.list
		.map((item) => (aircraftTypes.has(item) ? aircraftTypes.get(item)?.aircraftCount || '' : ''))
		.join('\t');
}

/**
 * Iterates through the aircraftTypes entries to provide a single formatted,
 * readable string with "{type}: {count}× ({number of variations})"
 */
function getFormattedAircraftList(aircraftTypes: TAircraftTypesByTypeCode, totalCount: number, nonMatches: string[]) {
	const title = `${totalCount} aircraft`;

	const lines: string[] = [];

	aircraftTypes.forEach((data, key) => {
		let text = `• ${data.name}: ${data.aircraftCount}×`;
		if (data.liveries.size > 1) {
			text += ` (${'variation'.plural(data.liveries.size)})`;
		}
		lines.push(text);
	});

	if (nonMatches.length) {
		lines.push(
			'',
			'—'.repeat(25),
			`❌ ${'aircraft title'.plural(nonMatches.length)} couldn't be matched to any aircraft type:`
		);
		lines.push(...nonMatches.map((title) => `• "${title}"`));
	}

	const text = lines.join('\n');

	return {
		title: title,
		text: text,
	};
}
