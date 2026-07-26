# AI Playbook Analysis Architecture

This document turns the approved [AI Playbook Analysis PRD](../marketpilot-ai-playbook-analysis-prd.md) into an implementation architecture. It is the source of truth for module seams, persistence, workflow states, cache behavior, and slice boundaries. Product rules remain in the PRD and domain language remains in [`CONTEXT.md`](../../CONTEXT.md).

## Architectural outcome

MarketPilot will implement Playbook analysis as one deep, server-only analysis module. Authenticated route handlers are thin adapters around that module. The module persists the selected cohort and every workflow checkpoint in Postgres, dispatches resumable work through a durable background adapter, calls an AI provider through a narrow internal seam, calculates all metrics deterministically, and creates immutable report snapshots.

The classifier never receives outcome fields. An AI suggestion cannot affect Playbook Alignment, Playbook Deviation, Playbook Drift, Evidence Strength, or Official Playbook Performance until the trader confirms or corrects it.

```text
Browser
  |
  v
Authenticated Next.js route handlers
  |
  v
Analysis module interface
  |-- Postgres implementation (selection, workflow, cache, snapshots)
  |-- Durable-dispatch seam ---- Inngest adapter / inline test adapter
  `-- AI-provider seam --------- approved provider adapter / deterministic fake
```

Next.js Route Handlers remain public endpoints and are not a durable worker. `after()` may be used only for nonessential wake-up work; it is constrained by the route's platform duration. Run and batch state in Postgres plus durable dispatch are the recovery mechanism.

## Module interface

The external seam lives at `lib/analysis/index.ts`. Routes and tests use the same interface.

```ts
type PlaybookAnalysis = {
  plan(input: PlanAnalysisInput): Promise<AnalysisPlan>;
  start(input: StartAnalysisInput): Promise<AnalysisRunView>;
  read(input: ReadAnalysisInput): Promise<AnalysisRunView>;
  submitReview(input: SubmitAnalysisReviewInput): Promise<AnalysisRunView>;
};
```

- `plan` authorizes the requested selection, computes selected/reusable/to-process counts, and returns the duration and usage estimate. It does not trust client-supplied counts.
- `start` recomputes the plan, enforces consent and any large-run confirmation, freezes the selected cohort, returns an existing run for the same idempotency key or active selection, and dispatches new work.
- `read` returns progress, paginated review groups, sanitized failures, freshness, and the final snapshot when one exists.
- `submitReview` applies confirmations or corrections to only the selected observations. With `finalize: true`, it freezes the effective observation states, leaves untouched suggestions unverified, and dispatches reduction and report creation.

The interface accepts an authenticated `userId`; it never accepts arbitrary owner IDs. Route handlers obtain `userId` from `requireUser()`. Every store query includes that owner before any provider call.

The module returns domain results or typed errors. It does not return `NextResponse`, know route paths, or import client code.

### Playbook Criterion authoring prerequisite

An Analysis Run consumes only current approved criterion versions; it never drafts or silently approves its own baseline. The Playbooks module gains a focused criterion-authoring interface that can draft, approve, revise, reorder, and retire criterion versions. AI-drafted criteria use the same provider adapter, but approval is a separate authenticated Playbook mutation. Existing string rules are backfilled as drafts, not approved facts.

This keeps authoring lifecycle decisions local to the Playbook while the analysis module owns the meaning of an approved baseline during review.

## HTTP adapters

Keep `POST /api/ai/analyze-trades` as the stable start request promised by the PRD. Add nested handlers around it:

| Method and path | Module call | Response |
| --- | --- | --- |
| `POST /api/ai/analyze-trades/preflight` | `plan` | Counts, estimate, consent/confirmation requirement |
| `POST /api/ai/analyze-trades` | `start` | `202` with stable run ID, status, and progress; duplicate starts return the same run |
| `GET /api/ai/analyze-trades/[runId]` | `read` | Current progress, review summary, or snapshot; explicitly dynamic/no-store |
| `GET /api/ai/analyze-trades/[runId]/observations` | paginated read projection | Criterion-grouped suggestions and exact evidence |
| `POST /api/ai/analyze-trades/[runId]/review` | `submitReview` | Updated review counts; may resume finalization |

Criterion authoring extends the authenticated Playbook route tree under `/api/playbooks/[id]/criteria`; draft generation and approval are separate mutations so an AI response can never approve itself.

The route tree is an adapter, not a second business layer. Request parsing uses Zod. Cross-user identifiers return `404` so the route does not reveal that a foreign record exists.

## Internal modules and seams

The implementation lives under `lib/analysis/`:

```text
lib/analysis/
  index.ts                    public module interface and construction
  types.ts                    public domain results and typed errors
  module.ts                   workflow coordinator
  selection.ts                user-scoped cohort selection and freezing
  classification-input.ts     canonical allowlist and input hashing
  observations.ts             effective states and confirmation truth table
  alignment.ts                aligned/deviated/unverified derivation
  reduction.ts                exact full-cohort outcome calculations
  drift.ts                    rolling Playbook Drift rules
  evidence-strength.ts        deterministic evidence gates
  evidence-selection.ts       bounded support/counterexample selection
  freshness.ts                source fingerprints and out-of-date checks
  provider/
    contract.ts               provider inputs, outputs, and error taxonomy
    production.ts             approved provider adapter
    fake.ts                   deterministic test adapter
  dispatch/
    contract.ts               dispatch(runId), no journal payload
    inngest.ts                production durable-dispatch adapter
    inline.ts                 deterministic test/development adapter
  store/
    prisma.ts                 Postgres implementation
```

`selection`, reduction, alignment, drift, and Evidence Strength are in-process behavior hidden behind the analysis interface. Prisma is a local-substitutable dependency and is exercised with a test database. The AI provider and durable runner are true external dependencies and therefore have injected adapters.

### Durable-dispatch seam

```ts
type AnalysisDispatcher = {
  dispatch(runId: string): Promise<void>;
};
```

The production adapter initially sends an opaque run ID to Inngest. It does not send Trade Journal text, user identity, outcomes, criteria, or report content. The worker loads all data from MarketPilot after claiming the run. Inngest provides durable step retries and concurrency control without making its workflow state the business source of truth. The inline adapter runs the same worker entry point deterministically in tests.

### AI-provider seam

```ts
type AnalysisProvider = {
  draftCriteria(input: CriterionDraftInput): Promise<CriterionDraftOutput>;
  classifyBatch(input: ClassificationBatchInput): Promise<ClassificationBatchOutput>;
  writeNarrative(input: NarrativeInput): Promise<NarrativeOutput>;
};
```

Only the server-side analysis and Playbook Criterion authoring modules call this interface. The production adapter owns authentication, provider request syntax, structured-output settings, timeouts, model identifiers, and conversion of provider failures into `retryable`, `rate_limited`, `invalid_output`, or `terminal` errors. The deterministic fake records payloads so feature tests can prove user isolation and outcome blindness.

One deployment-owned configuration selects the approved provider, model settings, classifier contract version, narrative contract version, retention/privacy settings, and cost policy. Users cannot select a provider or model. The provider and exact model must pass the PRD's privacy and retention approval before the production adapter issue can be released.

All provider inputs and outputs are runtime-validated. Unknown output keys are rejected. Provider responses may propose semantic observations and prose, but may not write database identifiers, confirmation state, metrics, Evidence Strength, drift status, or Official Playbook Performance.

## Classification and narrative contracts

### Classification input allowlist

Each item contains only:

- an opaque run-local Trade key;
- the exact approved Playbook Criterion wording, Rule Importance, criterion type, examples, and sequence context;
- symbol, Direction, Entry Time, Trade Idea, Confluences, and Entry Conviction when relevant to that criterion;
- Risk Dollars only for a risk-related criterion.

The input type cannot represent R Multiple, Realized P&L, Outcome Status, user name, email, account data, or unrelated Trades. The runtime payload schema independently rejects them.

The classifier returns one `present`, `absent`, or `unknown` suggestion per requested Trade/Criterion pair, evidence references into the supplied source fields, and optional Confluence Signal candidates. Missing or vague evidence must be `unknown`.

### Narrative input allowlist

The report writer receives:

- deterministic counts and metric identifiers;
- aligned-versus-deviated comparisons;
- deterministic drift and Evidence Strength results plus their reasons;
- exact criterion wording;
- a bounded, deterministic set of supporting and contradictory evidence;
- incomplete-processing details.

It does not receive the full cohort or unlocked observations. Narrative output contains copy plus references to known metric and evidence IDs. Numeric values are rendered by application code from those references so provider prose cannot become the source of arithmetic.

## Persistence design

Use Postgres through Prisma. All AI-derived rows carry `userId` even where ownership is reachable through a relation; this keeps owner scoping visible and indexable. Foreign keys use `onDelete: Cascade` for user- and Trade-owned derived records unless noted otherwise.

### Existing model changes

| Model | Change | Reason |
| --- | --- | --- |
| `JournalEntry` | Add nullable `entryConviction` enum: `LOW`, `MEDIUM`, `HIGH` | User-entered reflective context; never inferred |
| `Playbook` | Add relation to criterion versions; retain `rules String[]` during migration | Roll out typed criteria without breaking existing authoring |
| `Trade` | Add derived-record relations only | Classification input versions are content hashes, not a broad `updatedAt` counter |

After typed criteria are fully deployed, `rules` becomes a compatibility projection and can be removed in a later migration. It is not a second scoring baseline.

### New records

| Record | Important fields and constraints | Purpose |
| --- | --- | --- |
| `PlaybookCriterionVersion` | `id`, `userId`, `playbookId`, stable `criterionKey`, integer `version`, type, importance, wording, three example arrays, optional `sequencePosition`, `status`, `isCurrent`, approval timestamps; unique `(playbookId, criterionKey, version)` | Immutable approved criterion versions and editable drafts. Editing an approved criterion inserts a version rather than rewriting history. |
| `CriterionObservation` | `userId`, `tradeId`, `playbookId`, `criterionVersionId`, `classificationInputHash`, `classifierVersion`, `suggestedState`, evidence JSON, signal candidates JSON, optional `confirmedState`, `confirmedAt`, integer `decisionRevision`; unique cache key across those version fields | Version-bound semantic cache plus the trader's effective decision. Confirmation is revisioned mutable metadata on an immutable classifier result. |
| `ConfluenceSignal` | `id`, `userId`, canonical name, normalized key, aliases; unique `(userId, normalizedKey)` | User-private canonical vocabulary used across batches and runs. |
| `TradeConfluenceSignal` | `userId`, `tradeId`, `signalId`, source observation, source excerpt, state/provenance; unique by source observation and signal | Derived normalization without replacing Confluences. |
| `AnalysisRun` | owner, selection JSON, selection fingerprint, idempotency key, nullable unique active key, versions, status, progress/error counters, consent/config audit, timestamps | Durable workflow aggregate and externally stable run ID. Unique `(userId, idempotencyKey)` handles repeat submission. |
| `AnalysisRunTrade` | `runId`, `tradeId`, playbook/Entry-Time snapshot, allowlisted classification snapshot JSON, typed outcome snapshot, source hashes; unique `(runId, tradeId)` | Freezes the complete selected cohort so edits during processing do not mix versions. Private snapshots cascade with their Trade/run. |
| `AnalysisTask` | run Trade, criterion version, input hash, cache status, observation ID, batch ID, error code, and final locked state/provenance | One Trade/Criterion unit. Reused and newly classified observations converge here before deterministic reduction. |
| `AnalysisBatch` | run, ordinal, status, attempt count, task/trade counts, lease/dispatch metadata, sanitized failure, timestamps; unique `(runId, ordinal)` | Bounded independently retryable provider call checkpoint. |
| `AnalysisReportSnapshot` | owner, run, series/selection key, version, source fingerprint, deterministic snapshot JSON, narrative JSON, provider/model/contract audit, completeness, timestamps; unique run and unique `(userId, seriesKey, version)` | Immutable report content. |
| `AnalysisReportEvidence` | report, run Trade, criterion/observation references, source field and exact excerpt | Progressive-disclosure evidence that can cascade on deletion. |
| `AnalysisReportFreshness` | report, `CURRENT`, `OUT_OF_DATE`, or `UNAVAILABLE`, reason, checked timestamp | Mutable status kept separate from immutable report content. |

Use JSON only for versioned private payloads whose schema is validated at the module seam: frozen classification input, evidence references, deterministic report projection, and narrative projection. Queryable state, ownership, progress, relations, and cache keys remain typed columns.

### Enumerations

- Criterion type: `SETUP_CONDITION`, `EXECUTION_TRIGGER`, `RISK_LIMIT`, `EXPECTED_CONFLUENCE`.
- Rule Importance: `REQUIRED`, `SUPPORTING`, `INVALIDATING`.
- Criterion status: `DRAFT`, `APPROVED`, `RETIRED`.
- Observation state: `PRESENT`, `ABSENT`, `UNKNOWN`.
- Run status: `QUEUED`, `CLASSIFYING`, `AWAITING_REVIEW`, `REDUCING`, `WRITING_REPORT`, `COMPLETED`, `COMPLETED_INCOMPLETE`, `FAILED`.
- Task status: `REUSED`, `QUEUED`, `PROCESSING`, `SUCCEEDED`, `UNAVAILABLE`.
- Batch status: `QUEUED`, `PROCESSING`, `SUCCEEDED`, `RETRY_WAIT`, `FAILED_TERMINAL`.
- Report freshness: `CURRENT`, `OUT_OF_DATE`, `UNAVAILABLE`.

Criterion type and Rule Importance are independent. For example, an `EXECUTION_TRIGGER` can be required, supporting, or invalidating.

### Required indexes

- Trades: `(userId, playbookId, openedAt)` in addition to the current owner/time indexes.
- Current criteria: `(userId, playbookId, isCurrent, status)`.
- Observation lookup: the full unique cache key plus `(userId, tradeId)` and `(userId, criterionVersionId)`.
- Runs: `(userId, createdAt)`, `(userId, status)`, unique idempotency key, and unique nullable active key.
- Batches: `(status, availableAt)` and `(runId, status)`.
- Tasks: `(runId, status)`, `(batchId)`, and `(observationId)`.
- Snapshots: `(userId, seriesKey, version)` and freshness status.

Prisma does not express every partial uniqueness rule. The migration may add a small raw SQL partial index if the nullable active-key strategy proves insufficient, but ownership and business state remain in Prisma.

## Run state machine

```text
QUEUED
  -> CLASSIFYING
  -> AWAITING_REVIEW
  -> REDUCING
  -> WRITING_REPORT
  -> COMPLETED | COMPLETED_INCOMPLETE

Any processing state -> FAILED only when the run itself cannot continue.
Individual terminal batch failures -> processing-unavailable tasks -> COMPLETED_INCOMPLETE.
```

- `QUEUED`: the cohort, tasks, and initial batches are committed before dispatch.
- `CLASSIFYING`: reusable observations are attached and missing tasks are processed.
- `AWAITING_REVIEW`: all classification tasks are terminal. Suggestions are grouped by criterion for review. If no unconfirmed suggestions exist, the worker may continue automatically.
- `REDUCING`: `submitReview(finalize: true)` freezes effective states onto run tasks at one cutoff. Untouched suggestions lock as unverified. Application code calculates the complete cohort.
- `WRITING_REPORT`: the bounded narrative request runs after deterministic results exist.
- `COMPLETED_INCOMPLETE`: a snapshot exists, but one or more tasks were unavailable after bounded retries. The snapshot and Evidence Strength expose this.

Status transitions use conditional updates so duplicate worker delivery cannot move a run backward. Work is at-least-once; database effects are idempotent.

## Batching and retry flow

1. Select only authenticated-user Trades matching the Playbook and/or Entry-Time Range.
2. Freeze every selected Trade in `AnalysisRunTrade`, including outcome data that the provider will never receive.
3. Expand current approved criteria into `AnalysisTask` rows and compute criterion-specific input hashes.
4. Attach exact cache hits as `REUSED`. Mark misses `QUEUED`.
5. Group queued tasks by Playbook baseline, then pack batches under both configured item-count and estimated-token ceilings. Batch size is configuration, not report semantics.
6. Dispatch only the run ID. A worker claims a batch with a lease and changes tasks to `PROCESSING`.
7. Build and validate the classification payload from the frozen allowlist. Call the provider.
8. Validate that every requested task has exactly one result. In one transaction, upsert observations by cache key, attach tasks, store candidate signals, and complete the batch.
9. Retry only the failed batch with exponential backoff and jitter. Provider rate limits and transient network failures are retryable; authorization/configuration failures are terminal. Invalid structured output is retryable only up to the configured limit.
10. When retries are exhausted, mark only that batch's tasks `UNAVAILABLE`; preserve successful batches and proceed to an incomplete review/report.
11. Resolve Confluence Signal candidates against the user's vocabulary before recurrence counts. Resolution is globally consistent for the run and serialized per user when new canonical signals are created.
12. After review finalization, reduce all selected run Trades, regardless of batch, cache source, order, or completion time.

Provider calls can be duplicated by at-least-once delivery. Stable batch request IDs are supplied when the provider supports idempotency, and the observation unique key makes persistence idempotent. Exact-once billing is not assumed.

## Cache and invalidation flow

`classificationInputHash` is a SHA-256 hash of canonical JSON built from only the evidence allowed for one Trade/Criterion pair. Canonicalization fixes field ordering, date representation, null handling, and contract version. The observation cache key is:

```text
userId
+ tradeId
+ assigned playbookId
+ criterionVersionId
+ classificationInputHash
+ classifierVersion
```

Consequences:

- Adding a Trade creates tasks only for that Trade.
- Changing only R Multiple changes the outcome/source fingerprint, not the classification hash. Observations are reused and metrics are recalculated.
- Changing Trade Idea, Confluences, Entry Conviction, relevant execution evidence, or Playbook Assignment misses only affected Trade/Criterion keys.
- Changing one approved Playbook Criterion creates a new criterion version and misses only that criterion's observations.
- Changing the classifier contract/version misses all observations for that classifier version without deleting history.
- Confirmations are reused only with the exact observation cache key. Stale classifier results cannot inherit confirmation.
- There is no time-based TTL. Correctness comes from explicit content and contract versions.

Next.js response caching is not the semantic cache and must not be used for run progress or private report reads.

## Deterministic reduction

Reduction reads the frozen cohort and locked effective states. It produces:
- assigned, aligned, deviated, unverified, and processing-unavailable counts;
- wins, losses, breakevens, win rate, average R Multiple, median R Multiple, and Realized P&L aggregates;
- Official Playbook Performance from confirmed aligned Trades only;
- separately named assigned-trade and aligned-versus-deviated comparisons;
- possible and ongoing Playbook Drift from the PRD's rolling thresholds;
- Confluence Signal recurrence and confirmed relevant coverage;
- Limited, Moderate, or Strong Evidence Strength and machine-readable reasons;
- contradictory-example and minimum-cohort downgrades.

The reducer operates on per-Trade values. It never averages batch averages or merges batch medians. Sorting and tie-breaking are explicit, so batch size, batch order, concurrency, and retry order cannot change a result.

## Snapshot immutability and freshness

Finalization writes deterministic content, narrative content, evidence rows, and freshness state in one transaction. The snapshot body is never updated. A later run creates the next version in the same selection series.

The source fingerprint covers cohort membership, classification hashes, criterion versions, locked confirmation versions, outcome values, analysis contracts, and model configuration. `read` compares the stored fingerprint with current source versions and updates only `AnalysisReportFreshness`. Mutation paths may eagerly mark known reports out of date, but on-read verification is the correctness backstop and detects newly added Trades inside an old selection.

Deletion outranks immutability:

- Account deletion cascades every analysis record.
- Trade deletion deletes its observations, signal links, run snapshots, tasks, and evidence. MarketPilot's Trade-deletion transaction also deletes any report snapshots that incorporated that Trade rather than serving partially redacted arithmetic.
- Playbook deletion remains restricted while Trades or analysis history reference it. Retiring criteria preserves historical versions.

## Security and privacy controls

- Authenticate before selection and owner-scope every database query.
- Dispatch only opaque run IDs.
- Build provider payloads from explicit constructors, never by spreading Prisma models.
- Log run, batch, provider request, latency, token, and sanitized error metadata; never log Trade Journal text or evidence excerpts.
- Encrypt transport using provider SDK defaults and retain derived private data only in MarketPilot's database.
- Record consent text/version and provider/model/contract versions on each run and snapshot.
- Do not release the production provider adapter until no-training and minimum-retention requirements are approved.
- Apply per-user active-run limits and provider concurrency/rate controls at dispatch.

## Testing architecture

Feature tests cross the `PlaybookAnalysis` interface with a test database, inline dispatcher, deterministic clock/ID generator, and fake provider. They assert observable run progress, review states, and snapshots, not private helpers or prompt text.

Required test layers:

- Pure truth tables for alignment, drift, Evidence Strength, median/average calculations, and evidence selection.
- Module integration tests for user isolation, idempotency, cache reuse, grouped confirmation, batch retries, incomplete reports, immutable versions, deletion, and staleness.
- Payload-recording tests proving classifier outcome blindness and both provider allowlists.
- Provider contract tests for structured output and error mapping, excluded from ordinary offline tests.
- Large synthetic cohort tests proving bounded calls and partition-invariant reduction.
- Route adapter tests for authentication, validation, status codes, and `404` cross-user behavior.

The stale open-Trade testcase is replaced; analysis has no open-position state.

## Migration and rollout order

1. Add Entry Conviction and versioned Playbook Criteria while retaining `Playbook.rules` compatibility.
2. Add criterion authoring, draft generation, and approval; backfill one draft criterion per existing rule. Require trader approval before it is eligible for scoring.
3. Add runs, run Trades, tasks, batches, observations, signal records, snapshots, and freshness records.
4. Implement the analysis module with fake provider and inline dispatch; ship disabled behind a server-side feature flag.
5. Add authenticated preflight/start/read/review routes and the observation-review UI.
6. Add durable dispatch and exercise failure recovery with the fake provider in a deployed environment.
7. Add the approved production provider adapter, privacy disclosure, cost policy, and operational limits.
8. Switch Playbook pages and performance projections to confirmed-alignment semantics.
9. Enable the feature gradually, observe batch failures/cost/latency, then remove the obsolete `501` behavior and later retire `rules` compatibility.

No migration silently converts existing string rules into approved scoring criteria. Until a trader approves typed criteria and confirms observations, affected Trades remain unverified and Official Playbook Performance is empty rather than falsely aligned.

## Architecture acceptance checks

- Every PRD selection can be represented without client-supplied Trade IDs.
- Classification payload types cannot contain outcomes or identity.
- A process can stop after any committed batch and resume without repeating successful persistence work.
- A changed R Multiple reuses classification but produces a new deterministic report version.
- One changed criterion invalidates only that criterion's observations.
- Unconfirmed suggestions cannot affect alignment, drift, Evidence Strength, or Official Playbook Performance.
- Full-cohort metrics are invariant under batch partitioning and completion order.
- Old snapshots remain byte-stable while freshness changes separately.
- Deletion removes private source and derived data even when that makes an old report unavailable.
- Ordinary tests run offline with no live durable-runner or AI-provider calls.
