const mongoose = require("mongoose");
const { campgroundSchema, reviewSchema } = require("./schemas");
const ExpressError = require("./utils/ExpressError");
const Campground = require("./models/campground");
const Review = require("./models/review");
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) { if (req.method === "GET") req.session.returnTo = req.originalUrl; req.flash("error", "You must be signed in."); return res.redirect("/login"); }
  next();
};
module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) return next(new ExpressError(error.details.map(item => item.message).join(", "), 400));
  next();
};
// Reject malformed ids up front so they show a friendly 404 instead of a cast error.
module.exports.validateIds = (req, res, next) => {
  for (const name of ["id", "reviewId"]) {
    if (req.params[name] !== undefined && !mongoose.isObjectIdOrHexString(req.params[name])) return next(new ExpressError("Place not found", 404));
  }
  next();
};
module.exports.isAuthor = async (req, res, next) => {
  try {
    const campground = await Campground.findById(req.params.id);
    if (!campground) { req.flash("error", "Location not found."); return res.redirect("/places"); }
    if (!campground.author || !campground.author.equals(req.user._id)) { req.flash("error", "You do not have permission to do that."); return res.redirect(`/places/${campground._id}`); }
    next();
  } catch (error) { next(error); }
};
module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    const backToPlace = `/places/${encodeURIComponent(req.params.id)}`;
    if (!review || (review.campground && String(review.campground) !== req.params.id)) { req.flash("error", "Review not found."); return res.redirect(backToPlace); }
    if (!review.author || !review.author.equals(req.user._id)) { req.flash("error", "You do not have permission to do that."); return res.redirect(backToPlace); }
    next();
  } catch (error) { next(error); }
};
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) return next(new ExpressError(error.details.map(item => item.message).join(", "), 400));
  next();
};
