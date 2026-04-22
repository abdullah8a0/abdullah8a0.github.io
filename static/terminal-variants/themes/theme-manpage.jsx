// Man Page — troff / editorial serif + mono; formal but warm
const ManPage = () => {
  const css = `
    .mn-wrap{width:100%;height:100%;background:#f3ede0;color:#2a2722;font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;overflow:auto;padding:0;position:relative;}
    .mn-head{display:flex;justify-content:space-between;padding:26px 48px 8px;border-bottom:2px double #2a2722;font-family:"SFMono-Regular",ui-monospace,monospace;font-size:11.5px;letter-spacing:.22em;text-transform:uppercase;color:#2a2722;}
    .mn-head b{font-weight:700;}
    .mn-body{display:grid;grid-template-columns:1fr 1fr;gap:38px;padding:28px 48px 60px;max-width:1000px;margin:0 auto;}
    .mn-col{font-size:14.5px;line-height:1.65;}
    .mn-section{font-family:"SFMono-Regular",ui-monospace,monospace;font-size:11.5px;letter-spacing:.28em;text-transform:uppercase;color:#6b5a3a;margin:22px 0 8px;font-weight:700;}
    .mn-section:first-child{margin-top:0;}
    .mn-title{font-size:74px;font-weight:400;letter-spacing:-.045em;line-height:.95;color:#2a2722;margin:18px 0 2px;}
    .mn-subt{font-family:"SFMono-Regular",ui-monospace,monospace;font-size:12px;color:#6b5a3a;letter-spacing:.05em;margin-bottom:22px;}
    .mn-syn{font-family:"SFMono-Regular",ui-monospace,monospace;font-size:13px;line-height:1.8;padding-left:22px;text-indent:-22px;}
    .mn-syn b{color:#2a2722;font-weight:700;}
    .mn-syn i{color:#8a2a2a;font-style:italic;}
    .mn-desc{font-style:normal;}
    .mn-desc em{font-style:italic;color:#8a2a2a;}
    .mn-dl{display:grid;grid-template-columns:min-content 1fr;gap:4px 18px;font-family:"SFMono-Regular",ui-monospace,monospace;font-size:12.5px;}
    .mn-dl dt{color:#8a2a2a;white-space:nowrap;font-weight:700;}
    .mn-dl dd{margin:0;color:#2a2722;font-family:"Iowan Old Style",Georgia,serif;font-size:14.5px;}
    .mn-opts dt{color:#2a2722;}
    .mn-opts dt b{color:#8a2a2a;}
    .mn-see a{color:#8a2a2a;text-decoration:underline;text-underline-offset:3px;margin-right:14px;font-family:"SFMono-Regular",ui-monospace,monospace;font-size:12.5px;}
    .mn-see a:hover{color:#2a2722;}
    .mn-rule{border:0;border-top:1px solid #c9bfa6;margin:14px 0;}
    .mn-foot{border-top:2px double #2a2722;padding:10px 48px;font-family:"SFMono-Regular",ui-monospace,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#6b5a3a;display:flex;justify-content:space-between;}
    .mn-drop::first-letter{font-family:"Iowan Old Style",serif;font-size:62px;line-height:.9;float:left;padding:4px 8px 0 0;color:#8a2a2a;}
    .mn-mono{font-family:"SFMono-Regular",ui-monospace,monospace;font-size:12px;color:#6b5a3a;}
  `;
  return (
    <div className="mn-wrap">
      <style>{css}</style>
      <div className="mn-head"><b>ABDULLAH(1)</b><span>fixpoint.cc manual</span><b>ABDULLAH(1)</b></div>
      <div className="mn-body">
        <div className="mn-col">
          <div className="mn-section">Name</div>
          <h1 className="mn-title">abdullah</h1>
          <div className="mn-subt">— verifier of out-of-order RISC-V</div>

          <div className="mn-section">Synopsis</div>
          <div className="mn-syn">
            <b>abdullah</b> [<i>--lab</i>=<i>MATCHA</i>] [<i>--advisor</i>=<i>…</i>]<br/>
            &nbsp;&nbsp;[<i>--thesis</i>=<i>formal_verif(oo_RISCV)</i>]<br/>
            &nbsp;&nbsp;[<b>--past</b>=<i>Siemens_EDA</i>] [<b>--hire</b>]
          </div>

          <div className="mn-section">Description</div>
          <div className="mn-desc mn-drop">
            Abdullah is an MEng candidate at <em>MIT CSAIL</em> (MATCHA Lab), focused on the formal verification of out-of-order RISC-V processors. Prior to graduate study he worked in <em>R&amp;D at Siemens EDA</em> on solvers and performance in design verification. Research and engineering interests span computer architecture, hardware/software co-design, formal methods, and security.
          </div>

          <div className="mn-section">Education</div>
          <dl className="mn-dl">
            <dt>MIT</dt><dd>B.S. Computer Science &amp; Mathematics</dd>
            <dt>MIT</dt><dd>M.Eng., in progress</dd>
          </dl>
        </div>

        <div className="mn-col">
          <div className="mn-section">Options</div>
          <dl className="mn-dl mn-opts">
            <dt><b>-a</b>, <b>--architecture</b></dt><dd>computer architecture, microarchitecture, ISA design</dd>
            <dt><b>-f</b>, <b>--formal</b></dt><dd>formal methods, proof assistants, model checking</dd>
            <dt><b>-s</b>, <b>--security</b></dt><dd>secure hardware, FIDO/U2F, side channels</dd>
            <dt><b>-c</b>, <b>--codesign</b></dt><dd>hardware/software co-design across the stack</dd>
          </dl>

          <div className="mn-section">Files</div>
          <div className="mn-see">
            <a href="#">~/resume.pdf</a>
            <a href="#">~/projects/u2f</a>
            <a href="#">~/projects/onechan</a>
            <a href="#">~/projects/profemon</a>
          </div>

          <div className="mn-section">Exit Status</div>
          <div style={{fontFamily:"SFMono-Regular,monospace",fontSize:12.5,lineHeight:1.9}}>
            <b>0</b> &nbsp; looking for 2026 full-time roles in architecture &amp; verification.<br/>
            <b>1</b> &nbsp; otherwise, always open to interesting problems.
          </div>

          <div className="mn-section">See also</div>
          <div className="mn-see">
            <a href="#">email(1)</a>
            <a href="#">github(1)</a>
            <a href="#">linkedin(1)</a>
          </div>

          <div className="mn-section">Author</div>
          <div className="mn-mono" style={{fontFamily:"Iowan Old Style,serif",fontSize:14.5,lineHeight:1.65}}>
            Written by <em style={{color:"#8a2a2a",fontStyle:"italic"}}>Abdullah</em>. Report bugs via <span className="mn-mono">email</span>.
          </div>
        </div>
      </div>
      <div className="mn-foot"><span>fixpoint.cc</span><span>2026-04-21</span><span>ABDULLAH(1)</span></div>
    </div>
  );
};
window.ManPage = ManPage;
