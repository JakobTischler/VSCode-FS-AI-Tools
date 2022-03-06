import * as vscode from 'vscode';
import * as Fs from 'fs';
import * as Path from 'path';
import { getFlightplanFiles, showError, writeTextToClipboard } from '../../Tools/helpers';
import '../../Extenders/string';
import * as aircraftNaming from '../../data/aircraft-naming.json';
import { parseAircraftTxt, TAircraftList } from '../../Content/Aircraft/parseAircraftTxt';

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
	const files = await getFlightplanFiles(dirPath);
	if (!(files.aircraft && files.flightplans)) {
		const name = !files.aircraft ? 'Aircraft' : 'Flightplans';
		showError(`${name}….txt file couldn't be found in current directory.`);
		return;
	}

	const parsedData = await parseAircraftTxt({
		aircraft: {
			fileName: files.aircraft.fileName,
			filePath: files.aircraft.path,
		},
		flightplans: {
			fileName: files.flightplans.fileName,
			filePath: files.flightplans.path,
		},
	});
	if (!parsedData) return;

	// Show formatted message with "copy" button
	const formattedList = getFormattedAircraftList(
		parsedData.aircraftList,
		parsedData.totalCount,
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
					const sheetsOutput = generateGoogleSheetsOutput(aircraftNaming, parsedData.aircraftList);
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

function generateGoogleSheetsOutput(data: typeof aircraftNaming, aircraftList: TAircraftList) {
	return data.list.map((item) => (aircraftList.has(item) ? aircraftList.get(item)?.count || '' : '')).join('\t');
}

/**
 * Iterates through the aircraftList items to provide a single formatted, readable string with "{type}: {count}× ({number of variations})"
 */
function getFormattedAircraftList(aircraftList: TAircraftList, totalCount: number, nonMatches: string[]) {
	const title = `${totalCount} aircraft`;

	const lines: string[] = [];

	aircraftList.forEach((data, key) => {
		let text = `• ${data.name || key}: ${data.count}×`;
		if (data.aircraft.size > 1) {
			text += ` (${'variation'.plural(data.aircraft.size)})`;
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
