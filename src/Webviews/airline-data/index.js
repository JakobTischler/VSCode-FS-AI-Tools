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
		let hidden = target.classList.contains('hidden');

		button.addEventListener('click', (event) => {
			target.classList.toggle('hidden');

			hidden = !hidden;
			button.innerHTML = hidden ? 'Show all' : 'Show less';
		});
	}
}
}
