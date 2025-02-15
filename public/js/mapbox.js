export const mapbox = (locations) => {
  // access token
  mapboxgl.accessToken =
    'pk.eyJ1Ijoia2FyZWVtLXRhcmVrIiwiYSI6ImNtM3VsYzBrdjBqMW8ycXIwMzlmcGVyeDUifQ.zjxdDkRIOX17-le61Sq6uA';
  // get map on website
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/kareem-tarek/cm3vppymc002t01s8dwf06zlz',
    scrollZoom: false,
  });

  // set bounds for locations
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((locat) => {
    // craete pin marker
    const pin = document.createElement('div');
    pin.className = 'pin';
    new mapboxgl.Marker({
      element: pin,
      anchour: 'bottom',
    })
      .setLngLat(locat.coordinates)
      .addTo(map);

    // craete popup on location
    new mapboxgl.Popup({
      offset: 15,
    })
      .setLngLat(locat.coordinates)
      .setHTML(`<p>Day ${locat.day}:${locat.description}</p>`)
      .addTo(map);

    // bounds to contain location
    bounds.extend(locat.coordinates);
  });

  // set fitbounds to move and pan on the map
  map.fitBounds(bounds, {
    padding: {
      top: 150,
      bottom: 300,
      left: 100,
      right: 100,
    },
  });
};
