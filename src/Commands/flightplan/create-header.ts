import { window, Position } from 'vscode';
import { getFilename } from '../../Tools/helpers';

export async function CreateFlightplanHeader() {
	console.log('CreateFlightplanHeader()');

	const editor = window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const filename = getFilename(document.uri.path);
		if ('file' === document.uri.scheme && filename.toLocaleLowerCase().startsWith('flightplans')) {
			const filenameTest = filename.split('_');
			let proposedIcao = 'ICAO';
			let proposedName = 'Airline Name';
			console.log('filenameTest', filenameTest);

			if (filenameTest.length > 1) {
				if (filenameTest.length === 3 && filenameTest[1].length <= 4) {
					proposedIcao = filenameTest[1];
					proposedName = filenameTest[2];
					proposedName = proposedName.substring(0, proposedName.length - 4);
				} else if (filenameTest.length === 2) {
					proposedName = filenameTest[1];
					proposedName = proposedName.substring(0, proposedName.length - 4);
				}
				console.log('proposedName', proposedName);
				console.log('proposedIcao', proposedIcao);
			}

			const fsVersion = await getFsVersion();
			const name = await getName(proposedName);
			const icao = await getIcao(proposedIcao);
			const callsign = await getCallsign();
			const author = await getAuthor();
			const season = await getSeason();

			console.log({
				fsVersion,
				name,
				icao,
				callsign,
				author,
				season,
			});
			if (fsVersion && name && author && season) {
				let text = `//FSXDAYS=${fsVersion === 'FS9' ? 'FALSE' : 'TRUE'}\n`;
				text += `//${name.capitalize()}`;
				if (icao || callsign) {
					text += ` | ${icao ? icao.toUpperCase() : ''}`;
					text += ` | "${callsign ? `${callsign.toUpperCase()}` : ''}"`;
				}
				text += '\n';
				text += `//${author.capitalize(true)}, ${season}\n\n`;

				console.log(text);

				editor.edit((editBuilder) => {
					editBuilder.insert(new Position(0, 0), text);
				});
				window.showInformationMessage(`Header for ${name} created`);
			}
		}
	}
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
	const result = await window.showInputBox({
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
	return result;
}
