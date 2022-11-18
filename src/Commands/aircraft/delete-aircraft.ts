/*
 * [x] 1. Extract title from selection (AC#123,456,"AIRCRAFT TITLE")
 * [x] 2. Find aircraft.cfg that contains title
 * [ ] 3  Open file?
 * [ ] 4. Get full fltsim section
 * [ ] 5. Get texture path and remove folder
 * [ ] 6. Remove fltsim section
 * [ ] 7. Save file
 * [ ] 8. Success/fail feedback
 */

type FltsimEntry = {
	/** The absolute file path of the `aircraft.cfg` containing this entry */
	cfgPath: string;
	/** The complete fltsim entry, starting with `[fltsim.x]` up until the next entry */
	content: string;
	/** The entry's fltsim.X number */
	num: string;
	/** The aicraft title */
	title: string;
};

import * as fs from 'fs';
import glob = require('tiny-glob');
import * as path from 'path';
import { Selection, TextDocument, window, workspace } from 'vscode';
import { showError } from '../../Tools/helpers';
import saveFile from '../../Utils/save-file';

export async function DeleteAircraft() {
	console.log('DeleteAircraft()');

	const editor = window.activeTextEditor;
	const document = editor?.document;
	if (!editor || !document || !['file', 'untitled'].includes(document.uri.scheme)) {
		return false;
	}

	const selections = editor.selections;
	if (!selections) {
		showError(`No text selected`);
		return false;
	}

	/*
	 * 1. Get aircraft titles from selection
	 */
	const titlesToDelete = getAircraftTitles(document, selections);

	// ----- ----- ----- ----- -----

	/*
	 * 2. Find aircraft.cfg that contains title
	 */
	const aircraftCfgFilePaths = await getAircraftCfgFilePaths();
	/* // TODO TEMPORARY for faster testing
	const aircraftCfgFilePaths = [
		'K:\\Prepar3D\\_AI Aircraft\\AIA\\AIA B732\\aircraft.cfg',
		'K:\\Prepar3D\\_AI Aircraft\\FAIB\\FAIB Boeing 737-800WL\\aircraft.cfg',
	]; */
	if (!aircraftCfgFilePaths) return false;

	const { fltsimEntriesByAircraftCfg, fltsimEntriesByTitle } = readAircraftCfgs(aircraftCfgFilePaths, titlesToDelete);

	// ----- ----- ----- ----- -----

	/*
	 * 3. Delete entry and folder
	 */
	const success = deleteAndSave(titlesToDelete, fltsimEntriesByTitle);
}

/**
 * Extracts aircraft titles from one or multiple text selections. The full line has to be selected.
 * @param document The current TextDocument
 * @param selections The selections array
 * @returns A string[] with each found title.
 */
function getAircraftTitles(document: TextDocument, selections: readonly Selection[]) {
	console.log(`Extracting aircraft titles from selections`);

	const ret: string[] = [];

	// TODO right now the whole line, including "AC#123,456," has to be selected. Should also accept directly selected titles?

	const regexp = /(?:AC|\/\/)#\d+,\d+,\"(.*?)\"/gim;

	for (const selection of [...selections]) {
		const text = document.getText(selection);
		const matches = [...text.matchAll(regexp)];

		if (matches?.length) {
			ret.push(...matches.map((match) => match[1]));
		}
	}

	console.log(`Found titles:`, ret);

	return new Set(ret.flat());
}

/**
 * Retrieves all aircraft.cfg file from the configured aircraft folder
 * and its subdirectories.
 * @returns {string[]} An array containing the file paths of all found
 * aircraft.cfg files.
 */
async function getAircraftCfgFilePaths() {
	// Get aircraft folder from config
	const config = workspace.getConfiguration('fs-ai-tools.deleteAircraft', undefined);
	const dir: string | undefined = config.get('aircraftDirectory');
	if (!dir?.length) {
		showError(`Aircraft directory has not been defined in settings.`);
		return;
	}
	if (!fs.existsSync(dir)) {
		console.error(`Directory "${dir}" doesn't seem to exist.`);
		return;
	}

	console.log(`Searching for aircraft.cfg files in "${dir}"`);
	window.showInformationMessage('Searching for aircraft.cfg files');

	// Search for all "aircraft.cfg" files
	const globPath = path.join(dir, '**/[Aa][Ii][Rr][Cc][Rr][Aa][Ff][Tt].cfg').replace(/\\+/g, '/');

	const files = await glob(globPath, { absolute: true, filesOnly: true });

	if (!files?.length) {
		showError(`No aircraft.cfg files found in "${dir}"`);
		return;
	}

	window.showInformationMessage(`${'aircraft.cfg file'.plural(files.length)} found`);

	return files.filter((filePath: string) => path.basename(filePath).toLowerCase() === 'aircraft.cfg');
}

/**
 * Reads all found aircraft.cfg files to extract all fltsim entries. Stores them
 * in two maps: one by cfg file path, the other by aircraft title.
 * @param {string[]} filePaths Array containing the file paths of all
 * aircraft.cfg files
 * @returns {object<fltsimEntriesByAircraftCfg: Map<string, Set<FltsimEntry>>, fltsimEntriesByTitle: Map<string, FltsimEntry>>} Two maps (one by aircraft title, one by
 * cfg file path) containing a `FltsimEntry` object / a Set of `FltsimEntry`
 * objects, which in itself contains
 * * `cfgPath` {string} The absolute file path of the `aircraft.cfg` containing
 *   this entry
 * * `content` {string} The complete fltsim entry, starting with `[fltsim.x]` up
 *   until the next entry
 * * `num` {number} The entry's fltsim.X number
 * * `title` {string} The aicraft title as key, and an array containing the
 *   corresponding aircraft.cfg file(s) as value.
 */
function readAircraftCfgs(
	filePaths: string[],
	toDeleteTitles: Set<string>
): {
	fltsimEntriesByAircraftCfg: Map<string, Set<FltsimEntry>>;
	fltsimEntriesByTitle: Map<string, FltsimEntry>;
} {
	// TODO
	/*
	1. Store file hash or date etc. in map (see MasterAirports data)
	2. If file hash has changed, read and update fltsimEntriesByAircraftCfg map
	3. When changing file content, re-read hash and update hash in map
	*/

	const fltsimEntriesByAircraftCfg: Map<string, Set<FltsimEntry>> = new Map();
	const fltsimEntriesByTitle: Map<string, FltsimEntry> = new Map();

	const toDeleteTitlesTemp = new Set([...toDeleteTitles]);

	// v1: https://regex101.com/r/FSW3Vx/7 -- doesn't capture anything after
	// line breaks (this is due to "|\s$" to fix getting the last fltsim.x
	// section at end of file → compromise) v2: https://regex101.com/r/NX44lx/2
	// TODO title might not directly follow initial [fltsim.x] line
	const regexp = /\[fltsim\.(\d+)\]\s*title\s*=\s*(.+?)(?:[\n\r]+\w+\s*=\s*.+)+/gim;

	for (const filePath of filePaths) {
		let stop = false;

		try {
			const fileContents = fs.readFileSync(filePath, 'utf8');
			if (fileContents) {
				const matches = [...fileContents.matchAll(regexp)];

				const entrySet: Set<FltsimEntry> = new Set();

				matches.forEach((match) => {
					const [entry, num, title] = match;

					const data: FltsimEntry = {
						cfgPath: filePath,
						content: entry,
						num: num,
						title: title,
					};

					fltsimEntriesByTitle.set(title, data);
					entrySet.add(data);

					if (toDeleteTitlesTemp.has(title)) {
						toDeleteTitlesTemp.delete(title);
						if (toDeleteTitlesTemp.size === 0) {
							stop = true;
						}
					}
				});

				fltsimEntriesByAircraftCfg.set(filePath, entrySet);
			} else {
				console.error(`"${filePath}" couldn't be read.`);
				showError(`"${filePath}" couldn't be read.`);
			}
		} catch (error) {
			console.error(filePath, error);
		}

		if (stop) break;
	}

	return { fltsimEntriesByAircraftCfg, fltsimEntriesByTitle };
}

// TODO
/*
Setting: Confirm deletion dialog for
(a) each fltsim entry
(b) all entries in a single aircraft.cfg file
(c) none

Dialog buttons: "Skip all", "Skip file/entry", "Skip entry", "Delete"
 */

async function deleteAndSave(titles: Set<string>, fltsimEntriesByTitle: Map<string, FltsimEntry>) {
	// Switch mapping direction so multiple aircraft in one .cfg can be deleted
	// together
	const cfgToFltsimEntries = new Map<string, FltsimEntry[]>();

	for (const title of [...titles]) {
		const entryData = fltsimEntriesByTitle.get(title);
		if (!entryData) {
			console.error(`No data for "${title}"`);
			showError(`No data for "${title}`);
			continue;
		}
		if (!entryData.cfgPath) {
			console.error(`cfgPath not found for "${title}"`);
			continue;
		}

		//Append entryData to existing (or empty) array
		cfgToFltsimEntries.set(entryData.cfgPath, [...(cfgToFltsimEntries.get(entryData.cfgPath) || []), entryData]);
	}

	for (const [cfgPath, fltsimEntries] of cfgToFltsimEntries.entries()) {
		try {
			/*
			 * 1. Get path and read file
			 */
			let fileContents = fs.readFileSync(cfgPath, 'utf8');
			if (!fileContents) {
				console.error(`"${cfgPath}" couldn't be read.`);
				showError(`"${cfgPath}" couldn't be read.`);
				continue;
			}

			/*
			 * 2. Delete entry from file contents
			 */
			for (const dataEntry of fltsimEntries) {
				fileContents = fileContents.replace(dataEntry.content, '');
			}

			/*
			 * 3. Renumber [fltsim.x]
			 */
			let fltsimIndex = -1;
			fileContents = fileContents.replaceAll(/\[fltsim\..*?\]/gim, () => {
				fltsimIndex++;
				return `[fltsim.${fltsimIndex}]`;
			});

			/*
			 * 4. Save fileContents to filePath
			 */
			await saveFile(cfgPath, fileContents);

			/*
			 * 5. Extract texture path and delete
			 */
			for (const dataEntry of fltsimEntries) {
				const match = dataEntry.content.match(/texture\s*=\s*(.*)$/im);
				if (match) {
					let textureDir = path.resolve(cfgPath, '..', `texture`);
					const dirName = [...match][1];
					if (dirName.length) {
						textureDir = path.resolve(cfgPath, '..', `texture.${[...match][1]}`);
					}

					if (fs.existsSync(textureDir)) {
						await fs.promises.rm(textureDir, { recursive: true, force: true });
						console.log(`Directory "${textureDir}" removed`);
					}
				}
			}
		} catch (error) {
			console.error(cfgPath, error);
		}
	}
}
