import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AifpData } from '../../Tools/read-aifp';
import { Flightplan, FlightplanRaw } from '../../Classes/Flightplan';
import { TAircraftTypesByTypeCode } from '../../Content/Aircraft/AircraftType';
import { TAircraftLiveriesByAcNum } from '../../Content/Aircraft/AircraftLivery';
import { plural } from '../../Tools/helpers';

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

	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;500&family=Montserrat:wght@300;500&family=Noto+Serif+Display:wght@300;600&display=swap" rel="stylesheet">

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

	/**
	 * MAIN
	 */

	content += '<main>';

	if (aircraftData || flightplan) {
		const numCols = (flightplan ? 2 : 0) + (aircraftData ? 1 : 0);
		content += `<section class="grid col-${numCols}">`;

		// AIRCRAFT
		if (aircraftData) {
			content += `<div class="grid-item">
		<h2>${aircraftData.totalAircraftCount} Aircraft</h2>

		<dl class="table aircraft-types">`;

			for (const aircraftType of aircraftData.aircraftTypes.values()) {
				if (aircraftType.aircraftCount === 0) continue;

				content += `<dt>${aircraftType.name}</dt>
							<dd><span>${aircraftType.aircraftCount}</span>`;
				if (aircraftType.liveries.size > 1) {
					content += `<span class="secondary">(${aircraftType.liveries.size} variations)</span>`;
				}
				content += `</dd>`;
			}

			content += `</dl></div>`;
		}

		// AIRPORTS
		if (flightplan) {
			content += `<div class="grid-item">
		<h2>
			<span>${flightplan.airports.size} Airports</span>`;
			if (flightplan.airports.size > 10) {
				content += `<button class="toggle-button" data-target=".airports">Show all</button>`;
			}
			content += `</h2>

		<dl class="table airports hidden">`;
			const byCount = [...flightplan.airports.values()].sort((a, b) => b.count - a.count);

			for (const [index, airport] of byCount.entries()) {
				const elementClass = index > 9 ? 'hideable' : '';
				content += `<dt class="${elementClass}" data-rank="${index + 1}">${airport.icao}</dt>`;
				content += `<dd class="${elementClass}">${airport.count.toLocaleString()}</dd>`;
			}

			content += `</dl>`;
			content += `</div>`;
		}

		// ROUTES
		if (flightplan) {
			const flights = flightplan.segments.all;
			const segments = flightplan.segments.byAirportPair;

			content += `<div class="grid-item">
			<h2>
				<span>${segments.size.toLocaleString()} ${plural('segment', segments.size, {
				includeNumber: false,
			})} (${flights.length.toLocaleString()} legs)</span>`;
			if (segments.size > 10) {
				content += `<button class="toggle-button" data-target=".route-segments">Show all</button>`;
			}
			content += `</h2>
			<dl class="table route-segments hidden">`;

			let index = 0;
			for (const [airportPair, segment] of [...segments.entries()].sort((a, b) => {
				if (a[1].count < b[1].count) return 1;
				if (a[1].count > b[1].count) return -1;
				return 0;
			})) {
				const elementClass = index > 9 ? 'hideable' : '';
				content += `<dt class="${elementClass}" data-rank="${index + 1}">${airportPair}</dt>`;
				content += `<dd class="${elementClass}">
								<span>${segment.count}×</span>
								<span class="secondary">${segment.distanceFormatted}</span>
							</dd>`;

				index++;
			}

			content += `</dl></div>`;
		}

		content += `</section>`;
	}

	content += '</main>';

	content += `<script src="https://tofsjonas.github.io/sortable/sortable.js"></script>
				<script src="${src.js}"></script>`;

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
