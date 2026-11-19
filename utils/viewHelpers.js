const { CATEGORIES, getCategory } = require("./categories");
const { SORTS, listingUrl } = require("./listing");

const dateFormat = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

function formatDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

// Older documents were created before timestamps existed; their ObjectId still records when.
function postedOn(doc) {
  if (!doc) return "";
  if (doc.createdAt) return formatDate(doc.createdAt);
  if (doc._id && typeof doc._id.getTimestamp === "function") return formatDate(doc._id.getTimestamp());
  return "";
}

function profileUrl(userOrName) {
  const name = typeof userOrName === "string" ? userOrName : userOrName && userOrName.username;
  return name ? `/users/${encodeURIComponent(name)}` : "";
}

// Cloudinary can resize on the fly by inserting a transformation after /upload/.
function imageUrl(image, transformation) {
  if (!image || !image.url) return "";
  if (!transformation || !image.url.includes("/upload/")) return image.url;
  return image.url.replace("/upload/", `/upload/${transformation}/`);
}

function sameId(a, b) {
  if (!a || !b) return false;
  const left = a._id || a;
  const right = b._id || b;
  return String(left) === String(right);
}

// For embedding data in <script> tags without allowing "</script>" breakouts.
function jsonForScript(value) {
  return JSON.stringify(value === undefined ? null : value).replace(/</g, "\\u003c");
}

module.exports = {
  CATEGORIES,
  SORTS,
  getCategory,
  listingUrl,
  formatDate,
  postedOn,
  profileUrl,
  imageUrl,
  sameId,
  jsonForScript,
};
