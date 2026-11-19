const { CATEGORY_KEYS } = require("./categories");

const PAGE_SIZE = 12;
const SORTS = {
  newest: { label: "Newest", order: { _id: -1 } },
  top: { label: "Top rated", order: { avgRating: -1, reviewCount: -1, _id: -1 } },
  reviews: { label: "Most reviewed", order: { reviewCount: -1, avgRating: -1, _id: -1 } },
  oldest: { label: "Oldest", order: { _id: 1 } },
};

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstString(value) {
  if (Array.isArray(value)) value = value[0];
  return typeof value === "string" ? value : "";
}

// Turn the query string of the places page into safe, normalized options.
function parseListingQuery(query = {}) {
  const q = firstString(query.q).trim().slice(0, 100);
  const categoryInput = firstString(query.category);
  const category = CATEGORY_KEYS.includes(categoryInput) ? categoryInput : "";
  const minRatingInput = Number.parseInt(firstString(query.minRating), 10);
  const minRating = minRatingInput >= 1 && minRatingInput <= 5 ? minRatingInput : 0;
  const sortInput = firstString(query.sort);
  const sort = Object.hasOwn(SORTS, sortInput) ? sortInput : "newest";
  const pageInput = Number.parseInt(firstString(query.page), 10);
  const page = Number.isInteger(pageInput) && pageInput >= 1 ? Math.min(pageInput, 10000) : 1;
  return { q, category, minRating, sort, page };
}

function buildFilter({ q, category, minRating }) {
  const filter = {};
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: pattern }, { location: pattern }, { tags: pattern }];
  }
  if (category) filter.category = category;
  if (minRating) filter.avgRating = { $gte: minRating };
  return filter;
}

// Build a URL for the places page that keeps the current filters.
function listingUrl(options, overrides = {}) {
  const merged = { ...options, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.category) params.set("category", merged.category);
  if (merged.minRating) params.set("minRating", String(merged.minRating));
  if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));
  const search = params.toString();
  return search ? `/places?${search}` : "/places";
}

module.exports = { PAGE_SIZE, SORTS, escapeRegex, parseListingQuery, buildFilter, listingUrl };
