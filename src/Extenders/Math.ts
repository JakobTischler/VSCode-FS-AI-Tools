// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Math {
	/**
	 * _Custom function_ - Convert degrees to radians
	 * @param {number} degrees - The degree value to convert to radians.
	 * @returns The radian value
	 */
	degToRad(degrees: number): number;

	/**
	 * _Custom function_ - Convert radians to degrees
	 * @param {number} radians - The radian value to convert to degrees.
	 * @returns The degree value
	 */
	radToDeg(radians: number): number;

	/**
	 * Returns a random integer between (and including) `min` and `max`.
	 * @param min The lower end of the possible range.
	 * @param max The upper end of the possible range.
	 */
	randomInt(min: number, max: number): number;
}

Math.degToRad = (degrees: number): number => (degrees * Math.PI) / 180;

Math.radToDeg = (radians: number): number => (radians * 180) / Math.PI;

Math.randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min)) + min;
