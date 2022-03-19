const vscode = acquireVsCodeApi();

/**
 * Toggle buttons
 */
{
	const toggleButtons = document.querySelectorAll('.toggle-button');
	for (const button of toggleButtons) {
		const target = document.querySelector(button.dataset.target);
		if (!target) {
			console.error(`Toggle button target "${button.dataset.target}" couldn't be found.`);
			continue;
		}
		const className = button.dataset.toggleClass || 'hidden';
		const buttonTextOn = button.dataset.buttonTextOn || 'Show all';
		const buttonTextOff = button.dataset.buttonTextOff || 'Show less';

		let state = target.classList.contains(className);

		button.addEventListener('click', (event) => {
			target.classList.toggle(className);

			state = !state;

			button.innerHTML = state ? buttonTextOn : buttonTextOff;
		});
	}
}

/**
 * Routemap
 */
{
	console.group('ROUTEMAP CHECKBOXES');

	/** Routemap img node */
	const img = document.querySelector('#map');

	/** All single aircraft type checkboxes */
	const checkboxes = document.querySelectorAll(
		'#routemap .aircraft-types .checkbox-pill:not(.primary) [type=checkbox]'
	);
	/** The "All" checkbox */
	const checkboxAll = document.querySelector('#routemap .aircraft-types .primary [type=checkbox]');

	console.log({ checkboxes, checkboxAll });

	let doUpdate = false;

	for (const checkbox of checkboxes) {
		checkbox.addEventListener('change', (event) => {
			updateMainCheckbox();
			sendSelectionToExtension();
		});
	}

	checkboxAll.addEventListener('change', (event) => {
		updateCheckboxes(checkboxAll.checked);
		sendSelectionToExtension();
	});

	// Initial
	sendSelectionToExtension();

	/**
	 * Checks if every single aircraftType checkbox is checked. If `true`, sets
	 * the "All" checkbox to checked, otherwise to unchecked.
	 */
	function updateMainCheckbox() {
		checkboxAll.checked = [...checkboxes].every((checkbox) => checkbox.checked);
		console.log('updateMainCheckbox(): every=', checkboxAll.checked);
	}

	/**
	 * Sets all _non-main_ checkboxes' `checked` attribute the specified
	 * boolean value. To be called when the _"all"_ checkbox is changed
	 * manually.
	 */
	function updateCheckboxes(checked) {
		for (const checkbox of checkboxes) {
			checkbox.checked = checked;
		}

		console.log(`updateCheckboxes(${checked})`);
	}

	/** Goes through each active aircraftType and generates the GCM route. Then
	 * updates the routemap image. */
	function sendSelectionToExtension() {
		// Get checked checkboxes
		const acTypes = [...checkboxes]
			.filter((checkbox) => checkbox.checked)
			.map((checkbox) => checkbox.value)
			.join(',');

		console.log(`sendSelectionToExtension(): ${acTypes}`);

		// Post message to extension
		vscode.postMessage({
			command: 'aircraftTypesChange',
			text: acTypes,
		});
	}

	window.addEventListener('message', (event) => {
		const message = event.data; // The JSON data the extension sent

		switch (message.command) {
			case 'updateRoutemapImage':
				img.src = message.uri;
		}
	});
	console.groupEnd();
}
