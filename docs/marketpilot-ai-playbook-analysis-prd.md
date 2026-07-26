## Problem Statement

Traders can record completed futures Trades, assign Playbooks, and reflect through Trade Ideas and Confluences, but MarketPilot cannot yet explain whether the trader followed the assigned Playbook or how rule-following relates to results. Existing Playbook performance treats every assigned Trade as if the Playbook was followed. That hides the difference between Playbook Assignment and Playbook Alignment and can make a strategy appear better or worse because of Trades that broke its rules.

Large histories create a second problem. A trader may want to analyze thousands of completed Trades without waiting for one oversized AI request, weakening the AI's review, paying to process unchanged Trades again, or trusting arithmetic invented by a language model. Traders also need missing journal evidence, AI uncertainty, privacy, and processing failures to remain visible instead of being silently converted into confident findings.

MarketPilot needs an AI-assisted, post-trade analysis workflow that reviews the full selected cohort, keeps outcome calculations deterministic, requires user confirmation before AI suggestions affect official metrics, scales to large histories, and explains findings in plain language without turning the Journal into a prediction or live-trading product.

## Solution

MarketPilot will let an authenticated trader analyze completed Trades for exactly one Playbook, optionally narrowed by an Entry-Time Range. A run cannot span multiple Playbooks or use an Entry-Time Range without a selected Playbook. Each Trade is reviewed against the approved Playbook Criteria baseline version applicable to it. AI classifies whether the available evidence shows each criterion as present, absent, or unknown without seeing R Multiple, Realized P&L, or Outcome Status. The trader confirms or corrects those suggestions before they can affect Playbook Alignment, Playbook Deviation, Playbook Drift, or Official Playbook Performance.

Application code joins locked observations to outcomes and calculates exact full-cohort metrics. Official Playbook Performance includes only confirmed aligned Trades. Confirmed deviating and unverified Trades remain visible in assigned-trade counts, the Trade Log, account-wide analytics, review queues, and aligned-versus-deviated comparisons.

Playbook Criteria are drafted and approved as one atomic, versioned baseline. Editing creates a draft while the existing approved baseline remains active. A newly approved baseline applies prospectively, and each Trade retains the baseline version active when it was logged or assigned. The first typed baseline may be explicitly applied to existing historical Trades. Any later reassessment of historical Trades against a newer baseline is a deliberate, separately labeled analysis rather than an automatic rewrite of Official Playbook Performance.

For large histories, MarketPilot divides unclassified Trades into bounded background batches. Each batch returns structured per-Trade observations rather than a narrative report. Saved AI suggestions are reused until a classification-relevant Trade field, assigned Playbook, applicable baseline criterion, or classifier version changes. User-confirmed decisions are stored separately from model-versioned suggestions and survive classifier or model upgrades while the underlying Trade evidence, Playbook Assignment, and applicable baseline remain unchanged. Application code reduces all saved observations into exact statistics, and a final AI pass receives only those statistics and a small evidence set to write a concise report. Reports are immutable snapshots, record the baseline version applied to each Trade, and create a new version after later changes.

The default report shows no more than three main findings, a rule-following versus rule-breaking comparison, the strongest repeated behavior, the most common rule break, and Trades awaiting confirmation. Supporting criteria, journal evidence, calculations, and related Trades remain available through progressive disclosure.

## User Stories

1. As a trader, I want every analysis limited to exactly one Playbook, so that findings compare Trades governed by the same strategy.
2. As a trader, I want to optionally narrow the selected Playbook's completed Trades by an Entry-Time Range, so that I can review a week, month, year, custom period, or all available history.
3. As a trader, I want Playbook Assignment treated as intent rather than proof of rule-following, so that assigned Trades do not automatically count as aligned.
4. As a trader, I want the approved Playbook Criteria baseline applicable to each Trade to define its review, so that past winning Trades and later rule changes do not silently redefine the strategy I was following.
5. As a trader, I want each Playbook Criterion classified as required, supporting, or invalidating, so that the review reflects the purpose of the rule.
6. As a trader, I want a confirmed missing required criterion to create a Playbook Deviation, so that required rules remain meaningful.
7. As a trader, I want a confirmed present invalidating criterion to create a Playbook Deviation, so that invalidation rules remain meaningful.
8. As a trader, I want a missing supporting criterion to avoid creating a Playbook Deviation, so that optional context is not treated as a broken rule.
9. As a trader, I want missing or vague evidence classified as unknown rather than absent, so that incomplete journaling is not mistaken for rule-breaking.
10. As a trader, I want every AI-reviewed criterion to include approved examples of followed, broken, and unclear evidence, so that the AI and I use the same definition.
11. As a trader, I want the AI to draft criterion examples for my approval, so that setup remains fast without silently changing my Playbook.
12. As a trader, I want rule explanations to quote the relevant Playbook-specific requirement, so that findings such as entering before breakout-candle confirmation are easy to understand.
13. As a trader, I want ordered setup conditions and execution triggers represented as a short approved checklist only where sequence matters, so that the review respects the order of my process.
14. As a trader, I want the ordered checklist and criterion examples collapsed by default, so that Playbook pages remain uncluttered.
15. As a trader, I want AI suggestions to remain unverified until I confirm them, so that model mistakes cannot change my official results.
16. As a trader, I want to see the exact Trade Journal evidence behind an AI suggestion, so that I can judge whether it is correct.
17. As a trader, I want to correct an inaccurate AI observation, so that later analysis uses my confirmed interpretation.
18. As a trader, I want similar suggestions grouped by Playbook Criterion, so that I can review a large history efficiently.
19. As a trader, I want to remove incorrect Trades from a group and confirm the selected Trades together, so that bulk review remains under my control.
20. As a trader, I want unreviewed suggestions to remain unverified after a grouped action, so that no Trade is approved automatically.
21. As a trader, I want a Trade marked aligned only when every required criterion is confirmed present and every invalidating criterion is confirmed absent, so that Official Playbook Performance has a strict meaning.
22. As a trader, I want a Trade marked deviated when a required criterion is confirmed absent or an invalidating criterion is confirmed present, so that rule breaks remain visible even when the Trade wins.
23. As a trader, I want a Trade marked unverified when any required or invalidating criterion remains unknown or unconfirmed and no confirmed deviation exists, so that missing information is disclosed without hiding known rule breaks.
24. As a trader, I want Official Playbook Performance calculated only from confirmed aligned Trades, so that it represents execution of the declared strategy.
25. As a trader, I want confirmed deviating Trades excluded from Official Playbook Performance even when profitable, so that wins do not excuse rule breaks.
26. As a trader, I want unverified Trades excluded from Official Playbook Performance, so that missing evidence does not count as compliance.
27. As a trader, I want assigned, aligned, deviated, and unverified counts shown together, so that every exclusion is visible.
28. As a trader, I want every completed Trade retained in account-wide analytics, so that the account history remains complete.
29. As a trader, I want aligned and deviated cohorts compared by count, win rate, average R Multiple, and median R Multiple, so that I can see how the outcomes differ.
30. As a trader, I want reports to describe outcome associations rather than claim causation, so that the analysis does not overstate what journal data proves.
31. As a trader, I want one Playbook Deviation treated as a single event rather than Playbook Drift, so that one mistake is not labeled as a sustained behavior.
32. As a trader, I want a possible-drift warning only after the same confirmed rule break appears in two of the last five verified Trades, so that isolated mistakes do not create warnings.
33. As a trader, I want ongoing Playbook Drift shown only after at least ten verified Trades and the same rule break appears in at least three of the last ten, so that the label reflects a repeated pattern.
34. As a trader, I want unverified Trades and outcomes excluded from drift detection, so that missing evidence and losses do not manufacture drift.
35. As a trader, I want findings labeled Limited, Moderate, or Strong evidence, so that I know how much data supports them.
36. As a trader, I want Strong evidence to require at least ten verified Trades, at least 80% confirmed relevant journal coverage, and at least three occurrences, so that the label is difficult to earn.
37. As a trader, I want performance comparisons to require at least five Trades in each cohort before reaching Strong evidence, so that a large outcome difference from tiny groups does not look reliable.
38. As a trader, I want contradictory examples to lower Evidence Strength, so that inconsistent patterns remain visible.
39. As a trader, I want a plain-language explanation under “Why this rating?”, so that the main report stays concise.
40. As a trader, I want optional Entry Conviction recorded as Low, Medium, or High inside Confluences, so that I can preserve my recalled judgment at Entry Time.
41. As a trader, I want Entry Conviction entered by me rather than inferred by AI, so that it remains reflective context rather than model speculation.
42. As a trader, I want Entry Conviction kept separate from Playbook Alignment and Evidence Strength, so that conviction does not prove rule-following or analysis reliability.
43. As a trader, I want my original Confluences preserved as free text, so that normalized analysis does not replace my own reflection.
44. As a trader, I want equivalent phrases normalized into Confluence Signals, so that recurring factors such as VWAP support can be compared across Trades.
45. As a trader, I want the default report limited to the most useful findings, so that the page is not crowded with instructions.
46. As a trader, I want to expand a finding to see its criterion, evidence, calculations, and related Trades, so that details remain available when needed.
47. As a trader, I want a full-analysis view beyond the three main findings, so that concise presentation does not hide valid results.
48. As a trader, I want reports saved as immutable snapshots, so that later edits do not rewrite what an earlier review showed.
49. As a trader, I want an old report marked Out of date when its source data changes, so that I do not mistake it for the current analysis.
50. As a trader, I want a new analysis to create a new report version, so that I can compare my reviews over time.
51. As a trader, I want every selected Trade included in the calculations, so that large histories are not reduced to a misleading sample.
52. As a trader, I want large histories processed in resumable background batches, so that one oversized request does not block the product or weaken classification.
53. As a trader, I want to see processing progress, so that I know how many selected Trades have completed review.
54. As a trader, I want completed batches preserved when another batch fails, so that successful work is not repeated.
55. As a trader, I want only failed batches retried, so that recovery is faster and less expensive.
56. As a trader, I want duplicate submissions to reuse the same active run, so that repeated clicks do not create duplicate processing or charges.
57. As a trader, I want saved classifications reused when I add new Trades, so that only new or stale Trades require AI review.
58. As a trader, I want changing only R Multiple to recalculate results without reclassifying rule-following, so that outcome corrections remain inexpensive and unbiased.
59. As a trader, I want a changed Trade Journal, Playbook Assignment, or applicable Playbook Criterion to invalidate only affected classifications and confirmations, so that stale judgments are not reused.
60. As a trader, I want final statistics recalculated over the full selected cohort after new classifications arrive, so that averages, medians, rankings, and counts remain exact.
61. As a trader, I want a pre-analysis check for large runs showing selected, reusable, and newly processed Trade counts, so that I understand the work before starting.
62. As a trader, I want estimated processing time and any applicable usage limit or charge shown before a large run, so that the analysis does not surprise me.
63. As a trader, I want an incomplete report clearly labeled when some Trades cannot be processed, so that partial coverage is not presented as complete.
64. As a trader, I want technical failures to reduce Evidence Strength where relevant, so that reliability reflects missing processing.
65. As a trader, I want only selected Playbook and Trade data sent for AI processing, so that unrelated journal history remains private.
66. As a trader, I want my name, email, account details, and unrelated Trades excluded from provider payloads, so that the provider receives no unnecessary identity data.
67. As a trader, I want clear notice that selected Trade Journal text will be processed by an AI provider, so that the data flow is transparent.
68. As a trader, I want a provider that does not train on my journal data and retains it only as long as processing requires, so that private reflection remains private.
69. As a trader, I want deleting a Trade or account to delete its saved AI observations and reports from MarketPilot, so that deletion applies to derived data too.
70. As a trader, I want MarketPilot to choose one approved model configuration, so that analysis remains consistent and costs remain predictable.
71. As a trader, I want model and analysis-version details available under Report details, so that the report is auditable without cluttering the main page.
72. As a trader, I want the analysis focused on reflection over completed Trades, so that it never becomes a live recommendation, market prediction, or instruction to enter a Trade.
73. As an account owner, I want every analysis query scoped to my user identity before provider processing, so that another user's Trades can never enter my report.
74. As a trader, I want to approve Playbook Criteria as one complete baseline rather than as independent rules, so that analysis never uses a partial or mixed strategy definition.
75. As a trader, I want my current approved baseline to remain active while I edit a draft replacement, so that unfinished changes do not interrupt analysis.
76. As a trader, I want analysis blocked until the selected Playbook has an approved baseline, so that MarketPilot never scores Trades against unfinished criteria.
77. As a trader, I want each Trade to retain the baseline version active when it was logged or assigned, so that later Playbook changes do not rewrite historical alignment.
78. As a trader, I want the first approved typed baseline applied to existing Trades only after I explicitly choose that historical coverage, so that migration does not silently invent an old rule set.
79. As a trader, I want any reassessment of historical Trades against a newer baseline clearly labeled as retroactive, so that it cannot be confused with Official Playbook Performance under the rules active at the time.
80. As a trader, I want my confirmed or corrected observations preserved after MarketPilot changes its internal classifier or model, so that I do not have to repeat decisions about unchanged evidence.
81. As a trader, I want each Analysis Report to record the exact baseline version applied to every Trade, so that historical findings remain auditable.

## Implementation Decisions

- Use one deep analysis module as the primary seam. Its interface starts an authenticated analysis for exactly one Playbook and an optional Entry-Time Range, returns or attaches to a run, exposes progress, accepts observation confirmations or corrections, and returns an immutable report snapshot. Batching, caching, retries, deterministic reduction, provider calls, and snapshot creation remain inside its implementation.
- Preserve the existing authenticated analysis request as the highest externally testable entry point. Starting a run returns a stable run identifier and status rather than waiting synchronously for a large report. Reading that run returns preflight counts, progress, review requirements, errors, and the final snapshot when available.
- Scope every selection and persisted record to the authenticated user before any provider call. A caller cannot supply another user's Trade IDs or access another user's run.
- Analyze only completed futures Trades. Entry-Time Range filtering uses Entry Time. Open, planned, partial, and hypothetical positions do not exist in this analysis domain.
- Require exactly one authenticated-user Playbook for every run. An Entry-Time Range is optional and can only narrow that Playbook's completed Trades. Reject range-only and multi-Playbook analysis requests. The selected complete cohort is the basis for counts and calculations.
- Keep the approved Playbook Criteria baseline applicable to each Trade as the declared strategy. Winning Trades, AI suggestions, later baseline versions, and outcome statistics cannot silently redefine it.
- Extend Playbooks with atomic, versioned criteria baselines while retaining plain-language authoring. Each baseline contains versioned, typed Playbook Criteria with Playbook-specific wording, criterion type, Rule Importance, followed/broken/unclear examples, optional sequence position, and stable identity across baseline versions.
- Draft and approve a Playbook Criteria baseline as one unit. Editing an approved baseline creates a draft copy while the existing version remains active. A Playbook without an approved baseline cannot start analysis.
- Record the applicable baseline version on each Trade when it is logged or assigned. Newly approved baselines apply prospectively. Applying the first typed baseline to existing historical Trades requires an explicit user action.
- Treat reassessment of historical Trades against a newer baseline as a deliberate, separately labeled analysis. It cannot silently replace the baseline-bound alignment used by Official Playbook Performance.
- Rule Importance values are exactly required, supporting, and invalidating. Confirmed absence of required or confirmed presence of invalidating creates Playbook Deviation. Absence of supporting does not.
- AI may draft a complete baseline containing typed criteria, examples, and ordered checklists, but no part of that draft can become a scoring baseline until the trader approves the baseline as a unit.
- Store criterion examples and ordered steps, but collapse them behind “How this rule is checked” except during approval or evidence review.
- Preserve Confluences as the user's free-text Journal Entry field. Persist normalized Confluence Signals and Expected Confluence Signals as separate analysis records rather than replacing the source text.
- Add optional Entry Conviction to the Journal Entry using Low, Medium, and High. It is user-entered reflective context and never inferred by AI.
- Persist a versioned AI suggestion for each relevant Trade and applicable Playbook Criterion. A suggestion records present, absent, or unknown; supporting source text; classifier version; baseline and criterion versions; classification-input version; and timestamps.
- Persist the trader's confirmation or correction as a separate user decision bound to the Trade, applicable baseline criterion, and classification-relevant evidence version rather than to the classifier version. Only a user-confirmed decision can produce confirmed Playbook Alignment, Playbook Deviation, or Playbook Drift.
- Preserve a user-confirmed decision across classifier, prompt, or model upgrades while its Trade evidence, Playbook Assignment, and applicable baseline criterion remain unchanged. A user may explicitly reopen a decision. If a product change alters the criterion's meaning, represent that as a new baseline version rather than invalidating decisions through a classifier-version change.
- Derive review states deterministically. Aligned means every required criterion is confirmed present and every invalidating criterion is confirmed absent. Deviated means at least one required criterion is confirmed absent or at least one invalidating criterion is confirmed present; a confirmed deviation takes precedence even when another required or invalidating criterion remains unknown or unconfirmed. A Trade is unverified when no confirmed deviation exists and at least one required or invalidating criterion is unknown or unconfirmed. Supporting criteria do not determine the review state.
- The semantic classifier receives only the approved criterion and classification-relevant execution and Journal evidence. It must not receive R Multiple, Realized P&L, Outcome Status, or any equivalent outcome indicator. Risk Dollars is included only where it is relevant evidence for a risk criterion.
- Freeze confirmed classifications before joining outcomes. The same classification evidence must produce the same suggested observation regardless of whether a Trade won, lost, or broke even.
- Application code, not AI, calculates cohort sizes, wins, losses, breakevens, win rate, average R Multiple, median R Multiple, Realized P&L aggregates, coverage, recurrence, and cohort comparisons.
- Official Playbook Performance includes confirmed aligned Trades only. Assigned, deviated, and unverified counts remain separately visible. Account-wide analytics continue to include every completed Trade.
- Amend the existing decision “Derive playbook performance from assigned trades”: definition metrics remain derived rather than stored, but Official Playbook Performance is derived from confirmed aligned Trades; assigned-trade performance remains available only as a clearly named comparison.
- Outcome explanations use association language. They may say that confirmed aligned Trades averaged a different R Multiple or win rate from confirmed deviating Trades, but they may not claim that a rule break caused an outcome.
- Detect possible drift when the same confirmed Playbook Deviation appears in at least two of the last five verified Trades for one Playbook. Do not show any drift warning before five verified Trades exist.
- Detect ongoing Playbook Drift only when at least ten verified Trades exist and the same confirmed Playbook Deviation appears in at least three of the last ten. Unverified Trades and R Multiple do not affect the drift label.
- Present Evidence Strength as Limited, Moderate, or Strong rather than a percentage. The application calculates the label; AI only explains it.
- Use these initial deterministic Evidence Strength gates: Limited when there are fewer than five verified Trades, less than 60% confirmed relevant coverage, or fewer than two occurrences; Moderate when there are at least five verified Trades, at least 60% coverage, and at least two occurrences but the Strong gates are not met; Strong when there are at least ten verified Trades, at least 80% coverage, and at least three occurrences. Contradictory evidence can lower a tier. Performance comparisons cannot be Strong unless each cohort contains at least five Trades.
- Keep Entry Conviction separate from classifier certainty and Evidence Strength. It may be analyzed as user-entered context but cannot determine Playbook Alignment.
- Default reports show no more than three main findings plus cohort counts and review needs. Details remain available through expandable evidence and a full-analysis view.
- Findings use plain language in the user interface. Prefer “rule-following” and “rule-breaking” in summary copy, while retaining Playbook Alignment and Playbook Deviation as internal domain terms. Each explanation names the exact Playbook rule.
- Process unclassified or stale Trades in bounded, independently retryable background batches. Batch size and concurrency are implementation configuration constrained by provider context, rate, latency, and cost limits.
- Each classifier batch returns structured per-Trade observations, not batch prose or batch arithmetic. Batch order and partition size cannot change the reduced result.
- Do not average batch averages or combine batch medians. Deterministic reduction operates on the complete set of per-Trade records.
- Sampling is permitted only when selecting supporting evidence for final narrative generation. Sampling cannot replace full-cohort classification or deterministic calculations.
- Normalize semantically equivalent Confluence Signal suggestions before global recurrence counts are calculated, so a pattern spread across batches is not lost under different phrases.
- Cache AI suggestions by user, Trade, classification-relevant input version, assigned Playbook, applicable baseline and criterion versions, and classifier version. Reuse a cached suggestion only when all relevant versions still match.
- Adding Trades classifies only the new Trades. Editing classification-relevant Journal or execution data, changing Playbook Assignment, or changing the applicable baseline criterion marks only affected suggestions and user decisions stale. A classifier, prompt, or model upgrade refreshes only unconfirmed suggestions and does not invalidate user-confirmed decisions. Changing only R Multiple reuses classification and confirmation while recalculating outcomes.
- A new analysis always recalculates deterministic metrics over the full selected cohort using reusable and newly produced observations. It does not append numbers to an earlier narrative report.
- Save every completed analysis as an immutable snapshot containing its selected Playbook, optional Entry-Time Range, the baseline version applied to each Trade, source versions, counts, metrics, Evidence Strength, findings, evidence references, incomplete-state details, model configuration, and analysis version. Later changes mark earlier snapshots Out of date without mutating them.
- Use one approved production model configuration initially. Do not expose model choice in the primary workflow. Record model and analysis versions under Report details.
- The final report writer receives deterministic aggregate results, coverage and contradiction data, and a bounded set of supporting and counterexample evidence. It does not receive the entire raw cohort and cannot change locked classifications or metrics.
- Provide a grouped observation-review workflow. Users can inspect evidence, deselect incorrect suggestions, correct records, and confirm selected observations together. Unselected suggestions remain unverified.
- Before a large run, calculate a preflight summary with selected Trade count, reusable observation count, new or stale processing count, estimated duration, and applicable usage limit or charge. The configured product-cost policy defines when confirmation is required; small runs may start immediately.
- Use an idempotency token for each user-initiated start action. Repeated submissions with the same token return the same run. A deliberate later run can create a new snapshot while reusing cached observations.
- Preserve completed batches and retry only failed batches. After bounded retries, unresolved records become processing-unavailable and contribute to unverified and incomplete counts. A report with unavailable records must be labeled incomplete and its Evidence Strength adjusted.
- Provider payloads use an explicit allowlist. Classification payloads include only selected Playbook Criteria and relevant Trade Journal or execution evidence. Narrative payloads include only calculated results and selected evidence. User identity, account data, unrelated Trades, and unrelated Journal Entries are excluded.
- Require provider terms and configuration that prohibit training on submitted journal data and minimize provider retention to processing needs. Disclose AI processing before a run.
- Cascade deletion of a Trade or account through cached observations, confirmations, batches, and report data owned by MarketPilot. Deleting one Trade makes snapshots that referenced it unavailable or redacted according to the deletion design; deletion obligations take priority over snapshot immutability.
- Preserve post-trade-only behavior. The analysis may identify recurring strengths, Playbook Deviations, Confluence Signal associations, and review opportunities, but it cannot predict markets, recommend live entries, or provide real-time trade instructions.

## Testing Decisions

- Test external behavior through the highest existing authenticated analysis seam. Tests should start a run, provide deterministic provider-adapter responses, inspect progress or review states, confirm observations, and read the final snapshot. Do not couple tests to private queue helpers, batch-loop structure, prompt wording, or internal function calls.
- Treat the analysis module interface as the main test surface. Use a production AI-provider adapter and a deterministic fake adapter at the provider seam, and keep provider-specific request mechanics outside core behavior tests.
- Use the current authenticated analytics route and deterministic analytics report tests as prior art for date-range parsing, user scoping, empty states, and exact outcome calculations.
- Use the current Playbook performance tests as prior art for derived rather than persisted performance, then update expectations so Official Playbook Performance includes confirmed aligned Trades only and assigned totals remain separate.
- Replace the existing open-Trade AI testcase because it conflicts with the post-trade-only domain. The replacement should verify that analysis operates only on completed Trade records and exposes no open-position state.
- Test authentication failure and cross-user isolation before any fake provider call. Verify that foreign Trade IDs, Playbooks, runs, observations, and snapshots are inaccessible.
- Test that every run requires exactly one owned Playbook, permits an optional Entry-Time Range, and rejects missing-Playbook, range-only, and multi-Playbook requests.
- Test the Rule Importance truth table across required, supporting, and invalidating criteria with present, absent, and unknown observations. Prove that alignment requires confirmed absence for every invalidating criterion, unknown or unconfirmed decision-relevant criteria block alignment, and any confirmed deviation takes precedence.
- Test that missing evidence produces unknown, never absent, and that an AI-suggested observation cannot affect alignment, drift, or Official Playbook Performance before confirmation.
- Test that identical classification evidence with different R Multiples produces identical classifier input and observation state. Assert that outcome fields are absent from the classifier-adapter payload.
- Test deterministic alignment derivation for aligned, deviated, and unverified states, including multiple criteria and ordered criteria.
- Test Official Playbook Performance, assigned-trade totals, account-wide analytics, and aligned-versus-deviated comparisons from the same cohort to prove each inclusion rule.
- Test exact average, weighted average, median, win-rate, and count calculations with unequal batch sizes. Verify that different batch sizes, batch order, and retry order produce the same final metrics.
- Test possible and ongoing Playbook Drift thresholds at their lower bounds, one below each bound, outside the rolling window, and with intervening unverified Trades.
- Test Limited, Moderate, and Strong Evidence Strength gates, coverage thresholds, recurrence thresholds, contradictory evidence downgrades, and minimum cohort sizes for performance comparisons.
- Test Confluence Signal normalization across different phrases and across different classifier batches so global recurrence is not lost.
- Test Entry Conviction persistence as optional Low, Medium, or High and prove that it does not affect Playbook Alignment or Evidence Strength.
- Test atomic baseline drafting and approval, Playbook-specific examples, sequence ordering, analysis blocking without an approved baseline, and preservation of the active baseline while a replacement remains in draft.
- Test prospective baseline activation, explicit first-baseline coverage for existing Trades, baseline capture when a Trade is logged or assigned, and separately labeled retroactive reassessment.
- Test grouped confirmation with mixed accepted, deselected, corrected, and untouched observations. Verify that only selected accepted records become user-confirmed.
- Test cache reuse by running an analysis twice, adding new Trades, changing only R Multiple, changing Journal evidence, changing Playbook Assignment, activating a prospective baseline, and changing classifier versions. Assert exactly which fake-provider classifications run again and which user decisions remain effective.
- Test that internal classifier, prompt, and model upgrades can refresh unconfirmed suggestions without invalidating confirmed or corrected user decisions. Verify that relevant Trade evidence, Playbook Assignment, and applicable baseline changes do invalidate those decisions.
- Test idempotent duplicate start requests, deliberate new runs, active-run attachment, and immutable snapshot versioning.
- Test background progress, partial completion, bounded retries, permanent batch failure, incomplete-report labeling, and preservation of successful batch results.
- Test report staleness after source changes and prove that an old snapshot remains unchanged until deletion requirements apply.
- Test provider payload allowlists for classification and final narrative generation. Assert that name, email, account data, unrelated Trades, and outcome fields in classifier calls are absent.
- Test deletion cascades for Trades and accounts across observations, confirmations, batches, and snapshots, including snapshot redaction or removal where required.
- Test the compact report contract: no more than three default findings, visible assigned/aligned/deviated/unverified counts, exact Playbook wording, expandable evidence, “Why this rating?”, full-analysis access, incomplete state, and Report details.
- Test large synthetic cohorts through the analysis seam with a fake provider to verify bounded payload size and partition-invariant results without making live provider calls.
- Provider contract tests may verify structured output parsing, retryable versus terminal errors, and configured privacy fields, but ordinary feature tests must remain deterministic and offline.

## Out of Scope

- Market prediction, trade signals, live entry or exit recommendations, position monitoring, and analysis of open or planned Trades.
- Automatic changes to a user's Playbook based on winning Trades or AI findings.
- Treating AI-suggested observations as confirmed without a user action.
- Using a representative sample as the statistical dataset when the user selected a larger cohort.
- Claims that Playbook Alignment, Playbook Deviation, Confluence Signals, or Entry Conviction caused an outcome.
- User-selectable AI providers or model configurations in the initial release.
- Cross-user benchmarks, public strategy leaderboards, or training shared models on private journal data.
- Broker import, CSV import, market-data enrichment, chart-pattern recognition, screenshot analysis, and reconstruction of facts absent from the Trade Journal.
- Replacing the user's free-text Confluences or Trade Idea with normalized records.
- User-configurable drift or Evidence Strength thresholds in the initial release.
- A synchronous single-request implementation for large histories.
- Range-only account analysis and any Analysis Run spanning multiple Playbooks.
- Automatic retroactive reclassification of historical Trades when a newer Playbook Criteria baseline is approved.

## Further Notes

- This PRD fulfills the condition in “Defer AI until the journal model stabilizes”: the completed futures Trade, Journal Entry, Playbook Assignment, Entry Time, Risk Dollars, and R Multiple model now exists. The new analysis decision should supersede that deferral when implementation begins.
- This PRD intentionally changes the meaning of Official Playbook Performance from the existing “Derive playbook performance from assigned trades” decision. Assigned performance remains useful and visible, but it cannot be labeled Official Playbook Performance after alignment exists.
- This PRD extends “Store confluences as free text” without reversing it. Confluences remain free text; normalized Confluence Signals and criterion observations are separate derived records.
- The existing domain glossary already contains Confluence Signal, Expected Confluence Signal, Entry Conviction, Playbook Criterion, Rule Importance, Playbook Alignment, Playbook Assignment, Playbook Deviation, and Playbook Drift. Implementation and copy should use those terms consistently, with simpler rule-following language in the default report.
- The current persistence model stores Playbook Rules as strings and has no criteria, observations, confirmations, analysis runs, snapshots, or Entry Conviction. Schema work is required before the existing unimplemented analysis request can satisfy this PRD.
- The existing AI testcase that describes open Trades is stale and must be replaced because MarketPilot is post-trade-only.
- Batching is a scaling implementation, not a change in statistical scope. All selected completed Trades count; only the final narrative evidence is bounded.
- User confirmation remains the authority for semantic classification. Grouped confirmation makes that authority practical at scale but does not turn AI suggestions into automatic facts.
- Each run is scoped to one Playbook. Entry-Time Range is an optional narrowing control, not an independent or account-wide analysis mode.
- User-confirmed decisions belong to the trader and remain valid across internal AI upgrades unless their underlying Trade evidence, Playbook Assignment, or applicable baseline changes.
