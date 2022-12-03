// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Number {
	/**
	 * Simple number loop with step size of 1 / -1. Returns the next value in
	 * the loop. Will jump to `min` when `max + 1`, and to `max` when `min - 1`
	 * @param min - Minimum bounds of loop
	 * @param max - Maximum bounds of loop
	 * @param dir - Loop direction (1 or -1). Defaults to 1
	 * @returns Returns the next value in the loop based on direction
	 */
	loop(min: number, max: number, dir?: 1 | -1): number;

	pad(maxLength: number, fillString?: string): string;

	/**
	 * Round up to the nearest multiple of the given number.
	 * @param {number} [nearest=10] - The multiple to round up to.
	 * @returns The rounded up number.
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
