const test = require("node:test");
const assert = require("node:assert/strict");
const { parseListingQuery, buildFilter, listingUrl, escapeRegex } = require("../utils/listing");
const { parseTags, toPlaceData } = require("../utils/placeData");
const { postedOn, profileUrl, imageUrl, jsonForScript, sameId } = require("../utils/viewHelpers");
const { Types } = require("mongoose");

test("parseListingQuery normalizes and rejects bad input", () => {
  assert.deepEqual(parseListingQuery({}), { q: "", category: "", minRating: 0, sort: "newest", page: 1 });
  assert.deepEqual(
    parseListingQuery({ q: "  tokyo ", category: "food", minRating: "4", sort: "top", page: "3" }),
    { q: "tokyo", category: "food", minRating: 4, sort: "top", page: 3 },
  );
  const hostile = parseListingQuery({ q: { $ne: 1 }, category: "nope", minRating: "9", sort: "__proto__", page: "-2" });
  assert.deepEqual(hostile, { q: "", category: "", minRating: 0, sort: "newest", page: 1 });
  assert.equal(parseListingQuery({ q: ["a", "b"] }).q, "a");
});

test("buildFilter escapes search text", () => {
  const filter = buildFilter({ q: "a.b(", category: "beach", minRating: 3 });
  assert.equal(filter.category, "beach");
  assert.deepEqual(filter.avgRating, { $gte: 3 });
  assert.equal(filter.$or[0].title.source, "a\\.b\\(");
  assert.equal(escapeRegex("1+1"), "1\\+1");
  assert.deepEqual(buildFilter({ q: "", category: "", minRating: 0 }), {});
});

test("listingUrl keeps filters and drops defaults", () => {
  assert.equal(listingUrl({ q: "", sort: "newest", page: 1 }), "/places");
  assert.equal(listingUrl({ q: "new york", category: "food", sort: "top", page: 1 }, { page: 2 }), "/places?q=new+york&category=food&sort=top&page=2");
});

test("parseTags dedupes, lowercases and caps", () => {
  assert.deepEqual(parseTags(" Ramen, late   night,RAMEN,, "), ["ramen", "late night"]);
  assert.equal(parseTags(Array.from({ length: 20 }, (_, i) => `t${i}`).join(",")).length, 10);
  assert.deepEqual(parseTags(undefined), []);
});

test("toPlaceData converts the form body", () => {
  const data = toPlaceData({ title: "T", location: "L", description: "D", category: "city", tags: "a, b", visitedOn: "2025-01-05" });
  assert.deepEqual(data.tags, ["a", "b"]);
  assert.equal(data.visitedOn.toISOString().slice(0, 10), "2025-01-05");
  assert.equal(toPlaceData({ title: "T", location: "L", description: "D", category: "city", visitedOn: "" }).visitedOn, undefined);
});

test("view helpers", () => {
  const id = new Types.ObjectId();
  assert.notEqual(postedOn({ _id: id }), "");
  assert.equal(postedOn({ createdAt: new Date("2025-03-04T12:00:00Z") }), "Mar 4, 2025");
  assert.equal(profileUrl({ username: "a b" }), "/users/a%20b");
  assert.equal(imageUrl({ url: "https://x/image/upload/v1/p.jpg" }, "w_10"), "https://x/image/upload/w_10/v1/p.jpg");
  assert.equal(jsonForScript("</script>"), '"\\u003c/script>"');
  assert.ok(sameId({ _id: id }, String(id)));
  assert.ok(!sameId(null, id));
});
