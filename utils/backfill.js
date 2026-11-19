const Campground = require("../models/campground");
const Review = require("../models/review");

// Bring data created by older versions of the app up to the current schema.
// Safe to run on every startup: each step only touches documents that need it.
async function backfill() {
  await Campground.updateMany({ category: { $exists: false } }, { $set: { category: "other" } });

  const orphanReviews = await Review.find({ campground: { $exists: false } }).select("_id");
  for (const review of orphanReviews) {
    const place = await Campground.findOne({ reviews: review._id }).select("_id");
    if (place) await Review.updateOne({ _id: review._id }, { $set: { campground: place._id } });
  }

  const unrated = await Campground.find({
    $or: [{ avgRating: { $exists: false } }, { reviewCount: { $exists: false } }],
  }).select("_id");
  for (const place of unrated) await Campground.recalculateRating(place._id);

  return { reviewsLinked: orphanReviews.length, placesRated: unrated.length };
}

module.exports = backfill;
