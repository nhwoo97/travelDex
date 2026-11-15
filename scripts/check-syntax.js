const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const roots = ["controllers", "models", "routes", "utils", "cloudinary", "public/javascripts", "seeds", "scripts"];
const files = ["app.js", "middleware.js", "schemas.js"];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (item.isFile() && item.name.endsWith(".js")) files.push(full);
  }
}
for (const root of roots) if (fs.existsSync(root)) walk(root);
for (const file of files) execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
console.log(`Syntax check passed for ${files.length} JavaScript files.`);
