# Time-Series Forecast Explanation Thesis Project

Master’s thesis on explaining time-series forecast quality using Computing with Words and fuzzy linguistic labels.

## Overview

This project:
- Forecasts time-series data
- Evaluates prediction quality
- Converts metrics into human-readable explanations

## Workflow

1. Data preparation  
2. Forecasting  
3. Evaluation  
4. Fuzzy labels  
5. Explanations  
6. Narrative layer  
7. Full pipeline  

## Structure

    notebooks/   → full pipeline (01 → 07)
    src/data/    → outputs (metrics, labels, explanations)
    src/         → React viewer

## Setup

### Python

    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    jupyter lab

### Web App

    npm install
    npm run dev

## Goal

Make forecast results easier to understand using linguistic explanations instead of only numeric metrics.

## Author

Marilena Manoli  
University of Bern
