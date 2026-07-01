const WIDTH = 600;
const HEIGHT = 160;
const PAD = { top: 16, right: 16, bottom: 28, left: 52 };
const Y_LABEL_X = 48; // right-aligned Y-axis label column, per spec
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const X_LABEL_INDICES = [0, 7, 14, 21, 28];

function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

const round500 = v => Math.round(v / 500) * 500;

export default function ForecastPlot({ forecastData, modelName, accentColor }) {
  if (!forecastData || forecastData.length === 0) return null;

  const rows = forecastData
    .filter(d => d.model === modelName)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length === 0) return null;

  // Deliberately scaled from the FULL forecastData (all 7 models), not just `rows` for
  // modelName — this is intentional so every model's plot shares one Y-axis and is
  // visually comparable. Do not change this to a per-model min/max.
  const allValues = forecastData.flatMap(d => [d.actual, d.predicted]).filter(v => typeof v === 'number' && !Number.isNaN(v));
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  const xScale = i => PAD.left + (rows.length === 1 ? 0 : (i / (rows.length - 1)) * plotWidth);
  const yScale = v => PAD.top + (1 - (v - yMin) / (yMax - yMin || 1)) * plotHeight;

  const actualPoints    = rows.map((r, i) => `${xScale(i)},${yScale(r.actual)}`).join(' ');
  const predictedPoints = rows.map((r, i) => `${xScale(i)},${yScale(r.predicted)}`).join(' ');

  const yTicks = [0, 1, 2, 3].map(i => {
    const value = yMax - (i * (yMax - yMin)) / 3;
    return { y: yScale(value), label: round500(value) };
  });

  const xTicks = X_LABEL_INDICES.filter(i => i < rows.length).map(i => ({ x: xScale(i), label: formatDate(rows[i].date) }));

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
        {/* Y-axis tick labels */}
        {yTicks.map((t, i) => (
          <text key={i} x={Y_LABEL_X} y={t.y + 3} textAnchor="end" fontSize="10" fill="#6B7280">{t.label}</text>
        ))}

        {/* X-axis tick labels */}
        {xTicks.map((t, i) => (
          <text key={i} x={t.x} y={HEIGHT - PAD.bottom + 14} textAnchor="middle" fontSize="10" fill="#6B7280">{t.label}</text>
        ))}

        {/* Lines */}
        <polyline points={actualPoints} fill="none" stroke="#374151" strokeWidth="1.5" />
        <polyline points={predictedPoints} fill="none" stroke={accentColor} strokeWidth="1.5" />

        {/* Legend */}
        <text x={WIDTH - PAD.right} y={PAD.top + 8} textAnchor="end" fontSize="10" fill="#374151">— Actual</text>
        <text x={WIDTH - PAD.right} y={PAD.top + 20} textAnchor="end" fontSize="10" fill={accentColor}>— Forecast</text>
      </svg>
      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6B7280', margin: '4px 0 0' }}>
        Forecast vs. actual demand — 30-day evaluation window (Jul–Aug 2018)
      </p>
    </div>
  );
}
