import React, { useState, useEffect } from 'react';
import NotebookWindow from './components/NotebookWindow';
import ForecastDashboard from './components/ForecastDashboard';
import { steps } from './data/steps';
import './styles/app.css';

export default function App() {
  const [view, setView]                     = useState('dashboard');
  const [metrics, setMetrics]               = useState(null);
  const [forecasts, setForecasts]           = useState(null);
  const [narratives, setNarratives]         = useState(null);
  const [fuzzyLabels, setFuzzyLabels]       = useState(null);
  const [loading, setLoading]               = useState(true);
  const [selectedNotebookId, setSelectedNotebookId] = useState(steps?.[0]?.id || null);

  useEffect(() => {
    const load = async () => {
      const tryFetch = async (path) => {
        try {
          const r = await fetch(path);
          if (!r.ok) return null;
          const ct = r.headers.get('content-type') || '';
          if (ct.includes('json')) return r.json();
          const text = await r.text();
          const parseRow = row => {
            const vals = []; let cur = '', inQ = false;
            for (let i = 0; i < row.length; i++) {
              const c = row[i];
              if (c === '"') { inQ = !inQ; }
              else if (c === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
              else { cur += c; }
            }
            vals.push(cur.trim());
            return vals;
          };
          const lines = text.trim().split('\n');
          const headers = parseRow(lines[0]);
          return lines.slice(1).map(line => {
            const vals = parseRow(line);
            return Object.fromEntries(headers.map((h, i) => [h, isNaN(vals[i]) || vals[i] === '' ? vals[i] : parseFloat(vals[i])]));
          });
        } catch { return null; }
      };

      const [m, f, n, fl] = await Promise.all([
        tryFetch('/src/data/metrics_all_models.json'),
        tryFetch('/src/data/forecasts_all_models.json'),
        tryFetch('/src/data/session06_narratives.csv'),
        tryFetch('/src/data/session04_fuzzy_labels.csv'),
      ]);

      setMetrics(m);
      setForecasts(f);
      setNarratives(n);
      setFuzzyLabels(fl);
      setLoading(false);
    };
    load();
  }, []);

  const hasRealData = !!(metrics && metrics.length > 0);

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="topbar__brand">Forecast Explainer</span>
        <div className="topbar__divider" />
        <nav className="topbar__nav">
          <button
            className={`topbar__tab ${view === 'dashboard' ? 'topbar__tab--active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`topbar__tab ${view === 'notebooks' ? 'topbar__tab--active' : ''}`}
            onClick={() => setView('notebooks')}
          >
            Notebooks
          </button>
        </nav>
        <div className="topbar__spacer" />
        <span className="topbar__meta">
          {loading ? 'Loading…' : hasRealData ? `${metrics.length} models · live data` : 'sample data — run notebooks to populate'}
        </span>
      </header>

      <main className="main-panel">
        {view === 'dashboard' && (
          <ForecastDashboard
            metrics={metrics}
            forecasts={forecasts}
            narratives={narratives}
            fuzzyLabels={fuzzyLabels}
            loading={loading}
            onGoToNotebooks={() => setView('notebooks')}
          />
        )}
        {view === 'notebooks' && (
          <NotebookWindow
            steps={steps}
            selectedId={selectedNotebookId}
            onSelectStep={setSelectedNotebookId}
          />
        )}
      </main>
    </div>
  );
}