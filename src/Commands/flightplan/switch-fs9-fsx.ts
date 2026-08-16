import { window } from 'vscode';
import { getFilename } from '../../Tools/helpers';
import { getDropdownSelection } from '../../Tools/input';
import { switchSimulatorDays } from '../../Utils/flightplan-transformations';

export async function SwitchFS9FSX() {
	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	const document = editor.document;
	if ('file' !== document.uri.scheme) {
		return;
	}

	const filename = getFilename(document.uri.path).toLocaleLowerCase();
	if (!filename.startsWith('flightplans')) {
		return;
	}

	const selection = editor.selection;
	const text = document.getText(selection);

	// Get direction
	const dirStr = await getDropdownSelection('Select switch direction', ['FS9 → FSX', 'FSX → FS9']);
	if (!dirStr) {
		return false;
	}
	const toFS9 = dirStr === 'FSX → FS9';

	const result = switchSimulatorDays(text, toFS9);

	await editor.edit((editBuilder) => {
		editBuilder.replace(selection, result.text);
	});

	const from = toFS9 ? 'FSX' : 'FS9';
	const to = toFS9 ? 'FS9' : 'FSX';
	window.showInformationMessage(`${'flightplan'.plural(result.changed)} changed from ${from} to ${to}`);
}
