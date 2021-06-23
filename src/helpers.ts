import { env, window } from 'vscode';

export function replacePartAtPos(str: string, position: number, length: number, newText: string): string {
	const before = str.substr(0, position);
	const after = str.substr(position + length, str.length);
	return before + newText + after;
}

/**
 * Returns a random integer between (and including) `min` and `max`.
 * @param min The lower end of the possible range.
 * @param max The upper end of the possible range.
 */
export function getRandomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min)) + min;
}

export function padNumber(num: number, width: number, z: string = '0'): string {
	const n = num + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

export function getFilenameFromPath(path: string): string {
	return path.replace(/^.*[\\\/]/, '');
}

/**
 * Capitalizes the string's first character.
 * @param text The string to be capitalized.
 * @param all If true, _all_ words in the string will be capitalized.
 */
export function capitalize(text: string, all: boolean = false): string {
	if (all) {
		return text.replace(/\w\S*/g, (word) => capitalize(word));
	}
	return text.replace(/^\w/, (c) => c.toUpperCase());
}

const arrayMoveMutate = (array: any[], from: number, to: number) => {
	const startIndex = to < 0 ? array.length + to : to;
	const item = array.splice(from, 1)[0];
	array.splice(startIndex, 0, item);
};
/**
 * Move an array item to a different position
 * @param array
 * @param from Index of item to move. If negative, it will begin that many elements from the end.
 * @param to Index of where to move the item. If negative, it will begin that many elements from the end.
 * @source [[npm] array-move](https://www.npmjs.com/package/array-move)
 */
export function arrayMove(array: any[], from: number, to: number): any[] {
	array = array.slice();
	arrayMoveMutate(array, from, to);
	return array;
}

export function roundUpToNearest(num: number, nearest: number = 10): number {
	return Math.ceil((num + 1) / nearest) * nearest;
}

/**
 * Returns a string "number word", with "word" being either singular or plural depending on the number.
 * @param num The number to be used for calculation
 * @param singleWord The word if the number is 1
 * @param pluralWord The word if the number is not 1. If not supplied, `singleWord` + "s" will be used
 * @returns A string with "number word"
 */
export function plural(num: number, singleWord: string, pluralWord?: string) {
	if (num === 1) {
		return `${num} ${singleWord}`;
	} else if (pluralWord) {
		return `${num} ${pluralWord}`;
	}
	return `${num} ${singleWord}s`;
}

/**
 * Writes the provided text to the user's clipboard
 * @param text The text to be written to the clipboard
 * @param message The optional success message to be shown
 */
export const writeTextToClipboard = (text: string, message?: string) => {
	env.clipboard.writeText(text).then(() => {
		if (message && message.length > 0) {
			window.showInformationMessage(message);
		}
	});
};

/**
 * Creates a dropdown (`showQuickPick`) with custom items and asynchronously returns the value selected by the user.
 * @param title The dropdown's title
 * @param items An array of the selectable dropdown items as strings
 * @param canPickMany If `true`, multiple values can be selected. Default: `false`
 * @param ignoreFocusOut If `true`, the dropdown stays open when clicking somewhere else. Default: `true`
 * @returns The value selected by the user as string, or `undefined` if cancelled by user.
 */
export async function getDropdownSelection(title: string, items: string[], canPickMany: boolean = false, ignoreFocusOut: boolean = true) {
	return await window.showQuickPick(items, { title: title, canPickMany: canPickMany, ignoreFocusOut: ignoreFocusOut });
}

/**
 * Simple number loop with step size of 1 / -1. Returns the next value in the loop.
 * @param num Initial number
 * @param min Minimum bounds of loop
 * @param max Maximum bounds of loop
 * @param dir Loop direction (1 or -1)
 * @returns Returns the next value in the loop based on direction
 */
export function loopNumber(num: number, min: number, max: number, dir: 1 | -1 = 1) {
	let ret = num + dir;
	if (ret < min) {
		return max;
	} else if (ret > max) {
		return min;
	}
	return ret;
}
