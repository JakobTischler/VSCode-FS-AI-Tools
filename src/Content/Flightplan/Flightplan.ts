import { clone, showError } from '../../Tools/helpers';
import {
	Airport,
	getMasterAirports,
	parseAirportsTxt,
	TAirportCodeCount,
	TAirportCodeToLine,
} from '../Airport/Airport';
import { Aircraft } from '../Aircraft/Aircraft';
import { TAircraftLiveriesByAcNum } from '../Aircraft/AircraftLivery';
import { AircraftType, TAircraftTypesByTypeCode } from '../Aircraft/AircraftType';
import { RouteSegment, TRouteSegmentData } from '../Route/RouteSegment';
import { LocalStorageService } from '../../Tools/LocalStorageService';

export class Flightplan {
	text: string;
	aircraft: { all: Aircraft[]; byAcNum: Map<number, Aircraft[]> } = {
		all: [],
		byAcNum: new Map(),
	};
	airports: Map<string, Airport> = new Map();
	segments: {
		all: RouteSegment[];
		byLeg: Map<string, { aircraftTypes: Set<AircraftType>; segment: RouteSegment }>;
		byAirportPair: Map<string, { aircraftTypes: Set<AircraftType>; segment: RouteSegment }>;
	} = {
		all: [],
		byLeg: new Map(),
		byAirportPair: new Map(),
	};

	constructor(flightplanText: string) {
		this.text = flightplanText;
	}

	async parseAirportCodes(storageManager: LocalStorageService, airportsTxtText: string) {
		const airportCodes = collectAirportCodes(this.text);
		const missing: TAirportCodeCount[] = [];

		const airportsTxtAirports: TAirportCodeToLine = parseAirportsTxt(airportsTxtText);

		// Check flightplan's airports.txt
		for (const [icao, data] of airportCodes.entries()) {
			if (!airportsTxtAirports.has(icao)) {
				missing.push(data);
				continue;
			}

			const airport = new Airport(airportsTxtAirports.get(icao)!, data.count);
			this.airports.set(icao, airport);
		}

		if (missing.length) {
			// Get master airport data
			const masterAirports: TAirportCodeToLine | null = await getMasterAirports(storageManager);
			if (!masterAirports?.size) {
				return;
			}

			for (const data of missing) {
				// Get airport's master data
				if (!masterAirports.has(data.icao)) {
					showError(`Airport "${data.icao}" couldn't be found in master airports file.`);
					continue;
				}

				const airport = new Airport(masterAirports.get(data.icao)!, data.count);
				this.airports.set(data.icao, airport);
			}
		}
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

								const depApt = this.airports.get(prevMatch.groups!.arrApt);
								const arrApt = this.airports.get(g.arrApt);

								if (!depApt) {
									showError(`Departure airport "${prevMatch.groups!.arrApt}" couldn't be found.`);
									continue;
								}
								if (!arrApt) {
									showError(`Arrival airport "${g.arrApt}" couldn't be found.`);
									continue;
								}

								// Optional data
								const optionalData: Partial<TRouteSegmentData> = {
									flightLevel: Number(g.flightLevel),
									flightNum: Number(g.flightNum),
								};
								if (g.depWeek !== undefined) optionalData.depWeek = Number(g.depWeek);
								if (g.depDay !== undefined) optionalData.depDay = Number(g.depDay);
								if (g.arrWeek !== undefined) optionalData.arrWeek = Number(g.arrWeek);
								if (g.arrDay !== undefined) optionalData.arrDay = Number(g.arrDay);

								const segment = new RouteSegment(depApt, g.depTime, arrApt, g.arrTime, optionalData);

								// Add to aircraft
								aircraft.segments.push(segment);

								// Add to flightplan / update
								this.addRouteSegment(segment, aircraft);
							}
						}
					}
				}
			}
		}

		this.createAirportPairsList();
	}

	addRouteSegment(segment: RouteSegment, aircraft: Aircraft) {
		// All
		{
			this.segments.all.push(segment);
		}

		// Leg
		{
			const id = `${segment.departureAirport.icao}→${segment.arrivalAirport.icao}`;

			if (this.segments.byLeg.has(id)) {
				const data = this.segments.byLeg.get(id)!;

				// Add aircraftType
				data.aircraftTypes.add(aircraft.aircraftType!);

				// Increase count
				data.segment.count++;

				// Save
				this.segments.byLeg.set(id, data);
			} else {
				this.segments.byLeg.set(id, { aircraftTypes: new Set([aircraft.aircraftType!]), segment });
			}
		}
	}

	createAirportPairsList() {
		const complete: string[] = [];

		for (const [id, legData] of this.segments.byLeg.entries()) {
			if (complete.includes(id)) {
				continue;
			}

			// Create RouteSegment clone
			const segmentClone = clone(legData.segment) as RouteSegment;

			// AicraftTypes
			const aircraftTypesAr = [...legData.aircraftTypes];

			// Get return leg
			const returnId = `${legData.segment.arrivalAirport.icao}→${legData.segment.departureAirport.icao}`;
			const returnLegData = this.segments.byLeg.get(returnId);

			// Merge with return leg
			if (returnLegData) {
				// Sum up counts
				segmentClone.count += returnLegData.segment.count;

				// Merge aircraftTypes of this leg and return leg
				aircraftTypesAr.push(...returnLegData.aircraftTypes);
			}

			// Filter out undefined
			const aircraftTypes = new Set(aircraftTypesAr.filter((acType) => acType));

			// Switch departure and arrival airports to have the most visited
			// airport as departure point.
			if (segmentClone.arrivalAirport.count > segmentClone.departureAirport.count) {
				const arrApt = segmentClone.arrivalAirport;
				const depApt = segmentClone.departureAirport;

				segmentClone.arrivalAirport = depApt;
				segmentClone.departureAirport = arrApt;
			}

			// Add to pairs list
			this.segments.byAirportPair.set(
				`${segmentClone.departureAirport.icao}↔${segmentClone.arrivalAirport.icao}`,
				{
					aircraftTypes,
					segment: segmentClone,
				}
			);

			// Add to complete list
			complete.push(id, returnId);
		}
	}
}

export class FlightplanRaw {
	/** The Flightplan.txt file contents */
	text: string;
	/** Map that holds airport entries which contain the ICAO code and the count */
	airportCodes: Map<string, TAirportCodeCount>;
	/** Array that holds airport entries which contain the ICAO code and the count, sorted descending by count */
	airportCodesByCount: TAirportCodeCount[];

	constructor(flightplanText: string) {
		this.text = flightplanText;

		this.airportCodes = collectAirportCodes(flightplanText);
		this.airportCodesByCount = [...this.airportCodes.values()].sort(
			(a: TAirportCodeCount, b: TAirportCodeCount) => b.count - a.count
		);
	}
}

/**
 * Gathers all airport codes from the flightplan text and returns a Map with the ICAO code as key and `{ icao, count }`
 * as value.
 * @param flightplanText The flightplans.txt file contents
 * @returns `Map<string, TAirportCodeCount>`
 */
export function collectAirportCodes(flightplanText: string): Map<string, TAirportCodeCount> {
	const matches = [...flightplanText.trim().matchAll(/,[FfRr],\d+,([A-Za-z0-9]{3,4})/gm)];
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
