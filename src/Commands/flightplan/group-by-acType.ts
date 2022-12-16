import * as vscode from 'vscode';
import * as path from 'path';

import { getFilename, getFlightplanFiles, showError } from '../../Tools/helpers';
import { parseAircraftTxt, TParsedAircraftTxtData } from '../../Content/Aircraft/parseAircraftTxt';
import { AircraftType } from '../../Content/Aircraft/AircraftType';

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

	const aircraftData: TParsedAircraftTxtData | undefined = await parseAircraftTxt(fileData, true);
	if (!aircraftData) return;

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 */

	const filename = getFilename(editor).toLowerCase();
	let groupedText: string;
	if (filename.startsWith('aircraft')) {
		groupedText = groupAircraftTxt(editor.document.getText(), aircraftData);
	} else {
	}
}

function groupAircraftTxt(fileContents: string, aircraftData: TParsedAircraftTxtData) {
	const sortedAcTypes = [...aircraftData.aircraftTypes.values()].sort((a: AircraftType, b: AircraftType) => {
		return a.wingspan - b.wingspan;
	});

	// TODO

	return fileContents;
}
