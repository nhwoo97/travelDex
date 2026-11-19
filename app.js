require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
// connect-mongo v6 exposes MongoStore as a named export in CommonJS.
const { MongoStore } = require("connect-mongo");
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
const home = require("./controllers/home");
const catchAsync = require("./utils/catchAsync");
const viewHelpers = require("./utils/viewHelpers");
const backfill = require("./utils/backfill");

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
Object.assign(app.locals, viewHelpers);
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
  // Reuse Mongoose's connection so the app opens one connection pool instead of two.
  store: MongoStore.create({ clientPromise: mongoose.connection.asPromise().then(connection => connection.getClient()), collectionName: "sessions", ttl: 604800, autoRemove: "native" }),
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
  // Only touch flash when a message exists, so anonymous visitors don't each create a stored session.
  const hasFlash = Boolean(req.session && req.session.flash);
  res.locals.success = hasFlash ? req.flash("success") : [];
  res.locals.error = hasFlash ? req.flash("error") : [];
  res.locals.mapToken = process.env.MAPBOX_TOKEN || "";
  next();
});
app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "database-unavailable" });
});
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});
// Old /campgrounds links (bookmarks, earlier deploys) move to /places; 308 keeps the HTTP method.
app.all(/^\/campgrounds(\/.*)?$/, (req, res) => res.redirect(308, req.originalUrl.replace(/^\/campgrounds/, "/places")));
app.use("/", userRoutes);
app.use("/places", campgroundRoutes);
app.use("/places/:id/reviews", reviewRoutes);
app.get("/", catchAsync(home.home));
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
  try {
    const result = await backfill();
    console.log("Data backfill complete:", result);
  } catch (error) {
    console.error("Data backfill failed (the app will still start):", error);
  }
  app.listen(port, () => console.log(`TravelDex listening on port ${port}`));
}
if (require.main === module) start().catch((error) => {
  console.error("Unable to start TravelDex:", error);
  process.exit(1);
});
module.exports = app;
