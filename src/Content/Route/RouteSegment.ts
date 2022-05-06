import { Airport } from '../Airport/Airport';

export type TRouteSegmentData = {
	depApt: Airport;
	depWeek: number;
	depDay: number;
	depTime: string;
	arrApt: Airport;
	arrWeek: number;
	arrDay: number;
	arrTime: string;
	flightLevel: number;
	flightNum: number;
};

export class RouteSegment {
	departureAirport: Airport;
	departureWeek = 1;
	departureDay = 1;
	departureTime: string; // TODO Time Class
	arrivalAirport: Airport;
	arrivalWeek = 1;
	arrivalDay = 1;
	arrivalTime: string; // TODO Time Class
	flightLevel = 0;
	flightNumber = 0;
	/** Number of times this route segment exists in the flightplan */
	count = 1;

	// Distance
	distance = -1;
	distanceFormatted = '-1';

	// Aircraft
	// TODO segment to AircraftType[]

	constructor(
		depApt: Airport,
		depTime: string,
		arrApt: Airport,
		arrTime: string,
		optionalData: Partial<TRouteSegmentData>
	) {
		const data = {
			...{
				depWeek: 1,
				depDay: 1,
				arrWeek: 1,
				arrDay: 1,
				flightNum: 0,
				flightLevel: 360,
				count: 1,
			},
			...optionalData,
		};

		this.departureWeek = data.depWeek;
		this.departureDay = data.depDay;
		this.departureTime = depTime;
		this.arrivalWeek = data.arrWeek;
		this.arrivalDay = data.arrDay;
		this.arrivalTime = arrTime;
		this.flightLevel = data.flightLevel;
		this.flightNumber = data.flightNum;
		this.count = data.count;

		// Airports
		this.departureAirport = depApt;
		this.arrivalAirport = arrApt;

		this.updateDistance();
	}

	updateDistance() {
		const distance = this.departureAirport.distanceToAirport(this.arrivalAirport);

		this.distance = distance.value;
		this.distanceFormatted = distance.formatted;
	}
}
