module.exports.renderRegister = (req, res) => res.render("users/register");
module.exports.register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const User = require("../models/user");
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, (error) => {
      if (error) return next(error);
      req.flash("success", "Welcome to TravelDex.");
      res.redirect("/campgrounds");
    });
  } catch (error) {
    req.flash("error", error.message);
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
