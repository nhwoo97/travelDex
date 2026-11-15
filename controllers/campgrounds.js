const Campground = require("../models/campground");
const Review = require("../models/review");
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const geocoder = process.env.MAPBOX_TOKEN ? mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN }) : null;
async function geocodeLocation(location) {
  if (!geocoder) throw new Error("Mapbox is not configured. Set MAPBOX_TOKEN.");
  const response = await geocoder.forwardGeocode({ query: location, limit: 1 }).send();
  const feature = response.body.features[0];
  if (!feature) { const error = new Error("We could not find that location. Please enter a more specific place."); error.status = 400; throw error; }
  return feature.geometry;
}
module.exports.index = async (req, res) => {
  const campgrounds = await Campground.find({}).populate("author");
  res.render("campgrounds/index.ejs", { campgrounds });
};
module.exports.renderNewForm = (req, res) => res.render("campgrounds/new.ejs");
module.exports.createCampground = async (req, res) => {
  const geometry = await geocodeLocation(req.body.campground.location);
  const campground = new Campground({ ...req.body.campground, geometry, images: (req.files || []).map(f => ({ url: f.path, filename: f.filename })), author: req.user._id });
  await campground.save();
  req.flash("success", "Successfully created a new location.");
  res.redirect(`/campgrounds/${campground._id}`);
};
module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id).populate({ path: "reviews", populate: { path: "author" } }).populate("author");
  if (!campground) { req.flash("error", "Cannot find that location."); return res.redirect("/campgrounds"); }
  res.render("campgrounds/show.ejs", { campground });
};
module.exports.renderEditForm = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) { req.flash("error", "Cannot edit a location that does not exist."); return res.redirect("/campgrounds"); }
  res.render("campgrounds/edit.ejs", { campground });
};
module.exports.updateCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) { req.flash("error", "Cannot find that location."); return res.redirect("/campgrounds"); }
  const geometry = await geocodeLocation(req.body.campground.location);
  Object.assign(campground, req.body.campground, { geometry });
  for (const file of req.files || []) campground.images.push({ url: file.path, filename: file.filename });
  const deleteImages = req.body.deleteImages ? [].concat(req.body.deleteImages) : [];
  for (const image of campground.images.filter(image => deleteImages.includes(image.filename))) await cloudinary.uploader.destroy(image.filename, { resource_type: "image" });
  campground.images = campground.images.filter(image => !deleteImages.includes(image.filename));
  await campground.save();
  req.flash("success", "Successfully updated location.");
  res.redirect(`/campgrounds/${campground._id}`);
};
module.exports.deleteCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) { req.flash("error", "Cannot find that location."); return res.redirect("/campgrounds"); }
  for (const image of campground.images) await cloudinary.uploader.destroy(image.filename, { resource_type: "image" });
  await Review.deleteMany({ _id: { $in: campground.reviews } });
  await campground.deleteOne();
  req.flash("success", "Successfully deleted location.");
  res.redirect("/campgrounds");
};
