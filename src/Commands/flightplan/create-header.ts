import { window, Position, workspace } from 'vscode';
import { getFilename, showErrorModal } from '../../Tools/helpers';
import { AifpData } from '../../Tools/read-aifp';
import { getHeaderDefaults, renderFlightplanHeader } from '../../Services/flightplan-domain-service';

export async function CreateFlightplanHeader() {
	console.log('CreateFlightplanHeader()');

	const editor = window.activeTextEditor;
	if (!editor?.document) return;

	let airlineName;

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 * Get proposed values from filename
	 */
	const defaults = getHeaderDefaults(getFilename(editor));

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

	const data: Partial<AifpData> = {};

	for (const match of matches) {
		const tagName = match[1] as keyof AifpData;
		let value = '';
		if (tagName === 'airline') {
			value = (await getName(defaults.airline)) || '';
			airlineName = value;
			data.airline = value;
		} else if (tagName === 'icao') {
			value = (await getIcao(defaults.icao)) || '';
			data.icao = value;
		} else if (tagName === 'callsign') {
			value = (await getCallsign())?.toUpperCase() || '';
			data.callsign = value;
		} else if (tagName === 'author') {
			value = (await getAuthor()) || '';
			data.author = value;
		} else if (tagName === 'season') {
			value = (await getSeason()) || '';
			data.season = value;
		} else if (tagName === 'fsx') {
			const input = await getFsVersion();
			data.fsx = input !== 'FS9';
		}
	}
	const text = renderFlightplanHeader(template, data);

	console.log({ template, text });

	await editor.edit((editBuilder) => {
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
