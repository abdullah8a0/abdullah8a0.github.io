// =============================================================================
// solver.js — CDCL engine for AIG circuits.
//
// Responsibilities:
//   * Hold the mutable engine state (current circuit, trail, decision stack,
//     conflict, learned clauses, 1-UIP analysis in progress, etc.).
//   * Non-clausal BCP: forward- and backward-propagate through AND gates.
//   * Detect conflicts and run 1-UIP conflict analysis with optional
//     self-subsuming-resolution minimization.
//   * Apply backjumps and learn clauses.
//
// Deliberately has NO DOM access. The only UI touchpoint is the `render()`
// call at the end of user-triggered actions (decide/undo/reset/step/auto),
// which is imported from render.js. This is a circular import, which is legal
// under ES modules because render() is a hoisted function declaration.
//
// State is exported as `let` bindings — ES-module live bindings let render.js
// read the current value without any getter boilerplate. When solver.js
// reassigns (e.g. `trail = []`), importers see the new array automatically.
// =============================================================================

import { UNKNOWN, TRUE, FALSE } from "./constants.js";
import { render } from "./render.js";

// ---------------------------------------------------------------------------
// Circuit lookup tables. Re-populated whenever the user switches circuits.
// ---------------------------------------------------------------------------

export let circuit  = null;  // the currently loaded CIRCUITS entry
export let inputMap = {};    // id → input node object
export let gateMap  = {};    // id → gate node object
export let allIds   = [];    // all node ids (inputs first, gates after)
export let fanout   = {};    // id → [gates that reference this id as a child]

export const isInput = id => id in inputMap;
export const isGate  = id => id in gateMap;
export const nodeOf  = id => inputMap[id] || gateMap[id];

function initLookups() {
  inputMap = {};
  gateMap  = {};
  circuit.inputs.forEach(n => (inputMap[n.id] = n));
  circuit.gates.forEach (g => (gateMap[g.id]  = g));
  allIds = [...circuit.inputs.map(n => n.id), ...circuit.gates.map(g => g.id)];
  fanout = {};
  allIds.forEach(id => (fanout[id] = []));
  circuit.gates.forEach(g => {
    fanout[g.child0.ref].push(g);
    fanout[g.child1.ref].push(g);
  });
}

// ---------------------------------------------------------------------------
// Engine state.
// ---------------------------------------------------------------------------

// Per-node assignment record:
//   state[id] = { value, level, reason, order }
// where:
//   value:  UNKNOWN | TRUE | FALSE
//   level:  decision level at which the assignment happened (0 for L0)
//   reason: null              — decision (user choice)
//           {type:"assertion", output:id}  — output pinning at L0
//           {type:"forward"|"backward", gate:id}  — forced by a gate
//           {type:"learned", idx}    — forced by a learned clause
//   order:  position in the global trail (for trail-order disambiguation)
export let state          = {};
export let trail          = [];
export let decisionStack  = [];   // [{level, trailStart}] — for undo
export let decisionLevel  = 0;
export let conflict       = null; // {id, attempted, existing, reason} | null
export let worklist       = [];
export let learnedClauses = [];   // [{id, literals, trace?, uipLit?, backjumpLevel?}]
export let analysisState  = null; // {result, step} when stepping through 1-UIP
export let historyView    = null; // {idx} when a learned-clause box is open
export let minimizeOn     = true; // toggles self-subsuming-resolution

// UI-facing setter for the minimize checkbox.
export function setMinimizeOn(v) { minimizeOn = !!v; }

function resetEngineState() {
  state = {};
  allIds.forEach(id => {
    state[id] = { value: UNKNOWN, level: null, reason: null, order: null };
  });
  trail = [];
  decisionStack = [];
  decisionLevel = 0;
  conflict = null;
  worklist = [];
  learnedClauses = [];
  analysisState = null;
  historyView = null;
}

// Entry point used by app.js when the user selects a different circuit.
// Rebuilds lookup tables, zeros the engine state, and immediately propagates
// the output assertions. Does not touch the DOM.
export function loadCircuitData(c) {
  circuit = c;
  initLookups();
  resetEngineState();
  assertOutputs();
  propagate();
}

// ---------------------------------------------------------------------------
// Non-clausal BCP (AND-gate propagation rules).
//
// Forward (children → gate output):
//   a=FALSE or b=FALSE  ⇒ output FALSE
//   a=TRUE  and b=TRUE  ⇒ output TRUE
//   otherwise           ⇒ UNKNOWN
//
// Backward (gate output → children):
//   output=TRUE         ⇒ a=TRUE AND b=TRUE  (both forced)
//   output=FALSE        ⇒ nothing (ambiguous — creates the J-frontier)
//
// This asymmetry is what makes non-clausal BCP weaker than clausal BCP, and
// is the whole reason the J-frontier exists as a concept.
// ---------------------------------------------------------------------------

export const applyInv = (v, inv) => (v === UNKNOWN ? UNKNOWN : (inv ? 1 - v : v));
export const effChild = c        => applyInv(state[c.ref].value, c.inv);

function forwardForce(g) {
  const a = effChild(g.child0), b = effChild(g.child1);
  if (a === FALSE || b === FALSE) return FALSE;
  if (a === TRUE  && b === TRUE ) return TRUE;
  return UNKNOWN;
}

function backwardForces(g) {
  if (state[g.id].value !== TRUE) return [];
  const out = [];
  for (const child of [g.child0, g.child1]) {
    if (state[child.ref].value === UNKNOWN) {
      out.push({ ref: child.ref, value: applyInv(TRUE, child.inv) });
    }
  }
  return out;
}

// Attempt to assign a node. Returns true on success, false on conflict.
// On conflict, sets the module-level `conflict` record.
function assignNode(id, value, reason) {
  const st = state[id];
  if (st.value !== UNKNOWN) {
    if (st.value !== value) {
      conflict = { id, attempted: value, existing: st.value, reason };
      return false;
    }
    return true;
  }
  st.value  = value;
  st.level  = decisionLevel;
  st.reason = reason;
  st.order  = trail.length;
  trail.push(id);
  worklist.push(id);
  return true;
}

// Drain the worklist, propagating every change until fixpoint or conflict.
function propagate() {
  while (worklist.length && !conflict) {
    const id = worklist.shift();

    // Forward: re-evaluate every gate that has `id` as a child.
    for (const g of fanout[id]) {
      const f = forwardForce(g);
      if (f !== UNKNOWN) {
        assignNode(g.id, f, { type: "forward", gate: g.id });
        if (conflict) return;
      }
    }

    // Backward: if `id` is a gate with value TRUE, force its children.
    if (isGate(id) && state[id].value === TRUE) {
      for (const f of backwardForces(gateMap[id])) {
        assignNode(f.ref, f.value, { type: "backward", gate: id });
        if (conflict) return;
      }
    }

    // Learned clauses also get a chance to fire.
    checkLearnedClauses();
    if (conflict) return;
  }
}

// Pin every output at decision level 0 to its effective-TRUE value. This is
// what lets backward propagation flow from the target constraints into the
// circuit before the user has made a single decision.
function assertOutputs() {
  for (const o of circuit.outputs) {
    if (conflict) return;
    const raw = o.inv ? FALSE : TRUE;
    assignNode(o.ref, raw, { type: "assertion", output: o.id });
  }
}

// ---------------------------------------------------------------------------
// Public user-triggered actions.
// ---------------------------------------------------------------------------

export function decide(id, value) {
  if (conflict) return;
  if (state[id].value !== UNKNOWN) return;
  decisionLevel++;
  decisionStack.push({ level: decisionLevel, trailStart: trail.length });
  worklist = [];
  assignNode(id, value, null);
  propagate();
  render();
}

export function undo() {
  if (decisionStack.length === 0) return;
  const frame = decisionStack.pop();
  while (trail.length > frame.trailStart) {
    const id = trail.pop();
    state[id] = { value: UNKNOWN, level: null, reason: null, order: null };
  }
  decisionLevel--;
  conflict = null;
  analysisState = null;
  historyView = null;
  render();
}

export function reset() {
  if (trail.length > 0 && !confirm("Reset all decisions and learned clauses?")) return;
  resetEngineState();
  assertOutputs();
  propagate();
  render();
}

// ---------------------------------------------------------------------------
// SAT / UNSAT / J-frontier queries.
// ---------------------------------------------------------------------------

// UNSAT when propagation from the L0-pinned outputs derives ⊥ without any
// user decision.
export function isUnsat() {
  return !!(circuit && conflict && decisionLevel === 0);
}

// SAT requires: every output TRUE, every primary input concretely assigned,
// and no conflict. Setting a target output by fiat with dangling inputs does
// not count as a model.
export function isSat() {
  if (!circuit || conflict) return false;
  for (const o of circuit.outputs) {
    const s = state[o.ref];
    if (!s || s.value === UNKNOWN) return false;
    if (applyInv(s.value, o.inv) !== TRUE) return false;
  }
  for (const n of circuit.inputs) {
    if (state[n.id].value === UNKNOWN) return false;
  }
  return true;
}

// J-frontier gate: output known FALSE but neither input is known FALSE —
// a decision is needed to resolve which input is responsible.
export function isJFrontier(id) {
  if (!isGate(id)) return false;
  const g = gateMap[id];
  if (state[id].value !== FALSE) return false;
  const a = effChild(g.child0), b = effChild(g.child1);
  return a !== FALSE && b !== FALSE;
}

// ---------------------------------------------------------------------------
// Literals and Tseitin clauses.
//
// A literal is { var: nodeId, neg: bool }.  It is TRUE under the current
// assignment iff state[var].value XOR neg == TRUE.
//
// For an AND gate  z = ℓa ∧ ℓb  (ℓa, ℓb being effective inputs after edge
// inversion), the three Tseitin clauses are:
//   1. ¬ℓa ∨ ¬ℓb ∨ ℓz   (both inputs TRUE ⇒ output TRUE)
//   2.  ℓa ∨ ¬ℓz         (output TRUE  ⇒ left  input TRUE)
//   3.  ℓb ∨ ¬ℓz         (output TRUE  ⇒ right input TRUE)
// ---------------------------------------------------------------------------

export const lit    = (v, neg = false) => ({ var: v, neg });
export const negLit = (l)              => ({ var: l.var, neg: !l.neg });
export const effLit = (c)              => lit(c.ref, c.inv);

export function litValue(l) {
  const v = state[l.var]?.value;
  if (v === UNKNOWN || v == null) return UNKNOWN;
  return l.neg ? 1 - v : v;
}

export function litEq(a, b) { return a.var === b.var && a.neg === b.neg; }
export function litKey(l)   { return l.var + "|" + (l.neg ? 1 : 0); }

// Order-independent clause identity, used by findKnownClause.
function clauseKey(lits) {
  return lits.map(litKey).sort().join(",");
}

function tseitinClauses(g) {
  const la = effLit(g.child0);
  const lb = effLit(g.child1);
  const lz = lit(g.id);
  return [
    [negLit(la), negLit(lb), lz],
    [la, negLit(lz)],
    [lb, negLit(lz)],
  ];
}

// Text forms — useful to renderer and history panel. Kept alongside the
// literal primitives so they move together if the representation changes.
export function litStr(l)    { return (l.neg ? "¬" : "") + l.var; }
export function clauseStr(literals) {
  return literals.map(litStr).join(" ∨ ") || "∅";
}

// Is the given clause already implied by something we have (a Tseitin clause
// of an existing gate, or a previously-learned clause)? Prevents us from
// adding redundant learned clauses.
function findKnownClause(lits) {
  const key = clauseKey(lits);
  for (const g of circuit.gates) {
    const clauses = tseitinClauses(g);
    for (let i = 0; i < clauses.length; i++) {
      if (clauseKey(clauses[i]) === key) {
        return { source: "gate", gate: g.id, which: i };
      }
    }
  }
  for (let i = 0; i < learnedClauses.length; i++) {
    if (clauseKey(learnedClauses[i].literals) === key) {
      return { source: "learned", idx: i };
    }
  }
  return null;
}

// The Tseitin clause that was (or would have been) unit when `varId` got
// assigned `value` by gate propagation. Used both for reason-clause lookup
// during 1-UIP resolution and for extracting the falsified conflict clause.
function tseitinClauseFor(gate, varId, value) {
  const la = effLit(gate.child0);
  const lb = effLit(gate.child1);
  const lz = lit(gate.id);

  if (varId === gate.id) {
    // Forward prop forced gate output.
    if (value === TRUE)  return [negLit(la), negLit(lb), lz];  // clause 1
    // value === FALSE: whichever child was effectively FALSE first.
    const ea = litValue(la), eb = litValue(lb);
    if (ea === FALSE && eb !== FALSE) return [la, negLit(lz)];
    if (eb === FALSE && ea !== FALSE) return [lb, negLit(lz)];
    // Both currently FALSE — disambiguate by trail order.
    const o0 = state[gate.child0.ref].order ?? Infinity;
    const o1 = state[gate.child1.ref].order ?? Infinity;
    return (o0 <= o1) ? [la, negLit(lz)] : [lb, negLit(lz)];
  }
  // Backward prop forced a child (z=TRUE forces that child to effectively TRUE).
  if (varId === gate.child0.ref) return [la, negLit(lz)];
  return [lb, negLit(lz)];
}

// Reason clause for a var in the trail.  Returns null for decisions AND for
// output assertions: both are root facts in the implication graph, where
// 1-UIP resolution should stop.
function reasonClauseOf(varId) {
  const r = state[varId].reason;
  if (r === null) return null;
  if (r.type === "assertion") return null;
  if (r.type === "learned") return learnedClauses[r.idx].literals;
  return tseitinClauseFor(gateMap[r.gate], varId, state[varId].value);
}

// The clause that the solver tried to violate at conflict time.
export function extractConflictClause() {
  if (!conflict || !conflict.reason) return null;
  const r = conflict.reason;
  if (r.type === "learned") return learnedClauses[r.idx].literals;
  return tseitinClauseFor(gateMap[r.gate], conflict.id, conflict.attempted);
}

// ---------------------------------------------------------------------------
// 1-UIP conflict analysis with optional self-subsuming-resolution
// minimization.
// ---------------------------------------------------------------------------

function analyzeConflict() {
  if (!conflict) return null;
  const initial = extractConflictClause();
  if (!initial) return null;

  let clause = dedupe(initial);
  const atCurrent = l => state[l.var].level === decisionLevel;
  let trailIdx = trail.length - 1;
  const trace = [{ clause: clause.slice(), pivot: null, reason: null }];

  // Resolve backward through the trail until exactly one literal at the
  // current decision level remains — that literal is the 1-UIP.
  let guard = 0;
  while (clause.filter(atCurrent).length > 1 && guard++ < 10000) {
    let pivot = null;
    while (trailIdx >= 0) {
      const v = trail[trailIdx--];
      if (state[v].level !== decisionLevel) continue;
      if (!clause.some(l => l.var === v))    continue;
      pivot = v;
      break;
    }
    if (pivot === null) break;
    const rc = reasonClauseOf(pivot);
    if (!rc) break; // pivot is a decision/assertion — can't resolve further
    clause = resolve(clause, rc, pivot);
    trace.push({ clause: clause.slice(), pivot, reason: rc });
  }

  const uipLits = clause.filter(atCurrent);
  const uipLit  = uipLits[0] ?? null;
  const others  = clause.filter(l => !atCurrent(l));
  const backjumpLevel = others.length
    ? Math.max(...others.map(l => state[l.var].level))
    : 0;

  // Self-subsuming-resolution minimization: drop any non-UIP literal `l`
  // whose reason clause contains only literals already in the clause (other
  // than l itself). Each drop is a real resolution step and gets pushed onto
  // the trace so the step-through UI shows the clause continuing to shrink.
  if (minimizeOn) {
    let changed = true;
    let mguard = 0;
    while (changed && mguard++ < 1000) {
      changed = false;
      for (const l of clause) {
        if (uipLit && litEq(l, uipLit)) continue;
        const reason = state[l.var].reason;
        if (reason === null) continue;             // decision
        if (reason.type === "assertion") continue; // root fact
        const rc = reasonClauseOf(l.var);
        if (!rc) continue;
        const redundant = rc.every(r =>
          r.var === l.var || clause.some(c => litEq(c, r))
        );
        if (redundant) {
          clause = resolve(clause, rc, l.var);
          trace.push({ clause: clause.slice(), pivot: l.var, reason: rc, minimized: true });
          changed = true;
          break;
        }
      }
    }
  }

  const known = findKnownClause(clause);
  return { clause, uipLit, backjumpLevel, trace, known };
}

function dedupe(lits) {
  const m = new Map();
  for (const l of lits) m.set(litKey(l), l);
  return [...m.values()];
}

// Resolution: drop every literal mentioning pivotVar from both clauses,
// union the rest. The caller guarantees the two clauses disagree on pivotVar's
// polarity, so dropping by variable is safe.
function resolve(c1, c2, pivotVar) {
  const m = new Map();
  for (const l of c1) if (l.var !== pivotVar) m.set(litKey(l), l);
  for (const l of c2) if (l.var !== pivotVar) m.set(litKey(l), l);
  return [...m.values()];
}

// ---------------------------------------------------------------------------
// Stepping through / applying the analysis, plus backjump and learned-clause
// BCP.
// ---------------------------------------------------------------------------

export function stepAnalysis() {
  if (!conflict || isUnsat()) return;
  if (!analysisState) {
    const result = analyzeConflict();
    if (!result) return;
    analysisState = { result, step: 0 };
    render();
    return;
  }
  if (analysisState.step >= analysisState.result.trace.length - 1) {
    autoAnalysis();
    return;
  }
  analysisState.step++;
  render();
}

export function autoAnalysis() {
  if (!conflict || isUnsat()) return;
  if (!analysisState) {
    const result = analyzeConflict();
    if (!result) return;
    analysisState = { result, step: 0 };
  }
  backjump(analysisState.result);
  analysisState = null;
  render();
}

// Show (or hide) a learned clause's stored derivation history. Inert while a
// live conflict analysis is in progress.
export function toggleHistory(idx) {
  if (analysisState) return;
  if (!learnedClauses[idx]?.trace) return;
  historyView = (historyView && historyView.idx === idx) ? null : { idx };
  render();
}

function backjump(result) {
  const { clause, uipLit, backjumpLevel, known } = result;

  // Unwind the trail down to backjumpLevel.
  while (trail.length > 0) {
    const v = trail[trail.length - 1];
    if (state[v].level <= backjumpLevel) break;
    state[v] = { value: UNKNOWN, level: null, reason: null, order: null };
    trail.pop();
  }
  while (decisionStack.length > 0 &&
         decisionStack[decisionStack.length - 1].level > backjumpLevel) {
    decisionStack.pop();
  }
  decisionLevel = backjumpLevel;
  conflict = null;

  // Record the learned clause only if it's actually new. A clause that
  // matches an existing gate's Tseitin encoding or a prior learned clause
  // adds no information.
  let reasonForUip = null;
  if (known) {
    if (known.source === "gate") {
      const type = uipLit && uipLit.var === known.gate ? "forward" : "backward";
      reasonForUip = { type, gate: known.gate };
    } else {
      reasonForUip = { type: "learned", idx: known.idx };
    }
  } else {
    const idx = learnedClauses.length;
    learnedClauses.push({
      id: "LC" + (idx + 1),
      literals: clause,
      // Snapshot the 1-UIP (+ minimization) trace so the user can click the
      // LC box later and see why this clause exists.
      trace: result.trace.map(e => ({ ...e, clause: e.clause.slice() })),
      uipLit,
      backjumpLevel,
    });
    reasonForUip = { type: "learned", idx };
  }

  if (uipLit) {
    const value = uipLit.neg ? FALSE : TRUE;
    worklist = [];
    assignNode(uipLit.var, value, reasonForUip);
    propagate();
  }
}

// Called on every BCP step — each learned clause might fire (unit
// propagation) or conflict (all literals FALSE).  Trivially O(|LC| × |avg
// clause|) per step; irrelevant at this scale.
function checkLearnedClauses() {
  for (let idx = 0; idx < learnedClauses.length && !conflict; idx++) {
    const cl = learnedClauses[idx];
    let unassigned = null;
    let satisfied  = false;
    let unassignedCount = 0;
    for (const l of cl.literals) {
      const v = litValue(l);
      if (v === TRUE)    { satisfied = true; break; }
      if (v === UNKNOWN) { unassigned = l; unassignedCount++; }
    }
    if (satisfied) continue;
    if (unassignedCount === 0) {
      conflict = { id: null, attempted: null, existing: null,
                   reason: { type: "learned", idx } };
      return;
    }
    if (unassignedCount === 1) {
      const value = unassigned.neg ? FALSE : TRUE;
      assignNode(unassigned.var, value, { type: "learned", idx });
    }
  }
}

// ---------------------------------------------------------------------------
// View-facing derivations from engine state. These belong next to the
// analysis code because the rendering layer is "what to highlight given the
// current analysis step".
// ---------------------------------------------------------------------------

// Which gate / clause is being resolved against at the current analysis step?
// At step 0 it's the conflict's reason; at step i>0 it's the reason of that
// step's pivot variable.
export function analysisReasonSource() {
  if (!analysisState) return null;
  const { result, step } = analysisState;
  if (step === 0) {
    const r = conflict?.reason;
    return r ? { ...r } : null;
  }
  const pivot = result.trace[step]?.pivot;
  if (!pivot) return null;
  const r = state[pivot]?.reason;
  return r ? { ...r } : null;
}

// Which nodes / clauses to visually highlight at the current analysis step.
// Empty sets when no analysis is active so callers can be unconditional.
export function analysisHighlights() {
  const empty = { clauseVars: new Set(), pivot: null, reasonGate: null, reasonClauseIdx: -1 };
  if (!analysisState) return empty;
  const { result, step } = analysisState;
  const entry = result.trace[step];
  if (!entry) return empty;
  const src = analysisReasonSource();
  return {
    clauseVars: new Set(entry.clause.map(l => l.var)),
    pivot: entry.pivot ?? null,
    reasonGate: src?.type === "gate"    ? src.gate : null,
    reasonClauseIdx: src?.type === "learned" ? src.idx  : -1,
  };
}
