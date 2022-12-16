import { env, window, TextEditor, TextDocument, Uri } from 'vscode';
import * as Fs from 'fs';
import * as Path from 'path';
import { IFileMetaData, TFlightplanFilesMetaData } from '../Types/FlightplanFilesMetaData';

/**
 * Get the filename from a path
 * @param {TextEditor | TextDocument | Uri | string} input - The item to check.
 * Can be a `vscode.TextEditor`, a `vscode.TextDocument`, a `vscode.Uri` or a `string`.
 * @returns The filename, including the extension, without the path.
 */
export function getFilename(input: TextEditor): string;
export function getFilename(input: TextDocument): string;
export function getFilename(input: Uri): string;
export function getFilename(input: string): string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFilename(input: any): string {
	// return path.replace(/^.*[\\\/]/, '');

	if (isTextEditor(input)) return Path.basename(input.document.uri.path);
	if (isTextDocument(input)) return Path.basename(input.uri.path);
	if (isUri(input)) return Path.basename(input.path);
	return Path.basename(input);
}
const isTextEditor = (test: TextEditor): test is TextEditor => test.document != undefined;
const isTextDocument = (test: TextDocument): test is TextDocument => test.uri != undefined;
const isUri = (test: Uri): test is Uri => test.path != undefined;

/**
 * Move an item in an array from one index to another
 * @param {any[]} array - the array to be mutated.
 * @param {number} from - The index of the item to move.
 * @param {number} to - The index of the item to move.
 */
const arrayMoveMutate = <T>(array: T[], from: number, to: number) => {
	const startIndex = to < 0 ? array.length + to : to;
	const item = array.splice(from, 1)[0];
	array.splice(startIndex, 0, item);
};

/**
 * Move an array item to a different position
 * @param array
 * @param from Index of item to move. If negative, it will begin that many
 * elements from the end.
 * @param to Index of where to move the item. If negative, it will begin that
 * many elements from the end.
 * @source [[npm] array-move](https://www.npmjs.com/package/array-move)
 */
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
	array = array.slice();
	arrayMoveMutate(array, from, to);
	return array;
}

/**
 * Writes the provided text to the user's clipboard
 * @param text The text to be written to the clipboard
 * @param message The optional success message to be shown
 */
export const writeTextToClipboard = (text: string, message?: string) => {
	env.clipboard.writeText(text).then(() => {
		if (message?.length) {
			window.showInformationMessage(message);
		}
	});
};

/**
 * Asynchronously reads and returns the contents of the file at the given path.
 * Early out if file doesn't exist.
 * @param path The file path
 * @param encoding The file encoding, defaults to "utf8"
 * @returns The file contents as string
 */
export async function getFileContents(path: string, showExistError = true) {
	if (!Fs.existsSync(path)) {
		if (showExistError) {
			showError(`File at "${path}" couldn't be found`);
		}
		return null;
	}

	const data = await Fs.promises.readFile(path).catch((err) => {
		showError(`Failed to read file at "${path}"`, err);
		return null;
	});
	if (!data /* || typeof data !== 'string' */) {
		return null;
	}

	return String(data);
}

export function showError(message: string, showToast = true) {
	console.error(message);
	if (showToast) {
		window.showErrorMessage(message);
	}
}

export function showErrorModal(title: string, message: string) {
	window.showErrorMessage(title, {
		detail: message,
		modal: true,
	});
}

/**
 * Returns a new object with only the defined properties of the object.
 * @param {any} obj - The initial object
 * @source https://stackoverflow.com/a/56650790/677970
 */
export const getDefinedProps = <T extends object>(obj: T) => {
	return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
};

/**
 * Finds the `Aircraft.txt`, `Airports.txt` and `Flightplans.txt` files in the
 * given directory and returns their file data.
 * @param dirPath The directory's absolute path
 * @param readFiles If true, the file contents will be read and returned in the
 * `text` property. Defaults to `false`.
 * @returns {TFlightplanFilesMetaData} A set of objects containing - for each
 * found file - its respective file name, file path, and `vscode.Uri`
 * representation
 */
export async function getFlightplanFiles(dirPath: string, readFiles = false): Promise<TFlightplanFilesMetaData> {
	const fileNames = await Fs.promises.readdir(dirPath);
	const fileRegex = /^(aircraft|airports|flightplans).*\.txt$/i;

	const ret: Partial<TFlightplanFilesMetaData> = {};

	for (const fileName of fileNames) {
		const matches = fileName.match(fileRegex);

		if (!matches?.[1]) {
			continue;
		}

		const data: IFileMetaData = {
			fileName: fileName,
			filePath: Path.join(dirPath, fileName),
		};

		if (readFiles) {
			const contents = await getFileContents(data.filePath);
			if (contents) {
				data.text = contents;
			}
		}

		const key = matches[1].toLowerCase() as keyof TFlightplanFilesMetaData;
		ret[key] = data;
	}

	return <TFlightplanFilesMetaData>ret;
}

/**
 * Create a random string of characters of a given length
 * @param {number} [length=32] - The length of the nonce to generate. _Default:
 * 32_
 * @returns A random string of characters.
 */
export function createNonce(length = 32, specialChars = true): string {
	let text = '';
	const characters = specialChars
		? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ=!$?%_-abcdefghijklmnopqrstuvwxyz0123456789'
		: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < length; i++) {
		text += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return text;
}

/**
 * Create a new object, and copy all the properties from the original object to
 * the new object.
 * @param {object} obj - The object to clone.
 * @returns An object with the same properties as the original object.
 */
export function clone(obj: object) {
	return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}

/**
 * Concatenates the items of a string array with a comma, except for the last two items which use "and".
 * @param {string[]} items - The strings to be listed
 * @returns "a, b, c, d, e and f"
 */
export function listStringItems(...items: string[]) {
	if (items.length === 1) return items[0];

	const allButLast = items.filter((item, index) => index < items.length - 1);

	const ret = `${allButLast.join(', ')} and ${items[items.length - 1]}`;

	return ret;
}
