import * as vscode from 'vscode';

import { CleanAircraftCfg } from './tools/aircraft-cfg/clean-v2';
import { CleanFlightplan } from './tools/flightplan/clean';
import { ChangeAircraftNumber } from './tools/flightplan/change-ac-number';
import { CreateFlightplanHeader } from './tools/flightplan/create-header';
import { RenumberAddOnsCfg } from './tools/add-ons-cfg/renumber';
import { RenumberSceneryCfg } from './tools/scenery-cfg/renumber';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.cleanAircraftCfg', () => {
			CleanAircraftCfg();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.cleanFlightplan', () => {
			CleanFlightplan();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.changeAircraftNumber', async () => {
			ChangeAircraftNumber();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.createFlightplanHeader', async () => {
			CreateFlightplanHeader();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.renumberAddOnsCfg', async () => {
			RenumberAddOnsCfg();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.renumberSceneryCfg', async () => {
			RenumberSceneryCfg();
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
