import React from 'react';

export default function StepWindow({ step }) {
  if (!step) return null;

  // Always link to the canonical notebook path, never the .ipynb_checkpoints version.
  // GitHub raw links work if the repo is public; for local use, the relative path opens in JupyterLab.
  const notebookHref = step.file;   // e.g. "notebooks/03_forecast_evaluation_and_interpretation.ipynb"

  return (
    <div>
      <div className="step-content__header">
        <p className="step-content__eyebrow">Step {step.id}</p>
        <h2 className="step-content__title">{step.title}</h2>
        <p className="step-content__tagline">{step.tagline}</p>
      </div>

      {step.run?.length > 0 && (
        <div className="step-content__section">
          <p className="step-content__section-label">What this notebook does</p>
          <div className="step-content__card">
            <ul className="step-content__list">
              {step.run.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        </div>
      )}

      {step.results?.length > 0 && (
        <div className="step-content__section">
          <p className="step-content__section-label">Outputs produced</p>
          <div className="step-content__card">
            <ul className="step-content__list">
              {step.results.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        </div>
      )}

      {step.explanation?.length > 0 && (
        <div className="step-content__section">
          <p className="step-content__section-label">Explanation context</p>
          <div className="step-content__card">
            <ul className="step-content__list">
              {step.explanation.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        </div>
      )}

      {step.presenter && (
        <div className="step-content__section">
          <p className="step-content__section-label">Presenter note</p>
          <div className="presenter-note">
            <p>{step.presenter}</p>
          </div>
        </div>
      )}

      <div className="step-content__actions">
        <a
          href={notebookHref}
          className="btn btn--primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open notebook ↗
        </a>
        {step.htmlFallback && (
          <a
            href={`/public/${step.htmlFallback}`}
            className="btn btn--secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Preview HTML export
          </a>
        )}
      </div>
    </div>
  );
}