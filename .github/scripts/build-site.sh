#!/usr/bin/env bash
# Build the GitHub Pages artifact: copy the static app files into OUT_DIR and stamp the
# deployed commit into them.
#
#   build-site.sh OUT_DIR FULL_SHA RUN_NUMBER [UTC_STAMP]
#
# - service-worker.js: `const CACHE = "...";` becomes twin-stars-<shortsha>-<run>, so every
#   deploy rotates the PWA cache (the repo copy keeps "twin-stars-dev" for local work).
# - index.html: the footer <p class="footer-meta" id="buildStamp"> gets the UTC build time
#   and a link to the deployed commit.
# Fails if either substitution doesn't land, so a markup change can't silently ship an
# unstamped build. Used by .github/workflows/deploy.yml and checked by check-build-site.sh.
set -euo pipefail

out=${1:?OUT_DIR}
sha=${2:?FULL_SHA}
run=${3:?RUN_NUMBER}
stamp=${4:-$(date -u '+%Y-%m-%d %H:%M UTC')}
short=${sha:0:7}
repo_url="https://github.com/jamescochran/TwinStarsRando"

if ! [[ "$sha" =~ ^[0-9a-f]{7,40}$ ]]; then echo "bad sha: $sha" >&2; exit 1; fi
if ! [[ "$run" =~ ^[0-9]+$ ]]; then echo "bad run number: $run" >&2; exit 1; fi

root=$(cd "$(dirname "$0")/../.." && pwd)
mkdir -p "$out"
cp "$root"/index.html "$root"/app.js "$root"/collection.js "$root"/insights.js "$root"/board.js "$root"/head.js "$root"/service-worker.js \
   "$root"/manifest.json "$root"/icon-*.png "$root"/apple-touch-icon.png "$root"/og-image.jpg "$out"/
cp -R "$root"/rules "$out"/rules
cp -R "$root"/fonts "$out"/fonts
cp -R "$root"/screenshots "$out"/screenshots

cache="twin-stars-${short}-${run}"
sed -i -E "s/^const CACHE = \"[^\"]*\";/const CACHE = \"${cache}\";/" "$out/service-worker.js"
sed -i -E "s|<p class=\"footer-meta\" id=\"buildStamp\">.*</p>|<p class=\"footer-meta\" id=\"buildStamp\">${stamp} · <a href=\"${repo_url}/commit/${sha}\" target=\"_blank\" rel=\"noopener noreferrer\">${short}</a></p>|" "$out/index.html"

grep -q "^const CACHE = \"${cache}\";" "$out/service-worker.js" \
  || { echo "cache name not injected into service-worker.js" >&2; exit 1; }
grep -q "id=\"buildStamp\">${stamp} · <a href=\"${repo_url}/commit/${sha}\"" "$out/index.html" \
  || { echo "build stamp not injected into index.html" >&2; exit 1; }
echo "Built $out (cache ${cache}, stamp ${stamp}, ${short})"
