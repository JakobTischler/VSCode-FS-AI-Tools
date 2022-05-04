let map;
let spatialMath;

function CreateRoutemap() {
	map = new Microsoft.Maps.Map('#map', {
		credentials: 'API_KEY',
		mapTypeId: Microsoft.Maps.MapTypeId.aerial,
		zoom: 12,
		showTrafficButton: false,
		enableClickableLogo: false,
		showMapTypeSelector: false,
		disableMapTypeSelectorMouseOver: true,
		disableStreetside: true,
		disableStreetsideAutoCoverage: true,
		showDashboard: false,
		showLocateMeButton: false,
		showScalebar: false,
		showTermsLink: false,
		allowHidingLabelsOfRoad: true,
		// labelOverlay: Microsoft.Maps.LabelOverlay.hidden,
	});
}
