import { Range, window, workspace } from 'vscode';
import { getFilename, showError } from '../../Tools/helpers';
import { getNumberInput } from '../../Tools/input';
import { rebaseAircraftNumbers } from '../../Services/flightplan-transformations';

export async function RebaseAircraftNumbers() {
	const editor = window.activeTextEditor;
	if (!editor) return;

	const { document, selection } = editor;
	const filename = getFilename(document.uri.path).toLocaleLowerCase();
	const isAircraftTxt = filename.startsWith('aircraft');
	const isFlightplansTxt = filename.startsWith('flightplans');
	if (document.uri.scheme !== 'file' || (!isAircraftTxt && !isFlightplansTxt)) return;

	const text = document.getText(!selection.isEmpty ? selection : undefined);
	const existingStartNumber = text.match(/AC#(\d+)/i)?.[1];
	if (!existingStartNumber) {
		showError('No existing AC# found.', true);
		return false;
	}

	const start = await getNumberInput(existingStartNumber, 'The new starting AC#. Must be > 0.');
	const groupStep = await getNumberInput('10', 'The step size between groups (separated by empty lines). Must be > 0.');
	const itemStep = await getNumberInput('1', 'The step size between AC#s within groups. Must be > 0.');
	if (!(start && groupStep && itemStep)) return false;

	const config = workspace.getConfiguration('fs-ai-tools.rebaseAircraftNumbers', undefined);
	const emptyLinesBetweenGroups = Number(
		config.get(isAircraftTxt ? 'emptyLinesBetweenGroupsAircraftTxt' : 'emptyLinesBetweenGroupsFlightplansTxt')
	);
	const newText = rebaseAircraftNumbers(text, {
		start,
		groupStep,
		itemStep,
		emptyLinesBetweenGroups,
		kind: isAircraftTxt ? 'aircraft' : 'flightplans',
	});
	const range = !selection.isEmpty
		? selection
		: new Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end);

	await editor.edit((editBuilder) => editBuilder.replace(range, newText));
	window.showInformationMessage(`Selected AC#s rebased to ${start}`);
}
