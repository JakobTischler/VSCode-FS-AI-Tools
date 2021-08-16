interface String {
	plural(num: number, pluralWord?: string): string;
}

/**
 * Returns a string "number word", with "word" being either singular or plural depending on the number.
 * @param num The number to be used for calculation
 * @param singleWord The word if the number is 1
 * @param pluralWord The word if the number is not 1. If not supplied, `singleWord` + "s" will be used
 * @returns A string with "number word"
 */
String.prototype.plural = function (num: number, pluralWord?: string): string {
	if (num === 1) {
		return `1 ${this}`;
	} else if (pluralWord) {
		return `${num} ${pluralWord}`;
	}
	return `${num} ${this}s`;
};
