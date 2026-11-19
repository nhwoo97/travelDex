if (mapToken && document.getElementById("map")) {
  mapboxgl.accessToken = mapToken;
  const map = new mapboxgl.Map({ container: "map", style: "mapbox://styles/mapbox/light-v11", center: [-103.5918, 40.67], zoom: 3 });
  map.addControl(new mapboxgl.NavigationControl());

  // Fit the view to the places shown, so filtered results are in frame.
  const coordinates = placesData.features.map(feature => feature.geometry.coordinates);
  if (coordinates.length === 1) {
    map.jumpTo({ center: coordinates[0], zoom: 9 });
  } else if (coordinates.length > 1) {
    const bounds = coordinates.reduce((box, point) => box.extend(point), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    map.fitBounds(bounds, { padding: 50, maxZoom: 10, duration: 0 });
  }

  function popupContent(properties) {
    const container = document.createElement("div");
    const link = document.createElement("a");
    link.href = properties.url;
    link.textContent = properties.title;
    link.className = "fw-bold";
    const location = document.createElement("div");
    location.className = "small text-muted";
    location.textContent = properties.location;
    const rating = document.createElement("div");
    rating.className = "small";
    const count = Number(properties.reviewCount) || 0;
    rating.textContent = count ? `★ ${Number(properties.avgRating).toFixed(1)} (${count})` : "No reviews yet";
    container.append(link, location, rating);
    return container;
  }

  map.on("load", () => {
    map.addSource("places", { type: "geojson", data: placesData, cluster: true, clusterMaxZoom: 14, clusterRadius: 50 });
    // Unclustered copy used only to highlight the card the pointer is over.
    map.addSource("places-highlight", { type: "geojson", data: placesData });
    map.addLayer({ id: "clusters", type: "circle", source: "places", filter: ["has", "point_count"], paint: { "circle-color": ["step", ["get", "point_count"], "#00BCD4", 10, "#2196F3", 30, "#3F51B5"], "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25] } });
    map.addLayer({ id: "cluster-count", type: "symbol", source: "places", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"], "text-size": 12 } });
    map.addLayer({ id: "unclustered-point", type: "circle", source: "places", filter: ["!", ["has", "point_count"]], paint: { "circle-color": "#11b4da", "circle-radius": 6, "circle-stroke-width": 1, "circle-stroke-color": "#fff" } });
    map.addLayer({ id: "highlight", type: "circle", source: "places-highlight", filter: ["==", ["get", "id"], ""], paint: { "circle-color": "#ff5a5f", "circle-radius": 10, "circle-stroke-width": 3, "circle-stroke-color": "#fff" } });

    map.on("click", "clusters", event => {
      const feature = map.queryRenderedFeatures(event.point, { layers: ["clusters"] })[0];
      map.getSource("places").getClusterExpansionZoom(feature.properties.cluster_id, (error, zoom) => { if (!error) map.easeTo({ center: feature.geometry.coordinates, zoom }); });
    });
    map.on("click", "unclustered-point", event => {
      const feature = event.features[0];
      const point = feature.geometry.coordinates.slice();
      while (Math.abs(event.lngLat.lng - point[0]) > 180) point[0] += event.lngLat.lng > point[0] ? 360 : -360;
      new mapboxgl.Popup().setLngLat(point).setDOMContent(popupContent(feature.properties)).addTo(map);
    });
    for (const layer of ["clusters", "unclustered-point"]) {
      map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
    }

    for (const card of document.querySelectorAll("[data-place-id]")) {
      const id = card.getAttribute("data-place-id");
      card.addEventListener("mouseenter", () => map.setFilter("highlight", ["==", ["get", "id"], id]));
      card.addEventListener("mouseleave", () => map.setFilter("highlight", ["==", ["get", "id"], ""]));
    }
  });

  // On small screens the map starts collapsed; it needs a resize once shown.
  const panel = document.getElementById("mapPanel");
  if (panel) panel.addEventListener("shown.bs.collapse", () => map.resize());
}
