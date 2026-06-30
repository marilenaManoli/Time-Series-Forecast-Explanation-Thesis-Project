# Time Series Forecast Explanation using Computing with Words

Master's thesis — Marilena Manoli, University of Bern, 2026.

Translates numeric forecast evaluation metrics into fuzzy linguistic labels, structured explanations, and natural-language narrative summaries using the Computing with Words (CwW) framework. Results are presented through an interactive React dashboard.

## Pipeline

Seven forecasting models (Naive, Seasonal Naive, Linear Regression, ETS, HWES (damped), SARIMA, Prophet) are evaluated on the AEP hourly electricity demand dataset (resampled to daily frequency) using a 3-fold expanding-window rolling evaluation over the final 90 days.

| Step | Notebook | Output |
|------|----------|--------|
| 1. Data preparation | `01_data_preparation.ipynb` | `cleaned_aep_hourly.csv` |
| 2. Forecasting | `02_baseline_forecasting_models.ipynb` | `session02_forecasts.csv` |
| 3. Rolling evaluation | `03_forecast_evaluation_and_interpretation.ipynb` | `metrics_all_models.json`, `forecasts_all_models.json` |
| 4. Fuzzy labelling | `04_fuzzy_labels.ipynb` | `session04_fuzzy_labels.csv` |
| 5. Structured explanations | `05_structured_explanations.ipynb` | `session05_structured_explanations.csv` |
| 6. Narrative layer | `06_narrative_layer.ipynb` | `session06_narratives.csv` |
| 7. Full pipeline | `07_full_pipeline.ipynb` | `session07_full_pipeline_summary.csv` |
| 8. Sensitivity analysis | `08_sensitivity_analysis.ipynb` | `session08_sensitivity.json` |
| 9. LLM-supported narrative (RQ4 / format F4) | `09_llm_narrative.ipynb` | `session09_llm_narratives.json` |

## Metrics

| Metric | Role |
|--------|------|
| MAE | Absolute error magnitude (scale-dependent) |
| RMSE | Error magnitude, sensitive to outliers |
| MAPE | Scale-free percentage error |
| MPE | Signed bias (over/underprediction) |
| DA | Directional accuracy (% correct direction) |

## Fuzzy Label Universes

Membership functions (triangular) are calibrated to the AEP daily demand range:

- **MAE** [0–2500 MW]: low / medium / high error
- **MPE** [−25–+25 %]: slight underprediction / neutral / slight overprediction
- **MAPE** [0–20 %]: low / medium / high MAPE
- **DA** [0–100 %]: low / medium / high directional accuracy

## Dashboard

The React dashboard (`src/`) presents five views for each model:

1. **Metrics & quality** — sortable comparison table + bar chart; MAE and RMSE cells include a skill score vs. Seasonal Naive baseline (e.g. "+19% vs. SNaive"), computed as `(1 − model_error / baseline_error) × 100`
2. **Linguistic explanations** — CwW-derived fuzzy labels and structured explanation sentences, followed by a hand-authored **Model profile** block (Strengths / Limitations / Recommended use) per model class
3. **Narratives** — human-readable narrative summaries (notebook 06)
4. **Threshold sensitivity** — confidence heatmap and stability chart from notebook 08; includes a comparability warning, per-model colour borders, and a moderator **Test mode** (10 s timed reveal with blur + reset) for evaluation sessions
5. **LLM Narrative** — template narrative (notebook 06) and LLM-rephrased narrative (notebook 09) side by side, with a faithfulness flag if the LLM introduced an unverified number; Blind mode for Task 4 evaluation

## Structure

```
notebooks/        full pipeline (01 → 09)
src/
  components/     React dashboard components
  content/        hand-written Notebooks-tab content (steps.js)
  data/           pipeline outputs (gitignored, except a few already-tracked files)
  styles/         CSS
requirements.txt  Python dependencies
```

## Setup

### Python

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter lab
```

Run notebooks in order (01 → 09). Each notebook saves its outputs to `src/data/`. Notebook 08 (sensitivity analysis) validates the fuzzy threshold choices and saves its results to `session08_sensitivity.json`.

**Working directory note:** notebooks 03–09 use paths relative to `notebooks/` (the default if you open them from there). Notebooks 01 and 02 instead use paths relative to `src/` — open Jupyter with `src/` as the kernel's working directory for those two specifically, or they'll fail to find the input data.

Notebook 09 (LLM-supported narrative, RQ4 / format F4) requires a local LLM via [Ollama](https://ollama.com) — no API key or cloud billing needed:

```bash
ollama pull llama3
ollama serve   # if not already running
```

### Web App

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Author

Marilena Manoli  
University of Bern, Institute of Computer Science  
May 2026

## AI Assistance Disclosure

This project was developed with the assistance of Claude (Anthropic) as an AI coding tool. Claude was used to support implementation tasks including React component development, notebook code, and debugging. All research decisions, methodology design, analysis, and written content are the author's own work. Use of AI assistance is disclosed in accordance with the University of Bern & Fribourg academic integrity guidelines.
