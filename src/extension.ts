import * as vscode from 'vscode';

import { AirlinePresentationPanel } from './tools/flightplan/presentation';
import { CleanAircraftCfg } from './tools/aircraft-cfg/clean-v2';
import { CleanFlightplan } from './tools/flightplan/clean';
import { ChangeAircraftNumber } from './tools/flightplan/change-ac-number';
import { CountAircraft } from './tools/flightplan/count-aircraft';
import { CreateAifpCfg } from './tools/flightplan/create-aifp-cfg';
import { CreateAircraft } from './tools/flightplan/create-aircraft';
import { CreateFlightplanHeader } from './tools/flightplan/create-header';
import { CreateFlightplanHeaderFromAifp } from './tools/flightplan/create-header-from-aifp';
import { RebaseAircraftNumbers } from './tools/flightplan/rebase-ac-numbers';
import { RenameFiles } from './tools/flightplan/rename-files';
import { RenumberAddOnsCfg } from './tools/add-ons-cfg/renumber';
import { RenumberSceneryCfg } from './tools/scenery-cfg/renumber';
import { SwitchFS9FSX } from './tools/flightplan/switch-fs9-fsx';

export function activate(context: vscode.ExtensionContext) {
	let commands = new Map();
	commands.set('cleanAircraftCfg', CleanAircraftCfg);
	commands.set('cleanFlightplan', CleanFlightplan);
	commands.set('changeAircraftNumber', ChangeAircraftNumber);
	commands.set('countAircraft', CountAircraft);
	commands.set('createAifpCfg', CreateAifpCfg);
	commands.set('createAircraft', CreateAircraft);
	commands.set('createFlightplanHeader', CreateFlightplanHeader);
	commands.set('createFlightplanHeaderFromAifp', CreateFlightplanHeaderFromAifp);
	commands.set('rebaseAircraftNumbers', RebaseAircraftNumbers);
	commands.set('renameFiles', RenameFiles);
	commands.set('renumberAddOnsCfg', RenumberAddOnsCfg);
	commands.set('renumberSceneryCfg', RenumberSceneryCfg);
	commands.set('switchFS9FSX', SwitchFS9FSX);

	for (let [cmd, fn] of commands.entries()) {
		context.subscriptions.push(
			vscode.commands.registerCommand('extension.' + cmd, () => {
				fn();
			})
		);
	}

	// Airline Presentation
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.presentAirline', () => {
			AirlinePresentationPanel.createOrShow(context.extensionUri);
		})
	);
	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(AirlinePresentationPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = AirlinePresentationPanel.getWebviewOptions(context.extensionUri);
				AirlinePresentationPanel.revive(webviewPanel, context.extensionUri);
			},
		});
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
