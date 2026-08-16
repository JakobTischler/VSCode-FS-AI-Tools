import { Range, window, workspace } from 'vscode';
import { countAircraftGroups } from '../../Services/flightplan-transformations';

export async function CountAircraft() {
	const editor = window.activeTextEditor;
	if (!editor) return;

	const { document, selection } = editor;
	const text = document.getText(!selection.isEmpty ? selection : undefined);
	const emptyLinesBetweenGroups = Number(
		workspace.getConfiguration('fs-ai-tools.countAircraft', undefined).get('emptyLinesBetweenGroups') || 1
	);
	const result = countAircraftGroups(text, emptyLinesBetweenGroups);
	const range = !selection.isEmpty
		? selection
		: new Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end);

	await editor.edit((editBuilder) => editBuilder.replace(range, result.text));
	window.showInformationMessage(`Aircraft counted (${result.total} total, with ${result.groups} different types)`);
}
