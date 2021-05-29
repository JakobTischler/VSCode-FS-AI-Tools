import * as vscode from 'vscode';

import { CleanAircraftCfg } from './tools/aircraft-cfg/clean-v2';
import { CleanFlightplan } from './tools/flightplan/clean';
import { ChangeAircraftNumber } from './tools/flightplan/change-ac-number';
import { CreateAifpCfg } from './tools/flightplan/create-aifp-cfg';
import { CreateFlightplanHeader } from './tools/flightplan/create-header';
import { CreateFlightplanHeaderFromAifp } from './tools/flightplan/create-header-from-aifp';
import { RebaseAircraftNumbers } from './tools/flightplan/rebase-ac-numbers';
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
		vscode.commands.registerCommand('extension.createAifpCfg', async () => {
			CreateAifpCfg();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.createFlightplanHeader', async () => {
			CreateFlightplanHeader();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.createFlightplanHeaderFromAifp', async () => {
			CreateFlightplanHeaderFromAifp();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.rebaseAircraftNumbers', async () => {
			RebaseAircraftNumbers();
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
