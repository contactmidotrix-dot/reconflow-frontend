# ReconFlow AI — Frontend

Vite + React + TypeScript + Tailwind CSS v4.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local:
#  - VITE_API_BASE_URL if your API isn't at https://reconflow-ai.onrender.com
#  - VITE_N8N_WEBHOOK_URL: the PRODUCTION Form Trigger URL (workflow must be
#    toggled Active in n8n - the Test URL only fires once per click of
#    "Listen for test event" and will make Upload look broken otherwise)
npm run dev
```

Then visit `http://localhost:5173/login`. Since `RECONFLOW_ALLOWED_ORIGINS` on the
backend currently defaults to `http://localhost:5173`/`http://127.0.0.1:5173`,
local dev works out of the box with no backend changes.

## What's here so far

- `src/lib/api.ts` — the single fetch wrapper every ReconFlow API call goes
  through: attaches the bearer token automatically, throws a typed
  `ApiError` with the backend's `{error_code, message}` on failure, and
  redirects to `/login` on any `401`.
- `src/lib/n8n.ts` — deliberately separate from `api.ts`. Upload submits
  straight to the n8n webhook, not the ReconFlow API, so there's no bearer
  token involved here at all - n8n authenticates to the API itself as part
  of the workflow. Throws a distinct `WebhookError` for each of the ways
  this call can actually fail (unreachable, non-2xx, non-JSON response,
  JSON with no `analysis_id`) since each one needs a different fix and a
  generic "upload failed" wouldn't point at which.
- `src/lib/auth.tsx` — `AuthProvider`/`useAuth()`. Token lives in
  `sessionStorage` (cleared when the tab closes) rather than `localStorage` —
  reasonable for this MVP, not the most secure option available (an
  `httpOnly` cookie set by the backend would be, but that's a backend change,
  not made here).
- `src/lib/RequireAuth.tsx` — route guard, redirects to `/login` if there's no
  logged-in user.
- `src/pages/LoginPage.tsx` — built out for real.
- `src/pages/UploadPage.tsx` — branch_id, period_start, period_end,
  pos_file, platform_file, matching the n8n Form Trigger's fields exactly,
  plus restaurant name / email / WhatsApp number for lead tracking
  (recorded via a direct `POST /analyses/{id}/lead` call after n8n
  returns `analysis_id` - not routed through n8n, since the frontend is
  already authenticated and this doesn't need to be part of the
  reconciliation pipeline itself). That call is deliberately best-effort:
  if it fails, the page still navigates to `/results/:analysisId` rather
  than stranding someone on a form when their reconciliation is already
  running server-side. Submits the original 5 pipeline fields as
  `multipart/form-data` directly to `VITE_N8N_WEBHOOK_URL`, unchanged.
  Accepts `.csv`/`.xlsx`/`.xls` up to 50MB, matching the backend's own
  guardrails exactly.
- `src/pages/ResultsPage.tsx` — built out for real. Owns a four-state
  machine (`polling` / `completed` / `failed` / `error` — deliberately not
  a boolean loading flag, since a backend-reported failure and a frontend
  fetch failure need different UI and different explanations). Polls
  `GET /analyses/{id}` every 2s while `AWAITING_FILES`/`PROCESSING`, then
  fetches `/summary` and `/discrepancies` once `COMPLETED`.
- `src/lib/useReconciliationProgress.ts` — the staged progress heuristic.
  Worth understanding before touching it: the frontend only ever sees two
  coarse statuses from polling, never which of n8n's ~15 steps is actually
  running, so the sub-stage labels shown during `PollingView` are a
  time-based *estimate*, not a real read of pipeline state. A status
  change is real signal (resets the within-status clock); elapsed time is
  only the fallback for showing forward motion between the two known
  points.
- `src/components/results/` — `ProgressTracker` (the step checklist, not a
  percentage bar - a percentage would claim precision that doesn't exist),
  `ReportHero` (the total-leakage figure, with a distinct calm treatment
  at exactly $0 rather than reusing the same alert styling for good news),
  `AIExecutiveSummary` (carries the `provider_name === "fake"` label,
  specifically here since that's where the AI content lives), `RevenueBreakdownTable`
  (recommended actions inline per category row, not a separate section),
  `HighPriorityCases` (severity badges live here specifically - severity
  is a genuine per-discrepancy attribute, not a per-category one; checked
  `severity_for()` in the backend directly, it's a threshold purely on
  `estimated_loss`, so one category can contain every severity level at
  once and a badge on the breakdown table would misrepresent that).
- `src/lib/recommendedActions.ts` — static category → action-text lookup.
  Presentation copy, not computed data; there's no such field in the
  backend and there shouldn't be.

- `src/lib/generateDisputeReport.ts` / `DownloadDisputeReportButton` — the
  "One-Click Dispute Report". Client-side PDF generation (jsPDF +
  jspdf-autotable), not a new backend endpoint: every field it needs
  (order reference, category, amount) is already in the Results page's
  own state, and the recommended-action text only ever existed in the
  frontend to begin with - a backend endpoint would mean duplicating that
  copy server-side or passing it back up just to have it echoed into a
  file. Includes every discrepancy, not just the page's top-10 High
  Priority Cases, since a document meant to actually go to a platform
  needs the complete list. jsPDF/autotable are dynamically imported
  inside the generator function, not at module top level - jsPDF bundles
  html2canvas + dompurify for an HTML-rendering feature this never uses,
  and importing it eagerly added ~450KB to the main bundle that every
  visitor would've downloaded just to see the login page. Hidden entirely
  when there are zero discrepancies - a claim document with nothing to
  claim doesn't make sense to offer.

## Backend changes bundled with this delivery

Two diffs come with this handoff — apply both:

1. `reconflow_currency_field.diff` — `AnalysisSummaryResponse` gained one
   field, `currency`, resolved from the analysis's branch → organization
   at request time. Noticed while building `ReportHero` that a
   revenue-leakage figure with no currency attached isn't something to
   ask a restaurant owner to trust.
2. `reconflow_lead_capture_and_dispute_backend.diff` — a new module,
   `lead_capture` (one new table, `analysis_leads` - a new table on
   purpose, not new columns on `Analysis`, since this codebase has no
   migration tool beyond `create_all_tables()`, which creates missing
   tables but never alters existing ones), plus `AnalysisSummaryResponse`
   gaining `restaurant_name`/`contact_email`/`whatsapp_number`, resolved
   from that table when present.

Full suite green with both applied: 228 passed (224 + 4 new lead_capture
tests). Verified beyond the test suite too - ran the complete pipeline
against a live local instance with a recorded lead, confirmed
`GET /analyses/{id}/summary` returns `currency`, `restaurant_name`,
`contact_email`, and `whatsapp_number` all correctly alongside the
existing discrepancy/AI-insight data in one response.

## Design tokens

Defined in `src/index.css` via Tailwind v4's `@theme` block: `paper` /
`paper-raised` (background), `ink` / `ink-muted` (text), `copper` (the one
accent), `line` (borders), plus `severity-critical/high/medium/low` reserved
for the discrepancy severity colors the Results page will need. Headings use
Fraunces (serif), body/UI uses Inter — loaded via Google Fonts in `index.css`.

## Next

All three pages from the architecture doc are built. Possible next steps:
a branch-picker once a list-branches endpoint exists (Upload's `branch_id`
is plain text right now because that endpoint doesn't), or a small history
view if browsing past analyses (not just the one just run) turns out to
matter.
