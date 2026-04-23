# Time-Series-Forecast-Explanation-Thesis-Project

Master's Thesis: **Explaining Forecast Quality and Reliability in Time-Series Forecasting using Computing with Words**

This repository contains the notebooks and supporting outputs developed for a master's thesis on interpretable time-series forecasting. The project presents a pipeline for forecasting hourly electricity demand and for expressing forecast quality and reliability in linguistic terms.

The workflow covers data preparation, baseline forecasting, forecast evaluation, fuzzy label generation, structured explanations, and narrative summaries. The objective is to make forecast performance more interpretable while preserving a clear link to the underlying error metrics.

## Project Structure

- 01_data_preparation.ipynb
- 02_baseline_forecasting_models.ipynb
- 03_forecast_evaluation_and_interpretation.ipynb
- 04_fuzzy_labels.ipynb
- 05_structured_explanations.ipynb
- 06_narrative_layer.ipynb
- 07_full_pipeline.ipynb
- data/
- requirements.txt
- README.md

## Reproducibility

Install the dependencies listed in `requirements.txt` and run the notebooks in numerical order. Intermediate and final outputs are stored in `data/`.

## Thesis Focus

The thesis investigates how Computing with Words can support the communication of forecast quality and reliability in a more interpretable form than numeric error measures alone.
