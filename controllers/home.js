const Campground = require("../models/campground");

module.exports.home = async (req, res) => {
  const [recent, topRated, placeCount] = await Promise.all([
    Campground.find({}).sort({ _id: -1 }).limit(6).populate("author", "username"),
    Campground.find({ reviewCount: { $gt: 0 } }).sort({ avgRating: -1, reviewCount: -1, _id: -1 }).limit(6).populate("author", "username"),
    Campground.estimatedDocumentCount(),
  ]);
  res.render("home.ejs", { recent, topRated, placeCount, fullWidth: true });
};
