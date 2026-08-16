import '../Extenders/Math';
import '../Extenders/number';

export function formatTimes(text: string, removeSeconds: boolean, addAtToArrivalTimes: boolean): string {
	const regex = /((?:\d+\/)?\d+:\d+)(:\d+)?,(@)?((?:TNG)?(?:\d+\/)?\d+:\d+)(:\d+)?/gi;

	let replacement = '$1';
	if (!removeSeconds) replacement += '$2';
	replacement += ',';
	if (addAtToArrivalTimes) replacement += '@';
	replacement += '$4';
	if (!removeSeconds) replacement += '$5';

	return text.replace(regex, replacement);
}

export function randomizePercentage(text: string, min = 10, max = 99): string {
	const regex = /(\d+%)/g;
	if (min === max) return text.replace(regex, `${min}%`);
	return text.replace(regex, () => `${Math.randomInt(min, max)}%`);
}

export function transformToUppercase(text: string): string {
	return text.toUpperCase();
}

export function padFlightNumbers(text: string): string {
	return text.replace(/,([FfRr]),(\d+)/gi, (_fullMatch, rule: string, number: string) => {
		return `,${rule},${Number(number).pad(4)}`;
	});
}

export function padFlightLevels(text: string): string {
	return text.replace(/,(\d+),([FfRr]),/gi, (_fullMatch, level: string, rule: string) => {
		return `,${Number(level).pad(3)},${rule},`;
	});
}

export function changeComments(text: string, numSpaces = 1): string {
	if (numSpaces > 0) {
		return text
			.replace(/^(\s*?)\/\/(\s*?)(\S)/, (_fullMatch, indent: string, _spaces: string, content: string) => {
				return `${indent}//${' '.repeat(numSpaces)}${content}`;
			})
			.replace('// FSXDAYS', '//FSXDAYS');
	}

	return text.replace(/^(\s*?)\/\/(\s+)/, (_fullMatch, indent: string) => `${indent}//`);
}

export function changeAircraftNumbers(text: string, amount: number): string {
	return text.replace(/#(\d+)/gi, (_fullMatch, number: string) => `#${Number(number) + amount}`);
}

const periodMaxDays: Record<string, number> = { WEEK: 6, '2WEEKS': 13, '5WEEKS': 34, '8WEEKS': 55 };

export function switchSimulatorDays(text: string, toFs9: boolean): { text: string; changed: number } {
	let changed = 0;
	const lines = text.split('\n').map((line) => {
		if (!line.startsWith('AC#')) return line;
		const period = line.split(',')[3]?.toUpperCase();
		const maxDay = periodMaxDays[period];
		if (maxDay === undefined) return line;
		changed++;
		return line.replace(/(,@?(?:TNG)?)(\d+)\//gi, (_match, prefix: string, day: string) => {
			return `${prefix}${Number(day).loop(0, maxDay, toFs9 ? 1 : -1)}/`;
		});
	});
	return { text: lines.join('\n'), changed };
}

export type RebaseAircraftNumbersOptions = {
	start: number;
	groupStep: number;
	itemStep: number;
	emptyLinesBetweenGroups: number;
	kind: 'aircraft' | 'flightplans';
};

export function rebaseAircraftNumbers(text: string, options: RebaseAircraftNumbersOptions): string {
	let previousOldNumber: number | null = null;
	let currentNumber = options.start;
	let replacedInGroup = false;
	let emptyLines = 0;
	const result: string[] = [];

	for (let line of text.split('\n')) {
		const trimmed = line.trim();
		let newGroup = false;
		if (!trimmed) {
			emptyLines++;
			if (emptyLines >= options.emptyLinesBetweenGroups) {
				emptyLines = 0;
				newGroup = true;
			}
		} else {
			emptyLines = 0;
		}

		if (newGroup && replacedInGroup) {
			currentNumber = currentNumber.roundUpToNearest(options.groupStep);
			replacedInGroup = false;
		} else if (trimmed.startsWith('AC#')) {
			if (options.kind === 'aircraft') {
				if (replacedInGroup) currentNumber += options.itemStep;
				line = line.replace(/AC#\d+,/, `AC#${currentNumber},`);
				replacedInGroup = true;
			} else {
				const match = line.match(/AC#(\d+),/);
				if (match) {
					const oldNumber = Number(match[1]);
					if (oldNumber !== previousOldNumber) {
						if (replacedInGroup) currentNumber += options.itemStep;
						previousOldNumber = oldNumber;
					}
					line = line.replace(`AC#${oldNumber}`, `AC#${currentNumber}`);
					replacedInGroup = true;
				}
			}
		}
		result.push(line);
	}
	return result.join('\n');
}

export function countAircraftGroups(text: string, emptyLinesBetweenGroups = 1): { text: string; total: number; groups: number } {
	const lines = text.split('\n');
	let total = 0;
	let groups = 0;
	let count = 0;
	let headerIndex: number | null = null;
	let newGroup = true;
	let emptyLines = 0;

	const closeGroup = () => {
		if (headerIndex === null || count === 0) return;
		lines[headerIndex] = `${lines[headerIndex].trim().replace(/\s*\[[^\]]+\]\s*$/, '')} [${count}]`;
		total += count;
		groups++;
	};

	for (const [index, line] of lines.entries()) {
		if (!line.trim()) {
			emptyLines++;
			if (emptyLines >= emptyLinesBetweenGroups) newGroup = true;
			continue;
		}
		emptyLines = 0;
		if (line.startsWith('//')) {
			if (newGroup) {
				closeGroup();
				headerIndex = index;
				count = 0;
				newGroup = false;
			} else if (count === 0) {
				headerIndex = index;
			}
		} else if (line.startsWith('AC#')) {
			count++;
		}
	}
	closeGroup();
	return { text: lines.join('\n'), total, groups };
}
