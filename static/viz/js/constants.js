// =============================================================================
// constants.js — values shared by the solver and the renderer.
//
// Kept in its own module so neither solver nor render has to depend on the
// other for these (no import cycles over constants).
// =============================================================================

// SVG namespace used when creating elements via document.createElementNS.
export const SVG_NS = "http://www.w3.org/2000/svg";

// Tri-state Boolean encoding used throughout the solver.
//   UNKNOWN: the variable is unassigned
//   TRUE:    the variable is assigned 1
//   FALSE:   the variable is assigned 0
// We use numeric 0/1 rather than booleans so that `1 - v` flips polarity.
export const UNKNOWN = null;
export const TRUE    = 1;
export const FALSE   = 0;

// Fixed pixel dimensions for SVG primitives. The circuit JSON places each
// node at an (x, y) anchor; these constants define how wide/tall each shape
// is drawn around that anchor.
export const INPUT_R  = 20; // primary-input circle radius
export const GATE_W   = 60; // AND-gate (D-shape) width
export const GATE_H   = 40; // AND-gate height
export const BUBBLE_R = 4;  // inverter-bubble radius on complemented edges
