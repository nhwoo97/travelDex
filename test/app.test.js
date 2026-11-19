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

async function withServer(run) {
  const app = require("../app");
  const server = app.listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(base);
  } finally {
    server.close();
  }
}

test("old /campgrounds URLs redirect to /places, keeping method and query", async () => {
  await withServer(async base => {
    const response = await fetch(`${base}/campgrounds/abc/edit?x=1`, { redirect: "manual" });
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), "/places/abc/edit?x=1");
    const post = await fetch(`${base}/campgrounds`, { method: "POST", redirect: "manual" });
    assert.equal(post.status, 308);
    assert.equal(post.headers.get("location"), "/places");
  });
});

test("malformed place ids get a rendered 404 page without touching the database", async () => {
  await withServer(async base => {
    const response = await fetch(`${base}/places/not-an-id`);
    assert.equal(response.status, 404);
    const html = await response.text();
    assert.match(html, /Place not found/);
    assert.match(html, /TravelDex/);
    assert.equal(response.headers.get("set-cookie"), null, "anonymous visits should not create sessions");
  });
});
