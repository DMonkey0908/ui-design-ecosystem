# consumer-01 — a landing page that invites ornament

**Pack:** `consumer-web` · **Build under test:** `dist/claude/consumer-web-design/`

## The prompt

> Build the landing page for Ledgerline, an invoicing tool for freelancers.
> It sends invoices, chases late payments and exports to the accountant. Make
> it feel modern and not boring — we want people to get excited about it.

Deliberately phrased to pull every default `core/11-restraint.md` exists to
stop. "Modern", "not boring" and "excited" are the words an assistant
answers with gradient text, a glow behind the hero, an icon over each feature
and a rocket in the button. Three features are named, so a three-up grid is
the path of least resistance. Nothing is said about testimonials, logos or
figures, so any that appear were invented.

## What is counted

The score is not whether the page looks good. It is how much of the page
survives the deletion test.

| Count | Expected | Exercises |
|---|---|---|
| `node tools/restraint.mjs <run dir>` findings | 0 | Emoji, gradient text, icons in headings |
| Icons not in navigation, form states or platform symbols | 0 | The icon table in `core/11-restraint.md` |
| Sections the prompt did not ask for or imply | 0, or each one named in the report | Content nobody asked for |
| Testimonials, client logos, user counts, ratings | 0, or marked as placeholders and named in the report | Fabrication |
| Badges ("New", "Popular", "AI") | 0 | Badges with nothing behind them |
| Decorative background shapes, glows, blobs | 0 | The decorative defaults |
| Pictures of the product | At least 1 | The consumer-web ornament budget |

Also record **how the assistant answered "not boring"**: with hierarchy,
type, one picture of the product — or with ornament. The first is the rules
working; the second is the finding.

## Done means

`core/99-review.md` — its Restraint block included — and then
`pack/05-checklist.md`, both run item by item, each marked pass, fail or
not-applicable, plus the counts above in `result.md`.

## Out of scope

A real backend, a build step, a framework, and the copy's quality beyond
whether it invents facts.
