// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Number {
	/**
	 * Simple number loop with step size of 1 / -1. Returns the next value in
	 * the loop. Will jump to `min` when `max + 1 > max`, and to `max` when
	 * `min - 1 < min`.
	 * @param min - Minimum bounds of loop
	 * @param max - Maximum bounds of loop
	 * @param dir - Loop direction (1 or -1). Defaults to 1
	 * @returns Returns the next value in the loop based on direction
	 * @example
	 * (3).loop(1, 10, 1)
	 * // returns 4
	 * @example
	 * (2).loop(2, 7, -1)
	 * // returns 7
	 */
	loop(min: number, max: number, dir?: 1 | -1): number;

	/**
	 * Pads the start of number with variable amount of `fillString` characters
	 * so the number of decimals is at least `maxLength`. Returns the padded
	 * number as a string.
	 *
	 * @param {number} [maxLength] - The number of characters to pad to
	 * @param {number} [fillString] - The character to use as padding. Defaults
	 * to `0`
	 * @example
	 * (12).pad(4, "0")
	 * // → returns "0012"
	 * @example
	 * (123456).pad(4, "0")
	 * // → returns "123456"
	 */
	pad(maxLength: number, fillString?: string): string;

	/**
	 * Round up to the nearest multiple of the given number.
	 * @param {number} [nearest=10] - The multiple to round up to. Defaults to
	 * 10
	 * @returns The rounded up number.
	 * @example
	 * (23.123).roundUpToNearest(5)
	 * // returns 25
	 * (23.123).roundUpToNearest(20)
	 * // returns 40
	 */
	roundUpToNearest(nearest: number): number;
}

Number.prototype.loop = function (min: number, max: number, dir: 1 | -1 = 1) {
	const ret = Number(this) + dir;
	if (ret < min) {
		return max;
	} else if (ret > max) {
		return min;
	}
	return ret;
};

Number.prototype.pad = function (maxLength: number, fillString = '0'): string {
	return String(this).padStart(maxLength, fillString);
};

Number.prototype.roundUpToNearest = function (nearest = 10): number {
	return Math.ceil((Number(this) + 1) / nearest) * nearest;
};
