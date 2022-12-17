import { AircraftLivery } from './AircraftLivery';
import { Flightplan } from '../Flightplan/Flightplan';
import { RouteSegment } from '../Route/RouteSegment';

export class Aircraft {
	/** The complete text line for this aircraft */
	text: string;
	/** Aircraft number */
	acNum: number;
	/** Aircraft registration */
	registration: string;
	percentage: number;
	period: string;
	flightRule: 'IFR' | 'VFR';
	segments: RouteSegment[] = [];

	flightplan: Flightplan;
	aircraftLivery?: AircraftLivery;

	constructor(
		text: string,
		acNum: number,
		registration: string,
		percentage: number,
		period: string,
		flightRule: 'IFR' | 'VFR',
		flightplan: Flightplan,
		aircraftLivery?: AircraftLivery
	) {
		this.text = text;
		this.acNum = acNum;
		this.registration = registration;
		this.percentage = percentage;
		this.period = period;
		this.flightRule = flightRule;

		// Flightplan
		this.flightplan = flightplan;
		this.flightplan.aircraft.all.push(this);
		if (this.flightplan.aircraft.byAcNum.has(acNum)) {
			const array = this.flightplan.aircraft.byAcNum.get(acNum)!;
			array.push(this);
			this.flightplan.aircraft.byAcNum.set(acNum, array);
		} else {
			this.flightplan.aircraft.byAcNum.set(acNum, [this]);
		}

		// Aircraft livery
		this.aircraftLivery = aircraftLivery;
		aircraftLivery?.aircraft.push(this);
	}

	get aircraftType() {
		return this.aircraftLivery?.aircraftType;
	}
}
