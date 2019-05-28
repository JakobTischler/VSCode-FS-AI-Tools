import { window } from 'vscode';

/**
 * Shows an input box using window.showInputBox().
 * @source [VSCode Extension Samples](https://github.com/Microsoft/vscode-extension-samples/blob/master/quickinput-sample/src/basicInput.ts)
 */
export async function showInputBox() {
	// return new Promise(async function(resolve, reject) {
	const result = await window.showInputBox({
		value: '10',
		valueSelection: [2, 4],
		placeHolder: 'The amount to change. Can be positive or negative.',
		validateInput: text => {
			// window.showInformationMessage(`Validating "${text}"`);
			if (text === '0') {
				return 'Maybe a little more?';
			}
			if (isNaN(Number(text))) {
				return "This isn't a number";
			}
			return null;
		}
	});
	window.showInformationMessage(`Got: ${result}`);
	// });
}
