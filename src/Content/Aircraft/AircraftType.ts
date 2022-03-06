import { Aircraft } from './Aircraft';
import { AircraftLivery } from './AircraftLivery';

/**
 * A map of `AircraftType` entries, where the key is its respective ICAO code
 * (`typeCode`) value.
 */
export type TAircraftTypesByTypeCode = Map<string, AircraftType>;

export class AircraftType {
	/** The type's ICAO code */
	typeCode: string;
	/** The total number of aircraft of this type. */
	aircraftCount: number = 0;
	/** A set of all `AircraftLivery`s that were matched to this aircraft type */
	liveries: Set<AircraftLivery> = new Set();
	/** The type's manufacturer name */
	manufacturer?: string;
	/** The type's name */
	typeName?: string;

	constructor(title: string) {
		this.typeCode = title;
	}

	addLivery(aircraftLivery: AircraftLivery) {
		aircraftLivery.aircraftType = this;

		this.liveries.add(aircraftLivery);
		this.updateAircraftCount();
	}

	updateAircraftCount() {
		this.aircraftCount = [...this.liveries.values()].reduce((previousValue: number, livery: AircraftLivery) => {
			return previousValue + (livery.manualCount || livery.aircraft.length);
		}, 0);
	}

	get name() {
		if (this.manufacturer && this.typeName) {
			return `${this.manufacturer} ${this.typeName}`;
		}

		return this.typeCode;
	}
}
