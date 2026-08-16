export type RenamePlan = { source: string; target: string };

export function planFlightplanFileRenames(files: string[], suffix: string, uppercaseBase: boolean): RenamePlan[] {
	const pattern = /^(aircraft|airports|flightplans).*\.txt$/i;
	return files.flatMap((source) => {
		const match = source.match(pattern);
		if (!match) return [];
		const normalizedBase = match[1].toLowerCase();
		const base = uppercaseBase
			? normalizedBase[0].toUpperCase() + normalizedBase.slice(1)
			: normalizedBase;
		const target = `${base}${suffix}`;
		return source === target ? [] : [{ source, target }];
	});
}

export function shortenSeason(value: string): string | undefined {
	const match = value.match(/^\w{2}(?:\w+ )?(\d{2,4})(?:[-/]?(\d{2,4}))?/);
	if (!match) return undefined;
	const prefix = value.slice(0, 2);
	const first = match[1].slice(-2);
	const second = match[2]?.slice(-2) ?? '';
	return `${prefix}${first}${second}`;
}
