interface Number {
	pad(maxLength: number, fillString?: string): string;
}

Number.prototype.pad = function (maxLength: number, fillString: string = '0'): string {
	return `${this}`.padStart(maxLength, fillString);
};
