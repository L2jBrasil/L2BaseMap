const SHIFT_BY = 12;
const TILE_SIZE = 32768;

/** Map dimensions */
const TILE_X_MIN = 16;
const TILE_Y_MIN = 10;
const TILE_X_MAX = 26;
const TILE_Y_MAX = 25;
const TILE_ZERO_COORD_X = 20;
const TILE_ZERO_COORD_Y = 18;
const MAP_MIN_X = (TILE_X_MIN - TILE_ZERO_COORD_X) * TILE_SIZE;
const MAP_MIN_Y = (TILE_Y_MIN - TILE_ZERO_COORD_Y) * TILE_SIZE;
const MAP_MAX_X = ((TILE_X_MAX - TILE_ZERO_COORD_X) + 1) * TILE_SIZE;
const MAP_MAX_Y = ((TILE_Y_MAX - TILE_ZERO_COORD_Y) + 1) * TILE_SIZE;

/** World Map Bounds */
const BOUNDS = [[MAP_MIN_Y, MAP_MIN_X], [MAP_MAX_Y, MAP_MAX_X]];


// Initialize map
const map = L.map('map', {crs: L.CRS.Simple, maxBoundsViscosity: 1, zoomDelta: 0.5, zoomSnap: 0.5, attributionControl: false, markerZoomAnimation: false});
// Set l2 map overlay
L.imageOverlay(MAP_OVERLAY, BOUNDS).addTo(map);

// Map bounds
map.fitBounds(BOUNDS);
map.setMaxBounds(BOUNDS);

// Scale map (done mostly for larger screens)
resizeMapContent();

// Map resize listener
window.onresize = function()
{
	map.invalidateSize();
	
	// Scale map (done mostly for larger screens)
	resizeMapContent();
};

// Finally, generate a group of markers
generateMarkers();

/**
 * Generates markers using raid boss data retrieved from database.
 */
function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min;
  return time;
}
function generateMarkers()
{
	let xhttp = new XMLHttpRequest();
	xhttp.onloadend = function()
	{
		if (this.status === 200)
		{
			if (this.responseText)
			{
				// This group will contain all markers
				let pointGroup = L.layerGroup();

	 			let data = JSON.parse(this.responseText);
	 			for (let obj of data.results)
	 			{
	 				/**
					 * This is done because leaflet simple CRS uses bottom-left as pixel origin.
					 * If we change its pixel origin, couple of minor things will get broken.
					 */
					let point = L.CRS.Simple.transformation.transform(L.point(obj.locx, obj.locy));
					// y - latitude, x - longitude
					
					let flagIcon = L.icon(
					{
						iconUrl: 'images/marks/pos.png',
						shadowUrl: 'node_modules/leaflet/dist/images/marker-shadow.png',
						iconSize:    [29, 32],
						iconAnchor:  [14, 32],
						popupAnchor: [1, -34],
						tooltipAnchor: [16, -28],
						shadowSize:  [41, 41]
					});
					let marker = L.marker([point.y, point.x], {icon: flagIcon, title: obj.name, riseOnHover: true});
					
					map.setView([point.y, point.x], map.getZoom());
										
					let tooltipContent = '<div class="tooltip"><div>Location: <span>' + obj.locx + ', ' + obj.locy + ', ' + obj.locz + '</span></div></div>';
					
					// Create marker tooltip and add both to map
					marker.bindTooltip(tooltipContent).addTo(pointGroup);
						 			}
	 			// Now that layer is completed, add it to map
				map.addLayer(pointGroup);
				
	 		}
		}
		else
		{
			alert("Connection failed!");
		}
	};
	xhttp.open("GET", MAP_SERVER, true);
	
	xhttp.send();
}

/**
 * Handles map resize in case map is larger than overlay.
 */
function resizeMapContent()
{
	// Reset minimum zoom to -100 for proper bounds zoom calculation
	map.setMinZoom(-100);
	let boundZoom = map.getBoundsZoom(BOUNDS, true);
	map.setMinZoom(boundZoom);
	map.setZoom(boundZoom);
}