// =============================================================================
// app.js — entry point. Wires the DOM to the solver and the renderer,
// bootstraps the initial set of circuits, and loads the first one.
//
// index.html pulls this file as <script type="module">. Every other module
// (constants, circuits, solver, render, aiger) is imported from here or
// transitively; no other script tag is needed.
// =============================================================================

import { CIRCUITS } from "./circuits.js";
import * as S from "./solver.js";
import { render, buildSvg } from "./render.js";
import { parseAigerBinary, aigerToCircuit } from "./aiger.js";

// ---------------------------------------------------------------------------
// Circuit switching.
// ---------------------------------------------------------------------------

function loadCircuit(name) {
  if (!CIRCUITS[name]) return;
  S.loadCircuitData(CIRCUITS[name]);
  // Full SVG rebuild — the circuit's node set and coordinates changed.
  const canvas = document.getElementById("canvas");
  canvas.innerHTML = "";
  canvas.appendChild(buildSvg());
  render();
}

function populateCircuitPicker() {
  const sel = document.getElementById("circuit-select");
  if (!sel) return;
  sel.innerHTML = "";
  for (const [id, c] of Object.entries(CIRCUITS)) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = c.name + " — " + c.description;
    sel.appendChild(opt);
  }
  sel.onchange = e => loadCircuit(e.target.value);
}

// ---------------------------------------------------------------------------
// AIGER import: file upload (user-initiated) and URL fetch (startup).
// ---------------------------------------------------------------------------

async function loadAigerFile(file) {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const parsed = parseAigerBinary(bytes);
    const baseName = file.name.replace(/\.aig$/i, "");
    CIRCUITS[baseName] = aigerToCircuit(parsed, baseName, `imported · ${baseName}.aig`);
    populateCircuitPicker();
    document.getElementById("circuit-select").value = baseName;
    loadCircuit(baseName);
  } catch (err) {
    console.error(err);
    alert(`AIGER load failed: ${err.message}`);
  }
}

// Non-fatal: if the file is missing or malformed, log and move on so the
// built-in circuits still work.
async function loadAigerFromUrl(name, url, description) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const parsed = parseAigerBinary(bytes);
    CIRCUITS[name] = aigerToCircuit(parsed, name, description);
  } catch (err) {
    console.warn(`skipping circuit '${name}' from ${url}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// DOM wiring.
// ---------------------------------------------------------------------------

document.getElementById("undo").onclick  = S.undo;
document.getElementById("reset").onclick = S.reset;
document.getElementById("step").onclick  = S.stepAnalysis;
document.getElementById("auto").onclick  = S.autoAnalysis;

const minBox = document.getElementById("minimize");
minBox.checked = S.minimizeOn;
minBox.onchange = e => S.setMinimizeOn(e.target.checked);

const aigerInput = document.getElementById("aiger-file");
document.getElementById("load-aig").onclick = () => aigerInput.click();
aigerInput.onchange = e => {
  const f = e.target.files?.[0];
  if (f) loadAigerFile(f);
  e.target.value = ""; // allow reloading the same file
};

// ---------------------------------------------------------------------------
// Boot: register the prebuilt .aig circuits shipped in ./circuits/ before
// the picker snapshots the list, then load the first circuit.
// ---------------------------------------------------------------------------

(async () => {
  await Promise.all([
    loadAigerFromUrl("mul15",
      "circuits/mul15.aig",
      "4-bit × 4-bit = 15 · yosys (unoptimised)"),
    loadAigerFromUrl("php43",
      "circuits/php43.aig",
      "4 pigeons in 3 holes · yosys + abc resyn2"),
  ]);
  populateCircuitPicker();
  loadCircuit(Object.keys(CIRCUITS)[0]);
})();
