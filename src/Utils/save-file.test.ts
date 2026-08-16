import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import saveFile from './save-file';

describe('saveFile', () => {
	let directory: string;

	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), 'fs-ai-tools-'));
	});

	afterEach(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	it('backs up an existing file before replacing it', async () => {
		const filePath = join(directory, 'aircraft.cfg');
		await writeFile(filePath, 'original', 'utf8');

		await saveFile(filePath, 'replacement');

		assert.equal(await readFile(filePath, 'utf8'), 'replacement');
		assert.equal(await readFile(`${filePath}.bak`, 'utf8'), 'original');
	});

	it('creates missing parent directories and does not invent a backup for a new file', async () => {
		const filePath = join(directory, 'nested', 'aifp.cfg');
		await saveFile(filePath, 'created');

		assert.equal(await readFile(filePath, 'utf8'), 'created');
		await assert.rejects(readFile(`${filePath}.bak`, 'utf8'), { code: 'ENOENT' });
	});

	it('can explicitly disable backups', async () => {
		const filePath = join(directory, 'Airports_Test.txt');
		await writeFile(filePath, 'old', 'utf8');
		await saveFile(filePath, 'new', undefined, { backup: false });

		await assert.rejects(readFile(`${filePath}.bak`, 'utf8'), { code: 'ENOENT' });
	});
});
