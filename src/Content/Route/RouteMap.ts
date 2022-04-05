import _ = require('lodash');
import * as vscode from 'vscode';
import axios from 'axios';
import { Color } from '../../Classes/Color';
import { AircraftType } from '../Aircraft/AircraftType';
import { Flightplan } from '../Flightplan/Flightplan';
import { RouteSegment } from './RouteSegment';
import { LocalStorageService } from '../../Tools/LocalStorageService';

type GcmReplacementData = { id: string; data: string };
type GcmReplacementMap = Map<string, GcmReplacementData>;

export class Routemap {
	panel: vscode.WebviewPanel;
	storageManager: LocalStorageService;

	flightplan: Flightplan;
	routesByAircraftType: Map<AircraftType, RouteSegment[]>;
	aircraftTypesSorted: AircraftType[];

	acTypesGcmUri: Map<string, string> = new Map();
	debouncedUpdateImage = _.debounce(this.updateImage, 2000);

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

	constructor(flightplan: Flightplan, panel: vscode.WebviewPanel, storageManager: LocalStorageService) {
		this.flightplan = flightplan;
		this.panel = panel;
		this.storageManager = storageManager;

		this.routesByAircraftType = this.getRoutesByAircraftType();
		this.aircraftTypesSorted = [...this.routesByAircraftType.keys()].sort((a, b) =>
			a.typeCode > b.typeCode ? 1 : -1
		);

		// Set aircraftType colors
		for (const [index, aircraftType] of this.aircraftTypesSorted.entries()) {
			const color = Routemap.colors[index % Routemap.colors.length];
			aircraftType.routemapColor = color;
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

			content += `<div class="checkbox-pill aircraft-type" style="--color-pill-active-background: ${color.hex}; --color-pill-active-foreground: var(--color-${color.textColor});">
							<input type="checkbox" id="${aircraftType.typeCode}" name="${aircraftType.typeCode}" value="${aircraftType.typeCode}" checked />
							<label for="${aircraftType.typeCode}">${aircraftType.typeCode}</label>
						</div>`;
		}

		content += `<div id="update-delay-bar"></div>`;

		content += '</div></nav>';

		content += `<div class="routemap-image">
			<div class="loading-indicator"><div></div><div></div><div></div><div></div></div>
			<img id="map" class="card" src="" />
		</div>`;

		return content;
	}

	async updateImage(codesStr: string, uri?: string) {
		console.log(`updateImage("${codesStr}")`);

		this.panel.webview.postMessage({ command: 'setRoutemapLoading', loading: true });

		if (!uri) {
			uri = this.acTypesGcmUri.get(codesStr);
		}
		if (!uri) {
			const codes = codesStr.split(',');
			const aircraftTypes = [...this.routesByAircraftType.keys()].filter((aircraftType) =>
				codes.includes(aircraftType.typeCode)
			);

			uri = this.getGcmImageUri(aircraftTypes);

			this.acTypesGcmUri.set(codesStr, uri);
		}

		// Retrieve img using Axios, check for error and fix
		uri = await this.replaceMissingAirports(uri);

		this.panel.webview.postMessage({ command: 'setRoutemapLoading', loading: false });
		this.panel.webview.postMessage({ command: 'updateRoutemapImage', uri: uri });
	}

	/**
	 * Retrieve the image with Axios, check for missing airports, add custom
	 * replacement data and try again until all missing airports are replaced.
	 * @param uri - The original GCM uri that might include airports missing in GCM
	 */
	async replaceMissingAirports(uri: string) {
		/**
		 * Converts a number to a three-character string code.
		 *
		 * Examples: 0 → "AAA", 1 → "AAB", 26 → "ABA", 123 → "AET"
		 */
		const generateId = (num: number) => {
			const id = String.fromCharCode(
				65 + (Math.floor(num / 26 / 26) % 26),
				65 + (Math.floor(num / 26) % 26),
				65 + (num % 26)
			);

			return id;
		};

		const replaceAirport = (uri: string, airportCode: string, replacement: string, gcmData: string) => {
			if (uri.includes(airportCode)) {
				return uri.replaceAll(airportCode, replacement).replace('map?P=', `map?P=${gcmData};`);
			}
			return uri;
		};

		// Retrieve gcmMissingAirports data from storage
		let gcmMissingAirports: GcmReplacementMap | undefined = this.storageManager.getValue('gcmMissingAirports');
		if (!gcmMissingAirports?.size) gcmMissingAirports = new Map();

		// Replace known missing airports with replacement identifiers
		gcmMissingAirports.forEach((value: GcmReplacementData, key: string) => {
			uri = replaceAirport(uri, key, value.id, value.data);
		});

		const maxTries = 1000;
		let i = 0;
		while (true && i < maxTries) {
			// Make sure to have a way out...
			i++;

			const axiosImg = await axios.get(uri);
			const contentType = axiosImg.headers['content-type'];

			if (contentType === 'text/html') {
				const match = axiosImg.data.match(/(?:\s|\\n|\\r)(\w{3,4}): location error/);
				const airportCode = match?.[1];

				const index = gcmMissingAirports.size;
				const id = `TMP${generateId(index)}`;

				const gcmData =
					this.flightplan.airports.get(airportCode)?.getGcmData(id) ||
					`${id}=N0.000W0.000;"${airportCode}"+@${id}`;

				// Add to gcmMissingAirports
				gcmMissingAirports.set(airportCode, { id: id, data: gcmData });

				// Add custom data and replace all ICAO occurrences with new ID
				uri = replaceAirport(uri, airportCode, id, gcmData);
			} else {
				// console.log(axiosImg.data);
				break;
			}
		}

		// Save updated gcmMissingAirports to storage
		this.storageManager.setValue('gcmMissingAirports', gcmMissingAirports);

		return uri;
	}

	getGcmImageUri(aircraftTypes: AircraftType[]) {
		const txt = ['http://www.gcmap.com/map?P='];

		txt.push(
			aircraftTypes
				.map((aircraftType) => {
					const color = encodeURIComponent(aircraftType.routemapColor!.hex);
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
