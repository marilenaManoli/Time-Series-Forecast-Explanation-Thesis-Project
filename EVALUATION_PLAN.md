# Expert Evaluation Plan

**Purpose:** get insightful, structured feedback from a small panel of experts on whether the Computing-with-Words explanation layer (fuzzy labels → structured explanations → narratives → LLM-rephrased narrative, plus the sensitivity/robustness analysis) actually helps someone judge and trust a forecasting model — not just whether the forecasts themselves are accurate.

This is a draft. Adjust participant count, session length, or questionnaire items freely before running it — nothing here is fixed by an ethics board or advisor requirement yet.

---

## 1. What we're trying to learn

Three separate questions, because they need different kinds of experts to answer well:

1. **Is the explanation accurate and not misleading?** (needs forecasting/energy-domain expertise — could a domain expert be led to a wrong conclusion by a label or sentence?)
2. **Is the explanation clear, sufficient, and trustworthy as an explanation, independent of forecasting expertise?** (needs HCI/explainability expertise — is this *good explanation design*, regardless of domain?)
3. **Does the threshold-sensitivity tab actually change anyone's confidence in the labels?** (both groups — does showing "this label is robust" or "this label sits near a boundary" change how much someone trusts the explanation?)
4. **Does LLM-rephrased narrative text (RQ4 / format F4) actually read better than the rule-based version, and does that change trust — without sacrificing the faithfulness participants expect?** (both groups — this is the direct RQ4 question, and it's worth testing blind: can participants even tell which version was AI-rephrased before you tell them, and does knowing change their trust?)

A mixed panel lets you triangulate: if domain experts and HCI experts disagree about whether something is clear, that's itself a finding.

## 2. Participants

- **Target: 5–8 experts total**, roughly half domain (forecasting/time-series/energy), half HCI/explainability. This is a thesis-level qualitative expert review, not a statistically powered user study — even 5–6 thoughtful sessions will surface most usability/clarity problems (consistent with general usability-evaluation guidance that most issues are found within the first 5 participants).
- One 45–60 minute session per participant.
- No formal recruitment constraints — colleagues, your advisor's network, or department contacts are fine for a thesis-level panel; just note in your methodology section how you selected them (convenience sample) since that's a standard, expected limitation to disclose.

## 3. Session structure (45 min hard cap)

Six tasks plus a ~20-item questionnaire in 45 minutes is tight. Pilot this first (§8 already recommends a pilot run) and be ready to cut the lowest-yield item if it overruns — section E ("Comparative," open-text, no fixed scale) is the easiest to drop without losing a core measurement.

| Time | Activity |
|---|---|
| 3 min | Intro: explain the thesis goal in 1–2 sentences, what you want from them (honest critique, not politeness), get verbal/written consent to take notes (see §5). |
| 2 min | Orientation: brief tour of the dashboard's 5 tabs, no leading commentary on whether it's "good." Don't mention yet that one tab involves an LLM — let task 4 introduce that. |
| 20 min | **Think-aloud task walkthrough** (§4, 6 tasks) — they narrate their reasoning as they explore. You take notes; don't intervene unless they're stuck on the mechanics of the UI itself (not the content). |
| 15 min | **Questionnaire** (§5), filled out immediately after, while the experience is fresh. |
| 5 min | Open debrief: "What's the single thing you'd change first?" — often the most useful sentence of the whole session. |

## 4. Think-aloud tasks

Give these one at a time, in order. They move from "least primed by labels" to "most primed," which lets you see whether the explanation layers actually shift judgment or just confirm what the numbers already showed.

1. **Look only at the Metrics & quality tab.** "Without reading anything else, which model would you trust for next week's operational planning, and why?" *(captures their judgment from raw numbers + badges, before seeing any generated text)*
2. **Now open the Linguistic explanations tab for that same model, then for the model ranked worst.** "Does this sentence tell you anything the table didn't? Does anything here seem inaccurate or overstated?" *(tests accuracy/sufficiency of the structured-explanation layer — domain experts especially should be pushed here: "would you ever disagree with this sentence given the numbers?")*
3. **Open the Narratives tab for the same two models.** "Compare this to the structured explanation you just read — more useful, less useful, or just longer?" *(tests whether the narrative layer adds value or just restates — directly relevant since you just removed a content-duplication bug here)*
4. **Open the LLM Narrative tab for the same two models with "Blind mode" turned on (§9 has the toggle's exact behavior).** "Read both versions. Which do you find clearer or more natural — and can you tell which one was rewritten by an AI? How confident are you?" Only after they answer, click "Reveal": "Does knowing that changes how much you'd trust it?" *(this is the direct RQ4 test — runs blind first specifically so the answer isn't just performative agreement once they know which is the 'AI one')*
5. **Open Threshold sensitivity.** Point them at Linear Regression's row (lowest confidence scores in the data). "Does this change how much you trust Linear Regression's label from the Metrics tab? Would you have wanted to know this *before* reading the label, not after?" *(tests whether the robustness information is actually load-bearing for trust, or just an appendix)*
6. **Free exploration**, 5 minutes: "Click around anything we haven't covered; tell me anything that surprised you, confused you, or that you expected to find and didn't."

## 5. Questionnaire (fill out right after the walkthrough)

Use a 5-point Likert scale (1 = strongly disagree, 5 = strongly agree) unless noted. Items 1–6 are adapted from Hoffman et al.'s Explanation Satisfaction Scale (a standard, citable instrument in XAI evaluation literature) shortened and reworded for this tool; items 7–10 are specific to this project's design.

**A. Explanation quality (per explanation layer — ask once for "Linguistic explanations" and once for "Narratives")**
1. This explanation is clear and understandable.
2. This explanation is sufficiently detailed for the decision I'd need to make.
3. This explanation seems accurate given the underlying numbers.
4. This explanation gives me a sense of how the model behaves overall, not just a single number.
5. I could communicate this explanation to a colleague without needing to re-derive it from the raw metrics myself.

**B. Trust and decision-making**
6. After seeing the explanations (not just the metrics table), my confidence in choosing a model changed. *(Followed by open text: "If yes — in which direction, and why?")*
7. The fuzzy/linguistic labels (e.g. "low error," "slight overprediction") matched my own intuition about what the numbers meant.

**C. The sensitivity/robustness tab specifically**
8. Seeing a model's confidence score (how close it sits to a category boundary) changed how much I trusted its label.
9. This information should be shown alongside the label itself, not in a separate tab.

**D. LLM-rephrased narrative (RQ4 / format F4)**
10. The LLM-rephrased version was clearer or more natural than the rule-based version. *(Likert, followed by open text: "could you tell which one was AI-rephrased before being told — what gave it away, or what made you unsure?")*
11. Knowing a narrative was AI-rephrased rather than rule-based changes how much you'd trust it in an operational setting. *(Likert)*

**E. Comparative (only ask if the participant has relevant background)**
12. *(Domain experts only)* Based on your domain knowledge, is there anything in these explanations you'd flag as misleading or technically questionable?
13. *(HCI/explainability experts only)* Compared to other explainable-AI interfaces you've seen, how does this rate for clarity? *(open text, not Likert — comparative judgment doesn't fit a fixed scale well)*

**F. Open feedback (always ask, unscaled)**
14. What's the single biggest gap between what this tool shows and what you'd actually need to trust a forecast in a real operational setting?
15. Anything else you noticed — bugs, confusing wording, missing information?

## 6. Consent and notes

No formal ethics review is required for this design (no sensitive personal data, no vulnerable population, expert participants giving professional opinions on a tool). Still, good practice for a thesis:
- Tell participants upfront their comments may be quoted (anonymized, e.g. "Domain Expert 2") in the thesis, and get a verbal "OK" — note it in your own session log.
- If you want to record audio for the think-aloud, ask explicitly and let them decline (notes-only is a fine fallback).
- Keep a simple session log per participant: date, role (domain/HCI), task notes, completed questionnaire.

## 7. Analysis plan

- **Quantitative:** average and spread (not just mean) of Likert scores per item, split by domain vs. HCI group — disagreement between groups is itself a finding worth reporting, not noise to average away.
- **Qualitative:** for the open-text items and debrief, look for *recurring* points across ≥2 participants before treating something as a pattern rather than one person's opinion — standard practice for a small qualitative panel.
- Report both: e.g. "narratives scored higher on clarity (4.2) than structured explanations (3.6), but 3 of 4 domain experts said the narrative's added length didn't add new information" — the quote backs up the number.

## 8. Before you run this

Given the bug fixes already applied (see `PROJECT_REPORT.md` §6), the dashboard now shows your actual CwW output rather than a substitute label scheme — so the feedback you collect will be about the real pipeline, not an artifact of the bug. The clean end-to-end re-run of all 9 notebooks was done on 2026-06-23 — every file in `src/data/` is current. A mechanical dry-run of all 6 tasks against the live dashboard was also done on 2026-06-23 (§9) — it caught one issue that needs a decision before the real panel. Remaining step before the first session:
1. **Run one pilot session with an actual human** (yourself or a friendly colleague) to get the part a mechanical dry-run can't: real reactions to the task wording, real timing under genuine think-aloud conditions, and the Likert items' actual usability. §9's dry-run checked whether the tasks are *performable*, not whether they *feel* natural — that still needs a person.

## 9. Mechanical dry-run findings (2026-06-23)

This was a scripted walkthrough of all 6 think-aloud tasks against the live dashboard — it checks whether each task is *technically performable as written*, not whether a human finds it clear or well-timed (that part still needs §8's human pilot). No console errors, all 5 tabs render, navigation works.

**Critical finding — Task 4's blind comparison was not actually supported by the dashboard as built.** Fixed the same day: the LLM Narrative tab now has a "Blind mode" checkbox. Turn it on before the participant looks at the tab — each model's two narratives display as "Version A" / "Version B" with the order randomized per model (so a participant can't learn "A is always the rule-based one"), and the faithfulness-flag badge is hidden too (it would otherwise hint which side is the LLM one). Click "Reveal" after the participant answers to show the real labels without reordering the text. Click "Reshuffle for next participant" between sessions to get a fresh random order. Verified in browser: hidden mode shows no real labels, reveal shows them correctly mapped to the unchanged text positions.

**Confirmed still accurate:** Task 5's premise ("point them at Linear Regression's row, lowest confidence scores") is still true against the current data — Linear Regression has the lowest confidence on all four metrics (0.31 / 0.44 / 0.31 / 0.13), well below every other model.

**Timing:** total page-interaction overhead across all 6 tasks was about 1 second — confirms the 20-minute walkthrough budget isn't constrained by the tool itself; all of it is available for actual participant reading/talking time, which a mechanical dry-run can't simulate.

**Found while re-running notebook 09 for this dry-run (not a dashboard issue, a pipeline one — see `PROJECT_REPORT.md` §4's notebook 09 section for full detail):** its output isn't deterministic — re-running it produces different LLM phrasing each time. **Do not re-run notebook 09 again before the real panel** — freeze the current `session09_llm_narratives.json` so every participant evaluates the same text. The re-run also produced three new, independent examples of the LLM adding an unstated evaluative judgment (e.g. "this bias isn't significant enough to cause major issues") with no number involved — strengthens the existing faithfulness-limitation note, doesn't change anything about the study design.
