import * as vscode from 'vscode';

import { CleanAircraftCfg } from './Commands/aircraft-cfg/clean-v2';
import { CleanFlightplan } from './Commands/flightplan/clean';
import { ChangeAircraftNumber } from './Commands/flightplan/change-ac-number';
import { CountAircraft } from './Commands/flightplan/count-aircraft';
import { CreateAifpCfg } from './Commands/flightplan/create-aifp-cfg';
import { CreateAircraft } from './Commands/flightplan/create-aircraft';
import { CreateFlightplanHeader } from './Commands/flightplan/create-header';
import { CreateFlightplanHeaderFromAifp } from './Commands/flightplan/create-header-from-aifp';
import { GenerateAirports } from './Commands/flightplan/generate-airports';
import { RebaseAircraftNumbers } from './Commands/flightplan/rebase-ac-numbers';
import { RenameFiles } from './Commands/flightplan/rename-files';
import { RenumberAddOnsCfg } from './Commands/add-ons-cfg/renumber';
import { RenumberSceneryCfg } from './Commands/scenery-cfg/renumber';
import { ShowAircraftList } from './Commands/flightplan/show-aircraft-list';
import { SwitchFS9FSX } from './Commands/flightplan/switch-fs9-fsx';
import { LocalStorageService } from './Tools/LocalStorageService';

export function activate(context: vscode.ExtensionContext) {
	// Storage Manager
	const storageManager = new LocalStorageService(context.workspaceState);

	// Commands
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

		vscode.commands.registerCommand('extension.generateAirports', () => {
			GenerateAirports(storageManager);
		}),

		vscode.commands.registerCommand('extension.rebaseAircraftNumbers', () => {
			RebaseAircraftNumbers();
		}),

		vscode.commands.registerCommand('extension.renameFiles', (uri: vscode.Uri) => {
			if (uri?.fsPath) {
				RenameFiles(uri.fsPath);
			} else {
				RenameFiles();
			}
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
