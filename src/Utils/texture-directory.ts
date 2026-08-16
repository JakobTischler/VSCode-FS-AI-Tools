import * as path from 'path';
import { Uri, workspace } from 'vscode';

export type TextureDirectory = {
	path: string;
	texture: string;
};

const TEXTURE_NAME = /^[\p{L}\p{N}][\p{L}\p{N} ._()-]*$/u;

export function resolveTextureDirectory(aircraftRoot: string, rawTexture: string): TextureDirectory {
	const texture = rawTexture.trim();
	if (
		!texture ||
		path.isAbsolute(texture) ||
		texture.includes('..') ||
		texture.includes('/') ||
		texture.includes('\\') ||
		!TEXTURE_NAME.test(texture)
	) {
		throw new Error(`Unsafe texture name: "${rawTexture}"`);
	}

	const root = path.resolve(aircraftRoot);
	const target = path.resolve(root, `texture.${texture}`);
	const relative = path.relative(root, target);
	if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || path.dirname(relative) !== '.') {
		throw new Error(`Texture directory resolves outside the aircraft folder: "${rawTexture}"`);
	}

	return { path: target, texture };
}

export async function moveDirectoryToTrash(directory: string): Promise<void> {
	await workspace.fs.delete(Uri.file(directory), { recursive: true, useTrash: true });
}
