// =============================================================================
// tweaks-brutalist.js — Tweaks panel for the Brutalist variant.
// =============================================================================

(function () {
  "use strict";

  const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
    "trueColor":        "#0d8a3e",
    "falseColor":       "#d43a2b",
    "accentColor":      "#d43a2b",
    "paperColor":       "#fcfaf3",
    "fontSizeScale":    1.0,
    "ruleWeight":       "heavy",
    "showMinimap":      true,
    "showCrosshairs":   true,
    "showKbdStrip":     true,
    "showBoxShadow":    true,
    "animationSpeed":   "normal",
    "dither":           false
  }/*EDITMODE-END*/;

  let state = { ...TWEAKS_DEFAULTS };
  let panelEl = null;

  function applyTweak(key, value) {
    const root = document.documentElement;
    switch (key) {
      case "trueColor":
        root.style.setProperty("--t", value);
        root.style.setProperty("--t-bg", softenColor(value, 0.78, "#fcfaf3"));
        break;
      case "falseColor":
        root.style.setProperty("--f", value);
        root.style.setProperty("--f-bg", softenColor(value, 0.78, "#fcfaf3"));
        break;
      case "accentColor":
        [...document.querySelectorAll(".panel-num, .help-h, .sec.active::after, .sigil-mark")]
          .forEach(e => { if (e.tagName) e.style.color = value; });
        // sigil-mark in particular
        const sm = document.querySelector(".sigil-mark"); if (sm) sm.style.color = value;
        // panel-num
        document.querySelectorAll(".panel-num").forEach(e => e.style.color = value);
        break;
      case "paperColor":
        root.style.setProperty("--paper", value);
        root.style.setProperty("--paper-2", darkenColor(value, 0.04));
        break;
      case "fontSizeScale":
        document.body.style.fontSize = `${13 * value}px`;
        break;
      case "ruleWeight": {
        const m = value === "hair" ? "1px" : value === "medium" ? "2px" : "3px";
        const mw = value === "hair" ? "1px" : value === "medium" ? "1.5px" : "2px";
        root.style.setProperty("--rule-thick", m);
        root.style.setProperty("--rule-w", mw);
        break;
      }
      case "showMinimap":    toggleVisibility("#minimap", value); break;
      case "showCrosshairs": toggleVisibility(".crosshair", value); break;
      case "showKbdStrip":   toggleVisibility(".kbd-strip", value); break;
      case "showBoxShadow": {
        const sheet = ensureSheet("tweaks-shadow-sheet");
        sheet.textContent = value ? `` : `.frame, .btn, .minimap, .node-tip, .help-card, .popup, #analysis .unsat-banner { box-shadow: none !important; }`;
        break;
      }
      case "animationSpeed": {
        const mult = value === "slow" ? 2.2 : value === "fast" ? 0.35 : 1;
        const sheet = ensureSheet("tweaks-motion-sheet");
        sheet.textContent = `
          .node, .edge, .junction, .inv-bubble, .output-arrow, .lc-edge, .lc-box {
            transition-duration: ${0.25 * mult}s !important;
          }`;
        break;
      }
      case "dither": {
        const sheet = ensureSheet("tweaks-dither-sheet");
        sheet.textContent = value ? `
          body::after {
            content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 999;
            background-image:
              repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 2px);
            mix-blend-mode: multiply;
          }` : ``;
        break;
      }
    }
  }

  function toggleVisibility(sel, show) {
    document.querySelectorAll(sel).forEach(el => el.style.display = show ? "" : "none");
  }
  function ensureSheet(id) {
    let s = document.getElementById(id);
    if (!s) { s = document.createElement("style"); s.id = id; document.head.appendChild(s); }
    return s;
  }

  function parseHex(hex) {
    const h = hex.replace("#", "");
    if (h.length === 3) return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  function toHex(r, g, b) {
    return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  }
  function softenColor(hex, amount, paper) {
    const [r, g, b] = parseHex(hex);
    const [pr, pg, pb] = parseHex(paper);
    return toHex(r + (pr - r) * amount, g + (pg - g) * amount, b + (pb - b) * amount);
  }
  function darkenColor(hex, amount) {
    const [r, g, b] = parseHex(hex);
    return toHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
  }

  function applyAll() {
    for (const [k, v] of Object.entries(state)) applyTweak(k, v);
  }

  function buildPanel() {
    if (panelEl) return panelEl;
    const el = document.createElement("aside");
    el.className = "tweaks-panel-b";
    el.id = "tweaks-panel";
    el.innerHTML = `
      <div class="twb-head">
        <span class="twb-label">// TWEAKS</span>
        <button class="twb-close" aria-label="close">[x]</button>
      </div>

      <div class="twb-group">
        <div class="twb-group-h">[palette]</div>
        <label class="twb-row"><span>true</span><input type="color" data-key="trueColor" value="${state.trueColor}"></label>
        <label class="twb-row"><span>false</span><input type="color" data-key="falseColor" value="${state.falseColor}"></label>
        <label class="twb-row"><span>accent</span><input type="color" data-key="accentColor" value="${state.accentColor}"></label>
        <label class="twb-row"><span>paper</span><input type="color" data-key="paperColor" value="${state.paperColor}"></label>
      </div>

      <div class="twb-group">
        <div class="twb-group-h">[type]</div>
        <label class="twb-row"><span>size</span><input type="range" data-key="fontSizeScale" min="0.9" max="1.15" step="0.05" value="${state.fontSizeScale}"></label>
      </div>

      <div class="twb-group">
        <div class="twb-group-h">[rules]</div>
        <div class="twb-row"><span>weight</span>
          <div class="twb-seg">
            <button data-key="ruleWeight" data-val="hair"   class="${state.ruleWeight === "hair"   ? "on" : ""}">hair</button>
            <button data-key="ruleWeight" data-val="medium" class="${state.ruleWeight === "medium" ? "on" : ""}">med</button>
            <button data-key="ruleWeight" data-val="heavy"  class="${state.ruleWeight === "heavy"  ? "on" : ""}">heavy</button>
          </div>
        </div>
      </div>

      <div class="twb-group">
        <div class="twb-group-h">[chrome]</div>
        <label class="twb-row twb-check"><span>minimap</span><input type="checkbox" data-key="showMinimap" ${state.showMinimap ? "checked" : ""}></label>
        <label class="twb-row twb-check"><span>crosshairs</span><input type="checkbox" data-key="showCrosshairs" ${state.showCrosshairs ? "checked" : ""}></label>
        <label class="twb-row twb-check"><span>kbd strip</span><input type="checkbox" data-key="showKbdStrip" ${state.showKbdStrip ? "checked" : ""}></label>
        <label class="twb-row twb-check"><span>hard shadow</span><input type="checkbox" data-key="showBoxShadow" ${state.showBoxShadow ? "checked" : ""}></label>
        <label class="twb-row twb-check"><span>dither overlay</span><input type="checkbox" data-key="dither" ${state.dither ? "checked" : ""}></label>
      </div>

      <div class="twb-group">
        <div class="twb-group-h">[motion]</div>
        <div class="twb-row"><span>speed</span>
          <div class="twb-seg">
            <button data-key="animationSpeed" data-val="slow"   class="${state.animationSpeed === "slow"   ? "on" : ""}">slow</button>
            <button data-key="animationSpeed" data-val="normal" class="${state.animationSpeed === "normal" ? "on" : ""}">norm</button>
            <button data-key="animationSpeed" data-val="fast"   class="${state.animationSpeed === "fast"   ? "on" : ""}">fast</button>
          </div>
        </div>
      </div>

      <div class="twb-foot">
        <button class="twb-reset">&gt; reset all</button>
      </div>
    `;
    document.body.appendChild(el);

    el.querySelectorAll("input[data-key], .twb-seg button[data-key]").forEach(inp => {
      const ev = inp.type === "color" || inp.type === "range" ? "input"
              : inp.type === "checkbox" ? "change"
              : "click";
      inp.addEventListener(ev, () => {
        const key = inp.dataset.key;
        let val;
        if (inp.tagName === "BUTTON") {
          val = inp.dataset.val;
          inp.parentElement.querySelectorAll("button").forEach(b => b.classList.toggle("on", b === inp));
        } else if (inp.type === "checkbox") val = inp.checked;
        else if (inp.type === "range") val = parseFloat(inp.value);
        else val = inp.value;
        state[key] = val;
        applyTweak(key, val);
        try { window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [key]: val } }, "*"); } catch {}
      });
    });

    el.querySelector(".twb-close").addEventListener("click", () => el.classList.remove("open"));
    el.querySelector(".twb-reset").addEventListener("click", () => {
      state = { ...TWEAKS_DEFAULTS };
      applyAll();
      el.remove();
      panelEl = null;
      buildPanel().classList.add("open");
      try { window.parent.postMessage({ type: "__edit_mode_set_keys", edits: TWEAKS_DEFAULTS }, "*"); } catch {}
    });

    panelEl = el;
    return el;
  }

  function injectStyles() {
    if (document.getElementById("tweaks-brutalist-styles")) return;
    const s = document.createElement("style");
    s.id = "tweaks-brutalist-styles";
    s.textContent = `
      .tweaks-panel-b {
        position: fixed; bottom: 24px; right: 24px;
        width: 260px;
        max-height: calc(100vh - 48px);
        overflow-y: auto;
        background: var(--paper, #fcfaf3);
        border: 3px solid var(--ink, #0a0a0a);
        box-shadow: 6px 6px 0 var(--ink, #0a0a0a);
        font-family: var(--mono, "JetBrains Mono", monospace);
        color: var(--ink, #0a0a0a);
        font-size: 11.5px;
        z-index: 200;
        transform: translate(calc(100% + 48px), 0);
        transition: transform 0.3s cubic-bezier(0.2,0.7,0.2,1);
        padding: 0;
      }
      .tweaks-panel-b.open { transform: translate(0,0); }
      .tweaks-panel-b::-webkit-scrollbar { width: 8px; }
      .tweaks-panel-b::-webkit-scrollbar-thumb { background: var(--ink, #0a0a0a); }

      .tweaks-panel-b .twb-head {
        display: flex; justify-content: space-between; align-items: center;
        background: var(--ink, #0a0a0a); color: var(--paper, #fcfaf3);
        padding: 6px 12px;
        letter-spacing: 0.14em;
        font-size: 11px;
        font-weight: 600;
      }
      .tweaks-panel-b .twb-close {
        background: transparent; border: none; color: var(--paper, #fcfaf3);
        font-family: var(--mono); cursor: pointer; padding: 0; font-size: 11px;
      }
      .tweaks-panel-b .twb-close:hover { color: var(--f, #d43a2b); }

      .tweaks-panel-b .twb-group {
        padding: 10px 14px;
        border-bottom: 2px solid var(--ink, #0a0a0a);
      }
      .tweaks-panel-b .twb-group:last-of-type { border-bottom: none; }
      .tweaks-panel-b .twb-group-h {
        color: var(--f, #d43a2b); font-weight: 700; font-size: 10.5px;
        letter-spacing: 0.1em; margin-bottom: 6px;
      }
      .tweaks-panel-b .twb-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 4px 0; gap: 10px;
      }
      .tweaks-panel-b .twb-row > span { font-size: 11.5px; color: var(--ink-2, #2a2a2a); }

      .tweaks-panel-b input[type="color"] {
        width: 32px; height: 20px; padding: 0;
        border: 2px solid var(--ink, #0a0a0a); background: transparent;
        cursor: pointer;
      }
      .tweaks-panel-b input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
      .tweaks-panel-b input[type="color"]::-webkit-color-swatch { border: none; }

      .tweaks-panel-b input[type="range"] {
        flex: 1; max-width: 130px;
        accent-color: var(--f, #d43a2b);
      }
      .tweaks-panel-b input[type="checkbox"] {
        accent-color: var(--ink, #0a0a0a);
        width: 14px; height: 14px;
      }

      .tweaks-panel-b .twb-seg {
        display: inline-flex;
        border: 2px solid var(--ink, #0a0a0a);
      }
      .tweaks-panel-b .twb-seg button {
        background: var(--paper, #fcfaf3); color: var(--ink, #0a0a0a);
        border: none; border-right: 1px solid var(--ink, #0a0a0a);
        padding: 3px 9px; font-family: var(--mono); font-size: 10.5px;
        cursor: pointer; font-weight: 600;
      }
      .tweaks-panel-b .twb-seg button:last-child { border-right: none; }
      .tweaks-panel-b .twb-seg button:hover { background: var(--paper-2, #f6f2e3); }
      .tweaks-panel-b .twb-seg button.on { background: var(--ink, #0a0a0a); color: var(--paper, #fcfaf3); }

      .tweaks-panel-b .twb-foot { padding: 10px 14px; display: flex; justify-content: flex-end; }
      .tweaks-panel-b .twb-reset {
        background: var(--paper, #fcfaf3); color: var(--ink, #0a0a0a);
        border: 2px solid var(--ink, #0a0a0a); padding: 4px 10px;
        font-family: var(--mono); font-size: 11px; cursor: pointer; font-weight: 600;
        box-shadow: 2px 2px 0 var(--ink, #0a0a0a);
      }
      .tweaks-panel-b .twb-reset:hover { background: var(--ink, #0a0a0a); color: var(--paper, #fcfaf3); }
      .tweaks-panel-b .twb-reset:active { transform: translate(2px, 2px); box-shadow: none; }
    `;
    document.head.appendChild(s);
  }

  function setup() {
    injectStyles();
    applyAll();
    window.addEventListener("message", e => {
      const msg = e.data;
      if (!msg || !msg.type) return;
      if (msg.type === "__activate_edit_mode") buildPanel().classList.add("open");
      else if (msg.type === "__deactivate_edit_mode") panelEl?.classList.remove("open");
    });
    try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
