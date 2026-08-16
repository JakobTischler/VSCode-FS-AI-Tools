import * as Path from 'path';
import { window, Position, workspace } from 'vscode';
import { showError, showErrorModal } from '../../Tools/helpers';
import { readAifpCfg } from '../../Tools/read-aifp';
import { renderFlightplanHeader } from '../../Services/flightplan-domain-service';

export async function CreateFlightplanHeaderFromAifp() {
	console.log('CreateFlightplanHeaderFromAifp()');

	const editor = window.activeTextEditor;
	if (
		!(
			editor &&
			'file' === editor.document.uri.scheme &&
			Path.basename(editor.document.uri.path).toLocaleLowerCase().startsWith('flightplans')
		)
	) {
		showError('Header can only be created when in a "Flightplans.txt" file');
		return false;
	}

	// Get aifp.cfg parsed data
	const aifpPath = Path.join(Path.dirname(editor.document.uri.path), 'aifp.cfg');
	const data = await readAifpCfg(aifpPath);
	if (!data || !data.found) {
		showError(`"aifp.cfg" couldn't be found.`);
		return;
	}

	// Parse template
	const template = workspace
		.getConfiguration('fs-ai-tools.createFlightplanHeader', undefined)
		.get('template') as string;
	if (!template?.length) {
		showErrorModal(
			'Template not defined',
			`The header template has not been defined in "fs-ai-tools.createFlightplanHeader.template".

You can use:
• {airline}
• {icao}
• {callsign}
• {author}
• {season}
• {fsx}`
		);
		return;
	}

	const matches = [...template.matchAll(/\{\w+(?:\?[^}]*)?\}/g)];
	if (matches.length) {
		const text = renderFlightplanHeader(template, data);
		await editor.edit((editBuilder) => {
			editBuilder.insert(new Position(0, 0), text);
		});
		window.showInformationMessage(`Header for ${data.airline} created`);
	} else {
		showErrorModal(
			'Placeholders missing',
			`No placeholders have been added in the header template.

You can use:
• {airline}
• {icao}
• {callsign}
• {author}
• {season}
• {fsx}`
		);
	}
}
