type TPluralOptions = {
	/**
	 * Whether to include the number in front of the word in the return value.
	 * Default: _`true`_.
	 * */
	includeNumber: boolean;
	/**
	 * Replaces the number with the corresponding word (if _`includeNumber`_ is
	 * set to _`true`_).
	 * */
	numberToWord: { [id: string]: string };
	/**
	 * Defines a custom word to use if the number does not equal 1. Default:
	 * _`word`_ + "s"
	 * */
	pluralWord: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface String {
	/**
	 * Capitalizes the string's first character.
	 * @param all If true, _all_ words in the string will be capitalized.
	 * Defaults to `false`
	 */
	capitalize(all?: boolean): string;

	/**
	 * Returns a string "number word", with "word" being either singular or plural depending on the number.
	 * @param num The number to be used for calculation
	 * @param pluralWord The word if the number is not 1. If not supplied, `singleWord` + "s" will be used
	 * @returns A string with "number word"
	 */
	pluralSimple(num: number, pluralWord?: string): string;

	/**
	 * Returns the plural version of a word depending on a provided number
	 * @param num The defining number. Default: `1`
	 * @param userOptions Optional settings object
	 * @param userOptions.includeNumber If `true`, the number will be included
	 * in the return value ("23 apples"), otherwise only the word will be
	 * returned. Default: `true`
	 * @param userOptions.numberToWord `{ [id: string]: string }` - Words to use
	 * instead of numbers, e.g. `"3": "three"`
	 * @param userOptions.pluralWord Optional --- If defined, will be used if
	 * `num !== 1`. Otherwise "`word` + s" will be used
	 * @returns The pluralized word (if `num !== 1`), otherwise the singular
	 * word
	 */
	plural(num?: number, userOptions?: Partial<TPluralOptions>): string;
}

String.prototype.capitalize = function (all = false): string {
	if (all) {
		return this.replace(/\w\S*/g, (word) => word.capitalize());
	}
	return this.replace(/^\w/, (c) => c.toUpperCase());
};

String.prototype.pluralSimple = function (num: number, pluralWord?: string): string {
	if (num === 1) {
		return `1 ${this}`;
	} else if (pluralWord) {
		return `${num} ${pluralWord}`;
	}
	return `${num} ${this}s`;
};

String.prototype.plural = function (num = 1, userOptions: Partial<TPluralOptions> = {}) {
	const options: TPluralOptions = {
		...{
			includeNumber: true,
			numberToWord: {
				'0': 'No',
			},
			pluralWord: `${this}s`,
		},
		...userOptions,
	};

	const prefix = options.includeNumber ? `${options.numberToWord[String(num)] || String(num)} ` : '';

	if (num === 1) {
		return prefix + this;
	}
	return prefix + (options.pluralWord || `${this}s`);
};
