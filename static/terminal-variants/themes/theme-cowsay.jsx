// Cowsay ANSI — figlet banner, lolcat rainbow, cow, xterm-256 palette
const CowsayANSI = () => {
  // Generate rainbow color per character for lolcat effect
  const rainbow = (text, offset = 0, freq = 0.22) => {
    const chars = [...text];
    return chars.map((ch, i) => {
      const h = (i + offset) * freq * 57;
      return <span key={i} style={{color:`hsl(${h % 360}, 100%, 62%)`,textShadow:`0 0 6px hsl(${h%360},100%,50%)`}}>{ch}</span>;
    });
  };
  const css = `
    .co-wrap{width:100%;height:100%;background:#0b0b10;color:#c9d1d9;font-family:"IBM Plex Mono","SFMono-Regular",Menlo,monospace;font-size:12.5px;line-height:1.3;padding:28px 34px;overflow:auto;white-space:pre;}
    .co-wrap::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 2px,rgba(255,255,255,.02) 2px 4px);pointer-events:none;}
    .co-dim{color:#6e7681;}
    .co-yel{color:#f2cc60;}
    .co-cyn{color:#76e4f7;}
    .co-mag{color:#e090d0;}
    .co-grn{color:#7ee787;}
    .co-red{color:#ff7b72;}
    .co-box{border-left:2px solid #7ee787;padding-left:12px;margin:14px 0;}
    .co-banner{font-size:10.5px;line-height:1.05;letter-spacing:0;}
    .co-chips a{display:inline-block;padding:2px 8px;margin:3px 6px 3px 0;border:1px solid rgba(126,231,135,.3);color:#c9d1d9;}
    .co-chips a:hover{background:rgba(126,231,135,.1);border-color:#7ee787;}
  `;
  const banner = [
    "  ▄▄▄       ▄▄▄▄    ▓█████▄  █    ██  ██▓     ██▓    ▄▄▄       ██░ ██ ",
    " ▒████▄    ▓█████▄  ▒██▀ ██▌ ██  ▓██▒▓██▒    ▓██▒   ▒████▄    ▓██░ ██▒",
    " ▒██  ▀█▄  ▒██▒ ▄██ ░██   █▌▓██  ▒██░▒██░    ▒██░   ▒██  ▀█▄  ▒██▀▀██░",
    " ░██▄▄▄▄██ ▒██░█▀   ░▓█▄   ▌▓▓█  ░██░▒██░    ▒██░   ░██▄▄▄▄██ ░▓█ ░██ ",
    "  ▓█   ▓██▒░▓█  ▀█▓ ░▒████▓ ▒▒█████▓ ░██████▒░██████▒▓█   ▓██▒░▓█▒░██▓",
    "  ▒▒   ▓▒█░░▒▓███▀▒  ▒▒▓  ▒ ░▒▓▒ ▒ ▒ ░ ▒░▓  ░░ ▒░▓  ░▒▒   ▓▒█░ ▒ ░░▒░▒",
  ];
  return (
    <div className="co-wrap">
      <style>{css}</style>
{`user@fixpoint`}<span className="co-dim">:~$ </span><span className="co-grn">figlet -f ansi-shadow abdullah | lolcat</span>{`\n`}
      <div className="co-banner">
        {banner.map((line, i) => <div key={i}>{rainbow(line, i*2)}</div>)}
      </div>
{`\n`}<span className="co-dim">user@fixpoint:~$ </span><span className="co-grn">fortune | cowsay -f tux</span>{`\n`}
 <span className="co-dim">{" "+"_".repeat(58)}</span>{`\n`}
<span className="co-dim">/</span> &quot;Without formal verification, an out-of-order core is just    <span className="co-dim">\\</span>{`\n`}
<span className="co-dim">\\</span>  a very fast pile of hypotheses.&quot;  — me, probably        <span className="co-dim">/</span>{`\n`}
 <span className="co-dim">{" "+"-".repeat(58)}</span>{`\n`}
{`   \\\n    \\\n`}
<span className="co-yel">{`        .--.\n`}</span>
<span className="co-yel">{`       |o_o |\n`}</span>
<span className="co-yel">{`       |:_/ |\n`}</span>
<span className="co-yel">{`      //   \\ \\\n`}</span>
<span className="co-yel">{`     (|     | )\n`}</span>
<span className="co-yel">{`    /'\\_   _/\`\\\n`}</span>
<span className="co-yel">{`    \\___)=(___/\n\n`}</span>
<span className="co-dim">user@fixpoint:~$ </span><span className="co-grn">neofetch --whoami</span>{`\n\n`}
<span className="co-cyn">       name</span>  <span>Abdullah</span>{`\n`}
<span className="co-cyn">       role</span>  MEng · MIT CSAIL · <span className="co-mag">MATCHA Lab</span>{`\n`}
<span className="co-cyn">     thesis</span>  formal verification of <span className="co-red">out-of-order RISC-V</span>{`\n`}
<span className="co-cyn">      prior</span>  R&amp;D · <span className="co-yel">Siemens EDA</span>{`\n`}
<span className="co-cyn">        edu</span>  MIT · CS + Math{`\n`}
<span className="co-cyn">  interests</span>  arch · hw/sw co-design · formal methods · sec{`\n\n`}
<span className="co-dim">user@fixpoint:~$ </span><span className="co-grn">ls -1 projects/</span>{`\n`}
      <div className="co-chips">
        <a href="#"><span className="co-grn">■</span> u2f-security-key</a>
        <a href="#"><span className="co-grn">■</span> onechan</a>
        <a href="#"><span className="co-grn">■</span> profemon</a>
{`\n`}      </div>
<span className="co-dim">user@fixpoint:~$ </span><span className="co-grn">open links/</span>{`\n`}
      <div className="co-chips">
        <a href="#"><span className="co-cyn">↗</span> resume.pdf</a>
        <a href="#"><span className="co-cyn">↗</span> email</a>
        <a href="#"><span className="co-cyn">↗</span> github</a>
        <a href="#"><span className="co-cyn">↗</span> linkedin</a>
      </div>
{`\n`}<span className="co-dim">user@fixpoint:~$ </span><span style={{display:"inline-block",width:9,height:15,background:"#7ee787",verticalAlign:"-2px",animation:"co-blk 1s steps(1) infinite"}}/>
      <style>{`@keyframes co-blk{50%{opacity:0}}`}</style>
    </div>
  );
};
window.CowsayANSI = CowsayANSI;
