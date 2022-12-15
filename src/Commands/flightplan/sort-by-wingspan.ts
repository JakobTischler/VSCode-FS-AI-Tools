import { Position, Range, TextDocument, window } from 'vscode';
import path from 'path';
import { getFlightplanFiles, showError } from '../../Tools/helpers';
import { parseAircraftTxt } from '../../Content/Aircraft/parseAircraftTxt';
import { AircraftType } from '../../Content/Aircraft/AircraftType';

// import { AircraftData } from '../../Types/AircraftData';
// import _aircraftData from '../../Data/aircraft-data.json';
// const aircraftData = _aircraftData as AircraftData;

type TAcTypeGroup = [AircraftType, string[]];

export async function SortByWingspan() {
	/*
	1. Parse aircraft.txt
	2. go through each line
	3. start group
	4. if aircraft: check against title → get model [cache by acNum] → add to group map
	   else if: different model: new group
	   else: add to current group
	5. sort map by group wingspan
	6. output (optionally append wingspan to first header line)
	*/

	/*
	 * ————————————————————————————————————————————————————————————
	 * 1. Parse aircraft.txt to get aircraftLiveries and aircraftTypes
	 */
	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	const filePath = editor.document.uri.path;
	const dirPath = path.dirname(filePath).replace(/^\/+/, '');

	// Get Aicraft…, Flightplans… file paths
	const fileData = await getFlightplanFiles(dirPath, true);
	if (!fileData.aircraft || !fileData.flightplans) {
		const name = fileData.aircraft ? 'Flightplans' : 'Aircraft';
		showError(`${name}….txt file couldn't be found in current directory.`);
		return;
	}

	const parsedData = await parseAircraftTxt(fileData);
	if (!parsedData) return; //TODO error msg

	const fileName = path.basename(editor.document.uri.path);
	const isAircraftTxt = fileName.startsWith('aircraft');
	const content = editor.document.getText();
	const lines = content.split('\n');

	const headerLines: string[] = [];
	const groups: TAcTypeGroup[] = [];
	let currentGroupLines: string[] = [];
	let currentAircraftType: AircraftType | undefined;

	if (isAircraftTxt) {
		/*
		 * ————————————————————————————————————————————————————————————
		 * 2a. Aircraft.txt: separate file contents into aircraftType groups
		 */
		for (const [index, line] of lines.entries()) {
			const acNum = getAircraftNumFromLine(line);
			if (!acNum) {
				if (currentAircraftType) {
					currentGroupLines.push(line);
				} else {
					headerLines.push(line);
				}
				continue;
			}

			const acType = parsedData.aircraftLiveries.get(acNum)?.aircraftType;
			if (!acType) {
				// TODO error message: acNum without acLivery / acType
				continue;
			}

			// New aircraftType
			if (acType !== currentAircraftType) {
				// If we already have a currentAircraftType, store to groups array
				if (currentAircraftType) {
					groups.push([currentAircraftType, currentGroupLines]);
					currentGroupLines = [];
				}

				currentAircraftType = acType;
			}

			currentGroupLines.push(line);

			// Last line: store to groups array
			if (index === lines.length - 1) {
				groups.push([currentAircraftType, currentGroupLines]);
			}
		}
	} else {
		/*
		 * ————————————————————————————————————————————————————————————
		 * 2b. Flightplans.txt: separate file contents into aircraftType groups
		 */

		const charRanges = groupThroughHeaderLines(editor.document, content);

		for (const [i, line] of lines.entries()) {
			const acNum = getAircraftNumFromLine(line);
			if (!acNum) {
				if (isHeaderLine(line)) {
					//TODO New group - must have next aircraftType
				} else if (currentAircraftType) {
					currentGroupLines.push(line);
				} else {
					headerLines.push(line);
				}
				continue;
			}

			const acType = parsedData.aircraftLiveries.get(acNum)?.aircraftType;
			if (!acType) {
				// TODO error message: acNum without acLivery / acType
				continue;
			}
		}
	}

	/*
	 * ————————————————————————————————————————————————————————————
	 * 3. Sort groups by wingspan
	 */
	const groupsSorted = [...groups].sort((a: TAcTypeGroup, b: TAcTypeGroup) =>
		Math.sign(b[0].wingspan! - a[0].wingspan!)
	);

	console.log({ headerLines, groups, groupsSorted });

	/*
	 * ————————————————————————————————————————————————————————————
	 * 4. Output
	 */
	const output = [...headerLines, groupsSorted.map((group) => group[1])].flat().join('\n');
	console.log({ output });
}

const getAircraftNumFromLine = (text: string, includeInactive = true) => {
	const regex = includeInactive ? /^(?:\/\/|AC)#(.*?),/i : /^AC#(.*?),/i;
	const match = text.match(regex);
	if (match?.[1]) {
		return Number(match[1]);
	}
};

const isHeaderLine = (text: string, acNum?: number) => {
	return !acNum && text.startsWith('//');
};

const groupThroughHeaderLines = (document: TextDocument, text: string) => {
	// https://regex101.com/r/q0FkZD/3
	const regex = /^(\/\/.*?)$[\s\/\w]*?(?!^\/\/)(?:^AC#)/gim;
	const matches = [...text.matchAll(regex)];

	const charRanges = matches.map((match, i) => {
		const next = matches[i + 1];

		return {
			start: match.index,
			end: next?.index || text.length + 1,
			headerLine: match[1],
		};
	});

	console.log({ matches, charRanges });

	return charRanges;
};
