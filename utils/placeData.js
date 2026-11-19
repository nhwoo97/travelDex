const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

// "Ramen, late night,  RAMEN" -> ["ramen", "late night"]
function parseTags(input) {
  if (typeof input !== "string") return [];
  const tags = [];
  for (const raw of input.split(",")) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
    if (tag && !tags.includes(tag)) tags.push(tag);
    if (tags.length === MAX_TAGS) break;
  }
  return tags;
}

// Convert the validated place form body into model fields.
function toPlaceData(form) {
  const { title, location, description, category } = form;
  const visitedOn = form.visitedOn ? new Date(form.visitedOn) : undefined;
  return { title, location, description, category, tags: parseTags(form.tags || ""), visitedOn };
}

module.exports = { parseTags, toPlaceData, MAX_TAGS };
