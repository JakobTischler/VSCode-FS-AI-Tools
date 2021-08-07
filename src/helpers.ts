import { env, window } from 'vscode';
import * as Fs from 'fs';

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

/**
 * Asynchronously reads and returns the contents of the file at the given path. Early out if file doesn't exist.
 * @param path The file path
 * @param encoding The file encoding, defaults to "utf8"
 * @returns The file contents as string
 */
export async function getFileContents(path: string, encoding: string = 'utf8') {
	if (!Fs.existsSync(path)) {
		showError(`File at "${path}" couldn't be found`);
		return null;
	}

	const data = await Fs.promises.readFile(path, encoding).catch((err: any) => {
		showError(`Failed to read file at "${path}"`, err);
		return null;
	});
	if (!data || typeof data !== 'string') {
		return null;
	}

	return data;
}

/**
 * Capitalizes each word's first letter and changes the rest to lower case
 * @param str The original text
 * @returns The text, which each word's first letter capitalized and the rest in lower case
 */
export function titleCase(str: string) {
	return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

export function showError(message: string, showPopup: boolean = true) {
	console.error(message);
	if (showPopup) {
		window.showErrorMessage(message);
	}
}
