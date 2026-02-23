# Eve — Feature List

Derived from `POC_SCAFFOLD.md`, `poc-actionable-plan.md`, and `research-township.md`.
Grouped by theme. Features already in backlog are noted.

---

## 🌾 Farming & Crops

- **Additional crops** — The Seven Species of the Land: barley, grapes, figs, pomegranates, olives, dates, wheat (wheat is POC). Each with distinct growth timers and yields.
- **Crop seasons** — planting windows tied to in-game calendar (e.g., barley in spring, olives in autumn). Planting out of season fails or yields less.
- **Soil fertility** — plots degrade with overuse; rotate crops or let land rest to restore.
- **Shemitah (שמיטה) — Sabbatical Year** — every 7 in-game years, all land must lie fallow. No planting; existing wild growth is public and free. A recurring major dilemma/event.
- **Irrigation** — build a well or channel to speed growth on adjacent plots; requires resource investment.
- **Harvest all** — one-tap button to harvest all ready plots simultaneously, for quality-of-life.
- **Auto-plant** — toggle to automatically replant an empty plot with its last crop after reset.

---

## 🐑 Animals & Husbandry

- **Sheep and goats** — graze on pasture tiles; produce wool (sheep) and milk (goats) periodically.
- **Cattle** — used as labor (faster plowing unlocks faster planting) or sacrificed for dilemmas (Korban-related dilemmas).
- **Doves / pigeons** — low-cost offering option in religious dilemmas; breeds quickly.
- **Firstborn animal (בְּכוֹר)** — every first offspring of livestock triggers a dilemma: redeem it, dedicate it, or keep it.
- **Flock health** — animals can fall ill if neglected; treat with herbs or call for help from the village.

---

## 🏭 Production Chains

- **Winepress** — grapes → wine; wine used in festivals, trade, and dilemmas.
- **Olive press** — olives → olive oil; oil used for lamp/Menorah dilemmas and trade.
- **Millstone** — wheat → flour; flour → bread (requires oven building).
- **Loom** — sheep wool → cloth; cloth used for trade and character cosmetics.
- **Kiln** — clay → pottery; pottery used for storage upgrades.
- **Storage capacity** — resources spoil or cap without adequate granaries, wine cellars, or jars.

---

## 🏛 Buildings & Settlement

- **Granary** — increases wheat and grain storage cap.
- **Well** — provides water for irrigation; unlocks faster-growing plots nearby.
- **Marketplace** — enables buying and selling between player and NPC traders.
- **Assembly hall / Gate** — communal building; triggers village-wide dilemmas and events.
- **Watchtower** — gives advance warning of random negative events (drought, raiders).
- **Threshing floor** — required for processing harvested grain before storage.
- **Sukkah (סוכה)** — seasonal structure built for the harvest festival; provides temporary bonuses during Sukkot.
- **Altar / High place** — for worship-related dilemmas; choice of where and how to worship affects Devotion meter.

---

## 🗺 World Map & Expansion

*(See backlog/map-feature.plan.md and backlog/buy-tiles.plan.md)*

- **Large pannable world map** — divided into tiles; current 4 plots = one farm tile. *(Planned)*
- **Buy land** — spend wheat to unlock adjacent tiles; price increases per purchase. *(Planned)*
- **Tile types** — farm, pasture, forest, wilderness, village, market, desert, river.
- **Exploration rewards** — discovering new tiles yields resources (found tools, wild herbs, ruins with a lore fragment).
- **Road building** — connect tiles to speed up production chain delivery between buildings.
- **Historical eras** — map starts as open wilderness (nomadic/tribal era) and gradually becomes settled land as buildings are placed.

---

## ⚖️ Dilemmas & Ethics

*(Core unique hook of the game)*

- **More commandment dilemmas:**
  - **לֶקֶט (Leket)** — gleaning: leave fallen stalks for the poor.
  - **שִׁכְחָה (Shikchah)** — forgotten sheaf: if you forget a bundle in the field, it belongs to the poor; do you go back for it?
  - **בִּכּוּרִים (Bikkurim)** — first fruits: bring the first yield of each crop to the communal altar as an offering.
  - **עָרְלָה (Orlah)** — fruit of a tree's first three years is forbidden; do you take it anyway when starving?
  - **כִּלְאַיִם (Kilayim)** — mixed seeds: a neighbor asks to plant in your field; the combination is forbidden.
  - **הַקְהֵל (Hakhel)** — the public assembly: skip a profitable harvest day to attend the communal gathering.
  - **Sabbath (שַׁבָּת)** — a plot ripens on the day of rest; leave it and risk over-ripening or harvest and accept a Devotion penalty.
  - **Tzedakah (צְדָקָה)** — a traveler arrives starving; how much do you give?
- **Standing decisions / Household traditions** — save a recurring choice as a מִנְהָג. *(Planned, backlog/store-decisions.plan.md)*
- **Consequences over time** — meter values accumulate and eventually unlock or block story events (e.g., low morality = village disputes; high faithfulness = a prophet's blessing).
- **Religious vs. national framing toggle** — same dilemma, same choice, two sets of language: one uses Torah/commandment framing, the other uses cultural/national/historical framing. Player picks their preferred lens at setup and can change it any time.
- **Dilemma history log** — a scrollable record of past choices with brief outcomes; players can reflect on their household's pattern.
- **Conflicting dilemmas** — occasionally two commandments pull in opposite directions (e.g., saving a life vs. Sabbath rest); player must prioritize.

---

## 📅 Calendar & Events

- **In-game calendar** — 7-day week, monthly cycle, yearly seasons. Shabbat lands every 7 days.
- **Pilgrimage festivals (שָׁלֹשׁ רְגָלִים):**
  - **פֶּסַח (Pesach)** — clear leavened crops, prepare specific foods; dilemma on who to invite.
  - **שָׁבוּעוֹת (Shavuot)** — harvest festival; Bikkurim offering; bonus yield event.
  - **סוּכּוֹת (Sukkot)** — build the Sukkah; harvest all produce before rain; communal celebration.
- **Rosh Hashanah / Yom Kippur** — a period of reflection; meters shown in full; unresolved standing debts (poor obligations) are audited.
- **Random events** — drought (reduced yields), locusts (plot destroyed), traveling merchant (special trade), prophet passing through (unique dilemma), neighboring dispute (land boundary conflict).
- **Sabbath rest mechanic** — on the 7th day, planting and harvesting are unavailable. Plots already growing continue (time passes). A weekly nudge to pause and observe.

---

## 👥 NPCs & Narrative

- **Recurring village characters:**
  - The gleaner — a poor figure who appears after harvests; reacts visibly to your Peah choices.
  - The Levite — calls for tithes; relationship improves or degrades based on Ma'aser history.
  - The village elder — appears for community dilemmas; represents collective judgment.
  - The traveler — a stranger passing through; random encounters, trades, lore.
  - The prophet — rare, high-stakes visit; offers a major dilemma with lasting consequences.
- **Player avatar** — customizable character with historically grounded clothing options.
- **Relationship meters per NPC** — separate from the global meters; each key character tracks your standing with them.
- **Dialogue system** — short, illustrated dialogue cards for NPC interactions; warm and non-preachy tone.

---

## 📈 Progression & Economy

- **Experience and leveling** — actions (planting, harvesting, resolving dilemmas) earn XP; leveling unlocks new crops, buildings, and map tiles.
- **Shekel currency** — earned by selling at the marketplace; used to buy seeds, animals, and building materials.
- **Trade routes** — once the marketplace is built, unlock trade with other regions (Egypt, Phoenicia, Aram) for rare goods not locally available.
- **Historical era progression:**
  - Era 1: Tent-dwelling nomad (current POC feel)
  - Era 2: Early settler (permanent buildings, fields)
  - Era 3: Village formation (NPCs, communal structures)
  - Era 4: Kingdom era (larger map, political dilemmas)
- **Reputation system** — community standing score visible to the player; high reputation unlocks elder status dilemmas and cosmetics.

---

## 🎨 Customization & Cosmetics

*(Non-pay-to-win; cosmetic-only monetization, per POC_SCAFFOLD)*

- **Farm skins** — different visual styles for soil, fences, and field layouts (Bronze Age, Iron Age, Hellenistic, etc.).
- **Building skins** — alternative architectural styles for each building type.
- **Character outfits** — historically inspired clothing per era (nomadic robes, priestly garments, royal court dress).
- **Crop animations** — seasonal visual variants (lush spring wheat vs. dry autumn barley).
- **Weather and lighting cosmetics** — golden-hour glow, rainy-day ambiance, starry-night harvest.
- **Name your farm** — player names their plot of land; shown in community features.

---

## 🔔 Quality of Life & UX

- **Offline growth** — crops continue growing while the app is closed; player returns to ready plots (casual-friendly).
- **Growth notifications** — optional push notifications when a plot is ready to harvest.
- **Harvest reminder** — if a ready crop sits for too long, it begins to wither (mild penalty, not punishing).
- **Accessibility — terminology mode** — religious vs. national language toggle (POC open question; ship it as a setting).
- **Tutorial / elder's guide** — a gentle onboarding by the village elder character; introduces each mechanic one at a time.
- **Settings panel** — manage traditions (מִנְהָג), terminology mode, notification preferences.
- **Soft reset / new season** — option to start a fresh farm year while retaining level, buildings, and NPCs.

---

## 🤝 Social & Community *(Later)*

- **Village co-op** — join a village with other real players; contribute crops to communal buildings.
- **Communal granary** — shared storage that feeds the whole village; Tzedakah at scale.
- **Seasonal co-op events** — festival events that require collective effort (all players contribute to a shared harvest goal).
- **Trade with friends** — send surplus goods to a friend's farm; receive a different surplus in return.
- **Leaderboard for generosity** — not wealth, but combined tithe/Peah choices; culturally themed, not competitive in tone.

---

## 🎵 Audio

- **Ambient soundscapes** — wind through wheat fields, distant bells, evening crickets.
- **Folkloric musical themes** — light instrumentation: oud, flute, frame drum; non-liturgical but culturally resonant.
- **Action sound effects** — satisfying harvest sound, planting thud, dilemma modal chime.
- **Festival music** — special audio during Sukkot, Shavuot, Pesach calendar events.

---

## 📚 Lore & Education *(Soft layer, never preachy)*

- **Lore fragments** — unlocked by exploring new map tiles or completing dilemmas; short illustrated cards about ancient Israelite farming practices, laws, and daily life.
- **Commandment glossary** — in-game reference for any dilemma concept (Peah, Ma'aser, etc.); plain language, historically grounded.
- **"Did you know" facts** — occasional ambient facts about ancient agriculture surfaced naturally, never as lectures.
- **Seasonal narratives** — short text vignettes that appear during festivals, written in the warm tone of the POC.
