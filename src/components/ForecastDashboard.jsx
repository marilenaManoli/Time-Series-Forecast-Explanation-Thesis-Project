import { useState, useMemo } from 'react';

// ── Computing with Words — fuzzy linguistic labels ─────────────────────────
function cww(value, thresholds, labels) {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return labels[i];
  }
  return labels[labels.length - 1];
}
const mapeLabel = v => cww(v, [1, 2, 4, 8], ['excellent', 'good', 'acceptable', 'poor', 'very poor']);
const daLabel   = v => cww(v, [50, 60, 70, 80], ['random', 'low', 'moderate', 'high', 'very high']);
function biasLabel(mpe) {
  if (Math.abs(mpe) < 1) return { text: 'unbiased', dir: 'neutral' };
  return mpe > 0
    ? { text: mpe > 5 ? 'strongly over-forecasts' : 'slightly over-forecasts', dir: 'over' }
    : { text: Math.abs(mpe) > 5 ? 'strongly under-forecasts' : 'slightly under-forecasts', dir: 'under' };
}

// ── Design tokens ──────────────────────────────────────────────────────────
const PALETTE = {
  'Naive':             '#7F77DD',
  'Seasonal Naive':    '#1D9E75',
  'Linear Regression': '#BA7517',
  'ETS':               '#D85A30',
  'HWES (damped)':     '#185FA5',
  'SARIMA':            '#D4537E',
  'Prophet':           '#639922',
};
const fallbackColor = i => ['#7F77DD','#1D9E75','#BA7517','#D85A30','#185FA5','#D4537E','#639922'][i % 7];

const QUALITY = {
  excellent:   { bg: '#EAF3DE', text: '#3B6D11', border: '#639922' },
  good:        { bg: '#E1F5EE', text: '#0F6E56', border: '#1D9E75' },
  acceptable:  { bg: '#FAEEDA', text: '#854F0B', border: '#BA7517' },
  poor:        { bg: '#FAECE7', text: '#993C1D', border: '#D85A30' },
  'very poor': { bg: '#FCEBEB', text: '#A32D2D', border: '#E24B4A' },
};
const BIAS = {
  neutral: { bg: '#E1F5EE', text: '#0F6E56', border: '#1D9E75' },
  over:    { bg: '#FAECE7', text: '#993C1D', border: '#D85A30' },
  under:   { bg: '#E6F1FB', text: '#185FA5', border: '#378ADD' },
};

// ── Metric explanations ─────────────────────────────────────────────────────
const EXPLANATIONS = {
  MAE:  { name: 'MAE — Mean Absolute Error',             body: 'The average absolute gap between predicted and actual values. If MAE = 185 MW, the model typically misses by 185 MW. Lower is better. Easy to communicate to non-experts.',       formula: '|actual − predicted| averaged', unit: 'Same unit as data', caution: 'Does not penalise large errors more than small ones.' },
  RMSE: { name: 'RMSE — Root Mean Squared Error',        body: 'Like MAE but squares errors first, so occasional large errors are punished more. A much higher RMSE than MAE signals infrequent but bad predictions.',                               formula: '√(mean of squared errors)', unit: 'Same unit as data', caution: 'Harder to interpret; dominated by outlier errors.' },
  MAPE: { name: 'MAPE — Mean Absolute Percentage Error', body: 'Error expressed as a percentage of the actual value. Makes comparison across models and datasets easier. Under 1% is excellent; above 5% is poor for energy forecasting.',         formula: 'mean(|actual − predicted| / actual) × 100', unit: '%', caution: 'Asymmetric and unreliable when actual values are near zero.' },
  MPE:  { name: 'MPE — Mean Percentage Error (bias)',    body: 'The signed version of MAPE. Positive = model tends to predict too high (over-forecast); negative = predicts too low. Near zero means no systematic bias. This is your bias detector.', formula: 'mean((actual − predicted) / actual) × 100', unit: '%', caution: 'Positive and negative errors cancel, hiding some problems.' },
  DA:   { name: 'DA — Directional Accuracy',             body: 'Percentage of steps where the model correctly predicted whether demand would go up or down, regardless of magnitude. 50% = no better than a coin flip. Relevant for operational scheduling.', formula: '% steps where sign(Δactual) = sign(Δpredicted)', unit: '%', caution: 'Ignores magnitude entirely — a tiny correct step counts the same as a large one.' },
};

// ── Small helpers ───────────────────────────────────────────────────────────
function Badge({ label, colorMap }) {
  const c = colorMap?.[label] || { bg: '#F1EFE8', text: '#5F5E5A', border: '#B4B2A9' };
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: '2px 9px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function Bar({ value, max, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 7, background: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.35s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, minWidth: 50, textAlign: 'right', color: '#1a1a18' }}>{value}</span>
    </div>
  );
}

function SortBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? '#1a1a18' : '#ffffff',
      color: active ? '#ffffff' : '#73726c',
      border: `0.5px solid ${active ? '#1a1a18' : 'rgba(0,0,0,0.15)'}`,
      borderRadius: 6, padding: '4px 11px', fontSize: 12, cursor: 'pointer', fontWeight: active ? 500 : 400, fontFamily: 'inherit',
    }}>{label}</button>
  );
}

function MetricInfo({ metricKey, onClose }) {
  const info = EXPLANATIONS[metricKey];
  if (!info) return null;
  return (
    <div style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '1.1rem 1.25rem', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a18' }}>{info.name}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888780', padding: 0, lineHeight: 1 }}>×</button>
      </div>
      <p style={{ fontSize: 13, color: '#3d3d3a', lineHeight: 1.6, marginBottom: 10 }}>{info.body}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[['Formula', info.formula], ['Unit', info.unit], ['Watch out', info.caution]].map(([k, v]) => (
          <div key={k} style={{ background: '#f5f4ef', borderRadius: 7, padding: '8px 10px' }}>
            <p style={{ margin: '0 0 2px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600 }}>{k}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#3d3d3a', lineHeight: 1.4 }}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ loading, onGoToNotebooks }) {
  return (
    <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#888780' }}>
      {loading
        ? <p style={{ fontSize: 14 }}>Loading pipeline data…</p>
        : <>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#1a1a18', marginBottom: 8 }}>No data yet</p>
            <p style={{ fontSize: 13, marginBottom: 16 }}>Run notebooks 02 and 03 to generate metrics and forecast outputs.</p>
            {onGoToNotebooks && (
              <button onClick={onGoToNotebooks} style={{ fontSize: 13, color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                Go to Notebooks →
              </button>
            )}
          </>
      }
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ForecastDashboard({ metrics, forecasts, narratives, fuzzyLabels, loading, onGoToNotebooks }) {
  const [tab, setTab]                       = useState('metrics');  // metrics | explanations | narratives
  const [sortBy, setSortBy]                 = useState('MAE');
  const [activeMetricInfo, setActiveMetricInfo] = useState(null);
  const [selectedModel, setSelectedModel]   = useState(null);

  const hasMetrics = metrics && metrics.length > 0;

  // Enrich metrics with CwW labels (prefer real fuzzy label data if available)
  const enriched = useMemo(() => {
    if (!hasMetrics) return [];
    return metrics.map((m, i) => {
      // Try to find matching fuzzy label row from session04 CSV
      const fl = fuzzyLabels?.find(r => r.model === m.model || r.Model === m.model);
      return {
        ...m,
        color: PALETTE[m.model] || fallbackColor(i),
        mapeLabel: fl?.mape_label || fl?.MAPE_label || mapeLabel(m.MAPE),
        biasInfo:  biasLabel(m.MPE),
        daLabel:   fl?.da_label   || fl?.DA_label   || daLabel(m.DA),
      };
    });
  }, [metrics, fuzzyLabels]);

  const sorted = useMemo(() => {
    const asc = ['MAE', 'RMSE', 'MAPE'].includes(sortBy);
    return [...enriched].sort((a, b) => asc ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]);
  }, [enriched, sortBy]);

  const maxMAE  = Math.max(...(sorted.map(d => d.MAE)),  1);
  const maxRMSE = Math.max(...(sorted.map(d => d.RMSE)), 1);

  const selected     = selectedModel ? sorted.find(d => d.model === selectedModel) : null;
  const selForecasts = useMemo(() => forecasts?.filter(f => f.model === selectedModel).slice(0, 30) || [], [forecasts, selectedModel]);

  // Narrative for selected model from session06 CSV
  const selNarrative = useMemo(() => {
    if (!narratives || !selectedModel) return null;
    return narratives.find(r => r.model === selectedModel || r.Model === selectedModel);
  }, [narratives, selectedModel]);

  const TABS = [
    { id: 'metrics',      label: 'Metrics & quality' },
    { id: 'explanations', label: 'Linguistic explanations' },
    { id: 'narratives',   label: 'Narratives' },
  ];

  return (
    <div className="dashboard-view">
      <div className="dashboard-view__inner">

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a18', marginBottom: 4 }}>Forecast quality dashboard</h1>
          <p style={{ fontSize: 13, color: '#888780' }}>
            {hasMetrics
              ? `${metrics.length} models · sorted by ${sortBy} · click a row to inspect`
              : loading ? 'Loading…' : 'No pipeline data found'}
            {!hasMetrics && !loading && onGoToNotebooks && (
              <button onClick={onGoToNotebooks} style={{ marginLeft: 10, fontSize: 13, color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                Go to Notebooks →
              </button>
            )}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '0.5px solid rgba(0,0,0,0.1)', marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              padding: '8px 14px 9px', fontSize: 13,
              color: tab === t.id ? '#1a1a18' : '#888780',
              fontWeight: tab === t.id ? 500 : 400,
              borderBottom: tab === t.id ? '2px solid #1a1a18' : '2px solid transparent',
              marginBottom: -1, transition: 'color 0.1s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── TAB: METRICS ── */}
        {tab === 'metrics' && (
          <>
            {!hasMetrics
              ? <EmptyState loading={loading} onGoToNotebooks={onGoToNotebooks} />
              : <>
                  {/* Sort pills */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#888780' }}>sort by:</span>
                    {['MAE', 'RMSE', 'MAPE', 'MPE', 'DA'].map(m => (
                      <SortBtn key={m} label={m} active={sortBy === m} onClick={() => { setSortBy(m); setActiveMetricInfo(m); }} />
                    ))}
                  </div>

                  {/* Metric info panel */}
                  {activeMetricInfo && <MetricInfo metricKey={activeMetricInfo} onClose={() => setActiveMetricInfo(null)} />}

                  {/* Table */}
                  <div style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#f9f8f4' }}>
                            {[
                              { h: 'Model',       k: null },
                              { h: 'MAE ↓',       k: 'MAE' },
                              { h: 'RMSE ↓',      k: 'RMSE' },
                              { h: 'MAPE ↓',      k: 'MAPE' },
                              { h: 'MPE (bias)',   k: 'MPE' },
                              { h: 'DA ↑',        k: 'DA' },
                              { h: 'Quality',     k: null },
                              { h: 'Bias',        k: null },
                            ].map(({ h, k }, i) => (
                              <th key={h}
                                onClick={() => k && setActiveMetricInfo(k)}
                                title={k ? `Click to learn about ${k}` : ''}
                                style={{ padding: '9px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 11, fontWeight: 600, color: '#73726c', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: k ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none' }}
                              >
                                {h}{k && <span style={{ marginLeft: 2, opacity: 0.5, fontSize: 10 }}>?</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((row, idx) => {
                            const isSel = selectedModel === row.model;
                            return (
                              <tr key={row.model}
                                onClick={() => setSelectedModel(isSel ? null : row.model)}
                                style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)', background: isSel ? '#f5f4ef' : 'transparent', cursor: 'pointer' }}
                              >
                                <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                                    {idx === 0 && <span style={{ fontSize: 10, background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #639922', borderRadius: 4, padding: '1px 6px', marginRight: 2 }}>best</span>}
                                    {row.model}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.MAE}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.RMSE}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.MAPE}%</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: row.MPE > 1 ? '#D85A30' : row.MPE < -1 ? '#185FA5' : '#73726c' }}>
                                  {row.MPE > 0 ? '+' : ''}{row.MPE}%
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.DA}%</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}><Badge label={row.mapeLabel} colorMap={QUALITY} /></td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}><Badge label={row.biasInfo.text} colorMap={BIAS} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Selected model detail */}
                  {selected && (
                    <div style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1.25rem', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: selected.color }} />
                        <span style={{ fontWeight: 600, fontSize: 15, color: '#1a1a18' }}>{selected.model}</span>
                      </div>

                      {/* Metric cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 14 }}>
                        {[
                          { label: 'Accuracy (MAPE)',    value: `${selected.MAPE}%`,                                  note: 'avg % error' },
                          { label: 'Typical error (MAE)', value: selected.MAE,                                         note: 'avg absolute miss' },
                          { label: 'Worst-case (RMSE)',   value: selected.RMSE,                                        note: `${((selected.RMSE / selected.MAE - 1) * 100).toFixed(0)}% worse than MAE` },
                          { label: 'Bias (MPE)',          value: `${selected.MPE > 0 ? '+' : ''}${selected.MPE}%`,   note: selected.biasInfo.text },
                          { label: 'Direction',           value: `${selected.DA}%`,                                   note: `${selected.daLabel} accuracy` },
                        ].map(({ label, value, note }) => (
                          <div key={label} style={{ background: '#f5f4ef', borderRadius: 8, padding: '10px 12px' }}>
                            <p style={{ margin: '0 0 2px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600 }}>{label}</p>
                            <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 600, color: '#1a1a18' }}>{value}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#888780' }}>{note}</p>
                          </div>
                        ))}
                      </div>

                      {/* Bar comparison */}
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600, marginBottom: 8 }}>Error magnitude (relative to worst model)</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div>
                            <p style={{ fontSize: 11, color: '#888780', marginBottom: 3 }}>MAE</p>
                            <Bar value={selected.MAE} max={maxMAE} color={selected.color} />
                          </div>
                          <div>
                            <p style={{ fontSize: 11, color: '#888780', marginBottom: 3 }}>RMSE</p>
                            <Bar value={selected.RMSE} max={maxRMSE} color={selected.color} />
                          </div>
                        </div>
                      </div>

                      {/* Sparkline */}
                      {selForecasts.length > 0 && (() => {
                        const vals = selForecasts.flatMap(f => [+f.actual, +f.predicted]);
                        const mn = Math.min(...vals), mx = Math.max(...vals);
                        const ys = v => 4 + (1 - (v - mn) / (mx - mn || 1)) * 44;
                        const pts = key => selForecasts.map((f, i) => `${i * 18 + 9},${ys(+f[key])}`).join(' ');
                        return (
                          <div style={{ marginTop: 4 }}>
                            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600, marginBottom: 8 }}>Forecast vs actual — last {selForecasts.length} days</p>
                            <svg width="100%" viewBox={`0 0 ${selForecasts.length * 18} 56`} style={{ display: 'block', marginBottom: 6 }}>
                              <polyline points={pts('actual')}    fill="none" stroke="#b4b2a9" strokeWidth="1.5" strokeLinejoin="round" />
                              <polyline points={pts('predicted')} fill="none" stroke={selected.color} strokeWidth="1.5" strokeLinejoin="round" />
                            </svg>
                            <div style={{ display: 'flex', gap: 14 }}>
                              {[['actual', '#b4b2a9'], ['predicted', selected.color]].map(([label, color]) => (
                                <span key={label} style={{ fontSize: 11, color, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ width: 14, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />{label}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Legend */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, borderTop: '0.5px solid rgba(0,0,0,0.08)', paddingTop: 14 }}>
                    <div>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600, marginBottom: 6 }}>Quality (MAPE)</p>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {Object.entries(QUALITY).map(([l, c]) => <span key={l} style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 5, padding: '2px 8px', fontSize: 11 }}>{l}</span>)}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600, marginBottom: 6 }}>Bias (MPE)</p>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {Object.entries(BIAS).map(([l, c]) => <span key={l} style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 5, padding: '2px 8px', fontSize: 11 }}>{l === 'over' ? 'over → too high' : l === 'under' ? 'under → too low' : l}</span>)}
                      </div>
                    </div>
                  </div>
                </>
            }
          </>
        )}

        {/* ── TAB: LINGUISTIC EXPLANATIONS (CwW structured output from nb05) ── */}
        {tab === 'explanations' && (
          <>
            {!hasMetrics
              ? <EmptyState loading={loading} onGoToNotebooks={onGoToNotebooks} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 13, color: '#73726c', marginBottom: 4 }}>
                    Each model's forecast quality translated into structured linguistic statements using Computing with Words (notebook 04–05).
                  </p>
                  {sorted.map(row => {
                    const bias = row.biasInfo;
                    const narRow = narratives?.find(r => (r.model || r.Model) === row.model);
                    const structuredExp = narRow?.Structured_Explanation || narRow?.structured_explanation;
                    return (
                      <div key={row.model} style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.color }} />
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a18' }}>{row.model}</span>
                          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                            <Badge label={row.mapeLabel} colorMap={QUALITY} />
                            <Badge label={bias.text} colorMap={BIAS} />
                          </span>
                        </div>
                        {structuredExp
                          ? <p style={{ fontSize: 13, color: '#3d3d3a', lineHeight: 1.6 }}>{structuredExp}</p>
                          : <p style={{ fontSize: 13, color: '#3d3d3a', lineHeight: 1.6 }}>
                              Accuracy is <strong>{row.mapeLabel}</strong> (MAPE = {row.MAPE}%).
                              Typical error is <strong>{row.MAE} units</strong> (MAE).
                              The model {bias.text}{Math.abs(row.MPE) < 1 ? ', with no consistent direction of error' : ` by ${Math.abs(row.MPE).toFixed(1)}% on average`}.
                              Directional accuracy is <strong>{row.daLabel}</strong> ({row.DA}%).
                              {row.RMSE / row.MAE > 1.5 ? ' Large outlier errors present (RMSE ≫ MAE).' : ' No extreme outlier errors detected.'}
                            </p>
                        }
                      </div>
                    );
                  })}
                </div>
            }
          </>
        )}

        {/* ── TAB: NARRATIVES (session06 output) ── */}
        {tab === 'narratives' && (
          <>
            {!hasMetrics
              ? <EmptyState loading={loading} onGoToNotebooks={onGoToNotebooks} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 13, color: '#73726c', marginBottom: 4 }}>
                    Human-readable narrative summaries generated by the narrative layer (notebook 06).
                    {!narratives && <span style={{ color: '#854f0b' }}> Run notebook 06 to populate this tab.</span>}
                  </p>
                  {sorted.map(row => {
                    const narRow = narratives?.find(r => (r.model || r.Model) === row.model);
                    const narrative = narRow?.narrative || narRow?.Narrative || narRow?.text || narRow?.Text;
                    return (
                      <div key={row.model} style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.color }} />
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a18' }}>{row.model}</span>
                        </div>
                        {narrative
                          ? <p style={{ fontSize: 13, color: '#3d3d3a', lineHeight: 1.7 }}>{narrative}</p>
                          : <p style={{ fontSize: 13, color: '#888780', fontStyle: 'italic' }}>
                              No narrative found for this model. Run notebook 06 to generate narratives, then re-load the app.
                            </p>
                        }
                      </div>
                    );
                  })}
                </div>
            }
          </>
        )}

      </div>
    </div>
  );
}