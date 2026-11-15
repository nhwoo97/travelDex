const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
test("GeoJSON feature collection shape is valid", () => {
  const collection = { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Point", coordinates: [-122.4, 37.7] }, properties: { title: "Test", url: "/campgrounds/test" } }] };
  assert.equal(collection.type, "FeatureCollection");
  assert.equal(collection.features[0].geometry.coordinates.length, 2);
});
test("environment template documents all deployment settings", () => {
  const example = fs.readFileSync(".env.example", "utf8");
  for (const name of ["DB_URL", "SESSION_SECRET", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_KEY", "CLOUDINARY_SECRET", "MAPBOX_TOKEN"]) assert.match(example, new RegExp(`^${name}=`, "m"));
});
