module.exports.renderRegister = (req, res) => res.render("users/register");
module.exports.register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const User = require("../models/user");
    const user = new User({ email, username });
    if (!password || password.length < 8) throw new Error("Password must be at least 8 characters.");
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, (error) => {
      if (error) return next(error);
      req.flash("success", "Welcome to TravelDex.");
      res.redirect("/campgrounds");
    });
  } catch (error) {
    const message = error && error.code === 11000 && error.keyPattern && error.keyPattern.email
      ? "An account with that email already exists."
      : error.message;
    req.flash("error", message);
    res.redirect("/register");
  }
};
module.exports.renderLogin = (req, res) => res.render("users/login");
module.exports.login = (req, res) => {
  req.flash("success", "Welcome back.");
  const redirectUrl = req.session.returnTo || "/campgrounds";
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};
module.exports.logout = (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);
    req.flash("success", "You have been logged out.");
    res.redirect("/campgrounds");
  });
};
