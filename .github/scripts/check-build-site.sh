#!/usr/bin/env bash
# CI guard for the deploy build: run build-site.sh against the current files and check
# that the stamping still works, so a markup or service-worker edit can't silently break
# cache rotation or the footer stamp. Runs on every push/PR in tests.yml.
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT

fail() { echo "check-build-site: $*" >&2; exit 1; }

# Exactly one target for each substitution in the repo copies.
[ "$(grep -c '^const CACHE = "[^"]*";' "$root/service-worker.js")" = 1 ] \
  || fail 'service-worker.js must contain exactly one line: const CACHE = "...";'
[ "$(grep -c '<p class="footer-meta" id="buildStamp">.*</p>' "$root/index.html")" = 1 ] \
  || fail 'index.html must contain exactly one single-line <p class="footer-meta" id="buildStamp">...</p>'

sha=0123456789abcdef0123456789abcdef01234567
"$root/.github/scripts/build-site.sh" "$out" "$sha" 42 "2026-01-02 03:04 UTC" >/dev/null

grep -q '^const CACHE = "twin-stars-0123456-42";' "$out/service-worker.js" || fail "cache name not injected"
grep -q 'id="buildStamp">2026-01-02 03:04 UTC · <a href="https://github.com/jamescochran/TwinStarsRando/commit/0123456789abcdef0123456789abcdef01234567" target="_blank" rel="noopener noreferrer">0123456</a></p>' \
  "$out/index.html" || fail "footer stamp not injected"

# Only those two lines may differ from the repo copies.
[ "$(diff "$root/service-worker.js" "$out/service-worker.js" | grep -c '^>')" = 1 ] || fail "unexpected service-worker.js changes"
[ "$(diff "$root/index.html" "$out/index.html" | grep -c '^>')" = 1 ] || fail "unexpected index.html changes"

# Everything the service worker precaches must be in the artifact.
for f in $(grep -o 'BASE + "[^"]*"' "$root/service-worker.js" | sed 's/BASE + "//; s/"$//'); do
  [ -f "$out/$f" ] || fail "precached asset missing from build: $f"
done
# Every icon/screenshot the manifest lists, and every local file the <head> links
# (icons, preloaded fonts, og:image), must be in the artifact.
for f in $(grep -o '"src": *"[^"]*"' "$root/manifest.json" | sed 's/"src": *"//; s/"$//' | sort -u); do
  [ -f "$out/$f" ] || fail "manifest file missing from build: $f"
done
for f in $(grep -oE '<link rel="(icon|apple-touch-icon|preload|manifest)"[^>]*href="[^":]*"' "$root/index.html" | sed -E 's/.*href="([^"]*)"/\1/' | sort -u) \
         $(grep -oE 'https://jamescochran\.github\.io/TwinStarsRando/[A-Za-z0-9_./-]+\.(png|jpg)' "$root/index.html" | sed 's|.*/TwinStarsRando/||' | sort -u); do
  [ -f "$out/$f" ] || fail "file linked from index.html missing from build: $f"
done
# Every rulebook image the app references must be in the artifact.
for f in $(grep -o 'rules/[A-Za-z0-9_.-]*\.\(png\|webp\|jpg\|avif\)' "$root/app.js" | sort -u); do
  [ -f "$out/$f" ] || fail "rulebook image missing from build: $f"
done

echo "check-build-site: OK"
