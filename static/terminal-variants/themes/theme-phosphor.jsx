// Phosphor CRT — curved glass, heavy bloom, chromatic aberration, scanlines, flicker
const PhosphorCRT = () => {
  const css = `
    .ph-wrap{width:100%;height:100%;background:#0a0400;position:relative;overflow:hidden;font-family:"IBM Plex Mono","SFMono-Regular",Menlo,monospace;}
    .ph-wrap::before{content:"";position:absolute;inset:-4% -6%;border-radius:40% / 22%;background:radial-gradient(ellipse at 50% 40%, #1b0e00 0%, #0a0400 55%, #000 100%);box-shadow:inset 0 0 180px rgba(0,0,0,.95),inset 0 0 60px rgba(255,120,0,.08);pointer-events:none;}
    .ph-screen{position:absolute;inset:44px 56px;border-radius:30% / 18%;overflow:hidden;padding:54px 60px;color:#ffb347;text-shadow:0 0 2px rgba(255,120,0,.85),0 0 8px rgba(255,80,0,.5),0 0 22px rgba(255,60,0,.25);filter:contrast(1.15) saturate(1.1);}
    .ph-screen::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(transparent 0 2px,rgba(0,0,0,.35) 2px 3px);pointer-events:none;mix-blend-mode:multiply;animation:ph-flicker 7s infinite;}
    .ph-screen::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(255,170,40,.14),transparent 60%);pointer-events:none;}
    @keyframes ph-flicker{0%,100%{opacity:1}50%{opacity:.94}52%{opacity:1}54%{opacity:.97}}
    @keyframes ph-sweep{0%{top:-10%}100%{top:110%}}
    .ph-sweep{position:absolute;left:0;right:0;height:40%;background:linear-gradient(180deg,transparent,rgba(255,180,40,.06),transparent);pointer-events:none;animation:ph-sweep 8s linear infinite;}
    .ph-dotted{background-image:radial-gradient(rgba(255,140,0,.09) 1px,transparent 1.5px);background-size:3px 3px;position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;}
    .ph-title{font-size:13px;letter-spacing:.35em;color:#ff9330;opacity:.7;margin-bottom:22px;}
    .ph-name{font-family:"Big Caslon","Didot","Iowan Old Style",serif;font-size:92px;font-weight:400;letter-spacing:-.04em;line-height:.9;margin:0 0 8px;color:#ffd08a;text-shadow:-1px 0 rgba(255,80,80,.6),1px 0 rgba(80,180,255,.5),0 0 20px rgba(255,140,40,.55);}
    .ph-sub{font-size:14px;color:#d68a3a;opacity:.8;margin-bottom:28px;letter-spacing:.02em;}
    .ph-grid{display:grid;grid-template-columns:120px 1fr;gap:6px 22px;font-size:13px;line-height:1.65;}
    .ph-grid dt{color:#ff9330;text-transform:uppercase;letter-spacing:.22em;font-size:11px;padding-top:3px;}
    .ph-grid dd{margin:0;color:#ffd08a;}
    .ph-prompt{margin-top:34px;display:flex;gap:10px;align-items:baseline;font-size:14px;}
    .ph-prompt .p{color:#ff9330;}
    .ph-prompt .c{color:#ffd08a;}
    .ph-caret{display:inline-block;width:9px;height:15px;background:#ffb347;margin-left:2px;box-shadow:0 0 8px #ff9330;animation:ph-blink 1.1s steps(1) infinite;}
    @keyframes ph-blink{50%{opacity:0}}
    .ph-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px;}
    .ph-chips a{border:1px solid rgba(255,140,40,.35);padding:3px 9px;font-size:12px;color:#ffd08a;letter-spacing:.05em;}
    .ph-chips a:hover{background:rgba(255,140,40,.15);}
    .ph-bezel-dot{position:absolute;width:8px;height:8px;border-radius:50%;background:#3a1a00;box-shadow:inset 0 0 2px rgba(0,0,0,.8);}
    .ph-led{position:absolute;bottom:22px;right:78px;display:flex;gap:14px;align-items:center;color:#663000;font-size:9px;letter-spacing:.3em;}
    .ph-led i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#ff7700;box-shadow:0 0 6px #ff7700;}
    .ph-bulge{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,transparent 50%,rgba(0,0,0,.45) 90%);pointer-events:none;}
  `;
  return (
    <div className="ph-wrap">
      <style>{css}</style>
      <div className="ph-bezel-dot" style={{top:22,left:26}}/>
      <div className="ph-bezel-dot" style={{top:22,right:26}}/>
      <div className="ph-bezel-dot" style={{bottom:22,left:26}}/>
      <div className="ph-bezel-dot" style={{bottom:22,right:26}}/>
      <div className="ph-screen">
        <div className="ph-dotted"/>
        <div className="ph-sweep"/>
        <div className="ph-bulge"/>
        <div className="ph-title">★ TEKTRONIX 4014 · fixpoint.cc · READY</div>
        <h1 className="ph-name">abdullah</h1>
        <div className="ph-sub">formal verification · computer architecture · mit csail</div>
        <dl className="ph-grid">
          <dt>role</dt><dd>MEng @ MIT CSAIL (MATCHA Lab) — verifying out-of-order RISC-V</dd>
          <dt>prev</dt><dd>R&D, Siemens EDA</dd>
          <dt>edu</dt><dd>MIT · CS + Math</dd>
          <dt>focus</dt><dd>hw/sw co-design · formal methods · security</dd>
        </dl>
        <div className="ph-chips">
          <a href="#">u2f-security-key</a>
          <a href="#">onechan</a>
          <a href="#">profemon</a>
          <a href="#">resume.pdf</a>
          <a href="#">github</a>
          <a href="#">linkedin</a>
        </div>
        <div className="ph-prompt"><span className="p">&gt;</span><span className="c">_</span><span className="ph-caret"/></div>
      </div>
      <div className="ph-led"><i/>POWER<span style={{width:14}}/><i style={{background:"#c94",boxShadow:"0 0 6px #c94"}}/>LINK</div>
    </div>
  );
};
window.PhosphorCRT = PhosphorCRT;
