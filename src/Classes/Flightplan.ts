import { showError } from '../Tools/helpers';
import { parseAircraftTxt } from '../Content/Aircraft/parseAircraftTxt';
import { TAirportCodeCount } from './Airport';
import { Aircraft } from '../Content/Aircraft/Aircraft';
import { AircraftLivery } from '../Content/Aircraft/AircraftLivery';

export class Flightplan {
	text: string;
	aircraft: { all: Aircraft[]; byAcNum: Map<number, Aircraft[]> };
	aircraftLiveries: AircraftLivery[] = [];

	constructor(
		aircraftText: string,
		aircraftTxtFilename: string,
		flightplanText: string,
		flightplansTxtFilename: string
	) {
		this.text = flightplanText;
		this.aircraft = { all: [], byAcNum: new Map() };

		// TODO async ?
		this.parseAircraft(aircraftText, aircraftTxtFilename, flightplanText, flightplansTxtFilename);

		this.parseFlightplan();

		this.createAircraftStats();
	}

	addAicraftToByAcNum(acNum: number, aircraft: Aircraft) {
		if (this.aircraft.byAcNum.has(acNum)) {
			this.aircraft.byAcNum.get(acNum)!.push(aircraft);
		} else {
			this.aircraft.byAcNum.set(acNum, [aircraft]);
		}
	}

	async parseAircraft(
		aircraftText: string,
		aircraftTxtFilename: string,
		flightplanText: string,
		flightplansTxtFilename: string
	) {
		// TODO temp filePath prop
		const ret = await parseAircraftTxt({
			aircraft: { fileName: aircraftTxtFilename, filePath: '', text: aircraftText },
			airports: { fileName: '', filePath: '' },
			flightplans: { fileName: flightplansTxtFilename, filePath: '', text: flightplanText },
		});
		if (ret) {
			const { aircraftTypes, totalAircraftCount, nonMatches } = ret;
		}
	}

	parseFlightplan() {
		// https://regex101.com/r/bquXX3/2

		// GO THROUGH FLIGHTPLAN
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
					const aircraft = new Aircraft(
						Number(metaMatches.groups.acNum),
						metaMatches.groups.reg,
						Number(metaMatches.groups.pct),
						metaMatches.groups.period,
						metaMatches.groups.flightRule
					);

					// Segments
					const segmentMatches = line.matchAll(segmentsRegex);
					if (segmentMatches) {
						const segmentsArray = [...segmentMatches];
						for (const [index, match] of segmentsArray.entries()) {
							// Length can be 1+7, or 1+9 if the flightplan is multi-week
							const prevMatch = segmentsArray.at(index - 1);
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

								aircraft.segments.push(new RouteSegment(data));
							}
						}
					}

					this.aircraft.all.push(aircraft);
					this.addAicraftToByAcNum(aircraft.acNum, aircraft);
				}
			}
		}
	}

	/*
	acType (A380, B752, ...) → acLivery list
		acLivery (Regular, OC, Special1, ...) - has acNum & title → acList, toAcType
			ac → toAcLivery
			ac
			ac
		acLivery
			ac
		acLivery
			ac
			ac
	acType
	...

	*/

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
	}
}

export class FlightplanRaw {
	text: string;

	constructor(flightplanText: string) {
		this.text = flightplanText;
	}

	collectAirportCodes() {
		const matches = [...this.text.trim().matchAll(/,[FfRr],\d+,([A-Za-z0-9]{3,4})/gm)];
		if (!matches?.length) {
			showError('No airports could be found in the flightplan.');
			return null;
		}

		const data: { [icao: string]: TAirportCodeCount } = {};
		for (const match of matches) {
			const icao = match[1];

			if (data[icao]) {
				data[icao].count = data[icao].count! + 1;
			} else {
				data[icao] = { icao, count: 0 };
			}
		}

		return new Set(
			Object.values(data).sort((a: TAirportCodeCount, b: TAirportCodeCount) => {
				// Sort ascending
				if (a.icao < b.icao) return -1;
				if (a.icao > b.icao) return 1;
				return 0;
			})
		);
	}
}
