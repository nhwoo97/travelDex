module.exports.renderRegister = (req, res) => res.render("users/register", { pageTitle: "Register" });
module.exports.register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const User = require("../models/user");
    const user = new User({ email, username });
    if (typeof username !== "string" || !/^[A-Za-z0-9_.-]{3,30}$/.test(username)) throw new Error("Usernames must be 3-30 characters: letters, numbers, dots, dashes or underscores.");
    if (!password || password.length < 8) throw new Error("Password must be at least 8 characters.");
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, (error) => {
      if (error) return next(error);
      req.flash("success", "Welcome to TravelDex.");
      res.redirect("/places");
    });
  } catch (error) {
    const message = error && error.code === 11000 && error.keyPattern && error.keyPattern.email
      ? "An account with that email already exists."
      : error.message;
    req.flash("error", message);
    res.redirect("/register");
  }
};
module.exports.renderLogin = (req, res) => res.render("users/login", { pageTitle: "Log in" });
module.exports.login = (req, res) => {
  req.flash("success", "Welcome back.");
  const redirectUrl = req.session.returnTo || "/places";
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};
module.exports.logout = (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);
    req.flash("success", "You have been logged out.");
    res.redirect("/places");
  });
};

module.exports.showProfile = async (req, res) => {
  const User = require("../models/user");
  const Campground = require("../models/campground");
  const Review = require("../models/review");
  const profileUser = await User.findOne({ username: req.params.username }).select("username favorites createdAt");
  if (!profileUser) {
    const ExpressError = require("../utils/ExpressError");
    throw new ExpressError("That traveler doesn't exist.", 404);
  }
  const [places, reviews, favorites] = await Promise.all([
    Campground.find({ author: profileUser._id }).sort({ _id: -1 }).populate("author", "username"),
    Review.find({ author: profileUser._id }).sort({ _id: -1 }).populate("campground", "title location images"),
    Campground.find({ _id: { $in: profileUser.favorites || [] } }).populate("author", "username"),
  ]);
  const visibleReviews = reviews.filter(review => review.campground);
  const ratingSum = visibleReviews.reduce((sum, review) => sum + review.rating, 0);
  const stats = {
    places: places.length,
    reviews: visibleReviews.length,
    avgGiven: visibleReviews.length ? Math.round((ratingSum / visibleReviews.length) * 10) / 10 : 0,
    favorites: favorites.length,
  };
  const isOwnProfile = Boolean(req.user && String(req.user._id) === String(profileUser._id));
  res.render("users/profile.ejs", { profileUser, places, reviews: visibleReviews, favorites, stats, isOwnProfile, pageTitle: profileUser.username });
};
