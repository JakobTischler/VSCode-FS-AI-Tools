import * as vscode from 'vscode';
import * as path from 'path';
import { getFlightplanFiles, showErrorModal, showError } from '../../Tools/helpers';
import { AifpData, readAifpCfg } from '../../Tools/read-aifp';
import { Flightplan } from '../../Content/Flightplan/Flightplan';
import { parseAircraftTxt } from '../../Content/Aircraft/parseAircraftTxt';
import { getWebviewContent } from '../../Webviews/airline-view/get-content';
import { LocalStorageService } from '../../Tools/LocalStorageService';
import { Routemap } from '../../Content/Route/RouteMap';
import { flightplanFileNames } from '../../Types/FlightplanFilesMetaData';

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

	for (const fileName of flightplanFileNames) {
		if (!fileData[fileName]) {
			showError(`${fileName.capitalize()}….txt file couldn't be found in directory.`);
			return;
		}

		if (!fileData[fileName].text) {
			showError(`${fileData[fileName].fileName} couldn't be read.`);
			return;
		}
	}

	// Get Aircraft
	const aircraftData = await parseAircraftTxt(fileData, true);
	if (!aircraftData) {
		return;
	}
	if (aircraftData.nonMatches.length) {
		const title = `${aircraftData.nonMatches.length} aircraft couldn't be matched`;
		const msg = aircraftData.nonMatches.map((title) => `• ${title}`).join('\n');
		showErrorModal(title, msg);
	}

	const flightplan = new Flightplan(fileData.flightplans.text!);
	await flightplan.parseAirportCodes(storageManager, fileData.airports.text!);
	flightplan.parse(aircraftData.aircraftTypes, aircraftData.aircraftLiveries);

	// Create Webview
	const panel = createPanel(context, aifp, dirPath);

	// Routemap
	const routemap = new Routemap(flightplan, panel, storageManager);

	// Handle messages from the webview
	panel.webview.onDidReceiveMessage(
		(message) => {
			if (message.command === 'aircraftTypesChange') {
				if (message.immediate) {
					routemap.updateImage(message.text);
				} else {
					routemap.debouncedUpdateImage(message.text);
				}
				return;
			}
		},
		undefined,
		context.subscriptions
	);

	// Set HTML content
	panel.webview.html = await getWebviewContent(panel, context, dirPath, aifp, aircraftData, flightplan, routemap);
}

function createPanel(context: vscode.ExtensionContext, aifp: AifpData, flightplanDir: string) {
	const config = vscode.workspace.getConfiguration('fs-ai-tools.airlineView', undefined);

	// Define localResourceRoots
	const localResourceRoots = [
		vscode.Uri.file(path.join(context.extensionPath, 'res/Webviews/airline-view')),
		vscode.Uri.file(flightplanDir),
	];

	const logoDirectoryPath = config.get('logoDirectoryPath') as string;
	if (logoDirectoryPath?.length) {
		localResourceRoots.push(vscode.Uri.file(logoDirectoryPath));
	}

	return vscode.window.createWebviewPanel(
		'airlineView',
		`Airline Data${aifp.airline ? `: ${aifp.airline}` : ''}`,
		vscode.ViewColumn.Active,
		{
			enableScripts: true,
			localResourceRoots: localResourceRoots,
		}
	);
}
