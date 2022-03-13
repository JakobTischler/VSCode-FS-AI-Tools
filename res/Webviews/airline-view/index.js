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

/**
 * Routemap
 */
{
	function mapboxInit() {
		mapboxgl.accessToken =
			'pk.eyJ1IjoiamFrb2J0aSIsImEiOiJjbDBsOWp1YjIwMDlhM2VrZXptaGMwbnNxIn0.KIIriwQIerNWtTAzymqdfA';

		const map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/streets-v11',
		});
	}
	// mapboxInit();

	/** Google Maps init */
	function initMap() {
		// The location of Uluru
		const uluru = { lat: -25.344, lng: 131.036 };

		// The map, centered at Uluru
		const map = new google.maps.Map(document.querySelector('#routemap .map'), {
			zoom: 4,
			center: uluru,
		});

		// The marker, positioned at Uluru
		const marker = new google.maps.Marker({
			position: uluru,
			map: map,
		});
	}
}
