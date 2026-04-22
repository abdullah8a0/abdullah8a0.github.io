#!/usr/bin/env bash
# Production build for Cloudflare Pages.
#
# Wire this up in the Cloudflare Pages dashboard:
#   Settings → Builds & deployments → Build command → ./build.sh
#
# Locally, `hugo server` still serves all three /viz/ variants from static/viz/.
# This script runs AFTER hugo and trims the production output so that fixpoint.cc
# only exposes the brutalist variant.

set -euo pipefail

hugo --minify

# --- /viz/ production slimming ------------------------------------------------
# Remove the default shell and the editorial variant.
rm -f public/viz/index.html              # the default dark shell
rm -f public/viz/style.css               # only used by the default shell
rm -f public/viz/editorial.html
rm -f public/viz/editorial.css
rm -f public/viz/js/tweaks-editorial.js

# Make the brutalist shell reachable at both /viz/ and /viz/brutalist.html
# so the terminal `viz` command (→ /viz/brutalist.html) keeps working.
cp public/viz/brutalist.html public/viz/index.html

# Strip the variants-switcher nav from both copies (editorial and the old
# default no longer exist, so their links would 404).
# Portable multi-line delete — works on both GNU and BSD sed.
sed -i.bak '/PROD-STRIP-BEGIN/,/PROD-STRIP-END/d' public/viz/index.html
sed -i.bak '/PROD-STRIP-BEGIN/,/PROD-STRIP-END/d' public/viz/brutalist.html
rm -f public/viz/index.html.bak public/viz/brutalist.html.bak

echo "build.sh: production output trimmed — only the brutalist /viz/ variant remains"
