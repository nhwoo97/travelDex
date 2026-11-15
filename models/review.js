const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const reviewSchema = new Schema({
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
});
module.exports = mongoose.model("Review", reviewSchema);
