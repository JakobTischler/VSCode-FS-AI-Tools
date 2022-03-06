import { showError } from '../Tools/helpers';
import { TAirportCodeCount } from './Airport';
import { Aircraft } from '../Content/Aircraft/Aircraft';
import { TAircraftLiveriesByAcNum } from '../Content/Aircraft/AircraftLivery';
import { TAircraftTypesByTypeCode } from '../Content/Aircraft/AircraftType';

export class Flightplan {
	text: string;
	aircraft: { all: Aircraft[]; byAcNum: Map<number, Aircraft[]> } = {
		all: [],
		byAcNum: new Map(),
	};
	segments: { all: RouteSegment[]; byAirportPair: Map<string, RouteSegment> } = {
		all: [],
		byAirportPair: new Map(),
	};

	constructor(
		flightplanText: string,
		aircraftTypes: TAircraftTypesByTypeCode,
		aircraftLiveries: TAircraftLiveriesByAcNum
	) {
		this.text = flightplanText;

		this.parse(aircraftTypes, aircraftLiveries);

		// this.createAircraftStats();
	}

	parse(aircraftTypes: TAircraftTypesByTypeCode, aircraftLiveries: TAircraftLiveriesByAcNum) {
		// https://regex101.com/r/bquXX3/2

		// GO THROUGH FLIGHTPLAN, CREATE AIRCRAFT AND THEIR ROUTES
		// --------------------------------------------------------------

		const metaRegex = /^AC#(?<acNum>\d+),(?<reg>.*?),(?<pct>\d+)%,(?<period>.*?),(?<flightRule>(?:IFR|VFR))/i;
		const segmentsRegex =
			/(?:(?:(?<depWeek>\d+)\/)?(?<depDay>\d+)\/)?(?<depTime>\d+:\d+),(?:TNG|\@)?(?:(?:(?<arrWeek>\d+)\/)?(?<arrDay>\d+)\/)?(?<arrTime>\d+:\d+),(?<flightLevel>\d{2,3}),[FfRr],(?<flightNum>\d{1,4}),(?<arrApt>\w{3,4})/g;

		const lines = this.text.split('\n');
		for (const line of lines) {
			if (line.startsWith('AC#')) {
				// Meta
				const metaMatches = line.match(metaRegex);
				if (metaMatches?.groups && [...metaMatches].length === 6) {
					const acNum = Number(metaMatches.groups.acNum);
					const aircraftLivery = aircraftLiveries.get(acNum);

					const aircraft = new Aircraft(
						acNum,
						metaMatches.groups.reg,
						Number(metaMatches.groups.pct),
						metaMatches.groups.period,
						metaMatches.groups.flightRule,
						this,
						aircraftLivery
					);

					// Segments
					const segmentMatches = line.matchAll(segmentsRegex);
					if (segmentMatches) {
						const segmentsArray = [...segmentMatches];
						for (const [index, match] of segmentsArray.entries()) {
							// Length can be 1+7, or 1+9 if the flightplan is multi-week

							// const prevMatch = segmentsArray.at(index - 1);
							const prevMatch = segmentsArray[index === 0 ? segmentsArray.length - 1 : index - 1];

							if (match.length >= 8 && prevMatch) {
								const g = match.groups;
								if (!g) continue;

								const data: Partial<TRouteSegmentData> = {
									depApt: prevMatch.groups?.arrApt,
									depTime: g.depTime,
									arrApt: g.arrApt,
									arrTime: g.arrTime,
									flightLevel: Number(g.flightLevel),
									flightNum: Number(g.flightNum),
								};

								if (g.depWeek !== undefined) data.depWeek = Number(g.depWeek);
								if (g.depDay !== undefined) data.depDay = Number(g.depDay);
								if (g.arrWeek !== undefined) data.arrWeek = Number(g.arrWeek);
								if (g.arrDay !== undefined) data.arrDay = Number(g.arrDay);

								const segment = new RouteSegment(data);

								// Add to aircraft
								aircraft.segments.push(segment);

								// Add to flightplan / update
								this.addRouteSegment(`${data.depApt}-${data.arrApt}`, segment);
							}
						}
					}
				}
			}
		}
	}

	addRouteSegment(id: string, segment: RouteSegment) {
		this.segments.all.push(segment);

		if (this.segments.byAirportPair.has(id)) {
			const data = this.segments.byAirportPair.get(id)!;
			data.count = data.count + 1;
			this.segments.byAirportPair.set(id, data);
		} else {
			this.segments.byAirportPair.set(id, segment);
		}
	}

	createAircraftStats() {
		// TODO read aircraft.txt to get titles
		for (const aircraft of this.aircraft.all) {
			if (!this.aircraft.byAcNum.has(aircraft.acNum)) {
			}
		}
	}
}

type TRouteSegmentData = {
	depApt: string;
	depWeek: number;
	depDay: number;
	depTime: string;
	arrApt: string;
	arrWeek: number;
	arrDay: number;
	arrTime: string;
	flightLevel: number;
	flightNum: number;
};

export class RouteSegment {
	departureAirport: string;
	departureWeek: number = 1;
	departureDay: number = 1;
	departureTime: string; // TODO Time Class
	arrivalAirport: string;
	arrivalWeek: number = 1;
	arrivalDay: number = 1;
	arrivalTime: string; // TODO Time Class
	flightLevel: number = 0;
	flightNumber: number = 0;
	/** Number of times this route segment exists in the flightplan */
	count: number = 1;

	constructor(data: Partial<TRouteSegmentData>) {
		const _data = {
			...{
				depApt: '',
				depWeek: 1,
				depDay: 1,
				depTime: '',
				arrApt: '',
				arrWeek: 1,
				arrDay: 1,
				arrTime: '',
				flightLevel: 0,
				flightNum: 0,
				count: 1,
			},
			...data,
		};

		this.departureAirport = _data.depApt;
		this.departureWeek = _data.depWeek;
		this.departureDay = _data.depDay;
		this.departureTime = _data.depTime;
		this.arrivalWeek = _data.arrWeek;
		this.arrivalDay = _data.arrDay;
		this.arrivalTime = _data.arrTime;
		this.flightLevel = _data.flightLevel;
		this.flightNumber = _data.flightNum;
		this.arrivalAirport = _data.arrApt;
		this.count = _data.count;
	}
}

export class FlightplanRaw {
	/** The Flightplan.txt file contents */
	text: string;
	/** Map that holds airport entries which contain the ICAO code and the count */
	airportCodes: Map<string, TAirportCodeCount>;
	/**
	 * Array that holds airport entries which contain the ICAO code and the
	 * count, sorted descending by count
	 */
	airportCodesByCount: TAirportCodeCount[];

	constructor(flightplanText: string) {
		this.text = flightplanText;

		this.airportCodes = this.collectAirportCodes();
		this.airportCodesByCount = [...this.airportCodes.values()].sort(
			(a: TAirportCodeCount, b: TAirportCodeCount) => b.count - a.count
		);
	}

	collectAirportCodes() {
		const matches = [...this.text.trim().matchAll(/,[FfRr],\d+,([A-Za-z0-9]{3,4})/gm)];
		if (!matches?.length) {
			showError('No airports could be found in the flightplan.');
			return new Map();
		}

		const data: { [icao: string]: TAirportCodeCount } = {};
		for (const match of matches) {
			const icao = match[1];

			if (data[icao]) {
				data[icao].count = data[icao].count! + 1;
			} else {
				data[icao] = { icao, count: 1 };
			}
		}

		return new Map(
			Object.values(data)
				.sort((a: TAirportCodeCount, b: TAirportCodeCount) => {
					// Sort ascending
					if (a.icao < b.icao) return -1;
					if (a.icao > b.icao) return 1;
					return 0;
				})
				.map((entry) => [entry.icao, entry])
		);
	}
}
