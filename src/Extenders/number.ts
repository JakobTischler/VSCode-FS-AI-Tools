interface Number {
	pad(maxLength: number, fillString?: string): string;
}

Number.prototype.pad = function (maxLength: number, fillString = '0'): string {
	return String(this).padStart(maxLength, fillString);
};
