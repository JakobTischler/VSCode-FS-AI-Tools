import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

const extensionId = 'jakob-tischler.fs-ai-tools';

suite('Packaged VSIX', () => {
	test('installs and activates the packaged extension', async () => {
		const extension = vscode.extensions.getExtension(extensionId);
		assert.ok(extension, `${extensionId} was not installed from the VSIX`);
		assert.equal(extension.packageJSON.version, process.env.FS_AI_TOOLS_EXPECTED_VERSION);

		await extension.activate();
		assert.equal(extension.isActive, true);
	});

	test('registers representative commands from the packaged bundle', async () => {
		const extension = vscode.extensions.getExtension(extensionId);
		assert.ok(extension);
		await extension.activate();

		const commands = await vscode.commands.getCommands(true);
		for (const command of [
			'fsAiTools.cleanAircraftCfg',
			'fsAiTools.cleanFlightplan',
			'fsAiTools.deleteAircraft',
			'fsAiTools.generateAirports',
		]) {
			assert.ok(commands.includes(command), `Command was not registered: ${command}`);
		}
	});

	test('contains resources required at runtime', async () => {
		const extension = vscode.extensions.getExtension(extensionId);
		assert.ok(extension);

		for (const relativePath of [
			'out/extension.js',
			'res/view-container-icon.svg',
			'res/Webviews/airline-view/index.js',
			'res/Webviews/flightplan-commands/main.js',
		]) {
			await vscode.workspace.fs.stat(vscode.Uri.joinPath(extension.extensionUri, ...relativePath.split('/')));
		}
	});
});
