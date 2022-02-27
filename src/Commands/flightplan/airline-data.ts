/*
 * [ ] Show title, icao, callsign
 * [ ] Logo
 	1. {folder}/logo.[png,jpg]
	2. {folder}/callsign.[png,jpg]
	3. {logoFolder}/callsign.[png,jpg]
 * [ ] List of airports with counts
 * [ ] Routemap
 * [ ] List of aircraft types with counts
*/

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getFileContents, showError } from '../../Tools/helpers';
import { AifpData, readAifpCfg } from '../../Tools/read-aifp';
import { FlightplanRaw } from '../../Classes/Flightplan';
import { TAirportCodeCount } from '../../Classes/Airport';

/** TODO add to config */
const logoFolderPath = 'D:\\P3D Addons\\Logos\\logos';

export async function ShowAirlineView(context: vscode.ExtensionContext, filePath?: string) {
	// Get directory
	if (!filePath) {
		// No filePath passed as argument → check a possible currently open file
		filePath = vscode.window.activeTextEditor?.document.uri.path;

		// Neither argument nor editor has file → cancel
		if (!filePath) {
			showError('No valid file path provided');
			return false;
		}
	}
	const dirPath = path.dirname(filePath).replace(/^\/+/, '');

	// Get AIFP data
	const aifp = await readAifpCfg(path.join(dirPath, 'aifp.cfg'));
	if (!aifp.found) {
		showError('No valid aifp.cfg file found in flightplan directory.');
		return false;
	}

	// Flightplans.txt content
	let airportsByCount;
	const filePaths = await getFlightplanFiles(dirPath);
	if (filePaths.flightplans) {
		const flightplansFileContents = await getFileContents(filePaths.flightplans.path);

		if (flightplansFileContents) {
			const fp = new FlightplanRaw(flightplansFileContents);
			const airports = fp.collectAirportCodes();

			if (airports) {
				airportsByCount = [...airports].sort((a: TAirportCodeCount, b: TAirportCodeCount) => {
					// Sort descending
					if (a.count < b.count) return 1;
					if (a.count > b.count) return -1;
					return 0;
				});
			}
		}
	}

	// Create Webview
	const panel = vscode.window.createWebviewPanel(
		'airlineView',
		`Airline Data${aifp.airline ? `: ${aifp.airline}` : ''}`,
		vscode.ViewColumn.Active,
		{
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.file(path.join(context.extensionPath, 'src/Webviews/airline-data')),
				vscode.Uri.file(logoFolderPath),
			],
		}
	);

	// Set HTML content
	panel.webview.html = await getWebviewContent(panel, context, aifp, airportsByCount);
}

async function getWebviewContent(
	panel: vscode.WebviewPanel,
	context: vscode.ExtensionContext,
	aifp: AifpData,
	airportsByCount?: TAirportCodeCount[]
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

	const logoPath = await getLogoPath(aifp);
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

	/**
	 * AIRPORTS
	 */
	if (airportsByCount) {
		content += `<div class="airports-by-count">
		<h2>Airports</h2>
		<button class="toggle-button" data-target=".airport-count">Show all</button>
		<dl class="airport-count hidden">`;

		for (const [index, airport] of airportsByCount.entries()) {
			const elementClass = index > 9 ? 'hideable' : '';
			content += `<dt class="${elementClass}" data-rank="${index + 1}">${airport.icao}</dt>
			<dd class="${elementClass}">${airport.count.toLocaleString()}</dd>`;
		}

		content += `</dl>`;
		content += `</div>`;
	}

	content += '</main>';

	content += `<script src="${src.js}"></script>`;

	content += `</body>
</html>`;

	return content;
}

async function getLogoPath(aifp: AifpData) {
	if (aifp.callsign) {
		const logoPath = path.join(logoFolderPath, aifp.callsign);

		if (fs.existsSync(`${logoPath}.png`)) {
			return `${logoPath}.png`;
		}
		if (fs.existsSync(`${logoPath}.jpg`)) {
			return `${logoPath}.jpg`;
		}
	}

	return null;
}

async function getFlightplanFiles(dirPath: string) {
	const files = await fs.promises.readdir(dirPath);
	const fileRegex = /^(aircraft|airports|flightplans).*\.txt$/i;

	const ret: {
		[type: string]: {
			fileName: string;
			path: string;
			file: vscode.Uri;
		};
	} = {};

	for (const file of files) {
		const matches = file.match(fileRegex);

		if (!matches?.[1]) {
			continue;
		}

		ret[matches[1].toLowerCase()] = {
			fileName: file,
			path: path.join(dirPath, file),
			file: vscode.Uri.file(path.join(dirPath, file)),
		};
	}

	return ret;
}
