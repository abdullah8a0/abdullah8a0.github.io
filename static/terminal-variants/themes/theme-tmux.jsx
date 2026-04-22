// tmux split — 4-pane workstation with status bar
const TmuxSplit = () => {
  const css = `
    .tm-wrap{width:100%;height:100%;background:#181a1f;color:#c0c5ce;font-family:"Iosevka","JetBrains Mono","IBM Plex Mono",monospace;font-size:11.5px;line-height:1.55;display:grid;grid-template-rows:1fr 22px;overflow:hidden;}
    .tm-grid{display:grid;grid-template-columns:1.4fr 1fr;grid-template-rows:1fr 1fr;gap:1px;background:#0f1116;}
    .tm-pane{background:#1a1d23;position:relative;overflow:hidden;display:flex;flex-direction:column;}
    .tm-pane.active{box-shadow:inset 0 0 0 1px #7ee787;}
    .tm-pane .hdr{display:flex;justify-content:space-between;padding:4px 10px;background:#11141a;color:#6a7282;font-size:10px;letter-spacing:.18em;text-transform:uppercase;border-bottom:1px solid #0d0f14;}
    .tm-pane.active .hdr{background:#1d3024;color:#7ee787;}
    .tm-pane .body{padding:10px 14px;flex:1;overflow:auto;}
    .tm-p{color:#7ee787;}
    .tm-c{color:#e6edf3;}
    .tm-d{color:#6a7282;}
    .tm-y{color:#f2cc60;}
    .tm-b{color:#79c0ff;}
    .tm-m{color:#d2a8ff;}
    .tm-r{color:#ff7b72;}
    .tm-caret{display:inline-block;width:7px;height:13px;background:#7ee787;vertical-align:-2px;animation:tmb 1s steps(1) infinite;}
    @keyframes tmb{50%{opacity:0}}
    .tm-status{display:flex;align-items:center;background:#111318;color:#7ee787;font-size:10.5px;letter-spacing:.1em;padding:0;}
    .tm-status .sess{background:#7ee787;color:#11141a;padding:0 12px;height:22px;line-height:22px;font-weight:700;clip-path:polygon(0 0,100% 0,calc(100% - 10px) 100%,0 100%);}
    .tm-status .win{padding:0 14px;color:#c0c5ce;}
    .tm-status .win.cur{background:#1d3024;color:#7ee787;font-weight:600;}
    .tm-status .spacer{flex:1;}
    .tm-status .right{padding:0 14px;color:#8a95a3;}
    .tm-a{color:#79c0ff;text-decoration:underline;text-underline-offset:3px;}
    .tm-a:hover{color:#7ee787;}
    .tm-nf{display:grid;grid-template-columns:max-content 1fr;column-gap:14px;row-gap:1px;font-size:11.5px;}
    .tm-nf dt{color:#7ee787;font-weight:700;}
    .tm-nf dd{margin:0;color:#e6edf3;}
    .tm-ascii{color:#f2cc60;white-space:pre;line-height:1.1;font-size:10px;margin-bottom:10px;}
    .tm-list div{display:grid;grid-template-columns:18px 1fr auto;gap:10px;}
    .tm-list div:hover{background:#202530;}
    .tm-list .n{color:#6a7282;text-align:right;}
    .tm-list .name{color:#79c0ff;}
    .tm-list .meta{color:#6a7282;}
    .tm-msg{color:#e6edf3;}
    .tm-label{color:#6a7282;text-transform:uppercase;letter-spacing:.18em;font-size:9.5px;margin-top:10px;margin-bottom:4px;display:block;}
  `;
  return (
    <div className="tm-wrap">
      <style>{css}</style>
      <div className="tm-grid">
        <div className="tm-pane active">
          <div className="hdr"><span>0 · whoami</span><span>zsh</span></div>
          <div className="body">
            <div><span className="tm-p">~</span><span className="tm-d"> $ </span><span className="tm-c">whoami --long</span></div>
            <div className="tm-ascii">{`  _     _     _      _ _       _
 | |   | |   | |    | | |     | |
 | |___| |__ | |_   | | | __ _| |__
 |____|_.__/ \\__|  |_|_|/ _\` |_.__/
                       \\__,_|
`}</div>
            <dl className="tm-nf">
              <dt>name</dt><dd>Abdullah</dd>
              <dt>shell</dt><dd>MEng · MIT CSAIL · <span className="tm-m">MATCHA Lab</span></dd>
              <dt>thesis</dt><dd>formal verif of <span className="tm-r">out-of-order RISC-V</span></dd>
              <dt>prev</dt><dd>R&amp;D · <span className="tm-y">Siemens EDA</span></dd>
              <dt>edu</dt><dd>MIT · CS + Math</dd>
              <dt>likes</dt><dd>arch · hw/sw · formal · sec</dd>
            </dl>
            <div style={{marginTop:12}}><span className="tm-p">~</span><span className="tm-d"> $ </span><span className="tm-caret"/></div>
          </div>
        </div>

        <div className="tm-pane">
          <div className="hdr"><span>1 · projects</span><span>ls -la</span></div>
          <div className="body tm-list">
            <div><span className="tm-d">1</span><span><span className="tm-y">drwxr-xr-x</span> <span className="name">u2f-security-key</span></span><span className="meta">fido · hw</span></div>
            <div><span className="tm-d">2</span><span><span className="tm-y">drwxr-xr-x</span> <span className="name">onechan</span></span><span className="meta">fpga chess</span></div>
            <div><span className="tm-d">3</span><span><span className="tm-y">drwxr-xr-x</span> <span className="name">profemon</span></span><span className="meta">esp32 pvp</span></div>
            <div><span className="tm-d">4</span><span><span className="tm-y">-rw-r--r--</span> <span className="tm-c">resume.pdf</span></span><span className="meta">2026-04</span></div>
            <span className="tm-label">— links</span>
            <div><span className="tm-d">5</span><span><a className="tm-a" href="#">github</a></span><span className="meta">abdullah8a0</span></div>
            <div><span className="tm-d">6</span><span><a className="tm-a" href="#">linkedin</a></span><span className="meta">abdula1</span></div>
            <div><span className="tm-d">7</span><span><a className="tm-a" href="#">email</a></span><span className="meta">↗</span></div>
          </div>
        </div>

        <div className="tm-pane">
          <div className="hdr"><span>2 · neofetch</span><span>sys</span></div>
          <div className="body">
            <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:20}}>
              <pre style={{color:"#7ee787",fontSize:10,lineHeight:1.05,margin:0}}>{`  .--""""--.
 /  /\\  /\\  \\
 | o \\/  \\/ o|
 |    ><    |
 | \\______/ |
  \\        /
   '------'
   /|  |\\
  / |  | \\`}</pre>
              <dl className="tm-nf" style={{alignSelf:"start"}}>
                <dt>OS</dt><dd>fixpoint.cc</dd>
                <dt>host</dt><dd>MIT CSAIL</dd>
                <dt>kernel</dt><dd>Hugo 0.139</dd>
                <dt>shell</dt><dd>terminal.js</dd>
                <dt>wm</dt><dd>tmux 3.4</dd>
                <dt>theme</dt><dd>gruvbox-night</dd>
                <dt>uptime</dt><dd>29y · 0d</dd>
                <dt>pkgs</dt><dd>∞ (coq, lean, chisel)</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="tm-pane">
          <div className="hdr"><span>3 · htop</span><span>top</span></div>
          <div className="body">
            <div className="tm-d" style={{marginBottom:6}}>PID  USER      STATE   %CPU  COMMAND</div>
            <div><span className="tm-d">1721</span> <span className="tm-c">abdullah</span>  <span className="tm-y">R+</span>    <span className="tm-r">98.4</span> <span className="tm-c">prove oo_riscv.coq</span></div>
            <div><span className="tm-d">1812</span> <span className="tm-c">abdullah</span>  <span className="tm-y">S</span>     <span className="tm-y">42.1</span> <span className="tm-c">tape-out-sim fpga/onechan</span></div>
            <div><span className="tm-d">1904</span> <span className="tm-c">abdullah</span>  <span className="tm-y">R</span>     <span className="tm-y">18.0</span> <span className="tm-c">read papers/arxiv</span></div>
            <div><span className="tm-d">2033</span> <span className="tm-c">abdullah</span>  <span className="tm-d">Z</span>      <span className="tm-d">0.0</span> <span className="tm-d">&lt;sleep 6h&gt;</span></div>
            <div style={{marginTop:10}} className="tm-d">mem used 11.4G/32G  · load 2.1 1.8 1.6</div>
            <div style={{marginTop:12}}><span className="tm-label">hiring window</span></div>
            <div className="tm-msg">Looking for 2026 roles in <span className="tm-m">architecture</span> & <span className="tm-m">verification</span>. <a className="tm-a" href="#">open email ↗</a></div>
          </div>
        </div>
      </div>
      <div className="tm-status">
        <span className="sess">abdullah@fixpoint</span>
        <span className="win cur">&nbsp; 0:whoami* &nbsp;</span>
        <span className="win">1:proj</span>
        <span className="win">2:neo</span>
        <span className="win">3:htop</span>
        <span className="spacer"/>
        <span className="right">[2.1 1.8 1.6]  Mon 21 Apr 21:37</span>
      </div>
    </div>
  );
};
window.TmuxSplit = TmuxSplit;
