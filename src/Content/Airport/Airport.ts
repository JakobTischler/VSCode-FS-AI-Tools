import * as vscode from 'vscode';
import * as fs from 'fs';
import { degreesToRadians, getFileContents, showError } from '../../Tools/helpers';
import { LocalStorageService } from '../../Tools/LocalStorageService';

type TDistanceUnitFactor = {
	km: number;
	mi: number;
	nm: number;
};
const distanceUnitFactor: TDistanceUnitFactor = {
	km: 0.001,
	mi: 0.00062137141841645,
	nm: 0.000539957,
};
// TODO add to config
const distanceUnit: keyof TDistanceUnitFactor = 'km';

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
	calculateDistance(targetAirport: Airport) {
		if (targetAirport === this) {
			return { value: 0, formatted: `0 ${String(distanceUnit)}` };
		}

		const value = distance(this, targetAirport);
		const formatted =
			(value * distanceUnitFactor[distanceUnit]).toLocaleString(undefined, {
				maximumFractionDigits: 0,
			}) + ` ${String(distanceUnit)}`;

		return {
			/** Distance in meters */
			value,
			/** Distance formatted to either kilometers, miles or nautical miles
			 * (depending on extension setting), with grouping and unit */
			formatted,
		};
	}

	/** The airport data in an `airports.txt` line format
	 * ("`ICAO,latitude,longitude,altitude`"). */
	get line() {
		// return `${this.icao},${this.coordinates.lat.str},${this.coordinates.lon.str},${this.altitude}`;
		return [this.icao, this.coordinates.lat.str, this.coordinates.lon.str, this.altitude].join(',');
	}
}

class CoordinateComponent {
	degrees: number;
	/** Coordinate minutes. Includes seconds as fraction. */
	minutes: number;
	/** Either -1 or 1, based on the factor name ("N", "E": 1 / "S", "W": -1). */
	factor: number;
	/**
	 * Latitude: "N" or "S" / Longitude: "E" or "W" — the former indicates a
	 * positive value, the latter a negative value.
	 */
	factorName: string;

	constructor(str: string, airportLine: string) {
		const m = str.match(/([NESW])(\d+)\*\s*(\d+(?:\.\d+)?)'?/i);
		if (!m) {
			const msg = `Coordinates string "${str}" in line "${airportLine}" couldn't be parsed. Check its formatting.`;
			showError(msg);
			throw new Error(msg);
		}

		this.factorName = m[1];
		this.factor = m[1] === 'N' || m[1] === 'E' ? 1 : -1;
		this.degrees = Number(m[2]);
		this.minutes = Number(m[3]);
	}

	/** The full, absolute number value (`degrees + minutes/60`) */
	get value() {
		return this.degrees + this.minutes / 60;
	}

	/** The full number value (`degrees + minutes/60`). Negative if "W" or "S". */
	get factoredValue() {
		return this.value * this.factor;
	}

	/** The airports.txt format representation of the coordinate (e.g. `N64* 11.4400'`) */
	get str() {
		const deg = this.degrees.toLocaleString(undefined, {
			minimumIntegerDigits: 2,
			useGrouping: false,
		});

		const min = this.minutes.toLocaleString(undefined, {
			minimumFractionDigits: 4,
			minimumIntegerDigits: 2,
			useGrouping: false,
		});
		return `${this.factorName}${deg}* ${min}'`;
	}
}

/**
 * Calculate the distance between two airports
 * @param {Airport} from - Departure airport
 * @param {Airport} to - Destination airport.
 * @returns The distance between the two airports in meters.
 * @source https://www.movable-type.co.uk/scripts/latlong.html
 */
function distance(from: Airport, to: Airport) {
	const { sin, cos, atan2, sqrt } = Math;

	// Convert the latitudes from degrees to radians.
	const φ1 = degreesToRadians(from.coordinates.lat.factoredValue); // φ, λ in radians
	const φ2 = degreesToRadians(to.coordinates.lat.factoredValue);

	// Converting the difference in latitude to radians.
	const Δφ = degreesToRadians(to.coordinates.lat.factoredValue - from.coordinates.lat.factoredValue);
	const Δλ = degreesToRadians(to.coordinates.lon.factoredValue - from.coordinates.lon.factoredValue);

	// Haversine formula for calculating the distance between two points on a sphere.
	const a = sin(Δφ / 2) * sin(Δφ / 2) + cos(φ1) * cos(φ2) * sin(Δλ / 2) * sin(Δλ / 2);
	const c = 2 * atan2(sqrt(a), sqrt(1 - a));

	/** Earth radius in meters */
	const R = 6371e3;

	/** Distance in meters */
	const distance = R * c;

	return distance;
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
 * @param filePath Path to the master airports .txt file
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

		const airports: TAirportCodeToLine = new Map(
			fileContents
				.split('\n')
				.filter((line) => line.length)
				.map((line) => {
					const icao = line.trim().split(',')[0];

					return [icao, line];
				})
		);

		// Save to storage
		storageManager.setValue<Number>('airportMasterModifiedTime', modifiedTime);
		storageManager.setValue<TAirportCodeToLine>('airportMasterData', airports);

		return airports;
	}

	showError(`Master airports file couldn't be parsed.`);
	return null;
}
