import _ = require('lodash');
import * as vscode from 'vscode';
import { AircraftType } from '../Aircraft/AircraftType';
import { Flightplan } from '../Flightplan/Flightplan';
import { RouteSegment } from './RouteSegment';

export class Routemap {
	flightplan: Flightplan;
	routesByAircraftType: Map<AircraftType, RouteSegment[]>;

	panel: vscode.WebviewPanel;

	debouncedUpdateImage = _.debounce(this.updateImage, 2000);

	private static colors = [
		'#00FF7F',
		'#FF6347',
		'#87CEEB',
		'#D87093',
		'#FFDEAD',
		'#F5FFFA',
		'#9932CC',
		'#32CD32',
		'#FFD700',
		'#FF1493',
		'#FF7F50',
		'#1E90FF',
		'#F8F8FF',
		'#D8BFD8',
	];

	constructor(flightplan: Flightplan, panel: vscode.WebviewPanel) {
		this.flightplan = flightplan;
		this.panel = panel;

		this.routesByAircraftType = this.getRoutesByAircraftType();
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
		const acTypesSorted = [...this.routesByAircraftType.keys()].sort((a, b) => (a.typeCode > b.typeCode ? 1 : -1));

		let content = `<h2>Routemap</h2>`;

		// TODO only if more than 1 aircraftType
		content += `<nav class="checkboxes aircraft-types">
						<div class="checkbox-pill primary">
							<input type="checkbox" id="all" name="all" value="all" checked />
							<label for="all">All</label>
						</div>`;

		for (const [index, aircraftType] of acTypesSorted.entries()) {
			const color = Routemap.colors[index % Routemap.colors.length];

			content += `<div class="checkbox-pill" style="--routemap-color: ${color}">
							<input type="checkbox" id="${aircraftType.typeCode}" name="${aircraftType.typeCode}" value="${aircraftType.typeCode}" checked />
							<label for="${aircraftType.typeCode}">${aircraftType.typeCode}</label>
						</div>`;
		}

		content += '</nav>';

		content += `<div class="routemap-image"><img id="map" src="" /></div>`;

		return content;
	}

	updateImage(codesStr: string) {
		console.log(`updateImage("${codesStr}")`);
		// TODO hard index so color stays the same

		const codes = codesStr.split(',');
		const aircraftTypes = [...this.routesByAircraftType.keys()].filter((aircraftType) =>
			codes.includes(aircraftType.typeCode)
		);

		// TODO store gcmString for this codesStr and retrieve it later

		const gcmString = this.getGcmImageUri(aircraftTypes);
		this.panel.webview.postMessage({ command: 'updateRoutemapImage', uri: gcmString });
	}

	getGcmImageUri(aircraftTypes: AircraftType[]) {
		const txt = ['http://www.gcmap.com/map?P='];

		txt.push(
			aircraftTypes
				.map((aircraftType, index) => {
					const color = encodeURIComponent(Routemap.colors[index % Routemap.colors.length]);
					return `C:${color},${this.getAircraftTypeGcmRouteString(aircraftType)}`;
				})
				.join(',')
		);

		txt.push(
			`&MS=bm&MP=rect&MR=240&MX=540x540&PM=b:pentagon10:orange%2b%22%25i%2212i:orange/:black&PC=%23ff00ff&PW=2`
		);

		return txt.join('');
	}

	getAircraftTypeGcmRouteString(aircraftType: AircraftType) {
		// TODO group by departure airport → "ASDF-EDDF/EDDT/KJFK/KLAX"
		const segments = this.routesByAircraftType.get(aircraftType);
		if (segments) {
			return segments
				.map((segment) => {
					return `${segment.departureAirport.icao}-${segment.arrivalAirport.icao}`;
				})
				.join(',');
		}

		return '';
	}
}
