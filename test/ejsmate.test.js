const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");
const engine = require("ejs-mate");
const { Types } = require("mongoose");
const helpers = require("../utils/viewHelpers");

// Render through ejs-mate exactly like the app does (layouts included).
// ejs-mate adds its own `locals` property, which hides EJS's `locals` object
// inside templates, so plain-EJS tests can miss bugs that show up live.
const renderWithLayout = promisify(engine);
const views = path.join(__dirname, "..", "views");
function render(view, data) {
  return renderWithLayout(path.join(views, view), {
    ...helpers,
    settings: { views },
    currentUser: null,
    currentPath: "/",
    success: [],
    error: [],
    mapToken: "pk.test",
    ...data,
  });
}

const author = { _id: new Types.ObjectId(), username: "nam" };
const place = {
  _id: new Types.ObjectId(),
  title: "Ocean Beach",
  location: "San Francisco",
  description: "Sunsets.",
  category: "beach",
  tags: ["sunset"],
  visitedOn: new Date("2025-05-01"),
  images: [],
  geometry: { type: "Point", coordinates: [-122.5, 37.7] },
  avgRating: 0,
  reviewCount: 0,
  author,
  reviews: [],
};

test("page titles reach the layout", async () => {
  const html = await render("campgrounds/new.ejs", { pageTitle: "Add a place", currentUser: author, currentPath: "/places/new" });
  assert.match(html, /<title>Add a place · TravelDex<\/title>/);
  assert.match(html, /class="nav-link active" href="\/places\/new"/);
});

test("edit form is prefilled when rendered through the layout", async () => {
  const html = await render("campgrounds/edit.ejs", { campground: place, pageTitle: "Edit Ocean Beach", currentUser: author });
  assert.match(html, /value="Ocean Beach"/);
  assert.match(html, /value="sunset"/);
  assert.match(html, /value="2025-05-01"/);
  assert.match(html, /<option value="beach" selected>/);
});

test("full-width pages drop the outer container", async () => {
  const html = await render("home.ejs", { recent: [place], topRated: [], placeCount: 1, fullWidth: true });
  assert.match(html, /<main class=" mt-4 flex-grow-1">/);
});

test("templates never read `locals.` (hidden by ejs-mate)", () => {
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".ejs") && /\blocals\./.test(fs.readFileSync(full, "utf8"))) offenders.push(full);
    }
  };
  walk(views);
  assert.deepEqual(offenders, []);
});
