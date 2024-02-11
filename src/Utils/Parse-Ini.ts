const INI_REGEX = {
	SECTION: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
	PARAM: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
	COMMENT: /^\s*(?:;|\/\/).*$/,
};

export type TIniData = {
	[key: string]: {
		[key: string]: string;
	};
};

export function ParseIni(text: string) {
	const lines = text.split(/\r\n|\r|\n/);
	const result: TIniData = {};
	let section: string | null = null;

	lines.forEach((line: string, i: number) => {
		// Comment
		if (INI_REGEX.COMMENT.test(line)) {
			return;
		}

		if (INI_REGEX.SECTION.test(line)) {
			const match = line.match(INI_REGEX.SECTION);
			if (match?.[1]) {
				result[match[1]] = {};
				section = match[1];
			}

			return;
		}

		if (INI_REGEX.PARAM.test(line)) {
			if (section) {
				const match = line.match(INI_REGEX.PARAM);
				if (match?.[2]) {
					result[section][match[1]] = match[2];
				}

				return;
			}
			console.error(`Param outside of section (line ${i}): "${line}"`);
		}
	});
}
