export const steps = [
  {
    id: '01',
    title: 'Data preparation',
    file: 'notebooks/01_data_preparation.ipynb',
    htmlFallback: '01_data_preparation.html',
    tagline: 'Clean and structure the hourly electricity demand series before forecasting.',
    run: [
      'Load the raw hourly electricity demand data.',
      'Validate timestamps and sampling frequency.',
      'Handle missing values and prepare a clean forecasting dataset.'
    ],
    results: [
      'A cleaned and time-aligned hourly dataset.',
      'Prepared inputs for downstream forecasting notebooks.',
      'Data sanity checks and preprocessing outputs visible in the notebook.'
    ],
    explanation: [
      'This notebook establishes the trusted input data used by the forecasting models.',
      'In your presentation, show the cleaning logic first, then scroll to the resulting prepared data objects.'
    ],
    presenter: 'This is the foundation stage: the point is to show that all later model quality claims depend on a carefully prepared time series.'
  },
  {
    id: '02',
    title: 'Baseline forecasting models',
    file: 'notebooks/02_baseline_forecasting_models.ipynb',
    htmlFallback: '02_baseline_forecasting_models.html',
    tagline: 'Train ETS and Prophet as the initial two forecasting models.',
    run: [
      'Split the dataset into train and test periods.',
      'Fit ETS and Prophet models.',
      'Generate forecasts and compute standard error metrics (MAE, RMSE, MAPE, MPE).'
    ],
    results: [
      'Forecast-vs-actual plots for ETS and Prophet.',
      'Model comparison metrics saved to src/data/session02_results.csv.',
      'Saved forecast outputs for the evaluation and expanded model stages.'
    ],
    explanation: [
      'This section establishes the numeric forecasting benchmark before any fuzzy or narrative explanation is added.',
      'A strong presentation flow is: model setup → forecast plots → metric comparison table.'
    ],
    presenter: 'This is the quantitative benchmark stage: it proves how good each model is before the thesis begins translating quality into words.'
  },
  {
    id: '03',
    title: 'Forecast evaluation and interpretation',
    // ── FIXED: points to the current notebook, not the checkpoint ──────────
    file: 'notebooks/03_forecast_evaluation_and_interpretation.ipynb',
    htmlFallback: '03_forecast_evaluation_and_interpretation.html',
    tagline: 'Expand the model group and produce a rich set of metrics for explanation.',
    run: [
      'Add Naive, Seasonal Naive, Linear Regression, HWES (damped), and SARIMA to ETS and Prophet.',
      'Compute MAE, RMSE, MAPE, MPE, and Directional Accuracy for all seven models.',
      'Save metrics_all_models.json and forecasts_all_models.json for the dashboard and explanation layers.'
    ],
    results: [
      'Seven-model metrics comparison table.',
      'Residual and bias diagnostics per model.',
      'JSON outputs consumed directly by the React dashboard.',
      'A clear pattern of simple → complex models for the explainability narrative.'
    ],
    explanation: [
      'This notebook bridges pure forecasting and explainability.',
      'The diverse model group gives the explanation layer something interesting to contrast: baselines fail in different ways than complex models.'
    ],
    presenter: 'Use this step to shift from model performance to model understanding — the diversity of errors is the raw material for explanation.'
  },
  {
    id: '04',
    title: 'Fuzzy labels',
    file: 'notebooks/04_fuzzy_labels.ipynb',
    htmlFallback: '04_fuzzy_labels.html',
    tagline: 'Translate numeric error values into fuzzy linguistic categories.',
    run: [
      'Take the metric outputs from notebook 03.',
      'Apply fuzzy membership logic to classify performance values.',
      'Produce linguistic labels such as excellent, good, acceptable, poor, very poor.'
    ],
    results: [
      'Metric-to-label mappings saved to src/data/session04_fuzzy_labels.csv.',
      'Fuzzy representations of forecast quality and reliability.',
      'Structured label outputs that feed the explanation system.'
    ],
    explanation: [
      'This is the first explicit Computing with Words layer in the thesis.',
      'Show how raw metrics are not discarded, but re-expressed in a human-readable linguistic form.'
    ],
    presenter: 'This is the conceptual turning point of the thesis: numbers become interpretable labels.'
  },
  {
    id: '05',
    title: 'Structured explanations',
    file: 'notebooks/05_structured_explanations.ipynb',
    htmlFallback: '05_structured_explanations.html',
    tagline: 'Build traceable explanation blocks from fuzzy performance labels.',
    run: [
      'Read the fuzzy label outputs from notebook 04.',
      'Apply rule-based combinations to generate structured explanation units.',
      'Link each explanation back to the originating metric and label.'
    ],
    results: [
      'Structured explanation statements per model.',
      'Traceable links between metrics, labels, and explanatory output.',
      'A formal interpretability layer before free-form narrative text.'
    ],
    explanation: [
      'This stage preserves traceability while making the forecast assessment easier to communicate.',
      'Present it as a bridge between formal reasoning and final human-readable summaries.'
    ],
    presenter: 'The key message here is traceability: the explanations are understandable, but still auditable.'
  },
  {
    id: '06',
    title: 'Narrative layer',
    file: 'notebooks/06_narrative_layer.ipynb',
    htmlFallback: '06_narrative_layer.html',
    tagline: 'Turn structured explanation blocks into short narrative summaries.',
    run: [
      'Read the structured explanation outputs from notebook 05.',
      'Compose concise explanatory text from the structured reasoning.',
      'Produce user-friendly narrative summaries of forecast quality and reliability.'
    ],
    results: [
      'Readable explanation paragraphs per model.',
      'Communication-ready summaries for forecast quality and reliability.',
      'Final language outputs grounded in earlier numeric and fuzzy stages.'
    ],
    explanation: [
      'This final visible stage demonstrates the thesis goal most directly: forecast quality communicated in natural language.',
      'A good demo order is structured explanation first, then narrative output, so the audience sees the full progression.'
    ],
    presenter: 'End here by showing that the full pipeline makes forecast quality easier to understand without hiding the original evidence.'
  },
  {
    id: '07',
    title: 'Full pipeline',
    file: 'notebooks/07_full_pipeline.ipynb',
    htmlFallback: '07_full_pipeline.html',
    tagline: 'Run the complete pipeline end to end from data to narrative.',
    run: [
      'Load the full notebook pipeline.',
      'Execute the complete sequence from preprocessing to narrative output.',
      'Review the final consolidated outputs.'
    ],
    results: [
      'End-to-end pipeline results.',
      'Combined outputs from all prior stages.',
      'A single place to inspect the full thesis workflow.'
    ],
    explanation: [
      'This notebook is your final integration view.',
      'Use it when you want to show the thesis as one coherent system instead of separate steps.'
    ],
    presenter: 'This is the final summary notebook: it ties the whole story together from data to explanation.'
  }
];