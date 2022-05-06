import * as Path from 'path';
import { window, Position } from 'vscode';
import { showError } from '../../Tools/helpers';
import { readAifpCfg } from '../../Tools/read-aifp';

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

	if (data.airline && data.author && data.season && data.fsx !== undefined) {
		let text = `//FSXDAYS=${data.fsx?.toString().toUpperCase()}\n`;
		text += `//${data.airline}`;
		if (data.icao || data.callsign) {
			text += ` | ${data.icao ? data.icao.toUpperCase() : '___'}`;
			text += ` | "${data.callsign ? `${data.callsign.toUpperCase()}` : ''}"`;
		}
		text += '\n';
		text += `//${data.author}, ${data.season}\n\n`;

		editor.edit((editBuilder) => {
			editBuilder.insert(new Position(0, 0), text);
		});
		window.showInformationMessage(`Header for ${data.airline} created`);
	}
}
