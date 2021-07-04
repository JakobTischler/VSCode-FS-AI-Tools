/*
 * [ ] TODO alternatively, or additionally, use aifp.cfg?
 * [ ] TODO Execute command: support right click in file browser
 * [ ] TODO Use internal F2 rename so file stays open
 */

/* Placeholders:
 * [x] Base → "Aircraft", "Airports", "Flightplans"
 * [x] base → "aircraft", "airports", "flightplans"
 * [x] name → Airline name
 * [x] icao → ICAO
 * [x] callsign → Callsign
 * [x] author → Author name
 * [x] season → Season short ("Wi2021")
 */

import * as vscode from 'vscode';
import * as Fs from 'fs';
import * as Path from 'path';
import { titleCase } from '../../helpers';
import { getTextInput } from '../../input';

export async function RenameFiles() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return false;
	}
	const filePath = editor.document.uri.path;
	let dirPath = Path.dirname(filePath).replace(/^\/+/, '');

	const config = vscode.workspace.getConfiguration('fs-ai-tools.renameFiles', undefined);

	// Get template and parse
	let template = config.get('filenameTemplate') as string;
	let upperCaseBase = false;

	let replacers = new Map();
	let placeholderMatches = template.match(/(\{.*?\})/g);

	if (placeholderMatches) {
		for (let item of placeholderMatches) {
			// Remaove braces
			item = item.substr(1, item.length - 2);

			// Define base
			if (item === 'Base') {
				upperCaseBase = true;
				continue;
			} else if (item === 'base') {
				continue;
			}

			// Check for optional post-characters
			let optional = item.split('?');

			// Add to replacers: value[0] is the actual value, value[1] is a suffix, which should be skipped if it's undefined
			replacers.set(optional[0], [undefined, optional[1]]);
		}
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
		item[1][0] = await getTextInput(titleCase(item[0]));
		if (item[1][0] === undefined) {
			vscode.window.showErrorMessage('User input cancelled → renaming aborted');
			return false;
		}

		let replaceValue = item[1][0];

		// Shorten season
		// https://regex101.com/r/7iMw7H/1/
		if (replaceValue && replaceValue.length && item[0] === 'season') {
			let seasonShort = undefined;
			let matches = replaceValue.match(/^(\w{2})((?:\w+ )?(?:\d\d)?)?(\d{2})(?:(?:[-\/])?(?:\d\d)?(\d{2}))?/);
			if (matches) {
				if (matches.length === 5) {
					if (matches[4]) {
						seasonShort = matches[1] + matches[3] + matches[4];
					} else if (matches[2].length === 2) {
						seasonShort = matches[1] + matches[2] + matches[3];
					} else {
						seasonShort = matches[1] + matches[3];
					}
				}
			}

			replaceValue = seasonShort;
		}

		if (config.get('replaceSpacesWithUnderscores')) {
			replaceValue = replaceValue.replace(/ /g, '_');
		}
		if (!(replaceValue && replaceValue.length)) {
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
	for (const file of files) {
		let matches = file.match(fileRegex);

		if (!(matches && matches[1])) {
			continue;
		}

		const oldFile = Path.join(dirPath, file);
		const newFile = Path.join(dirPath, (upperCaseBase ? titleCase(matches[1]) : matches[1]) + result);
		await Fs.promises.rename(oldFile, newFile);
	}

	vscode.window.showInformationMessage(`Files renamed to "…${result}"`);
}
