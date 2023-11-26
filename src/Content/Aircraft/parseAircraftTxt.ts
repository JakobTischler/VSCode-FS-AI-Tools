import * as vscode from 'vscode';
import { merge } from 'lodash';
import { getFileContents, showError } from '../../Tools/helpers';
import { AircraftData } from '../../Types/AircraftData';
import _aircraftData from '../../Data/aircraft-data.json';
const aircraftData = _aircraftData as AircraftData;
import { TFlightplanFilesMetaData } from '../../Types/FlightplanFilesMetaData';
import { AircraftLivery, TAircraftLiveriesByAcNum } from './AircraftLivery';
import { AircraftType, TAircraftTypesByTypeCode } from './AircraftType';

export type TParsedAircraftTxtData = {
	aircraftLiveries: TAircraftLiveriesByAcNum;
	inactiveAircraftLiveries: Set<AircraftLivery>;
	aircraftTypes: TAircraftTypesByTypeCode;
	totalAircraftCount: number;
	nonMatches: string[];
};

/**
 * Collects each AC# entry in an aircraft.txt file, and matches it to an
 * aircraft type. Additionally, counts the number of aircraft using this AC# in
 * the corresponding flightplans.txt file.
 * @param data - The flightplans meta data, which must include the files'
 * contents in their respective `text` variables.
 * @param doAircraftCount - If `true`, performs a quick count of each
 * `AircraftLivery`'s AC# and saves it to its `manualCount` value. Defaults to
 * `false`
 * @param includeInactive - If `true`, aircraft whose line is disabled
 * ("//#1234") are also included, otherwise they're skipped. Defaults to `false`
 * @param includeInvalidAcNums - If `true`, aircraft whose AC# is not a pure
 * number (e.g. includes letters) are also included, otherwise they're skipped.
 * Defaults to `false`
 * @returns
 * • `aircraftTypes` = Map of type `TAircraftTypes` by ICAO type name. Each
 * entry has a set of `AircraftLivery` entries, as well as total count of
 * aircraft of this type.
 *
 * • `totalAircraftCount` = the total number of matched aircraft (not aircraft
 * types)
 *
 * • `nonMatches` = array of aircraft titles that couldn't be matched
 *
 * • `aircraftLiveries` = Map of type `TAircraftLiveriesByAcNum` by AC#. Each
 * entry
 *
 */
export async function parseAircraftTxt(
	data: TFlightplanFilesMetaData,
	doAircraftCount = false,
	includeInactive = false,
	includeInvalidAcNums = false
): Promise<TParsedAircraftTxtData | undefined> {
	if (!data.aircraft.text) {
		showError(`parseAircraftTxt(): aircraft.txt contents must included in data argument.`);
		throw new Error(`parseAircraftTxt(): aircraft.txt contents must included in data argument.`);
	}
	if (doAircraftCount && !data.flightplans.text) {
		showError(
			`parseAircraftTxt(): flightplans.txt contents must included in data argument if "doAircraftCount" is set to true.`
		);
		throw new Error(
			`parseAircraftTxt(): flightplans.txt contents must included in data argument if "doAircraftCount" is set to true.`
		);
	}

	// 1. Get aircraft list from aircraft.txt file
	const { active: liveries, inactive: inactiveLiveries } = getAircraftLiveries(
		data.aircraft.text,
		includeInactive,
		includeInvalidAcNums
	);
	if (liveries.size === 0) {
		showError(`No active aircraft found in "${data.aircraft.fileName}"`);
		return;
	}
	const allLiveries = [...liveries.values(), ...inactiveLiveries];

	// 2. Count aircraft in flightplans.txt file
	if (doAircraftCount && data.flightplans.text) {
		countAircraftSimple(liveries, data.flightplans.text);
	}

	// 3. Get aircraft type data (base and user data .json merged together)
	const aircraftTypeMetaData = await getAircraftTypeMetaData();

	// 4. Match titles to types
	const matchedData = matchAircraftLiveriesToAircraftType(aircraftTypeMetaData, allLiveries);

	return {
		...matchedData,
		aircraftLiveries: liveries,
		inactiveAircraftLiveries: inactiveLiveries,
	};
}

/**
 * Collects the aircraft entries in an aircraft.txt file and returns an
 * AC#→AircraftLivery map with that data.
 * @param text Aircraft.txt file contents
 * @returns A `TAircraftLiveriesByAcNum` map by AC#
 */
export function getAircraftLiveries(text: string, allowInactive = false, allowInvalidNumber = false) {
	const ret = {
		active: new Map() as TAircraftLiveriesByAcNum,
		inactive: new Set<AircraftLivery>(),
	};

	let regexStr = allowInactive ? `^(?<active>AC|//)#` : `^(?<active>AC)#`;
	regexStr += allowInvalidNumber ? '(?<acNum>.+)' : '(?<acNum>\\d+)';
	regexStr += `,\\d+,"(?<title>.*)"`;
	const regex = new RegExp(regexStr, 'gm');

	const matches = text.matchAll(regex);
	if (matches) {
		for (const match of [...matches]) {
			const { active, acNum, title } = match.groups!;
			const number = Number(acNum);
			const n = Number.isInteger(number) ? number : acNum;

			if (active === 'AC') {
				ret.active.set(n, new AircraftLivery(n, title));
			} else {
				ret.inactive.add(new AircraftLivery(n, title));
			}
		}
	}

	return ret;
}

/**
 * For each `AircraftLivery` entry, counts the number of occurring AC#s in a
 * flightplans.txt file and updates the `manualCount` value in the livery entry.
 * @param data The `TAircraftLiveriesByAcNum` map
 * @param flightplanText Flightplans.txt contents
 */
export function countAircraftSimple(data: TAircraftLiveriesByAcNum, flightplanText: string) {
	for (const [acNum, livery] of data.entries()) {
		const matches = flightplanText.match(new RegExp(`^AC#${acNum},`, 'gm'));

		if (matches) {
			livery.manualCount = matches.length;
			data.set(acNum, livery);
		}
	}
}

/**
 * Merges the user aicraft naming .json file with the base data
 * @returns a JSON object with the aircraft names and types.
 */
export async function getAircraftTypeMetaData() {
	const customDataPath = vscode.workspace
		.getConfiguration('fs-ai-tools', undefined)
		.get('aircraftDataFilePath') as string;

	if (customDataPath?.length) {
		// Get custom file contents
		const customDataContents = await getFileContents(customDataPath);

		if (customDataContents) {
			const customData = JSON.parse(customDataContents);

			// Merge
			if (customData.list || customData.types) {
				return merge(aircraftData, customData) as AircraftData;
			}

			showError(`Custom aircraft data couldn't be merged, as it has neither "list" nor "types"`);
		} else {
			showError(`Custom aircraft data couldn't be read. Please check file path.`);
		}
	}

	return aircraftData;
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
 * @param aircraftLiveries The `TAircraftLiveriesByAcNum` that includes all aircraft
 * liveries
 * @returns
 * • `aircraftTypes` = Map of type `TAircraftTypes` by ICAO type name. Each
 * aircraftType has a set of `AircraftLivery` entries, as well as total count
 * of aircraft of this type.
 *
 * • `totalAircraftCount` = the total number of matched aircraft (not
 * aircraft types)
 *
 * • `nonMatches` = array of aircraft titles that couldn't
 * be matched
 */
export function matchAircraftLiveriesToAircraftType(
	data: typeof aircraftData,
	aircraftLiveries: AircraftLivery[]
): { aircraftTypes: TAircraftTypesByTypeCode; totalAircraftCount: number; nonMatches: string[] } {
	const matches = new Map();
	const aircraftTypes: TAircraftTypesByTypeCode = new Map();
	let totalAircraftCount = 0;
	const nonMatches: string[] = [];

	const addOrUpdateAircraftData = (
		typeCode: string,
		aircraftLivery: AircraftLivery,
		manufacturerName?: string,
		typeName?: string,
		seriesName?: string,
		wingspan?: number
	) => {
		if (aircraftTypes.has(typeCode)) {
			// Already exists → add to that
			const aircraftType = aircraftTypes.get(typeCode);

			// Add livery to aircraftType
			aircraftType!.addLivery(aircraftLivery);
		} else {
			// Doesn't exist yet → create new AircraftType instance
			const aircraftType = new AircraftType(typeCode);
			if (manufacturerName) {
				aircraftType.manufacturer = manufacturerName;
			}
			if (typeName) {
				aircraftType.typeName = typeName;
			}
			if (seriesName) {
				aircraftType.series = seriesName;
			}
			if (wingspan) {
				aircraftType.wingspan = wingspan;
			}

			// Add livery to aircraftType
			aircraftType.addLivery(aircraftLivery);

			aircraftTypes.set(typeCode, aircraftType);
		}

		// Update livery count
		totalAircraftCount += aircraftLivery.count;
	};

	titlesLoop: for (const livery of aircraftLiveries) {
		const title = livery.title.toLowerCase();

		// First check previous successful search terms to find a quick match
		for (const [searchTerm, typeName] of matches.entries()) {
			if (title.includes(searchTerm)) {
				addOrUpdateAircraftData(typeName, livery);
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
								// Add data to aircraftTypes: create new or update existing
								addOrUpdateAircraftData(
									type,
									livery,
									manufacturer,
									typeData.name || type,
									typeData.series,
									typeData.wingspan
								);

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
		nonMatches.push(livery.title);
	}

	return { aircraftTypes, totalAircraftCount, nonMatches };
}

function searchTermIsRegex(term: string): boolean {
	return term.startsWith('/') && term.endsWith('/');
}
