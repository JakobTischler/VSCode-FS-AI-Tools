// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Math {
	/**
	 * Returns a random integer between (and including) `min` and `max`.
	 * @param min The lower end of the possible range.
	 * @param max The upper end of the possible range.
	 */
	randomInt(min: number, max: number): number;
}

Math.randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min)) + min;
