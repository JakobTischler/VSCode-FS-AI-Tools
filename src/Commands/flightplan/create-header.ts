import { window, Position, workspace } from 'vscode';
import { getFilename, showErrorModal } from '../../Tools/helpers';
import { AifpData } from '../../Tools/read-aifp';

export async function CreateFlightplanHeader() {
	console.log('CreateFlightplanHeader()');

	const editor = window.activeTextEditor;
	if (!editor?.document) return;

	let airlineName;

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 * Get proposed values from filename
	 */
	const filename = getFilename(editor);
	const filenameTest = filename.split('_');
	let proposedIcao = 'ICAO';
	let proposedName = 'Airline Name';

	if (filenameTest.length > 1) {
		if (filenameTest.length === 3 && filenameTest[1].length <= 4) {
			proposedIcao = filenameTest[1];
			proposedName = filenameTest[2];
			proposedName = proposedName.substring(0, proposedName.length - 4);
		} else if (filenameTest.length === 2) {
			proposedName = filenameTest[1];
			proposedName = proposedName.substring(0, proposedName.length - 4);
		}
		console.log({ proposedName, proposedIcao });
	}

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 * Parse template, get input values
	 */
	const template = workspace
		.getConfiguration('fs-ai-tools.createFlightplanHeader', undefined)
		.get('template') as string;
	if (!template?.length) {
		showErrorModal(
			'Template not defined',
			`The header template has not been defined in "fs-ai-tools.createFlightplanHeader.template".

You can use:
• {airline}
• {icao}
• {callsign}
• {author}
• {season}
• {fsx}`
		);
		return;
	}

	const matches = [...template.matchAll(/\{(?:(.*?)(?:\?(.*?))?)\}/gm)];

	let text = template;

	for (const match of matches) {
		const tagName = match[1] as keyof AifpData;
		let value = '';
		if (tagName === 'airline') {
			value = (await getName(proposedName)) || '';
			airlineName = value;
		} else if (tagName === 'icao') {
			value = (await getIcao(proposedIcao)) || '';
		} else if (tagName === 'callsign') {
			value = (await getCallsign())?.toUpperCase() || '';
		} else if (tagName === 'author') {
			value = (await getAuthor()) || '';
		} else if (tagName === 'season') {
			value = (await getSeason()) || '';
		} else if (tagName === 'fsx') {
			const input = await getFsVersion();
			value = `FSXDAYS=${input === 'FS9' ? 'FALSE' : 'TRUE'}`;
		}

		if (value.length && match[2]) value += match[2];

		text = text.replace(match[0], value?.length ? value : '');
	}

	console.log({ template, text });

	editor.edit((editBuilder) => {
		editBuilder.insert(new Position(0, 0), text);
	});
	window.showInformationMessage(`Header for ${airlineName || 'airline'} created`);
}

/**
 * Shows a pick list using window.showQuickPick().
 * @source [VSCode Extension Samples](https://github.com/Microsoft/vscode-extension-samples/blob/master/quickinput-sample/src/basicInput.ts)
 */
async function getFsVersion() {
	return await window.showQuickPick(['FS9', 'FSX'], {
		placeHolder: 'FS9 or FSX',
	});
}

async function getName(proposedName: string) {
	return await window.showInputBox({
		value: proposedName,
		valueSelection: undefined,
		placeHolder: "The airline's name",
		validateInput: (text) => {
			if (text.length === 0) {
				return 'Surely there must be a name!';
			}
			return null;
		},
	});
}

async function getIcao(proposedIcao: string) {
	return await window.showInputBox({
		value: proposedIcao,
		valueSelection: undefined,
		placeHolder: "The airline's ICAO code",
		validateInput: (text) => {
			if (text.length > 4) {
				return 'The usual limit is four characters';
			}
			return null;
		},
	});
}

async function getCallsign() {
	return await window.showInputBox({
		value: 'Callsign',
		valueSelection: undefined,
		placeHolder: "The airline's callsign",
	});
}
async function getAuthor() {
	return await window.showInputBox({
		value: 'Author Name',
		valueSelection: undefined,
		placeHolder: "The flightplan's author",
		validateInput: (text) => {
			if (text.length === 0) {
				return 'Surely there must be a name!';
			}
			return null;
		},
	});
}

async function getSeason() {
	const re = /(Su|Wi)\d{2,4}/g;
	return await window.showInputBox({
		value: 'Season',
		valueSelection: undefined,
		placeHolder: "The flightplan's season (Su19 or Wi1718)",
		validateInput: (text) => {
			if (!text.match(re)) {
				return 'The season should be in the format "Su19" or "Wi1718"';
			}
			return null;
		},
	});
}
