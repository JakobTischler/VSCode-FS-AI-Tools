import _ = require('lodash');
import * as vscode from 'vscode';
import { AircraftType } from '../Aircraft/AircraftType';
import { Color } from '../../Classes/Color';
import { Flightplan } from '../Flightplan/Flightplan';
import { RouteSegment } from './RouteSegment';

export class Routemap {
	private static colors: Color[] = [
		'#00FF7F',
		'#FF6347',
		'#87CEEB',
		'#D87093',
		'#FFDEAD',
		'#9932CC',
		'#F5FFFA',
		'#32CD32',
		'#FFD700',
		'#FF1493',
		'#FF7F50',
		'#1E90FF',
		'#F8F8FF',
		'#D8BFD8',
	].map((hex) => new Color(hex));

	debouncedGetRouteData = _.debounce(this.getRouteData, 2000);

	panel: vscode.WebviewPanel;
	flightplan: Flightplan;
	routesByAircraftType: Map<AircraftType, RouteSegment[]>;
	aircraftTypesSorted: AircraftType[];

	constructor(flightplan: Flightplan, panel: vscode.WebviewPanel) {
		this.flightplan = flightplan;
		this.panel = panel;
		this.routesByAircraftType = Routemap.getRoutesByAircraftType(flightplan);
		this.aircraftTypesSorted = [...this.routesByAircraftType.keys()].sort((a, b) =>
			a.typeCode > b.typeCode ? 1 : -1
		);
	}

	static getRoutesByAircraftType(flightplan: Flightplan) {
		const ret = new Map<AircraftType, RouteSegment[]>();

		for (const data of [...flightplan.segments.byAirportPair.values()]) {
			data.aircraftTypes.forEach((aircraftType) => {
				const segmentsAr = ret.get(aircraftType);
				if (segmentsAr) {
					segmentsAr.push(data.segment);
					ret.set(aircraftType, segmentsAr);
				} else {
					ret.set(aircraftType, [data.segment]);
				}
			});
		}

		return ret;
	}

	get webviewContent() {
		let content = `<h2>Routemap</h2>`;

		/*
		 * NAV
		 */
		content += `<nav class="checkboxes aircraft-types">
		<div class="checkbox-pill all">
			<input type="checkbox" id="all" name="all" value="all" checked />
			<label for="all">All</label>
		</div>
		<div class="checkbox-container">`;

		for (const [index, aircraftType] of this.aircraftTypesSorted.entries()) {
			const color = Routemap.colors[index % Routemap.colors.length];

			content += `<div class="checkbox-pill aircraft-type" style="--color-pill-active-background: ${color.hex}; --color-pill-active-foreground: var(--color-${color.textColor});">
							<input type="checkbox" id="${aircraftType.typeCode}" name="${aircraftType.typeCode}" value="${aircraftType.typeCode}" checked />
							<label for="${aircraftType.typeCode}">${aircraftType.typeCode}</label>
						</div>`;
		}

		content += '</div></nav>';

		/*
		 * MAP
		 */
		content += `<div id="map" style="position: relative; width: 80vw;height: 80vw;"></div>`;

		return content;
	}

	getRouteData() {
		console.log(`getRouteData()`);

		/* const aircraftTypes = [...this.routesByAircraftType.keys()].filter((aircraftType) =>
			codes.includes(aircraftType.typeCode)
		); */
		const airports = new Map<string, [number, number]>();
		// const routes = new Map<string, { from: string; to: string; color: string }>();

		this.routesByAircraftType.forEach((routeSegments) => {
			for (const route of routeSegments) {
				if (!airports.has(route.departureAirport.icao)) {
					airports.set(route.departureAirport.icao, route.departureAirport.coordsValues);
				}
				if (!airports.has(route.arrivalAirport.icao)) {
					airports.set(route.arrivalAirport.icao, route.arrivalAirport.coordsValues);
				}
			}
		});

		this.panel.webview.postMessage({ command: 'updateRoutemapBing', airports: airports });

		// TODO
	}
}
