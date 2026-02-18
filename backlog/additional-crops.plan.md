# Feature — Additional Crops

## What It Is

Expanding beyond wheat to the full palette of ancient Israelite agriculture. The Seven Species of the Land of Israel — wheat, barley, grapes, figs, pomegranates, olives, and dates — form the natural crop roster. Each crop is not just a reskin of wheat: each has a distinct **growth rhythm, yield profile, seasonal window, and relationship to the dilemma system**.

Crops are the material foundation of Eve's world. The richer the crop system, the more the farming loop earns its place alongside the ethical layer.

---

## Design Principles

**Each crop should feel different, not just look different.**
Growth duration, yield amount, and seasonal availability should vary meaningfully. A player who plants olives is making a different kind of commitment than a player who plants barley.

**Crops unlock progressively, not all at once.**
New crop types should arrive as milestones — tied to leveling, tile unlocks, or seasonal events. Each new crop introduction is a small celebration and a new layer of complexity.

**Crops connect to dilemmas.**
Every crop type introduced brings at least one dilemma it can trigger. Grapes → Kilayim (vineyard mixing). Olives → Orlah (young tree patience). Barley → a Shavuot first-fruits event. The crop system and dilemma system should grow together.

---

## The Crops

### 🌾 Wheat (current)
- Growth: 15 seconds (POC)
- Yield: 10 wheat per harvest
- Season: spring/autumn (flexible in POC)
- Dilemmas: Peah, Ma'aser, Leket, Shikchah, Shabbat (all the baseline commandments)
- Notes: Unchanged from POC; the reference crop all others are compared against

---

### 🌿 Barley (שְׂעֹרָה)
**First new crop to add.**
- Growth: faster than wheat (shorter timer) — barley is a hardier, earlier grain
- Yield: slightly less per harvest than wheat
- Season: early spring; the first crop of the agricultural year
- Special: Barley is the crop of the Omer — the 49-day counting period between Pesach and Shavuot. A barley harvest during that window carries a special dilemma tone.
- Dilemmas: Leket, Peah (same as wheat, but the narrative flavor changes — barley harvest feels more urgent, less abundant)
- Why first: simplest to add; same mechanic as wheat with adjusted numbers and a new visual

---

### 🍇 Grapes (עֵנָב)
- Growth: long timer — grapes require patience (longest of the early crops)
- Yield: high when it arrives; worth the wait
- Season: late summer
- Special: harvested in clusters; visual payoff is high
- Production chain (future): grapes → winepress → wine; in the short term, grapes can be sold as-is or offered directly
- Dilemmas: Kilayim (vineyard mixing prohibition is especially strict), Orlah (young vine), Bikkurim (first vintage)
- Notes: Grapes introduce the idea of a **long-investment crop** — the player commits a plot for a longer period and waits. This creates a new category of farming decision.

---

### 🫒 Olives (זַיִת)
- Growth: very long timer — olive trees are generational investments in historical reality; in-game this is modeled as the longest single-crop cycle
- Yield: moderate amount of olive oil (new resource type, or abstracted as wheat-equivalent in early implementation)
- Season: autumn
- Special: the olive branch is a symbol of peace; an olive harvest during a conflict event (future) carries a unique dilemma
- Dilemmas: Orlah (young tree), Shabbat (olives left on the tree too long begin to fall and are lost), Peah (corners of the olive grove)
- Notes: Olives are a statement crop — a player who plants an olive plot is committing for the long term. They should feel weighty and rewarding.

---

### 🌾 Figs, Pomegranates, Dates *(later wave)*
- These three complete the Seven Species but are best added after grapes and olives are stable
- Each brings a distinct visual identity and at least one unique dilemma angle
- Dates are associated with desert/oasis tiles (future map feature); figs with shade and summer; pomegranates with festivity and Rosh Hashanah
- Plan separately when the time comes

---

## Crop Selection UX

When the player taps an empty plot, instead of immediately planting wheat, a **crop selection step** appears:

- A small horizontal scroll of available crop tiles (icon + name + growth time)
- Locked crops are visible but greyed out with an unlock hint
- The last-planted crop is highlighted as the default (fast re-planting for habitual farmers)
- Selection is a single tap — no confirmation dialog needed

The crop selection UI should feel like opening a seed pouch, not navigating a menu.

---

## Plot Identity

Once a crop type is planted, the plot tile **takes on that crop's visual identity** for the full growth cycle:
- Soil → seedling → growing → ready states, all in the crop's color palette and form
- A harvested olive plot looks different from a harvested barley plot, even in the empty state (soil texture, root traces)
- This visual variety makes the 2×2 farm feel alive and diverse even without adding new mechanics

---

## Yield and Economy

Different crops should have meaningfully different value profiles:

| Crop | Growth | Yield | Seasonal |
|------|--------|-------|----------|
| Barley | Short | Low-mid | Early spring |
| Wheat | Medium | Medium | Spring/autumn |
| Grapes | Long | High | Late summer |
| Olives | Very long | Medium-high | Autumn |

"Yield" in the early game is abstracted to wheat-equivalent resources. In later versions, each crop produces its own resource type (grain, oil, wine) feeding into production chains. The early implementation can collapse all crops into a single resource for simplicity, with distinct crop identity primarily expressed through growth time, visual, and dilemma triggers.

---

## Progressive Unlock

Crops unlock through one of these gates (to be decided per crop):
- **Level gate** — reach a certain XP level
- **Tile gate** — unlock a new land tile that supports that crop type
- **Seasonal event gate** — a festival or NPC triggers the introduction
- **Story gate** — the Levite or Elder character brings seeds as a gift after a positive relationship event

Barley should be the earliest unlock — ideally available within the first few sessions. Grapes and olives come later, as long-term investment mechanics.

---

## Connection to Other Features

- **Dilemma system** — every new crop type activates new dilemma variants (Orlah for tree crops, Kilayim when neighbors appear, Bikkurim at first harvest)
- **Shabbat mechanic** — different crops create different urgency profiles; a grape harvest ripening on Shabbat is a harder choice than barley because grapes are rarer and harder-won
- **Production chains** — grapes and olives feed into winepress and olive press (future buildings); planning the crop system now should leave room for these chains without requiring them immediately
- **In-game calendar / seasons** — seasonal availability windows make crop selection a genuine strategic decision, not just a cosmetic one
- **World map / tile types** — certain crops belong on certain tile types (olives on hillside tiles, grapes on vineyard tiles, dates on desert-adjacent tiles); the crop system should be designed with tile affinity in mind
- **Bikkurim dilemma** — every new crop's first harvest is a Bikkurim trigger moment; the more crops, the more Bikkurim moments, the more the first-fruits dilemma feels like a recurring seasonal ritual rather than a one-time event
