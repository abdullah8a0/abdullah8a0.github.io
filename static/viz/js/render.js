// =============================================================================
// render.js — SVG rendering and footer-panel updates.
//
// Pure read-path over solver state. Has no mutation access into the solver
// beyond the click handlers it installs for node/learned-clause interactions
// (those call decide / toggleHistory in solver.js).
//
// The top-level `render()` function is invoked from:
//   * solver.js engine actions (decide, undo, reset, step/auto, toggleHistory)
//   * app.js loadCircuit (after swapping in a new SVG)
//
// buildSvg() builds the whole SVG tree from scratch — done once per circuit
// swap. updateVisuals() is the fast in-place pass: it toggles classes on the
// already-built nodes/edges to reflect current values, and rebuilds only the
// learned-clause annotation layer (since the clause list changes mid-solve).
// =============================================================================

import {
  SVG_NS, UNKNOWN, TRUE, FALSE, INPUT_R, GATE_W, GATE_H, BUBBLE_R,
} from "./constants.js";
import * as S from "./solver.js";

// ---------------------------------------------------------------------------
// Geometry helpers.
// ---------------------------------------------------------------------------

function fanoutCount(id) {
  return S.fanout[id].length + S.circuit.outputs.filter(o => o.ref === id).length;
}

function portOut(node) {
  if (S.isInput(node.id)) return { x: node.x + INPUT_R, y: node.y };
  return { x: node.x + GATE_W / 2, y: node.y };
}

// Where fan-out wires leave the source. If there's more than one consumer,
// we push the branch point outward from the node and draw a junction dot.
function branchPoint(id) {
  const p = portOut(S.nodeOf(id));
  return fanoutCount(id) > 1 ? { x: p.x + 14, y: p.y } : p;
}

function portIn(gate, slot) {
  return { x: gate.x - GATE_W / 2, y: gate.y + (slot === 0 ? -9 : 9) };
}

// Smooth S-curve between two horizontally-separated points, with horizontal
// tangents at both ends — looks like a real schematic wire.
function bezierCtrl(p0, p1) {
  const dx = Math.max(24, Math.abs(p1.x - p0.x));
  return [{ x: p0.x + dx * 0.5, y: p0.y }, { x: p1.x - dx * 0.5, y: p1.y }];
}

function bezierPath(p0, p1) {
  const [c0, c1] = bezierCtrl(p0, p1);
  return `M ${p0.x} ${p0.y} C ${c0.x} ${c0.y}, ${c1.x} ${c1.y}, ${p1.x} ${p1.y}`;
}

// De Casteljau split at t=0.5 — returns the two path strings and the midpoint.
function bezierHalves(p0, p1) {
  const [c0, c1] = bezierCtrl(p0, p1);
  const mid   = midpt(c0, c1);
  const m01   = midpt(p0, c0);
  const m12   = mid;
  const m23   = midpt(c1, p1);
  const m012  = midpt(m01, m12);
  const m123  = midpt(m12, m23);
  const split = midpt(m012, m123);
  return {
    mid: split,
    first:  `M ${p0.x} ${p0.y} C ${m01.x} ${m01.y}, ${m012.x} ${m012.y}, ${split.x} ${split.y}`,
    second: `M ${split.x} ${split.y} C ${m123.x} ${m123.y}, ${m23.x} ${m23.y}, ${p1.x} ${p1.y}`,
  };
}

function midpt(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

// D-shape for an AND gate: flat on the left, semicircular bulge on the right.
function gatePath(g) {
  const { x, y } = g;
  const left = x - GATE_W / 2;
  const top  = y - GATE_H / 2;
  const bot  = y + GATE_H / 2;
  const arcStart = x + GATE_W / 2 - GATE_H / 2;
  const r = GATE_H / 2;
  return `M ${left} ${top} L ${arcStart} ${top} A ${r} ${r} 0 0 1 ${arcStart} ${bot} L ${left} ${bot} Z`;
}

function mkSvgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") el.textContent = v;
    else el.setAttribute(k, v);
  }
  return el;
}

// ---------------------------------------------------------------------------
// Build the SVG scene from scratch. Called on circuit load.
// ---------------------------------------------------------------------------

export function buildSvg() {
  const svg = mkSvgEl("svg", {
    viewBox: S.circuit.viewBox || "0 0 1060 680",
    preserveAspectRatio: "xMidYMid meet",
  });

  // Draw order (back-to-front):
  //   1. Fan-out stubs  (lowest z — segments from source to the junction dot)
  //   2. Gate-to-gate / gate-to-output edges  (with bubbles)
  //   3. Junction dots
  //   4. Learned-clause edge layer (dotted connectors, placed under nodes)
  //   5. Nodes (circles for inputs, D-shapes for gates, text for outputs)
  //   6. Learned-clause box layer (over nodes)
  S.allIds.forEach(id => drawStub(svg, id));
  S.circuit.gates.forEach(g => {
    [g.child0, g.child1].forEach((child, slot) => drawEdge(svg, child, g, slot));
  });
  S.circuit.outputs.forEach(o => drawOutputEdge(svg, o));
  S.allIds.forEach(id => drawJunction(svg, id));

  svg.appendChild(mkSvgEl("g", { id: "lc-edges-layer" }));

  S.circuit.inputs .forEach(n => drawInput (svg, n));
  S.circuit.gates  .forEach(g => drawGate  (svg, g));
  S.circuit.outputs.forEach(o => drawOutput(svg, o));

  svg.appendChild(mkSvgEl("g", { id: "lc-boxes-layer" }));

  return svg;
}

function drawStub(svg, id) {
  if (fanoutCount(id) <= 1) return;
  const p0 = portOut(S.nodeOf(id));
  const p1 = branchPoint(id);
  const s  = mkSvgEl("line", { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, class: "edge" });
  s.dataset.childRef = id;
  svg.appendChild(s);
}

function drawJunction(svg, id) {
  if (fanoutCount(id) <= 1) return;
  const p = branchPoint(id);
  const dot = mkSvgEl("circle", { cx: p.x, cy: p.y, r: 3.5, class: "junction" });
  dot.dataset.childRef = id;
  svg.appendChild(dot);
}

function drawEdge(svg, child, gate, slot) {
  const p0 = branchPoint(child.ref);
  const p1 = portIn(gate, slot);
  if (child.inv) {
    const { first, second, mid } = bezierHalves(p0, p1);
    const a = mkSvgEl("path", { d: first,  class: "edge" });
    const b = mkSvgEl("path", { d: second, class: "edge" });
    a.dataset.childRef = child.ref;
    b.dataset.childRef = child.ref;
    b.dataset.postInv  = "1";
    svg.appendChild(a);
    svg.appendChild(b);
    const bub = mkSvgEl("circle", {
      cx: mid.x, cy: mid.y, r: BUBBLE_R, class: "inv-bubble",
    });
    bub.dataset.childRef = child.ref;
    svg.appendChild(bub);
  } else {
    const path = mkSvgEl("path", { d: bezierPath(p0, p1), class: "edge" });
    path.dataset.childRef = child.ref;
    svg.appendChild(path);
  }
}

function drawOutputEdge(svg, o) {
  const p0 = branchPoint(o.ref);
  const arrowTip = { x: o.x - 4, y: o.y };
  const lineEnd  = { x: o.x - 14, y: o.y };

  if (o.inv) {
    const { first, second, mid } = bezierHalves(p0, lineEnd);
    const a = mkSvgEl("path", { d: first,  class: "edge" });
    const b = mkSvgEl("path", { d: second, class: "edge" });
    a.dataset.outputId = o.id;
    b.dataset.outputId = o.id;
    b.dataset.postInv  = "1";
    svg.appendChild(a);
    svg.appendChild(b);
    const bub = mkSvgEl("circle", {
      cx: mid.x, cy: mid.y, r: BUBBLE_R, class: "inv-bubble",
    });
    bub.dataset.outputId = o.id;
    svg.appendChild(bub);
  } else {
    const path = mkSvgEl("path", { d: bezierPath(p0, lineEnd), class: "edge" });
    path.dataset.outputId = o.id;
    svg.appendChild(path);
  }

  const arrow = mkSvgEl("path", {
    d: `M ${lineEnd.x} ${o.y - 5} L ${arrowTip.x} ${o.y} L ${lineEnd.x} ${o.y + 5} Z`,
    class: "output-arrow",
  });
  arrow.dataset.outputId = o.id;
  svg.appendChild(arrow);
}

function drawInput(svg, n) {
  const c = mkSvgEl("circle", { cx: n.x, cy: n.y, r: INPUT_R, class: "node input" });
  c.dataset.nodeId = n.id;
  c.addEventListener("click", e => onNodeClick(e, n.id));
  svg.appendChild(c);
  svg.appendChild(mkSvgEl("text", { x: n.x, y: n.y, class: "node-label", text: n.label }));
}

function drawGate(svg, g) {
  const p = mkSvgEl("path", { d: gatePath(g), class: "node gate" });
  p.dataset.nodeId = g.id;
  p.addEventListener("click", e => onNodeClick(e, g.id));
  svg.appendChild(p);
  // Label slightly left of center (visual center of D-shape is right of geom).
  svg.appendChild(mkSvgEl("text", {
    x: g.x - 4, y: g.y, class: "node-label", text: g.label,
  }));
}

function drawOutput(svg, o) {
  svg.appendChild(mkSvgEl("text", {
    x: o.x + 6, y: o.y, class: "node-label output-label", text: o.label,
  }));
}

// ---------------------------------------------------------------------------
// In-place updates: flip CSS classes on the already-built SVG to match
// current solver state. Called on every render tick.
// ---------------------------------------------------------------------------

function effectiveEdgeValue(ref, inv) {
  const v = S.state[ref]?.value;
  if (v === UNKNOWN || v == null) return UNKNOWN;
  return S.applyInv(v, inv);
}

function outputInv(id) {
  return S.circuit.outputs.find(o => o.id === id).inv;
}

function updateVisuals() {
  const svg = document.querySelector("#canvas svg");
  if (!svg) return;

  const hi = S.analysisHighlights();

  // Nodes — fill from value, outline from conflict/analysis highlights.
  svg.querySelectorAll(".node").forEach(el => {
    const id = el.dataset.nodeId;
    const v  = S.state[id].value;
    el.classList.remove("true", "false", "jfrontier", "conflict",
                        "clause-lit", "pivot-var", "reason-gate");
    if (v === TRUE)  el.classList.add("true");
    if (v === FALSE) el.classList.add("false");
    if (S.isJFrontier(id)) el.classList.add("jfrontier");
    if (hi.clauseVars.has(id))  el.classList.add("clause-lit");
    if (hi.reasonGate === id)   el.classList.add("reason-gate");
    if (hi.pivot === id)        el.classList.add("pivot-var");
    if (S.conflict && S.conflict.id === id) el.classList.add("conflict");
  });

  // Wires carry the source's raw signal up to the inverter bubble; the half
  // after the bubble carries the inverted signal. Edges tagged data-post-inv
  // are colored by applyInv(rawValue, true).
  svg.querySelectorAll(".edge").forEach(el => {
    el.classList.remove("active-true", "active-false");
    let ref;
    if (el.dataset.childRef)       ref = el.dataset.childRef;
    else if (el.dataset.outputId)  ref = S.circuit.outputs.find(o => o.id === el.dataset.outputId).ref;
    else return;
    const raw = S.state[ref]?.value;
    if (raw === UNKNOWN || raw == null) return;
    const v = el.dataset.postInv === "1" ? S.applyInv(raw, true) : raw;
    if (v === TRUE)  el.classList.add("active-true");
    if (v === FALSE) el.classList.add("active-false");
  });

  svg.querySelectorAll(".inv-bubble").forEach(el => {
    el.classList.remove("active-true", "active-false");
    let ref, inv;
    if (el.dataset.childRef) { ref = el.dataset.childRef; inv = true; }
    else if (el.dataset.outputId) {
      ref = S.circuit.outputs.find(o => o.id === el.dataset.outputId).ref;
      inv = outputInv(el.dataset.outputId);
    } else return;
    const eff = effectiveEdgeValue(ref, inv);
    if (eff === TRUE)  el.classList.add("active-true");
    if (eff === FALSE) el.classList.add("active-false");
  });

  svg.querySelectorAll(".junction").forEach(el => {
    el.classList.remove("active-true", "active-false");
    const v = S.state[el.dataset.childRef]?.value;
    if (v === TRUE)  el.classList.add("active-true");
    if (v === FALSE) el.classList.add("active-false");
  });

  svg.querySelectorAll(".output-arrow").forEach(el => {
    el.classList.remove("active-true", "active-false");
    const o = S.circuit.outputs.find(o => o.id === el.dataset.outputId);
    const eff = effectiveEdgeValue(o.ref, o.inv);
    if (eff === TRUE)  el.classList.add("active-true");
    if (eff === FALSE) el.classList.add("active-false");
  });

  drawLearnedLayer();
}

// ---------------------------------------------------------------------------
// Learned-clause annotation layer (rebuilt from scratch each tick — the
// clause list and state-class assignments both change mid-solve).
// ---------------------------------------------------------------------------

const LC_ROW_H  = 42;
const LC_BOX_H  = 28;
const LC_PAD    = 14;
const LC_MARGIN = 50;

function lcStripY() {
  if (S.circuit?.lcY) return S.circuit.lcY;
  const parts = (S.circuit?.viewBox || "0 0 1060 680").split(" ").map(Number);
  return parts[3] - 100;
}
function lcMaxX() {
  const parts = (S.circuit?.viewBox || "0 0 1060 680").split(" ").map(Number);
  return parts[2] - LC_MARGIN;
}

function drawLearnedLayer() {
  const edgesLayer = document.getElementById("lc-edges-layer");
  const boxesLayer = document.getElementById("lc-boxes-layer");
  if (!edgesLayer || !boxesLayer) return;
  while (edgesLayer.firstChild) edgesLayer.removeChild(edgesLayer.firstChild);
  while (boxesLayer.firstChild) boxesLayer.removeChild(boxesLayer.firstChild);
  if (S.learnedClauses.length === 0) return;

  // Which clauses are firing (forced a live assignment), conflict (trigger),
  // or open in the history view?
  const firingIdx = new Set();
  S.trail.forEach(v => {
    const r = S.state[v].reason;
    if (r && r.type === "learned") firingIdx.add(r.idx);
  });
  const conflictIdx =
    (S.conflict && S.conflict.reason && S.conflict.reason.type === "learned")
      ? S.conflict.reason.idx : -1;
  const reasonIdx = S.analysisHighlights().reasonClauseIdx;

  let cx = LC_MARGIN, cy = lcStripY();
  const xMax = lcMaxX();

  S.learnedClauses.forEach((cl, idx) => {
    const text = `${cl.id}: ${S.clauseStr(cl.literals)}`;
    const width = Math.max(90, text.length * 6.6 + 22);
    if (cx + width > xMax) { cx = LC_MARGIN; cy += LC_ROW_H; }

    const box = { x: cx, y: cy, w: width, h: LC_BOX_H };
    const center = { x: cx + width / 2, y: cy + LC_BOX_H / 2 };
    cx += width + LC_PAD;

    const isHistory = S.historyView && S.historyView.idx === idx;
    const stateClass =
      idx === conflictIdx ? " conflict" :
      idx === reasonIdx   ? " reason"   :
      isHistory           ? " reason"   :
      firingIdx.has(idx)  ? " firing"   : "";

    cl.literals.forEach(l => {
      const node = S.nodeOf(l.var);
      if (!node) return;
      const line = mkSvgEl("line", {
        x1: center.x, y1: box.y,
        x2: node.x,   y2: node.y,
        class: "lc-edge" + stateClass,
      });
      edgesLayer.appendChild(line);
    });

    const rect = mkSvgEl("rect", {
      x: box.x, y: box.y, width: box.w, height: box.h, rx: 6,
      class: "lc-box clickable" + stateClass,
    });
    const label = mkSvgEl("text", {
      x: center.x, y: center.y, text,
      class: "lc-label clickable" + stateClass,
    });
    const onClick = () => S.toggleHistory(idx);
    rect.onclick  = onClick;
    label.onclick = onClick;
    boxesLayer.appendChild(rect);
    boxesLayer.appendChild(label);
  });
}

// ---------------------------------------------------------------------------
// Footer panels: trail, learned-clause list, analysis / UNSAT-proof / history.
// ---------------------------------------------------------------------------

function renderTrail() {
  const el = document.getElementById("trail");
  el.innerHTML = "";
  if (S.trail.length === 0) {
    const s = document.createElement("span");
    s.className = "label";
    s.textContent = "(empty)";
    el.appendChild(s);
    return;
  }
  S.trail.forEach(id => {
    const st = S.state[id];
    const v  = st.value === TRUE ? "1" : "0";
    const span = document.createElement("span");
    const kind =
      st.reason === null              ? "decision"
      : st.reason.type === "assertion" ? "assertion"
      : "forced";
    span.className = "trail-item " + kind;
    span.textContent = `${id}=${v}@${st.level}`;
    el.appendChild(span);
  });
  if (S.conflict) {
    const span = document.createElement("span");
    span.className = "trail-item conflict";
    if (S.conflict.id) {
      const existing  = S.conflict.existing  === TRUE ? "1" : "0";
      const attempted = S.conflict.attempted === TRUE ? "1" : "0";
      span.textContent = `⚡ ${S.conflict.id}: had ${existing}, forced ${attempted}`;
    } else {
      const r = S.conflict.reason;
      const via = r?.type === "learned" ? S.learnedClauses[r.idx].id : "?";
      span.textContent = `⚡ ${via} falsified`;
    }
    el.appendChild(span);
  }
}

function renderLearned() {
  const el = document.getElementById("learned");
  el.innerHTML = "";
  if (S.learnedClauses.length === 0) {
    const s = document.createElement("span");
    s.className = "label";
    s.textContent = "(none)";
    el.appendChild(s);
    return;
  }
  S.learnedClauses.forEach(cl => {
    const span = document.createElement("span");
    span.className = "trail-item";
    span.textContent = `${cl.id}: ${S.clauseStr(cl.literals)}`;
    el.appendChild(span);
  });
}

function renderAnalysis() {
  const el = document.getElementById("analysis");
  el.innerHTML = "";
  if (S.isUnsat()) {
    renderUnsatProof(el);
    if (S.historyView) renderHistoryPanel(el);
    return;
  }
  if (S.historyView && !S.analysisState) {
    renderHistoryPanel(el);
    return;
  }
  if (!S.analysisState) return;
  const { result, step } = S.analysisState;

  for (let i = 0; i <= step; i++) {
    const entry = result.trace[i];
    const row = document.createElement("div");
    row.className = "row" + (i === step ? " current" : "");
    if (i === 0) {
      row.innerHTML = `<span class="label">conflict:</span> ${S.clauseStr(entry.clause)}`;
    } else {
      const op = entry.minimized ? "minimize" : "resolve";
      row.innerHTML =
        `<span class="label">${op}</span> ` +
        `<span class="pivot">${entry.pivot}</span> ` +
        `<span class="label">→</span> ${S.clauseStr(entry.clause)}`;
    }
    el.appendChild(row);
  }

  if (step >= result.trace.length - 1) {
    const uip = result.uipLit?.var ?? "?";
    const row = document.createElement("div");
    row.className = "row final";
    row.innerHTML =
      `<span class="label">✓ 1-UIP:</span> ${uip} ` +
      `<span class="label">— backjump to L${result.backjumpLevel}. click <b>auto</b> or <b>step</b> to apply.</span>`;
    el.appendChild(row);

    if (result.known) {
      const note = document.createElement("div");
      note.className = "row redundant";
      const k = result.known;
      note.innerHTML = k.source === "gate"
        ? `<span class="label">↳ redundant — already implied by gate <b>${k.gate}</b>'s Tseitin clause; not added.</span>`
        : `<span class="label">↳ redundant — same as ${S.learnedClauses[k.idx].id}; not re-added.</span>`;
      el.appendChild(note);
    }
  }
}

// Human-readable reason for why a variable is forced at L0. Used by the
// UNSAT-proof panel.
function reasonLabel(varId) {
  const st = S.state[varId];
  if (!st) return "?";
  const r = st.reason;
  if (r === null)             return `<b>decision</b>`;
  if (r.type === "assertion") return `<b>assertion</b> — output <b>${r.output}</b> pinned TRUE`;
  if (r.type === "learned")   return `<b>${S.learnedClauses[r.idx].id}</b> — click its box to see derivation`;
  return `gate <b>${r.gate}</b>`;
}

function renderUnsatProof(el) {
  if (!S.conflict) return;
  const clause = S.extractConflictClause();

  const header = document.createElement("div");
  header.className = "row history-header";
  header.textContent = "UNSAT proof — L0 propagation derives ⊥";
  el.appendChild(header);

  const trigger = document.createElement("div");
  trigger.className = "row";
  trigger.innerHTML = `<span class="label">falsified clause:</span> ${S.clauseStr(clause ?? [])}`;
  el.appendChild(trigger);

  if (clause) {
    clause.forEach(l => {
      const r = document.createElement("div");
      r.className = "row history";
      r.innerHTML =
        `<span class="pivot">${S.litStr(l)}</span> ` +
        `<span class="label">FALSE because</span> ${reasonLabel(l.var)}`;
      el.appendChild(r);
    });
  }

  const bot = document.createElement("div");
  bot.className = "row final";
  bot.innerHTML = `<span class="label">∴ ⊥  (every literal FALSE at L0)</span>`;
  el.appendChild(bot);
}

function renderHistoryPanel(el) {
  const cl = S.learnedClauses[S.historyView.idx];
  if (!cl || !cl.trace) return;

  const header = document.createElement("div");
  header.className = "row history-header";
  header.innerHTML =
    `<span class="label">history of <b>${cl.id}</b>:</span> ` +
    `<span class="label">1-UIP derivation · click box again to close</span>`;
  el.appendChild(header);

  cl.trace.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "row history";
    if (i === 0) {
      row.innerHTML = `<span class="label">conflict:</span> ${S.clauseStr(entry.clause)}`;
    } else {
      const op = entry.minimized ? "minimize" : "resolve";
      row.innerHTML =
        `<span class="label">${op}</span> ` +
        `<span class="pivot">${entry.pivot}</span> ` +
        `<span class="label">→</span> ${S.clauseStr(entry.clause)}`;
    }
    el.appendChild(row);
  });

  const uip = cl.uipLit?.var ?? "?";
  const final = document.createElement("div");
  final.className = "row final";
  final.innerHTML =
    `<span class="label">✓ learned:</span> ${S.clauseStr(cl.literals)} ` +
    `<span class="label">(UIP ${uip}, backjumped to L${cl.backjumpLevel ?? "?"})</span>`;
  el.appendChild(final);
}

// ---------------------------------------------------------------------------
// Click-to-decide popup. Lives here (not in app.js) because the click
// handler is installed at SVG-construction time by drawInput/drawGate.
// ---------------------------------------------------------------------------

function onNodeClick(e, id) {
  e.stopPropagation();
  if (S.conflict) return;
  if (S.state[id].value !== UNKNOWN) return;
  showPopup(e.clientX, e.clientY, id);
}

function showPopup(x, y, id) {
  hidePopup();
  const p = document.createElement("div");
  p.className = "popup";
  p.id = "popup";
  p.style.left = Math.min(x, window.innerWidth - 140) + "px";
  p.style.top  = (y + 10) + "px";

  const mk = (cls, text, val) => {
    const b = document.createElement("button");
    b.className = cls;
    b.textContent = text;
    b.onclick = () => { hidePopup(); S.decide(id, val); };
    return b;
  };
  p.appendChild(mk("f", `${id} = 0`, FALSE));
  p.appendChild(mk("t", `${id} = 1`, TRUE));
  document.body.appendChild(p);
}

function hidePopup() {
  document.getElementById("popup")?.remove();
}

// Close the popup on any outside click.
document.addEventListener("click", e => {
  if (e.target.closest(".popup")) return;
  if (e.target.classList?.contains("node")) return;
  hidePopup();
});

// ---------------------------------------------------------------------------
// Top-level render — ticks the whole UI.
// ---------------------------------------------------------------------------

export function render() {
  const canvas = document.getElementById("canvas");
  if (!canvas.querySelector("svg")) canvas.appendChild(buildSvg());
  updateVisuals();
  renderTrail();
  renderLearned();
  renderAnalysis();

  document.getElementById("dl").textContent = S.decisionLevel;
  const statusEl = document.getElementById("status");
  const unsat = S.isUnsat();
  const sat   = !unsat && S.isSat();
  statusEl.textContent =
    unsat      ? "UNSAT — ⊥ derived at L0"
    : sat      ? "SAT — output = 1"
    : S.conflict ? "CONFLICT — click analyze (or undo)"
    : S.trail.length === 0 ? "idle"
    : "propagated";
  statusEl.classList.toggle("unsat",    unsat);
  statusEl.classList.toggle("sat",      sat);
  statusEl.classList.toggle("conflict", !!S.conflict && !unsat);

  document.getElementById("undo").disabled = S.decisionStack.length === 0;
  const analyzeLocked = !S.conflict || unsat;
  document.getElementById("step").disabled = analyzeLocked;
  document.getElementById("auto").disabled = analyzeLocked;
}
