const mongoose = require("mongoose");
const Review = require("./review");
const { CATEGORY_KEYS } = require("../utils/categories");
const Schema = mongoose.Schema;
const ImageSchema = new Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
});
ImageSchema.virtual("thumbnail").get(function () { return this.url ? this.url.replace("/upload", "/upload/w_200") : ""; });
// The model keeps its original "Campground" name so existing data in the
// "campgrounds" collection keeps working; the site calls these "places".
const CampgroundSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  images: [ImageSchema],
  geometry: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true, validate: value => value.length === 2 },
  },
  category: { type: String, enum: CATEGORY_KEYS, default: "other", index: true },
  tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }], default: [] },
  visitedOn: Date,
  // Legacy field from the original campground app; no longer shown or required.
  price: { type: Number, min: 0 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  location: { type: String, required: true, trim: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  avgRating: { type: Number, default: 0, index: true },
  reviewCount: { type: Number, default: 0, index: true },
}, { toJSON: { virtuals: true }, timestamps: true });
CampgroundSchema.virtual("properties.popUpMarkup").get(function () {
  return { title: this.title, description: this.description.slice(0, 120), url: `/places/${this._id}` };
});
CampgroundSchema.statics.recalculateRating = async function (id) {
  const place = await this.findById(id).select("reviews");
  if (!place) return;
  const [stats] = await Review.aggregate([
    { $match: { _id: { $in: place.reviews } } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await this.updateOne({ _id: id }, {
    $set: {
      avgRating: stats ? Math.round(stats.avg * 10) / 10 : 0,
      reviewCount: stats ? stats.count : 0,
    },
  });
};
CampgroundSchema.post("findOneAndDelete", async function (doc) {
  if (doc) await Review.deleteMany({ _id: { $in: doc.reviews } });
});
module.exports = mongoose.model("Campground", CampgroundSchema);
