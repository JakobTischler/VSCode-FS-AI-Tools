import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AifpData } from '../../Tools/read-aifp';
import { Flightplan } from '../../Content/Flightplan/Flightplan';
import { Routemap } from '../../Content/Route/RouteMap';
import { TAircraftTypesByTypeCode } from '../../Content/Aircraft/AircraftType';
import { TAircraftLiveriesByAcNum } from '../../Content/Aircraft/AircraftLivery';
import { createNonce, plural } from '../../Tools/helpers';

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
	flightplan: Flightplan,
	routemap: Routemap
): Promise<string> {
	const uris = {
		css: panel.webview.asWebviewUri(
			vscode.Uri.file(path.join(context.extensionPath, 'res', 'Webviews', 'airline-view', 'style.css'))
		),
		js: panel.webview.asWebviewUri(
			vscode.Uri.file(path.join(context.extensionPath, 'res', 'Webviews', 'airline-view', 'index.js'))
		),
	};

	let content = `<!DOCTYPE html>
<html lang="en">`;
	content += getHeadContent(uris.css);

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

		if (flightplan) {
			content += `<section id="routemap" class="separator-before">
							${routemap.webviewContent}
						</section>`;
		}
	}

	content += '</main>';

	content += getScriptsContent(uris.js);

	content += `</body>
			</html>`;

	return content;
}

function getScriptsContent(customScriptUri: vscode.Uri) {
	return [
		`<script src="https://tofsjonas.github.io/sortable/sortable.js"></script>`,
		// `<!-- Async script executes immediately and must be after any DOM elements used in callback. -->`,
		// `<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap&libraries=&v=weekly&channel=2" async></script>`,
		"<script src='https://api.mapbox.com/mapbox-gl-js/v2.3.1/mapbox-gl.js'></script>",
		"<link href='https://api.mapbox.com/mapbox-gl-js/v2.3.1/mapbox-gl.css' rel='stylesheet' />",
		`<script src="${customScriptUri}" nonce="${createNonce()}"></script>`,
	].join('\n');
}

async function getLogoPath(aifp: AifpData, flightplanDirPath: string) {
	/** Local files */
	{
		// Collect possible paths
		const filePaths: string[] = [];
		const addPaths = (dir: string, fileName?: string, addLowerCase = false) => {
			if (!fileName) return;
			for (const ext of ['png', 'jpg']) {
				filePaths.push(path.join(dir, `${fileName}.${ext}`));
				if (addLowerCase) {
					filePaths.push(path.join(dir, `${fileName.toLowerCase()}.${ext}`));
				}
			}
		};

		//     Flightplan directory
		addPaths(flightplanDirPath, 'logo');
		addPaths(flightplanDirPath, aifp.callsign, true);
		addPaths(flightplanDirPath, aifp.icao, true);

		//     Custom logo directory
		const logoDirectoryPath = vscode.workspace
			.getConfiguration('fs-ai-tools.airlineView', undefined)
			.get('logoDirectoryPath') as string;
		if (logoDirectoryPath?.length) {
			addPaths(logoDirectoryPath, aifp.callsign, true);
			addPaths(logoDirectoryPath, aifp.icao, true);
		}

		// Go through paths and check if file exists
		let logoPath;
		for (const filePath of filePaths) {
			if (fs.existsSync(filePath)) {
				logoPath = filePath;
				break;
			}
		}
		if (logoPath) {
			return logoPath;
		}
	}

	/** Online logo host (GitLab) */
	/*
	if (aifp.callsign) {
		// Logo git repository → "{callsign}.jpg / .png"
		// https://gitlab.com/JakobTischler/fs-airline-logos/-/raw/master/logos/AALX.png
		const baseUri = 'https://gitlab.com/JakobTischler/fs-airline-logos/-/raw/master/logos';
		const uris = [
			`${baseUri}/${aifp.callsign}.png`,
			`${baseUri}/${aifp.callsign.toLowerCase()}.png`,
			`${baseUri}/${aifp.callsign}.jpg`,
			`${baseUri}/${aifp.callsign.toLowerCase()}.jpg`,
		];
		for (const uri of uris) {
			const img = await Axios.get(uri).catch((error) => {
				console.error(error);
			});
			console.log({ img });
		}
	}
	*/

	return null;
}

function getHeadContent(customCssUri: vscode.Uri) {
	return `<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Airline Data</title>

	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;500&family=Montserrat:wght@300;500&family=Noto+Serif+Display:ital,wght@0,300;0,600;1,300&display=swap" rel="stylesheet">

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
	<h2>
		<span>${totalAircraftCount} Aircraft</span>
		<button class="toggle-button" role="button" data-target="#aircraft-types" data-toggle-class="show-titles" data-button-text-on="Hide titles" data-button-text-off="Show titles">Show titles</button>
	</h2>

	<table id="aircraft-types" class="table card ${aircraftTypes.size > 1 ? 'sortable' : ''}" cellspacing="0">
		<thead><tr>
			<th class="dir-u">Type</th>
			<th>Count</th>
		</tr></thead>
		<tbody>`;

	for (const aircraftType of aircraftTypes.values()) {
		if (aircraftType.aircraftCount === 0) continue;
		const liveries = [...aircraftType.liveries.values()].filter((livery) => livery.count > 0);

		content += `<tr>
						<td data-sort="${aircraftType.name}">${aircraftType.name}
							<ul class="secondary livery-titles inset">`;
		for (const livery of liveries) {
			content += `<li>${livery.title}</li>`;
		}
		content += `</ul>
				</td>
				<td data-sort="${aircraftType.aircraftCount}">
					<div>
						<div>${aircraftType.aircraftCount.toLocaleString()}×</div>`;

		content += `<div class="secondary">`;
		content += liveries.length > 1 ? `(${liveries.length} variations)` : '';
		content += `</div>`;

		content += `<ul class="secondary livery-count">`;
		for (const livery of liveries) {
			content += `<li>${livery.count}×</li>`;
		}
		content += `</ul>
				</div>
			</td>
		</tr>`;
	}

	content += `</tbody></table></div>`;

	return content;
}

function getAirportsContent(flightplan: Flightplan) {
	let content = `<div class="grid-item">
						<h2>
							<span>${flightplan.airports.size} Airports</span>`;
	if (flightplan.airports.size > 10) {
		content += `<button class="toggle-button" role="button" data-target="#airports">Show all</button>`;
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
						<td data-sort="${airport.count}"><div>${airport.count.toLocaleString()}×</div></td>
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
	})}</span> <span class="secondary">(${flights.length.toLocaleString()} legs)</span>`;

	content += `<button class="toggle-button secondary" role="button" data-target="#route-segments" data-toggle-class="show-aircraft-types" data-button-text-on="Hide aircraft types" data-button-text-off="Show aircraft types">Show Aircraft Types</button>`;
	if (segments.size > 10) {
		content += `<button class="toggle-button" role="button" data-target="#route-segments">Show all</button>`;
	}
	content += `</h2>

	<table id="route-segments" class="table card ${segments.size > 1 ? 'sortable' : ''} hidden" cellspacing="0">
		<thead><tr>
		<th>Route</th>
		<th class="dir-d">Count</th>
		<th>Distance</th>
	</tr></thead>
	<tbody>`;

	const sorted = [...segments.entries()].sort((a, b) => b[1].segment.count - a[1].segment.count);

	for (const [airportPair, data] of sorted) {
		content += `<tr>
			<td data-sort="${airportPair}">
				<div>${airportPair}</div>
				<ul class="secondary aircraft-types inset">`;
		for (const acType of data.aircraftTypes.values()) {
			if (!acType) {
				console.error(`${airportPair}: aircraftType is ${String(acType)}`);
				continue;
			}
			content += `<li>${acType.typeCode}</li>`;
		}
		content += `</ul>
			</td>
			<td data-sort="${data.segment.count}"><div>${data.segment.count}×</div></td>
			<td data-sort="${data.segment.distance}"><div class="secondary">${data.segment.distanceFormatted}</div></td>`;
	}

	content += `</tbody></table></div>`;

	return content;
}
