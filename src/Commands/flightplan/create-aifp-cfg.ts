import path from 'path';
import { Position, Range, TextDocument, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { showError } from '../../Tools/helpers';
import { AifpData } from '../../Tools/read-aifp';

export async function CreateAifpCfg() {
	console.log('CreateAifpCfg()');

	const editor = window.activeTextEditor;
	if (!editor) return;

	const template = workspace
		.getConfiguration('fs-ai-tools.createFlightplanHeader', undefined)
		.get('template') as string;

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 * CREATE REGEXP FROM TEMPLATE
	 */
	const completeRegex: string[] = [];

	for (const line of template.split('\n')) {
		const matches = [...line.matchAll(/\{(?:(.*?)(?:\?(.*?))?)\}/gm)];
		let lineRegex = line;

		if (matches?.length) {
			for (const match of [...matches]) {
				const tagName = match[1];

				let tagRegex = `(?<${tagName}>.*)`;
				if (match[2]) {
					tagRegex += `(?:${match[2]})`;
				}

				lineRegex = lineRegex.replace(match[0], tagRegex);
			}
		}

		completeRegex.push(lineRegex);
	}

	let regex = completeRegex.join('[\\r\\n]*');
	regex = regex.replace(/[\|\/]/g, '\\$&'); // $& means the whole matched string
	const regexp = new RegExp(regex, 'gm');

	console.log({ completeRegex, regex, regexp });

	// Use created regexp to gather data
	const matches = [...editor.document.getText().matchAll(regexp)];
	const match = matches?.[0];
	console.log({ matches });
	if (!match?.length) {
		showError(`No text matching the header template could be found.`, true);
		return;
	}

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 * PARSED DATA
	 */
	const data: AifpData = {
		found: true,
		airline: match.groups!.airline || undefined,
		icao: match.groups!.icao || undefined,
		callsign: match.groups!.callsign || undefined,
		author: match.groups!.author || undefined,
		fsx: false,
	};

	// FS version
	if (match.groups!.fsx) {
		data.fsx = match.groups!.fsx.toLowerCase() === 'fsxdays=true';
	}

	// Season: short to long
	const seasonMatch = match.groups!.season?.match(/(\w\w)(\d\d)(\d\d)?/);
	if (seasonMatch) {
		data.season = `${seasonMatch[1] === 'Wi' ? 'Winter' : 'Summer'} 20${seasonMatch[2]}`;
		if (seasonMatch[3]) {
			data.season += `-20${seasonMatch[3]}`;
		}
	}

	const output = `[main]
AIRLINE=${data.airline || ''}
AIRLINE_ICAO=${data.icao || ''}
CALLSIGN=${data.callsign || ''}
SEASON=${data.season || ''}
SEEK=atc_airline=${data.callsign || ''}
PROVIDER=${data.author || ''}
FS_Version=${data.fsx ? 'FSX' : 'FS9'}
`;
	console.log({ data, output });

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 * CREATE aifp.cfg FILE
	 */

	const aifpPath = path.join(path.dirname(editor.document.uri.path), 'aifp.cfg');
	const filePath = Uri.file(aifpPath);

	const edit = new WorkspaceEdit();
	edit.createFile(filePath, { ignoreIfExists: true });
	edit.replace(filePath, new Range(new Position(0, 0), new Position(9999, 9999)), output);
	await workspace.applyEdit(edit);

	workspace.openTextDocument(filePath).then((doc: TextDocument) => {
		doc.save();
		window.showInformationMessage('aifp.cfg file created');
	});
}

/**
 * Trims all whitespace from a string array's items.
 * @param {string[]} array - The array to trim
 */
const trimArrayItems = (array: string[]) => array.map((item: string) => item.trim());
