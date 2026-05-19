import React, { useMemo } from 'react';
import StepWindow from './StepWindow';

export default function NotebookWindow({ steps = [], selectedId, onSelectStep }) {
  const selectedStep = useMemo(
    () => steps.find(s => s.id === selectedId) || steps[0],
    [steps, selectedId]
  );

  if (!steps.length) return <p className="empty-state">No notebooks available.</p>;

  return (
    <div className="notebook-layout">
      <aside className="sidebar" aria-label="Notebook steps">
        <header className="sidebar__header">
          <p className="sidebar__eyebrow">Thesis pipeline</p>
          <h1 className="sidebar__title">Notebook guide</h1>
          <p className="sidebar__subtitle">
            Select a step to preview the notebook and open the source file.
          </p>
        </header>

        <nav className="step-list" aria-label="Steps">
          {steps.map(step => {
            const active = step.id === selectedStep?.id;
            return (
              <button
                key={step.id}
                type="button"
                className={`step-card ${active ? 'step-card--active' : ''}`}
                onClick={() => onSelectStep?.(step.id)}
                aria-current={active ? 'step' : undefined}
              >
                <span className="step-card__id">{step.id}</span>
                <span className="step-card__content">
                  <span className="step-card__title">{step.title}</span>
                  <span className="step-card__tagline">{step.tagline}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="step-content">
        {selectedStep && <StepWindow step={selectedStep} />}
      </main>
    </div>
  );
}