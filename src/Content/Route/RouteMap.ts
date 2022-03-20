import _ = require('lodash');
import * as vscode from 'vscode';
import { ColorSet } from '../../Types/Color';
import { AircraftType } from '../Aircraft/AircraftType';
import { Flightplan } from '../Flightplan/Flightplan';
import { RouteSegment } from './RouteSegment';

export class Routemap {
	panel: vscode.WebviewPanel;

	flightplan: Flightplan;
	routesByAircraftType: Map<AircraftType, RouteSegment[]>;
	aircraftTypesSorted: AircraftType[];
	aircraftTypeToColor: Map<AircraftType, ColorSet> = new Map();

	acTypesGcmUri: Map<string, string> = new Map();
	debouncedUpdateImage = _.debounce(this.updateImage, 2000);

	private static colors: ColorSet[] = [
		['#00FF7F', 'dark'],
		['#FF6347', 'dark'],
		['#87CEEB', 'dark'],
		['#D87093', 'light'],
		['#FFDEAD', 'dark'],
		['#9932CC', 'light'],
		['#F5FFFA', 'dark'],
		['#32CD32', 'light'],
		['#FFD700', 'dark'],
		['#FF1493', 'light'],
		['#FF7F50', 'dark'],
		['#1E90FF', 'light'],
		['#F8F8FF', 'dark'],
		['#D8BFD8', 'dark'],
	];

	constructor(flightplan: Flightplan, panel: vscode.WebviewPanel) {
		this.flightplan = flightplan;
		this.panel = panel;

		this.routesByAircraftType = this.getRoutesByAircraftType();
		this.aircraftTypesSorted = [...this.routesByAircraftType.keys()].sort((a, b) =>
			a.typeCode > b.typeCode ? 1 : -1
		);

		// Set aircraftType colors
		for (const [index, aircraftType] of this.aircraftTypesSorted.entries()) {
			const colorSet = Routemap.colors[index % Routemap.colors.length];
			aircraftType.routemapColor = colorSet;
		}
	}

	getRoutesByAircraftType() {
		const ret = new Map<AircraftType, RouteSegment[]>();

		for (const data of [...this.flightplan.segments.byAirportPair.values()]) {
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

		// TODO only if more than 1 aircraftType
		content += `<nav class="checkboxes aircraft-types">
						<div class="checkbox-pill all">
							<input type="checkbox" id="all" name="all" value="all" checked />
							<label for="all">All</label>
						</div>
						<div class="checkbox-container">`;

		for (const [index, aircraftType] of this.aircraftTypesSorted.entries()) {
			const color = Routemap.colors[index % Routemap.colors.length];

			content += `<div class="checkbox-pill aircraft-type" style="--color-pill-active-background: ${color[0]}; --color-pill-active-foreground: var(--color-${color[1]});">
							<input type="checkbox" id="${aircraftType.typeCode}" name="${aircraftType.typeCode}" value="${aircraftType.typeCode}" checked />
							<label for="${aircraftType.typeCode}">${aircraftType.typeCode}</label>
						</div>`;
		}

		content += '</div></nav>';

		content += `<div class="routemap-image"><img id="map" src="" /></div>`;

		return content;
	}

	updateImage(codesStr: string) {
		console.log(`updateImage("${codesStr}")`);

		let uri = this.acTypesGcmUri.get(codesStr);
		if (!uri) {
			const codes = codesStr.split(',');
			const aircraftTypes = [...this.routesByAircraftType.keys()].filter((aircraftType) =>
				codes.includes(aircraftType.typeCode)
			);

			uri = this.getGcmImageUri(aircraftTypes);

			this.acTypesGcmUri.set(codesStr, uri);
		}

		// TODO receive img with axios, check for error code
		/*
		e.g. Air Panama http://www.gcmap.com/map?P=C:%2387CEEB,MPMG-MPDA/SKRG,C:%23D87093,MPMG-MROC/MPBO/MPCH,C:%23FF6347,MPMG-PX06/MPBH/MPJE/MPOA/MPRA/SIC1,MPBH-MPJE,MPRA-SIC1,C:%2300FF7F,MPMG-MP30/MPAC/MPOG/MPMP,MP30-MPAC,MPOG-MPMP&MS=bm&MP=rect&MR=240&MX=640x640&PM=b:pentagon10:orange%2b%22%25i%2212i:orange/:black&PC=%23ff00ff&PW=2
		Error

		PX06: location error 0 (undefined code)
		*/

		this.panel.webview.postMessage({ command: 'updateRoutemapImage', uri: uri });
	}

	getGcmImageUri(aircraftTypes: AircraftType[]) {
		const txt = ['http://www.gcmap.com/map?P='];

		txt.push(
			aircraftTypes
				.map((aircraftType) => {
					const color = encodeURIComponent(aircraftType.routemapColor![0]);
					return `C:${color},${this.getAircraftTypeGcmRouteString(aircraftType)}`;
				})
				.join(',')
		);

		txt.push(
			`&MS=bm&MP=rect&MR=240&MX=640x640&PM=b:pentagon10:orange%2b%22%25i%2212i:orange/:black&PC=%23ff00ff&PW=2`
		);

		return txt.join('');
	}

	getAircraftTypeGcmRouteString(aircraftType: AircraftType) {
		const segments = this.routesByAircraftType.get(aircraftType);
		if (segments) {
			// Group by departure airport → "ASDF-EDDF/EDDT/KJFK/KLAX"
			const parts: { [id: string]: Set<string> } = {};

			for (const segment of segments) {
				const d = segment.departureAirport.icao;
				const a = segment.arrivalAirport.icao;

				if (parts[d]) {
					parts[d].add(a);
				} else {
					parts[d] = new Set([a]);
				}
			}

			return Object.entries(parts)
				.map((data) => {
					return `${data[0]}-${[...data[1]].join('/')}`;
				})
				.join(',');
		}

		return '';
	}
}
