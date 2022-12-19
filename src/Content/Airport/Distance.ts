import * as vscode from 'vscode';
import { Coordinates } from './Coordinates';

const { sin, cos, atan2, sqrt } = Math;

/** Factors from _kilometers_, _miles_ and _nautical miles_ to _meters_ */
enum EDistanceUnitFactors {
	/** Kilometers */
	km = 0.001,
	/** Miles */
	mi = 0.00062137141841645,
	/** Nautical miles */
	nm = 0.000539957,
}
type TDistanceUnit = keyof typeof EDistanceUnitFactors;

export class Distance {
	/** Earth's radius in meters */
	private static EARTH_RADIUS = 6_371_000;

	/** Factor to convert a value from degrees to radians. Equals `π / 180`. */
	private static DEG_TO_RAD = 0.017453292519943295;

	/** Distance in meters */
	value: number;

	constructor(from: Coordinates, to: Coordinates) {
		this.value = this.calculate(from, to);
	}

	/**
	 * Calculate the distance between two coordinates
	 * @param {Coordinates} from - Start coordinates instance
	 * @param {Coordinates} to - Target coordinates instances
	 * @returns The distance between the two coordinates in meters.
	 * @source https://www.movable-type.co.uk/scripts/latlong.html
	 */
	calculate(from: Coordinates, to: Coordinates) {
		if (from === to) {
			return 0;
		}

		// Convert the latitudes from degrees to radians.
		const φ1 = from.lat.factoredValue * Distance.DEG_TO_RAD;
		const φ2 = to.lat.factoredValue * Distance.DEG_TO_RAD;

		// Converting the difference in latitude to radians.
		const Δφ = (to.lat.factoredValue - from.lat.factoredValue) * Distance.DEG_TO_RAD;
		const Δλ = (to.lon.factoredValue - from.lon.factoredValue) * Distance.DEG_TO_RAD;

		// Haversine formula for calculating the distance between two points on a sphere.
		const a = sin(Δφ / 2) * sin(Δφ / 2) + cos(φ1) * cos(φ2) * sin(Δλ / 2) * sin(Δλ / 2);
		const c = 2 * atan2(sqrt(a), sqrt(1 - a));

		/** Distance in meters */
		return Distance.EARTH_RADIUS * c;
	}

	/** Distance formatted to either kilometers, miles or nautical miles
	 * (depending on extension setting), with grouping and unit */
	get formatted() {
		const distanceUnit = vscode.workspace
			.getConfiguration('fs-ai-tools.airlineView', undefined)
			.get('distanceUnit') as TDistanceUnit;
		const distanceFactor = EDistanceUnitFactors[distanceUnit];

		return `${(this.value * distanceFactor).toLocaleString(undefined, {
			maximumFractionDigits: 0,
		})} ${distanceUnit}`;
	}
}
