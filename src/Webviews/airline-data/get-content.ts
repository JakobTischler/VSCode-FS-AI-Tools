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
<html lang="en">`;
	content += getHeadContent(src.style);

	content += `<body>`;

	content += await getHeaderContent(panel, aifp, flightplanDirPath);

	/**
	 * MAIN
	 */

	content += '<main>';

	if (aircraftData || flightplan) {
		const numCols = (flightplan ? 2 : 0) + (aircraftData ? 1 : 0);
		content += `<section class="grid col-${numCols}">`;

		// AIRCRAFT
		if (aircraftData) {
			content += getAircraftContent(aircraftData.aircraftTypes, aircraftData.totalAircraftCount);
		}

		if (flightplan) {
			// AIRPORTS
			content += getAirportsContent(flightplan);

			// ROUTES
			content += getRoutesContent(flightplan);
		}

		content += `</section>`;
	}

	content += '</main>';

	content += getScriptsContent(src.js);

	content += `</body>
			</html>`;

	return content;
}

function getScriptsContent(customScriptUri: vscode.Uri) {
	return [
		`<script src="https://tofsjonas.github.io/sortable/sortable.js"></script>`,
		`<!-- Async script executes immediately and must be after any DOM elements used in callback. -->`,
		`<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap&libraries=&v=weekly&channel=2" async></script>`,
		`<script src="${customScriptUri}"></script>`,
	].join('\n');
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
function getHeadContent(customCssUri: vscode.Uri) {
	return `<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Airline Data</title>

	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;500&family=Montserrat:wght@300;500&family=Noto+Serif+Display:wght@300;600&display=swap" rel="stylesheet">

	<link rel="stylesheet" type="text/css" href="${customCssUri}" />
</head>`;
}

async function getHeaderContent(panel: vscode.WebviewPanel, aifp: AifpData, flightplanDirPath: string) {
	let content = `<header>`;

	const logoPath = await getLogoPath(aifp, flightplanDirPath);
	if (logoPath) {
		const logoDiskPath = vscode.Uri.file(logoPath);
		const logoSrc = panel.webview.asWebviewUri(logoDiskPath);

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

					<!-- New row -->
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

	return content;
}

function getAircraftContent(aircraftTypes: TAircraftTypesByTypeCode, totalAircraftCount: number) {
	let content = `<div class="grid-item">
	<h2>${totalAircraftCount} Aircraft</h2>

	<table id="aircraft-types" class="table card sortable" cellspacing="0">
		<thead><tr>
			<th class="dir-u">Type</th>
			<th>Count</th>
		</tr></thead>
		<tbody>`;

	for (const aircraftType of aircraftTypes.values()) {
		if (aircraftType.aircraftCount === 0) continue;

		content += `<tr>
				<td>${aircraftType.name}</td>
				<td data-sort="${aircraftType.aircraftCount}"><div><span>${aircraftType.aircraftCount}</span>`;
		if (aircraftType.liveries.size > 1) {
			content += `<span class="secondary">(${aircraftType.liveries.size} variations)</span>`;
		}
		content += `</div></td></tr>`;
	}

	content += `</tbody></table></div>`;

	return content;
}

function getAirportsContent(flightplan: Flightplan) {
	let content = `<div class="grid-item">
						<h2>
							<span>${flightplan.airports.size} Airports</span>`;
	if (flightplan.airports.size > 10) {
		content += `<button class="toggle-button" data-target="#airports">Show all</button>`;
	}
	content += `</h2>

				<table id="airports" class="table card sortable hidden" cellspacing="0">
					<thead><tr>
					<th>Airport</th>
					<th class="dir-d">Count</th>
				</tr></thead>
				<tbody>`;

	const byCount = [...flightplan.airports.values()].sort((a, b) => b.count - a.count);

	for (const airport of byCount) {
		content += `<tr>
						<td>${airport.icao}</td>
						<td data-sort="${airport.count}"><div>${airport.count.toLocaleString()}</div></td>
					</tr>`;
	}

	content += `</tbody></table></div>`;

	return content;
}

function getRoutesContent(flightplan: Flightplan) {
	const flights = flightplan.segments.all;
	const segments = flightplan.segments.byAirportPair;

	let content = `<div class="grid-item">
	<h2>
		<span>${segments.size.toLocaleString()} ${plural('segment', segments.size, {
		includeNumber: false,
	})} (${flights.length.toLocaleString()} legs)</span>`;
	if (segments.size > 10) {
		content += `<button class="toggle-button" data-target="#route-segments">Show all</button>`;
	}
	content += `</h2>

	<table id="route-segments" class="table card sortable hidden" cellspacing="0">
		<thead><tr>
		<th>Route</th>
		<th class="dir-d">Count</th>
		<th>Distance</th>
	</tr></thead>
	<tbody>`;

	for (const [airportPair, segment] of [...segments.entries()].sort((a, b) => {
		if (a[1].count < b[1].count) return 1;
		if (a[1].count > b[1].count) return -1;
		return 0;
	})) {
		content += `<tr>
			<td>${airportPair}</td>
			<td data-sort="${segment.count}"><div>${segment.count}×</div></td>
			<td data-sort="${segment.distance}"><div class="secondary">${segment.distanceFormatted}</div></td>`;
	}

	content += `</tbody></table></div>`;

	return content;
}
