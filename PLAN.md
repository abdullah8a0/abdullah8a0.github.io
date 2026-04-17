# fixpoint.cc Improvement Plan

Comprehensive roadmap for the site, organized by category. Each item includes the files affected, what to do, and relative effort.

---

## 1. Content & Identity

### 1.1 Rebrand terminal identity to fixpoint.cc
The terminal still says `abdullah`. Consider aligning the prompt and user identity with the fixpoint.cc brand (e.g. `fix@fixpoint.cc:~` or a domain-themed motif).

- **Files:** `static/js/site.js` (user, hostname), `layouts/index.html` (titlebar text)
- **Effort:** Small

### 1.2 Update site title
`hugo.toml` has `title = "Abid Abdullah"`. Decide whether the site title should become "fixpoint.cc" or stay personal.

- **Files:** `hugo.toml`
- **Effort:** Small

### 1.3 Publish the blog
There is a draft post (`content/posts/intro.md`, `draft = true`) and full blog infrastructure (archetype, post template, RSS output) already wired but unused. Flip the draft flag, review content, and ship it.

- **Files:** `content/posts/intro.md`
- **Effort:** Small

### 1.4 Create a blog list page
`/posts/` has no index. Visitors who navigate to it see nothing. Add a list template that shows all published posts with dates.

- **Files:** New `layouts/posts/list.html` or `layouts/_default/list.html` update
- **Effort:** Small

### 1.5 Add post metadata to blog template
The post template (`layouts/posts/single.html`) renders title + content but no date, reading time, or tags.

- **Files:** `layouts/posts/single.html`
- **Effort:** Small

### 1.6 Add a standalone projects page
Projects only exist inside the terminal virtual filesystem (`site.js`). A `/projects/` page with descriptions, screenshots (images already in `static/assets/img/`), and links makes them discoverable without the terminal.

- **Files:** New `content/projects.md`, new or updated layout template
- **Effort:** Medium

### 1.7 Fix dead nav links
The nav partial links to `/#contact` and `/#projects` -- anchors that don't exist on the homepage (the homepage is terminal-only with no anchor targets). Either create those sections or point the links somewhere real.

- **Files:** `layouts/partials/nav.html`, `hugo.toml` (menu config)
- **Effort:** Small

### 1.8 Add a contact section or page
The "Contact" menu item points to `/#contact` which doesn't exist. Options: add a contact section to the homepage, create a `/contact/` page, or just link to `mailto:`.

- **Files:** `layouts/partials/nav.html`, possibly new `content/contact.md`
- **Effort:** Small–Medium

---

## 2. Terminal Enhancements

### 2.1 `theme` command — expose the theme switcher
Four fully-built CSS themes (brutalist, tty, crt, float) exist in `main.css` but only brutalist is active. Add a `theme <name>` command so visitors can switch interactively. List available themes on `theme` with no argument.

- **Files:** `static/js/terminal.js` (new command handler), `static/js/site.js` (add themes list to config)
- **Effort:** Small

### 2.2 `neofetch` command
ASCII art + system info display (OS: fixpoint.cc, Kernel: Hugo, Shell: terminal.js, Theme: brutalist, etc.). Classic terminal portfolio move.

- **Files:** `static/js/terminal.js`
- **Effort:** Small

### 2.3 `tree` command
Recursively display the virtual filesystem as an indented tree. Useful for discoverability.

- **Files:** `static/js/terminal.js`
- **Effort:** Small

### 2.4 `history` command
Print the list of previously entered commands. The `inputHistory` array already exists in `terminal.js`.

- **Files:** `static/js/terminal.js`
- **Effort:** Small

### 2.5 `grep` command
Search the virtual filesystem for a string. E.g. `grep FPGA` returns matching file contents. Fun and functional.

- **Files:** `static/js/terminal.js`
- **Effort:** Small–Medium

### 2.6 `man` command
Show a short manual page for any available command. E.g. `man ls` → usage, flags, examples.

- **Files:** `static/js/terminal.js`
- **Effort:** Small

### 2.7 Clickable URLs in `cat` output
`cat links/github` shows the URL as text but it's not clickable inline (only the `→` link is). Make URL text itself clickable in command responses.

- **Files:** `static/js/terminal.js` (cat handler, link rendering)
- **Effort:** Small

### 2.8 Pipe support (stretch)
Even simple pipes like `ls | grep resume` would delight visitors. This requires tokenizing `|` and chaining command output.

- **Files:** `static/js/terminal.js` (command parser, responseFor)
- **Effort:** Medium–Large

### 2.9 Easter eggs
`rm -rf /` → "nice try." (like sudo). `vim` → "you're stuck now, press :q to escape". `exit` → fade the terminal and show a goodbye message. Small touches that reward exploration.

- **Files:** `static/js/terminal.js`
- **Effort:** Small

---

## 3. Design & Visual Polish

### 3.1 Custom favicon
The current `favicon.ico` may be a default. Design a custom favicon that matches the fixpoint.cc brand. Consider adding `apple-touch-icon` and `manifest.json` for PWA-style icons.

- **Files:** `static/assets/favicon.ico`, `layouts/partials/head.html`
- **Effort:** Small

### 3.2 Custom OG image
`head.html` uses `assets/img/1c.jpg` (a photo) as the Open Graph image. A designed card with the fixpoint.cc branding, terminal aesthetic, and readable text would look much better when shared on social media.

- **Files:** `static/assets/img/og-card.png` (new), `layouts/partials/head.html`
- **Effort:** Medium (design work)

### 3.3 Theme persistence
If the `theme` command is added (2.1), persist the user's choice in `localStorage` so it survives page reloads.

- **Files:** `static/js/terminal.js`, `static/js/site.js`
- **Effort:** Small

### 3.4 Smooth scroll-to-bottom on command output
The terminal jumps to the bottom on new output (`scrollTop = scrollHeight`). A smooth scroll would feel more polished.

- **Files:** `static/js/terminal.js` (appendHistory, showIntro)
- **Effort:** Small

### 3.5 404 page polish
The current 404 (`layouts/_default/notfound.html`) shows a construction emoji and message. It could incorporate the terminal aesthetic or redirect to the homepage after a countdown.

- **Files:** `layouts/_default/notfound.html`, possibly `static/assets/main.css`
- **Effort:** Small

---

## 4. SEO & Meta

### 4.1 Structured data (JSON-LD)
Add `Person` and `WebSite` schema markup for rich Google snippets. Particularly valuable for a personal portfolio site.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Abdullah",
  "url": "https://fixpoint.cc",
  ...
}
</script>
```

- **Files:** `layouts/partials/head.html`
- **Effort:** Small

### 4.2 robots.txt
No `robots.txt` exists. Hugo can generate one, or place a static file. Important for crawling control post-domain-change.

- **Files:** `hugo.toml` or new `static/robots.txt`
- **Effort:** Small

### 4.3 Sitemap verification
Hugo generates `sitemap.xml` by default. Verify it's being generated correctly with the new `fixpoint.cc` baseURL and submit to Google Search Console.

- **Files:** `hugo.toml` (verify config)
- **Effort:** Small

### 4.4 RSS feed link in `<head>`
RSS output is configured in `hugo.toml` but there's no `<link rel="alternate" type="application/rss+xml">` in `head.html`. Browsers and feed readers can't auto-discover it.

- **Files:** `layouts/partials/head.html`
- **Effort:** Small

### 4.5 Update meta description
The default description references "Portfolio and writing from Abdullah, a computer science and mathematics graduate..." This could mention fixpoint.cc and the MEng at MIT CSAIL, which is more current than "graduate."

- **Files:** `layouts/partials/head.html`
- **Effort:** Small

### 4.6 Reconfigure Google Analytics
The GA4 property (`G-6NJ9Z9W8NT`) was set up for itsabdullah.dev. Update the data stream in GA4 to recognize fixpoint.cc, or the property may not track correctly.

- **Files:** Google Analytics console (external), optionally `layouts/partials/head.html` if a new property ID is needed
- **Effort:** Small (external)

---

## 5. Performance & Technical

### 5.1 Image optimization and lazy loading
Nine images in `static/assets/img/` are served unoptimized. Add `loading="lazy"` to image tags and consider Hugo's built-in image processing for WebP/AVIF generation.

- **Files:** Templates that reference images, `static/assets/img/`
- **Effort:** Small–Medium

### 5.2 Service worker / offline support
The site is tiny and fully static -- a perfect candidate for offline-first. A simple service worker that caches the shell (HTML, CSS, JS) would make the site load instantly on repeat visits.

- **Files:** New `static/sw.js`, `layouts/partials/head.html` or `layouts/_default/baseof.html` (registration script)
- **Effort:** Medium

### 5.3 Preload critical assets
Add `<link rel="preload">` for `main.css`, `site.js`, and `terminal.js` in the `<head>` to eliminate render-blocking.

- **Files:** `layouts/partials/head.html`
- **Effort:** Small

### 5.4 CSS containment
Add `contain: content` to `.terminal-window` and `.terminal-screen` so the browser can optimize layout/paint for the terminal without reflowing the entire page.

- **Files:** `static/assets/main.css`
- **Effort:** Small

### 5.5 Body overflow fix for non-homepage
`body { overflow: hidden }` is set globally, which prevents scrolling on content pages like `/classes/`. Either scope the overflow to the homepage or use a body class.

- **Files:** `static/assets/main.css`, `layouts/index.html` or `layouts/_default/baseof.html`
- **Effort:** Small

---

## 6. Infrastructure

### 6.1 Add Cloudflare-specific files
Since the site is on Cloudflare, add `static/_headers` for security headers (CSP, HSTS, X-Frame-Options) and `static/_redirects` for 301 redirects from itsabdullah.dev to fixpoint.cc.

Example `_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

- **Files:** New `static/_headers`, new `static/_redirects`
- **Effort:** Small

### 6.2 Update or remove GitHub Pages workflow
`.github/workflows/hugo.yml` deploys to GitHub Pages. If Cloudflare Pages is building the site directly, this workflow is redundant and should be removed or repurposed (e.g. for build-only CI checks).

- **Files:** `.github/workflows/hugo.yml`
- **Effort:** Small

### 6.3 Add a CI build check
Even without GitHub Pages deployment, a workflow that runs `hugo --minify` on PRs catches broken templates and content errors before merge.

- **Files:** `.github/workflows/hugo.yml` (modify or new file)
- **Effort:** Small

### 6.4 Add `_redirects` for old domain
Anyone with old itsabdullah.dev bookmarks should be 301-redirected to fixpoint.cc. This can be handled in Cloudflare DNS/rules or via a `_redirects` file.

- **Files:** Cloudflare dashboard (external) or `static/_redirects`
- **Effort:** Small

---

## 7. Blog System (if pursuing content)

### 7.1 Tags and categories
Hugo taxonomy support is partially wired (template exists at `layouts/taxonomy/taxonomy.html`) but no content uses tags. Add `tags` to post front matter and style the taxonomy pages.

- **Files:** `content/posts/*.md` (front matter), `layouts/taxonomy/taxonomy.html`, `static/assets/main.css`
- **Effort:** Small–Medium

### 7.2 Pagination
For when there are enough posts, Hugo has built-in pagination. Configure it in `hugo.toml` and update the list template.

- **Files:** `hugo.toml`, `layouts/posts/list.html`
- **Effort:** Small

### 7.3 Code syntax highlighting
Hugo has built-in Chroma syntax highlighting. Enable it in `hugo.toml` for blog posts that include code. Pick a dark theme consistent with the site palette.

- **Files:** `hugo.toml`
- **Effort:** Small

### 7.4 Complete blog.css
`static/assets/blog.css` exists (28 lines) but is mostly empty/unused. Either flesh it out for proper blog typography or remove it and consolidate styles into `main.css`.

- **Files:** `static/assets/blog.css` or `static/assets/main.css`
- **Effort:** Small

---

## 8. Accessibility

### 8.1 Terminal screen reader narrative
The terminal works well visually but screen readers may struggle with the interactive flow. Consider adding `role="log"` to the history container and more descriptive `aria-live` regions for command output.

- **Files:** `layouts/index.html`, `static/js/terminal.js`
- **Effort:** Small–Medium

### 8.2 Color contrast audit
Run the full palette through a WCAG contrast checker. The `--muted: #8fa398` on `--bg: #050706` is likely fine but should be verified (especially for the CRT theme's amber tones).

- **Files:** `static/assets/main.css`
- **Effort:** Small

### 8.3 Keyboard shortcut discoverability
The help text mentions tab and arrow keys, but not that `Ctrl+L` could clear (if added) or other shortcuts. Consider a more discoverable help panel or `help --verbose`.

- **Files:** `static/js/terminal.js`
- **Effort:** Small

---

## Priority Suggestions

**Quick wins (do first):**
- 1.7 Fix dead nav links
- 2.1 `theme` command
- 4.2 robots.txt
- 4.4 RSS feed link
- 5.5 Body overflow fix
- 6.2 Update GitHub Pages workflow

**High impact, moderate effort:**
- 1.1 Rebrand terminal identity
- 1.6 Projects page
- 2.2 `neofetch` command
- 3.2 Custom OG image
- 4.1 JSON-LD structured data
- 6.1 Cloudflare headers

**Nice to have:**
- 2.8 Pipe support
- 5.2 Service worker
- 7.x Blog system buildout
