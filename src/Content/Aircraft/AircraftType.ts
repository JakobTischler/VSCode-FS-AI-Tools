import { AircraftLivery } from './AircraftLivery';
import { Color } from '../../Classes/Color';

/**
 * A map of `AircraftType` entries, where the key is its respective ICAO code
 * (`typeCode`) value.
 */
export type TAircraftTypesByTypeCode = Map<string, AircraftType>;

export class AircraftType {
	/** The type's ICAO code, e.g. "A339" */
	typeCode: string;
	/** The total number of aircraft of this type. */
	aircraftCount = 0;
	/** A set of all `AircraftLivery`s that were matched to this aircraft type */
	liveries: Set<AircraftLivery> = new Set();
	/** The type's manufacturer name, e.g. "Airbus" */
	manufacturer?: string;
	/** The type's name, e.g. "A330-900" */
	typeName?: string;
	/** The type's optional series */
	series?: string;
	/**
	 * A tuple containing the hex color that's used when displaying this
	 * aircraftType's routes on the routemap, along with its corresponding font
	 * color
	 */
	routemapColor?: Color;

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

	/**
	 * Concatenates the manufacturer and type name, if defined (e.g. "Airbus
	 * A330-900"). Returns the type's ICAO code as fallback.
	 */
	get name() {
		if (this.manufacturer && this.typeName) {
			return `${this.manufacturer} ${this.typeName}`;
		}

		return this.typeCode;
	}
}
