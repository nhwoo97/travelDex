if (mapToken && campgroundData.geometry && document.getElementById("map")) {
  mapboxgl.accessToken = mapToken;
  const coordinates = campgroundData.geometry.coordinates;
  const map = new mapboxgl.Map({ container: "map", style: "mapbox://styles/mapbox/light-v11", center: coordinates, zoom: 10 });
  map.addControl(new mapboxgl.NavigationControl());
  const content = document.createElement("div");
  const heading = document.createElement("strong");
  heading.textContent = campgroundData.title;
  const location = document.createElement("p");
  location.textContent = campgroundData.location;
  content.append(heading, location);
  new mapboxgl.Marker().setLngLat(coordinates).setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(content)).addTo(map);
}
