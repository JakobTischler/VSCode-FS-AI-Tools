import { showError } from '../../Tools/helpers';

export type Coordinates = Record<'lat' | 'lon', CoordinateComponent>;

export class CoordinateComponent {
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

	/** The airports.txt format representation of the coordinate (e.g. `N64* 11.44'`) */
	get str() {
		const deg = this.degrees.toLocaleString(undefined, {
			minimumIntegerDigits: 2,
			useGrouping: false,
		});

		const min = this.minutes.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			minimumIntegerDigits: 2,
			useGrouping: false,
		});
		return `${this.factorName}${deg}* ${min}'`;
	}

	get gcmStr() {
		const num = (this.degrees + this.minutes / 60).toLocaleString(undefined, {
			minimumFractionDigits: 4,
			minimumIntegerDigits: 2,
			useGrouping: false,
		});
		return `${this.factorName}${num}`;
	}
}
