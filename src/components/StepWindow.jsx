import React, { useState } from 'react';

export default function StepWindow({ step }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!step) return null;

  const htmlFile = step.htmlFallback;
  const previewUrl = `/${step.htmlFallback}`;
  const notebookUrl = `/${step.file}`;

  return (
    <section className="step-view" aria-labelledby={`step-title-${step.id}`}>
      <header className="step-hero">
        <div>
          <p className="step-kicker">Step {step.id}</p>
          <h2 id={`step-title-${step.id}`} className="step-title">{step.title}</h2>
          <p className="step-description">{step.tagline}</p>
        </div>

        <div className="step-actions">
          <a className="button button--primary" href={notebookUrl} target="_blank" rel="noreferrer">
            Open notebook
          </a>
          <a className="button" href={previewUrl} target="_blank" rel="noreferrer">
            View HTML
          </a>
        </div>
      </header>

      <div className="step-grid">
        <article className="card">
          <h3>What happens here</h3>
          <ul>
            {(step.run || []).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>

        <article className="card">
          <h3>What you get</h3>
          <ul>
            {(step.results || []).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </div>

      <button
        type="button"
        className="details-toggle"
        onClick={() => setShowDetails((v) => !v)}
        aria-expanded={showDetails}
      >
        {showDetails ? 'Hide details' : 'Show explanation'}
      </button>

      {showDetails && (
        <div className="card card--muted">
          <h3>Explanation</h3>
          <ul>
            {(step.explanation || []).map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="presenter-note">{step.presenter}</p>
        </div>
      )}

      <section className="preview card" aria-label="Notebook preview">
        <div className="preview__bar">
          <span className="preview__label">Preview</span>
          <span className="preview__path">{htmlFile}</span>
        </div>
        <iframe
          title={`${step.title} preview`}
          src={previewUrl}
          className="preview__frame"
          loading="lazy"
        />
      </section>
    </section>
  );
}
