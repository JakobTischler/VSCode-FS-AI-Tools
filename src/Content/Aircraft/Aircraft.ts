import { AircraftLivery } from './AircraftLivery';
import { RouteSegment } from '../../Classes/Flightplan';

export class Aircraft {
	acNum: number;
	acType: string = '';
	registration: string;
	percentage: number;
	period: string;
	flightRule: string;
	segments: RouteSegment[] = [];
	title?: AircraftLivery;

	constructor(
		acNum: number,
		registration: string,
		percentage: number,
		period: string,
		flightRule: string,
		segments?: RouteSegment[]
	) {
		this.acNum = acNum;
		this.registration = registration;
		this.percentage = percentage;
		this.period = period;
		this.flightRule = flightRule;
		this.segments = segments || [];
	}
}
