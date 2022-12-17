import * as vscode from 'vscode';
import * as path from 'path';

import {
	getAircraftNumFromLine,
	getFilename,
	getFlightplanFiles,
	replaceDocumentContents,
	showError,
} from '../../Tools/helpers';
import { parseAircraftTxt, TParsedAircraftTxtData } from '../../Content/Aircraft/parseAircraftTxt';
import { AircraftType } from '../../Content/Aircraft/AircraftType';

type TAcTypeGroup = [AircraftType, string[]];

export async function GroupByAircraftType() {
	/*
	 * 1. [x] Parse aircraft.txt to get aircraftTypes map
	 * 2. if file === aircraft.txt:
	 *    [ ] a. go through each line, check acType with previous line's acType
	 *    [ ] b. if same: no empty line, else empty line [TODO num empty lines from config]
	 *    [ ] c. [STRETCH GOAL] optionally sort by radius (create new config setting)
	 * 3. if file === flightplans.txt:
	 *    [ ] a. create arrays of AC#s (should already be done in (1.)?)
	 *    [ ] b. for each group, use ac title as header
	 *    [ ] c. if new acNum, but same acType: inset header, no empty line
	 *    [ ] d. if new acNum and different acType: empty lines (from config) and new header
	 *    [ ] e. [STRETCH GOAL]: parse titles of same acType to find base title and subsequent variation names
	 *    [ ] f. [STRETCH GOAL] optionally sort by radius (create new config setting)
	 */

	console.log(`Running GroupByAircaftType()`);

	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	const filePath = editor.document.uri.path;
	const dirPath = path.dirname(filePath).replace(/^\/+/, '');

	// Get Aicraft…, Flightplans… file paths
	const fileData = await getFlightplanFiles(dirPath, true);
	if (!fileData.aircraft || !fileData.flightplans) {
		const name = fileData.aircraft ? 'Flightplans' : 'Aircraft';
		showError(`${name}….txt file couldn't be found in current directory.`);
		return;
	}

	const aircraftData: TParsedAircraftTxtData | undefined = await parseAircraftTxt(fileData, true, true, true);
	if (!aircraftData) return;

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 */

	const filename = getFilename(editor).toLowerCase();
	let newFileContents = '';
	if (filename.startsWith('aircraft')) {
		const { output } = groupAircraftTxt(editor.document.getText(), aircraftData);

		newFileContents = output;
	} else {
		// TODO flightplan
	}

	if (newFileContents?.length) {
		// Apply changes to document
		replaceDocumentContents(editor, newFileContents);

		vscode.window.showInformationMessage('Aircraft grouped by type');
	}
}

function groupAircraftTxt(
	fileContents: string,
	aircraftData: TParsedAircraftTxtData
): { headerLines: string[]; aircraftGroups: TAcTypeGroup[]; aircraftGroupsSorted: TAcTypeGroup[]; output: string } {
	const lines = fileContents.split('\n');

	/*
	 * ————————————————————————————————————————————————————————————
	 * Create header group and aircraft groups
	 */

	const headerLines: string[] = [];
	const aircraftGroups: TAcTypeGroup[] = [];
	let currentGroupLines: string[] = [];
	let currentAircraftType: AircraftType | undefined;

	for (const [index, line] of lines.entries()) {
		const acNum = getAircraftNumFromLine(line);
		if (acNum) {
			let acType;
			if (Number.isInteger(acNum)) {
				acType = aircraftData.aircraftLiveries.get(<number>acNum)?.aircraftType;
			} else {
				acType = getAircraftTypeFromLine(line, aircraftData);
			}

			if (!acType) {
				console.error(`No aircraftType could be matched to "${line}"`);
				continue;
			}

			// New aircraftType
			if (acType !== currentAircraftType) {
				// If we already have a currentAircraftType, store to groups array
				if (currentAircraftType) {
					aircraftGroups.push([currentAircraftType, currentGroupLines]);
					currentGroupLines = [];
				}

				currentAircraftType = acType;
			}

			currentGroupLines.push(line);
		} else if (currentAircraftType) {
			currentGroupLines.push(line);
		} else {
			headerLines.push(line);
			continue;
		}

		// Last line: store to groups array
		if (index === lines.length - 1 && currentAircraftType) {
			aircraftGroups.push([currentAircraftType, currentGroupLines]);
		}
	}

	/*
	 * ————————————————————————————————————————————————————————————
	 * Sort groups by wingspan
	 * TODO only if configured
	 */
	const config = vscode.workspace.getConfiguration('fs-ai-tools', undefined);

	const aircraftGroupsSorted = [...aircraftGroups].sort((a: TAcTypeGroup, b: TAcTypeGroup) =>
		Math.sign(b[0].wingspan! - a[0].wingspan!)
	);

	/*
	 * ————————————————————————————————————————————————————————————
	 * Create text output
	 */

	// "fs-ai-tools.rebaseAircraftNumbers.emptyLinesBetweenGroupsAircraftTxt"

	/** Only aircraft lines; empty lines removed */
	const cleanedGroups = aircraftGroupsSorted
		.map((group) => {
			return group[1].filter((line) => line.trim().length).join('\n');
		})
		.flat(3);

	let output = headerLines.length ? headerLines.join('\n') + '\n' : '';
	output += cleanedGroups.join(
		'\n' + '\n'.repeat(config.get('rebaseAircraftNumbers.emptyLinesBetweenGroupsAircraftTxt') || 1)
	);
	console.log({ headerLines, aircraftGroups, aircraftGroupsSorted, output });

	return { headerLines, aircraftGroups, aircraftGroupsSorted, output };
}

function getAircraftTypeFromLine(
	text: string,
	aircraftData: TParsedAircraftTxtData,
	allowInactive = true,
	allowInvalidNumber = true
) {
	const regex = new RegExp(
		`^(?:AC${allowInactive ? '|//)' : ')'}#(?<acNum>` +
			(allowInvalidNumber ? '.*?)' : '\\d+?)') +
			',\\d+,\\"(?<title>.*)\\"'
	);
	const match = text.match(regex);
	console.log({ text, match });

	if (match?.groups?.title) {
		const matchingLiveries = [
			...aircraftData.inactiveAircraftLiveries,
			...aircraftData.aircraftLiveries.values(),
		].filter((livery) => {
			return livery.title === match!.groups!.title;
		});

		if (matchingLiveries.length) {
			return matchingLiveries[0].aircraftType;
		}
	}
}
