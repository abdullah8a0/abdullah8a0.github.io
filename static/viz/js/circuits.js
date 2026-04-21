// =============================================================================
// circuits.js — hand-built demo circuits, data only.
//
// Each CIRCUITS[name] is a JSON-shaped object with the following schema:
//
//   {
//     name:        string,                   // dropdown label
//     description: string,                   // secondary label
//     viewBox:     "x y w h",                // SVG viewBox
//     lcY:         number,                   // y of the learned-clause strip
//     inputs:  [{id, label, x, y}],          // primary inputs, drawn as circles
//     gates:   [{id, label, x, y,
//                child0: {ref, inv},
//                child1: {ref, inv}}],       // AND gates, D-shape
//     outputs: [{id, label, ref, inv, x, y}] // pinned TRUE at L0 by the solver
//   }
//
// Every `ref` must name either an input id or a gate id; `inv:true` puts an
// inverter bubble on that edge. Outputs are pinned to effective-TRUE — the
// solver asserts `state[ref] = (inv ? FALSE : TRUE)` before the user makes
// any decisions (see solver.js assertOutputs).
//
// Coordinates are hand-placed once per circuit. Layout is not automatic.
// =============================================================================

export const CIRCUITS = {};

// ---------------------------------------------------------------------------
// 2-bit multiplier + "a × b = 6?" target check.
// p0 = c00 = a0·b0,   p1 = c01 ⊕ c10,   p2 = c11 ⊕ k1,   p3 = c11 · k1
// where k1 = c01 · c10 (carry from bit-1 half-adder).
// Target 6 = 0110 pinned bit-by-bit: p0=0, p1=1, p2=1, p3=0.
// Solutions: (a=3,b=2) and (a=2,b=3).
// ---------------------------------------------------------------------------
CIRCUITS["mul2-target6"] = {
  name: "mul2-target6",
  description: "can you make a × b = 6?  (a, b are 2-bit)",
  viewBox: "0 0 800 640",
  lcY: 540,
  inputs: [
    { id: "a0", label: "a0", x: 60, y:  80 },
    { id: "a1", label: "a1", x: 60, y: 140 },
    { id: "b0", label: "b0", x: 60, y: 240 },
    { id: "b1", label: "b1", x: 60, y: 300 },
  ],
  gates: [
    // Partial products
    { id: "c00", label: "c00", x: 200, y:  80,
      child0: { ref: "a0", inv: false }, child1: { ref: "b0", inv: false } },
    { id: "c01", label: "c01", x: 200, y: 150,
      child0: { ref: "a0", inv: false }, child1: { ref: "b1", inv: false } },
    { id: "c10", label: "c10", x: 200, y: 225,
      child0: { ref: "a1", inv: false }, child1: { ref: "b0", inv: false } },
    { id: "c11", label: "c11", x: 200, y: 300,
      child0: { ref: "a1", inv: false }, child1: { ref: "b1", inv: false } },
    // Half-adder #1 on (c01, c10): produces p1 (via xor1) and carry k1
    { id: "p1a",  label: "p1a",  x: 340, y: 160,
      child0: { ref: "c01", inv: false }, child1: { ref: "c10", inv: true  } },
    { id: "p1b",  label: "p1b",  x: 340, y: 215,
      child0: { ref: "c01", inv: true  }, child1: { ref: "c10", inv: false } },
    { id: "k1",   label: "k1",   x: 340, y: 430,
      child0: { ref: "c01", inv: false }, child1: { ref: "c10", inv: false } },
    { id: "xor1", label: "xor1", x: 480, y: 185,
      child0: { ref: "p1a", inv: true  }, child1: { ref: "p1b", inv: true  } },
    // Half-adder #2 on (c11, k1): produces p2 (via xor2) and p3 (the carry)
    { id: "p3",   label: "p3",   x: 480, y: 300,
      child0: { ref: "c11", inv: false }, child1: { ref: "k1",  inv: false } },
    { id: "h",    label: "h",    x: 480, y: 400,
      child0: { ref: "c11", inv: false }, child1: { ref: "k1",  inv: true  } },
    { id: "m",    label: "m",    x: 480, y: 470,
      child0: { ref: "c11", inv: true  }, child1: { ref: "k1",  inv: false } },
    { id: "xor2", label: "xor2", x: 620, y: 435,
      child0: { ref: "h",   inv: true  }, child1: { ref: "m",   inv: true  } },
  ],
  // Target 0110 — each bit pinned individually with inv chosen per target bit.
  outputs: [
    { id: "O_p0", label: "p0 = 0", ref: "c00",  inv: true, x: 640, y:  80 },
    { id: "O_p1", label: "p1 = 1", ref: "xor1", inv: true, x: 640, y: 185 },
    { id: "O_p2", label: "p2 = 1", ref: "xor2", inv: true, x: 640, y: 435 },
    { id: "O_p3", label: "p3 = 0", ref: "p3",   inv: true, x: 640, y: 300 },
  ],
};

// ---------------------------------------------------------------------------
// Pigeonhole 3-in-2 — UNSAT.
// 6 inputs p_ih. 9 constraints: 3 "each pigeon has a hole" (na_i FALSE) + 6
// "no hole holds two pigeons" (m_{ij,h} FALSE). Each constraint is its own
// output — the solver pins them all at L0.
// ---------------------------------------------------------------------------
CIRCUITS["pigeon-3in2"] = {
  name: "pigeon-3in2",
  description: "3 pigeons in 2 holes — UNSAT",
  viewBox: "0 0 560 680",
  lcY: 580,
  inputs: [
    { id: "p1a", label: "p1a", x: 60, y:  80 },
    { id: "p1b", label: "p1b", x: 60, y: 130 },
    { id: "p2a", label: "p2a", x: 60, y: 230 },
    { id: "p2b", label: "p2b", x: 60, y: 280 },
    { id: "p3a", label: "p3a", x: 60, y: 380 },
    { id: "p3b", label: "p3b", x: 60, y: 430 },
  ],
  gates: [
    { id: "na1",  label: "na1",  x: 220, y: 100,
      child0: { ref: "p1a", inv: true  }, child1: { ref: "p1b", inv: true  } },
    { id: "m12a", label: "m12a", x: 220, y: 150,
      child0: { ref: "p1a", inv: false }, child1: { ref: "p2a", inv: false } },
    { id: "m12b", label: "m12b", x: 220, y: 200,
      child0: { ref: "p1b", inv: false }, child1: { ref: "p2b", inv: false } },
    { id: "na2",  label: "na2",  x: 220, y: 250,
      child0: { ref: "p2a", inv: true  }, child1: { ref: "p2b", inv: true  } },
    { id: "m13a", label: "m13a", x: 220, y: 300,
      child0: { ref: "p1a", inv: false }, child1: { ref: "p3a", inv: false } },
    { id: "m13b", label: "m13b", x: 220, y: 350,
      child0: { ref: "p1b", inv: false }, child1: { ref: "p3b", inv: false } },
    { id: "na3",  label: "na3",  x: 220, y: 400,
      child0: { ref: "p3a", inv: true  }, child1: { ref: "p3b", inv: true  } },
    { id: "m23a", label: "m23a", x: 220, y: 450,
      child0: { ref: "p2a", inv: false }, child1: { ref: "p3a", inv: false } },
    { id: "m23b", label: "m23b", x: 220, y: 500,
      child0: { ref: "p2b", inv: false }, child1: { ref: "p3b", inv: false } },
  ],
  outputs: [
    { id: "O_na1",  label: "pigeon 1 has hole", ref: "na1",  inv: true, x: 400, y: 100 },
    { id: "O_m12a", label: "not(p1a ∧ p2a)",    ref: "m12a", inv: true, x: 400, y: 150 },
    { id: "O_m12b", label: "not(p1b ∧ p2b)",    ref: "m12b", inv: true, x: 400, y: 200 },
    { id: "O_na2",  label: "pigeon 2 has hole", ref: "na2",  inv: true, x: 400, y: 250 },
    { id: "O_m13a", label: "not(p1a ∧ p3a)",    ref: "m13a", inv: true, x: 400, y: 300 },
    { id: "O_m13b", label: "not(p1b ∧ p3b)",    ref: "m13b", inv: true, x: 400, y: 350 },
    { id: "O_na3",  label: "pigeon 3 has hole", ref: "na3",  inv: true, x: 400, y: 400 },
    { id: "O_m23a", label: "not(p2a ∧ p3a)",    ref: "m23a", inv: true, x: 400, y: 450 },
    { id: "O_m23b", label: "not(p2b ∧ p3b)",    ref: "m23b", inv: true, x: 400, y: 500 },
  ],
};

// ---------------------------------------------------------------------------
// 3-SAT, 6 clauses, 4 variables — SAT. Each clause encoded as the 3-input AND
// of negated literals; clause i holds iff c_i = FALSE.
// ---------------------------------------------------------------------------
CIRCUITS["sat-6clause"] = {
  name: "sat-6clause",
  description: "3-SAT, 6 clauses, 4 vars — SAT",
  viewBox: "0 0 680 540",
  lcY: 440,
  inputs: [
    { id: "x1", label: "x1", x: 60, y:  80 },
    { id: "x2", label: "x2", x: 60, y: 180 },
    { id: "x3", label: "x3", x: 60, y: 280 },
    { id: "x4", label: "x4", x: 60, y: 380 },
  ],
  gates: [
    // C1: x1 ∨ x2 ∨ x3
    { id: "c1a", label: "c1a", x: 220, y:  80,
      child0: { ref: "x1", inv: true  }, child1: { ref: "x2", inv: true  } },
    { id: "c1",  label: "c1",  x: 380, y:  80,
      child0: { ref: "c1a", inv: false }, child1: { ref: "x3", inv: true } },
    // C2: ¬x1 ∨ ¬x2 ∨ x4
    { id: "c2a", label: "c2a", x: 220, y: 140,
      child0: { ref: "x1", inv: false }, child1: { ref: "x2", inv: false } },
    { id: "c2",  label: "c2",  x: 380, y: 140,
      child0: { ref: "c2a", inv: false }, child1: { ref: "x4", inv: true } },
    // C3: x2 ∨ x3 ∨ ¬x4
    { id: "c3a", label: "c3a", x: 220, y: 200,
      child0: { ref: "x2", inv: true  }, child1: { ref: "x3", inv: true  } },
    { id: "c3",  label: "c3",  x: 380, y: 200,
      child0: { ref: "c3a", inv: false }, child1: { ref: "x4", inv: false } },
    // C4: ¬x2 ∨ ¬x3 ∨ ¬x4
    { id: "c4a", label: "c4a", x: 220, y: 260,
      child0: { ref: "x2", inv: false }, child1: { ref: "x3", inv: false } },
    { id: "c4",  label: "c4",  x: 380, y: 260,
      child0: { ref: "c4a", inv: false }, child1: { ref: "x4", inv: false } },
    // C5: ¬x1 ∨ x2 ∨ ¬x4
    { id: "c5a", label: "c5a", x: 220, y: 320,
      child0: { ref: "x1", inv: false }, child1: { ref: "x2", inv: true  } },
    { id: "c5",  label: "c5",  x: 380, y: 320,
      child0: { ref: "c5a", inv: false }, child1: { ref: "x4", inv: false } },
    // C6: x1 ∨ ¬x3 ∨ x4
    { id: "c6a", label: "c6a", x: 220, y: 380,
      child0: { ref: "x1", inv: true  }, child1: { ref: "x3", inv: false } },
    { id: "c6",  label: "c6",  x: 380, y: 380,
      child0: { ref: "c6a", inv: false }, child1: { ref: "x4", inv: true } },
  ],
  outputs: [
    { id: "O_c1", label: "C1 holds", ref: "c1", inv: true, x: 520, y:  80 },
    { id: "O_c2", label: "C2 holds", ref: "c2", inv: true, x: 520, y: 140 },
    { id: "O_c3", label: "C3 holds", ref: "c3", inv: true, x: 520, y: 200 },
    { id: "O_c4", label: "C4 holds", ref: "c4", inv: true, x: 520, y: 260 },
    { id: "O_c5", label: "C5 holds", ref: "c5", inv: true, x: 520, y: 320 },
    { id: "O_c6", label: "C6 holds", ref: "c6", inv: true, x: 520, y: 380 },
  ],
};

// ---------------------------------------------------------------------------
// Triangle 2-coloring — UNSAT (odd cycle).
// For each edge (u,v): XNOR(c_u, c_v) must be FALSE (endpoints differ).
// ---------------------------------------------------------------------------
CIRCUITS["tri-2color"] = {
  name: "tri-2color",
  description: "2-color a triangle — UNSAT (odd cycle)",
  viewBox: "0 0 680 620",
  lcY: 520,
  inputs: [
    { id: "c1", label: "c1", x: 60, y: 100 },
    { id: "c2", label: "c2", x: 60, y: 250 },
    { id: "c3", label: "c3", x: 60, y: 400 },
  ],
  gates: [
    { id: "e12a", label: "e12a", x: 220, y: 130,
      child0: { ref: "c1", inv: false }, child1: { ref: "c2", inv: true  } },
    { id: "e12b", label: "e12b", x: 220, y: 180,
      child0: { ref: "c1", inv: true  }, child1: { ref: "c2", inv: false } },
    { id: "e12",  label: "e12",  x: 380, y: 155,
      child0: { ref: "e12a", inv: true }, child1: { ref: "e12b", inv: true } },
    { id: "e23a", label: "e23a", x: 220, y: 280,
      child0: { ref: "c2", inv: false }, child1: { ref: "c3", inv: true  } },
    { id: "e23b", label: "e23b", x: 220, y: 330,
      child0: { ref: "c2", inv: true  }, child1: { ref: "c3", inv: false } },
    { id: "e23",  label: "e23",  x: 380, y: 305,
      child0: { ref: "e23a", inv: true }, child1: { ref: "e23b", inv: true } },
    { id: "e13a", label: "e13a", x: 220, y: 410,
      child0: { ref: "c1", inv: false }, child1: { ref: "c3", inv: true  } },
    { id: "e13b", label: "e13b", x: 220, y: 460,
      child0: { ref: "c1", inv: true  }, child1: { ref: "c3", inv: false } },
    { id: "e13",  label: "e13",  x: 380, y: 435,
      child0: { ref: "e13a", inv: true }, child1: { ref: "e13b", inv: true } },
  ],
  outputs: [
    { id: "O_e12", label: "c1 ≠ c2", ref: "e12", inv: true, x: 520, y: 155 },
    { id: "O_e23", label: "c2 ≠ c3", ref: "e23", inv: true, x: 520, y: 305 },
    { id: "O_e13", label: "c1 ≠ c3", ref: "e13", inv: true, x: 520, y: 435 },
  ],
};

// ---------------------------------------------------------------------------
// Knights & knaves (3 people) — SAT (2 solutions).
//   A says "B is a knight":   a ↔  b    → a XNOR b (TRUE)
//   B says "C is a knave":    b ↔ ¬c    → b  XOR c (TRUE → bc XNOR must be FALSE)
//   C says "A is a knave":    c ↔ ¬a    → c  XOR a
// Two models: (1,1,0) and (0,0,1).
// ---------------------------------------------------------------------------
CIRCUITS["knights-3"] = {
  name: "knights-3",
  description: "A,B,C say things about each other — SAT (2 solutions)",
  viewBox: "0 0 680 620",
  lcY: 520,
  inputs: [
    { id: "a", label: "a", x: 60, y: 100 },
    { id: "b", label: "b", x: 60, y: 250 },
    { id: "c", label: "c", x: 60, y: 400 },
  ],
  gates: [
    { id: "ab_0", label: "ab_0", x: 220, y: 130,
      child0: { ref: "a", inv: false }, child1: { ref: "b", inv: true  } },
    { id: "ab_1", label: "ab_1", x: 220, y: 180,
      child0: { ref: "a", inv: true  }, child1: { ref: "b", inv: false } },
    { id: "ab",   label: "ab",   x: 380, y: 155,
      child0: { ref: "ab_0", inv: true }, child1: { ref: "ab_1", inv: true } },
    { id: "bc_0", label: "bc_0", x: 220, y: 280,
      child0: { ref: "b", inv: false }, child1: { ref: "c", inv: true  } },
    { id: "bc_1", label: "bc_1", x: 220, y: 330,
      child0: { ref: "b", inv: true  }, child1: { ref: "c", inv: false } },
    { id: "bc",   label: "bc",   x: 380, y: 305,
      child0: { ref: "bc_0", inv: true }, child1: { ref: "bc_1", inv: true } },
    { id: "ca_0", label: "ca_0", x: 220, y: 430,
      child0: { ref: "c", inv: false }, child1: { ref: "a", inv: true  } },
    { id: "ca_1", label: "ca_1", x: 220, y: 480,
      child0: { ref: "c", inv: true  }, child1: { ref: "a", inv: false } },
    { id: "ca",   label: "ca",   x: 380, y: 455,
      child0: { ref: "ca_0", inv: true }, child1: { ref: "ca_1", inv: true } },
  ],
  outputs: [
    { id: "O_ab", label: "A: b is knight", ref: "ab", inv: false, x: 520, y: 155 },
    { id: "O_bc", label: "B: c is knave",  ref: "bc", inv: true,  x: 520, y: 305 },
    { id: "O_ca", label: "C: a is knave",  ref: "ca", inv: true,  x: 520, y: 455 },
  ],
};

// ---------------------------------------------------------------------------
// 2×2 Latin square — SAT (2 solutions). Every row/column must have distinct
// cells, encoded as XNOR(cell_u, cell_v) = FALSE.
// ---------------------------------------------------------------------------
CIRCUITS["latin-2x2"] = {
  name: "latin-2x2",
  description: "fill a 2×2 Latin square — SAT",
  viewBox: "0 0 680 640",
  lcY: 540,
  inputs: [
    { id: "r1c1", label: "r1c1", x: 60, y:  80 },
    { id: "r1c2", label: "r1c2", x: 60, y: 180 },
    { id: "r2c1", label: "r2c1", x: 60, y: 320 },
    { id: "r2c2", label: "r2c2", x: 60, y: 420 },
  ],
  gates: [
    { id: "e1a", label: "e1a", x: 220, y:  90,
      child0: { ref: "r1c1", inv: false }, child1: { ref: "r1c2", inv: true  } },
    { id: "e1b", label: "e1b", x: 220, y: 140,
      child0: { ref: "r1c1", inv: true  }, child1: { ref: "r1c2", inv: false } },
    { id: "e1",  label: "e1",  x: 360, y: 115,
      child0: { ref: "e1a", inv: true }, child1: { ref: "e1b", inv: true } },
    { id: "e3a", label: "e3a", x: 220, y: 200,
      child0: { ref: "r1c1", inv: false }, child1: { ref: "r2c1", inv: true  } },
    { id: "e3b", label: "e3b", x: 220, y: 250,
      child0: { ref: "r1c1", inv: true  }, child1: { ref: "r2c1", inv: false } },
    { id: "e3",  label: "e3",  x: 360, y: 225,
      child0: { ref: "e3a", inv: true }, child1: { ref: "e3b", inv: true } },
    { id: "e2a", label: "e2a", x: 220, y: 330,
      child0: { ref: "r2c1", inv: false }, child1: { ref: "r2c2", inv: true  } },
    { id: "e2b", label: "e2b", x: 220, y: 380,
      child0: { ref: "r2c1", inv: true  }, child1: { ref: "r2c2", inv: false } },
    { id: "e2",  label: "e2",  x: 360, y: 355,
      child0: { ref: "e2a", inv: true }, child1: { ref: "e2b", inv: true } },
    { id: "e4a", label: "e4a", x: 220, y: 440,
      child0: { ref: "r1c2", inv: false }, child1: { ref: "r2c2", inv: true  } },
    { id: "e4b", label: "e4b", x: 220, y: 490,
      child0: { ref: "r1c2", inv: true  }, child1: { ref: "r2c2", inv: false } },
    { id: "e4",  label: "e4",  x: 360, y: 465,
      child0: { ref: "e4a", inv: true }, child1: { ref: "e4b", inv: true } },
  ],
  outputs: [
    { id: "O_e1", label: "row 1 distinct", ref: "e1", inv: true, x: 520, y: 115 },
    { id: "O_e3", label: "col 1 distinct", ref: "e3", inv: true, x: 520, y: 225 },
    { id: "O_e2", label: "row 2 distinct", ref: "e2", inv: true, x: 520, y: 355 },
    { id: "O_e4", label: "col 2 distinct", ref: "e4", inv: true, x: 520, y: 465 },
  ],
};

// ---------------------------------------------------------------------------
// XOR cycle: x1=x2=x3=x4 ∧ x1≠x4 — UNSAT (transitivity forces x1=x4).
// ---------------------------------------------------------------------------
CIRCUITS["xor-cycle"] = {
  name: "xor-cycle",
  description: "x1=x2=x3=x4 ∧ x1≠x4 — UNSAT",
  viewBox: "0 0 680 620",
  lcY: 520,
  inputs: [
    { id: "x1", label: "x1", x: 60, y:  80 },
    { id: "x2", label: "x2", x: 60, y: 180 },
    { id: "x3", label: "x3", x: 60, y: 300 },
    { id: "x4", label: "x4", x: 60, y: 420 },
  ],
  gates: [
    { id: "ab_0", label: "ab_0", x: 220, y: 100,
      child0: { ref: "x1", inv: false }, child1: { ref: "x2", inv: true  } },
    { id: "ab_1", label: "ab_1", x: 220, y: 150,
      child0: { ref: "x1", inv: true  }, child1: { ref: "x2", inv: false } },
    { id: "ab",   label: "ab",   x: 380, y: 125,
      child0: { ref: "ab_0", inv: true }, child1: { ref: "ab_1", inv: true } },
    { id: "bc_0", label: "bc_0", x: 220, y: 210,
      child0: { ref: "x2", inv: false }, child1: { ref: "x3", inv: true  } },
    { id: "bc_1", label: "bc_1", x: 220, y: 260,
      child0: { ref: "x2", inv: true  }, child1: { ref: "x3", inv: false } },
    { id: "bc",   label: "bc",   x: 380, y: 235,
      child0: { ref: "bc_0", inv: true }, child1: { ref: "bc_1", inv: true } },
    { id: "cd_0", label: "cd_0", x: 220, y: 320,
      child0: { ref: "x3", inv: false }, child1: { ref: "x4", inv: true  } },
    { id: "cd_1", label: "cd_1", x: 220, y: 370,
      child0: { ref: "x3", inv: true  }, child1: { ref: "x4", inv: false } },
    { id: "cd",   label: "cd",   x: 380, y: 345,
      child0: { ref: "cd_0", inv: true }, child1: { ref: "cd_1", inv: true } },
    { id: "ad_0", label: "ad_0", x: 220, y: 430,
      child0: { ref: "x1", inv: false }, child1: { ref: "x4", inv: true  } },
    { id: "ad_1", label: "ad_1", x: 220, y: 480,
      child0: { ref: "x1", inv: true  }, child1: { ref: "x4", inv: false } },
    { id: "ad",   label: "ad",   x: 380, y: 455,
      child0: { ref: "ad_0", inv: true }, child1: { ref: "ad_1", inv: true } },
  ],
  outputs: [
    { id: "O_ab", label: "x1 = x2", ref: "ab", inv: false, x: 520, y: 125 },
    { id: "O_bc", label: "x2 = x3", ref: "bc", inv: false, x: 520, y: 235 },
    { id: "O_cd", label: "x3 = x4", ref: "cd", inv: false, x: 520, y: 345 },
    { id: "O_ad", label: "x1 ≠ x4", ref: "ad", inv: true,  x: 520, y: 455 },
  ],
};

// ---------------------------------------------------------------------------
// 2-bit counter, unrolled 2 steps — BMC-style "reach state 10 at t=2?".
// Frame-to-frame signals are encoded as *edge relabelings* on the same AIG
// nodes (no new gates), matching how BMC unrolls a sequential circuit.
// Unique satisfying assignment: r0_0 = r1_0 = 0.
// ---------------------------------------------------------------------------
CIRCUITS["counter-bmc"] = {
  name: "counter-bmc",
  description: "2-bit counter, 2 steps — reach state 10?",
  viewBox: "0 0 940 480",
  lcY: 380,
  inputs: [
    { id: "r1_0", label: "r1_0", x: 60, y: 100 },
    { id: "r0_0", label: "r0_0", x: 60, y: 280 },
  ],
  gates: [
    // Frame 0 → 1: XNOR(r1_0, r0_0). r1_1 = ¬xor0 at its consumer.
    { id: "xor0_a", label: "xor0_a", x: 220, y: 130,
      child0: { ref: "r1_0", inv: false }, child1: { ref: "r0_0", inv: true  } },
    { id: "xor0_b", label: "xor0_b", x: 220, y: 250,
      child0: { ref: "r1_0", inv: true  }, child1: { ref: "r0_0", inv: false } },
    { id: "xor0",   label: "xor0",   x: 380, y: 190,
      child0: { ref: "xor0_a", inv: true }, child1: { ref: "xor0_b", inv: true } },
    // Frame 1 → 2: XNOR(¬xor0, ¬r0_0).
    { id: "xor1_a", label: "xor1_a", x: 540, y: 130,
      child0: { ref: "xor0", inv: true  }, child1: { ref: "r0_0", inv: false } },
    { id: "xor1_b", label: "xor1_b", x: 540, y: 250,
      child0: { ref: "xor0", inv: false }, child1: { ref: "r0_0", inv: true  } },
    { id: "xor1",   label: "xor1",   x: 700, y: 190,
      child0: { ref: "xor1_a", inv: true }, child1: { ref: "xor1_b", inv: true } },
  ],
  outputs: [
    { id: "O_r1_2", label: "r1_2 = 1", ref: "xor1", inv: true, x: 840, y: 190 },
    { id: "O_r0_2", label: "r0_2 = 0", ref: "r0_0", inv: true, x: 840, y: 280 },
  ],
};

// ---------------------------------------------------------------------------
// Tseitin parity on the 5-cycle C_5 with parities (1,0,0,0,0) — UNSAT.
// Any edge is incident to exactly two vertices, so the sum of vertex
// constraints is always even — contradicts odd total parity. Resolution-hard.
// ---------------------------------------------------------------------------
CIRCUITS["tseitin-c5"] = {
  name: "tseitin-c5",
  description: "Tseitin parity on 5-cycle, p=(1,0,0,0,0) — UNSAT",
  viewBox: "0 0 680 420",
  lcY: 370,
  inputs: [
    { id: "e12", label: "e12", x: 60, y:  40 },
    { id: "e23", label: "e23", x: 60, y: 110 },
    { id: "e34", label: "e34", x: 60, y: 180 },
    { id: "e45", label: "e45", x: 60, y: 250 },
    { id: "e15", label: "e15", x: 60, y: 320 },
  ],
  gates: [
    // v1: e12 ⊕ e15 = 1  →  XNOR FALSE
    { id: "v1_a", label: "v1_a", x: 220, y:  20,
      child0: { ref: "e12", inv: false }, child1: { ref: "e15", inv: true  } },
    { id: "v1_b", label: "v1_b", x: 220, y:  60,
      child0: { ref: "e12", inv: true  }, child1: { ref: "e15", inv: false } },
    { id: "v1",   label: "v1",   x: 360, y:  40,
      child0: { ref: "v1_a", inv: true }, child1: { ref: "v1_b", inv: true } },
    // v2: e12 ⊕ e23 = 0  →  XNOR TRUE
    { id: "v2_a", label: "v2_a", x: 220, y:  90,
      child0: { ref: "e12", inv: false }, child1: { ref: "e23", inv: true  } },
    { id: "v2_b", label: "v2_b", x: 220, y: 130,
      child0: { ref: "e12", inv: true  }, child1: { ref: "e23", inv: false } },
    { id: "v2",   label: "v2",   x: 360, y: 110,
      child0: { ref: "v2_a", inv: true }, child1: { ref: "v2_b", inv: true } },
    { id: "v3_a", label: "v3_a", x: 220, y: 160,
      child0: { ref: "e23", inv: false }, child1: { ref: "e34", inv: true  } },
    { id: "v3_b", label: "v3_b", x: 220, y: 200,
      child0: { ref: "e23", inv: true  }, child1: { ref: "e34", inv: false } },
    { id: "v3",   label: "v3",   x: 360, y: 180,
      child0: { ref: "v3_a", inv: true }, child1: { ref: "v3_b", inv: true } },
    { id: "v4_a", label: "v4_a", x: 220, y: 230,
      child0: { ref: "e34", inv: false }, child1: { ref: "e45", inv: true  } },
    { id: "v4_b", label: "v4_b", x: 220, y: 270,
      child0: { ref: "e34", inv: true  }, child1: { ref: "e45", inv: false } },
    { id: "v4",   label: "v4",   x: 360, y: 250,
      child0: { ref: "v4_a", inv: true }, child1: { ref: "v4_b", inv: true } },
    { id: "v5_a", label: "v5_a", x: 220, y: 300,
      child0: { ref: "e45", inv: false }, child1: { ref: "e15", inv: true  } },
    { id: "v5_b", label: "v5_b", x: 220, y: 340,
      child0: { ref: "e45", inv: true  }, child1: { ref: "e15", inv: false } },
    { id: "v5",   label: "v5",   x: 360, y: 320,
      child0: { ref: "v5_a", inv: true }, child1: { ref: "v5_b", inv: true } },
  ],
  outputs: [
    { id: "O_v1", label: "v1 parity", ref: "v1", inv: true,  x: 500, y:  40 },
    { id: "O_v2", label: "v2 parity", ref: "v2", inv: false, x: 500, y: 110 },
    { id: "O_v3", label: "v3 parity", ref: "v3", inv: false, x: 500, y: 180 },
    { id: "O_v4", label: "v4 parity", ref: "v4", inv: false, x: 500, y: 250 },
    { id: "O_v5", label: "v5 parity", ref: "v5", inv: false, x: 500, y: 320 },
  ],
};

// ---------------------------------------------------------------------------
// Schur triples on {1..5} with 2 colours — UNSAT (S(2) = 4).
// Triples (a,b,c) with a+b=c (including degenerate a=b):
//   (1,1,2), (1,2,3), (1,3,4), (1,4,5), (2,2,4), (2,3,5).
// Degenerate → x_a ≠ x_c (XOR).  Strict → {x_a,x_b,x_c} not all equal.
// ---------------------------------------------------------------------------
CIRCUITS["schur-5"] = {
  name: "schur-5",
  description: "Schur triples on {1..5}, 2 colours — UNSAT",
  viewBox: "0 0 840 540",
  lcY: 470,
  inputs: [
    { id: "x1", label: "x1", x: 60, y:  40 },
    { id: "x2", label: "x2", x: 60, y: 120 },
    { id: "x3", label: "x3", x: 60, y: 200 },
    { id: "x4", label: "x4", x: 60, y: 280 },
    { id: "x5", label: "x5", x: 60, y: 360 },
  ],
  gates: [
    { id: "t1_a", label: "t1_a", x: 220, y:  40,
      child0: { ref: "x1", inv: false }, child1: { ref: "x2", inv: true  } },
    { id: "t1_b", label: "t1_b", x: 220, y:  80,
      child0: { ref: "x1", inv: true  }, child1: { ref: "x2", inv: false } },
    { id: "t1",   label: "t1",   x: 360, y:  60,
      child0: { ref: "t1_a", inv: true }, child1: { ref: "t1_b", inv: true } },
    { id: "t2_a", label: "t2_a", x: 220, y: 120,
      child0: { ref: "x2", inv: false }, child1: { ref: "x4", inv: true  } },
    { id: "t2_b", label: "t2_b", x: 220, y: 160,
      child0: { ref: "x2", inv: true  }, child1: { ref: "x4", inv: false } },
    { id: "t2",   label: "t2",   x: 360, y: 140,
      child0: { ref: "t2_a", inv: true }, child1: { ref: "t2_b", inv: true } },
    { id: "q123_0a", label: "q123_0a", x: 220, y: 200,
      child0: { ref: "x1", inv: true }, child1: { ref: "x2", inv: true } },
    { id: "q123_1a", label: "q123_1a", x: 220, y: 240,
      child0: { ref: "x1", inv: false }, child1: { ref: "x2", inv: false } },
    { id: "q123_0",  label: "q123_0",  x: 360, y: 200,
      child0: { ref: "q123_0a", inv: false }, child1: { ref: "x3", inv: true  } },
    { id: "q123_1",  label: "q123_1",  x: 360, y: 240,
      child0: { ref: "q123_1a", inv: false }, child1: { ref: "x3", inv: false } },
    { id: "q123",    label: "q123",    x: 500, y: 220,
      child0: { ref: "q123_0", inv: true }, child1: { ref: "q123_1", inv: true } },
    { id: "q134_0a", label: "q134_0a", x: 220, y: 280,
      child0: { ref: "x1", inv: true }, child1: { ref: "x3", inv: true } },
    { id: "q134_1a", label: "q134_1a", x: 220, y: 320,
      child0: { ref: "x1", inv: false }, child1: { ref: "x3", inv: false } },
    { id: "q134_0",  label: "q134_0",  x: 360, y: 280,
      child0: { ref: "q134_0a", inv: false }, child1: { ref: "x4", inv: true  } },
    { id: "q134_1",  label: "q134_1",  x: 360, y: 320,
      child0: { ref: "q134_1a", inv: false }, child1: { ref: "x4", inv: false } },
    { id: "q134",    label: "q134",    x: 500, y: 300,
      child0: { ref: "q134_0", inv: true }, child1: { ref: "q134_1", inv: true } },
    { id: "q145_0a", label: "q145_0a", x: 220, y: 360,
      child0: { ref: "x1", inv: true }, child1: { ref: "x4", inv: true } },
    { id: "q145_1a", label: "q145_1a", x: 220, y: 400,
      child0: { ref: "x1", inv: false }, child1: { ref: "x4", inv: false } },
    { id: "q145_0",  label: "q145_0",  x: 360, y: 360,
      child0: { ref: "q145_0a", inv: false }, child1: { ref: "x5", inv: true  } },
    { id: "q145_1",  label: "q145_1",  x: 360, y: 400,
      child0: { ref: "q145_1a", inv: false }, child1: { ref: "x5", inv: false } },
    { id: "q145",    label: "q145",    x: 500, y: 380,
      child0: { ref: "q145_0", inv: true }, child1: { ref: "q145_1", inv: true } },
    { id: "q235_0a", label: "q235_0a", x: 220, y: 440,
      child0: { ref: "x2", inv: true }, child1: { ref: "x3", inv: true } },
    { id: "q235_1a", label: "q235_1a", x: 220, y: 480,
      child0: { ref: "x2", inv: false }, child1: { ref: "x3", inv: false } },
    { id: "q235_0",  label: "q235_0",  x: 360, y: 440,
      child0: { ref: "q235_0a", inv: false }, child1: { ref: "x5", inv: true  } },
    { id: "q235_1",  label: "q235_1",  x: 360, y: 480,
      child0: { ref: "q235_1a", inv: false }, child1: { ref: "x5", inv: false } },
    { id: "q235",    label: "q235",    x: 500, y: 460,
      child0: { ref: "q235_0", inv: true }, child1: { ref: "q235_1", inv: true } },
  ],
  outputs: [
    { id: "O_t1",   label: "x1 ≠ x2",      ref: "t1",   inv: true,  x: 640, y:  60 },
    { id: "O_t2",   label: "x2 ≠ x4",      ref: "t2",   inv: true,  x: 640, y: 140 },
    { id: "O_q123", label: "¬mono(1,2,3)", ref: "q123", inv: false, x: 640, y: 220 },
    { id: "O_q134", label: "¬mono(1,3,4)", ref: "q134", inv: false, x: 640, y: 300 },
    { id: "O_q145", label: "¬mono(1,4,5)", ref: "q145", inv: false, x: 640, y: 380 },
    { id: "O_q235", label: "¬mono(2,3,5)", ref: "q235", inv: false, x: 640, y: 460 },
  ],
};

// ---------------------------------------------------------------------------
// Pigeonhole 4-in-3 — UNSAT. Scaled-up variant of pigeon-3in2 for richer
// CDCL dynamics. 22 constraints — each its own output.
// ---------------------------------------------------------------------------
CIRCUITS["php-4in3"] = {
  name: "php-4in3",
  description: "4 pigeons in 3 holes — UNSAT",
  viewBox: "0 0 740 620",
  lcY: 560,
  inputs: [
    { id: "p1a", label: "p1a", x: 60, y:  30 },
    { id: "p1b", label: "p1b", x: 60, y:  70 },
    { id: "p1c", label: "p1c", x: 60, y: 110 },
    { id: "p2a", label: "p2a", x: 60, y: 170 },
    { id: "p2b", label: "p2b", x: 60, y: 210 },
    { id: "p2c", label: "p2c", x: 60, y: 250 },
    { id: "p3a", label: "p3a", x: 60, y: 310 },
    { id: "p3b", label: "p3b", x: 60, y: 350 },
    { id: "p3c", label: "p3c", x: 60, y: 390 },
    { id: "p4a", label: "p4a", x: 60, y: 450 },
    { id: "p4b", label: "p4b", x: 60, y: 490 },
    { id: "p4c", label: "p4c", x: 60, y: 530 },
  ],
  gates: [
    // No-hole gates (constraint holds iff nh_i = FALSE)
    { id: "nh1_ab", label: "nh1_ab", x: 220, y:  50,
      child0: { ref: "p1a", inv: true }, child1: { ref: "p1b", inv: true } },
    { id: "nh1",    label: "nh1",    x: 360, y:  70,
      child0: { ref: "nh1_ab", inv: false }, child1: { ref: "p1c", inv: true } },
    { id: "nh2_ab", label: "nh2_ab", x: 220, y: 190,
      child0: { ref: "p2a", inv: true }, child1: { ref: "p2b", inv: true } },
    { id: "nh2",    label: "nh2",    x: 360, y: 210,
      child0: { ref: "nh2_ab", inv: false }, child1: { ref: "p2c", inv: true } },
    { id: "nh3_ab", label: "nh3_ab", x: 220, y: 330,
      child0: { ref: "p3a", inv: true }, child1: { ref: "p3b", inv: true } },
    { id: "nh3",    label: "nh3",    x: 360, y: 350,
      child0: { ref: "nh3_ab", inv: false }, child1: { ref: "p3c", inv: true } },
    { id: "nh4_ab", label: "nh4_ab", x: 220, y: 470,
      child0: { ref: "p4a", inv: true }, child1: { ref: "p4b", inv: true } },
    { id: "nh4",    label: "nh4",    x: 360, y: 490,
      child0: { ref: "nh4_ab", inv: false }, child1: { ref: "p4c", inv: true } },
    // At-most-one-per-hole (constraint holds iff m_{ij,h} = FALSE)
    { id: "m12a", label: "m12a", x: 500, y: 110,
      child0: { ref: "p1a", inv: false }, child1: { ref: "p2a", inv: false } },
    { id: "m12b", label: "m12b", x: 500, y: 136,
      child0: { ref: "p1b", inv: false }, child1: { ref: "p2b", inv: false } },
    { id: "m12c", label: "m12c", x: 500, y: 162,
      child0: { ref: "p1c", inv: false }, child1: { ref: "p2c", inv: false } },
    { id: "m13a", label: "m13a", x: 500, y: 188,
      child0: { ref: "p1a", inv: false }, child1: { ref: "p3a", inv: false } },
    { id: "m13b", label: "m13b", x: 500, y: 214,
      child0: { ref: "p1b", inv: false }, child1: { ref: "p3b", inv: false } },
    { id: "m13c", label: "m13c", x: 500, y: 240,
      child0: { ref: "p1c", inv: false }, child1: { ref: "p3c", inv: false } },
    { id: "m14a", label: "m14a", x: 500, y: 266,
      child0: { ref: "p1a", inv: false }, child1: { ref: "p4a", inv: false } },
    { id: "m14b", label: "m14b", x: 500, y: 292,
      child0: { ref: "p1b", inv: false }, child1: { ref: "p4b", inv: false } },
    { id: "m14c", label: "m14c", x: 500, y: 318,
      child0: { ref: "p1c", inv: false }, child1: { ref: "p4c", inv: false } },
    { id: "m23a", label: "m23a", x: 500, y: 344,
      child0: { ref: "p2a", inv: false }, child1: { ref: "p3a", inv: false } },
    { id: "m23b", label: "m23b", x: 500, y: 370,
      child0: { ref: "p2b", inv: false }, child1: { ref: "p3b", inv: false } },
    { id: "m23c", label: "m23c", x: 500, y: 396,
      child0: { ref: "p2c", inv: false }, child1: { ref: "p3c", inv: false } },
    { id: "m24a", label: "m24a", x: 500, y: 422,
      child0: { ref: "p2a", inv: false }, child1: { ref: "p4a", inv: false } },
    { id: "m24b", label: "m24b", x: 500, y: 448,
      child0: { ref: "p2b", inv: false }, child1: { ref: "p4b", inv: false } },
    { id: "m24c", label: "m24c", x: 500, y: 474,
      child0: { ref: "p2c", inv: false }, child1: { ref: "p4c", inv: false } },
    { id: "m34a", label: "m34a", x: 500, y: 500,
      child0: { ref: "p3a", inv: false }, child1: { ref: "p4a", inv: false } },
    { id: "m34b", label: "m34b", x: 500, y: 526,
      child0: { ref: "p3b", inv: false }, child1: { ref: "p4b", inv: false } },
    { id: "m34c", label: "m34c", x: 500, y: 552,
      child0: { ref: "p3c", inv: false }, child1: { ref: "p4c", inv: false } },
  ],
  outputs: [
    { id: "O_nh1",  label: "nh1",  ref: "nh1",  inv: true, x: 660, y:  40 },
    { id: "O_m12a", label: "m12a", ref: "m12a", inv: true, x: 660, y:  67 },
    { id: "O_m12b", label: "m12b", ref: "m12b", inv: true, x: 660, y:  94 },
    { id: "O_m12c", label: "m12c", ref: "m12c", inv: true, x: 660, y: 121 },
    { id: "O_m13a", label: "m13a", ref: "m13a", inv: true, x: 660, y: 148 },
    { id: "O_m13b", label: "m13b", ref: "m13b", inv: true, x: 660, y: 175 },
    { id: "O_m13c", label: "m13c", ref: "m13c", inv: true, x: 660, y: 202 },
    { id: "O_m14a", label: "m14a", ref: "m14a", inv: true, x: 660, y: 229 },
    { id: "O_m14b", label: "m14b", ref: "m14b", inv: true, x: 660, y: 256 },
    { id: "O_m14c", label: "m14c", ref: "m14c", inv: true, x: 660, y: 283 },
    { id: "O_nh2",  label: "nh2",  ref: "nh2",  inv: true, x: 660, y: 310 },
    { id: "O_m23a", label: "m23a", ref: "m23a", inv: true, x: 660, y: 337 },
    { id: "O_m23b", label: "m23b", ref: "m23b", inv: true, x: 660, y: 364 },
    { id: "O_m23c", label: "m23c", ref: "m23c", inv: true, x: 660, y: 391 },
    { id: "O_m24a", label: "m24a", ref: "m24a", inv: true, x: 660, y: 418 },
    { id: "O_m24b", label: "m24b", ref: "m24b", inv: true, x: 660, y: 445 },
    { id: "O_m24c", label: "m24c", ref: "m24c", inv: true, x: 660, y: 472 },
    { id: "O_nh3",  label: "nh3",  ref: "nh3",  inv: true, x: 660, y: 499 },
    { id: "O_m34a", label: "m34a", ref: "m34a", inv: true, x: 660, y: 520 },
    { id: "O_m34b", label: "m34b", ref: "m34b", inv: true, x: 660, y: 547 },
    { id: "O_m34c", label: "m34c", ref: "m34c", inv: true, x: 660, y: 574 },
    { id: "O_nh4",  label: "nh4",  ref: "nh4",  inv: true, x: 660, y: 595 },
  ],
};
