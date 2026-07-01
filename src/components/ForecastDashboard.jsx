import { useState, useMemo, useEffect, useRef } from 'react';
import ForecastPlot from './ForecastPlot';

// ── Computing with Words — fuzzy linguistic labels ─────────────────────────
function cww(value, thresholds, labels) {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return labels[i];
  }
  return labels[labels.length - 1];
}
const mapeLabel = v => cww(v, [5, 8, 10, 13], ['excellent', 'good', 'acceptable', 'poor', 'very poor']);
const daLabel   = v => cww(v, [55, 65, 75, 85], ['random', 'low', 'moderate', 'high', 'very high']);
function biasLabel(mpe) {
  if (Math.abs(mpe) < 1) return { text: 'unbiased', dir: 'neutral' };
  return mpe > 0
    ? { text: mpe > 5 ? 'strongly over-forecasts' : 'slightly over-forecasts', dir: 'over' }
    : { text: Math.abs(mpe) > 5 ? 'strongly under-forecasts' : 'slightly under-forecasts', dir: 'under' };
}

// Maps notebook 04's real CwW label vocabulary (session04_fuzzy_labels.csv) onto
// the color tiers used by QUALITY/BIAS below, so real labels render with sensible colors.
const MAPE_QUALITY_KEY = { 'low mape': 'good', 'medium mape': 'acceptable', 'high mape': 'poor' };
const MPE_BIAS_KEY = { 'slight underprediction': 'under', neutral: 'neutral', 'slight overprediction': 'over' };

// Per-metric "what counts as best" direction. MAE/RMSE/MAPE are error magnitudes (lower is
// better). DA is a correctness rate (higher is better). MPE is a *signed* bias metric — the
// best value is the one closest to zero in either direction, not the lowest/highest raw value.
const BEST_DIRECTION = { MAE: 'lower', RMSE: 'lower', MAPE: 'lower', MPE: 'lower', DA: 'higher' };
const normalizeForRanking = (metric, value) => (metric === 'MPE' ? Math.abs(value) : value);
const rankScore = (metric, value) => {
  const v = normalizeForRanking(metric, value);
  return BEST_DIRECTION[metric] === 'higher' ? -v : v; // smaller rankScore = better, for every metric
};

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

// ── Model class profiles (hand-authored; not derived from data) ────────────
const MODEL_PROFILES = {
  'Naive': {
    strengths: 'Zero-cost statistical lower bound; always available without training.',
    limitations: 'Ignores all patterns — trend, seasonality, autocorrelation. Valid only as a sanity-check floor.',
    use: 'Use as a minimum-bar comparison only; not suitable for operational decisions.',
  },
  'Seasonal Naive': {
    strengths: 'Captures weekly/daily seasonality with no trainable parameters. Fully interpretable and fast.',
    limitations: 'Cannot model trend or irregular demand; degrades when seasonal patterns shift.',
    use: 'Strong baseline for stable, highly seasonal demand. This dataset\'s reference model for skill-score comparison.',
  },
  'Linear Regression': {
    strengths: 'Transparent and auditable — individual coefficient contributions are directly inspectable.',
    limitations: 'Assumes a linear relationship; cannot capture non-linearities or complex seasonality without feature engineering.',
    use: 'Best suited for trend-dominated series with stable structure; use caution when demand is non-linear or seasonal.',
  },
  'ETS': {
    strengths: 'Handles trend and seasonality via exponential smoothing; adapts gradually to level changes.',
    limitations: 'Additive/multiplicative structure is selected at fit time and cannot change mid-series.',
    use: 'Suitable for medium-term scheduling on stable to moderately volatile demand patterns.',
  },
  'HWES (damped)': {
    strengths: 'Damped-trend variant of Holt-Winters — avoids over-extrapolating trends, reducing long-horizon error.',
    limitations: 'Still exponential-smoothing family; limited capacity for complex multi-seasonal patterns.',
    use: 'Preferred when a trend is present but expected to flatten; good for 1–4 week planning horizons.',
  },
  'SARIMA': {
    strengths: 'Principled statistical model capturing autoregressive, moving-average, and seasonal structure simultaneously.',
    limitations: 'Parameter selection (p,d,q,P,D,Q) requires domain expertise or automated search; heavier to fit.',
    use: 'Suitable for stationary or differenced series with clear autocorrelation; use caution during demand regime changes.',
  },
  'Prophet': {
    strengths: 'Handles multiple seasonalities, trend changepoints, and holiday effects out of the box; robust to missing data.',
    limitations: 'Changepoints may be over- or under-fit; less reliable on short or highly irregular series.',
    use: 'Best for longer series with holiday/event effects; more appropriate for capacity planning than operational dispatch.',
  },
};

// ── Small helpers ───────────────────────────────────────────────────────────
function Badge({ label, colorMap, colorKey }) {
  const c = colorMap?.[colorKey ?? label] || { bg: '#F1EFE8', text: '#5F5E5A', border: '#B4B2A9' };
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

function ModelBarChart({ data, metric }) {
  const higherIsBetter = BEST_DIRECTION[metric] === 'higher';
  // Rank by |value| for MPE (closest-to-zero is best), raw value otherwise.
  const vals = data.map(d => normalizeForRanking(metric, d[metric]));
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals, minV + 0.001);
  const isPercent = ['MAPE', 'MPE', 'DA'].includes(metric);
  const fmt = v => isPercent ? `${v}%` : v;

  const barWidth = v => {
    const nv = normalizeForRanking(metric, v);
    if (higherIsBetter) return Math.max(4, ((nv - minV) / (maxV - minV)) * 100);
    return Math.max(4, (1 - (nv - minV) / (maxV - minV)) * 100);
  };

  return (
    <div style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: 16 }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600, marginBottom: 12 }}>
        {metric} — visual comparison ({higherIsBetter ? 'longer bar = better' : 'longer bar = better'})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {data.map(d => (
          <div key={d.model} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 130, fontSize: 11, color: '#3d3d3a', textAlign: 'right', flexShrink: 0 }}>{d.model}</span>
            <div style={{ flex: 1, height: 12, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${barWidth(d[metric])}%`, height: '100%', background: d.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: 11, minWidth: 52, color: '#1a1a18', fontVariantNumeric: 'tabular-nums' }}>{fmt(d[metric])}</span>
          </div>
        ))}
      </div>
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
export default function ForecastDashboard({ metrics, forecasts, narratives, fuzzyLabels, sensitivity, llmNarratives, loading, onGoToNotebooks }) {
  const [tab, setTab]                       = useState('metrics');  // metrics | explanations | narratives
  const [sortBy, setSortBy]                 = useState('MAE');
  const [activeMetricInfo, setActiveMetricInfo] = useState(null);
  const [selectedModel, setSelectedModel]   = useState(null);
  const [blindMode, setBlindMode]           = useState(false); // LLM Narrative tab: evaluation Task 4 blind compare
  const [blindRevealed, setBlindRevealed]   = useState(false);
  const [blindSeed, setBlindSeed]           = useState(0); // bump to reshuffle for the next participant

  // ── Timed-reveal test mode (sensitivity table) ──────────────────────────────
  const [testPhase, setTestPhase]       = useState('idle'); // idle | running | done
  const [testCountdown, setTestCountdown] = useState(10);
  const testTimerRef = useRef(null);
  useEffect(() => {
    if (testPhase !== 'running') return;
    setTestCountdown(10);
    let remaining = 10;
    testTimerRef.current = setInterval(() => {
      remaining -= 1;
      setTestCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(testTimerRef.current);
        setTestPhase('done');
      }
    }, 1000);
    return () => clearInterval(testTimerRef.current);
  }, [testPhase]);

  const hasMetrics = metrics && metrics.length > 0;

  // Per-model coin flip deciding which side (template vs LLM) shows first under
  // "Version A" while blind mode is on. Recomputes when llmNarratives first loads
  // or when the moderator clicks "Reshuffle" (bumps blindSeed) — stays stable
  // across re-renders in between, so the assignment doesn't shift mid-reading.
  const blindSwap = useMemo(() => {
    const map = {};
    (llmNarratives || []).forEach(r => { map[r.model] = Math.random() < 0.5; });
    return map;
  }, [blindSeed, llmNarratives]);

  // Enrich metrics with CwW labels (prefer real fuzzy label data if available)
  const enriched = useMemo(() => {
    if (!hasMetrics) return [];
    return metrics.map((m, i) => {
      // Try to find matching fuzzy label row from session04 CSV
      const fl = fuzzyLabels?.find(r => r.model === m.model || r.Model === m.model);
      const realMape = fl?.MAPE_Label;
      const realMpe  = fl?.MPE_Label;
      return {
        ...m,
        color: PALETTE[m.model] || fallbackColor(i),
        mapeLabel: realMape || mapeLabel(m.MAPE),
        mapeQualityKey: realMape ? (MAPE_QUALITY_KEY[realMape] || 'acceptable') : mapeLabel(m.MAPE),
        biasInfo: realMpe
          ? { text: realMpe, dir: MPE_BIAS_KEY[realMpe] || 'neutral' }
          : biasLabel(m.MPE),
        daLabel: fl?.DA_Label || daLabel(m.DA),
      };
    });
  }, [metrics, fuzzyLabels]);

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => rankScore(sortBy, a[sortBy]) - rankScore(sortBy, b[sortBy]));
  }, [enriched, sortBy]);

  const maxMAE  = Math.max(...(sorted.map(d => d.MAE)),  1);
  const maxRMSE = Math.max(...(sorted.map(d => d.RMSE)), 1);

  // Skill score baseline — Seasonal Naive; null if not present in data
  const skillBaseline = useMemo(() => enriched.find(m => m.model === 'Seasonal Naive') ?? null, [enriched]);

  const selected     = selectedModel ? sorted.find(d => d.model === selectedModel) : null;
  const selForecasts = useMemo(() => forecasts?.filter(f => f.model === selectedModel).slice(0, 30) || [], [forecasts, selectedModel]);

  const TABS = [
    { id: 'metrics',      label: 'Metrics & quality' },
    { id: 'explanations', label: 'Linguistic explanations' },
    { id: 'narratives',   label: 'Narratives' },
    { id: 'sensitivity',  label: 'Threshold sensitivity' },
    { id: 'llm',          label: 'LLM Narrative' },
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

                  {/* Bar chart */}
                  <ModelBarChart data={sorted} metric={sortBy} />

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
                            const isBaseline = row.model === 'Seasonal Naive';
                            const skillMAE  = skillBaseline && !isBaseline ? (1 - row.MAE  / skillBaseline.MAE)  * 100 : null;
                            const skillRMSE = skillBaseline && !isBaseline ? (1 - row.RMSE / skillBaseline.RMSE) * 100 : null;
                            const fmtSkill  = v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}% vs. SNaive`;
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
                                    {isBaseline && <span style={{ fontSize: 10, color: '#888780' }}>(baseline)</span>}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                  {row.MAE}
                                  {skillMAE !== null && <span style={{ display: 'block', fontSize: 10, color: skillMAE >= 0 ? '#3B6D11' : '#993C1D', marginTop: 1 }}>{fmtSkill(skillMAE)}</span>}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                  {row.RMSE}
                                  {skillRMSE !== null && <span style={{ display: 'block', fontSize: 10, color: skillRMSE >= 0 ? '#3B6D11' : '#993C1D', marginTop: 1 }}>{fmtSkill(skillRMSE)}</span>}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.MAPE}%</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: row.MPE > 1 ? '#D85A30' : row.MPE < -1 ? '#185FA5' : '#73726c' }}>
                                  {row.MPE > 0 ? '+' : ''}{row.MPE}%
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.DA}%</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}><Badge label={row.mapeLabel} colorMap={QUALITY} colorKey={row.mapeQualityKey} /></td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}><Badge label={row.biasInfo.text} colorMap={BIAS} colorKey={row.biasInfo.dir} /></td>
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
                            <Badge label={row.mapeLabel} colorMap={QUALITY} colorKey={row.mapeQualityKey} />
                            <Badge label={bias.text} colorMap={BIAS} colorKey={bias.dir} />
                          </span>
                        </div>
                        {structuredExp
                          ? <p style={{ fontSize: 13, color: '#3d3d3a', lineHeight: 1.6 }}>{structuredExp}</p>
                          : <p style={{ fontSize: 13, color: '#3d3d3a', lineHeight: 1.6 }}>
                              Accuracy is <strong>{row.mapeLabel}</strong> (MAPE = {row.MAPE}%).
                              Typical error is <strong>{row.MAE} units</strong> (MAE).
                              The model {biasLabel(row.MPE).text}{Math.abs(row.MPE) < 1 ? ', with no consistent direction of error' : ` by ${Math.abs(row.MPE).toFixed(1)}% on average`}.
                              Directional accuracy is <strong>{row.daLabel}</strong> ({row.DA}%).
                              {row.RMSE / row.MAE > 1.5 ? ' Large outlier errors present (RMSE ≫ MAE).' : ' No extreme outlier errors detected.'}
                            </p>
                        }
                        {forecasts && forecasts.length > 0 && (
                          <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', margin: '12px 0', padding: '12px 0' }}>
                            <ForecastPlot forecastData={forecasts} modelName={row.model} accentColor={row.color} />
                          </div>
                        )}
                        {MODEL_PROFILES[row.model] && (() => {
                          const p = MODEL_PROFILES[row.model];
                          return (
                            <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.09)', marginTop: 12, paddingTop: 12, background: '#f9f8f4', borderRadius: '0 0 8px 8px', margin: '12px -1.25rem -1rem', padding: '12px 1.25rem 1rem' }}>
                              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888780', fontWeight: 600, marginBottom: 8 }}>Model profile</p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                                {[['Strengths', p.strengths], ['Limitations', p.limitations], ['Recommended use', p.use]].map(([label, text]) => (
                                  <div key={label} style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 7, padding: '8px 10px' }}>
                                    <p style={{ margin: '0 0 3px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600 }}>{label}</p>
                                    <p style={{ margin: 0, fontSize: 12, color: '#3d3d3a', lineHeight: 1.5 }}>{text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
            }
          </>
        )}

        {/* ── TAB: SENSITIVITY (session08 output) ── */}
        {tab === 'sensitivity' && (() => {
          const conf = sensitivity?.confidence;
          const stability = sensitivity?.stability;
          const METRICS = ['mae', 'mpe', 'mape', 'da'];
          const LABELS  = ['MAE', 'MPE', 'MAPE', 'DA'];

          // % of deltas where n_changed === 0, per metric
          const stableRates = ['MAE', 'MAPE', 'DA'].map(m => {
            const rows = stability?.filter(r => r.metric === m) || [];
            const stable = rows.filter(r => r.n_changed === 0).length;
            return { metric: m, pct: rows.length ? Math.round((stable / rows.length) * 100) : null };
          });

          const scoreColor = v => {
            if (v >= 0.8) return { bg: '#EAF3DE', text: '#3B6D11' };
            if (v >= 0.5) return { bg: '#FAEEDA', text: '#854F0B' };
            return { bg: '#FAECE7', text: '#993C1D' };
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Intro */}
              <div style={{ background: '#f9f8f4', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '1rem 1.25rem' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a18', marginBottom: 6 }}>What is this?</p>
                <p style={{ fontSize: 13, color: '#3d3d3a', lineHeight: 1.6, marginBottom: 8 }}>
                  The fuzzy labels — like "low error" or "medium MAPE" — depend on where the thresholds are drawn. This tab asks: <strong>would the labels change if we had drawn the thresholds slightly differently?</strong>
                </p>
                <p style={{ fontSize: 13, color: '#3d3d3a', lineHeight: 1.6 }}>
                  Each model gets a <strong>confidence score</strong> (0–1) showing how firmly it sits inside its assigned category. A score near 1 means the label is robust — it would not change even if thresholds were shifted by ±15%. A score near 0 means the model sits near a boundary and its label is less certain.
                </p>
              </div>

              {/* Stability summary */}
              {stableRates.some(r => r.pct !== null) && (
                <div style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem 1.25rem' }}>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600, marginBottom: 12 }}>
                    Label stability — % of ±15% threshold shifts that produce no label changes
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stableRates.map(({ metric, pct }) => pct !== null && (
                      <div key={metric} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 48, fontSize: 12, color: '#3d3d3a', fontWeight: 500 }}>{metric}</span>
                        <div style={{ flex: 1, height: 14, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 60 ? '#639922' : pct >= 30 ? '#BA7517' : '#D85A30', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, minWidth: 38, fontVariantNumeric: 'tabular-nums', color: '#1a1a18' }}>{pct}%</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: '#888780', marginTop: 10 }}>
                    MAE thresholds are the most sensitive because several models cluster in the medium-error range. DA thresholds are the most stable.
                  </p>
                </div>
              )}

              {/* Confidence heatmap */}
              {conf && (
                <div style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem 1.25rem' }}>
                  {/* Header row: section label + test-mode controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600, margin: 0 }}>
                      Membership confidence per model — how firmly each label is assigned
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {testPhase === 'running' && (
                        <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', background: '#1a1a18', color: '#fff', borderRadius: 6, padding: '2px 10px', minWidth: 28, textAlign: 'center' }}>
                          {testCountdown}s
                        </span>
                      )}
                      {testPhase === 'idle' && (
                        <button onClick={() => setTestPhase('running')} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', color: '#444' }}>
                          ▶ Test mode
                        </button>
                      )}
                      {testPhase === 'done' && (
                        <button onClick={() => { setTestPhase('idle'); setTestCountdown(10); }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', color: '#444' }}>
                          ↺ Reset
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Cross-model comparison warning */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                    <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>⚠</span>
                    <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
                      <strong>Scores are not comparable across models.</strong> Each confidence score reflects only how firmly <em>that model's own label</em> was assigned — a higher score does not mean the model is more accurate or trustworthy than another. Compare scores within a single row only.
                    </p>
                  </div>
                  {/* Time's-up overlay */}
                  {testPhase === 'done' && (
                    <div style={{ background: '#1a1a18', borderRadius: 8, padding: '2rem', textAlign: 'center', marginBottom: 14 }}>
                      <p style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Time's up</p>
                      <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>What did you think these numbers meant?</p>
                    </div>
                  )}
                  <div style={{ overflowX: 'auto', filter: testPhase === 'done' ? 'blur(6px)' : 'none', pointerEvents: testPhase === 'done' ? 'none' : 'auto', transition: 'filter 0.4s' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 11, fontWeight: 600, color: '#73726c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</th>
                          {LABELS.map(l => (
                            <th key={l} style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#73726c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</th>
                          ))}
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#73726c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conf.map(row => {
                          const scores = METRICS.map(m => row[m]);
                          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                          const note = avgScore >= 0.75 ? 'Labels are robust'
                                     : avgScore >= 0.5  ? 'Some labels near a boundary'
                                     :                    'Several labels borderline';
                          const noteColor = avgScore >= 0.75 ? '#3B6D11' : avgScore >= 0.5 ? '#854F0B' : '#993C1D';
                          const modelColor = PALETTE[row.model] || '#888780';
                          return (
                            <tr key={row.model} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)', borderLeft: `3px solid ${modelColor}` }}>
                              <td style={{ padding: '9px 12px', fontWeight: 500 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: modelColor, flexShrink: 0 }} />
                                  {row.model}
                                </span>
                              </td>
                              {METRICS.map(m => {
                                const v = row[m];
                                const c = scoreColor(v);
                                return (
                                  <td key={m} style={{ padding: '9px 12px', textAlign: 'center' }}>
                                    <span style={{ background: c.bg, color: c.text, borderRadius: 5, padding: '2px 8px', fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                                      {v.toFixed(2)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td style={{ padding: '9px 12px', fontSize: 12, color: noteColor }}>{note}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
                    {[['≥ 0.80 — robust', '#EAF3DE', '#3B6D11'], ['0.50–0.79 — borderline', '#FAEEDA', '#854F0B'], ['< 0.50 — near boundary', '#FAECE7', '#993C1D']].map(([l, bg, text]) => (
                      <span key={l} style={{ background: bg, color: text, borderRadius: 5, padding: '2px 9px', fontSize: 11 }}>{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {!sensitivity && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#888780' }}>
                  <p style={{ fontSize: 13 }}>Run notebook 08 to generate sensitivity data, then re-load the app.</p>
                </div>
              )}
            </div>
          );
        })()}

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

        {/* ── TAB: LLM NARRATIVE (session09 output, RQ4 / format F4) ── */}
        {tab === 'llm' && (
          <>
            {!hasMetrics
              ? <EmptyState loading={loading} onGoToNotebooks={onGoToNotebooks} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 13, color: '#73726c', marginBottom: 4 }}>
                    The rule-based narrative (notebook 06) and an LLM-rephrased version (notebook 09, format F4) side by side, for comparison.
                    {!llmNarratives && <span style={{ color: '#854f0b' }}> Run notebook 09 to populate this tab.</span>}
                  </p>

                  {/* Blind-mode controls, for evaluation Task 4 (EVALUATION_PLAN.md §4) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f9f8f4', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '0.6rem 0.9rem', marginBottom: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#3d3d3a', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={blindMode}
                        onChange={e => { setBlindMode(e.target.checked); setBlindRevealed(false); }}
                      />
                      Blind mode (hide which version is which)
                    </label>
                    {blindMode && (
                      <>
                        <button
                          onClick={() => setBlindRevealed(true)}
                          disabled={blindRevealed}
                          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.15)', background: blindRevealed ? '#f1efe8' : '#1a1a18', color: blindRevealed ? '#888780' : '#ffffff', cursor: blindRevealed ? 'default' : 'pointer', fontFamily: 'inherit' }}
                        >
                          Reveal
                        </button>
                        <button
                          onClick={() => { setBlindSeed(s => s + 1); setBlindRevealed(false); }}
                          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.15)', background: '#ffffff', color: '#3d3d3a', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Reshuffle for next participant
                        </button>
                        <span style={{ fontSize: 11, color: '#888780' }}>{blindRevealed ? 'Revealed' : 'Hidden — Version A/B order is randomized per model'}</span>
                      </>
                    )}
                  </div>

                  {sorted.map(row => {
                    const llmRow = llmNarratives?.find(r => r.model === row.model);
                    const hiding = blindMode && !blindRevealed;
                    const swapped = !!blindSwap[row.model];
                    // first/second hold {label, text} in display order; in blind+hidden mode
                    // the label is just "Version A"/"Version B", swapped per model so a
                    // participant can't learn "A is always the rule-based one."
                    const sides = llmRow ? (swapped
                      ? [{ key: 'llm', label: 'LLM-rephrased', text: llmRow.llm_narrative }, { key: 'template', label: 'Rule-based (template)', text: llmRow.template_narrative }]
                      : [{ key: 'template', label: 'Rule-based (template)', text: llmRow.template_narrative }, { key: 'llm', label: 'LLM-rephrased', text: llmRow.llm_narrative }]
                    ) : [];
                    return (
                      <div key={row.model} style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.color }} />
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a18' }}>{row.model}</span>
                          {!hiding && llmRow?.faithfulness_flag && (
                            <span
                              title={`Numbers in the LLM text not found in the source narrative: ${llmRow.flagged_numbers?.join(', ')}`}
                              style={{ marginLeft: 'auto', background: '#FAEEDA', color: '#854F0B', border: '1px solid #BA7517', borderRadius: 6, padding: '2px 9px', fontSize: 11, fontWeight: 500, cursor: 'help' }}
                            >
                              ⚠ unverified number
                            </span>
                          )}
                        </div>
                        {llmRow
                          ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {sides.map((side, i) => (
                                <div key={side.key}>
                                  <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600, marginBottom: 4 }}>
                                    {hiding ? `Version ${i === 0 ? 'A' : 'B'}` : `Version ${i === 0 ? 'A' : 'B'} — ${side.label}`}
                                  </p>
                                  <p style={{ fontSize: 13, color: '#3d3d3a', lineHeight: 1.6 }}>{side.text}</p>
                                </div>
                              ))}
                            </div>
                          : <p style={{ fontSize: 13, color: '#888780', fontStyle: 'italic' }}>
                              No LLM narrative found for this model. Run notebook 09 to generate it, then re-load the app.
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