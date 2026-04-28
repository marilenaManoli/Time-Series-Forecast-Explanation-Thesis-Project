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
      tagline: 'Train and compare the baseline time-series forecasting models.',
      run: [
        'Split the dataset into train and test periods.',
        'Fit baseline models such as Prophet and ETS.',
        'Generate forecasts and compute standard error metrics.'
      ],
      results: [
        'Forecast-vs-actual plots.',
        'Model comparison metrics such as MAE, RMSE, MAPE, and MPE.',
        'Saved forecasting outputs for later interpretation stages.'
      ],
      explanation: [
        'This section shows the numeric forecasting benchmark before any fuzzy or narrative explanation is added.',
        'A strong presentation flow is: model setup, forecast plots, then the metric comparison table.'
      ],
      presenter: 'This is the quantitative benchmark stage: it proves how good each model is before the thesis begins translating quality into words.'
    },
    {
      id: '03',
      title: 'Forecast evaluation and interpretation',
      file: 'notebooks/03_forecast_evaluation_and_interpretation.ipynb',
      htmlFallback: '03_forecast_evaluation_and_interpretation.html',
      tagline: 'Examine residuals, metric behavior, and interpretation-oriented comparisons.',
      run: [
        'Load saved forecast outputs from the baseline stage.',
        'Compute aligned residual and performance diagnostics.',
        'Visualize the forecast quality and bias behavior over time.'
      ],
      results: [
        'Residual comparison plots.',
        'Interpretation-friendly metric summaries.',
        'A clearer basis for reasoning about reliability, not just raw error magnitude.'
      ],
      explanation: [
        'This notebook bridges pure forecasting and explainability.',
        'It helps you explain not only which model is better, but how and where forecast quality changes across the series.'
      ],
      presenter: 'Use this step to shift from model performance to model understanding.'
    },
    {
      id: '04',
      title: 'Fuzzy labels',
      file: 'notebooks/04_fuzzy_labels.ipynb',
      htmlFallback: '04_fuzzy_labels.html',
      tagline: 'Translate numeric error values into fuzzy linguistic categories.',
      run: [
        'Take the metric outputs from the earlier evaluation steps.',
        'Apply fuzzy membership logic to classify performance values.',
        'Produce linguistic labels such as low, medium, or high error.'
      ],
      results: [
        'Metric-to-label mappings.',
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
        'Read the fuzzy label outputs.',
        'Apply explanation templates or rule-based combinations.',
        'Generate structured explanation units linked back to the metrics.'
      ],
      results: [
        'Structured explanation statements.',
        'Traceable links between metrics, labels, and explanatory output.',
        'A more formal interpretability layer before free-form narrative text.'
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
        'Read the structured explanation outputs.',
        'Compose concise explanatory text from the structured reasoning.',
        'Produce user-friendly narrative summaries of forecast quality.'
      ],
      results: [
        'Readable explanation paragraphs.',
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
      tagline: 'Run the complete pipeline end to end.',
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
  