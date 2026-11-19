const Campground = require("../models/campground");
const Review = require("../models/review");

module.exports.createReview = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) { req.flash("error", "Cannot find that place."); return res.redirect("/places"); }
  const review = new Review({ ...req.body.review, author: req.user._id, campground: campground._id });
  campground.reviews.push(review);
  await review.save();
  await campground.save();
  await Campground.recalculateRating(campground._id);
  req.flash("success", "Created a new review.");
  res.redirect(`/places/${campground._id}#reviews`);
};

module.exports.renderEditForm = async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  const campground = await Campground.findById(req.params.id).select("title");
  if (!review || !campground) { req.flash("error", "Review not found."); return res.redirect(`/places/${req.params.id}`); }
  res.render("reviews/edit.ejs", { review, campground, pageTitle: "Edit review" });
};

module.exports.updateReview = async (req, res) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review) { req.flash("error", "Review not found."); return res.redirect(`/places/${id}`); }
  review.rating = req.body.review.rating;
  review.body = req.body.review.body;
  if (!review.campground) review.campground = id;
  await review.save();
  await Campground.recalculateRating(id);
  req.flash("success", "Updated your review.");
  res.redirect(`/places/${id}#review-${review._id}`);
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  await Campground.recalculateRating(id);
  req.flash("success", "Successfully deleted review.");
  res.redirect(`/places/${id}#reviews`);
};
