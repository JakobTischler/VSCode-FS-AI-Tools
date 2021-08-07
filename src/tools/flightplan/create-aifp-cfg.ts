import * as vscode from 'vscode';
import * as path from 'path';
import { showError } from '../../helpers';

export async function CreateAifpCfg() {
	console.log('CreateAifpCfg()');

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const filename = path.basename(document.uri.path).toLocaleLowerCase();
		if ('file' === document.uri.scheme && filename.startsWith('flightplans')) {
			let lines = document.getText().trim().split('\n');
			lines.length = 3;

			// Validation
			for (let [index, line] of lines.entries()) {
				if (!line.length || !line.startsWith('//')) {
					showError(`Line ${index + 1} doesn't start with "//".`);
					return false;
				}
				if (index === 0 && !line.startsWith('//FSXDAYS')) {
					showError(`First line doesn't start with "//FSXDAYS"`);
					return false;
				}
			}

			// -----------------------------------------------------
			// PARSE DATA

			// Remove double slashes
			lines = lines.map((line: string) => line.replace(/^\/*/, '').trim());

			const data: { [key: string]: string } = {
				callsign: '',
			};

			// Line 1
			data.fsVersion = lines[0].split('=')[1] === 'TRUE' ? 'FSX' : 'FS9';

			// Line 2
			let airlineData = trimArrayItems(lines[1].split('|'));
			data.name = airlineData[0] || '';
			data.icao = airlineData[1] || '';
			if (airlineData[2]) {
				data.callsign = airlineData[2].match(/"(.+?)"/i)[1] || '';
			}

			// Line 3
			if (lines[2]) {
				let metaData = trimArrayItems(lines[2].split(','));
				data.author = metaData[0] || '';

				if (metaData[1]) {
					let season = metaData[1].match(/(\w\w)(\d\d)(\d\d)?/);
					data.season = `${season[1] === 'Wi' ? 'Winter' : 'Summer'} 20${season[2]}`;
					if (season[3]) {
						data.season += `-20${season[3]}`;
					}
				}
			}

			const output = `[main]
AIRLINE=${data.name}
AIRLINE_ICAO=${data.icao}
CALLSIGN=${data.callsign}
SEASON=${data.season}
SEEK=atc_airline=${data.callsign}
PROVIDER=${data.author}
FS_Version=${data.fsVersion}
`;
			console.log({ data, output });

			// -----------------------------------------------------
			// CREATE aifp.cfg FILE

			const aifpPath = path.join(path.dirname(document.uri.path), 'aifp.cfg');
			const filePath = vscode.Uri.file(aifpPath);

			let edit = new vscode.WorkspaceEdit();
			edit.createFile(filePath, { ignoreIfExists: true });
			edit.delete(filePath, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(9999, 9999)));
			edit.insert(filePath, new vscode.Position(0, 0), output);
			await vscode.workspace.applyEdit(edit);

			vscode.workspace.openTextDocument(filePath).then((doc: vscode.TextDocument) => {
				doc.save();
				vscode.window.showInformationMessage('aifp.cfg file created');
			});
		}
	}
}

const trimArrayItems = (array: string[]) => array.map((item: any) => item.trim());

const validateEachLine = (array: string[], callback: (arg0: string) => boolean) => {
	for (const line of array) {
		let valid = callback(line);
		if (!valid) {
			return false;
		}
	}
	return true;
};
