import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Graphics review gate. The app may not use Button Shy card or token art (card art, card scans,
// token art, icons copied from cards/tokens); the official rulebook images under rules/ are
// allowed. Every graphic in the tree was reviewed by the owner and is listed below. A new image
// file, or a new raster data: URI in the app code, makes this test fail so it gets the owner's
// review before it ships. It never blocks or removes the reviewed files.
// To approve a new graphic after review: add it to REVIEWED (with what it shows and who made it).

const ROOT = path.resolve(__dirname, "../..");
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?|heic)$/i;
const SKIP_DIRS = new Set([".git", "node_modules", "test-results", "playwright-report", "__pycache__"]);

const REVIEWED = new Set([
  // App icons: hexagon + "TS", the app's own design.
  "apple-touch-icon.png", "icon-144.png", "icon-192.png", "icon-384.png", "icon-512.png",
  "icon-maskable-192.png", "icon-maskable-512.png",
  // Social preview and store screenshots of the app's own UI.
  "og-image.jpg",
  "screenshots/screenshot-narrow-log.jpg", "screenshots/screenshot-narrow-randomizer.jpg",
  "screenshots/screenshot-wide.jpg",
  // Button Shy's official rulebooks as distributed free on BoardGameGeek (allowed), plus
  // 1600px AVIF/WebP re-encodings of them.
  "rules/twinstars-crag.png",
  "rules/twinstars1.png", "rules/twinstars1.avif", "rules/twinstars1.webp",
  "rules/twinstars1-syzygy.png", "rules/twinstars1-syzygy.avif", "rules/twinstars1-syzygy.webp",
  "rules/twinstars2.png", "rules/twinstars2.avif", "rules/twinstars2.webp",
  "rules/twinstars2-syzygy.png", "rules/twinstars2-syzygy.avif", "rules/twinstars2-syzygy.webp",
]);

// Raster data: URIs reviewed in the app code: only the 1x1 AVIF support probe in app.js.
const REVIEWED_DATA_URIS = ["data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlm"];

function imageFiles(dir, rel = "") {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...imageFiles(path.join(dir, e.name), r));
    else if (IMAGE_EXT.test(e.name)) out.push(r);
  }
  return out;
}

test("no image file has been added without the owner's review", () => {
  const unreviewed = imageFiles(ROOT).filter(f => !REVIEWED.has(f)).sort();
  expect(unreviewed, "New graphics need the owner's review (no Button Shy card/token art); then add them to REVIEWED").toEqual([]);
});

test("no raster data: image has been added to the app code without review", () => {
  const found = [];
  for (const f of fs.readdirSync(ROOT).filter(f => /\.(html|js|css)$/.test(f))) {
    const text = fs.readFileSync(path.join(ROOT, f), "utf8");
    for (const m of text.matchAll(/data:image\/(?!svg\+xml)[a-z0-9.+-]+[;,][A-Za-z0-9+/=]{0,32}/gi)) {
      if (!REVIEWED_DATA_URIS.some(ok => ok.startsWith(m[0]) || m[0].startsWith(ok))) found.push(`${f}: ${m[0]}`);
    }
  }
  expect(found, "New embedded images need the owner's review").toEqual([]);
});
