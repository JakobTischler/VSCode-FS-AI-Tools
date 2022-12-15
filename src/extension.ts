import * as vscode from 'vscode';

import { ShowAirlineView } from './Commands/flightplan/airline-view';
import { CleanAircraftCfg } from './Commands/aircraft-cfg/clean-v2';
import { CleanFlightplan } from './Commands/flightplan/clean';
import { ChangeAircraftNumber } from './Commands/flightplan/change-ac-number';
import { CountAircraft } from './Commands/flightplan/count-aircraft';
import { CreateAifpCfg } from './Commands/flightplan/create-aifp-cfg';
import { CreateAircraft } from './Commands/flightplan/create-aircraft';
import { CreateFlightplanHeader } from './Commands/flightplan/create-header';
import { CreateFlightplanHeaderFromAifp } from './Commands/flightplan/create-header-from-aifp';
import { DeleteAircraft } from './Commands/aircraft/delete-aircraft';
import { DeleteAircraftFromAircraftCfg } from './Commands/aircraft-cfg/delete-aircraft';
import { GenerateAirports } from './Commands/flightplan/generate-airports';
import { HoursToWeek } from './Commands/flightplan/hours-to-week';
import { MatchAcNumbers } from './Commands/flightplan/match-ac-numbers';
import { OpenMasterAirportsFile } from './Commands/open-master-airports-file';
import { FlightplanMetadata } from './Commands/flightplan/metadata';
import { RebaseAircraftNumbers } from './Commands/flightplan/rebase-ac-numbers';
import { RenameFiles } from './Commands/flightplan/rename-files';
import { RenumberAddOnsCfg } from './Commands/add-ons-cfg/renumber';
import { RenumberSceneryCfg } from './Commands/scenery-cfg/renumber';
import { ReplaceAircraftInTargetFp } from './Commands/flightplan/replace-acs';
import { ShowAircraftList } from './Commands/flightplan/show-aircraft-list';
import { SortByWingspan } from './Commands/flightplan/sort-by-wingspan';
import { SwitchFS9FSX } from './Commands/flightplan/switch-fs9-fsx';
import { LocalStorageService } from './Tools/LocalStorageService';
import { FlightplansCommandsViewProvider } from './Webviews/sidebar-view/flightplans-commands-provider';
import { FlightplansAircraftProvider } from './Webviews/flightplans-aircraft-tree-view/flightplans-aircraft-provider';

export function activate(context: vscode.ExtensionContext) {
	// Storage Manager
	const storageManager = new LocalStorageService(context.workspaceState);

	// Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('fsAiTools.airlineView', (uri: vscode.Uri) => {
			ShowAirlineView(context, storageManager, uri?.fsPath);
		}),

		vscode.commands.registerCommand('fsAiTools.cleanAircraftCfg', () => {
			CleanAircraftCfg();
		}),

		vscode.commands.registerCommand('fsAiTools.cleanFlightplan', () => {
			CleanFlightplan();
		}),

		vscode.commands.registerCommand('fsAiTools.changeAircraftNumber', () => {
			ChangeAircraftNumber();
		}),

		vscode.commands.registerCommand('fsAiTools.countAircraft', () => {
			CountAircraft();
		}),

		vscode.commands.registerCommand('fsAiTools.createAifpCfg', () => {
			CreateAifpCfg();
		}),

		vscode.commands.registerCommand('fsAiTools.createAircraft', () => {
			CreateAircraft();
		}),

		vscode.commands.registerCommand('fsAiTools.createFlightplanHeader', () => {
			CreateFlightplanHeader();
		}),

		vscode.commands.registerCommand('fsAiTools.createFlightplanHeaderFromAifp', () => {
			CreateFlightplanHeaderFromAifp();
		}),

		vscode.commands.registerCommand('fsAiTools.deleteAircraft', () => {
			DeleteAircraft();
		}),

		vscode.commands.registerCommand('fsAiTools.deleteAircraftFromAircraftCfg', () => {
			console.log("Now calling 'DeleteAircraftFromAircraftCfg()'");
			DeleteAircraftFromAircraftCfg();
		}),

		vscode.commands.registerCommand('fsAiTools.flightplanMetadata', () => {
			FlightplanMetadata();
		}),

		vscode.commands.registerCommand('fsAiTools.generateAirports', () => {
			GenerateAirports(storageManager);
		}),

		vscode.commands.registerCommand('fsAiTools.hoursToWeek', () => {
			HoursToWeek();
		}),

		vscode.commands.registerCommand('fsAiTools.matchAcNumbers', () => {
			MatchAcNumbers();
		}),

		vscode.commands.registerCommand('fsAiTools.openMasterAirportsFile', () => {
			OpenMasterAirportsFile();
		}),

		vscode.commands.registerCommand('fsAiTools.rebaseAircraftNumbers', () => {
			RebaseAircraftNumbers();
		}),

		vscode.commands.registerCommand('fsAiTools.renameFiles', (uri: vscode.Uri) => {
			RenameFiles(uri?.fsPath);
		}),

		vscode.commands.registerCommand('fsAiTools.renumberAddOnsCfg', () => {
			RenumberAddOnsCfg();
		}),

		vscode.commands.registerCommand('fsAiTools.renumberSceneryCfg', () => {
			RenumberSceneryCfg();
		}),

		vscode.commands.registerCommand('fsAiTools.replaceAircraft', () => {
			ReplaceAircraftInTargetFp();
		}),

		vscode.commands.registerCommand('fsAiTools.showAircraftList', () => {
			ShowAircraftList();
		}),

		vscode.commands.registerCommand('fsAiTools.sortByWingspan', () => {
			SortByWingspan();
		}),

		vscode.commands.registerCommand('fsAiTools.switchFS9FSX', () => {
			SwitchFS9FSX();
		})
	);

	/*
	 * SIDEBAR VIEWS
	 */
	const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

	// Flightplans Aircraft View
	const provider = new FlightplansAircraftProvider(rootPath);
	vscode.window.createTreeView('fsAiTools.flightplansAircraftView', {
		treeDataProvider: provider,
	});
	vscode.commands.registerCommand('fsAiTools.refreshFlightplansAircraftView', () => provider.refresh());

	const flightplansCommandsProvider = new FlightplansCommandsViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(FlightplansCommandsViewProvider.viewType, flightplansCommandsProvider)
	);

	// flightplansCommandsProvider.show();

	context.subscriptions.push(
		vscode.commands.registerCommand('fsAiTools.addColor', () => {
			flightplansCommandsProvider.addColor();
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('fsAiTools.clearColors', () => {
			flightplansCommandsProvider.clearColors();
		})
	);
}

// this method is called when your extension is deactivated
// export function deactivate() {}
