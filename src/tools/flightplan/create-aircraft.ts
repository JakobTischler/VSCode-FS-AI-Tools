import * as vscode from 'vscode';
import * as path from 'path';
import { plural } from '../../helpers';
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
		// GET TEMPLATE PATH AND CONTENT
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
		const __WORKDIR__ = templatePath.dir;
		const template = (await getFileContents(templatePathStr)) as string;

		// -----------------------------------------------------
		// READ AIRCRAFT.CFG TO GET LAST FLTSIM.X
		const aircraftCfgPath = path.join(__WORKDIR__, 'aircraft.cfg');
		if (!fs.existsSync(aircraftCfgPath)) {
			console.error(`aircraft.cfg file couldn't be found in "${__WORKDIR__}"`);
			vscode.window.showErrorMessage(`aircraft.cfg file couldn't be found in "${__WORKDIR__}"`);
		}
		const aircraftCfgContents = (await getFileContents(aircraftCfgPath)) as string;
		const fltsimXMatches = aircraftCfgContents.match(/\[fltsim\.(\d+)\]/gi);
		let startIndex = 0;
		if (fltsimXMatches) {
			// console.log(fltsimXMatches, fltsimXMatches[fltsimXMatches.length - 1]);
			let last = fltsimXMatches[fltsimXMatches.length - 1];
			let match = last.match(/\[fltsim\.(\d+)\]/i);
			if (match && match[1]) {
				startIndex = Number(match[1]) + 1;
			}
			console.log({ last, match, startIndex });
		}

		// -----------------------------------------------------
		// CREATE FLTSIM ENTRIES
		let createFolders = config.get('createFolders') === 'Create';
		if (config.get('createFolders') === 'Ask everytime') {
			const userPick = await getDropdownSelection('Create Texture Folders?', ['Create folders', "Don't create folders"]);
			createFolders = userPick === 'Create folders';
		}
		const fltsimEntries = await createFltsimEntries(regs, template, startIndex, createFolders);
		console.log(fltsimEntries);

		// -----------------------------------------------------
		// APPEND ENTRIES TO AIRCRAFT.CFG
		// fs.appendFile(path, data[, options], callback)
		// TODO

		// -----------------------------------------------------
		// CREATE FOLDERS
		if (createFolders) {
			const textureCfgPath = path.join(__WORKDIR__, 'texture.cfg');
			const textureCfgExists = fs.existsSync(textureCfgPath);

			for (const entryData of fltsimEntries) {
				if (entryData.texture) {
					const dirName = `texture.${entryData.texture}`;
					const dir = path.join(__WORKDIR__, dirName);

					if (!fs.existsSync(dir)) {
						await fs.mkdir(dir, { recursive: true }, (err: any) => {
							if (err) {
								throw err;
							}
						});

						if (config.get('copyTextureCfgToTextureFolder') && textureCfgExists) {
							await fs.copyFile(textureCfgPath, path.join(__WORKDIR__, dirName, 'texture.cfg'), (err: any) => {
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

		vscode.window.showInformationMessage(plural(regs.length, 'entry', 'entries') + ' created');
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
async function createFltsimEntries(regs: string[], template: string, startIndex: number = 0, createFolders: boolean = true) {
	const entries: FltsimEntry[] = [];

	const operator = (await getTextInput('Operator', "The operator's (airline's) name. Leave empty if not applicable.")) as string;
	const icao = (await getTextInput('ICAO', 'Leave empty if not applicable.')) as string;
	const callsign = (await getTextInput('Callsign', 'Leave empty if not applicable.')) as string;
	const author = (await getTextInput('Author', "The repaint's creator. Leave empty if not applicable.")) as string;

	let index = startIndex;
	for (let reg of regs) {
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

		index++;
	}

	return entries;
}

async function getFileContents(path: string, encoding: string = 'utf8') {
	return await fs.promises.readFile(path, encoding).catch((err: any) => {
		console.error(`Failed to read file at "${path}"`, err);
		vscode.window.showErrorMessage(`Failed to read file at "${path}": ${err}`);
	});
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
