const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ejs = require("ejs");
function collect(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? collect(full) : entry.isFile() && entry.name.endsWith(".ejs") ? [full] : [];
  });
}
test("all EJS templates compile", () => {
  const templates = collect("views");
  assert.ok(templates.length > 0);
  for (const file of templates) {
    assert.doesNotThrow(() => ejs.compile(fs.readFileSync(file, "utf8"), { filename: file }), file);
  }
});
