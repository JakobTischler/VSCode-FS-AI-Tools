import { Range, window } from 'vscode';
import * as path from 'path';
import { convertHourlyFlightplansToWeek } from '../../Services/flightplan-domain-service';

export async function HoursToWeek() {
	const editor = window.activeTextEditor;
	if (!editor) return;
	const { document, selection } = editor;
	if (document.uri.scheme !== 'file' || !path.basename(document.uri.path).toLowerCase().startsWith('flightplans')) return;

	const result = convertHourlyFlightplansToWeek(document.getText(!selection.isEmpty ? selection : undefined));
	const range = !selection.isEmpty
		? selection
		: new Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end);
	const applied = await editor.edit((builder) => builder.replace(range, result.text));
	if (!applied) throw new Error(`VS Code could not update "${document.fileName}".`);
	window.showInformationMessage(`${'flightplan line'.plural(result.converted)} converted`);
}
