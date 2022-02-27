const button = document.querySelector('.airports-by-count .toggle-button');
let hidden = true;

button.addEventListener('click', function (event) {
	const dl = document.querySelector('dl.airport-count');
	dl.classList.toggle('hidden');

	hidden = !hidden;
	button.innerHTML = hidden ? 'Show all' : 'Show less';
});
