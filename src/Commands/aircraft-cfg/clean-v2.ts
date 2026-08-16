import * as vscode from 'vscode';
import { replaceDocumentContents } from '../../Tools/helpers';
import { cleanAircraftCfg, CleanAircraftCfgOptions } from '../../Services/cfg-transformations';

export async function CleanAircraftCfg() {
	console.log('CleanAircraftCfg() v2');

	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	const document = editor.document;
	if (document.uri.scheme !== 'file' || !document.uri.path.toLocaleLowerCase().endsWith('aircraft.cfg')) return;

	const config = vscode.workspace.getConfiguration('fs-ai-tools.cleanAircraftCfg', undefined);
	const options: CleanAircraftCfgOptions = {
		removeUnusedLines: config.get<boolean>('removeUnusedLines') ?? false,
		removeUnusedLinesItems: config.get<string[]>('removeUnusedLinesItems') ?? [],
		callsignsUppercase: config.get<boolean>('callsignsUppercase') ?? false,
		renumber: config.get<boolean>('renumber') ?? false,
		sortProperties: config.get<boolean>('sortProperties') ?? false,
		sortPropertiesOrder: config.get<string[]>('sortPropertiesOrder') ?? [],
	};

	await replaceDocumentContents(editor, cleanAircraftCfg(document.getText(), options));
	vscode.window.showInformationMessage('Aircraft.cfg cleaned');
}
