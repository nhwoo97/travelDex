const Joi = require("joi");
const sanitizeHtml = require("sanitize-html");
const plainText = (value, helpers) => {
  const cleaned = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
  if (cleaned !== value) return helpers.error("string.escapeHTML");
  return cleaned;
};
const safeString = () => Joi.string().trim().custom(plainText).messages({ "string.escapeHTML": "{{#label}} must not contain HTML." });
module.exports.campgroundSchema = Joi.object({
  campground: Joi.object({
    title: safeString().max(100).required(),
    price: Joi.number().min(0).required(),
    location: safeString().max(200).required(),
    description: safeString().max(5000).required(),
  }).required(),
  deleteImages: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
});
module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    body: safeString().max(2000).required(),
  }).required(),
});
