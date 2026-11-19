const test = require("node:test");
const assert = require("node:assert/strict");

// Load the real application (without connecting to MongoDB) so that broken
// dependency imports, such as a changed export shape after a major upgrade,
// fail CI instead of crashing the server at deploy time.
process.env.DB_URL ||= "mongodb://127.0.0.1:27017/traveldex-test";
process.env.SESSION_SECRET ||= "test-secret-that-is-at-least-32-characters";

test("application module loads and exports an Express app", () => {
  const app = require("../app");
  assert.equal(typeof app, "function");
  assert.equal(typeof app.listen, "function");
});

test("session store dependency exposes MongoStore.create", () => {
  const { MongoStore } = require("connect-mongo");
  assert.equal(typeof MongoStore.create, "function");
});

test("User model has passport-local-mongoose statics", () => {
  const User = require("../models/user");
  for (const name of ["authenticate", "serializeUser", "deserializeUser", "register"]) {
    assert.equal(typeof User[name], "function", name);
  }
});
