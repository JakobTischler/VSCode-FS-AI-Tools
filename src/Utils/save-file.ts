import { writeFile } from 'node:fs/promises';
/**
 * Writes the string in `fileContents` to a file at path `filePath`
 * @param {string} filePath The absolute path of the target file
 * @param {string} fileContents The file's content
 */
async function saveFile(filePath: string, fileContents: string, successLogMsg?: string) {
	try {
		await writeFile(filePath, fileContents, { encoding: 'utf-8' });

		console.log(successLogMsg || `File saved to "${filePath}"`);
	} catch (error) {
		if (error) throw new Error(String(error));
	}
}

export default saveFile;
