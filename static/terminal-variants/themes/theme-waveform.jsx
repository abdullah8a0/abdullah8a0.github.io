// Waveform — GTKWave / VCD timing-diagram style. Content as signal traces.
const Waveform = () => {
  const css = `
    .wf-wrap{width:100%;height:100%;background:#0d0f14;color:#c9d6df;font-family:"Iosevka","JetBrains Mono",monospace;font-size:12px;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden;}
    .wf-top{display:flex;align-items:center;gap:18px;padding:12px 20px;border-bottom:1px solid #1c2028;background:#12141b;font-size:11px;letter-spacing:.15em;color:#6d7a88;text-transform:uppercase;}
    .wf-top .t{color:#e8eef5;font-weight:600;letter-spacing:.04em;text-transform:none;}
    .wf-top .pill{border:1px solid #2a3140;padding:2px 8px;border-radius:999px;color:#c9d6df;}
    .wf-body{display:grid;grid-template-columns:220px 1fr;overflow:auto;}
    .wf-names{border-right:1px solid #1c2028;background:#0f1219;padding:14px 0;}
    .wf-names .row{display:grid;grid-template-columns:14px 1fr 48px;padding:0 16px 0 14px;height:30px;align-items:center;gap:10px;font-size:11.5px;}
    .wf-names .row .sw{width:8px;height:8px;border-radius:50%;background:#3a86ff;}
    .wf-names .row .nm{color:#e8eef5;}
    .wf-names .row .v{color:#8da1b5;text-align:right;font-variant-numeric:tabular-nums;}
    .wf-names .grp{font-size:10px;letter-spacing:.3em;color:#6d7a88;padding:10px 16px 6px;text-transform:uppercase;}
    .wf-grid{position:relative;padding:14px 0;background:
      repeating-linear-gradient(90deg,transparent 0 80px,rgba(255,255,255,.04) 80px 81px);}
    .wf-time{position:sticky;top:0;display:flex;height:22px;border-bottom:1px solid #1c2028;background:#0f1219;font-size:10px;color:#6d7a88;}
    .wf-time span{width:80px;padding-left:6px;line-height:22px;border-right:1px solid #1c2028;}
    .wf-row{height:30px;position:relative;}
    .wf-row svg{display:block;overflow:visible;}
    .wf-seg{fill:rgba(58,134,255,.12);stroke:#3a86ff;stroke-width:1.2;}
    .wf-label{fill:#e8eef5;font-size:10.5px;font-family:inherit;}
    .wf-edge{stroke:#3a86ff;stroke-width:1.2;fill:none;}
    .wf-clk{stroke:#f2cc60;stroke-width:1.2;fill:none;}
    .wf-cursor{position:absolute;top:0;bottom:0;width:1px;background:#ff7b72;box-shadow:0 0 8px #ff7b72;pointer-events:none;}
    .wf-bot{display:flex;align-items:center;gap:22px;padding:10px 20px;border-top:1px solid #1c2028;background:#12141b;font-size:11px;color:#6d7a88;}
    .wf-bot b{color:#e8eef5;font-weight:500;}
    .wf-link{color:#76e4f7;text-decoration:underline;text-underline-offset:3px;}
  `;
  // 10 ticks x 80px = 800px window. Each row is a trace.
  const times = [0,80,160,240,320,400,480,560,640,720,800];
  const row = (y) => y;
  return (
    <div className="wf-wrap">
      <style>{css}</style>
      <div className="wf-top">
        <div className="t">fixpoint.vcd</div>
        <div className="pill">scope: abdullah.self</div>
        <div style={{flex:1}}/>
        <div>cursor t=342ns</div>
        <div>▶ 1x</div>
        <div>zoom ×1</div>
      </div>
      <div className="wf-body">
        <div className="wf-names">
          <div className="wf-time"/>
          <div className="grp">identity [4:0]</div>
          <div className="row"><span className="sw"/><span className="nm">name</span><span className="v">"abdullah"</span></div>
          <div className="row"><span className="sw" style={{background:"#f2cc60"}}/><span className="nm">role</span><span className="v">MEng</span></div>
          <div className="row"><span className="sw" style={{background:"#7ee787"}}/><span className="nm">lab</span><span className="v">MATCHA</span></div>
          <div className="row"><span className="sw" style={{background:"#e090d0"}}/><span className="nm">focus</span><span className="v">oo_riscv</span></div>
          <div className="grp">history</div>
          <div className="row"><span className="sw" style={{background:"#ff7b72"}}/><span className="nm">employer</span><span className="v">mit</span></div>
          <div className="row"><span className="sw" style={{background:"#76e4f7"}}/><span className="nm">degree</span><span className="v">bs+meng</span></div>
          <div className="grp">projects</div>
          <div className="row"><span className="sw"/><span className="nm">u2f</span><span className="v">ongoing</span></div>
          <div className="row"><span className="sw" style={{background:"#f2cc60"}}/><span className="nm">onechan</span><span className="v">ongoing</span></div>
          <div className="row"><span className="sw" style={{background:"#7ee787"}}/><span className="nm">profemon</span><span className="v">done</span></div>
          <div className="grp">i/o</div>
          <div className="row"><span className="sw" style={{background:"#e090d0"}}/><span className="nm">clk (email/gh/li)</span><span className="v">↗</span></div>
        </div>
        <div className="wf-grid">
          <div className="wf-time">{times.slice(0,10).map((t,i)=><span key={i}>{t}ns</span>)}</div>
          <div className="wf-cursor" style={{left: 14 + 342}}/>

          {/* identity traces: bus segments with labels */}
          <BusRow label="abdullah" segs={[[0,800,"abdullah"]]} color="#3a86ff"/>
          <BusRow label="MEng" segs={[[0,220,"BS (CS + Math)"],[220,800,"MEng · CSAIL"]]} color="#f2cc60"/>
          <BusRow label="MATCHA" segs={[[0,220,"—"],[220,800,"MATCHA Lab"]]} color="#7ee787"/>
          <BusRow label="formal verif oo-RISCV" segs={[[0,220,"—"],[220,800,"∀P. wf(P) → safe(ooR(P))"]]} color="#e090d0"/>

          {/* spacer aligning with "history" group gap */}
          <div style={{height:26}}/>

          <BusRow label="siemens→mit" segs={[[0,140,"Siemens EDA R&D"],[140,220,"transit"],[220,800,"MIT CSAIL"]]} color="#ff7b72"/>
          <BusRow label="degrees" segs={[[0,220,"BS · CS+Math"],[220,800,"MEng"]]} color="#76e4f7"/>

          <div style={{height:26}}/>

          {/* project pulses */}
          <PulseRow color="#3a86ff" pulses={[[40,180],[260,420],[520,760]]} label="u2f"/>
          <PulseRow color="#f2cc60" pulses={[[120,320],[440,700]]} label="onechan"/>
          <PulseRow color="#7ee787" pulses={[[60,240]]} label="profemon"/>

          <div style={{height:26}}/>

          {/* clock row = contact pulses */}
          <ClockRow color="#e090d0"/>
        </div>
      </div>
      <div className="wf-bot">
        <span>▮ <b>342ns</b> · idle</span>
        <span>Δt <b>+182ns</b> since last ∆</span>
        <div style={{flex:1}}/>
        <a className="wf-link" href="#">resume.pdf</a>
        <a className="wf-link" href="#">github</a>
        <a className="wf-link" href="#">linkedin</a>
        <a className="wf-link" href="#">email</a>
      </div>
    </div>
  );
};

// a bus-style trace with labeled segments and hex-like transitions
function BusRow({ segs, color, label }){
  const rowH = 30;
  return (
    <div className="wf-row">
      <svg width="820" height={rowH}>
        {segs.map(([x1,x2,lab], i) => {
          const y1 = 6, y2 = rowH - 8, mid = (y1+y2)/2;
          const tip = 6;
          return (
            <g key={i}>
              <polygon points={`${x1+tip},${y1} ${x2-tip},${y1} ${x2},${mid} ${x2-tip},${y2} ${x1+tip},${y2} ${x1},${mid}`}
                style={{fill:color, fillOpacity:.12, stroke:color, strokeWidth:1.2}}/>
              <text x={(x1+x2)/2} y={mid+4} textAnchor="middle" className="wf-label">{lab}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
function PulseRow({ pulses, color, label }){
  const rowH = 30, hi = 6, lo = rowH - 8;
  let d = `M0,${lo}`;
  let cursor = 0;
  pulses.forEach(([a,b]) => {
    d += ` L${a},${lo} L${a},${hi} L${b},${hi} L${b},${lo}`;
    cursor = b;
  });
  d += ` L820,${lo}`;
  return (
    <div className="wf-row">
      <svg width="820" height={rowH}>
        <path d={d} className="wf-edge" style={{stroke:color}}/>
      </svg>
    </div>
  );
}
function ClockRow({ color }){
  const rowH = 30, hi = 6, lo = rowH - 8, p = 60;
  let d = `M0,${lo}`;
  for(let x=0; x<820; x+=p){
    d += ` L${x},${lo} L${x},${hi} L${x+p/2},${hi} L${x+p/2},${lo}`;
  }
  return (
    <div className="wf-row">
      <svg width="820" height={rowH}>
        <path d={d} style={{fill:"none",stroke:color,strokeWidth:1.2}}/>
      </svg>
    </div>
  );
}
window.Waveform = Waveform;
