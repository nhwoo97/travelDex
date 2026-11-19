const express = require("express");
const router = express.Router();
const campgrounds = require("../controllers/campgrounds");
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, isAuthor, validateCampground, validateIds } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({
  storage,
  limits: { files: 8, fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return callback(new Error("Only JPEG, PNG, and WebP images are allowed."));
    callback(null, true);
  },
});
router.route("/")
  .get(catchAsync(campgrounds.index))
  .post(isLoggedIn, upload.array("image", 8), validateCampground, catchAsync(campgrounds.createCampground));
router.get("/new", isLoggedIn, campgrounds.renderNewForm);
router.route("/:id")
  .get(validateIds, catchAsync(campgrounds.showCampground))
  .put(validateIds, isLoggedIn, isAuthor, upload.array("image", 8), validateCampground, catchAsync(campgrounds.updateCampground))
  .delete(validateIds, isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));
router.get("/:id/edit", validateIds, isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));
router.post("/:id/favorite", validateIds, isLoggedIn, catchAsync(campgrounds.toggleFavorite));
module.exports = router;
