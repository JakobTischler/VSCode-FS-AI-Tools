import { Aircraft } from './Aircraft';
import { AircraftType } from './AircraftType';

/** A map of `AircraftLivery` entries, where the key is its respective AC# */
export type TAircraftLiveriesByAcNum = Map<number, AircraftLivery>;

export class AircraftLivery {
	/** The livery's title as used in the aircraft.txt file. */
	title: string;
	/** The livery's AC#. */
	num: number;
	/** The optional manual aircraft count as used by `countAircraftSimple()`. */
	manualCount?: number;
	/** The list of aircraft using this livery. Filled by `parseFlightplan()`. */
	aircraft: Aircraft[] = [];
	/** The aircraftType that this livery belongs to. */
	aircraftType?: AircraftType;

	constructor(num: number, title: string) {
		this.num = num;
		this.title = title;
		// this.acType = this.titleToAircraftType();

		// this.acType.liveries.push(this);
	}

	titleToAircraftType() {
		// TODO
		// parse
		// if exists in some array → use
		// else create new
		return new AircraftType('asdf');
	}

	/**
	 * Returns the aircraft count, using either the length of the `aircraft`
	 * array, or the `manualCount` value as fallback.
	 * */
	get count() {
		return this.manualCount || this.aircraft.length;
	}
}
