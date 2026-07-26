yes # MarketPilot AI playbook-analysis handoff

## Purpose

Continue the product-design grill for an AI-assisted post-trade analysis pipeline. The next session should resolve the remaining classification and reporting rules, then decide whether to synthesize a PRD or proceed into architecture.

## Repository context

- MarketPilot is a post-trade-only futures journal. Use the language in `CONTEXT.md`.
- The implementation seam already exists at `app/api/ai/analyze-trades/route.ts`, but it returns `501 Not implemented`.
- The current persistence model is in `prisma/schema.prisma`: Playbooks store `rules` as strings; Journal Entries store Confluences as free text; Trades store Playbook Assignment, Entry Time, Risk Dollars, and R Multiple.
- Relevant existing decisions:
  - `docs/adr/0002-post-trade-only-workflow.md`
  - `docs/adr/0006-derive-playbook-performance.md`
  - `docs/adr/0007-store-confluences-as-free-text.md`
  - `docs/adr/0009-keep-journal-as-review-surface.md`
  - `docs/adr/0014-analytics-over-completed-trades.md`
  - `docs/adr/0017-defer-ai-until-journal-model-stabilizes.md`

## Decisions reached

### Product purpose

- The AI system is for reflection and improvement over completed trades, not market prediction or live trade recommendations.
- Users should be able to analyze a Playbook or an Entry-Time Range such as weekly, monthly, or yearly.
- The system should use Playbook Assignment, Playbook Rules, Confluences, Trade Ideas, Entry Time, Risk Dollars, and R Multiple to identify recurring strengths, deviations, and outcome associations.

### Analysis responsibility

- Application code should calculate metrics over the complete selected trade cohort. The Agent should interpret semantic text and explain deterministic results; it should not invent arithmetic.
- Do not use only five high-, low-, and middle-R trades as the analysis dataset. Representative trades may support the narrative, but complete-cohort statistics must drive findings.
- Classification and outcome analysis should be separate stages. The Agent should classify rule adherence without seeing R Multiple, then the statistical stage should join the locked classification to outcomes. This prevents wins from excusing deviations and losses from making the classifier overly critical.

### Playbook as the baseline

- The user's Playbook—not past winning trades—is the declared strategy baseline.
- The Agent may suggest Playbook definitions or normalized signals, but it must not silently redefine the baseline.
- Playbook Rules describe the required setup conditions and execution triggers that make a trade fit the strategy.
- Use one typed Playbook Criteria model internally. The agreed Rule Importance values are `required`, `supporting`, and `invalidating`.
  - Confirmed absence of a required criterion creates a deviation.
  - Confirmed presence of an invalidating criterion creates a deviation.
  - Absence of a supporting criterion does not create a deviation.
- Criteria evaluated from reflection should include short, playbook-specific examples so users and the Agent share the same meaning. The user wants examples such as `e.g. ...`; whether AI-drafted examples are mandatory and require approval remains unresolved.

### Confluences and observations

- Preserve the user's free-text Confluences narrative.
- Normalize semantically equivalent phrases into Confluence Signals for comparison, for example “VWAP held,” “bounce from VWAP,” and “VWAP support.”
- For each relevant criterion, observations need `present`, `absent`, or `unknown` states.
  - Explicit supporting language may suggest `present`.
  - Explicit contradiction may suggest `absent`.
  - Missing or vague documentation is `unknown`, never `absent`.
- Unknown observations reduce Confluence Coverage and should not create Playbook Drift.
- The proposed observation provenance values are user-confirmed, AI-suggested, and default/unknown. Whether unconfirmed AI suggestions may affect scoring remains unresolved; the recommendation was no.
- Entry Conviction is reflective context about the trader's recalled judgment at Entry Time, distinct from AI certainty and statistical reliability. The user wants it presented within the Confluences area. Its structured scale and persistence are not yet resolved.

### Assignment, alignment, and drift

- Playbook Assignment records the strategy the trader intended to follow. It does not prove adherence.
- A trade assigned to a Playbook can still contain a confirmed Playbook Deviation.
- A single confirmed violation is a Playbook Deviation. Playbook Drift is a sustained pattern of deviations across multiple trades, not one losing trade or a losing streak.
- Proposed review states are:
  - `aligned`: all required criteria are confirmed and no invalidating criterion is present.
  - `deviated`: a required criterion is confirmed absent or an invalidating criterion is confirmed present.
  - `unverified`: evidence is insufficient.
- The user explicitly decided that confirmed deviating trades must not contribute to Official Playbook Performance, even if they win. They must remain in the Trade Log, account-wide analytics, assigned-trade totals, drift analysis, and aligned-versus-deviated comparisons.
- Outcome language must report association, not causation. Example: compare average/median R and win rate for aligned versus deviating cohorts without claiming that the deviation caused the outcome.

## Current unresolved question

Should Official Playbook Performance exclude both confirmed deviations and unverified trades?

Recommended answer: yes. Official Playbook Performance should include only confirmed aligned trades. Always disclose assigned, aligned, deviated, and unverified counts so exclusions are visible. Account-wide analytics should continue to include every completed trade.

## Later questions to grill one at a time

1. Must users confirm every AI-suggested observation before it can affect alignment or drift?
2. Are present/absent/unknown examples mandatory for every Agent-evaluated criterion, and may AI draft them for approval?
3. How should ordered setup conditions and execution triggers be represented without making Playbook authoring burdensome?
4. What minimum scorable trade count and comparison cohort are required before labeling a pattern as emerging or sustained Playbook Drift?
5. How should Insight Strength combine sample size, Confluence Coverage, recurrence, outcome magnitude, and contradictory evidence?
6. What structured analysis/report response should the UI render, and should reports be persisted as immutable snapshots or generated on demand?
7. What privacy, retention, model-provider, cost, idempotency, and failure-handling constraints apply to AI runs?

## Documentation changes made during the grill

`CONTEXT.md` is modified but uncommitted. Inspect its diff rather than reproducing definitions elsewhere. The session added or refined these terms:

- Confluence Signal
- Expected Confluence Signal
- Entry Conviction
- Playbook Criterion
- Rule Importance
- Playbook Alignment
- Playbook Deviation
- Playbook Drift
- Playbook Rule
- Playbook Assignment

No ADR was created yet. Once treatment of unverified trades is resolved, supersede or amend `docs/adr/0006-derive-playbook-performance.md`, because it currently derives Playbook Performance from every assigned trade. The structured-analysis requirement also fulfills the future condition anticipated by `docs/adr/0007-store-confluences-as-free-text.md`; preserve free text while recording the new normalized observation model in a new ADR if the remaining trade-offs are accepted.

Repository note: `testcases/ai-analyze-trades.test.ts` still includes an open-trade test case from the old model, which conflicts with the post-trade-only decision in `docs/adr/0002-post-trade-only-workflow.md`. Revisit it during implementation.

## Suggested skills

- `mattpocock-skills:grill-with-docs` — continue the interview one question at a time while maintaining `CONTEXT.md` and creating ADRs only when decisions crystallize.
- `mattpocock-skills:domain-modeling` — use through the grilling flow to preserve the assignment/alignment/deviation/drift vocabulary.
- `mattpocock-skills:codebase-design` — after product rules are resolved, design the classifier, deterministic analytics, evidence-selection, and report-generation module boundaries.
- `mattpocock-skills:to-prd` — synthesize the completed design after the grill.
- `mattpocock-skills:to-issues` — split the accepted PRD into vertical implementation slices.

