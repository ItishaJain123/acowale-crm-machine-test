# TEACH_US.md

## Idea: Treat "extract for testability" as a code-review checklist item, not an afterthought

While building this project's analytics endpoint, I initially wrote the 7-day trend
calculation directly inside the Express route handler — fetch from the database, then loop
and bucket the results by day, all in one function. It worked. It also could not be unit
tested without either mocking Prisma or hitting a real database, because the pure
computation (bucketing timestamps into days) was welded to the I/O (the database query).

The fix was small: move the bucketing logic into its own function,
`bucketByDay(timestamps, days, now)`, that takes plain data in and returns plain data out —
no Express, no Prisma, no side effects. The route handler now just calls it. That one
extraction is what made six focused unit tests possible (empty input, same-day duplicates,
custom window sizes, out-of-range timestamps, etc.) — tests that would otherwise have
required a running database and a live server just to check that day-bucketing math is
correct.

**The pattern generalizes**: almost any bug-prone piece of logic (date math, pricing
calculations, permission checks, string parsing) can be isolated from the framework code
that surrounds it — the database call, the HTTP handler, the React component. Once
isolated, it becomes a pure function: same input, same output, no mocking required, and
tests run in milliseconds.

### What I'd suggest for Acowale

Add a single question to code review: **"Is there logic in this diff that's hard to test
because it's tangled up with I/O or a framework?"** If yes, that's a signal to extract it
into a plain function before merging — not as extra busywork, but because:

1. **Tests get simpler and faster.** No mocking Express requests, no spinning up a test
   database, no flaky async setup — just `expect(fn(input)).toBe(output)`.
2. **The logic becomes reusable.** A pure date-bucketing function can be used by an
   analytics endpoint today and a CSV export or a scheduled report tomorrow, without any
   coupling to how the first caller happened to invoke it.
3. **Code review gets easier.** A reviewer can verify a pure function's correctness by
   reading it top to bottom. A function tangled with a database call and Express types
   requires reviewing the tangle too.
4. **It naturally produces a `lib/` layer over time** — a growing set of small, well-tested
   building blocks that make the *next* feature faster to build, instead of every feature
   starting from zero.

This costs almost nothing to adopt (it's a question, not a tool or a process), and the
payoff compounds: every extraction makes the next one easier to spot, because the
codebase increasingly separates "what the logic does" from "how it's wired up." For a team
building a product that others will build on top of for years — exactly the kind of work
Acowale's hiring letter describes — that compounding testability is worth more than almost
any single testing *tool* choice.
