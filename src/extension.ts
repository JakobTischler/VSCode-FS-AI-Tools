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
	commands.set('renumberAddOnsCfg', RenumberAddOnsCfg);
	commands.set('renumberSceneryCfg', RenumberSceneryCfg);
	commands.set('switchFS9FSX', SwitchFS9FSX);

	for (let [cmd, fn] of commands.entries()) {
		context.subscriptions.push(
			vscode.commands.registerCommand(`extension.${cmd}`, () => {
				fn();
			})
		);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
