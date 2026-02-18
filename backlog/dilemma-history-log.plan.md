# Feature — Dilemma History Log

## What It Is

A scrollable record of every dilemma the player has faced and how they chose. Not a score sheet — a story. The log is the household's moral autobiography: the accumulated texture of hundreds of small decisions that reveal who this family is, how they live, what they prioritize when it costs them something.

---

## Why It Matters

The dilemmas are the core of Eve's identity. Without a history, each dilemma lands and disappears — felt in the moment, forgotten after. The log transforms the dilemma system from a series of isolated events into a **continuous household narrative**. Players who can see their pattern will care about it.

This feature also answers a quiet question players develop over time: *Who am I becoming?* The log makes that visible without reducing it to a score.

---

## Player Experience

### Accessing the Log

The log lives in a dedicated "Household Record" or "Book of Memory" panel — a journal metaphor rather than a stats screen. Accessible from the HUD via a small scroll/book icon. The entry point should feel like opening something meaningful, not navigating to a settings menu.

### Entry Format

Each entry is a single card:

```
[Crop icon]  [Dilemma name in Hebrew + transliteration]
[Brief narrative line — what was at stake]
[The choice made — in the player's own voice]
[Meter impact — simple +/− indicators, not raw numbers]
[Season / time marker]
```

Example:
```
🌾  פֵּאָה — Peah
"The harvest was done. The poor waited at the field's edge."
→ You left generous corners — three parts in ten.
  Morality +  Devotion +
  Early Spring, Year 1
```

### Tone of Choice Descriptions

Choices are described in second person, past tense, warmly — as if written by someone who witnessed and understood. Not clinical ("Choice A selected"). Not praising or blaming. Just honest:

- "You gathered the fallen stalks before walking away."
- "You let the sheaf lie. Someone else will find it."
- "You harvested on Shabbat. The wheat was almost over-ripe."
- "You sent the neighbor to find another field. It cost you the relationship for a season."

### Pattern Recognition (Household Voice)

Every 10–15 entries, the log surfaces a brief **household reflection** — a single line synthesized from recent choices, written in a warm narrative voice:

> "Your household tends to give at the edges but hold the center."
> "This family has kept Shabbat without fail. The land has learned to expect it."
> "You've broken with the gleaning commandments three seasons running. The gleaner no longer comes to your field."

These reflections are not moral grades. They are observations — the kind a village elder might make while watching a family over years. They can be positive, neutral, or gently honest about patterns the player might not have noticed.

### Filtering and Navigation

- Scrollable list, most recent first
- Filter by dilemma type (optional, secondary feature)
- Tap any entry to expand it to its full original dilemma text — a way to revisit the moment
- Entries do not disappear or expire; the full history is always available

---

## What the Log Is Not

- **Not a score screen** — there is no aggregate morality grade, no "you scored 73/100 on ethics"
- **Not a trophy case** — the log doesn't celebrate good choices or shame bad ones
- **Not a requirement** — players who never open the log still benefit from the dilemma system; the log is for players who want the reflective layer
- **Not punitive** — past entries cannot be changed; the log is a record, not a judgment

---

## Emotional Design Goals

A player who opens the log after 30 harvests should feel something — recognition, surprise, maybe mild discomfort at a pattern they didn't notice consciously. The log should feel like rereading old letters: the decisions made sense at the time; reading them now reveals something.

The ideal outcome: a player who has played consistently in "harvest on Shabbat" mode opens the log, sees 12 consecutive Shabbat harvest entries, and makes a different choice next time — not because the game told them to, but because they saw their own pattern.

---

## Stretch: Household Legacy

In later versions, the log can be named ("The Record of the House of [Player Name]") and potentially shared — not competitively, but as a story artifact. A player might share a screenshot of their log as a reflection of a playing session, the way someone might share a journal page.

This is a social feature for a later date, but the log's format should be designed with this shareability in mind from the start.

---

## Connection to Other Features

- **All dilemmas** — the log is a direct dependency on the full dilemma set; it only becomes interesting at sufficient volume (aim for 8+ dilemma types before shipping the log)
- **Shabbat mechanic** — Shabbat entries will be among the most frequent in the log and will dominate the household reflection patterns most visibly
- **NPC relationships** — log entries can reference NPCs by name where relevant ("The gleaner was nearby when you gathered the stalks")
- **In-game calendar** — the time marker on each entry becomes richer once seasons and festivals are real; "Second harvest of Shavuot, Year 3" means more than a harvest count
- **Standing decisions / Minhag** — the log shows what patterns have calcified into household tradition; a Minhag is essentially a log pattern made explicit
