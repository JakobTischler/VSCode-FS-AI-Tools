import * as fs from 'fs';
import * as vscode from 'vscode';
import { getFileContents, showError } from '../../Tools/helpers';
import { LocalStorageService } from '../../Tools/LocalStorageService';
import { CoordinateComponent } from './Coordinates';
import { Distance } from './Distance';

/**
 * Describes an airport with its ICAO code (`.icao`), its coordinates
 * (`.coordinates`) as well as its altitude (`.altitude`).
 *
 * Can calculate the great circle distance to another airport (`.distance()`).
 *
 * Can return the data in an `airports.txt` line format (`.line`).
 */
export class Airport {
	/** The airport's ICAO code */
	icao: string;
	/** The airport's coordinates (latitude and longitude components) */
	coordinates: {
		/** The airport's latitude component */
		lat: CoordinateComponent;
		/** The airport's longitude component */
		lon: CoordinateComponent;
	};
	/** The airport's altitude in feet */
	altitude: number;
	/** Number of occurences (flights to this airport) in the flightplan */
	count: number = 0;

	constructor(line: string, count?: number) {
		// BGGH,N64* 11.44',W51* 40.68',282
		// const m = str.match(/^(\w{3,4}),([NS])(\d+)\*\s*(\d+(?:\.\d+))'?,([EW])(\d+)\*\s*(\d+(?:\.\d+))'?,(\d+)$/i)
		const parts = line.split(',').map((item) => item.trim());
		if (parts.length !== 4) {
			const msg = `Airports.txt line "${line}" doesn't contain 4 elements.`;
			showError(msg);
			throw new Error(msg);
		}

		this.icao = parts[0];
		this.coordinates = {
			lat: new CoordinateComponent(parts[1], line),
			lon: new CoordinateComponent(parts[2], line),
		};
		this.altitude = Number(parts[3]);

		if (count) {
			this.count = count;
		}
	}

	/**
	 * Calculates the distance between this airport and a `targetAirport`.
	 *
	 * @returns Object with the raw distance (`value`) as well as a formatted
	 * distance string (`formatted`), converted to the set distance unit
	 * (kilometers, miles or nautical miles), with grouping and unit.
	 */
	distanceToAirport(targetAirport: Airport) {
		return new Distance(this.coordinates, targetAirport.coordinates);
	}

	/** The airport data in an `airports.txt` line format
	 * ("`ICAO,latitude,longitude,altitude`"). */
	get line() {
		// return `${this.icao},${this.coordinates.lat.str},${this.coordinates.lon.str},${this.altitude}`;
		return [this.icao, this.coordinates.lat.str, this.coordinates.lon.str, this.altitude].join(',');
	}

	getGcmData(id: string) {
		return `${id}=${this.coordinates.lat.gcmStr}${this.coordinates.lon.gcmStr};"${this.icao}"+@${id}`;
	}

	get coordsValues(): [number, number] {
		return [this.coordinates.lat.factoredValue, this.coordinates.lon.factoredValue];
	}
}

export type TAirportCodeCount = {
	icao: string;
	count: number;
};

export type TAirportCodeToLine = Map<string, string>;

/**
 * Parses the file defined in `filePath` to create a master airport data Map.
 * Saves it to local storage, and retrieves it if used another time. If the
 * master file has changed (checked via timestamp), it is parsed regardless.
 * @param storageManager The LocalStorageService manager to store and retrieve
 * the master airport data.
 * @returns A Map of the master airports (`Map<ICAO, Airports.txt line>`)
 */
export async function getMasterAirports(storageManager: LocalStorageService) {
	const filePath = vscode.workspace
		.getConfiguration('fs-ai-tools.generateAirports', undefined)
		.get('masterAirportsFilePath') as string;
	if (!filePath?.length) {
		showError('Master airports file path has not been set in settings.');
		return null;
	}
	if (!fs.existsSync(filePath)) {
		showError(`Master airports file at "${filePath}" couldn't be found`);
		return null;
	}

	// -------------------------------------------------------

	// Check for changes since last use
	const savedModifiedTime = storageManager.getValue('airportMasterModifiedTime');
	const modifiedTime = fs.statSync(filePath).mtimeMs;

	let loadFromStorage = savedModifiedTime && savedModifiedTime === modifiedTime;

	// Load storage data
	if (loadFromStorage) {
		const storedData = storageManager.getValue<TAirportCodeToLine>('airportMasterData');

		if (storedData?.size) {
			return storedData;
		}
		loadFromStorage = false;
	}

	// Read and parse file, save to storage
	if (!loadFromStorage) {
		const fileContents = await getFileContents(filePath);
		if (!fileContents) return null;

		const airports: TAirportCodeToLine = parseAirportsTxt(fileContents);

		// Save to storage
		storageManager.setValue<Number>('airportMasterModifiedTime', modifiedTime);
		storageManager.setValue<TAirportCodeToLine>('airportMasterData', airports);

		return airports;
	}

	showError(`Master airports file couldn't be parsed.`);
	return null;
}

export function parseAirportsTxt(fileContents: string): TAirportCodeToLine {
	return new Map(
		fileContents
			.split('\n')
			.filter((line) => line.length)
			.map((line) => {
				const icao = line.trim().split(',')[0];

				return [icao, line];
			})
	);
}
