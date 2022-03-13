import { AircraftLivery } from './AircraftLivery';
import { Flightplan } from '../Flightplan/Flightplan';
import { RouteSegment } from '../Route/RouteSegment';

export class Aircraft {
	acNum: number;
	registration: string;
	percentage: number;
	period: string;
	flightRule: string;
	segments: RouteSegment[] = [];

	flightplan: Flightplan;
	aircraftLivery?: AircraftLivery;

	constructor(
		acNum: number,
		registration: string,
		percentage: number,
		period: string,
		flightRule: string,
		flightplan: Flightplan,
		aircraftLivery?: AircraftLivery
	) {
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
