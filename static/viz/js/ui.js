// =============================================================================
// ui.js — chrome-side enhancements that sit ALONGSIDE the existing solver/
// render modules. Non-module script so it can run in both editorial and
// brutalist shells without touching app.js or render.js.
//
//   * keyboard shortcuts (space/→/←/R/M/N/P/0/?)
//   * pan & zoom on #canvas, with momentum-y feel
//   * minimap that mirrors the circuit SVG and shows the viewport rect
//   * hover tooltip on nodes with value/level/reason
//   * hover-to-highlight trail ↔ graph
//   * help overlay toggle
//   * trail/learned counters (if present in DOM)
//   * play/pause icon swap on the auto button
//   * next/prev circuit via N/P
// =============================================================================

(function () {
  "use strict";

  // -------------------------------------------------------------------------
  // Generic helpers.
  // -------------------------------------------------------------------------
  const $ = id => document.getElementById(id);
  const q = sel => document.querySelector(sel);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // waits until the <select> has been populated, then invokes fn once.
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  // -------------------------------------------------------------------------
  // Pan / zoom on #canvas.
  // -------------------------------------------------------------------------
  let panX = 0, panY = 0, zoom = 1;
  let isPanning = false, panStartX = 0, panStartY = 0, panOrigX = 0, panOrigY = 0;

  function applyTransform() {
    const inner = $("canvas");
    if (!inner) return;
    inner.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    syncMinimap();
  }

  function resetView() {
    panX = 0; panY = 0; zoom = 1;
    applyTransform();
  }

  function initPanZoom() {
    const wrap = $("canvas-wrap");
    if (!wrap) return;

    wrap.addEventListener("wheel", e => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = -e.deltaY * 0.0015;
      const newZoom = clamp(zoom * Math.exp(delta), 0.3, 6);
      // zoom about the cursor
      const k = newZoom / zoom;
      panX = mx - k * (mx - panX);
      panY = my - k * (my - panY);
      zoom = newZoom;
      applyTransform();
    }, { passive: false });

    wrap.addEventListener("pointerdown", e => {
      // don't hijack clicks on nodes / learned clauses / popup
      if (e.target.closest(".node,.lc-box,.lc-label,.popup")) return;
      isPanning = true;
      panStartX = e.clientX; panStartY = e.clientY;
      panOrigX  = panX;      panOrigY  = panY;
      wrap.setPointerCapture(e.pointerId);
      wrap.classList.add("panning");
    });
    wrap.addEventListener("pointermove", e => {
      if (!isPanning) return;
      panX = panOrigX + (e.clientX - panStartX);
      panY = panOrigY + (e.clientY - panStartY);
      applyTransform();
    });
    const stopPan = e => {
      if (!isPanning) return;
      isPanning = false;
      wrap.classList.remove("panning");
      try { wrap.releasePointerCapture(e.pointerId); } catch {}
    };
    wrap.addEventListener("pointerup",    stopPan);
    wrap.addEventListener("pointercancel", stopPan);
    wrap.addEventListener("pointerleave", stopPan);
  }

  // -------------------------------------------------------------------------
  // Minimap — mirror the main SVG, show a viewport rect.
  // -------------------------------------------------------------------------
  function syncMinimap() {
    const wrap = $("canvas-wrap");
    const mm = $("minimap");
    const vp = $("minimap-vp");
    const mmSvg = $("minimap-svg");
    const mainSvg = wrap?.querySelector("#canvas > svg");
    if (!wrap || !mm || !vp || !mmSvg || !mainSvg) return;

    // lazy-clone the SVG contents into the minimap (rebuild on circuit swap)
    if (mmSvg.dataset.stamp !== mainSvg.dataset.stamp) {
      mmSvg.innerHTML = "";
      mmSvg.setAttribute("viewBox", mainSvg.getAttribute("viewBox"));
      // deep-clone children; remove interactivity
      [...mainSvg.children].forEach(ch => {
        const c = ch.cloneNode(true);
        c.querySelectorAll("*").forEach(n => {
          n.removeAttribute("onclick");
          n.style.pointerEvents = "none";
        });
        mmSvg.appendChild(c);
      });
      mmSvg.dataset.stamp = mainSvg.dataset.stamp || String(Date.now());
    }

    // compute viewport rect inside minimap
    const wr = wrap.getBoundingClientRect();
    const mmr = mm.getBoundingClientRect();
    // what portion of the main viewport is visible, in the coord system of the SVG's bounding box
    const contentW = wr.width  * zoom; // scaled content size
    const contentH = wr.height * zoom;
    // visible fraction within the scaled content (in world px)
    const visW = wr.width  / zoom;
    const visH = wr.height / zoom;
    // visible origin in world (viewport coords before scale)
    const ox = -panX / zoom;
    const oy = -panY / zoom;
    // map to minimap px: world (0,0) -> mm top-left; world (wr.width, wr.height) -> mm bottom-right
    const fx = mmr.width  / wr.width;
    const fy = mmr.height / wr.height;
    vp.style.left   = `${ox * fx}px`;
    vp.style.top    = `${oy * fy}px`;
    vp.style.width  = `${visW * fx}px`;
    vp.style.height = `${visH * fy}px`;
  }

  // stamp the main SVG on every rebuild so the minimap knows to resync
  function observeSvgSwaps() {
    const canvas = $("canvas");
    if (!canvas) return;
    const obs = new MutationObserver(() => {
      const svg = canvas.querySelector("svg");
      if (svg && !svg.dataset.stamp) {
        svg.dataset.stamp = String(Date.now());
        syncMinimap();
      }
    });
    obs.observe(canvas, { childList: true, subtree: true });
  }

  // -------------------------------------------------------------------------
  // Node tooltip on hover.
  // -------------------------------------------------------------------------
  function initTooltip() {
    const tip = $("node-tip");
    const wrap = $("canvas-wrap");
    if (!tip || !wrap) return;

    wrap.addEventListener("mousemove", e => {
      const target = e.target.closest(".node");
      if (!target || !target.dataset.nodeId) {
        tip.hidden = true;
        return;
      }
      const id = target.dataset.nodeId;
      const info = readNodeInfo(id, target);
      tip.innerHTML = info;
      tip.hidden = false;

      const wr = wrap.getBoundingClientRect();
      const tipR = tip.getBoundingClientRect();
      let x = e.clientX - wr.left + 14;
      let y = e.clientY - wr.top + 14;
      // keep tooltip inside the wrap
      if (x + tipR.width > wr.width - 8) x = e.clientX - wr.left - tipR.width - 14;
      if (y + tipR.height > wr.height - 8) y = e.clientY - wr.top - tipR.height - 14;
      tip.style.left = `${x}px`;
      tip.style.top  = `${y}px`;
    });
    wrap.addEventListener("mouseleave", () => { tip.hidden = true; });
  }

  // Read solver state for a node by scraping what's in the DOM + classes.
  // Avoids importing solver.js (we're a plain script, not a module).
  function readNodeInfo(id, el) {
    // value from class
    let val = "—";
    let valCls = "";
    if (el.classList.contains("true"))  { val = "1"; valCls = "t-inline"; }
    if (el.classList.contains("false")) { val = "0"; valCls = "f-inline"; }

    const isGate  = !el.matches("circle.node.input, circle.input");
    const kind = el.tagName === "circle" ? "input" : "and‑gate";
    const annotations = [];
    if (el.classList.contains("jfrontier")) annotations.push("j‑frontier");
    if (el.classList.contains("conflict"))   annotations.push("conflict");
    if (el.classList.contains("reason-gate"))annotations.push("reason gate");
    if (el.classList.contains("pivot-var"))  annotations.push("pivot");
    if (el.classList.contains("clause-lit")) annotations.push("in learned clause");

    // try to find a trail entry that matches this id to show level/reason
    let level = "—", reason = "—";
    const trailEl = $("trail");
    if (trailEl) {
      const entry = [...trailEl.querySelectorAll(".trail-item")].find(t => {
        return (t.dataset.nodeId === id) ||
               t.textContent.startsWith(id + "=");
      });
      if (entry) {
        const m = entry.textContent.match(/@L?(\d+)/i) || entry.textContent.match(/@(\d+)/);
        if (m) level = m[1];
        if (entry.classList.contains("decision"))   reason = "decision";
        if (entry.classList.contains("assertion"))  reason = "output assertion";
        if (entry.classList.contains("forced"))     reason = "forced by propagation";
      }
    }

    return [
      `<div class="tip-id">${id}</div>`,
      `<div class="tip-row">${kind} · value <b class="${valCls}">${val}</b></div>`,
      `<div class="tip-row">level <b>${level}</b> · <b>${reason}</b></div>`,
      annotations.length
        ? `<div class="tip-row" style="margin-top:4px">${annotations.map(a=>`<b>${a}</b>`).join(" · ")}</div>`
        : ``,
    ].join("");
  }

  // -------------------------------------------------------------------------
  // Trail ↔ graph hover highlight.
  // -------------------------------------------------------------------------
  function initTrailHover() {
    const trail = $("trail");
    if (!trail) return;
    trail.addEventListener("mouseover", e => {
      const item = e.target.closest(".trail-item");
      if (!item) return;
      const id = item.dataset.nodeId || (item.textContent.match(/^([a-zA-Z0-9_]+)=/) || [])[1];
      if (!id) return;
      highlightNode(id);
    });
    trail.addEventListener("mouseout", e => {
      const item = e.target.closest(".trail-item");
      if (!item) return;
      clearHighlight();
    });
  }

  function highlightNode(id) {
    const svg = q("#canvas svg");
    if (!svg) return;
    svg.querySelectorAll(".node").forEach(n => {
      if (n.dataset.nodeId === id) n.classList.add("selected");
      else n.classList.add("dim");
    });
    svg.querySelectorAll(".edge,.junction,.inv-bubble").forEach(e => e.classList.add("dim"));
    // reveal edges touching this id
    svg.querySelectorAll(`[data-child-ref="${CSS.escape(id)}"]`).forEach(e => {
      e.classList.remove("dim");
      e.classList.add("highlight");
    });
  }
  function clearHighlight() {
    const svg = q("#canvas svg");
    if (!svg) return;
    svg.querySelectorAll(".node.selected").forEach(n => n.classList.remove("selected"));
    svg.querySelectorAll(".dim").forEach(e => e.classList.remove("dim"));
    svg.querySelectorAll(".highlight").forEach(e => e.classList.remove("highlight"));
  }

  // -------------------------------------------------------------------------
  // Keyboard shortcuts.
  // -------------------------------------------------------------------------
  function initKeyboard() {
    document.addEventListener("keydown", e => {
      const t = e.target;
      // don't hijack typing in inputs
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          clickIfEnabled("auto");
          break;
        case "ArrowRight":
          e.preventDefault();
          clickIfEnabled("step");
          break;
        case "ArrowLeft":
          e.preventDefault();
          clickIfEnabled("undo");
          break;
        case "r": case "R":
          e.preventDefault();
          $("reset")?.click();
          break;
        case "m": case "M": {
          const m = $("minimize");
          if (m) { m.checked = !m.checked; m.dispatchEvent(new Event("change", { bubbles: true })); }
          break;
        }
        case "n": case "N": cycleCircuit(+1); break;
        case "p": case "P": cycleCircuit(-1); break;
        case "0": resetView(); break;
        case "?":
          e.preventDefault();
          toggleHelp();
          break;
        case "Escape":
          {
            const h = $("help-overlay");
            if (h && !h.hidden) h.hidden = true;
            document.querySelectorAll(".popup").forEach(p => p.remove());
            // hide the node tooltip too, just in case it got stuck
            const tip = $("node-tip");
            if (tip) tip.hidden = true;
          }
          break;
      }
    });
  }

  function clickIfEnabled(id) {
    const b = $(id);
    if (b && !b.disabled) b.click();
  }

  function cycleCircuit(dir) {
    const sel = $("circuit-select");
    if (!sel) return;
    const n = sel.options.length;
    if (n === 0) return;
    sel.selectedIndex = ((sel.selectedIndex + dir) % n + n) % n;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function toggleHelp() {
    const h = $("help-overlay");
    if (!h) return;
    h.hidden = !h.hidden;
  }

  // -------------------------------------------------------------------------
  // Counters / play-pause icon / close-on-outside for help.
  // -------------------------------------------------------------------------
  function initCounters() {
    // observe changes to trail/learned/analysis panels and update counts + icons
    const updateCounts = () => {
      const trail = $("trail");
      const learned = $("learned");
      const analysis = $("analysis");
      const tc = $("trail-count");
      const lc = $("learned-count");
      const ac = $("analysis-meta");
      if (tc && trail) {
        const n = trail.querySelectorAll(".trail-item").length;
        tc.textContent = n ? `${n} entr${n === 1 ? "y" : "ies"}` : "—";
      }
      if (lc && learned) {
        const n = learned.querySelectorAll(".trail-item").length;
        lc.textContent = n ? `${n} clause${n === 1 ? "" : "s"}` : "—";
      }
      if (ac && analysis) {
        const conflict = document.getElementById("status")?.classList.contains("conflict");
        const unsat    = document.getElementById("status")?.classList.contains("unsat");
        ac.textContent = unsat ? "unsat" : conflict ? "resolving…" : "—";
      }

      // auto button icon swap (play ↔ pause) based on whether it's enabled
      const auto = $("auto");
      if (auto) {
        const play = auto.querySelector(".pp-play");
        const pause= auto.querySelector(".pp-pause");
        const armed = !auto.disabled;
        if (play)  play.hidden  = !armed ? false : false;
        // we keep play icon; pause shows if you wanted to track an in-flight auto
        if (pause) pause.hidden = true;
      }
    };

    // poll + observe; render() calls into these elements fairly often
    const obsTargets = ["trail", "learned", "analysis", "status"].map($).filter(Boolean);
    obsTargets.forEach(el => {
      const mo = new MutationObserver(updateCounts);
      mo.observe(el, { childList: true, subtree: true, attributes: true });
    });
    updateCounts();
  }

  function initHelpDismiss() {
    const h = $("help-overlay");
    if (!h) return;
    h.addEventListener("click", e => {
      if (e.target === h) h.hidden = true;
    });
  }

  // -------------------------------------------------------------------------
  // Decide-popup augmentation: append a close ✕ whenever the popup appears.
  // render.js creates <div class="popup" id="popup">…</div> on node click.
  // -------------------------------------------------------------------------
  function initPopupObserver() {
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.nodeType === 1 && n.classList?.contains("popup")) {
            augmentPopup(n);
          }
        }
      }
    });
    mo.observe(document.body, { childList: true });
  }

  function augmentPopup(popup) {
    if (popup.querySelector(".popup-close")) return;
    const x = document.createElement("button");
    x.className = "popup-close";
    x.type = "button";
    x.setAttribute("aria-label", "close");
    x.innerHTML = "&times;";
    x.onclick = e => {
      e.stopPropagation();
      popup.remove();
    };
    popup.appendChild(x);

    // auto-dismiss after 5s so it never hangs around forever
    const timer = setTimeout(() => popup.remove(), 5000);
    popup.addEventListener("pointerenter", () => clearTimeout(timer), { once: true });
  }

  // -------------------------------------------------------------------------
  // Legend dismiss: add a ✕ to the corner legend if it exists.
  // -------------------------------------------------------------------------
  function initLegendDismiss() {
    const legend = document.querySelector(".legend");
    if (!legend || legend.querySelector(".legend-close")) return;
    const x = document.createElement("button");
    x.className = "legend-close";
    x.type = "button";
    x.setAttribute("aria-label", "hide legend");
    x.title = "hide legend";
    x.innerHTML = "&times;";
    x.onclick = () => legend.remove();
    legend.appendChild(x);
  }

  // -------------------------------------------------------------------------
  // Boot.
  // -------------------------------------------------------------------------
  onReady(() => {
    initPanZoom();
    observeSvgSwaps();
    // initTooltip() — disabled by request
    initTrailHover();
    initKeyboard();
    initCounters();
    initHelpDismiss();
    initPopupObserver();
    initLegendDismiss();
    // give app.js a moment to finish booting, then resync minimap
    setTimeout(syncMinimap, 400);
    window.addEventListener("resize", syncMinimap);
  });
})();
