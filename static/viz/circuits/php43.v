// Pigeonhole: 4 pigeons in 3 holes. Multi-output — each constraint exposed
// separately so the viz's L0 output assertion pins them all to TRUE.
module php43(
  input  p1a, p1b, p1c,
  input  p2a, p2b, p2c,
  input  p3a, p3b, p3c,
  input  p4a, p4b, p4c,
  output h1, h2, h3, h4,
  output m12a, m12b, m12c,
  output m13a, m13b, m13c,
  output m14a, m14b, m14c,
  output m23a, m23b, m23c,
  output m24a, m24b, m24c,
  output m34a, m34b, m34c
);
  assign h1 = p1a | p1b | p1c;
  assign h2 = p2a | p2b | p2c;
  assign h3 = p3a | p3b | p3c;
  assign h4 = p4a | p4b | p4c;

  assign m12a = ~(p1a & p2a);
  assign m12b = ~(p1b & p2b);
  assign m12c = ~(p1c & p2c);
  assign m13a = ~(p1a & p3a);
  assign m13b = ~(p1b & p3b);
  assign m13c = ~(p1c & p3c);
  assign m14a = ~(p1a & p4a);
  assign m14b = ~(p1b & p4b);
  assign m14c = ~(p1c & p4c);
  assign m23a = ~(p2a & p3a);
  assign m23b = ~(p2b & p3b);
  assign m23c = ~(p2c & p3c);
  assign m24a = ~(p2a & p4a);
  assign m24b = ~(p2b & p4b);
  assign m24c = ~(p2c & p4c);
  assign m34a = ~(p3a & p4a);
  assign m34b = ~(p3b & p4b);
  assign m34c = ~(p3c & p4c);
endmodule
