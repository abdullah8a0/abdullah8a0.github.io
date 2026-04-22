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

# Promote the brutalist shell to /viz/ and strip its variants-switcher nav
# (the other two targets no longer exist in production).
mv public/viz/brutalist.html public/viz/index.html
# Portable multi-line delete via sed — works on GNU and BSD.
sed -i.bak '/PROD-STRIP-BEGIN/,/PROD-STRIP-END/d' public/viz/index.html
rm -f public/viz/index.html.bak

echo "build.sh: production output trimmed — only the brutalist /viz/ variant remains"
