import { window } from 'vscode';
import { getFilename } from '../../Tools/helpers';

export async function ChangeAircraftNumber() {
	const editor = window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const filename = getFilename(document.uri.path).toLocaleLowerCase();
		if ('file' === document.uri.scheme && (filename.startsWith('aircraft') || filename.startsWith('flightplans'))) {
			const change = await getChangeInput();
			if (change) {
				const selection = editor.selection;
				let text = document.getText(selection);
				text = text.replace(/#(\d+)/gi, (fullMatch, num) => {
					return '#' + (Number(num) + Number(change));
				});
				editor.edit((editBuilder) => {
					editBuilder.replace(selection, text);
				});
				window.showInformationMessage(`Selected AC#s changed by ${change}`);
			}
		}
	}
}

/**
 * Shows an input box using window.showInputBox().
 * @source [VSCode Extension Samples](https://github.com/Microsoft/vscode-extension-samples/blob/master/quickinput-sample/src/basicInput.ts)
 */
async function getChangeInput() {
	// return new Promise(async function(resolve, reject) {
	const result = await window.showInputBox({
		value: '10',
		valueSelection: undefined,
		placeHolder: 'The amount to change. Can be positive or negative.',
		validateInput: (text) => {
			// window.showInformationMessage(`Validating "${text}"`);
			if (text.length === 0) {
				return 'Anything? Anything at all?!';
			}
			if (text === '0') {
				return 'Maybe a little more?';
			}
			if (isNaN(Number(text))) {
				return "This isn't a number";
			}
			return null;
		},
	});
	return result;
	// });
}
