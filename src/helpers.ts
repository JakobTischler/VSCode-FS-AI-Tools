export function replacePartAtPos(
	str: string,
	position: number,
	length: number,
	newText: string
): string {
	const before = str.substr(0, position);
	const after = str.substr(position + length, str.length);
	return before + newText + after;
}

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
