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
	if (!aircraftCfgFilePaths) return false;

	const fltsimEntriesByTitle = readAircraftCfgs(aircraftCfgFilePaths, titlesToDelete);

	// ----- ----- ----- ----- -----

	/*
	 * 3. Delete entries and texture folders
	 */
	const result = await deleteAndSave(titlesToDelete, fltsimEntriesByTitle);

	// ----- ----- ----- ----- -----

	/*
	 * 4. Info
	 */
	let message = result.entries === 0 ? 'No' : `${result.entries} aircraft deleted`;
	if (result.files > 1) {
		message += ` from ${result.files} files`;
	}
	window.showInformationMessage(message);
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
	const regexp = /(?:AC|\/\/)#\w+,\d+,\"(.*?)\"/gim;

	for (const selection of [...selections]) {
		const text = document.getText(selection);
		const matches = [...text.matchAll(regexp)];

		if (matches?.length) {
			ret.push(...matches.map((match) => match[1]));
		}
	}

	console.log(`Found titles:`, ret);
	window.showInformationMessage(`${'title'.plural(ret.length)} found`);

	return new Set(ret);
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
	window.showInformationMessage('🔍 Searching for aircraft.cfg files');

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
function readAircraftCfgs(filePaths: string[], toDeleteTitles: Set<string>): Map<string, FltsimEntry> {
	/* {
	fltsimEntriesByAircraftCfg: Map<string, Set<FltsimEntry>>;
	fltsimEntriesByTitle: Map<string, FltsimEntry>;
} */ // TODO
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
	const regexp = /\[fltsim\.(\w+)\]\s*title\s*=\s*(.+?)(?:[\n\r]+\w+\s*=\s*.+)+/gim;

	// TODO get last fltsim entry https://regex101.com/r/L95Vr5/1
	// 		/[\s\S]*(?<lastEntry>\[fltsim\.(?<lastNum>\d+)\][\s\S]+?)(?=(\[|\s$))/m
	// TODO get full fltsim entry by number https://regex101.com/r/Wv4W8e/1
	// 		/[\s\S]*(?entry>\[fltsim\.14\][\s\S]+?)(?=(\[|\n$))/m
	// TODO get full fltsim entry by title https://regex101.com/r/mtajA1/2
	//		/[\s\S]*(?<entry>\[fltsim\.(?<num>\d+)\][\s\S]+?title\s*=\s*AIA Boeing 717-200 VOE-Volotea \(Volotissima\)(?:[\s\S]+?\n*)(?=(?:\[|\s$)))/m

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
						num,
						title,
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
				showError(`"${filePath}" couldn't be read.`, true);
			}
		} catch (error) {
			console.error(filePath, error);
		}

		if (stop) break;
	}

	// return { fltsimEntriesByAircraftCfg, fltsimEntriesByTitle };
	return fltsimEntriesByTitle;
}

enum EConfirmation {
	AIRCRAFT = 'Each aircraft',
	FILE = 'Each aircraft.cfg file',
	ALL = 'Once',
	NONE = 'None',
}

async function deleteAndSave(titles: Set<string>, fltsimEntriesByTitle: Map<string, FltsimEntry>) {
	const result = {
		entries: 0,
		files: 0,
	};

	const config = workspace.getConfiguration('fs-ai-tools.deleteAircraft', undefined);
	const confirmation = config?.get('confirmDeletion');

	let continueDeletion = true;

	/*
	 * CONFIRM ALL
	 */
	if (confirmation === EConfirmation.ALL) {
		const entryText = 'fltsim entry and its texture folder'.plural(titles.size, {
			pluralWord: 'fltsim entries and their texture folders',
		});
		const msg = `Are you sure you want to delete ${entryText}?`;
		const button = titles.size > 1 ? `Delete ${titles.size} aircraft` : `Delete aircraft`;

		await window.showWarningMessage(`Confirm deletion`, { modal: true, detail: msg }, button).then((buttonText) => {
			if (buttonText) {
				const msg =
					titles.size > 1
						? `✔️ Deletion confirmed for all ${titles.size} aircraft`
						: `✔️ Deletion confirmed for 1 aircraft`;
				console.log(msg);
				return;
			}

			continueDeletion = false;
			showError('❌ Deletion for all aircraft has been canceled.');
			return;
		});
	}
	if (!continueDeletion) return result;

	// -------------------------------------

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

	cfgFileLoop: for (const [cfgPath, fltsimEntries] of cfgToFltsimEntries.entries()) {
		let fileDirty = false;
		continueDeletion = true;

		// Get second to last part of path (containing directory name)
		const configPathDir = path.basename(path.dirname(cfgPath));
		const configPathShort = `${configPathDir}/aircraft.cfg`;

		/*
		 * CONFIRM DELETION OF ALL FROM FILE
		 */
		if (confirmation === EConfirmation.FILE) {
			const entryText = 'fltsim entry and its texture folder'.plural(fltsimEntries.length, {
				pluralWord: 'fltsim entries and their texture folders',
			});
			const msg = `Are you sure you want to delete ${entryText} from

"${configPathShort}"?`;
			const button = fltsimEntries.length > 1 ? `Delete ${fltsimEntries.length} aircraft` : `Delete aircraft`;

			await window
				.showWarningMessage(`Confirm deletion`, { modal: true, detail: msg }, button)
				.then((buttonText) => {
					if (!buttonText) {
						continueDeletion = false;
						showError(`❌ Deletion skipped: "${cfgPath}"`);
					}
				});
		}
		if (!continueDeletion) continue cfgFileLoop;

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
			const skipEntries = new Set<string>();
			removeEntriesFromCfgLoop: for (const dataEntry of fltsimEntries) {
				continueDeletion = true;

				/*
				 * CONFIRM DELETION OF EACH ENTRY
				 */
				if (confirmation === EConfirmation.AIRCRAFT) {
					const msg = `Are you sure you want to delete the following fltsim entry?

• Title: "${dataEntry.title}"
• Config: "${configPathShort}"`;
					const button = `Delete aircraft`;

					await window
						.showWarningMessage(`Confirm deletion`, { modal: true, detail: msg }, button)
						.then((buttonText) => {
							if (!buttonText) {
								continueDeletion = false;
								showError(`❌ Deletion skipped: "${dataEntry.title}" in "${cfgPath}"`);

								skipEntries.add(dataEntry.title);
							}
						});
				}
				if (continueDeletion) {
					console.log(`✔️ Deletion confirmed: "${dataEntry.title}" in "${cfgPath}"`);
				} else {
					continue removeEntriesFromCfgLoop;
				}

				fileContents = fileContents.replace(dataEntry.content, '');

				result.entries++;
				fileDirty = true;
			}

			if (!fileDirty) continue cfgFileLoop;

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
			await saveFile(cfgPath, fileContents, `💾 ${cfgPath} saved`);
			result.files++;

			/*
			 * 5. Extract texture path and delete
			 */
			removeTextureFoldersLoop: for (const dataEntry of fltsimEntries) {
				if (skipEntries.has(dataEntry.title)) continue;

				const match = dataEntry.content.match(/texture\s*=\s*(.*)$/im);
				if (match) {
					let textureDir = path.resolve(cfgPath, '..', `texture`);
					const dirName = [...match][1];
					if (dirName.length) {
						textureDir = path.resolve(cfgPath, '..', `texture.${[...match][1]}`);
					}

					if (fs.existsSync(textureDir)) {
						await fs.promises.rm(textureDir, { recursive: true, force: true });
						console.log(`🗑 Directory "${textureDir}" removed`);
					}
				}
			}
		} catch (error) {
			console.error(cfgPath, error);
		}
	}

	console.log(`-----------------------------
### Deletion process complete`);

	return result;
}
