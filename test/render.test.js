const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const ejs = require("ejs");
const { Types } = require("mongoose");
const helpers = require("../utils/viewHelpers");
const { parseListingQuery } = require("../utils/listing");

// Render each page with realistic sample data so template mistakes fail CI.
const views = path.join(__dirname, "..", "views");
function render(view, locals = {}) {
  return ejs.renderFile(path.join(views, view), {
    ...helpers,
    layout() {},
    currentUser: null,
    currentPath: "/",
    success: [],
    error: [],
    mapToken: "pk.test",
    ...locals,
  });
}

const author = { _id: new Types.ObjectId(), username: "nam", createdAt: new Date("2024-01-02") };
const otherUser = { _id: new Types.ObjectId(), username: "alex.k" };
const image = { url: "https://res.cloudinary.com/demo/image/upload/v1/TravelDex/photo.jpg", filename: "TravelDex/photo" };
function makePlace(overrides = {}) {
  const id = new Types.ObjectId();
  return {
    _id: id,
    title: "Ramen </script> Spot",
    location: "Tokyo, Japan",
    description: "Great noodles.\nOpen late.",
    category: "food",
    tags: ["ramen", "late night"],
    visitedOn: new Date("2025-05-01"),
    images: [image, { ...image, filename: "TravelDex/photo2" }],
    geometry: { type: "Point", coordinates: [139.7, 35.6] },
    avgRating: 4.5,
    reviewCount: 2,
    author,
    reviews: [],
    createdAt: new Date("2025-06-01"),
    ...overrides,
  };
}
function makeReview(place, overrides = {}) {
  return {
    _id: new Types.ObjectId(),
    rating: 4,
    body: "Loved it",
    author: otherUser,
    campground: place,
    createdAt: new Date("2025-06-02"),
    updatedAt: new Date("2025-06-03"),
    ...overrides,
  };
}

test("layout renders for guests and signed-in users", async () => {
  const guest = await render("layouts/boilerplate.ejs", { body: "<p>hi</p>" });
  assert.match(guest, /Log In/);
  const member = await render("layouts/boilerplate.ejs", { body: "", currentUser: author, pageTitle: "Places", success: ["Saved"] });
  assert.match(member, /My Page \(nam\)/);
  assert.match(member, /href="\/users\/nam"/);
  assert.match(member, /<title>Places · TravelDex<\/title>/);
});

test("home page renders with and without places", async () => {
  const empty = await render("home.ejs", { recent: [], topRated: [], placeCount: 0 });
  assert.match(empty, /Share the first one/);
  const full = await render("home.ejs", { recent: [makePlace()], topRated: [makePlace({ images: [] })], placeCount: 2, currentUser: author });
  assert.match(full, /Top rated/);
  assert.match(full, /c_fill,w_600,h_400/);
});

test("places index renders filters, cards, pagination and safe map data", async () => {
  const options = { ...parseListingQuery({ q: "ramen", category: "food", minRating: "4", sort: "top", page: "2" }) };
  const places = [makePlace(), makePlace({ images: [], author: null, avgRating: 0, reviewCount: 0 })];
  const mapData = { type: "FeatureCollection", features: places.map(p => ({ type: "Feature", geometry: p.geometry, properties: { id: String(p._id), title: p.title } })) };
  const html = await render("campgrounds/index.ejs", { places, mapData, options, total: 30, totalPages: 3 });
  assert.match(html, /30 places/);
  assert.match(html, /data-place-id=/);
  assert.match(html, /href="\/users\/nam"/);
  assert.match(html, /page=3/);
  assert.doesNotMatch(html, /Ramen <\/script> Spot"/, "map JSON must escape </script>");
  const none = await render("campgrounds/index.ejs", { places: [], mapData: { type: "FeatureCollection", features: [] }, options: parseListingQuery({}), total: 0, totalPages: 1 });
  assert.match(none, /No places found/);
});

test("place page renders for author, other members and guests", async () => {
  const place = makePlace();
  place.reviews = [makeReview(place), makeReview(place, { author: null })];
  const asAuthor = await render("campgrounds/show.ejs", { campground: place, isFavorite: false, favoriteCount: 3, currentUser: author });
  assert.match(asAuthor, /\/edit"/);
  assert.match(asAuthor, /Want to go/);
  assert.match(asAuthor, /href="\/users\/alex.k"/);
  const asReviewer = await render("campgrounds/show.ejs", { campground: place, isFavorite: true, favoriteCount: 1, currentUser: otherUser });
  assert.match(asReviewer, /reviews\/[a-f0-9]{24}\/edit/);
  assert.match(asReviewer, /On your want-to-go list/);
  const asGuest = await render("campgrounds/show.ejs", { campground: makePlace({ images: [], tags: [], visitedOn: undefined, author: null }), isFavorite: false, favoriteCount: 0 });
  assert.match(asGuest, /Log in<\/a> or/);
});

test("place forms render empty and prefilled", async () => {
  const blank = await render("campgrounds/new.ejs", { currentUser: author });
  assert.match(blank, /name="campground\[category\]"/);
  const edit = await render("campgrounds/edit.ejs", { campground: makePlace(), currentUser: author });
  assert.match(edit, /value="ramen, late night"/);
  assert.match(edit, /value="2025-05-01"/);
});

test("review edit page renders", async () => {
  const place = makePlace();
  const html = await render("reviews/edit.ejs", { review: makeReview(place, { rating: 3 }), campground: place, currentUser: otherUser });
  assert.match(html, /value="3" checked/);
});

test("profile page renders own and other profiles", async () => {
  const place = makePlace();
  const locals = {
    profileUser: { ...author, favorites: [] },
    places: [place],
    reviews: [makeReview(place), makeReview(makePlace({ images: [] }))],
    favorites: [makePlace()],
    stats: { places: 1, reviews: 2, avgGiven: 4, favorites: 1 },
  };
  const own = await render("users/profile.ejs", { ...locals, isOwnProfile: true, currentUser: author });
  assert.match(own, /This is you/);
  assert.match(own, /Edit review/);
  const other = await render("users/profile.ejs", { ...locals, profileUser: { ...otherUser, favorites: [] }, places: [], reviews: [], favorites: [], stats: { places: 0, reviews: 0, avgGiven: 0, favorites: 0 }, isOwnProfile: false });
  assert.match(other, /alex.k hasn&#39;t shared any places yet/);
});

test("auth and error pages render", async () => {
  await render("users/login.ejs");
  await render("users/register.ejs");
  const html = await render("error.ejs", { err: { statusCode: 404, message: "Page Not Found" } });
  assert.match(html, /404/);
});
