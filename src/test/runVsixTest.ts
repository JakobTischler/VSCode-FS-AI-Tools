import * as path from 'node:path';
import { access } from 'node:fs/promises';
import { runTests, runVSCodeCommand } from '@vscode/test-electron';

const vscodeVersion = '1.125.0';

async function main() {
	// VS Code terminals set this for their own CLI helpers. If inherited by the
	// downloaded Electron executable, Code.exe starts as plain Node instead of
	// launching the Extension Host.
	delete process.env.ELECTRON_RUN_AS_NODE;

	const projectRoot = path.resolve(__dirname, '../..');
	const vsixPath = path.resolve(projectRoot, process.env.FS_AI_TOOLS_VSIX ?? 'fs-ai-tools-test.vsix');
	const testRunnerPath = path.resolve(projectRoot, 'src/test/vsix-runner');
	const extensionTestsPath = path.resolve(__dirname, 'vsix/index');
	const expectedVersion = require(path.resolve(projectRoot, 'package.json')).version as string;

	await access(vsixPath);
	await runVSCodeCommand(['--install-extension', vsixPath, '--force'], {
		version: vscodeVersion,
		platform: 'win32-x64-archive',
		spawn: { cwd: projectRoot },
	});

	await runTests({
		version: vscodeVersion,
		platform: 'win32-x64-archive',
		extensionDevelopmentPath: testRunnerPath,
		extensionTestsPath,
		extensionTestsEnv: { FS_AI_TOOLS_EXPECTED_VERSION: expectedVersion },
		launchArgs: ['--disable-workspace-trust', '--skip-welcome', '--skip-release-notes'],
	});
}

main().catch((error) => {
	console.error('Packaged VSIX test failed', error);
	process.exit(1);
});
