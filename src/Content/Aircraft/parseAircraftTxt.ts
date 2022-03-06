import * as vscode from 'vscode';
import { merge } from 'lodash';
import { getFileContents, showError } from '../../Tools/helpers';
import * as aircraftNaming from '../../data/aircraft-naming.json';

export interface IAircraftData {
	name?: string;
	count: number;
	aircraft: Set<string>;
}

/**
 * ```
 * Map<acType, {
 *     aircraft: Set<string>,    ← Set of aircraft titles for each aircraft type
 *     count: number,            ← Number of aircraft of this acType
 *     name?: string             ← Formatted name of the aircraft type
 * }>
 * ```
 */
export type TAircraftList = Map<string, IAircraftData>;

export interface IAircraftDataRaw {
	title: string;
	count: number;
	acNum: number;
	icao?: string;
}

/**
 * ```
 * Map<acNum, {
 *     acNum: number,    ← Aircraft number
 *     count: number,    ← Number of this variant in flightplan
 *     title: string,    ← Variant title
 *     icao?: string     ← Matched aircraft type ICAO (initally undefined)
 * }>
 * ```
 */
export type TAircraftListRaw = Map<number, IAircraftDataRaw>;

export async function parseAircraftTxt(data: {
	aircraft: {
		fileName: string;
		filePath?: string;
		text?: string;
	};
	flightplans: {
		fileName: string;
		filePath?: string;
		text?: string;
	};
}) {
	// return aircraft: { all: Aircraft[]; acNumToType: Map<number, Aircraft> };

	// Aircraft.txt contents
	let acContents: string | undefined | null = data.aircraft.text;
	if (data.aircraft.filePath) {
		acContents = await getFileContents(data.aircraft.filePath);
	}
	if (!acContents) {
		showError(`Contents of "${data.aircraft.fileName}" couldn't be read.`);
		return;
	}

	// Flightplans.txt contents
	let fpContents: string | undefined | null = data.flightplans.text;
	if (data.flightplans.filePath) {
		fpContents = await getFileContents(data.flightplans.filePath);
	}
	if (!fpContents) {
		showError(`Contents of "${data.flightplans.fileName}" couldn't be read.`);
		return;
	}

	// ----------------------------------------------------------------------------------------

	// 1. Get aircraft list from aircraft.txt file
	const aircraftListRaw = await getAircraftListRaw(acContents);
	if (aircraftListRaw.size === 0) {
		showError(`"${data.aircraft.fileName}" couldn't be read`);
		return;
	}
	console.log({ aircraftListRaw });

	// 2. Count aircraft in flightplans.txt file
	const countSuccess = await countAircraft(aircraftListRaw, fpContents);
	if (!countSuccess) {
		showError(`Flightplans….txt file couldn't be read.`);
		return;
	}

	// 3. Get user data .json and merge with aircraftNaming
	let acData = aircraftNaming;
	const config = vscode.workspace.getConfiguration('fs-ai-tools.showAircraftList', undefined);
	const customDataPath = config.get('customDataFilePath') as string;
	if (customDataPath?.length) {
		// 3.1: Get custom file contents
		const customDataContents = await getFileContents(customDataPath);
		if (customDataContents) {
			const customData = JSON.parse(customDataContents);

			// 3.2: Merge
			if (customData.list || customData.types) {
				/* data = mergeWith(aircraftNaming, customData, (origValue, newValue) => {
						if (isArray(origValue)) {
							return origValue.concat(newValue);
						}
					}); */
				acData = merge(aircraftNaming, customData);
			} else {
				showError(`Custom aircraft data couldn't be merged, as it has neither "list" nor "types"`);
			}
		} else {
			showError(`Custom aircraft data couldn't be read. Please check file path.`);
		}
	}

	// 4. Match titles to types
	const { aircraftList, totalCount, nonMatches } = matchTitleToType(acData, aircraftListRaw);

	return { aircraftList, totalCount, nonMatches };
}

/**
 * Collects the aircraft entries in an aircraft.txt file and returns an `aircraftListRaw` map with that data.
 * @param filePath Path to aircraft.txt file
 * @returns Map of type `TAircraftListRaw` with collected aircraft data
 */
export async function getAircraftListRaw(text: string) {
	const ret: TAircraftListRaw = new Map();

	if (text) {
		for (const line of text.split('\n').map((line) => line.trim())) {
			if (line?.length && line.startsWith('AC#')) {
				const items = line.split(',');
				const data: IAircraftDataRaw = {
					acNum: Number(items[0].replace(/[^0-9]/g, '')),
					title: items[2].replace(/"/g, ''),
					count: 0,
				};
				ret.set(data.acNum, data);
			}
		}
	}

	return ret;
}

/**
 * Counts the different AC#s in a flightplans.txt file and updates the counts in the provided `TAircraftListRaw`
 * @param list The `TAircraftListRaw` received from `getAircraftListRaw()`
 * @param flightplanText Flightplans.txt contents
 * @returns `true` if flightplans.txt file could be read an the aircraft were counted, otherwise `false`
 */
export async function countAircraft(list: TAircraftListRaw, flightplanText: string) {
	for (const [index, line] of flightplanText
		.split('\n')
		.map((line) => line.trim())
		.entries()) {
		if (line?.length && line.startsWith('AC#')) {
			const items = line.split(',');
			const acNum = Number(items[0].replace(/[^0-9]/g, ''));

			if (!list.has(acNum)) {
				showError(`Flightplans line ${index + 1}: AC# ${acNum} doesn't exist in Aircraft.txt file`);
				continue;
			}

			const data = list.get(acNum);
			if (data) {
				data.count++;
				list.set(acNum, data);
			}
		}
	}

	return true;
}

/**
 * Goes through `aircraftNaming` to match each title to an ICAO type name.
 *
 * Uses two methods to keep the iterations to a minimum:
 * 1. Keep a list of successful matches as well as their respective result,
 * and go through them for each aircraft title first to check for a possible
 * match
 * 2. Check for manufacturer match before deep-iterating through the
 * manufacturer's aircraft types
 * @param inputList The `TAircraftListRaw` that includes all aircraft titles as well as counts
 * @returns
 * • `aircraftList` = Map of type `TAircraftList` Map where the ICAO type name is the
 * key, and the count as well as the matching aircraft titles are the value
 * object.
 *
 * • `totalNumber` = the total number of matched aircraft (not
 * aircraft types)
 *
 * • `nonMatches` = array of aircraft titles that couldn't
 * be matched
 */
export function matchTitleToType(data: typeof aircraftNaming, inputList: TAircraftListRaw) {
	const aircraftList: TAircraftList = new Map();
	const matches = new Map();

	let totalCount = 0;
	const nonMatches: string[] = [];

	const addOrUpdateAircraftData = (
		type: string,
		inputData: IAircraftDataRaw,
		manufacturerName?: string,
		typeName?: string
	) => {
		if (aircraftList.has(type)) {
			const data = aircraftList.get(type);
			if (data) {
				data.count += inputData.count;
				data.aircraft.add(inputData.title);
				aircraftList.set(type, data);
				totalCount += inputData.count;
			}
		} else {
			aircraftList.set(type, {
				count: inputData.count,
				aircraft: new Set([inputData.title]),
				name: `${manufacturerName} ${typeName}`,
			});
			totalCount += inputData.count;
		}
	};

	titlesLoop: for (const [inputKey, inputData] of inputList.entries()) {
		const title = inputData.title.toLowerCase();

		// First check previous successful search terms to find a quick match
		for (const [searchTerm, typeName] of matches.entries()) {
			if (title.includes(searchTerm)) {
				addOrUpdateAircraftData(typeName, inputData);
				continue titlesLoop;
			}
		}

		// Then, if nothing found, go through possible search terms
		for (const [manufacturer, manufacturerData] of Object.entries(data.types)) {
			for (const manufacturerName of manufacturerData.search) {
				if (title.includes(manufacturerName.toLowerCase())) {
					for (const [type, typeData] of Object.entries(manufacturerData.types)) {
						for (const searchTerm of typeData.search.map((searchTerm) => searchTerm.toLowerCase())) {
							let add = false;
							let matchTerm = searchTerm;

							// Regex
							if (searchTermIsRegex(searchTerm)) {
								const regex = new RegExp(searchTerm.slice(1, -1), 'i');
								const match = title.match(regex);

								if (match) {
									add = true;
									matchTerm = match[0];
								}

								// Regular search
							} else {
								add = title.includes(searchTerm);
							}

							if (add) {
								// Add type to aircraftListRaw
								inputData.icao = type;
								inputList.set(inputKey, inputData);

								// Add data to aircraftList: create new or update existing
								addOrUpdateAircraftData(type, inputData, manufacturer, typeData.name || type);

								// Add to successful matches
								if (!matches.has(matchTerm)) {
									matches.set(matchTerm, type);
								}

								continue titlesLoop;
							}
						}
					}
				}
			}
		}

		// Aircraft title couldn't be matched
		nonMatches.push(inputData.title);
	}

	return { aircraftList, totalCount, nonMatches };
}

function searchTermIsRegex(term: string): boolean {
	return term.startsWith('/') && term.endsWith('/');
}
