// 4-bit × 4-bit multiplier targeting 15 = 8'b0000_1111.
// Each product bit is exposed as its own output, inverted where the target
// bit is 0 — so every output pins TRUE at L0 under the viz's output-assertion
// semantics, and no comparison tree is synthesized.
module mul15(a, b, t);
  input  [3:0] a, b;
  output [7:0] t;
  wire   [7:0] p = a * b;
  assign t[0] =  p[0];  // target 1
  assign t[1] =  p[1];
  assign t[2] =  p[2];
  assign t[3] =  p[3];
  assign t[4] = ~p[4];  // target 0
  assign t[5] = ~p[5];
  assign t[6] = ~p[6];
  assign t[7] = ~p[7];
endmodule
