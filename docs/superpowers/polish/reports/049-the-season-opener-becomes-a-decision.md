# 049 — B62 / route R2: the Season Opener stops being a tax and becomes a decision

**Type:** content authoring + measurement · **Wave:** 26 · **Status:** in progress

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`. Branch `polish/ui-phase`, on top of
`be1aff1`. Written as the work happened, so the sections below are in the order they were done and the
measured tables are the ones that were actually produced, not a tidied-up retelling.

## What was touched

| file | change |
|---|---|
| `src/sim/policies.ts` | `virtue` event strategy + `virtueAmbitious` / `virtueLoyal` profiles (047 Appendix A). Measurement infrastructure; `src/sim/**` is not frozen. |
| `src/sim/policies.test.ts` | the `virtue vs humanLazy` symmetry test 047 Appendix A asks for. |
| `src/sim/virtue-probe.ts` | the acceptance harness. Drives `createCareer → getDecision → advance` and calls `cardAccount` from `src/ui/session/view-model.ts` on each `(before, after, decision, optionId)`. |
| `src/sim/virtue-probe.test.ts` | harness self-tests. |
| `src/content/events/milestones.ts` | **one new option on each of the five `milestone-opener-*` cards.** Nothing else in the file is touched. |
| `src/content/events/milestones.test.ts` | assertions for the five new options. |

`src/engine/**` is untouched. Verified at the end with `git status --short`.

