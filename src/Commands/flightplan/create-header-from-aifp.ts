import * as Path from 'path';
import { window, Position, workspace } from 'vscode';
import { showError, showErrorModal } from '../../Tools/helpers';
import { AifpData, readAifpCfg } from '../../Tools/read-aifp';

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

	const matches = template.matchAll(/\{(?:(.*?)(?:\?(.*?))?)\}/gm);

	if (matches) {
		let text = template;

		for (const match of [...matches]) {
			const tagName = match[1] as keyof AifpData;
			let value = data[tagName];
			if (value !== undefined) {
				if (typeof value === 'boolean') {
					value = value.toString().toUpperCase();
				}
				if (tagName === 'fsx') {
					value = `FSXDAYS=${value}`;
				} else if (tagName === 'callsign') {
					value = value.toUpperCase();
				}
			}

			// Is conditional
			if (match[2]) {
				text = text.replace(match[0], value !== undefined ? value + match[2] : '');
			} else {
				text = text.replace(match[0], value || '');
			}
		}

		editor.edit((editBuilder) => {
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
