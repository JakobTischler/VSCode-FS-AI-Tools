import '../Extenders/number';

type FltsimEntry = Record<string, string>;

export type CleanAircraftCfgOptions = {
	removeUnusedLines: boolean;
	removeUnusedLinesItems: string[];
	callsignsUppercase: boolean;
	renumber: boolean;
	sortProperties: boolean;
	sortPropertiesOrder: string[];
};

export function renumberAddOnsCfg(text: string): string {
	let packageIndex = 0;
	return text
		.split('\n')
		.map((rawLine) => {
			const line = rawLine.trim();
			if (line.toLowerCase().startsWith('[package.')) return `[Package.${packageIndex++}]`;
			return line;
		})
		.join('\n');
}

export function renumberSceneryCfg(text: string): string {
	let entryIndex = 1;
	return text
		.split('\n')
		.map((rawLine) => {
			const line = rawLine.trim();
			if (line.toLowerCase().startsWith('[area.')) return `[Area.${entryIndex.pad(3)}]`;
			if (line.toLowerCase().startsWith('layer=')) return `Layer=${entryIndex++}`;
			return line;
		})
		.join('\n');
}

export function cleanAircraftCfg(text: string, options: CleanAircraftCfgOptions): string {
	const output: string[] = [];
	const entries: FltsimEntry[] = [];
	const removeProperties = new Map<string, string | undefined>(
		options.removeUnusedLinesItems.map((property) => {
			const separator = property.indexOf('=');
			return separator < 0 ? [property, undefined] : [property.slice(0, separator), property.slice(separator + 1)];
		})
	);
	let currentSection: string | null = null;
	let currentEntry: FltsimEntry = {};

	const finishEntry = () => {
		if (currentSection?.toLowerCase().startsWith('[fltsim.')) entries.push(currentEntry);
	};

	for (const [index, rawLine] of text.split('\n').entries()) {
		const line = rawLine.trim();
		const isSectionStart = line.startsWith('[') && line.endsWith(']');
		if (line && isSectionStart) {
			finishEntry();
			currentSection = line;
			if (line.toLowerCase().startsWith('[fltsim.')) currentEntry = { _header: line };
		}

		const inFltsim = currentSection?.toLowerCase().startsWith('[fltsim.') ?? false;
		if (line && inFltsim && !isSectionStart) {
			const equalsIndex = line.indexOf('=');
			const key = (equalsIndex >= 0 ? line.slice(0, equalsIndex) : line).toLowerCase();
			let value = equalsIndex >= 0 ? line.slice(equalsIndex + 1) : '';
			const removeValue = removeProperties.get(key);
			const remove =
				options.removeUnusedLines &&
				removeProperties.has(key) &&
				(removeValue === undefined || (removeValue === '*' && !!value) || (removeValue === '_' && !value) || removeValue === value);
			if (!remove) {
				if (options.callsignsUppercase && key === 'atc_airline') value = value.toUpperCase();
				currentEntry[key] = value;
			}
		} else if (!inFltsim) {
			output.push(line);
		}

		if (index === text.split('\n').length - 1) finishEntry();
	}

	if (options.renumber) entries.forEach((entry, index) => (entry._header = `[fltsim.${index}]`));
	for (const originalEntry of entries) {
		const entry = { ...originalEntry };
		const lines = [entry._header];
		delete entry._header;
		if (options.sortProperties) {
			for (const key of options.sortPropertiesOrder) {
				if (key in entry) {
					lines.push(`${key}=${entry[key]}`);
					delete entry[key];
				}
			}
		}
		lines.push(...Object.entries(entry).map(([key, value]) => `${key}=${value}`));
		output.push(...lines, '');
	}

	return output.join('\n');
}
