# Bikkurim — First Fruits

> **Scope note:** Bikkurim is not a standalone dilemma. It is the anchor event of the **Shavuot seasonal feature** — part of a broader real-calendar holiday system (see `seasonal-events.plan.md` when that plan is written). Like Christmas themes in other farm games, Eve's seasonal events fire during the real-world Jewish holiday window and transform the game's look, feel, and available dilemmas for that period. Bikkurim is Shavuot's signature event.

---

## What It Is

The first harvest of each crop season belongs to the communal altar as an offering — brought with ceremony, not convenience. Bikkurim is a joyful commandment in its origin: a procession to Jerusalem, a basket of first fruits, a declaration of gratitude. It is one of the most celebratory acts in the agricultural calendar.

In Eve, Bikkurim arrives as the centerpiece of the Shavuot seasonal window. The farm takes on a harvest-festival look. The dilemma isn't "give or don't give" — it's **how much, how publicly, and whether you genuinely feel it or perform it.**

---

## The Shavuot Seasonal Window

During the real-world Shavuot period (the 6th and 7th of Sivan, roughly late May–early June depending on the year), the game enters a Shavuot seasonal mode:

- **Visual transformation** — the farm takes on a lush, late-spring look: tall wheat, abundant greenery, warm golden light. Decorative harvest baskets and floral garlands appear around the farm edges.
- **Festival music** — the ambient soundscape shifts to a more celebratory folk tone for the duration
- **The Bikkurim event** fires once during this window, replacing the next scheduled dilemma in the cycle
- **Seasonal greeting** — a brief opening card when the player first opens the app during the window: "חַג שָׁבוּעוֹת שָׂמֵחַ — The harvest season has arrived."
- A small Shavuot badge or seasonal marker appears on the farm UI for the duration

The window lasts roughly 48–72 real-world hours. Players who don't open the game during the window miss the event for that year — just like missing a seasonal event in any live game. There is no makeup; the loss is gentle and the event returns next year.

---

## The Bikkurim Dilemma

The Bikkurim event fires once per Shavuot window, presented as a ceremonial moment rather than a routine dilemma. The modal is styled differently from standard dilemmas — larger, more illustrative, visually festive.

**Narrative:**
> "The harvest is in. The season has been good. By tradition, the first of everything — the finest, the earliest, the best — belongs at the altar. The village gathers for the Bikkurim procession. What will your household bring?"

The dilemma is about the **quality and sincerity of the offering**, not just the quantity.

### Choices

**A — A full, joyful offering**
"You prepare a generous basket of your finest harvest — the best of what the season gave you — and bring it to the altar with a full heart."
- Moderate resource cost (the best portion of the current harvest)
- Devotion ++, Morality +, Faithfulness +
- Community reputation boost
- Flavor text: "The elder receives your basket. The village celebrates together. This is what the season is for."

**B — A modest, honest offering**
"You bring what you can — not the finest, not the most, but genuine."
- Small resource cost
- Devotion +, Faithfulness +
- Flavor text: "The offering is small but real. The altar doesn't ask for what you don't have."

**C — You keep the first yield this season**
"The harvest was difficult. You'll honor the tradition next year."
- No resource cost
- Faithfulness −, Devotion −
- Flavor text is compassionate: "The procession moves without you. The altar stands empty this season. You tell yourself you'll make it right."

**D — You perform the offering without feeling it** *(optional fourth choice, tone experiment)*
"You bring the basket because it's expected. Your heart isn't in it."
- Small resource cost
- Devotion neutral (no gain despite the offering)
- Faithfulness − (the act without the intention counts against sincerity, not generosity)
- Flavor text: "The basket is delivered. The motions are correct. Something feels hollow."
- *This choice is the most philosophically interesting: it asks whether ritual without intention has value. Include if the tone feels right; cut if it feels too heavy.*

---

## Seasonal Events System — Broader Vision

Bikkurim/Shavuot is the first instance of a recurring system. Each major Jewish holiday becomes a seasonal window with its own:

| Holiday | Real-world timing | Seasonal transformation | Signature event |
|---------|-------------------|------------------------|----------------|
| **שָׁבוּעוֹת Shavuot** | Late May–June | Lush harvest green, garlands | Bikkurim offering |
| **סוּכּוֹת Sukkot** | Oct (Tishrei 15) | Autumn harvest, Sukkah appears | Build the Sukkah; harvest-all event |
| **פֶּסַח Pesach** | March–April | Spring clearing, unleavened theme | Clear leavened crops; who to invite dilemma |
| **רֹאשׁ הַשָּׁנָה Rosh Hashanah** | Sept–Oct | New year motifs, apples and honey | Reflection event; meters shown in full |
| **חֲנוּכָּה Hanukkah** | Nov–Dec | Oil lamps, winter light ambiance | Olive oil dilemma; Menorah lighting choice |
| **פּוּרִים Purim** | Feb–March | Festive, colorful, communal | Mishloach manot — sending portions to neighbors |

Each holiday window lasts 48–72 hours in real time. The visual transformation is the primary player-facing signal that a seasonal event is active. The dilemma or event is the mechanical payoff.

This system is Eve's equivalent of the Christmas/Halloween/Easter seasonal events in games like Township, Hay Day, or Stardew Valley — but grounded entirely in the Jewish agricultural and spiritual calendar, making it culturally authentic rather than cosmetically borrowed.

---

## Design Principles for Seasonal Events

- **Real calendar, not in-game calendar** — seasonal events fire based on the real-world Jewish holiday date, not the in-game day cycle. This creates a genuine connection between the game and the player's actual life and year.
- **No FOMO pressure** — events are celebratory, not anxiety-inducing. Missing Shavuot this year is fine; it returns next year. No exclusive permanent rewards locked behind seasonal events.
- **Cosmetic richness, dilemma depth** — the visual transformation is generous and immersive; the dilemma at the center is substantive, not trivial
- **Culturally grounded** — the seasonal events teach through experience, not explanation. A player who engages with the Shavuot event for three years will understand Bikkurim without ever reading a wiki article.
- **Non-observant friendly** — the events are framed as harvest/cultural celebrations first; the religious dimension is present but not required for the event to feel meaningful

---

## Connection to Other Features

- **Seasonal events system** — Bikkurim is the pilot; all future seasonal events follow this template
- **The Levite NPC** — most natural in-narrative presence during Bikkurim; his relationship meter reacts to the offering choice
- **Additional crops** — as more crops are added, the Bikkurim offering basket becomes richer and more visually varied; a player with grapes, olives, and barley has a fuller basket to bring
- **Dilemma history log** — Bikkurim appears once per year in the log; across multiple years it tells the story of the household's relationship with gratitude and public commitment
- **Community / co-op (future)** — the Shavuot event is a natural collective celebration; a future version could include a communal harvest goal for the player's village
