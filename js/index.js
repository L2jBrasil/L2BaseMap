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

/** Available BaseMaps **/

const baseMaps = {
    "C3": L.imageOverlay("images/maps/C3.webp", BOUNDS),
    "C4": L.imageOverlay("images/maps/C4.webp", BOUNDS),
    "C5": L.imageOverlay("images/maps/C5.webp", BOUNDS),	
    "Interlude": L.imageOverlay("images/maps/IL.webp", BOUNDS),
    "CT1": L.imageOverlay("images/maps/CT1.webp", BOUNDS),	
    "CT1 (hdi)": L.imageOverlay("images/maps/CT1-hdi.webp", BOUNDS),
    "Gracia (art map)": L.imageOverlay("images/maps/art-map.webp", BOUNDS),
    "Gracia (no background)": L.imageOverlay("images/maps/clear-map.webp", BOUNDS),
    "Custom map (khanda.club)": L.imageOverlay("images/maps/l2khanda.webp", BOUNDS),
	
};

// Initialize map
const map = L.map('map',{
	crs: L.CRS.Simple, maxBoundsViscosity: 1, zoomDelta: 0.5, zoomSnap: 0.5, attributionControl: false, markerZoomAnimation: false,
});
// Set l2 default map overlay
let mapOverlay;


// Create overlay control
let menu = L.control({position: 'topleft'});
menu.onAdd = function (map) {
          this._div = document.createElement('div');
		  this._div.classList.add('leaflet-control-layers-base');
		  this._div.style.backgroundColor= 'rgba(255,255,255,0.3)';
		  for(let i in baseMaps){
			  let iMap = baseMaps[i];
			  //Preload imageOverlay
			  
			  let link = document.createElement('link');
			  link.setAttribute('rel','preload');
			  link.setAttribute('href',iMap._url);
			  link.setAttribute('as','image');
			  document.head.appendChild(link);
			  
			  
			  let radio = document.createElement('input');
			  //Set default map to first
			  if(i == DEFAULT_MAP_OVERLAY){				  
				radio.setAttribute("checked", true);
				mapOverlay = iMap.addTo(map);
			  }
			  
			  //Add Cick event
			  radio.addEventListener('click', (e) => {
				  if (map.hasLayer(mapOverlay)) {
					map.removeLayer(mapOverlay);
				  }
				  mapOverlay = iMap.addTo(map);
			  });
			  
			  //attributes			  
			  radio.setAttribute("name", "overlay");
			  radio.setAttribute("value", i);
			  radio.setAttribute("type", "radio");			  
			  radio.classList.add('leaflet-control-layers-selector');
			  
			  
			  let label = document.createElement('label');
			  let div = document.createElement('div');
			  let span = document.createElement('span');
			  span.innerText = i;
			  
			  
			  div.appendChild(radio)
			  div.appendChild(span)
			  label.appendChild(div)
			  
			  this._div.appendChild(label);
			  
		  }
          return this._div;          
  };


menu.addTo(map);


//L.control.layers(baseMaps).addTo(map);


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
	fetch(MAP_SERVER)
		.then(function (response) {
		// The API call was successful!
		return response.text();
	}).then(function (text) {
		return JSON.parse(text)
	}).then(function (data) {	
		// This group will contain all markers
		let pointGroup = L.layerGroup();
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
			//You can Customize the tooltip with anything you want
			let tooltipContent = '<div class="tooltip"><div>Location: <span>' + obj.locx + ', ' + obj.locy + ', ' + obj.locz + '</span></div></div>';					
			// Create marker tooltip and add both to map
			marker.bindTooltip(tooltipContent).addTo(pointGroup);
		}
		// Now that layer is completed, add it to map
		map.addLayer(pointGroup);
	}).catch(function (err) {
		// There was an error
		console.warn('Something went wrong.', err);
	});
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


