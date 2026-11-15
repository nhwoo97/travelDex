require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const path = require("path");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const ExpressError = require("./utils/ExpressError");
const User = require("./models/user");
const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campground");
const reviewRoutes = require("./routes/reviews");

for (const name of ["DB_URL", "SESSION_SECRET"]) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
}
if (process.env.NODE_ENV === "production" && process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters in production.");
}
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  if (req.body) for (const key of Object.keys(req.body)) {
    if (key.startsWith("$") || key.includes(".")) delete req.body[key];
  }
  next();
});
app.use(mongoSanitize());
app.use(session({
  name: "traveldex.sid",
  secret: process.env.SESSION_SECRET,
  store: MongoStore.create({ mongoUrl: process.env.DB_URL, collectionName: "sessions", ttl: 604800, autoRemove: "native" }),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 604800000 },
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.mapToken = process.env.MAPBOX_TOKEN || "";
  next();
});
app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "database-unavailable" });
});
app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.get("/", (req, res) => res.render("home.ejs"));
app.all("*", (req, res, next) => next(new ExpressError("Page Not Found", 404)));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) console.error(err);
  res.status(statusCode).render("error", { err: { statusCode, message: statusCode >= 500 ? "Something went wrong. Please try again." : err.message } });
});
const port = process.env.PORT || 3000;
async function start() {
  await mongoose.connect(process.env.DB_URL, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected to MongoDB");
  app.listen(port, () => console.log(`TravelDex listening on port ${port}`));
}
if (require.main === module) start().catch((error) => {
  console.error("Unable to start TravelDex:", error);
  process.exit(1);
});
module.exports = app;
