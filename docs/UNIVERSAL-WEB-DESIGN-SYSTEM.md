# Beast-Level Universal Web Design System
## Apple-Inspired Restraint + UX Psychology + Conversion + Accessibility

> A universal design language for upgrading generic websites into calm, premium, high-trust, high-usability interfaces.

**Purpose:** Use this document as the master design/UX specification for an AI coding agent, designer, or developer working on an existing website.

**Core idea:** Do not blindly copy Apple. Extract the transferable principles: hierarchy, whitespace, restraint, typography, consistency, product-first visuals, deliberate motion, cognitive-load reduction, and ruthless prioritization.

**Source reference:** Apple-style reference supplied by the user. fileciteturn0file0

---

# 1. MASTER DIRECTIVE

When improving an existing website:

1. **Inspect before changing.**
2. Identify what currently makes the website feel weak, cheap, confusing, generic, crowded, inconsistent, slow, or untrustworthy.
3. Preserve working functionality and business intent.
4. Build a visual hierarchy before adding decoration.
5. Reduce cognitive load before adding features.
6. Use the design system below as the default language.
7. Adapt the language to the website's brand instead of making every website look identical.
8. Prefer subtraction over addition.
9. Make important actions obvious without making the interface loud.
10. Every visual decision must have a reason.

The target feeling is:

**clear → calm → premium → intentional → trustworthy → effortless**

---

# 2. DESIGN PHILOSOPHY

## 2.1 The 10 Commandments

1. **Hierarchy before decoration.**
2. **Whitespace is a component.**
3. **One dominant action per context.**
4. **Consistency beats novelty.**
5. **Recognition beats recall.**
6. **The interface should carry complexity, not the user.**
7. **Motion explains; it does not entertain.**
8. **Color has meaning; do not use it randomly.**
9. **Content determines layout, not the other way around.**
10. **If removing something improves clarity, remove it.**

---

# 3. UX PSYCHOLOGY ENGINE

Apply these principles intentionally rather than mechanically.

## Hick's Law
More choices increase decision time.

**Use:** fewer nav items, fewer competing CTAs, clear defaults.

## Fitts's Law
Important targets should be easy to reach and hit.

**Use:** generous button sizes, comfortable touch targets, sensible placement.

## Jakob's Law
Users expect familiar interaction patterns.

**Use:** conventional navigation, search, carts, settings, forms, back behavior.

## Miller's Law
Working memory is limited.

**Use:** chunk information, simplify navigation, break long workflows.

## Gestalt: Proximity
Nearby elements feel related.

**Use:** tighten related label/content/action groups and increase spacing between unrelated groups.

## Gestalt: Similarity
Similar-looking objects feel related.

**Use:** reusable components and consistent states.

## Gestalt: Continuity
Users follow visual paths.

**Use:** alignment, directional imagery, sequential layouts.

## Gestalt: Figure/Ground
Foreground must separate clearly from background.

**Use:** strong hierarchy and restrained surfaces.

## Von Restorff Effect
A visually different element gets attention.

**Use:** reserve emphasis for the most important action or information.

## Goal-Gradient Effect
Motivation rises near completion.

**Use:** progress indicators, setup completion, checkout steps.

## Zeigarnik Effect
Incomplete tasks remain mentally active.

**Use:** completion states and progress, but never manufacture anxiety.

## Serial Position Effect
Beginning and ending positions receive strong attention/memory.

**Use:** prioritize navigation and page-end CTAs.

## Peak-End Rule
People remember peaks and endings disproportionately.

**Use:** make important moments and completion states polished.

## Tesler's Law
Some complexity is unavoidable.

**Rule:** let the product/system handle it instead of forcing the user to.

## Progressive Disclosure
Reveal complexity only when needed.

**Use:** advanced settings, expandable details, secondary actions.

## Recognition Over Recall
Show users what they need instead of making them remember it.

**Use:** labels, breadcrumbs, visible states, suggestions, recent items.

## Aesthetic-Usability Effect
People often perceive attractive interfaces as easier to use.

**Important:** aesthetics must support usability, not conceal bad UX.

---

# 4. PRE-FLIGHT WEBSITE AUDIT

Before touching code, score the current website.

Use 0–10 for each:

| Area | Score |
|---|---:|
| First-impression clarity | /10 |
| Visual hierarchy | /10 |
| Navigation clarity | /10 |
| Typography | /10 |
| Spacing | /10 |
| Alignment | /10 |
| Color discipline | /10 |
| CTA clarity | /10 |
| Component consistency | /10 |
| Mobile UX | /10 |
| Accessibility | /10 |
| Loading/perceived performance | /10 |
| Trust signals | /10 |
| Content clarity | /10 |
| Conversion flow | /10 |
| Motion quality | /10 |
| Error/empty/loading states | /10 |
| Overall visual polish | /10 |

Then identify:

### Critical defects
Issues that actively damage usability, trust, conversion, or accessibility.

### High-impact defects
Issues users may not consciously notice but that make the interface feel amateur.

### Polish defects
Small inconsistencies that reduce perceived quality.

**Never start by fixing polish if critical defects remain.**

---

# 5. THE 5-SECOND TEST

A new visitor should understand within roughly 5 seconds:

- What is this?
- Who is it for?
- Why should I care?
- What can I do next?

If the answer is unclear, redesign the hero before polishing cards.

---

# 6. VISUAL HIERARCHY

Every page needs a deliberate hierarchy:

**Level 1 — Primary message**
- What matters most?

**Level 2 — Supporting explanation**
- Why does it matter?

**Level 3 — Primary action**
- What should the user do?

**Level 4 — Supporting actions**
- What else can they do?

**Level 5 — Metadata**
- Details, legal, secondary information.

Do not give every element equal visual weight.

---

# 7. UNIVERSAL LAYOUT SYSTEM

## Page width

Default:

- Desktop max-width: 1200–1280px
- Reading text max-width: 560–720px
- Wide visual sections may exceed content width.
- Full-bleed sections are allowed.

## Grid

Default:

- 12-column desktop grid
- 4–8 column tablet depending on layout
- 4-column mobile conceptual grid
- Consistent gutters

## Spacing

Use a 4px base unit.

Preferred rhythm:

`4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40 / 48 / 64 / 80 / 96 / 120 / 144`

Do not invent arbitrary spacing without reason.

## Section rhythm

Use generous separation between major ideas.

Typical:

- compact: 64–80px
- standard: 96–120px
- hero/major transition: 120–160px

Do not force every section to have identical height.

---

# 8. TYPOGRAPHY SYSTEM

Use a modern sans-serif by default.

Preferred stack:

`Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Use SF Pro only where legally/licensed and technically appropriate. Do not falsely claim a site uses Apple's proprietary font.

## Type scale

| Role | Desktop | Mobile |
|---|---:|---:|
| Display | 72–96px | 44–56px |
| H1 | 56–80px | 40–48px |
| H2 | 40–56px | 32–40px |
| H3 | 28–40px | 24–32px |
| Body large | 20–21px | 18–20px |
| Body | 16–18px | 16–18px |
| Small | 13–14px | 13–14px |
| Micro | 11–12px | 11–12px |

## Typography rules

- Display headings: 600–700.
- Body: 400–450.
- Supporting headings: 500–650.
- Use negative tracking for very large display text.
- Avoid extreme tracking on body text.
- Keep body line length controlled.
- Prefer 1.45–1.7 line-height for readable paragraphs.
- Tighten display line-height to roughly 1.0–1.1.
- Never use typography merely because it looks impressive; it must preserve hierarchy.

---

# 9. COLOR SYSTEM

Apple's supplied reference uses a restrained near-monochrome system:

- `#1d1d1f` primary ink
- `#707070` secondary
- `#f5f5f7` alternate canvas
- `#ffffff` paper
- `#0071e3` action blue
- `#0066cc` link blue

Treat these as **reference values**, not mandatory colors for every brand.

## Universal rule

Use:

- 1 dominant background
- 1 primary text
- 1 secondary text
- 1 primary action/accent
- semantic success/warning/error colors
- optional brand/product colors

### Color ratio guideline

A useful starting point:

**60% dominant surface / 30% secondary surface / 10% accent**

Not a mathematical requirement.

### Color discipline

If everything is colorful, nothing is important.

Color should communicate:

- action
- status
- category
- brand
- product identity

Never add gradients just because they are trendy.

---

# 10. SURFACE LANGUAGE

Default premium system:

- flat surfaces
- subtle tonal contrast
- generous whitespace
- minimal borders
- minimal shadows
- large but controlled radii

## Default surfaces

| Level | Purpose |
|---|---|
| 0 | Main canvas |
| 1 | Alternate section |
| 2 | Hover/pressed surface |
| 3 | Floating/navigation surface |
| 4 | Modal/popover |

Prefer **background contrast over borders** for major section separation.

Shadows are allowed when needed for true elevation. They are not mandatory.

---

# 11. BORDER RADIUS

Use a coherent radius family.

Example:

- small controls: 8–12px
- inputs: 10–14px
- cards: 20–28px
- large visual cards: 28–36px
- pills: 9999px

Do not mix 4px, 7px, 19px, 31px, and 43px randomly.

---

# 12. BUTTON SYSTEM

Every context should have a clear action hierarchy.

### Primary
Filled brand/action color.

### Secondary
Outlined or tonal.

### Tertiary
Text link.

### Destructive
Semantic danger style.

Rules:

- One dominant primary CTA per major section.
- Buttons must have obvious hover, active, disabled, and focus states.
- Button labels should describe the result.
- Prefer `Start free` over `Click here`.
- Never make every button primary.

---

# 13. NAVIGATION

Navigation should answer:

**Where am I? Where can I go? What is most important?**

Rules:

- Keep primary navigation concise.
- Group related destinations.
- Use familiar labels.
- Highlight current location.
- Make mobile navigation deliberate rather than merely collapsed.
- Do not hide essential actions inside unnecessary menus.

---

# 14. HERO SYSTEM

The hero should usually contain:

1. Optional eyebrow
2. One strong headline
3. One concise explanation
4. Primary CTA
5. Optional secondary CTA
6. Relevant visual proof/product image

Do not put:

- five CTAs
- giant paragraphs
- meaningless slogans
- decorative noise
- unrelated feature grids

The hero's job is **orientation + desire + next action**.

---

# 15. CONTENT DESIGN

## Rule: One idea per visual block

Instead of:

> giant card containing 11 features, 4 paragraphs and 7 buttons

split it into meaningful units.

## Content hierarchy

**Claim → Evidence → Explanation → Action**

Example:

**Fast deployment**

Deploy your application without managing infrastructure.

`View deployment options →`

---

# 16. CARDS

Cards are useful, but overuse creates "dashboard soup."

Use cards when content genuinely benefits from grouping.

Do not put every sentence in a card.

A card should have:

- clear purpose
- clear hierarchy
- internal spacing
- consistent radius
- meaningful interaction if interactive

---

# 17. FORMS

Rules:

- Ask only what is necessary.
- Keep labels visible.
- Use correct input types.
- Validate close to the field.
- Explain errors in human language.
- Preserve user input after errors.
- Show password requirements before submission.
- Use sensible defaults.
- Group related fields.

---

# 18. MICROINTERACTIONS

Every meaningful interaction should communicate state:

**Idle → Hover → Focus → Active → Loading → Success/Error**

Motion should generally be:

- quick
- purposeful
- reversible
- subtle

Avoid animation on everything.

---

# 19. MOTION SYSTEM

Use motion to communicate:

- hierarchy
- continuity
- cause/effect
- state changes
- spatial relationships

Avoid:

- random floating
- excessive parallax
- slow page transitions
- animations that delay users

Respect:

`prefers-reduced-motion`

---

# 20. LOADING / EMPTY / ERROR STATES

A production website is not only its happy path.

Every important component should consider:

### Loading
Use skeletons or clear progress.

### Empty
Explain why it is empty and what the user can do.

### Error
Explain:
1. what happened
2. why it may have happened
3. what to do next

### Success
Confirm the result.

---

# 21. ACCESSIBILITY

Follow WCAG principles:

**Perceivable → Operable → Understandable → Robust**

Minimum expectations:

- keyboard navigation
- visible focus
- semantic HTML
- accessible names
- adequate contrast
- meaningful alt text
- labels for form fields
- no color-only communication
- reduced motion support
- sensible heading structure

Accessibility is part of premium design.

---

# 22. RESPONSIVE SYSTEM

Do not "shrink desktop."

Recompose.

### Desktop
More horizontal relationships.

### Tablet
Compress grid and reduce type.

### Mobile
Prioritize:

1. content
2. action
3. navigation
4. supporting details

Use responsive typography with `clamp()` where appropriate.

---

# 23. IMAGE & VISUAL DIRECTION

Use imagery according to brand.

Premium/product sites:
- clean backgrounds
- deliberate crops
- large visuals
- high-quality assets
- minimal decoration

Editorial sites:
- strong photography
- intentional composition

SaaS:
- product UI screenshots
- diagrams
- contextual visuals

Do not use random stock images merely to fill space.

---

# 24. ICONOGRAPHY

Use one coherent icon family.

Rules:

- consistent stroke width
- consistent optical size
- consistent corner language
- don't mix radically different icon styles

Icons should clarify, not decorate every sentence.

---

# 25. TRUST SYSTEM

Add trust where it reduces uncertainty:

- real testimonials
- customer logos
- security information
- transparent pricing
- clear policies
- contact information
- credentials
- case studies
- realistic claims

Never invent social proof.

---

# 26. CONVERSION SYSTEM

Use the AIDA mental model:

**Attention → Interest → Desire → Action**

Then validate:

- Is the value proposition obvious?
- Is proof present?
- Is friction minimized?
- Is the next action obvious?
- Is pricing understandable?
- Is the CTA consistent?

---

# 27. INFORMATION ARCHITECTURE

Before changing visual design, ask:

- What are the user's top tasks?
- What is the site's primary goal?
- What pages are essential?
- Which pages are redundant?
- Which navigation items can be merged?
- What content is buried?
- What content is irrelevant?

A beautiful bad information architecture is still bad UX.

---

# 28. INVISIBLE POLISH CHECKLIST

These tiny details create disproportionate perceived quality:

- optical centering
- baseline alignment
- consistent icon sizes
- consistent button heights
- consistent radii
- predictable spacing
- matching left edges
- controlled text widths
- intentional line breaks
- no orphaned headings
- balanced card padding
- correct image cropping
- subtle hover transitions
- clear focus states
- consistent disabled states
- meaningful cursor states
- no layout jumping
- stable navigation
- correct z-index layering
- sensible mobile gutters
- consistent empty space
- no random shadows
- no random gradients
- no accidental 1px misalignments

---

# 29. ANTI-GENERIC DESIGN RULES

Avoid the common AI-generated website look:

- excessive glassmorphism
- excessive gradients
- glowing borders
- random blobs
- giant meaningless hero text
- every section centered
- every element inside a card
- excessive rounded rectangles
- purple/blue gradient by default
- too many font weights
- too many colors
- excessive animations
- fake testimonials
- fake statistics
- decorative icons everywhere
- huge navigation menus
- CTA repetition without strategy

**Premium does not mean flashy.**

---

# 30. APPLE-INSPIRED MODE

Use this mode when the brand/product benefits from extreme restraint.

Characteristics extracted from the supplied Apple reference:

- near-monochrome interface
- very large display typography
- generous whitespace
- full-width sections
- alternating light surfaces
- minimal borders
- restrained shadows
- pill CTAs
- large rounded visual cards
- product-first imagery
- quiet navigation
- blue reserved for important actions
- color primarily carried by the product/content

Do not copy Apple's branding, logos, proprietary assets, or exact visual identity unless authorized.

---

# 31. UNIVERSAL DESIGN ADAPTATION

Before applying Apple-inspired styling, classify the website:

### Type A — Premium/product
Use strong Apple-inspired restraint.

### Type B — SaaS
Use restraint + denser information + stronger dashboard patterns.

### Type C — E-commerce
Use restraint + product grids + stronger conversion signals.

### Type D — Portfolio
Use typography + visual storytelling + expressive art direction.

### Type E — Marketplace
Prioritize search, filters, comparison and information density.

### Type F — Education
Prioritize clarity, progress, discoverability and accessibility.

### Type G — Government/institutional
Prioritize accessibility, trust, predictability and content hierarchy.

### Type H — Media/editorial
Prioritize reading width, typography, hierarchy and content discovery.

Never force one visual language onto every category.

---

# 32. WEBSITE IMPROVEMENT WORKFLOW

## Phase 1 — Audit
Inspect:
- routes
- pages
- components
- styles
- typography
- colors
- spacing
- responsiveness
- accessibility
- performance
- content
- states

## Phase 2 — Diagnose

Produce:

### Critical
Must fix immediately.

### High impact
Strongly affects perceived quality or usability.

### Medium
Noticeable but not destructive.

### Polish
Small professional improvements.

For every problem provide:

`Problem → Why it hurts → Principle violated → Fix → Expected impact`

## Phase 3 — Establish Design Tokens

Create:
- colors
- type
- spacing
- radii
- shadows
- motion
- breakpoints
- component states

## Phase 4 — Fix Global Shell

Fix:
1. typography
2. navigation
3. page width
4. background system
5. spacing
6. buttons
7. global states

## Phase 5 — Fix High-Impact Pages

Usually:

1. homepage
2. primary conversion page
3. product/service pages
4. forms
5. dashboard
6. secondary pages

## Phase 6 — Component Consistency

Audit every:
- button
- card
- input
- badge
- modal
- tooltip
- dropdown
- table
- navigation
- footer

## Phase 7 — Responsive Pass

Check:
- 1440px
- 1280px
- 1024px
- 768px
- 480px
- 375px

## Phase 8 — Interaction Pass

Check:
- hover
- focus
- active
- loading
- success
- error
- empty
- disabled

## Phase 9 — Accessibility Pass

Keyboard + screen reader semantics + contrast + motion.

## Phase 10 — Final Polish

Fix:
- 1–3px alignment errors
- spacing inconsistencies
- awkward wrapping
- icon alignment
- image cropping
- transition timing

---

# 33. AI AGENT EXECUTION PROMPT

When this document is supplied to an AI coding agent, instruct it:

> First audit the existing website. Do not immediately rewrite it.
>
> Identify the largest UX, visual, information architecture, accessibility, responsive, and conversion problems.
>
> Rank problems by user impact.
>
> Preserve working functionality unless there is a clear reason to change it.
>
> Establish a coherent design system before making page-specific styling decisions.
>
> Apply the principles in this document at the highest-impact locations first.
>
> Use Apple-inspired restraint only where appropriate to the brand.
>
> Reduce visual noise, cognitive load, unnecessary choices, inconsistent components, random spacing, random colors, and decorative elements.
>
> Make hierarchy obvious.
>
> Make actions obvious.
>
> Make states obvious.
>
> Make the interface responsive and accessible.
>
> After implementation, re-audit the website and list remaining weaknesses.
>
> Never declare the website finished simply because it looks prettier.

---

# 34. DEFINITION OF "DONE"

A redesign is not done when it looks good.

It is done when:

- the purpose is immediately understandable
- navigation is predictable
- hierarchy is obvious
- spacing is systematic
- typography is coherent
- colors have meaning
- components behave consistently
- mobile is intentionally designed
- keyboard interaction works
- states are handled
- errors are understandable
- performance is acceptable
- CTAs are clear
- unnecessary complexity has been removed
- the design feels like one system

---

# 35. FINAL QUALITY TEST

Ask:

### Clarity
Can a stranger understand the page quickly?

### Hierarchy
Can I identify the most important element instantly?

### Simplicity
Can anything be removed?

### Consistency
Does every component belong to the same system?

### Psychology
Are choices, actions and progress easy to understand?

### Trust
Does the interface feel credible?

### Accessibility
Can different users operate it?

### Responsiveness
Does it remain excellent on small screens?

### Motion
Does animation explain something?

### Polish
Would a designer notice any accidental inconsistency?

If the answer is "no" to any critical question, keep improving.

---

# 36. MASTER PRINCIPLE

> **Do less, but make every remaining decision intentional.**

The highest-quality interface is not the one with the most effects.

It is the one where the user rarely has to think about the interface at all.
