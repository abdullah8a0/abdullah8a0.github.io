// Proof Assistant — Coq / Lean style. Goal above line, hypotheses below, tactic script on the right.
const ProofAssistant = () => {
  const css = `
    .pr-wrap{width:100%;height:100%;background:#f6f3ee;color:#1a1a1a;font-family:"Iosevka","JetBrains Mono","Fira Code",monospace;display:grid;grid-template-columns:1.35fr 1fr;overflow:hidden;border-top:3px solid #1a1a1a;}
    .pr-left{padding:32px 36px;overflow:auto;border-right:1px solid #d8d2c4;background:#faf8f2;position:relative;}
    .pr-right{background:#1a1a1a;color:#eae3d0;padding:32px 30px;overflow:auto;font-size:12.5px;line-height:1.7;}
    .pr-crumb{font-size:10.5px;letter-spacing:.25em;text-transform:uppercase;color:#8a7e63;margin-bottom:26px;display:flex;justify-content:space-between;}
    .pr-thm{font-family:"Computer Modern Serif","Latin Modern Roman","Iowan Old Style",serif;font-size:15px;font-style:italic;color:#4a3e20;margin-bottom:10px;}
    .pr-stmt{font-family:"Computer Modern Serif","Latin Modern Roman","Iowan Old Style",serif;font-size:20px;line-height:1.5;color:#1a1a1a;margin-bottom:24px;}
    .pr-stmt b{font-style:italic;font-weight:400;color:#7a2a2a;}
    .pr-goal-head{font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;color:#8a7e63;display:flex;align-items:center;gap:10px;margin:18px 0 12px;}
    .pr-goal-head::after{content:"";flex:1;border-top:1px solid #d8d2c4;}
    .pr-hypo{font-size:13.5px;line-height:1.85;}
    .pr-hypo div{display:grid;grid-template-columns:120px 14px 1fr;gap:6px;align-items:start;margin-bottom:3px;}
    .pr-hypo .n{color:#2a5a7a;}
    .pr-hypo .c{color:#8a7e63;text-align:center;}
    .pr-hypo .t{color:#1a1a1a;}
    .pr-turnstile{margin:18px 0 10px;font-size:22px;color:#1a1a1a;font-family:serif;}
    .pr-turnstile::before{content:"⊢  ";color:#7a2a2a;font-weight:700;}
    .pr-goal{font-size:17px;font-family:"Computer Modern Serif",serif;color:#1a1a1a;padding:14px 18px;border-left:3px solid #7a2a2a;background:#fff;}
    .pr-goal em{color:#2a5a7a;font-style:italic;}
    .pr-links{margin-top:36px;padding-top:20px;border-top:1px dashed #d8d2c4;font-size:12px;color:#8a7e63;}
    .pr-links a{color:#2a5a7a;text-decoration:underline;text-underline-offset:3px;margin-right:14px;}
    .pr-links a:hover{color:#7a2a2a;}
    .pr-tactic .ln{display:grid;grid-template-columns:24px 1fr;gap:12px;}
    .pr-tactic .num{color:#5a5238;text-align:right;user-select:none;}
    .pr-tactic .kw{color:#d6a85a;}
    .pr-tactic .id{color:#e8c98a;}
    .pr-tactic .op{color:#c78a6a;}
    .pr-tactic .cm{color:#5a5238;font-style:italic;}
    .pr-tactic .ap{color:#9ac4b5;}
    .pr-tactic .prop{color:#e8e0c4;}
    .pr-done{margin-top:22px;color:#9ac4b5;font-size:13px;display:flex;align-items:center;gap:12px;}
    .pr-done::before{content:"■";}
    .pr-foot{position:absolute;bottom:0;left:0;right:0;border-top:1px solid #d8d2c4;padding:8px 36px;font-size:10.5px;color:#8a7e63;display:flex;justify-content:space-between;background:#f0ece2;}
    .pr-idx{color:#7a2a2a;font-weight:600;}
    .pr-sym{color:#7a2a2a;}
  `;
  return (
    <div className="pr-wrap">
      <style>{css}</style>
      <div className="pr-left">
        <div className="pr-crumb"><span>MATCHA / abdullah.v</span><span>module Self</span></div>
        <div className="pr-thm">Theorem 1.</div>
        <div className="pr-stmt">For every employer <b>E</b> and role <b>R</b>, if <b>E</b> requires <em>&lt;architecture, verification, systems&gt;</em>, there exists a candidate <b>x</b> such that <b>fit(E, x, R)</b> holds.</div>
        <div className="pr-goal-head">context</div>
        <div className="pr-hypo">
          <div><span className="n">name</span><span className="c">:</span><span className="t">Abdullah</span></div>
          <div><span className="n">program</span><span className="c">:</span><span className="t">MEng @ MIT CSAIL · MATCHA Lab</span></div>
          <div><span className="n">thesis</span><span className="c">⊨</span><span className="t">formal_verif(out_of_order_RISCV)</span></div>
          <div><span className="n">prior</span><span className="c">:</span><span className="t">R&D @ Siemens EDA</span></div>
          <div><span className="n">degree</span><span className="c">:</span><span className="t">BS CS ∧ BS Math · MIT</span></div>
          <div><span className="n">interests</span><span className="c">⊇</span><span className="t">{"{arch, hw/sw, formal, sec}"}</span></div>
        </div>
        <div className="pr-goal-head">goal</div>
        <div className="pr-turnstile"/>
        <div className="pr-goal">∃ x. <em>candidate(x)</em> ∧ <em>fit(E, x, R)</em></div>
        <div className="pr-links">
          <span style={{textTransform:"uppercase",letterSpacing:".2em",marginRight:14}}>Imports ·</span>
          <a href="#">Resume.pdf</a><a href="#">GitHub/u2f</a><a href="#">GitHub/onechan</a><a href="#">GitHub/profemon</a><a href="#">mail</a><a href="#">linkedin</a>
        </div>
        <div className="pr-foot"><span>MIT CSAIL · MATCHA</span><span><span className="pr-idx">1</span> / 1 goal · <span className="pr-sym">✓</span> no errors</span></div>
      </div>
      <div className="pr-right">
        <div className="pr-tactic">
          <div className="ln"><span className="num">1</span><span><span className="cm">(* abdullah : Candidate *)</span></span></div>
          <div className="ln"><span className="num">2</span><span><span className="kw">Definition</span> <span className="id">abdullah</span> <span className="op">:=</span></span></div>
          <div className="ln"><span className="num">3</span><span>  <span className="ap">mk_candidate</span> <span className="op">&#123;|</span></span></div>
          <div className="ln"><span className="num">4</span><span>    <span className="prop">role</span> <span className="op">:=</span> <span className="id">"MEng @ MIT CSAIL"</span>;</span></div>
          <div className="ln"><span className="num">5</span><span>    <span className="prop">lab</span>  <span className="op">:=</span> <span className="id">MATCHA</span>;</span></div>
          <div className="ln"><span className="num">6</span><span>    <span className="prop">focus</span><span className="op">:=</span> <span className="ap">formal_verif</span> <span className="id">oo_RISCV</span>;</span></div>
          <div className="ln"><span className="num">7</span><span>    <span className="prop">past</span> <span className="op">:=</span> <span className="id">Siemens_EDA</span>;</span></div>
          <div className="ln"><span className="num">8</span><span>  <span className="op">|&#125;</span>.</span></div>
          <div className="ln"><span className="num">9</span><span>&nbsp;</span></div>
          <div className="ln"><span className="num">10</span><span><span className="kw">Theorem</span> <span className="id">fit</span> <span className="op">:</span> ∀ E R, <span className="ap">requires</span> E <span className="op">⊇</span> core <span className="op">→</span></span></div>
          <div className="ln"><span className="num">11</span><span>  ∃ x, <span className="ap">candidate</span> x <span className="op">∧</span> <span className="ap">fit</span> E x R.</span></div>
          <div className="ln"><span className="num">12</span><span><span className="kw">Proof</span>.</span></div>
          <div className="ln"><span className="num">13</span><span>  <span className="kw">intros</span> E R Hreq.</span></div>
          <div className="ln"><span className="num">14</span><span>  <span className="kw">exists</span> <span className="id">abdullah</span>.</span></div>
          <div className="ln"><span className="num">15</span><span>  <span className="kw">split</span>.</span></div>
          <div className="ln"><span className="num">16</span><span>  - <span className="kw">apply</span> <span className="ap">candidate_wf</span>.</span></div>
          <div className="ln"><span className="num">17</span><span>  - <span className="kw">unfold</span> <span className="ap">fit</span>; <span className="kw">eauto</span>.</span></div>
          <div className="ln"><span className="num">18</span><span><span className="kw">Qed</span>.</span></div>
        </div>
        <div className="pr-done">Qed. · 0 subgoals remaining.</div>
      </div>
    </div>
  );
};
window.ProofAssistant = ProofAssistant;
