---

# Product Requirements Document (PRD): Chavat Chava - MVP

**Project Status:** Draft / MVP Phase  
**Persona:** Senior Product Manager  
**Target Platform:** Mobile (iOS/Android)  
**Language:** Game (Hebrew) / Documentation (English)

---

## 1. Executive Summary
**Chavat Chava** is a "Farm Sim" tycoon game that integrates Jewish-Israeli agricultural laws (Mitzvot) into core gameplay mechanics. The goal is to create a high-quality, engaging experience where "religious"/"culturual" actions provide strategic advantages (*Blessings*) rather than being mere educational content.

## 2. Core Gameplay Loop
1. **Investment:** Player spends *Shekels* to plow and sow fields.
2. **Growth:** Real-time waiting period (seconds/minutes).
3. **Moral Decision:** Player chooses to harvest normally (100% yield) or apply *Pe'ah/Gifts* (90% yield + *Blessing Points*).
4. **Reward:** Collection of crops for sale/processing and accumulation of *Blessing* status.

---

## 3. Key Features (MVP Scope)

### 3.1 The "Blessing" System (Mitzvah Mechanics)
* **Pe'ah (Corner of the Field):** When harvesting, the player has a toggle/button for "Harvest with Pe'ah". 
    * **Effect:** 10% of the crop is visually left in a basket for the "Poor NPC".
    * **Reward:** Adds points to the *Blessing Meter*.
* **Blessing Meter (The Buff):** A UI bar that fills up as the player performs Mitzvot.
    * **Active Effect:** Once full, it triggers a **"Bracha" (Blessing) Mode**.
    * **Outcome:** All subsequent harvests for a limited time yield **1.5x output** (e.g., 10 wheat becomes 15).

### 3.2 The Poor NPC (Social/Atmosphere)
* **Trigger:** Whenever a "Gift basket" (Pe'ah/Leket) is created.
* **Behavior:** A simple NPC enters the screen, walks to the basket, collects it with a "Heart/Blessing" emoji, and exits.
* **Purpose:** Visual feedback for the player's generosity and world-building.

### 3.3 The Shabbat Mechanic (Weekly Strategic Window)
* **The Shabbat State:** A game state triggered by the player (simulating Friday evening).
* **Automation (Shabbat Clock):** Players can purchase "Shabbat Cards" (consumables) using Shekels.
    * **Usage:** Cards are placed in production buildings (e.g., Flour Mill) or irrigation systems.
* **The Lock-out:** Once "Candles are lit" (Start button):
    * Standard manual actions (sowing/harvesting) are disabled.
    * The screen enters a "Shabbat Mood" (warmer colors, calm music).
    * **Automated production continues** for machines with cards.
* **The Reward:** Upon "Havdalah" (End of Shabbat timer), the player receives a "Week of Blessing" bonus (temporary multiplier).

---

## 4. User Journey (Levels 1-3)

| Level | Feature Unlocked | Goal |
| :--- | :--- | :--- |
| **Lvl 1** | Wheat Field, Silo | Learn basic Sow-Wait-Harvest loop. |
| **Lvl 2** | Pe'ah Mechanic, Blessing Meter | Introduce the choice between raw profit and "Blessing". |
| **Lvl 3** | Flour Mill, Shabbat Mechanic | Introduce resource processing and the importance of automation/rest. |

---

## 5. Technical Requirements (MVP)
* **State Machine:** Must handle `Weekday`, `Pre-Shabbat` (Prep), and `Shabbat` (Lock) states.
* **NPC Pathfinding:** Simple point-to-point movement for the Poor NPC.
* **Persistent Timer:** Shabbat timer must run even if the app is closed.
* **Data Structure:** Basic inventory for Shekels, Blessing Points, Crops, and Shabbat Cards.

---

## 6. Success Metrics (KPIs)
1.  **Retention (D1/D7):** Do players return after the first "Shabbat" experience?
2.  **Feature Adoption:** Percentage of players choosing "Pe'ah" vs. "Normal Harvest".
3.  **Economy Balance:** Does the "Blessing" buff compensate enough for the 10% crop loss?

---

