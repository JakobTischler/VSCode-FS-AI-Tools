import * as vscode from 'vscode';
import * as Path from 'path';
import * as fs from 'fs';
import { getFileContents, showError, writeTextToClipboard } from '../../Tools/helpers';
import { getDropdownSelection, getTextInput } from '../../Tools/input';
import { AifpData, readAifpCfg } from '../../Tools/read-aifp';

interface FltsimEntry {
	fltsim: string;
	texture?: string;
	title?: string;
}

export async function CreateAircraft() {
	console.log('CreateAircraft()');

	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return false;
	}
	const document = editor.document;
	if (!['file', 'untitled'].includes(document.uri.scheme)) {
		return false;
	}

	const config = vscode.workspace.getConfiguration('fs-ai-tools.createAircraft', undefined);

	// -----------------------------------------------------
	// GET LIST OF REGISTRATIONS
	const regs: string[] = [];
	const selections = editor.selections;
	if (!selections) {
		return false;
	}

	for (const selection of selections) {
		const text = document.getText(selection);
		text.split('\n').forEach((item: string) => {
			item = item.trim();
			if (item?.length) {
				if (item.startsWith('AC#')) {
					const commaSplit = item.split(',');
					if (commaSplit?.length > 6 && commaSplit[1]) {
						// Flightplans.txt
						const reg = commaSplit[1];
						if (reg?.length) {
							regs.push(reg);
						}
					}
				} else if (item.length <= 7 && !item.startsWith('//')) {
					regs.push(item);
				}
			}
		});
	}
	// console.log({ regs });

	if (regs.length === 0) {
		showError('No valid registrations found');
		return false;
	}

	// -----------------------------------------------------
	// GET TEMPLATE PATH AND CONTENT
	const templatePaths = config.get('templates') as string[];
	if (templatePaths?.length === 0) {
		showError('No templates defined');
		return false;
	}

	const templatePathStr = await getDropdownSelection('Select template', templatePaths.sort());
	if (!templatePathStr) {
		return false;
	}

	const templatePath = Path.parse(templatePathStr);
	const __WORKDIR__ = templatePath.dir;
	let template = (await getFileContents(templatePathStr)) as string;

	// Clean up template
	template = template
		.trim()
		.split('\n')
		.map((line) => line.trim())
		.join('\n');

	// -----------------------------------------------------
	// READ AIRCRAFT.CFG TO GET LAST FLTSIM.X
	const aircraftCfgPath = Path.join(__WORKDIR__, 'aircraft.cfg');
	if (!fs.existsSync(aircraftCfgPath)) {
		showError(`aircraft.cfg file couldn't be found in "${__WORKDIR__}"`);
	}
	const aircraftCfgContents = (await getFileContents(aircraftCfgPath)) as string;
	const fltsimXMatches = aircraftCfgContents.match(/\[fltsim\.(\d+)\]/gi);
	let startIndex = 0;
	if (fltsimXMatches) {
		// console.log(fltsimXMatches, fltsimXMatches[fltsimXMatches.length - 1]);
		const last = fltsimXMatches[fltsimXMatches.length - 1];
		const match = last.match(/\[fltsim\.(\d+)\]/i);
		if (match?.[1]) {
			startIndex = Number(match[1]) + 1;
		}
		console.log({ last, match, startIndex });
	}

	// -----------------------------------------------------
	// READ AIFP.CFG DATA TO PRE-FILL INPUTS
	const aifpCfgPath = Path.join(Path.dirname(editor.document.uri.path), 'aifp.cfg');
	const aifpCfgData = await readAifpCfg(aifpCfgPath);

	// -----------------------------------------------------
	// CREATE FLTSIM ENTRIES
	let createFolders = config.get('createFolders') === 'Create';
	if (config.get('createFolders') === 'Ask everytime') {
		const userPick = await getDropdownSelection('Create Texture Folders?', [
			'Create folders',
			"Don't create folders",
		]);
		createFolders = userPick === 'Create folders';
	}
	const fltsimEntries = await createFltsimEntries(regs, template, aifpCfgData, startIndex, createFolders);
	console.log(fltsimEntries);
	if (fltsimEntries === null) {
		vscode.window.showInformationMessage(`"Create aircraft" cancelled`);
		return false;
	}

	// -----------------------------------------------------
	// APPEND ENTRIES TO AIRCRAFT.CFG
	const fltsimEntriesText = '\n\n' + [...fltsimEntries.map((entry) => entry.fltsim)].join('\n\n') + '\n';
	fs.appendFile(aircraftCfgPath, fltsimEntriesText, 'utf8', (err: any) => {
		if (err) {
			throw err;
		}
	});

	// -----------------------------------------------------
	// COPY TITLES TO CLIPBOARD
	if (config.get('copyTitlesToClipboard')) {
		const titles = fltsimEntries
			.map((entry) => entry.title)
			.filter((title) => title && title.length > 0)
			.join('\n');
		writeTextToClipboard(titles);
	}

	// -----------------------------------------------------
	// CREATE FOLDERS
	if (createFolders) {
		const textureCfgPath = Path.join(__WORKDIR__, 'texture.cfg');
		const textureCfgExists = fs.existsSync(textureCfgPath);

		for (const entryData of fltsimEntries) {
			if (entryData.texture) {
				const dirName = `texture.${entryData.texture}`;
				const dir = Path.join(__WORKDIR__, dirName);

				if (!fs.existsSync(dir)) {
					await fs.mkdir(dir, { recursive: true }, (err: any) => {
						if (err) {
							throw err;
						}
					});

					if (config.get('copyTextureCfgToTextureFolder') && textureCfgExists) {
						await fs.copyFile(
							textureCfgPath,
							Path.join(__WORKDIR__, dirName, 'texture.cfg'),
							(err: any) => {
								if (err) {
									throw err;
								}
							}
						);
					}
				}
			} else {
				// TODO WTF do I do now?
			}
		}
	}

	// -----------------------------------------------------
	// SUCCESS MESSAGE
	let msg = `${'entry'.plural(regs.length, 'entries')} created`;
	if (config.get('copyTitlesToClipboard')) {
		msg += ` and ${'title'.plural(regs.length)} copied`;
	}
	vscode.window.showInformationMessage(msg);
}

/**
 * For a list of `regs`, copy the template and replace placeholders with
 * reg/operator/icao/callsign/author data.
 *
 * @param regs The list of all registrations
 * @param template The content of the template file
 * @param operator The user input "Operator" data
 * @param icao The user input "ICAO" data
 * @param callsign The user input "Callsign" data
 * @param author The user input "Author" data
 * @test https://regex101.com/r/YjtPK3/1/
 * @returns All [fltsim.x] entries in an array
 */
async function createFltsimEntries(
	regs: string[],
	template: string,
	aifpCfgData: AifpData,
	startIndex = 0,
	createFolders = true
) {
	const entries: FltsimEntry[] = [];

	const operator = (await getTextInput(
		'Operator',
		'Operator (airline). Leave empty if not applicable.',
		aifpCfgData.airline || ''
	)) as string;
	if (operator === undefined) {
		return null;
	}
	const icao = (await getTextInput('ICAO', 'ICAO. Leave empty if not applicable.', aifpCfgData.icao || '')) as string;
	if (icao === undefined) {
		return null;
	}
	const callsign = (await getTextInput(
		'Callsign',
		'Callsign. Leave empty if not applicable.',
		aifpCfgData.callsign || ''
	)) as string;
	if (callsign === undefined) {
		return null;
	}
	const author = (await getTextInput('Author', 'Repaint creator. Leave empty if not applicable.')) as string;
	if (author === undefined) {
		return null;
	}

	let index = startIndex;
	for (const reg of regs) {
		let text = template
			.replace(/\[fltsim\..*?\]/g, `[fltsim.${index}]`)
			.replace(/{reg(?:\??)(.*?)}/g, `${reg}$1`)
			.replace(/{operator(?:\??)(.*?)}/g, operator?.length > 0 ? `${operator}$1` : '')
			.replace(/{icao(?:\??)(.*?)}/g, icao?.length > 0 ? `${icao}$1` : '')
			.replace(/{callsign(?:\??)(.*?)}/g, callsign?.length > 0 ? `${callsign}$1` : '')
			.replace(/{author(?:\??)(.*?)}/g, author?.length > 0 ? `${author}$1` : '');

		// Trim each line
		text = text
			.split('\n')
			.map((line) => line.trim())
			.join('\n');

		let texture;
		if (createFolders) {
			const textureMatch = text.match(/texture=(.*)(?:\n|\r)/i);
			if (textureMatch?.[1]) {
				texture = textureMatch[1].trim();
			}
			// TODO what if there's no texture match? Skip folder creation?
		}

		let title = '';
		const titleMatch = text.match(/title=(.*)(?:\n|\r)/i);
		if (titleMatch?.[1]) {
			title = titleMatch[1];
		}

		entries.push({ fltsim: text, texture: texture, title: title });

		index++;
	}

	return entries;
}
