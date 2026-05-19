# Time Series Forecast Explanation using Computing with Words

**Marilena Manoli**
Master's Thesis — University of Bern
Faculty of Science, Institute of Computer Science
May 2026

---

## Abstract

Quantitative forecast evaluation produces numerical metrics that, while mathematically precise, are often opaque to non-specialist stakeholders. This thesis proposes and implements a Computing with Words (CwW) pipeline that systematically translates numeric time-series forecast quality metrics into structured linguistic explanations and natural-language narrative summaries. Seven forecasting models — Naive, Seasonal Naive, Linear Regression, ETS, Holt-Winters Exponential Smoothing (damped), SARIMA, and Prophet — are applied to the AEP hourly electricity demand dataset, resampled to daily frequency. Forecast quality is assessed using five metrics: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), Mean Absolute Percentage Error (MAPE), Mean Percentage Error (MPE), and Directional Accuracy (DA). Fuzzy membership functions are then used to map these numeric values onto linguistic labels such as "low error," "medium error," "neutral bias," and "slight overprediction." A rule-based layer combines these labels into structured explanations, which are in turn rendered as concise narrative summaries. The full pipeline is delivered through a React dashboard that presents comparison tables, linguistic explanations, and narrative summaries side by side. Results demonstrate that the CwW layer preserves the inferential content of the original metrics while substantially improving their communicability, and that it reveals interpretive distinctions — notably between well-calibrated models and a structurally biased baseline — that numeric tables alone do not make immediately visible.

---

## Table of Contents

1. Introduction
2. Background and Related Work
3. Methodology
4. Implementation
5. Results
6. Conclusion

References

---

## 1. Introduction

Accurate forecasting of electricity demand is a critical operational requirement in the energy sector. Grid operators, energy traders, and policy planners routinely rely on short- to medium-term demand forecasts to schedule generation capacity, manage reserves, and minimise imbalance costs. The technical literature on time-series forecasting is extensive, and a rich ecosystem of models — ranging from classical statistical methods to modern machine learning approaches — is available. However, the evaluation of these models is almost universally conducted in purely numerical terms: a table of MAE, RMSE, or MAPE values, perhaps accompanied by a residual plot. While such representations are unambiguous for trained analysts, they present a substantial interpretability gap for the broader audiences — domain experts, operational managers, and policy stakeholders — who must ultimately act on forecast quality assessments.

This thesis addresses that gap through the framework of Computing with Words (CwW), a paradigm introduced by Lotfi Zadeh in the late 1990s as a formal approach to reasoning and computing with linguistic, rather than numerical, quantities. The central claim of CwW is that human cognition naturally operates in terms of fuzzy, approximate linguistic categories — "high error," "slight overprediction," "excellent accuracy" — and that formal systems can be designed to mirror this mode of reasoning without sacrificing transparency or traceability. Applying CwW to forecast evaluation means constructing a principled mapping from numeric performance metrics to linguistic labels, combining those labels through interpretable rules, and ultimately generating natural-language explanations that communicate forecast quality in terms that non-specialist stakeholders can readily understand and act upon.

The primary research question motivating this work is: can a Computing with Words pipeline transform standard forecast evaluation metrics into linguistic explanations that are both faithful to the underlying numeric evidence and meaningfully more interpretable for diverse audiences? Two subsidiary questions follow from this: which fuzzy membership function designs and universe-of-discourse choices best preserve the interpretive distinctions already visible in the numeric data, and what does the CwW representation reveal about model behaviour that a numeric table alone does not make immediately apparent?

The contributions of this thesis are threefold. First, a complete seven-model forecast evaluation study on daily electricity demand is presented, providing a concrete empirical base for the explanation system. Second, a full CwW pipeline is designed and implemented, spanning fuzzy label generation, structured explanation assembly, and narrative summary production. Third, a React-based interactive dashboard is built that integrates metric comparison tables, linguistic explanations, and narrative summaries into a single interface, demonstrating that the pipeline is practically deployable and not merely a theoretical exercise.

The remainder of this thesis is organised as follows. Chapter 2 reviews the relevant background in time-series forecasting, the CwW framework, and related work on explanation systems for machine learning and forecasting. Chapter 3 describes the methodology in detail. Chapter 4 covers the software implementation. Chapter 5 presents and analyses the results. Chapter 6 concludes with a summary of findings, a discussion of limitations, and directions for future work.

---

## 2. Background and Related Work

### 2.1 Time Series Forecasting for Energy Demand

Time-series forecasting is a well-established field with a long history of application in energy systems. The fundamental task — predicting future values of a time-indexed variable from its historical behaviour — admits a wide range of modelling strategies, each making different assumptions about the structure of the underlying process.

The simplest approaches serve as baselines rather than deployable systems. The Naive forecast repeats the last observed value as the prediction for all future horizons, capturing no trend or seasonality. The Seasonal Naive forecast repeats the observation from the equivalent season one period prior (e.g., the value from the same day of the prior week for weekly-seasonal data), thereby encoding the dominant periodic structure without any parameter estimation. These baselines are important reference points: a model that cannot substantially outperform them offers little value in practice.

Among classical statistical models, Exponential Smoothing (ETS) and its variants have enjoyed sustained use in operational forecasting. ETS models express the forecast as a weighted combination of past observations, with exponentially decaying weights, and can incorporate level, trend, and seasonal components in an additive or multiplicative configuration. The Holt-Winters exponential smoothing (HWES) model extends this framework explicitly to series with both trend and seasonality, with a "damped" variant that moderates the trend component over longer horizons to avoid over-extrapolation. SARIMA (Seasonal AutoRegressive Integrated Moving Average) belongs to the Box-Jenkins family of models and characterises the series in terms of autoregressive, differencing, and moving-average components at both non-seasonal and seasonal lags. Linear Regression, while not a time-series model in the strict sense, can serve as a forecasting baseline when temporal features (day-of-week indicators, trend terms) are included as regressors.

More recent work has produced open-source tools such as Prophet (Taylor and Letham, 2018), developed at Meta, which decomposes the time series into trend, weekly seasonality, annual seasonality, and holiday effects using a Bayesian curve-fitting approach. Prophet has demonstrated strong performance on business time series with irregular seasonality and is widely used in applied forecasting.

For electricity demand forecasting specifically, the seasonality structure is strong and well-understood: demand exhibits clear daily, weekly, and annual cycles driven by human activity patterns and temperature. This makes the domain particularly suitable for seasonal methods and motivates the choice of models in this thesis.

### 2.2 Forecast Evaluation Metrics

Standard evaluation metrics for point forecasting can be grouped by the type of information they convey. Scale-dependent metrics such as MAE and RMSE express error in the original units of the time series, making them directly interpretable in domain terms (megawatts, in this case) but not directly comparable across datasets with different scales. MAE reports the average absolute deviation, weighting all errors equally. RMSE gives disproportionate weight to large errors through the squaring operation, making it sensitive to occasional large misses. Percentage-based metrics such as MAPE and MPE normalise by the actual value, enabling cross-scale comparison. MAPE is unsigned and reflects overall relative error; MPE retains the sign, functioning as a bias indicator — a consistently positive MPE indicates systematic over-forecasting, while a negative value indicates under-forecasting. Directional Accuracy (DA) is a classification metric that measures what fraction of time the model correctly predicts the direction of change, independent of magnitude; it is particularly relevant for operational decision-making where the sign of the forecast change matters more than its exact size.

### 2.3 Computing with Words

The Computing with Words framework was formalised by Lotfi Zadeh (1996, 1999) as an extension of fuzzy logic to the domain of natural-language computation. In classical crisp logic, a value either belongs to a category or it does not. In fuzzy logic, membership in a category is a matter of degree, expressed by a membership function that maps numeric values onto the interval [0, 1]. CwW extends this to linguistic variables, where the "values" of a variable are words or phrases (e.g., "low," "medium," "high") rather than numbers, and where the semantics of these words are formalised through fuzzy sets.

A linguistic variable is defined over a universe of discourse — the numeric domain from which values are drawn — and its term set consists of the linguistic values the variable can take. Each term is associated with a fuzzy membership function that specifies, for every point in the universe of discourse, the degree to which that point belongs to the category named by the term. Common membership function shapes include triangular (trimf), trapezoidal (trapmf), and Gaussian functions. The choice of shape encodes assumptions about the gradedness of the transition between categories.

In the CwW approach to forecast evaluation, a metric such as MAE becomes a linguistic variable whose term set might be {low error, medium error, high error}. A numeric MAE value is then interpreted not as a crisp categorical assignment but as a vector of membership degrees across the terms. Inference over multiple such linguistic variables can be performed using fuzzy rules — if-then statements written in linguistic terms — producing a structured, traceable account of model quality that is closer to how a human expert would describe the situation.

### 2.4 Related Work on Explainable Forecasting

The broader field of Explainable Artificial Intelligence (XAI) has produced a number of approaches to post-hoc model explanation, including LIME (Ribeiro et al., 2016), SHAP (Lundberg and Lee, 2017), and attention-based visualisation for deep learning models. However, these methods are primarily designed to explain individual predictions — why a model produced a specific output for a specific input — rather than to characterise the aggregate quality and behaviour of a forecasting model across a full evaluation horizon.

Closer in spirit to the present work is research on natural language generation (NLG) for data summarisation. Systems such as SUMTIME-METEO (Reiter et al., 2003) demonstrated that meteorological forecast data could be automatically converted into natural-language summaries, and similar approaches have been explored for financial and sports data. These systems typically rely on hand-crafted templates rather than fuzzy linguistic variables, which limits their generalisability and makes it difficult to trace the relationship between numeric evidence and linguistic output.

The application of fuzzy linguistic variables specifically to forecasting explanation is less common in the literature but has precedents in decision support systems for energy management, where fuzzy rule bases have been used to translate sensor readings and model outputs into operator-readable alerts and recommendations. The present thesis is positioned within this lineage but contributes a complete, reproducible pipeline that integrates fuzzy labelling, structured rule-based explanation, narrative generation, and interactive visualisation in a single system.

---

## 3. Methodology

### 3.1 Dataset

The empirical foundation of this work is the AEP hourly electricity demand dataset, a publicly available record of actual-load measurements from the American Electric Power (AEP) transmission zone in megawatts (MW). The dataset spans multiple years of hourly observations, providing a rich basis for training and evaluating seasonal forecasting models. For this study, the data is resampled from hourly to daily frequency by summing hourly values within each calendar day, yielding a daily total demand series measured in MW. This resampling serves two purposes: it reduces computational cost, and it produces a series whose primary seasonality structure (weekly cycles) is directly interpretable and well-suited to the range of models under evaluation. The resampling and cleaning procedure — including validation of timestamp continuity, handling of any missing or anomalous hourly values, and construction of the final cleaned dataset — is performed in notebook 01 of the pipeline.

The cleaned dataset is split into a training period and a test period using a fixed hold-out strategy. All models are trained exclusively on the training split, and all reported metrics are computed on the test split, ensuring that evaluation results reflect genuine out-of-sample forecasting performance.

### 3.2 Forecasting Models

Seven forecasting models are included in the study, selected to span a range of complexity and modelling approaches, thereby providing a diverse set of error profiles for the explanation system to characterise.

The **Naive** model predicts the next value as equal to the last observed value. It serves as a lower-bound baseline: a model that cannot outperform it is not useful for forecasting. The **Seasonal Naive** model predicts each day's demand as equal to the demand on the corresponding day of the previous week, encoding the dominant weekly seasonal pattern without any parameter estimation. Both baselines are included because their contrasting performance profiles — Naive is expected to perform poorly; Seasonal Naive is expected to perform surprisingly well for a parameterless method on strongly seasonal data — provide informative anchor points for the fuzzy labelling system.

**Linear Regression** is applied with temporal features (trend index and day-of-week dummy variables) as regressors. It represents a transparent, interpretable model class whose limitations on nonlinear or complex seasonal patterns are well-documented. **ETS** (Error, Trend, Seasonality) is configured to automatically select the best-fitting additive or multiplicative combination of trend and seasonal components. **Holt-Winters Exponential Smoothing (HWES) with damping** is a closely related model that explicitly dampens the trend forecast over longer horizons, providing a hedge against over-extrapolation. **SARIMA** is fitted using automated order selection (via pmdarima) to identify the best-performing autoregressive and moving-average lag structure at both non-seasonal and seasonal frequencies. **Prophet** is applied with default settings, allowing it to infer weekly and annual seasonality components automatically.

### 3.3 Evaluation Metrics

Five metrics are computed for each model over the test period. MAE (Mean Absolute Error) and RMSE (Root Mean Squared Error) are computed in MW units, directly interpretable as typical and worst-case prediction gaps respectively. MAPE (Mean Absolute Percentage Error) and MPE (Mean Percentage Error) are expressed as percentages of actual demand, enabling relative comparison. DA (Directional Accuracy) is expressed as a percentage of time steps at which the model correctly predicted the sign of the daily change in demand.

These five metrics were selected because they collectively characterise three distinct aspects of model behaviour: magnitude of error (MAE, RMSE), relative error and bias direction (MAPE, MPE), and operational usefulness for directional decisions (DA). This multidimensional view is the raw material on which the CwW layer operates.

### 3.4 Fuzzy Universe Design and Membership Functions

The CwW pipeline introduces two primary linguistic variables: **error magnitude** (based on MAE) and **forecast bias** (based on MPE). Secondary linguistic summaries are derived from MAPE and DA.

For the **error magnitude** linguistic variable, the universe of discourse is defined over the observed range of MAE values across all seven models (approximately 44 to 781 MW). Three linguistic terms are defined: *low error*, *medium error*, and *high error*. Membership functions are implemented as triangular functions (trimf) using the `skfuzzy` library. The triangular form is chosen for its computational simplicity, its intuitive interpretability (each term has a single point of full membership and linear transition regions on either side), and its well-established precedent in applied fuzzy systems. The breakpoints are set so that low error spans the range of MAE values achieved by the best-performing models (roughly below 150 MW), high error spans the range associated with clear practical failure (roughly above 400 MW), and medium error occupies the intermediate region, with overlapping transition zones on both sides. This design reflects the domain understanding that for daily electricity demand at the scale of the AEP zone, an average absolute error of 50 MW is operationally acceptable whereas one of 700 MW is not.

For the **forecast bias** linguistic variable, the universe of discourse spans the range of MPE values (approximately -5% to +6%). Three terms are defined: *neutral*, *slight underprediction*, and *slight overprediction*. A neutral bias is assigned when MPE is close to zero (within approximately ±1%), reflecting the practical equivalence of small positive and negative percentage errors. Slight over- and underprediction terms are assigned for larger positive and negative MPE values respectively. Again, triangular membership functions are used. The choice of threshold reflects energy-sector conventions, where systematic biases exceeding 1% in magnitude are considered operationally significant.

For **MAPE** and **DA**, a five-term scale is used in the dashboard layer (excellent / good / acceptable / poor / very poor for MAPE; very high / high / moderate / low / random for DA), with crisp threshold-based assignment. This approach is used for these secondary metrics because the dashboard requires a single categorical label for display purposes.

### 3.5 Structured Explanation Rules

The structured explanation layer (notebook 05) combines the error magnitude and bias labels through a rule system. The rules are if-then statements operating on the fuzzy label outputs from notebook 04. The rule base is small but complete: it covers all combinations of error magnitude (low, medium, high) and bias (neutral, slight underprediction, slight overprediction) that appear in the data. Representative rules include:

- IF error magnitude is *low* AND bias is *neutral* THEN explanation is "The model is highly accurate and shows no consistent directional bias."
- IF error magnitude is *medium* AND bias is *neutral* THEN explanation is "The model has moderate error but no strong directional bias."
- IF error magnitude is *high* AND bias is *slight overprediction* THEN explanation is "The model has high error and tends to overpredict demand."

These structured explanations preserve direct traceability to the underlying numeric evidence: each statement is the deterministic output of a rule applied to fuzzy labels that are in turn derived from specific metric values.

### 3.6 Narrative Generation

The narrative layer (notebook 06) wraps each structured explanation in a brief contextualising narrative that positions the model relative to others in the comparison and elaborates on the implications of the assigned labels. The narrative template introduces the model by name, incorporates the structured explanation verbatim, and adds one or two sentences that interpret the label in operational terms. For instance, a "low error, neutral" model is described as one that "tracks electricity demand closely with minimal systematic error," while a "high error, slight overprediction" model is described as producing "forecasts that tend to run above actual demand."

This two-layer architecture — structured explanation followed by narrative — is a deliberate design choice. The structured explanation provides the auditable, rule-derived core; the narrative adds communicative context without obscuring the underlying evidence.

---

## 4. Implementation

### 4.1 Python Stack and Notebook Pipeline

The analytical pipeline is implemented across seven Jupyter notebooks, executed in sequence. The Python environment relies on a standard scientific computing stack: `pandas` for data manipulation and time-series resampling, `numpy` for numerical operations, `matplotlib` and `seaborn` for visualisation, `scikit-learn` for Linear Regression, `statsmodels` for ETS, HWES, and SARIMA, `prophet` for the Facebook Prophet model, `pmdarima` for automated SARIMA order selection, and `scikit-fuzzy` (`skfuzzy`) for the fuzzy membership function computations. All dependencies are pinned in `requirements.txt` and a virtual environment is provided to ensure reproducibility.

Notebook 01 loads the raw AEP CSV, validates timestamps, resamples to daily frequency, and writes the cleaned dataset to `src/data/cleaned_aep_hourly.csv`. Notebooks 02 and 03 fit all seven models, compute the five evaluation metrics, and write results to `src/data/metrics_all_models.csv`, `src/data/metrics_all_models.json`, and `src/data/forecasts_all_models.json`. Notebook 04 applies the fuzzy membership functions to the metric values and writes linguistic labels to `src/data/session04_fuzzy_labels.csv`. Notebook 05 applies the rule base to generate structured explanations, persisted in `src/data/session05_structured_explanations.csv`. Notebook 06 generates the narrative summaries, persisted in `src/data/session06_narratives.csv`. Notebook 07 runs the full pipeline end to end and writes a consolidated summary to `src/data/session07_full_pipeline_summary.csv`.

### 4.2 React Dashboard Architecture

The front-end is a React single-page application, bundled with Vite, that reads the JSON and CSV outputs produced by the notebook pipeline. The core component is `ForecastDashboard.jsx`, which exposes three tabs: "Metrics and quality," "Linguistic explanations," and "Narratives."

The metrics tab renders an interactive comparison table in which rows represent models and columns represent the five evaluation metrics plus derived linguistic quality and bias badges. Rows are sortable by any metric column. Clicking a row expands a detail panel that presents metric cards, relative error bar charts, and a sparkline of predicted versus actual demand for the selected model. The linguistic explanation tab renders the structured explanation for each model alongside its MAPE quality badge and bias badge, sourcing the text directly from `session05_structured_explanations.csv`. The narratives tab renders the full narrative text from `session06_narratives.csv`.

A lightweight CwW function is also implemented directly in `ForecastDashboard.jsx` to re-derive MAPE quality and bias labels from the raw metric values at runtime, providing a fallback when the CSV data is not available and demonstrating that the labelling logic is transparent and portable. Data flows from the notebook outputs through the `src/data/` directory into the React component via import statements, keeping the architecture simple and statically deployable.

### 4.3 Data Flow Summary

The end-to-end data flow can be summarised as: raw hourly CSV → cleaned daily series (nb01) → model forecasts and numeric metrics (nb02-03) → fuzzy linguistic labels (nb04) → structured explanations (nb05) → narrative summaries (nb06) → full pipeline summary (nb07) → React dashboard. Each stage writes to a named CSV or JSON file in `src/data/`, creating a clear audit trail from original data to final linguistic output.

---

## 5. Results

### 5.1 Model Performance

Table 1 presents the five evaluation metrics for all seven models over the test period.

**Table 1. Forecast evaluation metrics for all seven models.**

| Model             | MAE (MW) | RMSE (MW) | MAPE (%)  | MPE (%)  | DA (%)  |
|-------------------|----------|-----------|-----------|----------|---------|
| Naive             | 781.31   | 948.15    | 5.47      | +5.43    | 0.00    |
| Seasonal Naive    | 130.40   | 152.60    | 0.93      | +0.89    | 96.55   |
| Linear Regression | 483.29   | 547.70    | 3.47      | -0.02    | 48.28   |
| ETS               | 44.67    | 57.32     | 0.32      | +0.05    | 96.55   |
| HWES (damped)     | 62.69    | 79.08     | 0.45      | +0.40    | 96.55   |
| SARIMA            | 45.66    | 59.78     | 0.33      | +0.14    | 96.55   |
| Prophet           | 89.01    | 112.18    | 0.64      | +0.61    | 96.55   |

The results display a clear hierarchy. ETS and SARIMA perform best by MAE (44.67 and 45.66 MW respectively), followed closely by HWES (62.69 MW) and Prophet (89.01 MW). Seasonal Naive, despite requiring no parameter estimation, achieves a respectable MAE of 130.40 MW, demonstrating the strength of the weekly seasonal pattern in this dataset. Linear Regression is substantially weaker (MAE 483.29 MW), and the Naive model is the clear outlier in terms of error magnitude (MAE 781.31 MW).

The RMSE values follow the same ranking. The ratio of RMSE to MAE is informative: for ETS, RMSE/MAE ≈ 1.28, suggesting that large individual errors are not dramatically worse than typical errors. For the Naive model, RMSE/MAE ≈ 1.21, a similar ratio but at an order of magnitude higher absolute level.

The bias picture, captured by MPE, is notable. The Naive model has MPE = +5.43%, indicating that it systematically over-forecasts demand by more than 5 percentage points on average — a substantial and operationally consequential bias. This is explained by the structure of the model: because electricity demand tends to grow or fluctuate upward over time, a model that simply repeats yesterday's value will systematically lag behind rising demand and therefore consistently under-predict rising days; the positive MPE here reflects the particular direction of the series dynamics in the test period. Linear Regression, by contrast, achieves near-zero MPE (-0.02%), confirming that it is well-calibrated in terms of average direction, despite its large absolute error. The remaining models all have MPE values below 0.9% in magnitude, confirming minimal systematic bias.

The DA metric reveals another dimension of failure for the Naive model: at 0.00%, it correctly predicts the direction of change in demand on none of the test days. This is a mathematically predictable consequence of the model's design — a Naive forecast predicts no change, so it is wrong about direction whenever the series moves. Directional Accuracy of 0% is therefore not just a poor result; it is the theoretically minimum achievable value for a stationary point forecast. All five of the better-performing models (ETS, HWES, SARIMA, Prophet, Seasonal Naive) achieve DA of 96.55%, meaning they correctly predict whether demand will rise or fall on more than 19 out of every 20 days. Linear Regression, at 48.28%, is effectively random in directional terms.

### 5.2 Fuzzy Label Outcomes

Table 2 summarises the fuzzy linguistic labels assigned to each model by the CwW pipeline.

**Table 2. Fuzzy label assignments from the CwW pipeline.**

| Model             | MAE Label    | MPE Label            | Combined Label                    |
|-------------------|--------------|----------------------|-----------------------------------|
| Naive             | high error   | slight overprediction| high error, slight overprediction |
| Seasonal Naive    | low error    | neutral              | low error, neutral                |
| Linear Regression | medium error | neutral              | medium error, neutral             |
| ETS               | low error    | neutral              | low error, neutral                |
| HWES (damped)     | low error    | neutral              | low error, neutral                |
| SARIMA            | low error    | neutral              | low error, neutral                |
| Prophet           | low error    | neutral              | low error, neutral                |

The labelling system produces a natural three-tier grouping. Five models (ETS, SARIMA, HWES, Prophet, and Seasonal Naive) receive the "low error, neutral" combined label, placing them in the highest-quality tier. Linear Regression occupies the middle tier with "medium error, neutral." The Naive model is uniquely assigned "high error, slight overprediction," fully capturing its dual deficiencies in a linguistically compact form.

It is worth noting what the fuzzy layer adds beyond the numeric table. In the raw metrics, the difference between ETS (MAE 44.67) and Prophet (MAE 89.01) is numerically significant — Prophet has roughly twice the absolute error. Yet both are correctly categorised as "low error" because both lie well within the operationally acceptable range for this domain and scale. The fuzzy layer encodes the insight that the practically meaningful distinction is between models that are good enough and those that are not, and that within the "good enough" tier, the numeric ranking is less informative than the classification itself. Conversely, the label "high error, slight overprediction" for the Naive model communicates two independent defects — poor magnitude accuracy and systematic directional bias — that are not directly visible from the MAE column alone.

### 5.3 Structured Explanations and Narrative Summaries

The structured explanations generated by notebook 05 are direct rule applications over the label pairs in Table 2. For ETS, the explanation reads: "The model is highly accurate and shows no consistent directional bias." For the Naive model, the explanation reads: "The model has high error and tends to overpredict demand." Linear Regression is described as: "The model has moderate error but no strong directional bias." These statements are short, deterministic, and directly traceable to the fuzzy labels and, through them, to the original metric values.

The narrative layer (notebook 06) extends these statements into contextualised summaries. For ETS, the full narrative generated by the pipeline is:

> "ETS is one of the strongest models in the comparison. The model is highly accurate and shows no consistent directional bias. This suggests the model tracks electricity demand closely with minimal systematic error."

For the Naive model, the narrative reads:

> "Naive is the weakest model in this comparison. The model has high error and tends to overpredict demand. This suggests the forecasts are less accurate and tend to run above actual demand."

For Seasonal Naive, which sits in the "low error, neutral" tier despite its simplicity, the narrative states:

> "Seasonal Naive is one of the strongest models in the comparison. The model is highly accurate and shows no consistent directional bias. This suggests the model tracks electricity demand closely with minimal systematic error."

This last example is particularly informative from a communication standpoint. The raw metrics show that Seasonal Naive (MAE 130.40 MW) is considerably less accurate than ETS (MAE 44.67 MW), but both receive the same linguistic quality classification. A reader of the narrative alone would not know that ETS is approximately three times more accurate in absolute terms. This is both a feature and a limitation of the CwW approach: it communicates categorical quality distinctions effectively while abstracting away fine-grained numerical differences within a tier.

### 5.4 What the CwW Layer Reveals

A side-by-side comparison of Table 1 and Table 2 makes clear that the CwW layer adds interpretive value in at least three respects. First, it collapses a five-dimensional metric space into a two-dimensional label space (error magnitude × bias direction), reducing cognitive load without discarding the essential distinctions. Second, it makes the bias dimension of the Naive model's failure immediately visible and linguistically explicit, whereas MPE = +5.43% requires domain knowledge to interpret as a serious defect. Third, it enables a statement form — "The model is highly accurate and shows no consistent directional bias" — that can be communicated to, and understood by, stakeholders who have no familiarity with the definitions of MAE, MAPE, or MPE.

At the same time, the results also illustrate the boundaries of what the labelling system communicates. The within-tier variation among the five "low error, neutral" models (ranging from ETS at MAE 44.67 MW to Seasonal Naive at MAE 130.40 MW) is not captured by the labels. Whether this abstraction is appropriate depends on the intended audience and use case: for operational selection of a single model, the numeric detail remains essential; for communicating overall system capability to a non-technical audience, the categorical classification is more useful.

---

## 6. Conclusion

### 6.1 Summary

This thesis has developed and evaluated a Computing with Words pipeline for translating numeric forecast evaluation metrics into human-readable linguistic explanations. Applied to a seven-model comparison study on daily electricity demand data from the AEP dataset, the pipeline demonstrates that a principled combination of fuzzy membership functions, a compact rule base, and a template-driven narrative layer can faithfully represent the interpretively significant distinctions present in the numeric evaluation results while substantially improving their communicability.

The key empirical finding is that five of the seven models (ETS, SARIMA, HWES, Prophet, and Seasonal Naive) achieve a "low error, neutral" quality classification, with ETS and SARIMA performing best within this tier. Linear Regression occupies a middle tier with moderate error and no systematic bias. The Naive model is uniquely characterised as exhibiting both high error and slight overprediction, a dual deficiency that the linguistic label captures in a form that is immediately interpretable without reference to numerical thresholds. The React dashboard integrates these outputs into an interactive interface that presents the full spectrum from raw metrics to narrative summaries, demonstrating the practical deployability of the approach.

### 6.2 Limitations

Several limitations of the current work merit acknowledgment. The fuzzy universe thresholds and membership function breakpoints are set based on domain intuition and empirical inspection of the observed metric ranges rather than on a systematic elicitation procedure. A more rigorous approach would involve expert elicitation from energy-sector practitioners to calibrate the boundaries of "low," "medium," and "high" error in terms of operational consequence.

The rule base is small and constructed manually. While it is complete for the label combinations that appear in the data, it does not scale automatically to new datasets or new metric configurations. A more general system would require either a larger rule base or a learning mechanism for rule discovery.

The narrative layer uses fixed templates. While this ensures traceability — every narrative sentence can be mapped back to a rule and a label — it limits the fluency and naturalness of the output. Integration with a language model could produce more varied and contextually nuanced summaries while maintaining grounding in the underlying evidence.

Finally, the evaluation covers only the test period of a single dataset. The generalisability of the model rankings and, more importantly, the calibration of the fuzzy thresholds to other electricity markets or other demand-scale datasets has not been assessed.

### 6.3 Future Work

Several directions for future work suggest themselves naturally from the present study. First, the fuzzy universe design could be made data-driven by fitting the membership function breakpoints to historical distributions of metric values across multiple datasets, or by incorporating uncertainty quantification into the labelling process to reflect the sensitivity of label assignments near the boundaries.

Second, the explanation pipeline could be extended to cover additional metric dimensions, including RMSE-to-MAE ratio as an indicator of outlier sensitivity, and temporal stability of forecast quality (i.e., whether errors are uniformly distributed over the test period or concentrated in specific periods such as public holidays).

Third, the narrative generation layer could be replaced or augmented with a large language model grounded in the structured explanation outputs, enabling more fluid and audience-adaptive narratives while preserving the traceability guarantees of the rule-based core.

Fourth, the dashboard could be extended with user study data to empirically validate the hypothesis that linguistic explanations improve comprehension and decision quality for non-expert stakeholders, moving the work from system design to evidence-based evaluation of interpretability.

---

## References

Box, G. E. P., Jenkins, G. M., Reinsel, G. C., and Ljung, G. M. (2015). *Time Series Analysis: Forecasting and Control*. 5th ed. Wiley.

De Wit, A., and van Keulen, M. (2008). Towards natural language summarization of time series data. In *Proceedings of the Workshop on Automated Summarization for Critical Infrastructure Protection*.

Gardner, E. S. (2006). Exponential smoothing: The state of the art — Part II. *International Journal of Forecasting*, 22(4), 637–666.

Holt, C. C. (2004). Forecasting seasonals and trends by exponentially weighted moving averages. *International Journal of Forecasting*, 20(1), 5–10.

Hyndman, R. J., and Athanasopoulos, G. (2021). *Forecasting: Principles and Practice*. 3rd ed. OTexts. Available at: https://otexts.com/fpp3/

Lundberg, S., and Lee, S.-I. (2017). A unified approach to interpreting model predictions. In *Advances in Neural Information Processing Systems 30 (NeurIPS 2017)*.

Reiter, E., Sripada, S., Hunter, J., Yu, J., and Davy, I. (2003). Acquiring correct knowledge for natural language generation. *Journal of Artificial Intelligence Research*, 18, 491–516.

Ribeiro, M. T., Singh, S., and Guestrin, C. (2016). "Why should I trust you?": Explaining the predictions of any classifier. In *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*.

Smith, T. G. (2017). pmdarima: ARIMA estimators for Python. Available at: http://www.alkaline-ml.com/pmdarima

Taylor, S. J., and Letham, B. (2018). Forecasting at scale. *The American Statistician*, 72(1), 37–45.

Winters, P. R. (1960). Forecasting sales by exponentially weighted moving averages. *Management Science*, 6(3), 324–342.

Zadeh, L. A. (1965). Fuzzy sets. *Information and Control*, 8(3), 338–353.

Zadeh, L. A. (1996). Fuzzy logic = computing with words. *IEEE Transactions on Fuzzy Systems*, 4(2), 103–111.

Zadeh, L. A. (1999). From computing with numbers to computing with words — From manipulation of measurements to manipulation of perceptions. *IEEE Transactions on Circuits and Systems I: Fundamental Theory and Applications*, 46(1), 105–119.
