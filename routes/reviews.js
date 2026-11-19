const express = require("express");
const router = express.Router({ mergeParams: true });
const catchAsync = require("../utils/catchAsync");
const { validateReview, isLoggedIn, isReviewAuthor, validateIds } = require("../middleware");
const reviews = require("../controllers/reviews");
router.post("/", validateIds, isLoggedIn, validateReview, catchAsync(reviews.createReview));
router.get("/:reviewId/edit", validateIds, isLoggedIn, isReviewAuthor, catchAsync(reviews.renderEditForm));
router.route("/:reviewId")
  .put(validateIds, isLoggedIn, isReviewAuthor, validateReview, catchAsync(reviews.updateReview))
  .delete(validateIds, isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));
module.exports = router;
