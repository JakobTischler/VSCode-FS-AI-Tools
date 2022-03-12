/*
 * [x] Show title, icao, callsign
 * [x] Logo
 	1. {folder}/logo.[png,jpg]
	2. {folder}/callsign.[png,jpg]
	3. {logoFolder}/callsign.[png,jpg]
 * [x] List of airports with counts
 * [ ] Routemap
 * [x] List of aircraft types with counts
*/

import * as vscode from 'vscode';
import * as path from 'path';
import { getFlightplanFiles, showErrorModal, showError } from '../../Tools/helpers';
import { readAifpCfg } from '../../Tools/read-aifp';
import { Flightplan, FlightplanRaw } from '../../Classes/Flightplan';
import { parseAircraftTxt } from '../../Content/Aircraft/parseAircraftTxt';
import { getWebviewContent } from '../../Webviews/airline-data/get-content';
import { LocalStorageService } from '../../Tools/LocalStorageService';

export async function ShowAirlineView(
	context: vscode.ExtensionContext,
	storageManager: LocalStorageService,
	filePath?: string
) {
	// Get directory
	if (!filePath) {
		// No filePath passed as argument → check a possible currently open file
		filePath = vscode.window.activeTextEditor?.document.uri.path;

		// Neither argument nor editor has file → cancel
		if (!filePath) {
			showError('No valid file path provided');
			return;
		}
	}

	/** The flightplan directory */
	const dirPath = path.dirname(filePath).replace(/^\/+/, '');

	// Get AIFP data
	const aifpPath = path.join(dirPath, 'aifp.cfg');
	const aifp = await readAifpCfg(aifpPath, false);
	if (!aifp.found) {
		showErrorModal(
			'AIFP file not found',
			`No valid "aifp.cfg" file found in flightplan directory. Please create the file at "${aifpPath}".`
		);
		return;
	}

	// Flightplans.txt content
	const fileData = await getFlightplanFiles(dirPath, true);
	if (!fileData.aircraft || !fileData.flightplans) {
		const name = !fileData.aircraft ? 'Aircraft' : 'Flightplans';
		showError(`${name}….txt file couldn't be found in directory.`);
		return;
	}

	if (!fileData.aircraft.text) {
		showError(`${fileData.aircraft.fileName} couldn't be read.`);
		return;
	}
	if (!fileData.flightplans.text) {
		showError(`${fileData.flightplans.fileName} couldn't be read.`);
		return;
	}

	// Get Aircraft
	const aircraftData = await parseAircraftTxt(fileData, true);
	if (!aircraftData) {
		return;
	}

	// TODO remove once Flightplan is completed
	const fpRaw = new FlightplanRaw(fileData.flightplans.text);

	// TODO TEMPORARY TESTING
	const flightplan = new Flightplan(fileData.flightplans.text);
	await flightplan.parseAirportCodes(storageManager);
	flightplan.parse(aircraftData.aircraftTypes, aircraftData.aircraftLiveries);

	// Create Webview
	const config = vscode.workspace.getConfiguration('fs-ai-tools.airlineView', undefined);
	const logoDirectoryPath = config.get('logoDirectoryPath') as string;

	const localResourceRoots = [vscode.Uri.file(path.join(context.extensionPath, 'src/Webviews/airline-data'))];
	if (logoDirectoryPath?.length) {
		localResourceRoots.push(vscode.Uri.file(logoDirectoryPath));
	}

	const panel = vscode.window.createWebviewPanel(
		'airlineView',
		`Airline Data${aifp.airline ? `: ${aifp.airline}` : ''}`,
		vscode.ViewColumn.Active,
		{
			enableScripts: true,
			localResourceRoots: localResourceRoots,
		}
	);

	// Set HTML content
	panel.webview.html = await getWebviewContent(panel, context, dirPath, aifp, aircraftData, fpRaw, flightplan);
}
