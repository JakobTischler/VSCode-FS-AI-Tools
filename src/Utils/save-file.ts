import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
/**
 * Writes the string in `fileContents` to a file at path `filePath`
 * @param {string} filePath The absolute path of the target file
 * @param {string} fileContents The file's content
 */
export type SaveFileOptions = {
	backup?: boolean;
	backupPath?: string;
};

async function saveFile(
	filePath: string,
	fileContents: string,
	successLogMsg?: string,
	options: SaveFileOptions = { backup: true }
) {
	try {
		await mkdir(dirname(filePath), { recursive: true });
		if (options.backup !== false) {
			const backupPath = options.backupPath ?? `${filePath}.bak`;
			try {
				await copyFile(filePath, backupPath);
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
			}
		}
		await writeFile(filePath, fileContents, { encoding: 'utf-8' });

		console.log(successLogMsg || `File saved to "${filePath}"`);
	} catch (error) {
		if (error) throw new Error(String(error));
	}
}

export default saveFile;
