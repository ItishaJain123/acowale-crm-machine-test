# Engineering Decision Log

**Acowale CRM Machine Test by Itisha Jain** — "Loop", a customer feedback platform.

---

### 1. Why did you choose this technology stack?

I chose **React + Vite + TypeScript** for the frontend and **Node + Express + TypeScript**
for the backend because it's the stack I'm most confident shipping quickly and correctly
in a time-boxed assignment. I deliberately did **not** reach for Next.js, even though it
would have looked more "modern" on paper — the assignment's evaluation criteria explicitly
say I need to be able to explain every part of what I submit, and the next stage is a
technical interview. A stack I can defend line-by-line is worth more than one I picked to
look impressive. TypeScript on both ends was a cheap, high-value addition: it catches
mismatches between the API contract and the UI at compile time instead of in production.

Vite gives fast local iteration and a small, predictable build. Express is minimal and
explicit — every middleware in the request pipeline (CORS, JSON parsing, logging, rate
limiting, error handling) is visible in `server/src/index.ts`, nothing is hidden behind
framework magic.

### 2. Why did you choose this database?

**PostgreSQL**, via **Prisma**, hosted on **Neon**. Three reasons:

- **Relational fit** — feedback entries with a fixed category enum and an admin-user table
  are naturally relational; I don't need document flexibility or a graph model.
- **Dev/prod parity** — I originally considered MySQL locally and Postgres in production
  (a split the assignment invites, since "database" is a free choice). I deliberately
  rejected that: running two different engines risks environment-specific bugs (case
  sensitivity, `SERIAL` vs `AUTO_INCREMENT`, JSON handling) that only show up after deploy.
  Using Postgres everywhere means what passes locally is guaranteed to behave the same in
  production.
- **Neon specifically** — serverless, free tier, and gives both a pooled connection
  (`DATABASE_URL`, used by the running app) and a direct connection (`DIRECT_URL`, used by
  Prisma Migrate) out of the box. That split is a genuine Neon/Prisma production pattern,
  not just a toy setup.

Prisma was chosen over a raw query builder because the schema is the single source of
truth for both migrations and TypeScript types — the `Feedback` and `AdminUser` models in
`schema.prisma` generate fully-typed query methods, so a typo in a field name is a
compile error, not a runtime bug.

### 3. Why did you structure your application this way?

A **monorepo** with two independent packages, `client/` and `server/`, each with its own
`package.json`, rather than a single Next.js app or a shared workspace tool (Turborepo,
Nx). For a project this size, a build-tool abstraction on top of two npm projects would be
overhead without payoff — I can `cd` into either folder and run it standalone, which also
maps directly onto how they're deployed (frontend to a static host, backend to a Node
host).

Inside `server/`, routes, middleware, and `lib/` are separated so that **business logic is
pure and testable independent of Express**. The clearest example is `src/lib/trend.ts`:
the 7-day trend-bucketing logic used to live inline inside the `/api/analytics` route
handler. I pulled it out into a standalone function specifically so it could be unit
tested without mocking Express or hitting the database — that single refactor is what
made `tests/trend.test.ts` possible.

### 4. What trade-offs did you make due to time constraints?

- **No E2E tests** (Playwright/Cypress) — I prioritized unit tests over end-to-end tests
  because unit tests on validation, auth, and analytics logic catch more classes of bugs
  per minute invested, given the time budget.
- **No refresh tokens** — the admin JWT is a single 8-hour token with no refresh flow.
  Acceptable for an internal admin console at this scale, not something I'd ship for a
  consumer-facing auth system.
- **In-memory rate limiting** (`express-rate-limit` default store) instead of a shared
  store like Redis. Fine for a single server instance; would need to move to a shared
  store the moment this runs on more than one instance.
- **No pagination cursor, only offset/limit** — simpler to implement and reason about;
  would need to move to cursor-based pagination before the feedback table gets large
  (see Q10).

### 5. What would you improve if you had one more week?

- Add **Playwright E2E tests** covering the full submit → dashboard-reflects-it flow.
- Add **refresh tokens** and **audit logging** for admin actions.
- Move rate limiting to a shared store (Redis/Upstash) so it works correctly behind
  multiple server instances.
- Add **response caching** on `/api/analytics` (it recomputes aggregates on every request;
  a 30–60s cache would remove most of the read load).
- Build a proper **category management** feature (currently categories are a fixed enum;
  a real product would let admins add/rename categories without a migration).
- Add **CD** (auto-deploy) directly from the CI workflow instead of relying solely on the
  hosting platform's own GitHub integration.

### 6. What was the most difficult technical challenge you faced?

Getting the **category-distribution donut chart to render at all**. The chart's pie ring
was drawing as a set of collapsed thin lines instead of a circle — everything else
(the trend area chart, the legend, the data) worked, so it wasn't a data problem. After
isolating it, I found this is a known interaction between **Recharts 3.x and React 19**:
under React 19 (and especially in StrictMode's double-render), `<Pie>` can measure a
zero-size container on its first paint and never recover because its mount animation
starts from that broken measurement. The fix was setting explicit `cx="50%" cy="50%"` and
`isAnimationActive={false}` on the `<Pie>` element, which forces it to skip the buggy
animated mount entirely and render at full size immediately.

### 7. Which AI tools did you use?

**Claude Code (Claude Opus/Sonnet, Anthropic)**, end-to-end — reading the assignment PDF
and email, planning the stack, writing the majority of the implementation, debugging, and
drafting these docs.

### 8. Share one instance where AI helped you.

Diagnosing the Recharts donut-chart bug in Q6. I described the symptom ("the pie collapses
into lines"); the AI recognized it as a version-compatibility issue between Recharts 3 and
React 19's rendering behavior rather than a data or CSS bug, and proposed the specific fix
(`isAnimationActive={false}` + explicit `cx`/`cy`). Without that framing, I'd likely have
spent a long time inspecting the data pipeline instead of the rendering library version.

### 9. Share one instance where you disagreed with AI and why.

The AI's first draft of the local development setup paired **MySQL locally** with
**Postgres in production**, framed as a way to try both engines. I disagreed and asked
it to use Postgres everywhere instead. My reasoning: dev/prod parity is worth more than
the novelty of touching two engines — a bug caused by an engine difference is exactly the
kind of thing that a machine test reviewer would flag as a production risk, and it directly
contradicts one of the assignment's own evaluation criteria ("production-aware"). The AI
agreed and we standardized on Postgres (Neon) for both environments, documented in Q2.

### 10. What would break first if this application suddenly had 100,000 users?

The **`/api/analytics` endpoint**. It runs several full-table aggregations
(`count`, `groupBy`, `aggregate`, and a 7-day window scan) synchronously on every
dashboard load, with no caching. At 100k *feedback rows* (not users — but a userbase that
size would generate rows fast) these queries would slow down significantly, especially the
per-row JS bucketing in `bucketByDay`, which is O(n) per day-bucket and currently runs in
Node rather than in SQL. The fix is straightforward: push the trend aggregation into a SQL
`GROUP BY date_trunc('day', ...)` query and cache the whole analytics response for
30–60 seconds, since dashboard data doesn't need to be second-accurate.

Secondary risks at that scale: the in-memory rate limiter wouldn't coordinate across
multiple server instances (needs Redis), and offset-based pagination (`skip`/`take`) gets
progressively slower for deep pages since Postgres still has to scan and discard the
skipped rows.

### 11. What is one thing in this assignment you would improve, change, or challenge?

The brief asks for a **"publicly accessible, fully functional"** submission but is silent
on **how long it needs to stay up**. Free hosting tiers (which is what nearly every
candidate will use, given no budget is provided) tend to spin down on inactivity or expire
after a period of time. I'd suggest the assignment either commit to a review window
("we will test your live link within N days of submission") or explicitly allow a
screen-recorded walkthrough as a fallback — it removes ambiguity about whether a stale
link should count against the candidate.
