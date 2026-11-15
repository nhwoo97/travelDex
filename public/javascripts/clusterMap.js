if (mapToken && document.getElementById("map")) {
  mapboxgl.accessToken = mapToken;
  const map = new mapboxgl.Map({ container: "map", style: "mapbox://styles/mapbox/light-v11", center: [-103.5918, 40.67], zoom: 3 });
  map.addControl(new mapboxgl.NavigationControl());
  map.on("load", () => {
    map.addSource("campgrounds", { type: "geojson", data: campgroundsData, cluster: true, clusterMaxZoom: 14, clusterRadius: 50 });
    map.addLayer({ id: "clusters", type: "circle", source: "campgrounds", filter: ["has", "point_count"], paint: { "circle-color": ["step", ["get", "point_count"], "#00BCD4", 10, "#2196F3", 30, "#3F51B5"], "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25] } });
    map.addLayer({ id: "cluster-count", type: "symbol", source: "campgrounds", filter: ["has", "point_count"], layout: { "text-field": "{point_count_abbreviated}", "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"], "text-size": 12 } });
    map.addLayer({ id: "unclustered-point", type: "circle", source: "campgrounds", filter: ["!", ["has", "point_count"]], paint: { "circle-color": "#11b4da", "circle-radius": 5, "circle-stroke-width": 1, "circle-stroke-color": "#fff" } });
    map.on("click", "clusters", event => {
      const feature = map.queryRenderedFeatures(event.point, { layers: ["clusters"] })[0];
      map.getSource("campgrounds").getClusterExpansionZoom(feature.properties.cluster_id, (error, zoom) => { if (!error) map.easeTo({ center: feature.geometry.coordinates, zoom }); });
    });
    map.on("click", "unclustered-point", event => {
      const feature = event.features[0];
      const coordinates = feature.geometry.coordinates.slice();
      while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
      const popup = document.createElement("div");
      const link = document.createElement("a");
      link.href = feature.properties.url;
      link.textContent = feature.properties.title;
      const description = document.createElement("p");
      description.textContent = feature.properties.description;
      popup.append(link, description);
      new mapboxgl.Popup().setLngLat(coordinates).setDOMContent(popup).addTo(map);
    });
    for (const layer of ["clusters", "unclustered-point"]) {
      map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
    }
  });
}
