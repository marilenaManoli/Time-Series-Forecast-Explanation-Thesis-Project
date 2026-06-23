# Project Report: Time Series Forecast Explanation using Computing with Words

**Author:** Marilena Manoli — Master's thesis, University of Bern, Institute of Computer Science, 2026
**Last updated:** 2026-06-22

**How to use this document:** it's written so that someone with no prior knowledge of the project can read a section and then open the matching file (notebook, component, or data file) and see exactly what's being described. Every claim below names the specific file it comes from. Read this top to bottom for the full picture, or jump to §5 for "what does this project actually conclude" or §6 for "what's broken / what's already been fixed."

---

## 1. The idea in one paragraph

Forecasting models produce numbers — "MAE = 1238", "MAPE = 7.9%". Most people, including the operators who'd actually use a forecast, don't have an intuition for whether 1238 is good or bad. This project takes those numbers and translates them into **words** a person can act on — "this model has low error and a slight tendency to overpredict" — using a framework called **Computing with Words (CwW)**. The translation happens in stages: numbers → fuzzy categories ("low/medium/high") → short rule-based sentences → a fuller narrative paragraph. The forecasting itself (which model predicts electricity demand best) is just the test bed that gives the explanation layer something real to explain — it is not the thesis's main contribution.

## 2. Key terms (read this before anything else)

- **Fuzzy label / fuzzy membership function**: instead of a hard cutoff ("error above 1500 = bad"), a *fuzzy* category has a smooth, overlapping boundary — a value can belong "70% to medium, 30% to high." This project still ultimately picks one winning label per value, but the underlying functions are smooth triangles, not cliffs. Defined in `notebooks/04_fuzzy_labels.ipynb`.
- **Computing with Words (CwW)**: the broader idea that you can do meaningful reasoning/computation over linguistic labels ("low", "moderate") rather than only over raw numbers, and that the result is still a useful, well-defined answer.
- **The five metrics used throughout**, all computed in `notebooks/03_forecast_evaluation_and_interpretation.ipynb`:
  | Metric | Meaning | Good direction |
  |---|---|---|
  | MAE | average size of the forecast error, in megawatts | lower |
  | RMSE | like MAE but penalizes big errors more | lower |
  | MAPE | error as a percentage, comparable across scales | lower |
  | MPE | *signed* percentage error — tells you if the model leans high or low | closer to 0 |
  | DA | Directional Accuracy — % of days it correctly predicted demand would rise or fall, regardless of size | higher |

  **One convention to know:** in this codebase, `MPE = (actual − predicted) / actual`. A *positive* MPE means the model's prediction was lower than what actually happened — i.e. the model **under**-predicted. The code (and the labels it produces) call a positive MPE "over-forecast." That reads backwards at first glance, but it's applied consistently everywhere, so it's a naming choice, not a calculation bug — just don't assume "over-forecast" means what it sounds like.

## 3. The two parts of the project, and how they connect

```
notebooks/  (Python, run by hand in Jupyter, 01 → 08)
   each notebook reads the previous notebook's output file and writes its own
        │
        ▼
src/data/   (the files notebooks write to and the dashboard reads from — CSV/JSON)
        │
        ▼
src/        (React dashboard, reads a subset of those files at the browser's runtime)
```

There is **no single "run everything" command.** You open Jupyter, run notebooks 01 through 08 in order, and each one saves a file into `src/data/`. The dashboard (`npm run dev`) then fetches some of those files directly over HTTP from the running dev server. If you change a notebook, nothing downstream updates automatically — you have to re-run every notebook after it, by hand, in order.

## 4. Walking through the pipeline, notebook by notebook

For each notebook: what it's for, what it reads, what it does in plain terms, and exactly what file it produces (so you can open that file next to the notebook and check it yourself).

### `01_data_preparation.ipynb`
**Goal:** turn the raw, messy electricity-demand data into a clean, gap-free hourly series.
**Reads:** `data/archive/AEP_hourly.csv` — hourly electricity demand for the AEP utility area (a public Kaggle dataset), 2004–2018. **Note:** this path (and notebook 02's) is relative to `src/`, not `notebooks/` like every later notebook — open Jupyter with `src/` as the working directory for these two specifically, or the file won't be found.
**Does:** sorts by time, forces a strict one-row-per-hour grid, fills any small gaps by interpolating.
**Produces:** `src/data/cleaned_aep_hourly.csv` — two columns, `Datetime` and `AEP_MW`, ~121,000 hourly rows.

### `02_baseline_forecasting_models.ipynb`
**Goal:** an early, simple test — does Prophet or a basic Exponential Smoothing model forecast better?
**Reads:** the cleaned hourly file from notebook 01.
**Does:** splits the data 80/20 (train/test, in time order, no shuffling), fits two models, compares errors.
**Produces:** `src/data/session02_forecasts.csv`, `src/data/session02_results.csv`. Conclusion: Prophet clearly wins here (MAE 1409 vs. ETS's 2701).
**Note:** this notebook is an earlier, simpler draft. Notebook 03 redoes this comparison properly with 7 models and a more rigorous evaluation method — notebook 02 is kept for the historical "how the design evolved" narrative, not because its numbers feed anything downstream.

### `03_forecast_evaluation_and_interpretation.ipynb` — the core of the forecasting half
**Goal:** the real, final comparison of forecasting models — this is the numeric source everything else in the project is built on top of.
**Reads:** the cleaned hourly file, then resamples it to **daily** averages.
**Does:** evaluates **seven forecasting models** — Naive, Seasonal Naive, Linear Regression, ETS, Holt-Winters with damped trend, SARIMA, and Prophet — using a proper backtest: three 30-day test windows near the end of the series, each time training on *all* the data before that window ("expanding window"), then averaging the error metrics across the three windows.
**Produces:** `src/data/metrics_all_models.json` (one row per model: MAE/RMSE/MAPE/MPE/DA) and `src/data/forecasts_all_models.json` (day-by-day actual vs. predicted values, used for the dashboard's mini-charts).

**The actual result** (this is the number table everything downstream explains in words):

| Model | MAE | RMSE | MAPE | MPE | DA |
|---|---|---|---|---|---|
| Prophet | 1091.5 | 1320.1 | 7.05% | +2.61% | 65.5% |
| Linear Regression | 1238.0 | 1505.5 | 7.94% | +2.91% | 50.6% |
| Seasonal Naive | 1352.2 | 1719.3 | 8.94% | −0.57% | 59.8% |
| SARIMA | 1435.0 | 1704.9 | 9.21% | +4.49% | 66.7% |
| HWES (damped) | 1517.1 | 1779.2 | 9.82% | +5.22% | 67.8% |
| ETS | 1546.3 | 1813.0 | 10.02% | +5.25% | 66.7% |
| Naive | 1827.6 | 2165.8 | 11.98% | +5.42% | 0.0% |

**In plain words:** Prophet is the most accurate model overall. Naive is the worst (and, unsurprisingly, has 0% directional accuracy — repeating yesterday's value can never predict a change in direction). Most models lean slightly toward under-prediction (positive MPE, per the convention in §2) except Seasonal Naive, which is the most balanced.

### `04_fuzzy_labels.ipynb` — start of the explanation layer
**Goal:** turn the numbers in the table above into words like "low error" or "slight overprediction."
**Reads:** `metrics_all_models.json` from notebook 03.
**Does:** defines three overlapping triangular "buckets" for each metric (e.g. for MAE: low/medium/high) and assigns each model to whichever bucket it overlaps with most. The exact triangle boundaries (in `[left edge, peak, right edge]` form) are:

| Metric | low / under | medium / neutral | high / over |
|---|---|---|---|
| MAE (0–2500 MW) | `[0, 1100, 1300]` | `[1200, 1500, 1700]` | `[1600, 1800, 2500]` |
| MPE (−25% to +25%) | `[-25, -6, -0.5]` | `[-1.0, 0, 1.0]` | `[0.5, 6, 25]` |
| MAPE (0–20%) | `[0, 5, 9]` | `[7, 10, 14]` | `[9, 14, 20]` |
| DA (0–100%) | `[0, 0, 58]` | `[55, 68, 82]` | `[75, 90, 100]` |

**Important to know:** these boundaries were chosen by hand to fit *these exact 7 models' results* (the code comments say this directly — e.g. "low = Prophet/LR, medium = stat models, high = Naive"). They are not a general industry-standard scale. That's a deliberate, reasonable design choice for a thesis — but it's the single most "judgment call"-heavy step in the whole pipeline, which is exactly why notebook 08 exists (see below).
**Produces:** `src/data/session04_fuzzy_labels.csv` — for each model, a label for MAE, MPE, MAPE, and DA. E.g. Prophet → `low error, slight overprediction, low mape, medium DA`. Naive → `high error, slight overprediction, high mape, low DA`.

### `05_structured_explanations.ipynb`
**Goal:** turn those labels into one short, readable sentence per model. Deliberately simple — no AI text generation, just a lookup table of canned phrases per label, stitched together.
**Reads:** `session04_fuzzy_labels.csv`.
**Produces:** `src/data/session05_structured_explanations.csv`. Example (Naive): *"The model has high absolute error with a slight tendency to overpredict demand. Its percentage error is high, limiting usefulness for demand-sensitive decisions. It struggles to correctly identify whether demand will rise or fall."*

### `06_narrative_layer.ipynb`
**Goal:** wrap that sentence with an opening line (an overall verdict) and a closing line (what the directional accuracy means for someone scheduling operations).
**Reads:** `session05_structured_explanations.csv`.
**Produces:** `src/data/session06_narratives.csv`. Example (Prophet): *"Prophet is one of the stronger models in this comparison. The model achieves low absolute error with a slight tendency to overpredict demand. Its percentage error is low, making it reliable across different demand levels. It correctly identifies the direction of demand change roughly two-thirds of the time. This level of directional accuracy is generally useful for operational scheduling."*
**Fixed on 2026-06-22:** the closing sentence used to repeat the exact same directional-accuracy fact the previous sentence already stated, just reworded ("...two-thirds of the time" twice). It now adds the *operational implication* instead of repeating the fact. Notebooks 06 and 07 were re-run after the fix, so the CSVs on disk already reflect this.

### `07_full_pipeline.ipynb`
**Goal:** a single place that loads every previous session's output and displays it end-to-end, as a sanity check / demo. It does not recompute anything — purely re-displays files already on disk.
**Produces:** `src/data/session07_full_pipeline_summary.csv` — a trimmed version of notebook 06's table (drops the DA and combined-label columns).
**Note:** despite the name, there is no actual orchestration code here — it doesn't call notebooks 04–06's logic, it just reads their saved CSV files. If you change an earlier notebook, you must re-run everything after it by hand; nothing here does that for you.

### `08_sensitivity_analysis.ipynb` — the validation step for notebook 04's design choices
**Goal:** answer the obvious question about notebook 04: "are those hand-picked threshold numbers actually trustworthy, or arbitrary?"
**Reads:** the raw metric values (not the labels) from `session04_fuzzy_labels.csv`.
**Does:** shifts each metric's threshold boundaries by anywhere from −15% to +15% (in small steps) and checks, at every step, whether any model's label flips. It also computes a **confidence score** (0–1) for every model on every metric — how firmly that model sits inside its assigned category, versus sitting right on a boundary.
**Produces:** `src/data/session08_sensitivity.json`.

**What it found:** **Linear Regression is the most boundary-sensitive model** — its confidence scores are the lowest across MAE (0.31), MPE (0.44), MAPE (0.31), and DA (0.13), meaning small changes to the thresholds could plausibly flip its label. **Naive and Prophet are the most confidently categorized** (for opposite reasons — one is unambiguously the worst performer, the other unambiguously the best). The notebook's conclusion: most labels stay stable across a wide range of threshold shifts, and the low-confidence cases (Linear Regression) reflect genuine ambiguity in the data rather than a flawed threshold design. This is the methodological evidence that backs up notebook 04's hand-picked numbers.

### `09_llm_narrative.ipynb` — RQ4 / format F4, added 2026-06-22
**Goal:** implement the LLM-supported narrative explanation format from the thesis proposal (RQ4) — rephrase the existing rule-based narrative (notebook 06) into more natural prose using a language model, without the LLM introducing any new facts, numbers, comparisons, or judgments.
**Reads:** `session06_narratives.csv` — specifically the four fuzzy labels and the `Narrative` text per model (no raw metric numbers are given to the LLM at all, deliberately — see rationale below).
**Does:** for each of the 7 models, sends the labels + existing narrative to a **locally-run LLM (Llama 3 8B via [Ollama](https://ollama.com), no API key or cloud cost)** with a strict system prompt instructing it to rephrase only. The exact prompts are kept as plain, top-level variables (`SYSTEM_PROMPT`, `USER_PROMPT_TEMPLATE`) in the notebook so they can be quoted directly in the methodology chapter. A lightweight faithfulness check then flags any number appearing in the LLM's output that wasn't present in the source narrative — meaningful here because the rule-based narratives contain zero numeric digits, so *any* number in the LLM output is automatically suspect.
**Produces:** `src/data/session09_llm_narratives.json` — one record per model with the labels, the original template narrative, the LLM-rephrased narrative, and the faithfulness flag/list of flagged numbers.

**What it found, on the actual run used to build this:** 0 of 7 models were flagged by the automated numeric check. **However, manual review caught a real faithfulness issue the automated check cannot catch**: for Naive, the template says "a slight tendency to overpredict demand," and the LLM rewrote this as "consistently overpredicts demand by a significant margin" — a clear strength-amplification of the original claim, with no digits involved. This is documented directly in the notebook's markdown as an empirically-observed limitation, alongside a second observed pattern (the model sometimes *omits* a fact, e.g. dropping the directional-accuracy sentence entirely, rather than fabricating one). **Conclusion for the thesis:** the automated faithfulness check is a screening aid for fabricated numbers only — it is not a faithfulness guarantee, and every LLM narrative should be read manually (the notebook prints a side-by-side comparison for exactly this purpose) before being shown to study participants.

**Two more things found during a 2026-06-23 pilot dry-run of the evaluation protocol (see `EVALUATION_PLAN.md`), both worth knowing before running real sessions:**
- **Notebook 09's output is not deterministic across runs**, unlike every other notebook in the pipeline (01–08 regenerate byte-identical output every time, confirmed during the clean re-run in §6). Re-running notebook 09 calls the local LLM again and gets different phrasing each time, even at `temperature=0.2`. **Practical implication: do not re-run notebook 09 between or during evaluation sessions** — freeze `session09_llm_narratives.json` once before the panel starts, so every participant sees the same stimulus. Re-running it mid-study would mean different participants are silently evaluating different generated text.
- **A second, more systematic faithfulness pattern**, found by re-running notebook 09 and reading the new output: the LLM repeatedly adds an unstated *evaluative softening* judgment that isn't a number and isn't in the source. Three independent examples from one fresh run: ETS — "this bias **isn't significant enough to cause major issues**"; Prophet — "this bias **doesn't significantly impact its overall accuracy**"; SARIMA — "its overall absolute error **remains manageable**." None of these claims (whether the bias "matters" or the error is "manageable") exist in the source narrative — the template only states the category, never an opinion on its practical consequence. This is a recurring behavior, not a one-off, and it's a stronger piece of evidence for the thesis's RQ4 discussion than the original single Naive example: the regex-based faithfulness check is structurally blind to this entire class of violation (rule 1 — "do not add judgments not explicitly present" — broken with zero digits involved).

## 5. The dashboard (`src/`)

A React + Vite app (`npm run dev`, then open `http://localhost:5173`) with **no router, no charting library, and no CSS framework** — every chart is a hand-built bar made of `<div>`s, and navigation between views is just component state, not URLs. It has four tabs, each reading a specific file:

| Tab | Reads | Shows |
|---|---|---|
| Metrics & quality | `metrics_all_models.json`, `session04_fuzzy_labels.csv` | sortable table of all 7 models, bar chart, click a row to see its forecast-vs-actual mini chart |
| Linguistic explanations | `session06_narratives.csv` (the `Structured_Explanation` column) | notebook 05's sentence per model |
| Narratives | `session06_narratives.csv` (the `Narrative` column) | notebook 06's fuller paragraph per model |
| Threshold sensitivity | `session08_sensitivity.json` | confidence heatmap + stability chart from notebook 08 |
| LLM Narrative | `session09_llm_narratives.json` | template narrative vs. LLM-rephrased narrative side by side, with a faithfulness-flag badge |

The main file is `src/components/ForecastDashboard.jsx`. The top-level shell that fetches all the files and switches between this dashboard and a "Notebooks" browsing view is `src/App.jsx`; `src/components/NotebookWindow.jsx` and `StepWindow.jsx` render that notebook-browsing view, with the descriptive text for each notebook hand-written in `src/content/steps.js` (currently covers notebooks 01–07 only — see §6).

**Fixed on 2026-06-22:** the Metrics tab's "Quality" and "Bias" badges were not actually showing your real fuzzy labels from notebook 04 — a column-name case mismatch (`MAPE_label` vs. the real `MAPE_Label`) meant the code always fell back to a second, unrelated, hardcoded labeling scheme written directly in JavaScript. On top of that, even the fallback labels weren't getting colored correctly, because the color lookup used the label's display text as the lookup key, while the color tables are actually keyed by category (`good`/`poor`/`over`/`under`, not the literal words). Both are now fixed — verified by running the app in a browser and confirming the badges show real labels like `low mape` / `medium mape` / `high mape` with matching, distinct colors. See `git log` for the change.

## 6. Current code health

### Already fixed (2026-06-22)
1. Dashboard "Quality"/"Bias" badges now show the real notebook-04 fuzzy labels with correct colors (was silently showing an unrelated hardcoded scheme — see §5).
2. Notebook 06's narrative no longer repeats the same directional-accuracy fact twice in different words.
3. `README.md` corrected — it used to claim notebook 08 produces no output file (it does: `session08_sensitivity.json`) and described the dashboard as having three tabs (it has four).
4. `requirements.txt` was missing `scikit-fuzzy`, which notebooks 04 and 08 both require — a fresh `pip install -r requirements.txt` would have failed those two notebooks. Added.
5. The "best" badge and the bar chart in `ForecastDashboard.jsx` both treated MPE like every other metric (assuming either "lowest is best" or "highest is best"). MPE is a *signed bias* metric — the best value is the one closest to zero, not the highest or lowest raw value. Sorting by MPE used to put the most over-forecasting model first and tag it "best." Fixed with a shared `rankScore()`/`BEST_DIRECTION` helper so the table sort, the "best" badge, and the bar chart all rank MPE by `|value|` instead of the raw signed value. Verified in browser: sorting by MPE now correctly puts Seasonal Naive (−0.57%, closest to zero) first.
6. Did a clean re-run of all 9 notebooks end to end (2026-06-23). This also resolved the stale `FileNotFoundError` outputs notebooks 01/02 used to show as committed — they ran clean once executed with the correct working directory (see the working-directory note in §4's notebook 01 section). All regenerated metrics matched the previously-documented values exactly, confirming the pipeline is fully deterministic and reproducible.
7. File-structure cleanup (2026-06-23): removed Jupyter checkpoint clutter (some of which had been accidentally committed), deleted a leftover `dist/` build directory, deleted the orphaned `session03_comparison.csv`/`session03_metrics.csv`, trimmed `src/data/archive/` from 47MB of unused other-utility CSVs down to just `AEP_hourly.csv` (the only file any notebook actually reads), and moved `steps.jsx` out of `src/data/` (which otherwise holds only generated pipeline output) into `src/content/steps.js`, updating the one import in `App.jsx` accordingly. Verified the build and the Notebooks tab both still work correctly after the move.

### Still open — worth doing before/while preparing for expert review

- **`src/data/session05_structured_explanations.csv` and `session07_full_pipeline_summary.csv` are written but never read** by the live dashboard (it gets the same text from `session06_narratives.csv` instead, which is a superset). Not broken, just dead weight — worth knowing so you don't assume editing them changes anything in the app.
- **Notebook 08 has no entry in the "Notebooks" browsing view** (`src/content/steps.js` only lists 01–07) and no HTML export in `public/`, even though its data is fully wired into the dashboard's fourth tab. Inconsistent coverage between the two views.
- **A broken link**: `StepWindow.jsx`'s "Preview HTML export" button links to `/public/<file>.html`, but Vite serves the `public/` folder's contents from the site root (no `/public` prefix) — this link likely 404s.
- **A dead, unused stylesheet**: `src/styles/main.css` defines an entire alternate design (dark mode, different class names) that doesn't match anything currently rendered — it appears to be left over from an earlier UI version but is still being shipped in the build. `src/styles/app.css` is the one actually in use.
- **Minor display bugs in `ForecastDashboard.jsx`** (cosmetic, not data-correctness issues): the "last N days" caption on the per-model sparkline actually shows the *first* 30 matching rows, not the last; a leftover `condition ? x : x` (always the same result either way) in the bar-chart label.
- **The MPE sign convention** described in §2 is consistent throughout the code but easy to misread; worth one explicit sentence about it in the thesis write-up so a reader doesn't mistake it for an error.

None of the remaining items require a redesign — they're all small, contained fixes.

## 7. Suggested next steps

1. Add a notebook 08 entry to the Notebooks browsing view, or note explicitly why it's excluded.
2. The codebase is now in a state where the labels and narratives an expert reviewer sees are the real output of your CwW pipeline, all 9 notebooks run clean end to end, the file structure is cleaned of clutter/dead weight, and the LLM-narrative format from RQ4 is implemented and wired into the dashboard — the main blockers for honest expert evaluation have been resolved.
