const mongoose = require("mongoose");
const Review = require("./review");
const Schema = mongoose.Schema;
const ImageSchema = new Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
});
ImageSchema.virtual("thumbnail").get(function () { return this.url ? this.url.replace("/upload", "/upload/w_200") : ""; });
const CampgroundSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  images: [ImageSchema],
  geometry: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true, validate: value => value.length === 2 },
  },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  location: { type: String, required: true, trim: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
}, { toJSON: { virtuals: true }, timestamps: true });
CampgroundSchema.virtual("properties.popUpMarkup").get(function () {
  return { title: this.title, description: this.description.slice(0, 120), url: `/campgrounds/${this._id}` };
});
CampgroundSchema.post("findOneAndDelete", async function (doc) {
  if (doc) await Review.deleteMany({ _id: { $in: doc.reviews } });
});
module.exports = mongoose.model("Campground", CampgroundSchema);
