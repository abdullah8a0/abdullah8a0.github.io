// =============================================================================
// aiger.js — binary AIGER parser and viz-circuit converter.
//
// Two entry points:
//   parseAigerBinary(bytes)  — pure decoder, Uint8Array → structured object
//   aigerToCircuit(parsed, name, description) — converts to a CIRCUITS entry
//                                               with column-per-level auto-layout
//
// Both are side-effect-free (no DOM, no mutation of shared state). app.js
// wraps them with the fetch / file-upload / CIRCUITS-registration plumbing.
//
// Binary AIGER layout (http://fmv.jku.at/aiger/):
//   line 1 (ASCII):          "aig M I L O A\n"
//   O lines (ASCII):          output literal per line
//   A × 2 varints (binary):  delta-encoded AND-gate RHS pair for each gate
//     For the AND at position idx (0-indexed), LHS = 2·(I + L + 1 + idx).
//     RHS0 = LHS - delta0,  RHS1 = RHS0 - delta1,  with each delta written
//     as a little-endian base-128 varint (high bit = continue).
//   optional symbol table:    "i<idx> name\n" / "o<idx> name\n"
//   optional comment:         "c\n" followed by arbitrary bytes (ignored)
//
// Invariants we check:
//   * header magic is "aig" (binary, not ASCII "aag")
//   * M = I + L + A  (variable 0 is the constant, not a node)
//   * L = 0  (we don't support sequential circuits)
// =============================================================================

// Read a base-128 varint starting at pos.i; advance pos past the last byte.
function readVarInt(bytes, pos) {
  let x = 0, shift = 0;
  while (true) {
    if (pos.i >= bytes.length) throw new Error("AIGER: truncated varint");
    const b = bytes[pos.i++];
    x |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) return x;
    shift += 7;
  }
}

// Read one line of ASCII text; advance pos past the terminating \n.
function readAsciiLine(bytes, pos) {
  const start = pos.i;
  while (pos.i < bytes.length && bytes[pos.i] !== 0x0a) pos.i++;
  const line = new TextDecoder().decode(bytes.slice(start, pos.i));
  if (pos.i < bytes.length) pos.i++;
  return line;
}

export function parseAigerBinary(bytes) {
  const pos = { i: 0 };
  const headerParts = readAsciiLine(bytes, pos).split(/\s+/);
  if (headerParts[0] !== "aig") {
    throw new Error(`AIGER: expected binary header 'aig', got '${headerParts[0]}'`);
  }
  const [, M, I, L, O, A] = headerParts.map((s, i) => i === 0 ? s : parseInt(s, 10));
  if (L > 0) throw new Error("AIGER: latches (sequential circuits) not supported");
  if (I + L + A !== M) {
    throw new Error(`AIGER: header mismatch M=${M} ≠ I+L+A=${I+L+A}`);
  }

  const outputLits = [];
  for (let j = 0; j < O; j++) {
    outputLits.push(parseInt(readAsciiLine(bytes, pos).trim(), 10));
  }

  const gates = [];
  for (let idx = 0; idx < A; idx++) {
    const lhs = 2 * (1 + I + L + idx);
    const delta0 = readVarInt(bytes, pos);
    const delta1 = readVarInt(bytes, pos);
    const rhs0 = lhs - delta0;
    const rhs1 = rhs0 - delta1;
    gates.push({ lhs, rhs0, rhs1 });
  }

  // Best-effort symbol table (stops at end-of-file or the "c" comment marker).
  const inputNames = {}, outputNames = {};
  while (pos.i < bytes.length) {
    const line = readAsciiLine(bytes, pos);
    if (line === "" || line[0] === "c") break;
    const m = /^([io])(\d+)\s+(.+)$/.exec(line);
    if (!m) break;
    const idx = parseInt(m[2], 10);
    (m[1] === "i" ? inputNames : outputNames)[idx] = m[3].trim();
  }

  return { M, I, L, O, A, outputLits, gates, inputNames, outputNames };
}

// Make a symbol-table name usable as a node id / CSS attribute.
function sanitizeName(raw, fallback) {
  const clean = raw.replace(/[^A-Za-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
  return clean.length ? clean : fallback;
}

// Convert parsed binary AIGER into a viz circuit object. Layout is by
// topological level: inputs in column 0, gate at depth k in column k, outputs
// in the rightmost column. Coordinates are approximate; users can hand-tweak.
export function aigerToCircuit(parsed, name, description) {
  const { I, L, A, outputLits, gates: aigGates, inputNames, outputNames } = parsed;

  // Variable 0 is the constant FALSE, which our circuit format can't
  // reference as a node. Reject any AIG that uses it in a gate input or
  // output. (Usually yosys elides constants; if this fires, the source
  // Verilog probably has a constant-valued output.)
  const usedConst0 = (l) => (l >> 1) === 0;
  for (const l of outputLits) {
    if (usedConst0(l)) throw new Error("AIGER: constant-0 in outputs unsupported");
  }
  for (const g of aigGates) {
    if (usedConst0(g.rhs0) || usedConst0(g.rhs1)) {
      throw new Error("AIGER: constant-0 inputs to AND gates unsupported");
    }
  }

  // Per-variable ids. Symbol-table names win if present.
  const inputIds = {};
  for (let v = 1; v <= I; v++) {
    inputIds[v] = sanitizeName(inputNames[v - 1] || "", `i${v - 1}`);
  }
  const gateIds = {};
  for (let idx = 0; idx < A; idx++) {
    gateIds[1 + I + L + idx] = `g${idx}`;
  }
  const idOf = (v) => v <= I ? inputIds[v] : gateIds[v];
  const litToChild = (l) => ({ ref: idOf(l >> 1), inv: (l & 1) === 1 });

  // Topological level of each variable. Inputs are level 0; each gate is one
  // deeper than the max of its two inputs.
  const level = {};
  for (let v = 1; v <= I; v++) level[v] = 0;
  for (let idx = 0; idx < A; idx++) {
    const g = aigGates[idx];
    const v = 1 + I + L + idx;
    level[v] = Math.max(level[g.rhs0 >> 1], level[g.rhs1 >> 1]) + 1;
  }

  const COL_W = 140, ROW_H = 50, MARGIN_X = 60, MARGIN_Y = 40;

  const byLevel = {};
  for (let idx = 0; idx < A; idx++) {
    const v = 1 + I + L + idx;
    (byLevel[level[v]] ||= []).push(v);
  }
  const maxLevel = Math.max(0, ...Object.keys(byLevel).map(Number));

  const inputs = [];
  for (let v = 1; v <= I; v++) {
    inputs.push({
      id: inputIds[v], label: inputIds[v],
      x: MARGIN_X, y: MARGIN_Y + (v - 1) * ROW_H,
    });
  }

  const gates = [];
  for (let lvl = 1; lvl <= maxLevel; lvl++) {
    (byLevel[lvl] || []).forEach((v, slot) => {
      const g = aigGates[v - 1 - I - L];
      const id = gateIds[v];
      gates.push({
        id, label: id,
        x: MARGIN_X + lvl * COL_W,
        y: MARGIN_Y + slot * ROW_H,
        child0: litToChild(g.rhs0),
        child1: litToChild(g.rhs1),
      });
    });
  }

  const outX = MARGIN_X + (maxLevel + 1) * COL_W;
  const outputs = outputLits.map((lit, idx) => {
    const rawName = outputNames[idx] || `o${idx}`;
    const label = sanitizeName(rawName, `o${idx}`);
    return {
      id: `O_${label}`, label,
      ref: idOf(lit >> 1), inv: (lit & 1) === 1,
      x: outX, y: MARGIN_Y + idx * ROW_H,
    };
  });

  const maxRowCount = Math.max(
    I,
    ...Object.values(byLevel).map(vs => vs.length),
    outputs.length,
  );
  const height = MARGIN_Y + maxRowCount * ROW_H + 60;
  const viewBox = `0 0 ${outX + 120} ${height}`;

  return {
    name,
    description: description || "imported · click step/auto once in conflict",
    viewBox,
    lcY: height - 80,
    inputs, gates, outputs,
  };
}
