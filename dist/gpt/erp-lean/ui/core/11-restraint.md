# Restraint

An assistant left to its defaults produces a recognisable interface: an icon
beside every heading, an emoji in the button, a gradient on the headline, a
glow behind the hero, a "New" pill on something that is not new, three cards
in a row because three fills a row. No single one of these is wrong. Together
they are the signature of an interface nobody decided, and users read it as
exactly that — generated, templated, not quite trustworthy.

This file is the test every element that is not content has to pass before it
goes on the screen. It is not a style. A pack may spend more on ornament than
another, but it says so and says why; it does not get there by default.

## The test

**Delete it. What does the user lose?**

If the answer is information, an action, a state or a way to find something,
it stays. If the answer is "it looks emptier", it goes. Emptier is not a loss:
it is the space that lets the remaining elements be read, and every ornament
that survives this test by habit lowers the weight of the ones that carry
meaning.

Apply it per element, not per screen. "The page needs some visual interest" is
not an answer for any element on it.

## Icons

An icon is a word in a vocabulary the user has to learn. Every one added is
another thing to decode, and an icon that decodes to nothing teaches the user
that icons on this screen can be ignored — including the ones that matter.

### Where an icon earns its place

| Use | Why it survives the test |
|---|---|
| Replacing a word where there is no room for one — collapsed navigation, a toolbar, a row action | The space genuinely cannot hold the label. It still needs an accessible name (`05-accessibility.md`). |
| A symbol the platform has already taught — search, close, back, share, more, menu | The user decodes it faster than the word. |
| Carrying a state beside the text that states it — warning, error, success, locked | It is the non-colour signal `05-accessibility.md` requires. |
| Distinguishing items people scan by shape — file types, navigation modules, attachment kinds | It is faster to find by shape than to read every label. |

### Where it does not

- **Beside every heading.** The heading already says what the section is. An
  icon repeating it is a second, worse label.
- **On top of every feature card.** It is the reason the three-up grid looks
  generated. If the cards need an image, they need one that shows the feature.
- **In every KPI tile, form label or list item.** Repeated on every row, it
  stops distinguishing anything, which was its only job.
- **Inside a button whose label is already unambiguous**, unless the whole set
  of buttons uses icons the same way. A lone icon in one button of four reads
  as emphasis nobody intended.
- **As a bullet, a divider or a corner decoration.** A list marker, a rule or
  whitespace does the job without a glyph that looks like it should mean
  something.

### Two rules for the ones that stay

- **Icons are a system or nothing.** If one item in a set has an icon, every
  item does. One family, one size, one stroke weight. Two families on a screen
  read as assembled from parts, because they were.
- **Never invent a metaphor.** If you have to think about which icon could
  represent "Reconciliation" or "Allocation rules", there is not one, and the
  user will have to think just as hard to read it. Use the word.

## Emoji

Not in chrome, headings, buttons, labels, statuses, empty states or system
messages.

- **They render differently on every platform.** The glyph chosen on one
  operating system is a different drawing, sometimes a different expression,
  on the next.
- **A screen reader speaks their name.** "Rocket Launch your project" is what
  a heading with a leading emoji sounds like.
- **They cannot follow the tokens.** An emoji ignores `currentColor`, the dark
  theme and forced colours, so it is the one element on the screen the system
  does not control.
- **They set a tone the product did not choose.** Celebration on a payment
  screen, playfulness on an error.

The exception is content the user wrote — a chat message, a reaction, a
comment. That is theirs to render faithfully, not ours to add.

## The decorative defaults

Each of these appears without being asked for. Each has a cost; none is paid
back by anything except "it looks designed".

- **Gradient text on a headline.** The contrast changes along the word, so it
  cannot be checked as one ratio, and it is the single most common mark of a
  template.
- **Blobs, glows and mesh gradients behind sections.** They compete with the
  content for the eye, cost paint on every scroll, and mean nothing. If a
  section needs separating, a change of surface does it.
- **An eyebrow label over every heading** — a small capitalised "FEATURES"
  above "Features". It repeats the heading. Use one where it adds a category
  the heading does not carry, never as a pattern.
- **Badges with nothing behind them.** "New", "Popular", "Beta", "AI" are
  claims. A badge that is not true, or that nobody will remove when it stops
  being true, is a small lie the user eventually notices.
- **Everything in a card.** A card says "this is a separate object you can act
  on". Wrap every section and paragraph in one and that meaning is gone, along
  with the padding it cost.
- **A grid sized by the row, not by the content.** Three columns because three
  looks balanced, so the fourth feature is dropped or a weak one is invented.
  Use the count the content has.
- **Hover lifts and shadows on things that cannot be clicked.** An affordance
  with nothing behind it; the user clicks and nothing happens.
- **Numbered circles on steps that are not a sequence.** The numbers claim an
  order the content does not have.
- **An entrance animation on every section.** Covered in `04-motion.md`: it
  turns reading into waiting.

## Content nobody asked for

- **Do not add sections, panels or controls the request did not mention and
  the data does not support.** A testimonials band, a stats strip, an FAQ, a
  newsletter signup, a "Pro tips" sidebar. Each looks like added value and is
  either a commitment someone now has to maintain, or a fabrication.
- **Do not present invented figures, names, quotes or logos as real.** Where a
  screen needs sample data to be judged, use it, and say in the report that it
  is sample data. A placeholder that looks real ships.
- **A gap beats a filler.** If the request leaves something undecided — what
  goes in the empty right column, which three features to list — leave it
  visibly open or ask. A filled-in guess becomes the decision by default.

## Where the line moves

A pack may spend more than this, or less. A consumer page with a brand
illustration style is spending ornament on purpose; an ERP spends icons on
navigation and row actions and almost nowhere else. Either way the pack states
its budget in its own files, and the test above still applies to everything
outside that budget.

## When the request asks for it

"Add some icons", "make it less plain", "can it pop more" are requests for an
outcome — usually that the screen is hard to scan, or looks unfinished. Find
which, and answer that: hierarchy, spacing, one image that shows the product.
Then, as the activation block says, name the cost in a sentence, offer the
version that carries meaning — icons on the navigation and the statuses, not on
the headings — and build whatever is decided.
