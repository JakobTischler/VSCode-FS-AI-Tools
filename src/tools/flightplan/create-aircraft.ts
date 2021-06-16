import * as vscode from 'vscode';
import * as path from 'path';
const fs = require('fs');

interface FltsimEntry {
	fltsim: string;
	texture?: string;
}

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

		let templatePathStr = await getDropdownSelection('Select template', templatePaths.sort());
		if (!templatePathStr) {
			return false;
		}
		let templatePath = path.parse(templatePathStr);
		const templateDir = templatePath.dir;

		// -----------------------------------------------------
		// GET TEMPLATE CONTENT AND START CREATION

		fs.readFile(templatePathStr, 'utf8', (err: string, contents: string) => {
			if (err) {
				console.error(err);
				vscode.window.showErrorMessage(err);
				return false;
			}

			handleTemplate(regs, contents, templateDir, config);
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

async function handleTemplate(regs: string[], contents: string, templateDir: string, config: vscode.WorkspaceConfiguration) {
	let operator = (await getTextInput('Operator', "The operator's (airline's) name. Leave empty if not applicable.")) as string;
	let icao = (await getTextInput('ICAO', 'Leave empty if not applicable.')) as string;
	let callsign = (await getTextInput('Callsign', 'Leave empty if not applicable.')) as string;
	let author = (await getTextInput('Author', "The repaint's creator. Leave empty if not applicable.")) as string;

	// TODO open aircraft.cfg, find last fltsim.x entry, use as index start

	// console.log(contents);

	let createFolders = config.get('createFolders') === 'Create';
	if (config.get('createFolders') === 'Ask everytime') {
		let userPick = await getDropdownSelection('Create Texture Folders?', ['Create folders', "Don't create folders"]);
		createFolders = userPick === 'Create folders';
	}

	let fltsimEntries = createFltsimEntries(regs, contents, operator, icao, callsign, author, createFolders);
	console.log(fltsimEntries);

	// CREATE FOLDERS
	if (createFolders) {
		let textureCfgPath = path.join(templateDir, 'texture.cfg');
		let textureCfgExists = fs.existsSync(textureCfgPath);

		for (const entryData of fltsimEntries) {
			if (entryData.texture) {
				let dirName = `texture.${entryData.texture}`;
				let dir = path.join(templateDir, dirName);

				if (!fs.existsSync(dir)) {
					await fs.mkdir(dir, { recursive: true }, (err: any) => {
						if (err) {
							throw err;
						}
					});

					if (config.get('copyTextureCfgToTextureFolder') && textureCfgExists) {
						await fs.copyFile(textureCfgPath, path.join(templateDir, dirName, 'texture.cfg'), (err: any) => {
							if (err) {
								throw err;
							}
						});
					}
				}
			} else {
				// TODO WTF do I do now?
			}
		}
	}
}

/**
 * For a list of `regs`, copy the template and replace placeholders with reg/operator/icao/callsign/author data.
 * @param regs The list of all registrations
 * @param template The content of the template file
 * @param operator The user input "Operator" data
 * @param icao The user input "ICAO" data
 * @param callsign The user input "Callsign" data
 * @param author The user input "Author" data
 * @test https://regex101.com/r/YjtPK3/1/
 * @returns All [fltsim.x] entries in an array
 */
function createFltsimEntries(
	regs: string[],
	template: string,
	operator: string,
	icao: string,
	callsign: string,
	author: string,
	createFolders: boolean = true
) {
	const entries: FltsimEntry[] = [];

	for (let [index, reg] of regs.entries()) {
		let text = template
			.replace(/\[fltsim\..*?\]/g, `[fltsim.${index}]`)
			.replace(/{reg(?:\??)(.*?)}/g, reg + '$1')
			.replace(/{operator(?:\??)(.*?)}/g, operator?.length > 0 ? operator + '$1' : '')
			.replace(/{icao(?:\??)(.*?)}/g, icao?.length > 0 ? icao + '$1' : '')
			.replace(/{callsign(?:\??)(.*?)}/g, callsign?.length > 0 ? callsign + '$1' : '')
			.replace(/{author(?:\??)(.*?)}/g, author?.length > 0 ? author + '$1' : '');

		let texture;
		if (createFolders) {
			let textureMatch = text.match(/texture=(.*)(?:\n|\r)/i);
			if (textureMatch && textureMatch[1]) {
				texture = textureMatch[1];
			}
			// TODO what if there's no texture match? Skip folder creation?
		}

		entries.push({ fltsim: text + '\n', texture: texture });
	}

	return entries;
}

async function getDropdownSelection(title: string, items: string[]) {
	return await vscode.window.showQuickPick(items, { title: title, canPickMany: false, ignoreFocusOut: true });
}

async function getTextInput(placeholderText: string, prompt?: string) {
	return await vscode.window.showInputBox({
		value: '',
		valueSelection: undefined,
		placeHolder: placeholderText,
		prompt: prompt ? prompt : placeholderText,
		ignoreFocusOut: true,
	});
}
