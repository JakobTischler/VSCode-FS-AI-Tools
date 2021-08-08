import * as vscode from 'vscode';

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
import { ShowAircraftList } from './tools/flightplan/show-aircraft-list';
import { SwitchFS9FSX } from './tools/flightplan/switch-fs9-fsx';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.cleanAircraftCfg', () => {
			CleanAircraftCfg();
		}),

		vscode.commands.registerCommand('extension.cleanFlightplan', () => {
			CleanFlightplan();
		}),

		vscode.commands.registerCommand('extension.changeAircraftNumber', () => {
			ChangeAircraftNumber();
		}),

		vscode.commands.registerCommand('extension.countAircraft', () => {
			CountAircraft();
		}),

		vscode.commands.registerCommand('extension.createAifpCfg', () => {
			CreateAifpCfg();
		}),

		vscode.commands.registerCommand('extension.createAircraft', () => {
			CreateAircraft();
		}),

		vscode.commands.registerCommand('extension.createFlightplanHeader', () => {
			CreateFlightplanHeader();
		}),

		vscode.commands.registerCommand('extension.createFlightplanHeaderFromAifp', () => {
			CreateFlightplanHeaderFromAifp();
		}),

		vscode.commands.registerCommand('extension.rebaseAircraftNumbers', () => {
			RebaseAircraftNumbers();
		}),

		vscode.commands.registerCommand('extension.renameFiles', (uri: vscode.Uri) => {
			RenameFiles(uri.fsPath);
		}),

		vscode.commands.registerCommand('extension.renumberAddOnsCfg', () => {
			RenumberAddOnsCfg();
		}),

		vscode.commands.registerCommand('extension.renumberSceneryCfg', () => {
			RenumberSceneryCfg();
		}),

		vscode.commands.registerCommand('extension.showAircraftList', () => {
			ShowAircraftList();
		}),

		vscode.commands.registerCommand('extension.switchFS9FSX', () => {
			SwitchFS9FSX();
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
