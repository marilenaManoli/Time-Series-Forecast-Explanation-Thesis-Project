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
| 8. Sensitivity analysis | `08_sensitivity_analysis.ipynb` | — |

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

The React dashboard (`src/`) presents three views for each model:

1. **Metrics & quality** — comparison table + bar charts
2. **Linguistic explanations** — fuzzy labels and structured explanation sentences
3. **Narratives** — human-readable narrative summaries

## Structure

```
notebooks/        full pipeline (01 → 08)
src/
  components/     React dashboard components
  data/           pipeline outputs (gitignored)
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

Run notebooks in order (01 → 08) from the `notebooks/` directory. Each notebook saves its outputs to `src/data/`. Notebook 08 (sensitivity analysis) validates the fuzzy threshold choices and produces no output files.

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

This project was developed with the assistance of Claude (Anthropic) as an AI coding tool. Claude was used to support implementation tasks including React component development, notebook code, and debugging. All research decisions, methodology design, analysis, and written content are the author's own work. Use of AI assistance is disclosed in accordance with the University of Bern's academic integrity guidelines.
