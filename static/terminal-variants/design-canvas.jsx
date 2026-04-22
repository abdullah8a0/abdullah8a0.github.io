// design-canvas.jsx — minimal scaffolding for showcasing theme artboards.
// Provides three primitive components used by the variants preview:
//   <DesignCanvas>   outer page shell (background, padding)
//   <DCSection>      titled/subtitled group of artboards
//   <DCArtboard>     fixed-size framed device that renders a theme

const DC_CSS = `
  .dc-canvas{
    min-height:100%;
    padding:48px 40px 96px;
    color:#2a2722;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  }
  .dc-section{max-width:1200px;margin:0 auto 64px;}
  .dc-section + .dc-section{margin-top:72px;}
  .dc-section-head{
    display:flex;align-items:baseline;gap:18px;flex-wrap:wrap;
    border-bottom:1px solid #c9bfa6;padding-bottom:14px;margin-bottom:32px;
  }
  .dc-section-title{
    font-family:"Iowan Old Style",Georgia,serif;
    font-size:28px;font-weight:500;margin:0;letter-spacing:-0.01em;
  }
  .dc-section-sub{
    font-size:14px;line-height:1.55;color:#6b5a3a;max-width:680px;margin:0;
  }
  .dc-grid{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(560px,1fr));
    gap:36px 32px;
  }
  .dc-artboard{
    display:flex;flex-direction:column;gap:10px;min-width:0;
  }
  .dc-ab-label{
    font-family:"SFMono-Regular",ui-monospace,Menlo,monospace;
    font-size:11px;letter-spacing:0.22em;text-transform:uppercase;
    color:#6b5a3a;
    display:flex;justify-content:space-between;align-items:baseline;
  }
  .dc-ab-dim{opacity:0.55;}
  .dc-ab-frame{
    position:relative;width:100%;aspect-ratio:var(--ar,1100 / 700);
    background:#000;
    border:1px solid #2a2722;
    box-shadow:0 14px 40px rgba(0,0,0,0.22),0 2px 0 #2a2722;
    overflow:hidden;border-radius:2px;
  }
  .dc-ab-frame > *{position:absolute;inset:0;}
  .dc-variants-jump{
    display:flex;gap:12px;flex-wrap:wrap;margin-left:auto;
    font-family:"SFMono-Regular",ui-monospace,Menlo,monospace;font-size:12px;
  }
  .dc-variants-jump a{color:#8a2a2a;text-decoration:none;border-bottom:1px dotted #c9bfa6;}
  .dc-variants-jump a:hover{border-bottom-color:#8a2a2a;}
`;

const DesignCanvas = ({children}) => (
  <div className="dc-canvas">
    <style>{DC_CSS}</style>
    {children}
  </div>
);

const DCSection = ({id, title, subtitle, children}) => {
  const artboards = React.Children.toArray(children);
  return (
    <section id={id} className="dc-section">
      <header className="dc-section-head">
        <h2 className="dc-section-title">{title}</h2>
        {subtitle && <p className="dc-section-sub">{subtitle}</p>}
        <nav className="dc-variants-jump" aria-label="jump to variant">
          {artboards.map(ab => (
            <a key={ab.props.id} href={`#${ab.props.id}`}>{ab.props.label || ab.props.id}</a>
          ))}
        </nav>
      </header>
      <div className="dc-grid">{artboards}</div>
    </section>
  );
};

const DCArtboard = ({id, label, width = 1100, height = 700, children}) => (
  <article id={id} className="dc-artboard">
    <div className="dc-ab-label">
      <span>{label || id}</span>
      <span className="dc-ab-dim">{width}×{height}</span>
    </div>
    <div className="dc-ab-frame" style={{"--ar": `${width} / ${height}`}}>
      {children}
    </div>
  </article>
);

window.DesignCanvas = DesignCanvas;
window.DCSection = DCSection;
window.DCArtboard = DCArtboard;
