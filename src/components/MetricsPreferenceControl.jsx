import { useState } from 'react';

// Reuses the same local LLM integration as the LLM Narrative tab (notebook 09):
// Ollama running locally, model llama3, no API key / no cloud provider. This is the
// only place in the app that makes a live LLM call — everything downstream of the
// returned label (src/components/ForecastDashboard.jsx's PREFERENCE_TO_METRIC map)
// is a plain, deterministic lookup. The LLM never picks a metric or sort order itself.
const OLLAMA_URL = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = 'llama3';

export const PREFERENCE_OPTIONS = [
  { key: 'overall_accuracy',    label: 'Overall accuracy matters most' },
  { key: 'avoid_big_misses',    label: 'Avoiding big/costly misses matters most' },
  { key: 'directional_trend',   label: 'Just knowing the direction (up/down) matters most' },
  { key: 'consistent_behavior', label: 'Stable, unbiased behavior matters most' },
];

const VALID_LABELS = new Set([...PREFERENCE_OPTIONS.map(o => o.key), 'unclear']);

const SYSTEM_PROMPT = `You are a strict text classifier for a forecasting dashboard. Classify the user message into EXACTLY ONE of these five labels:
- overall_accuracy: the message explicitly says overall/average forecast accuracy is what matters most
- avoid_big_misses: the message explicitly says large, costly, or extreme forecast errors are the main worry
- directional_trend: the message explicitly says only knowing whether demand goes up or down matters
- consistent_behavior: the message explicitly says stable, unbiased, predictable behavior matters more than raw accuracy
- unclear: the default — use this unless the message CLEARLY and SPECIFICALLY expresses exactly one of the four preferences above

IMPORTANT rules for "unclear":
- Vague, generic, or non-committal messages are ALWAYS unclear (e.g. "whatever's easiest", "pick something good", "I want the best one", "not sure", "you decide", single words like "good" or "fine").
- Messages that mention two or more of the four concerns without saying which matters MOST are unclear (do not pick one as a tiebreaker).
- Off-topic or nonsensical messages are unclear.
- When genuinely uncertain, you MUST answer unclear rather than guessing the closest-sounding category.

Respond with ONLY a JSON object of the form {"label": "one_of_the_five_keys_above"}. No other text, no explanation.`;

// Classifies free text into one of the five fixed labels. Always validates the model's
// output against the fixed set — an invalid or unparseable response is treated as
// "unclear" rather than trusted, so a hallucinated label can never reach the caller.
async function classifyPreference(text) {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      format: 'json',
      stream: false,
      options: { temperature: 0 },
    }),
  });
  if (!res.ok) throw new Error(`Ollama request failed (${res.status})`);
  const data = await res.json();
  let parsed;
  try {
    parsed = JSON.parse(data?.message?.content ?? '');
  } catch {
    return 'unclear';
  }
  return VALID_LABELS.has(parsed?.label) ? parsed.label : 'unclear';
}

export default function MetricsPreferenceControl({ onApply }) {
  const [text, setText]     = useState('');
  const [phase, setPhase]   = useState('idle'); // idle | loading | confirm | unclear | error
  const [suggested, setSuggested] = useState(null);
  const [manualValue, setManualValue] = useState('');

  const submit = async () => {
    if (!text.trim()) return;
    setPhase('loading');
    try {
      const label = await classifyPreference(text.trim());
      if (label === 'unclear') {
        setPhase('unclear');
      } else {
        setSuggested(label);
        setPhase('confirm');
      }
    } catch {
      setPhase('error');
    }
  };

  const suggestedOption = PREFERENCE_OPTIONS.find(o => o.key === suggested);

  return (
    <div style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '0.85rem 1.1rem', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', fontWeight: 600, margin: 0 }}>
        What matters most for your decision?
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="Briefly describe what matters most for your decision (e.g. 'I need to avoid big cost spikes')"
          style={{ flex: 1, minWidth: 260, fontSize: 13, padding: '7px 10px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.15)', fontFamily: 'inherit' }}
        />
        <button
          onClick={submit}
          disabled={phase === 'loading' || !text.trim()}
          style={{ fontSize: 13, padding: '7px 14px', borderRadius: 6, border: 'none', background: '#1a1a18', color: '#ffffff', cursor: phase === 'loading' ? 'default' : 'pointer', fontFamily: 'inherit', opacity: phase === 'loading' ? 0.6 : 1 }}
        >
          {phase === 'loading' ? 'Classifying…' : 'Submit'}
        </button>
      </div>

      {phase === 'confirm' && suggestedOption && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '8px 12px' }}>
          <span style={{ fontSize: 13, color: '#1a1a18' }}>Did you mean: <strong>{suggestedOption.label}</strong>?</span>
          <button
            onClick={() => { onApply(suggested); setPhase('idle'); setText(''); }}
            style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#1a1a18', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Yes, apply
          </button>
          <button
            onClick={() => setPhase('idle')}
            style={{ fontSize: 12, background: 'none', border: 'none', color: '#185FA5', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            No, let me choose manually
          </button>
        </div>
      )}

      {phase === 'unclear' && (
        <p style={{ fontSize: 12, color: '#854F0B', margin: 0 }}>
          Couldn't confidently match that to one option — please choose manually below.
        </p>
      )}

      {phase === 'error' && (
        <p style={{ fontSize: 12, color: '#993C1D', margin: 0 }}>
          Couldn't reach the local classifier (is Ollama running at localhost:11434?). Choose manually below.
        </p>
      )}

      {/* Manual dropdown — always available, independent of the text input above,
          so the user can override or bypass classification entirely at any time. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#888780' }}>Or choose manually:</span>
        <select
          value={manualValue}
          onChange={e => {
            const v = e.target.value;
            setManualValue(v);
            if (v) onApply(v);
          }}
          style={{ fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.15)', fontFamily: 'inherit', color: '#3d3d3a' }}
        >
          <option value="">Select what matters most…</option>
          {PREFERENCE_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
