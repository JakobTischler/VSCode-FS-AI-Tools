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
		validateInput: (text) => {
			// window.showInformationMessage(`Validating "${text}"`);
			if (text === '0') {
				return 'Maybe a little more?';
			}
			if (isNaN(Number(text))) {
				return "This isn't a number";
			}
			return null;
		},
	});
	window.showInformationMessage(`Got: ${result}`);
	// });
}

/**
 * Creates a dropdown (`showQuickPick`) with custom items and asynchronously returns the value selected by the user.
 * @param title The dropdown's title
 * @param items An array of the selectable dropdown items as strings
 * @param canPickMany If `true`, multiple values can be selected. Default: `false`
 * @param ignoreFocusOut If `true`, the dropdown stays open when clicking somewhere else. Default: `true`
 * @returns The value selected by the user as string, or `undefined` if cancelled by user.
 */
export async function getDropdownSelection(title: string, items: string[], canPickMany = false, ignoreFocusOut = true) {
	return await window.showQuickPick(items, {
		title,
		canPickMany,
		ignoreFocusOut,
	});
}

/**
 * Creates an input box (`showInputBox`) with a custom placeholder and prompt text and asynchronously returns the entered value.
 * @param placeholderText The placeholder text inside the input box
 * @param prompt The hint text under the box
 * @returns The entered value
 */
export async function getTextInput(placeholderText: string, prompt?: string, value = '') {
	return await window.showInputBox({
		value: value,
		valueSelection: undefined,
		placeHolder: placeholderText,
		prompt: prompt ? prompt : placeholderText,
		ignoreFocusOut: true,
	});
}

export async function getNumberInput(value = '1', placeholderText: string) {
	const result = await window.showInputBox({
		value: value,
		valueSelection: undefined,
		placeHolder: placeholderText,
		prompt: placeholderText,
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
			if (Number(text) <= 0) {
				return 'Must be greater than zero';
			}
			if (text.search(/\./) >= 0) {
				return 'Number must not have decimals';
			}
			return null;
		},
	});
	return Number(result);
}
