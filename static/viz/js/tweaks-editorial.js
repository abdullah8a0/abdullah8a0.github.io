// =============================================================================
// tweaks-editorial.js — the Tweaks panel for the Editorial variant.
//
// Host contract (see Make tweakable skill):
//   1. Register the message listener FIRST.
//   2. THEN post __edit_mode_available to reveal the toolbar toggle.
//   3. On activate → show panel; on deactivate → hide.
//   4. On every change, apply live AND postMessage __edit_mode_set_keys so
//      the host rewrites the JSON block between EDITMODE-BEGIN/END and the
//      change persists across reloads.
// =============================================================================

(function () {
  "use strict";

  // Defaults — the block between the markers MUST be valid JSON. The host
  // parses it and rewrites it in place on __edit_mode_set_keys.
  const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
    "trueColor":        "#3d7a4e",
    "falseColor":       "#b84a2e",
    "paperTint":        "#f5efe4",
    "accentColor":      "#b84a2e",
    "fontSizeScale":    1.0,
    "headingStyle":     "serif",
    "showLegend":       true,
    "showMinimap":      true,
    "showFigCaption":   true,
    "showIntros":       true,
    "animationSpeed":   "normal",
    "paperTexture":     true,
    "panelLayout":      "columns"
  }/*EDITMODE-END*/;

  let state = { ...TWEAKS_DEFAULTS };
  let panelEl = null;

  // ---------------------------------------------------------------------------
  // Apply a single tweak value to the live DOM.
  // ---------------------------------------------------------------------------
  function applyTweak(key, value) {
    const root = document.documentElement;
    switch (key) {
      case "trueColor":
        root.style.setProperty("--t-col", value);
        root.style.setProperty("--t-soft", softenColor(value, 0.82));
        break;
      case "falseColor":
        root.style.setProperty("--f-col", value);
        root.style.setProperty("--f-soft", softenColor(value, 0.82));
        break;
      case "paperTint":
        root.style.setProperty("--paper", value);
        root.style.setProperty("--paper-warm", darkenColor(value, 0.04));
        root.style.setProperty("--paper-edge", darkenColor(value, 0.08));
        break;
      case "accentColor":
        // accent recolors a handful of inline refs (§ numbers, title em, etc.)
        root.style.setProperty("--accent", value);
        [...document.querySelectorAll(".col-num")].forEach(e => e.style.color = value);
        [...document.querySelectorAll(".title em")].forEach(e => e.style.color = value);
        const status = document.getElementById("status");
        // re-apply pill styles via inline CSS variable if present
        break;
      case "fontSizeScale":
        document.body.style.fontSize = `${16 * value}px`;
        break;
      case "headingStyle":
        const titles = [...document.querySelectorAll(".title, .col-title, .help-card h3")];
        titles.forEach(t => {
          t.style.fontFamily = value === "serif"
            ? `"Newsreader", Georgia, serif`
            : `"IBM Plex Sans", system-ui, sans-serif`;
          t.style.fontStyle = value === "serif" ? "" : "normal";
        });
        // dek intro
        const dek = document.querySelector(".dek");
        if (dek) dek.style.fontFamily = value === "serif" ? "" : `"IBM Plex Sans", sans-serif`;
        break;
      case "showLegend":
        toggleVisibility(".legend", value);
        break;
      case "showMinimap":
        toggleVisibility("#minimap", value);
        break;
      case "showFigCaption":
        toggleVisibility(".fig-caption", value);
        break;
      case "showIntros":
        document.querySelectorAll(".col-intro").forEach(el => {
          el.style.display = value ? "" : "none";
        });
        break;
      case "animationSpeed": {
          const mult = value === "slow" ? 2.2 : value === "fast" ? 0.35 : 1;
          const sheet = ensureTweakSheet();
          sheet.textContent = `
            .node, .edge, .junction, .inv-bubble, .output-arrow, .lc-edge, .lc-box {
              transition-duration: ${0.3 * mult}s !important;
            }`;
          break;
        }
      case "paperTexture":
        toggleVisibility("body::before", value, "body");
        ensureTextureSheet().textContent = value ? `` : `body::before { display: none !important; }`;
        break;
      case "panelLayout": {
          const sheet = ensureLayoutSheet();
          if (value === "stack") {
            sheet.textContent = `
              .commentary { grid-template-columns: 1fr !important; }
              .col { border-right: none !important; border-bottom: 1px solid var(--rule-hair); padding: 16px 0 !important; }
              .col:first-child { padding-top: 0 !important; }
              .col:last-child  { border-bottom: none !important; padding-bottom: 0 !important; }
            `;
          } else {
            sheet.textContent = ``;
          }
          break;
        }
    }
  }

  function toggleVisibility(sel, show) {
    document.querySelectorAll(sel).forEach(el => {
      el.style.display = show ? "" : "none";
    });
  }

  function ensureTweakSheet() {
    let s = document.getElementById("tweaks-motion-sheet");
    if (!s) {
      s = document.createElement("style");
      s.id = "tweaks-motion-sheet";
      document.head.appendChild(s);
    }
    return s;
  }
  function ensureTextureSheet() {
    let s = document.getElementById("tweaks-texture-sheet");
    if (!s) {
      s = document.createElement("style");
      s.id = "tweaks-texture-sheet";
      document.head.appendChild(s);
    }
    return s;
  }
  function ensureLayoutSheet() {
    let s = document.getElementById("tweaks-layout-sheet");
    if (!s) {
      s = document.createElement("style");
      s.id = "tweaks-layout-sheet";
      document.head.appendChild(s);
    }
    return s;
  }

  // ---------------------------------------------------------------------------
  // naive color helpers (used for computing soft-tint siblings)
  // ---------------------------------------------------------------------------
  function parseHex(hex) {
    const h = hex.replace("#", "");
    if (h.length === 3) return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  function toHex(r, g, b) {
    return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  }
  function softenColor(hex, amount) {
    const [r, g, b] = parseHex(hex);
    // blend toward paper (#f5efe4)
    return toHex(r + (245 - r) * amount, g + (239 - g) * amount, b + (228 - b) * amount);
  }
  function darkenColor(hex, amount) {
    const [r, g, b] = parseHex(hex);
    return toHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
  }

  // ---------------------------------------------------------------------------
  // Apply the full state on boot.
  // ---------------------------------------------------------------------------
  function applyAll() {
    for (const [k, v] of Object.entries(state)) applyTweak(k, v);
  }

  // ---------------------------------------------------------------------------
  // Panel UI.
  // ---------------------------------------------------------------------------
  function buildPanel() {
    if (panelEl) return panelEl;
    const el = document.createElement("aside");
    el.className = "tweaks-panel";
    el.id = "tweaks-panel";
    el.innerHTML = `
      <div class="tw-head">
        <span class="tw-eyebrow">VOL. I · TWEAKS</span>
        <button class="tw-close" aria-label="close">&times;</button>
      </div>
      <h3 class="tw-title">Adjust the figure.</h3>
      <p class="tw-dek">Changes persist to disk and will survive a reload.</p>

      <div class="tw-group">
        <div class="tw-group-head">Palette</div>
        <label class="tw-row">
          <span>True · accent</span>
          <input type="color" data-key="trueColor" value="${state.trueColor}">
        </label>
        <label class="tw-row">
          <span>False · accent</span>
          <input type="color" data-key="falseColor" value="${state.falseColor}">
        </label>
        <label class="tw-row">
          <span>Paper tint</span>
          <input type="color" data-key="paperTint" value="${state.paperTint}">
        </label>
      </div>

      <div class="tw-group">
        <div class="tw-group-head">Type</div>
        <label class="tw-row">
          <span>Font size</span>
          <input type="range" data-key="fontSizeScale" min="0.85" max="1.2" step="0.05" value="${state.fontSizeScale}">
        </label>
        <div class="tw-row">
          <span>Headings</span>
          <div class="tw-seg">
            <button data-key="headingStyle" data-val="serif" class="${state.headingStyle === "serif" ? "on" : ""}">Serif</button>
            <button data-key="headingStyle" data-val="sans"  class="${state.headingStyle === "sans"  ? "on" : ""}">Sans</button>
          </div>
        </div>
      </div>

      <div class="tw-group">
        <div class="tw-group-head">Chrome</div>
        <label class="tw-row tw-check">
          <span>Legend overlay</span>
          <input type="checkbox" data-key="showLegend" ${state.showLegend ? "checked" : ""}>
        </label>
        <label class="tw-row tw-check">
          <span>Minimap</span>
          <input type="checkbox" data-key="showMinimap" ${state.showMinimap ? "checked" : ""}>
        </label>
        <label class="tw-row tw-check">
          <span>Figure caption</span>
          <input type="checkbox" data-key="showFigCaption" ${state.showFigCaption ? "checked" : ""}>
        </label>
        <label class="tw-row tw-check">
          <span>Italic intros</span>
          <input type="checkbox" data-key="showIntros" ${state.showIntros ? "checked" : ""}>
        </label>
        <label class="tw-row tw-check">
          <span>Paper texture</span>
          <input type="checkbox" data-key="paperTexture" ${state.paperTexture ? "checked" : ""}>
        </label>
      </div>

      <div class="tw-group">
        <div class="tw-group-head">Motion</div>
        <div class="tw-row">
          <span>Speed</span>
          <div class="tw-seg">
            <button data-key="animationSpeed" data-val="slow"   class="${state.animationSpeed === "slow"   ? "on" : ""}">Slow</button>
            <button data-key="animationSpeed" data-val="normal" class="${state.animationSpeed === "normal" ? "on" : ""}">Normal</button>
            <button data-key="animationSpeed" data-val="fast"   class="${state.animationSpeed === "fast"   ? "on" : ""}">Fast</button>
          </div>
        </div>
      </div>

      <div class="tw-group">
        <div class="tw-group-head">Layout</div>
        <div class="tw-row">
          <span>Commentary</span>
          <div class="tw-seg">
            <button data-key="panelLayout" data-val="columns" class="${state.panelLayout === "columns" ? "on" : ""}">Columns</button>
            <button data-key="panelLayout" data-val="stack"   class="${state.panelLayout === "stack"   ? "on" : ""}">Stack</button>
          </div>
        </div>
      </div>

      <div class="tw-foot">
        <button class="tw-reset">Reset all</button>
      </div>
    `;
    document.body.appendChild(el);

    // wire up listeners
    el.querySelectorAll("input[data-key], .tw-seg button[data-key]").forEach(inp => {
      const ev = inp.type === "color" || inp.type === "range" ? "input"
              : inp.type === "checkbox" ? "change"
              : "click";
      inp.addEventListener(ev, () => {
        let key = inp.dataset.key;
        let val;
        if (inp.tagName === "BUTTON") {
          val = inp.dataset.val;
          // segment behaviour: turn off siblings
          inp.parentElement.querySelectorAll("button").forEach(b => b.classList.toggle("on", b === inp));
        } else if (inp.type === "checkbox") {
          val = inp.checked;
        } else if (inp.type === "range") {
          val = parseFloat(inp.value);
        } else {
          val = inp.value;
        }
        state[key] = val;
        applyTweak(key, val);
        // persist
        try {
          window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [key]: val } }, "*");
        } catch {}
      });
    });

    el.querySelector(".tw-close").addEventListener("click", () => {
      el.classList.remove("open");
    });
    el.querySelector(".tw-reset").addEventListener("click", () => {
      state = { ...TWEAKS_DEFAULTS };
      applyAll();
      // re-render inputs by rebuilding
      el.remove();
      panelEl = null;
      const fresh = buildPanel();
      fresh.classList.add("open");
      try {
        window.parent.postMessage({ type: "__edit_mode_set_keys", edits: TWEAKS_DEFAULTS }, "*");
      } catch {}
    });

    panelEl = el;
    return el;
  }

  // Inject the panel's CSS alongside ui.js styles.
  function injectStyles() {
    if (document.getElementById("tweaks-editorial-styles")) return;
    const s = document.createElement("style");
    s.id = "tweaks-editorial-styles";
    s.textContent = `
      .tweaks-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        background: #fffdf7;
        border: 1px solid var(--rule, #20160c);
        box-shadow: 10px 10px 0 rgba(31, 22, 12, 0.09), 0 20px 60px rgba(31, 22, 12, 0.18);
        font-family: var(--sans, "IBM Plex Sans", sans-serif);
        color: var(--ink, #1f1a14);
        font-size: 12px;
        z-index: 200;
        transform: translateX(calc(100% + 40px));
        transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);
        padding: 18px 20px 16px;
      }
      .tweaks-panel.open { transform: translateX(0); }
      .tweaks-panel::-webkit-scrollbar { width: 6px; }
      .tweaks-panel::-webkit-scrollbar-thumb { background: var(--paper-edge, #e4dac4); }

      .tweaks-panel .tw-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      .tweaks-panel .tw-eyebrow {
        font-size: 10px;
        letter-spacing: 0.22em;
        color: var(--ink-muted, #8a7d6a);
      }
      .tweaks-panel .tw-close {
        background: transparent;
        border: none;
        color: var(--ink-muted, #8a7d6a);
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
        padding: 0 4px;
        border-radius: 2px;
      }
      .tweaks-panel .tw-close:hover { background: var(--paper-edge, #e4dac4); color: var(--ink, #1f1a14); }

      .tweaks-panel .tw-title {
        font-family: var(--serif, "Newsreader", serif);
        font-weight: 500;
        font-size: 22px;
        font-style: italic;
        margin: 0 0 4px;
        letter-spacing: -0.01em;
      }
      .tweaks-panel .tw-dek {
        font-family: var(--serif, "Newsreader", serif);
        font-size: 12px;
        font-style: italic;
        color: var(--ink-muted, #8a7d6a);
        margin: 0 0 14px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--rule-hair, rgba(31,22,12,0.18));
        text-wrap: pretty;
      }
      .tweaks-panel .tw-group { padding: 10px 0; border-bottom: 1px dashed var(--rule-hair, rgba(31,22,12,0.18)); }
      .tweaks-panel .tw-group:last-of-type { border-bottom: none; }
      .tweaks-panel .tw-group-head {
        font-size: 10px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--ink-muted, #8a7d6a);
        margin-bottom: 8px;
        font-family: var(--sans);
      }
      .tweaks-panel .tw-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 0;
        gap: 12px;
      }
      .tweaks-panel .tw-row > span {
        font-size: 12.5px;
        color: var(--ink-soft, #4a3f32);
      }
      .tweaks-panel input[type="color"] {
        width: 36px;
        height: 22px;
        border: 1px solid var(--rule-hair, rgba(31,22,12,0.18));
        padding: 0;
        cursor: pointer;
        background: transparent;
      }
      .tweaks-panel input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
      .tweaks-panel input[type="color"]::-webkit-color-swatch { border: none; }

      .tweaks-panel input[type="range"] {
        flex: 1;
        max-width: 140px;
        accent-color: var(--f-col, #b84a2e);
      }
      .tweaks-panel input[type="checkbox"] { accent-color: var(--f-col, #b84a2e); }

      .tweaks-panel .tw-seg {
        display: inline-flex;
        border: 1px solid var(--rule-hair, rgba(31,22,12,0.18));
        border-radius: 2px;
        overflow: hidden;
      }
      .tweaks-panel .tw-seg button {
        background: transparent;
        color: var(--ink-soft, #4a3f32);
        border: none;
        padding: 4px 9px;
        font-family: var(--sans);
        font-size: 11px;
        cursor: pointer;
        border-right: 1px solid var(--rule-hair, rgba(31,22,12,0.18));
        font-weight: 500;
      }
      .tweaks-panel .tw-seg button:last-child { border-right: none; }
      .tweaks-panel .tw-seg button:hover { background: var(--paper-edge, #e4dac4); }
      .tweaks-panel .tw-seg button.on { background: var(--ink, #1f1a14); color: var(--paper, #f5efe4); }

      .tweaks-panel .tw-foot {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--rule-hair, rgba(31,22,12,0.18));
        display: flex;
        justify-content: flex-end;
      }
      .tweaks-panel .tw-reset {
        background: transparent;
        color: var(--ink-muted, #8a7d6a);
        border: 1px solid var(--rule-hair, rgba(31,22,12,0.18));
        padding: 4px 12px;
        font-family: var(--sans);
        font-size: 11px;
        cursor: pointer;
        font-style: italic;
      }
      .tweaks-panel .tw-reset:hover { background: var(--ink, #1f1a14); color: var(--paper, #f5efe4); border-color: var(--ink); }
    `;
    document.head.appendChild(s);
  }

  // ---------------------------------------------------------------------------
  // Host bridge.
  // ---------------------------------------------------------------------------
  function setup() {
    injectStyles();
    applyAll();

    // 1. register listener FIRST
    window.addEventListener("message", e => {
      const msg = e.data;
      if (!msg || !msg.type) return;
      if (msg.type === "__activate_edit_mode") {
        const p = buildPanel();
        p.classList.add("open");
      } else if (msg.type === "__deactivate_edit_mode") {
        if (panelEl) panelEl.classList.remove("open");
      }
    });

    // 2. announce availability
    try {
      window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    } catch {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }
})();
