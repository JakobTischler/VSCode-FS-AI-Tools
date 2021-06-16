import * as vscode from 'vscode';
import * as path from 'path';
const fs = require('fs');

export async function CreateAircraft() {
	console.log('CreateAircraft()');

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		if ('file' !== document.uri.scheme) {
			return false;
		}

		const config = vscode.workspace.getConfiguration('fs-ai-tools.createAircraft', undefined);

		// -----------------------------------------------------
		// GET LIST OF REGISTRATIONS

		let regs: string[] = [];
		const selections = editor.selections;
		if (!selections) {
			return false;
		}

		for (const selection of selections) {
			let text = document.getText(selection);
			let split = text.split('\n').map((item) => item.trim());
			regs.push(...split);
		}
		// console.log({ regs });

		if (regs.length === 0) {
			vscode.window.showErrorMessage('No selected text found');
			return false;
		}

		// -----------------------------------------------------
		// GET TEMPLATE PATH

		let templatePaths = config.get('templates') as string[];
		if (templatePaths?.length === 0) {
			vscode.window.showErrorMessage('No templates defined');
			return false;
		}

		let templatePathStr = await getTemplate(templatePaths.sort());
		if (!templatePathStr) {
			return false;
		}
		let templatePath = path.parse(templatePathStr);
		const templateDir = templatePath.dir;

		// -----------------------------------------------------
		// GET TEMPLATE CONTENT

		fs.readFile(templatePathStr, 'utf8', (err: string, contents: string) => {
			if (err) {
				console.error(err);
				vscode.window.showErrorMessage(err);
				return false;
			}

			handleTemplate(regs, contents, templateDir);
		});

		/*
		const aifpPath = path.join(path.dirname(document.uri.path), 'aifp.cfg');
		const filePath = vscode.Uri.file(aifpPath);

		let edit = new vscode.WorkspaceEdit();
		// edit.createFile(filePath, { ignoreIfExists: true });
		// edit.delete(filePath, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(9999, 9999)));
		// edit.insert(filePath, new vscode.Position(0, 0), output);
		await vscode.workspace.applyEdit(edit);

		vscode.workspace.openTextDocument(filePath).then((doc: vscode.TextDocument) => {
			doc.save();
			vscode.window.showInformationMessage('aifp.cfg file created');
		});
		*/
	}
}

async function handleTemplate(regs: string[], contents: string, templateDir: string) {
	let operator = (await getTextInput('Operator name')) as string;
	let icao = (await getTextInput('ICAO')) as string;
	let callsign = (await getTextInput('Callsign')) as string;
	let author = (await getTextInput('Author')) as string;

	console.log(contents);

	let fltsimEntries = createFltsimEntries(regs, contents, operator, icao, callsign, author);
	console.log(fltsimEntries);
}

/**
 *
 * @param regs The list of all registrations
 * @param template The content of the template file
 * @param data The user input data
 * @returns The full [fltsim.x] entries text
 */
function createFltsimEntries(regs: string[], template: string, operator: string, icao: string, callsign: string, author: string) {
	/*
	https://regex101.com/r/YjtPK3/1/

	{reg? }			/{reg(?>\??)(.*?)}/g
	{icao?-}		/{icao(?>\??)(.*?)}/g
	{operator}		/{operator(?>\??)(.*?)}/g
	{callsign}		/{callsign(?>\??)(.*?)}/g
	{author}		/{author(?>\??)(.*?)}/g
	var a = template.replace(/\{reg(?>\??)(.*?)\}/g, "NEW-REG" + '$1');
	*/

	const entries: string[] = [];

	for (let [index, reg] of regs.entries()) {
		let text = template
			.replace(/\[fltsim\.(.*?)\]/g, `[fltsim.${index}]`)
			.replace(/{reg(?:\??)(.*?)}/g, reg + '$1')
			.replace(/{operator(?:\??)(.*?)}/g, operator?.length > 0 ? operator + '$1' : '')
			.replace(/{icao(?:\??)(.*?)}/g, icao?.length > 0 ? icao + '$1' : '')
			.replace(/{callsign(?:\??)(.*?)}/g, callsign?.length > 0 ? callsign + '$1' : '')
			.replace(/{author(?:\??)(.*?)}/g, author?.length > 0 ? author + '$1' : '');

		entries.push(text + '\n');
	}

	// TODO use texture=... for folder names?
	// template.match(/texture=(.*)/i)
	// could use map with texture as key
	// Settings: 3er dropdown "Create Folders" → "Create","Don't create","Ask everytime"

	return entries;
}

async function getTemplate(paths: string[]) {
	return await vscode.window.showQuickPick(paths, { canPickMany: false });
}

async function getTextInput(placeholderText: string) {
	return await vscode.window.showInputBox({
		value: '',
		valueSelection: undefined,
		placeHolder: placeholderText,
		prompt: placeholderText,
	});
}
