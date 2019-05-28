import * as vscode from 'vscode';

import { CleanAircraftCfg } from './tools/aircraft-cfg/clean';
import { CleanFlightplan } from './tools/flightplan/clean';
import { ChangeAircraftNumber } from './tools/flightplan/change-ac-number';

export function activate(context: vscode.ExtensionContext) {
	// TODO limit commands to FS files
	// https://code.visualstudio.com/api/references/activation-events
	// https://code.visualstudio.com/docs/getstarted/keybindings#_when-clause-contexts
	// https://github.com/Microsoft/vscode/issues/26044#issuecomment-359827315
	// TODO publish
	// https://code.visualstudio.com/api/working-with-extensions/publishing-extension

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
}

// this method is called when your extension is deactivated
export function deactivate() {}
