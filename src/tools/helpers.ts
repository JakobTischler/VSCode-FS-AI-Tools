import { env, window } from 'vscode';
import * as Fs from 'fs';
import * as Path from 'path';
import { IFileMetaData, TFlightplanFilesMetaData } from '../Types/FlightplanFilesMetaData';

/**
 * Returns a random integer between (and including) `min` and `max`.
 * @param min The lower end of the possible range.
 * @param max The upper end of the possible range.
 */
export function getRandomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Get the filename from a path
 * @param {string} path - The path to the file.
 * @returns The filename without the path.
 */
export function getFilenameFromPath(path: string): string {
	return path.replace(/^.*[\\\/]/, '');
}

/**
 * Capitalizes the string's first character.
 * @param text The string to be capitalized.
 * @param all If true, _all_ words in the string will be capitalized.
 */
export function capitalize(text: string, all = false): string {
	if (all) {
		return text.replace(/\w\S*/g, (word) => capitalize(word));
	}
	return text.replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Move an item in an array from one index to another
 * @param {any[]} array - the array to be mutated.
 * @param {number} from - The index of the item to move.
 * @param {number} to - The index of the item to move.
 */
const arrayMoveMutate = (array: any[], from: number, to: number) => {
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
export function arrayMove(array: any[], from: number, to: number): any[] {
	array = array.slice();
	arrayMoveMutate(array, from, to);
	return array;
}

/**
 * Round up to the nearest multiple of the given number.
 * @param {number} num - The number you want to round up.
 * @param {number} [nearest=10] - The multiple to round up to.
 * @returns The rounded up number.
 */
export function roundUpToNearest(num: number, nearest = 10): number {
	return Math.ceil((num + 1) / nearest) * nearest;
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
 * Simple number loop with step size of 1 / -1. Returns the next value in the
 * loop.
 * @param num Initial number
 * @param min Minimum bounds of loop
 * @param max Maximum bounds of loop
 * @param dir Loop direction (1 or -1)
 * @returns Returns the next value in the loop based on direction
 */
export function loopNumber(num: number, min: number, max: number, dir: 1 | -1 = 1) {
	const ret = num + dir;
	if (ret < min) {
		return max;
	} else if (ret > max) {
		return min;
	}
	return ret;
}

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

	const data = await Fs.promises.readFile(path).catch((err: any) => {
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

type TPluralOptions = {
	/** Whether to include the number in front of the word in the return value.
	 * Default: _`true`_. */
	includeNumber: boolean;
	/** Replaces the number with the corresponding word (if _`includeNumber`_ is
	 * set to _`true`_). */
	numberToWord: { [id: string]: string };
	/** Defines a custom word to use if the number does not equal 1. Default:
	 * _`word`_ + "s" */
	pluralWord: string;
};
/**
 * Returns the plural version of a word depending on a provided number
 * @param word The word to be pluralized
 * @param num The defining number. Default: `1`
 * @param includeNumber If `true`, the number will be included in the return
 * value ("23 apples"), otherwise only the word will be returned. Default:
 * `true`
 * @param pluralWord Optional. If defined, will be used if `num !== 1`.
 * Otherwise `word` + s will be used
 * @returns The pluralized word (if `num !== 1`), otherwise the singular word
 */
export const plural = (word: string, num = 1, userOptions: Partial<TPluralOptions> = {}) => {
	const options: TPluralOptions = {
		...{
			includeNumber: true,
			numberToWord: {
				'0': 'No',
			},
			pluralWord: `${word}s`,
		},
		...userOptions,
	};

	const prefix = options.includeNumber ? `${options.numberToWord[String(num)] || String(num)} ` : '';

	if (num === 1) {
		return prefix + word;
	}
	return prefix + (options.pluralWord || `${word}s`);
};

/**
 * Convert degrees to radians
 * @param {number} degrees - The degree to convert to radians.
 * @returns The radian value
 */
export function degreesToRadians(degrees: number) {
	return (degrees * Math.PI) / 180;
}

/**
 * It returns a new object with only the defined properties of the object.
 * @param {any} obj - The initial object
 * @source https://stackoverflow.com/a/56650790/677970
 */
export const getDefinedProps = (obj: any) => {
	return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
};

/**
 * Finds the `Aircraft.txt`, `Airports.txt` and `Flightplans.txt` files in the
 * given directory and returns their file data.
 * @param dirPath The directory's absolute path
 * @returns A set of objects containing - for each found file - its respective
 * file name, file path, and `vscode.Uri` representation
 */
export async function getFlightplanFiles(dirPath: string, readFiles = false) {
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
export function createNonce(length = 32) {
	let text = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ=!$?%_-abcdefghijklmnopqrstuvwxyz0123456789';
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
