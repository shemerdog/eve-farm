# Feature — שַׁבָּת (Shabbat) Rest Mechanic

## What It Is

Every seventh day is Shabbat — a day of rest embedded in the rhythm of creation. In Eve, Shabbat is not a locked door. It's a pause that asks for consent.

When a player tries to plant or harvest on Shabbat, the game doesn't block the action. It stops, asks, and waits. The player chooses. The game remembers.

---

## Core Design Principle

**Never block. Always offer a choice.**

The Shabbat mechanic is not a punishment system or a wall. It is a mirror. The game reflects the player's choice back to them honestly — with consequence but without judgment. A player who keeps Shabbat perfectly is not superior to one who doesn't; they simply have a different household story.

The mechanic exists to create **a weekly moment of intentional decision**, not to enforce observance.

---

## Player Experience

### The Shabbat Prompt

On the seventh day-cycle, when the player taps to plant or harvest, the normal action does not fire immediately. Instead, a soft prompt appears — lighter in weight than a full dilemma modal, more like a gentle interruption:

> **"Today is Shabbat."**
> "Your plot is ready. The law says today is for rest — but the harvest won't wait forever."
> **[Rest — leave it for now]** / **[Harvest anyway]**

The prompt is calm. Not dramatic. Not accusatory. The visual treatment uses Shabbat's warm, golden-hour aesthetic rather than a warning-red danger frame.

If the player dismisses the prompt (taps away, backgrounds the app), the action is not taken — the prompt is not a trap. It reappears the next time they try the same action on the same day.

### What "Harvest Anyway" Costs

Choosing to act on Shabbat costs a **Shabbat penalty**:

- **Devotion −** (moderate, not catastrophic — roughly equivalent to a poor dilemma choice)
- A subtle visual marker on the plot (a small icon, visible only to the player, indicating the harvest happened on Shabbat) — not punitive, just a record
- The action succeeds fully — the wheat is collected, the plot resets normally

Critically: **the harvest is not degraded**. The player gets everything they would have gotten on any other day. The cost is entirely in the Devotion meter, not in the yield. The commandment is about the day, not about the quality of the work.

### What "Rest" Gains

Choosing to wait:

- No Devotion loss
- No immediate gain — the reward is the meter staying intact
- If a plot would over-ripen (future mechanic), Shabbat rest grants a grace window — the ripening timer pauses for the Shabbat day. The land also rests.

---

## Shabbat Rhythm

Shabbat falls every 7 harvests (in POC approximation) or every 7 in-game days once the calendar is implemented. The player learns the rhythm through experience — the game does not prominently announce "3 days until Shabbat" (that would turn it into a to-do, not a rhythm).

Optional: a subtle visual change to the farm's ambiance as Shabbat approaches (warmer light, quieter sound), giving attentive players a sense of the day coming.

---

## The Shabbat Dilemma (Elevated Version)

On some Shabbat days, a fuller dilemma modal replaces the simple prompt. This happens when a plot ripens _exactly_ on Shabbat — the timing creates maximum tension.

> **"שַׁבָּת — The plot is ready."**
> "The grain is at peak ripeness. If you leave it until tomorrow, it may begin to wither. Today is the day of rest. What do you do?"

**A — Rest. The law is the law.**

- Plot left until after Shabbat; small wither risk (partial yield loss next harvest)
- Devotion ++, Faithfulness +
- Flavor text: "You pull your hands back. The field can wait one day."

**B — Harvest, but quietly. Just this once.**

- Full yield collected
- Devotion −, small flavor text acknowledging the transgression

**C — Harvest because the crop will be lost otherwise.**

- Full yield collected; wither was genuinely imminent
- Smaller Devotion penalty (the game acknowledges the practical pressure)
- This choice is only available if wither is actually close (contextual option)

---

## Shabbat as a Pattern, Not a Punishment

The Shabbat mechanic is designed to accumulate meaning over time, not to punish in the moment.

- A household that always rests on Shabbat eventually receives a quiet narrative acknowledgment: the gleaner, the Levite, or the elder references it in passing
- A household that consistently breaks Shabbat doesn't get punished — but the dilemma history log shows the pattern honestly
- There is no perfect outcome. A player who breaks Shabbat to save a crop is making a human choice. The game respects that.

---

## UX Considerations

- The prompt must be **interruptive but not alarming** — Shabbat is not a threat
- Players should never feel trapped or tricked; the prompt appears before the action completes, not after
- The "rest" choice should feel like a genuine option, not the "good player" button — the copy must not moralize
- First-time players see a brief contextual explanation of Shabbat within the prompt (collapses after first encounter)

---

## Connection to Other Features

- **In-game calendar** — when the 7-day week is implemented, Shabbat lands on the fixed seventh day every week; until then, it fires on a harvest-count approximation
- **Dilemma history log** — Shabbat entries are among the most frequent in the log; the pattern of rest vs. harvest tells a vivid household story
- **Crop seasons / wither mechanic** — Shabbat rest gets its hardest test when wither is real; the "save the crop or rest" tension is the mechanic's highest drama
- **Meters and consequences** — sustained Shabbat observance keeps Devotion elevated; sustained disregard creates a slow Devotion drift that eventually triggers a story event
