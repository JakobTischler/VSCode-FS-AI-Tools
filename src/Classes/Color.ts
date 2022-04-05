type TextColor = 'dark' | 'light';
type Rgb = [number, number, number];

export class Color {
	hex: string;
	textColor: TextColor;

	constructor(_hex: string, _textColor?: TextColor) {
		this.hex = _hex;

		this.textColor = _textColor || this.optimalTextColor;
	}

	private get optimalTextColor(): TextColor {
		const rgb = Color.hexToRgb(this.hex);
		const luminance = Color.rgbLuminance(rgb);

		const contrastRatioBlack = (luminance + 0.05) / 0.05;
		if (contrastRatioBlack > 7) {
			return 'dark';
		}

		const contrastRatioWhite = 1.05 / (luminance + 0.05);
		if (contrastRatioWhite > 7) {
			return 'light';
		}

		if (contrastRatioBlack > contrastRatioWhite) {
			return 'dark';
		}

		return 'light';
	}

	/**
	 * Given a color component's value between 0 and 255, return the luminance of that value
	 * @param {number} value - The color component's value (0..255).
	 * @returns The luminance value.
	 */
	static valueLuminance(value: number) {
		let c = value / 255;
		if (c < 0.03928) {
			c /= 12.92;
		} else {
			c = (c + 0.055) / 1.055;
			c **= 2.4;
		}
		return c;
	}

	/**
	 * Given a color in the RGB color space, return the luminance of that color
	 * @param {Rgb} color - The color as rgb array
	 * @returns The luminance of the color.
	 */
	static rgbLuminance(color: Rgb) {
		const vl = color.map((value) => Color.valueLuminance(value));

		return 0.2126 * vl[0] + 0.7152 * vl[1] + 0.0722 * vl[2];
	}

	/**
	 * Converts a "#ABCDEF" hex color to RGB
	 * @param {string} hex - The hexadecimal color code, like #FFF or #FFFFFF.
	 * @returns The RGB values of the hex color.
	 */
	static hexToRgb(hex: string): Rgb {
		hex = hex.replace('#', '');

		let r = 0;
		let g = 0;
		let b = 0;

		if (hex.length === 3) {
			r = Number(`0x${hex[0]}${hex[0]}`);
			g = Number(`0x${hex[1]}${hex[1]}`);
			b = Number(`0x${hex[2]}${hex[2]}`);
		} else if (hex.length === 6) {
			r = Number(`0x${hex[0]}${hex[1]}`);
			g = Number(`0x${hex[2]}${hex[3]}`);
			b = Number(`0x${hex[4]}${hex[5]}`);
		}

		return [r, g, b];
	}
}
