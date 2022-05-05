const validateEachLine = (array: string[], callback: (arg0: string) => boolean) => {
	return array.every((value) => {
		return callback(value) || false;
	});
};

export default validateEachLine;
