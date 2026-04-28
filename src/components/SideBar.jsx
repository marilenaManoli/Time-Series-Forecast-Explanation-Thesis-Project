export default function Sidebar({ steps, current, onSelect }) {
    return (
      <aside className="sidebar">
        <section className="intro">
          <div className="eyebrow">Master's thesis walkthrough</div>
          <h2>Explaining Forecast Quality and Reliability in Time-Series Forecasting using Computing with Words</h2>
          <p>Each step links to the notebook file directly, with an HTML fallback if you want to preview the notebook through an exported static page.</p>
        </section>
  
        <section className="mini-grid">
          <div className="mini-card"><span>Stages</span><strong>6 notebooks</strong></div>
          <div className="mini-card"><span>Mode</span><strong>Step-by-step demo</strong></div>
        </section>
  
        <nav className="timeline">
          {steps.map((s, i) => (
            <button
              key={s.id}
              className={`timeline-btn ${i === current ? 'active' : ''}`}
              onClick={() => onSelect(i)}
            >
              <small>Step {s.id}</small>
              <strong>{s.title}</strong>
              <p>{s.tagline}</p>
            </button>
          ))}
        </nav>
      </aside>
    );
  }
  