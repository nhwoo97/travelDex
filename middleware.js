const { campgroundSchema, reviewSchema } = require("./schemas");
const ExpressError = require("./utils/ExpressError");
const Campground = require("./models/campground");
const Review = require("./models/review");
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) { req.session.returnTo = req.originalUrl; req.flash("error", "You must be signed in."); return res.redirect("/login"); }
  next();
};
module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) return next(new ExpressError(error.details.map(item => item.message).join(", "), 400));
  next();
};
module.exports.isAuthor = async (req, res, next) => {
  try {
    const campground = await Campground.findById(req.params.id);
    if (!campground) { req.flash("error", "Location not found."); return res.redirect("/campgrounds"); }
    if (!campground.author || !campground.author.equals(req.user._id)) { req.flash("error", "You do not have permission to do that."); return res.redirect(`/campgrounds/${campground._id}`); }
    next();
  } catch (error) { next(error); }
};
module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) { req.flash("error", "Review not found."); return res.redirect(`/campgrounds/${req.params.id}`); }
    if (!review.author || !review.author.equals(req.user._id)) { req.flash("error", "You do not have permission to do that."); return res.redirect(`/campgrounds/${req.params.id}`); }
    next();
  } catch (error) { next(error); }
};
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) return next(new ExpressError(error.details.map(item => item.message).join(", "), 400));
  next();
};
