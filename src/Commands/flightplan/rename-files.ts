/* Placeholders:
 * Base → "Aircraft", "Airports", "Flightplans"
 * base → "aircraft", "airports", "flightplans"
 * name → Airline name
 * icao → ICAO
 * callsign → Callsign
 * author → Author name
 * season → Season short ("Wi2021")
 */

import * as vscode from 'vscode';
import * as Fs from 'fs';
import * as Path from 'path';
import { showError } from '../../Tools/helpers';
import { getTextInput } from '../../Tools/input';
import { readAifpCfg } from '../../Tools/read-aifp';

// Property definitions
const properties = new Map();
properties.set('name', { placeholder: 'Airline name', prompt: "Enter the airline's name" });
properties.set('icao', {
	placeholder: 'ICAO',
	prompt: "Enter the airline's ICAO. Leave empty if not applicable.",
});
properties.set('callsign', {
	placeholder: 'Callsign',
	prompt: "Enter the airline's callsign. Leave empty if not applicable.",
});
properties.set('author', {
	placeholder: 'Author',
	prompt: "Enter the airline's author. Leave empty if not applicable.",
});
properties.set('season', {
	placeholder: 'Season',
	prompt: "Enter the flightplan's season. Leave empty if not applicable.",
});

export async function RenameFiles(filePath?: string) {
	// No filePath passed as argument → check a possible currently open file
	if (!filePath) {
		filePath = vscode.window.activeTextEditor?.document.uri.path;

		// Neither argument nor editor has file → cancel
		if (!filePath) {
			showError('No valid file path provided');
			return false;
		}
	}

	const dirPath = Path.dirname(filePath).replace(/^\/+/, '');
	const config = vscode.workspace.getConfiguration('fs-ai-tools.renameFiles', undefined);

	// Get template and parse
	const template = config.get('filenameTemplate') as string;
	let upperCaseBase = false;

	const replacers = new Map();
	const placeholderMatches = template.match(/(\{.*?\})/g);

	if (placeholderMatches) {
		for (let item of placeholderMatches) {
			// Remove braces
			item = item.substr(1, item.length - 2);

			// Define base
			if (item === 'Base') {
				upperCaseBase = true;
				continue;
			} else if (item === 'base') {
				continue;
			}

			// Check for optional post-characters
			const optional = item.split('?');

			// Add to replacers: value[0] is the actual value, value[1] is a
			// suffix, which should be skipped if it's undefined
			replacers.set(optional[0], [undefined, optional[1]]);
		}
	}

	// Get aifp.cfg parsed data for pre-filling inputs
	const aifpData = await readAifpCfg(Path.join(dirPath, 'aifp.cfg'));
	const aifpDict = new Map();
	if (aifpData.found) {
		aifpDict.set('name', aifpData.airline);
		aifpDict.set('icao', aifpData.icao);
		aifpDict.set('callsign', aifpData.callsign);
		aifpDict.set('author', aifpData.author);
		aifpDict.set('season', aifpData.season);
	}

	// Get replacer inputs and replace in template
	let result = template.replace(/\{base\}/i, '');
	if (!result.endsWith('.txt')) {
		result += '.txt';
	}
	for (const item of replacers) {
		// Search value
		let searchValue = `{${item[0]}}`;
		if (item[1][1]) {
			searchValue = `{${item[0]}?${item[1][1]}}`;
		}

		// Replace value
		const property = properties.get(item[0]);
		const aifpValue = aifpDict.get(item[0]);
		item[1][0] = await getTextInput(property.placeholder, property.prompt, aifpValue);
		if (item[1][0] === undefined) {
			showError('User input cancelled → renaming aborted');
			return false;
		}

		let replaceValue = item[1][0];

		// Shorten season
		// https://regex101.com/r/7iMw7H/1/
		if (replaceValue?.length && item[0] === 'season') {
			let seasonShort = undefined;
			const matches = replaceValue.match(/^(\w{2})((?:\w+ )?(?:\d\d)?)?(\d{2})(?:(?:[-\/])?(?:\d\d)?(\d{2}))?/);
			if (matches?.length === 5) {
				if (matches[4]) {
					seasonShort = matches[1] + matches[3] + matches[4];
				} else if (matches[2].length === 2) {
					seasonShort = matches[1] + matches[2] + matches[3];
				} else {
					seasonShort = matches[1] + matches[3];
				}
			}

			replaceValue = seasonShort;
		}

		if (config.get('replaceSpacesWithUnderscores')) {
			replaceValue = replaceValue.replace(/ /g, '_');
		}
		if (!replaceValue?.length) {
			replaceValue = '';
		} else if (item[1][1]) {
			replaceValue += item[1][1];
		}
		result = result.replace(searchValue, replaceValue);
	}

	console.log({ result });
	console.log(dirPath);

	// Find files in current folder and rename
	const files = await Fs.promises.readdir(dirPath);
	const fileRegex = /^(aircraft|airports|flightplans).*\.txt$/i;
	const edit = new vscode.WorkspaceEdit();

	for (const file of files) {
		const matches = file.match(fileRegex);

		if (!matches?.[1]) {
			continue;
		}

		const oldFile = vscode.Uri.file(Path.join(dirPath, file));
		const newFile = vscode.Uri.file(
			Path.join(dirPath, (upperCaseBase ? matches[1].capitalize() : matches[1]) + result)
		);
		// await Fs.promises.rename(oldFile, newFile);
		edit.renameFile(oldFile, newFile);
	}

	const success = await vscode.workspace.applyEdit(edit); // This is when it happens
	if (success) {
		vscode.window.showInformationMessage(`Files renamed to "…${result}"`);
	} else {
		showError(`Files couldn't be renamed to "…${result}"`);
	}
}
