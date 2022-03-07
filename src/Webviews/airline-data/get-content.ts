import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AifpData } from '../../Tools/read-aifp';
import { Flightplan, FlightplanRaw } from '../../Classes/Flightplan';
import { TAircraftTypesByTypeCode } from '../../Content/Aircraft/AircraftType';
import { TAircraftLiveriesByAcNum } from '../../Content/Aircraft/AircraftLivery';

export async function getWebviewContent(
	panel: vscode.WebviewPanel,
	context: vscode.ExtensionContext,
	flightplanDirPath: string,
	aifp: AifpData,
	aircraftData: {
		aircraftLiveries: TAircraftLiveriesByAcNum;
		aircraftTypes: TAircraftTypesByTypeCode;
		totalAircraftCount: number;
		nonMatches: string[];
	},
	flightplanRaw: FlightplanRaw,
	flightplan: Flightplan
): Promise<string> {
	const paths = {
		style: path.join(context.extensionPath, '/src/Webviews/airline-data/style.css'),
		js: path.join(context.extensionPath, '/src/Webviews/airline-data/index.js'),
	};
	const src = {
		style: vscode.Uri.file(paths.style).with({ scheme: 'vscode-resource' }),
		js: vscode.Uri.file(paths.js).with({ scheme: 'vscode-resource' }),
	};

	let content = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Airline Data</title>

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;500&family=Noto+Serif+Display:wght@300;600&display=swap" rel="stylesheet" />

	<link rel="stylesheet" type="text/css" href="${src.style}" />
</head>
<body>
	<header>`;

	/**
	 * HEADER
	 */

	const logoPath = await getLogoPath(aifp, flightplanDirPath);
	if (logoPath) {
		const logoDiskPath = vscode.Uri.file(logoPath);
		const logoSrc = panel.webview.asWebviewUri(logoDiskPath);

		// console.log({ logoDiskPath, logoSrc });

		content += `<h1 class="has-logo">
			<div class="logo">
				<img src="${logoSrc}" />
			</div>
		</h1>`;
	} else {
		content += `<h1><div>${aifp.airline}</div></h1>`;
	}

	content += `<div class="subHeader">
			<div class="icao">
				<i class="icon brackets-curly"></i>
				<span class="value">${aifp.icao || '———'}</span>
			</div>

			<div class="separator">•</div>

			<div class="callsign">
				<i class="icon microphone"></i>
				<span class="value">${aifp.callsign || '———'}</span>
			</div>
		</div>

		<div class="subHeader">
			<div class="author">
				<i class="icon user-edit"></i>
				<span class="value">${aifp.author || '———'}</span>
			</div>

			<div class="separator">•</div>

			<div class="season">
				<i class="icon calendar-alt"></i>
				<span class="value">${aifp.season || '———'}</span>
			</div>
		</div>
	</header>`;

	content += '<main>';

	if (aircraftData || flightplanRaw) {
		const numCols = aircraftData && flightplanRaw ? 2 : 1;
		content += `<section class="grid col-${numCols}">`;

		/*
		 * AIRCRAFT
		 */
		if (aircraftData) {
			content += `<div class="grid-item aircraft-types">
		<h2>${aircraftData.totalAircraftCount} Aircraft</h2>

		<dl class="table aircraft-count">`;

			for (const [code, aircraftType] of aircraftData.aircraftTypes.entries()) {
				content += `<dt>${aircraftType.name}</dt>
			<dd>${aircraftType.aircraftCount}`;
				if (aircraftType.liveries.size > 1) {
					content += ` <span class="variations">(${aircraftType.liveries.size} variations)</span>`;
				}
				content += `</dd>`;
			}

			content += `</dl></div>`;
		}

		/*
		 * AIRPORTS
		 */
		if (flightplanRaw && flightplan) {
			content += `<div class="grid-item airports-by-count">
		<h2>
			<span>${flightplan.airports.size} Airports</span>
			<button class="toggle-button" data-target=".airport-count">Show all</button>
		</h2>

		<dl class="table airport-count hidden">`;

			for (const [index, airport] of flightplanRaw.airportCodesByCount.entries()) {
				const elementClass = index > 9 ? 'hideable' : '';
				content += `<dt class="${elementClass}" data-rank="${index + 1}">${airport.icao}</dt>
			<dd class="${elementClass}">${airport.count.toLocaleString()}</dd>`;
			}

			content += `</dl>`;
			content += `</div>`;
		}
		content += `</section>`;

		/*
		 * ROUTES
		 */
		if (flightplan) {
			const flights = flightplan.segments.all;
			const segments = flightplan.segments.byAirportPair;

			content += `<section class="grid col-1">
			<div class="grid-item route-segements">
			<h2>${segments.size.toLocaleString()} segments (${flights.length.toLocaleString()} legs)</h2>
			<dl class="table">`;

			for (const [airportPair, segment] of [...segments.entries()].sort((a, b) => {
				if (a[1].count < b[1].count) return 1;
				if (a[1].count > b[1].count) return -1;
				return 0;
			})) {
				content += `<dt>${airportPair}</dt>`;
				content += `<dd>${segment.count}×  •  ${segment.distanceFormatted}</dd>`;
			}

			content += `</dl></div></section>`;
		}

		content += `</section>`;
	}

	content += '</main>';

	content += `<script src="${src.js}"></script>`;

	content += `</body>
</html>`;

	return content;
}

async function getLogoPath(aifp: AifpData, flightplanDirPath: string) {
	// Path 1: "{flightplan directory}/logo.png / .jpg"
	let logoPath = path.join(flightplanDirPath, 'logo');
	if (fs.existsSync(`${logoPath}.png`)) {
		return `${logoPath}.png`;
	}
	if (fs.existsSync(`${logoPath}.jpg`)) {
		return `${logoPath}.jpg`;
	}

	if (aifp.callsign) {
		// Path 2: "{flightplan directory}/{callsign}.jpg / .png"
		logoPath = path.join(flightplanDirPath, aifp.callsign);
		if (fs.existsSync(`${logoPath}.png`)) {
			return `${logoPath}.png`;
		}
		if (fs.existsSync(`${logoPath}.jpg`)) {
			return `${logoPath}.jpg`;
		}

		// Path 3: "{logo directory}/{callsign}.jpg / .png"
		const logoDirectoryPath = vscode.workspace
			.getConfiguration('fs-ai-tools.airlineView', undefined)
			.get('logoDirectoryPath') as string;

		if (logoDirectoryPath?.length) {
			logoPath = path.join(logoDirectoryPath, aifp.callsign);
			if (fs.existsSync(`${logoPath}.png`)) {
				return `${logoPath}.png`;
			}
			if (fs.existsSync(`${logoPath}.jpg`)) {
				return `${logoPath}.jpg`;
			}
		}
	}

	return null;
}
