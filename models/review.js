const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const reviewSchema = new Schema({
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  // Older reviews may lack this; utils/backfill.js fills it in on startup.
  campground: { type: Schema.Types.ObjectId, ref: "Campground", index: true },
}, { timestamps: true });
reviewSchema.index({ author: 1, _id: -1 });
module.exports = mongoose.model("Review", reviewSchema);
