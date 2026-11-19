const Campground = require("../models/campground");
const Review = require("../models/review");
const User = require("../models/user");
const { cloudinary } = require("../cloudinary");
const { PAGE_SIZE, parseListingQuery, buildFilter, SORTS } = require("../utils/listing");
const { toPlaceData } = require("../utils/placeData");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const geocoder = process.env.MAPBOX_TOKEN ? mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN }) : null;
const MAP_POINT_LIMIT = 1000;

async function geocodeLocation(location) {
  if (!geocoder) throw new Error("Mapbox is not configured. Set MAPBOX_TOKEN.");
  const response = await geocoder.forwardGeocode({ query: location, limit: 1 }).send();
  const feature = response.body.features[0];
  if (!feature) { const error = new Error("We could not find that location. Please enter a more specific place."); error.status = 400; throw error; }
  return feature.geometry;
}

module.exports.index = async (req, res) => {
  const options = parseListingQuery(req.query);
  const filter = buildFilter(options);
  const total = await Campground.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  options.page = Math.min(options.page, totalPages);
  const [places, mapPlaces] = await Promise.all([
    Campground.find(filter)
      .sort(SORTS[options.sort].order)
      .skip((options.page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate("author", "username"),
    Campground.find(filter).select("title location geometry avgRating reviewCount category").limit(MAP_POINT_LIMIT).lean(),
  ]);
  const mapData = {
    type: "FeatureCollection",
    features: mapPlaces.filter(place => place.geometry && Array.isArray(place.geometry.coordinates)).map(place => ({
      type: "Feature",
      geometry: place.geometry,
      properties: { id: String(place._id), title: place.title, location: place.location, avgRating: place.avgRating || 0, reviewCount: place.reviewCount || 0, url: `/places/${place._id}` },
    })),
  };
  res.render("campgrounds/index.ejs", { places, mapData, options, total, totalPages, fullWidth: true, pageTitle: "Places" });
};

module.exports.renderNewForm = (req, res) => res.render("campgrounds/new.ejs", { pageTitle: "Add a place" });

module.exports.createCampground = async (req, res) => {
  const data = toPlaceData(req.body.campground);
  const geometry = await geocodeLocation(data.location);
  const campground = new Campground({ ...data, geometry, images: (req.files || []).map(f => ({ url: f.path, filename: f.filename })), author: req.user._id });
  await campground.save();
  req.flash("success", "Successfully added a new place.");
  res.redirect(`/places/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({ path: "reviews", options: { sort: { _id: -1 } }, populate: { path: "author", select: "username" } })
    .populate("author", "username");
  if (!campground) { req.flash("error", "Cannot find that place."); return res.redirect("/places"); }
  const isFavorite = Boolean(req.user && (req.user.favorites || []).some(id => String(id) === String(campground._id)));
  const favoriteCount = await User.countDocuments({ favorites: campground._id });
  res.render("campgrounds/show.ejs", { campground, isFavorite, favoriteCount, pageTitle: campground.title });
};

module.exports.renderEditForm = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) { req.flash("error", "Cannot edit a place that does not exist."); return res.redirect("/places"); }
  res.render("campgrounds/edit.ejs", { campground, pageTitle: `Edit ${campground.title}` });
};

module.exports.updateCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) { req.flash("error", "Cannot find that place."); return res.redirect("/places"); }
  const data = toPlaceData(req.body.campground);
  const geometry = data.location === campground.location && campground.geometry && campground.geometry.coordinates.length === 2
    ? campground.geometry
    : await geocodeLocation(data.location);
  Object.assign(campground, data, { geometry });
  if (!data.visitedOn) campground.visitedOn = undefined;
  for (const file of req.files || []) campground.images.push({ url: file.path, filename: file.filename });
  const deleteImages = req.body.deleteImages ? [].concat(req.body.deleteImages) : [];
  for (const image of campground.images.filter(image => deleteImages.includes(image.filename))) await cloudinary.uploader.destroy(image.filename, { resource_type: "image" });
  campground.images = campground.images.filter(image => !deleteImages.includes(image.filename));
  await campground.save();
  req.flash("success", "Successfully updated place.");
  res.redirect(`/places/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) { req.flash("error", "Cannot find that place."); return res.redirect("/places"); }
  for (const image of campground.images) await cloudinary.uploader.destroy(image.filename, { resource_type: "image" });
  await Review.deleteMany({ _id: { $in: campground.reviews } });
  await User.updateMany({ favorites: campground._id }, { $pull: { favorites: campground._id } });
  await campground.deleteOne();
  req.flash("success", "Successfully deleted place.");
  res.redirect("/places");
};

module.exports.toggleFavorite = async (req, res) => {
  const campground = await Campground.exists({ _id: req.params.id });
  if (!campground) { req.flash("error", "Cannot find that place."); return res.redirect("/places"); }
  const alreadySaved = await User.exists({ _id: req.user._id, favorites: req.params.id });
  await User.updateOne({ _id: req.user._id }, alreadySaved ? { $pull: { favorites: req.params.id } } : { $addToSet: { favorites: req.params.id } });
  req.flash("success", alreadySaved ? "Removed from your want-to-go list." : "Saved to your want-to-go list.");
  res.redirect(`/places/${req.params.id}`);
};
