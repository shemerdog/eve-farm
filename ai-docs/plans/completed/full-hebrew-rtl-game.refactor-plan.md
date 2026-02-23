# תוכנית מעבר מלא לעברית + RTL

**Plan:** Convert Eve from English/LTR to native Hebrew/RTL throughout the entire codebase.

---

## Scope

All user-facing text moves to Hebrew. The document direction becomes RTL at the HTML root. No i18n framework is introduced — this is a single-language game, so a single Hebrew strings constants file suffices. CSS logical properties or explicit RTL overrides handle layout mirroring.

---

## Phase 1 — Document Foundation

### `index.html`

| What                  | Current               | Target                |
| --------------------- | --------------------- | --------------------- |
| `<html lang>`         | `lang="en"`           | `lang="he"`           |
| `<html dir>`          | _(missing)_           | `dir="rtl"`           |
| `<title>`             | `Eve — Heritage Farm` | `חוה — חוות המורשת`   |
| Google Fonts `<link>` | _(missing)_           | Add Heebo (see below) |

Add inside `<head>` before the Vite entry script:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
    href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&display=swap"
    rel="stylesheet"
/>
```

**Why Heebo:** Designed for Hebrew; clean, modern, covers all Unicode Hebrew block. Weights 400/500/700 match the existing usage of system fonts at normal/bold.

---

## Phase 2 — Global CSS (`src/index.css`)

### Font stack

```css
/* Replace current font-family declaration */
font-family:
    'Heebo',
    -apple-system,
    BlinkMacSystemFont,
    Arial,
    sans-serif;
```

### Direction

Add to the `*` or `body` block:

```css
body {
    direction: rtl;
    unicode-bidi: embed;
}
```

Setting `dir="rtl"` on `<html>` is the authoritative source; the CSS `direction: rtl` on `body` reinforces it for any component that resets direction.

### Meter bar fill direction

The fill bar is a `div` whose `width` is driven by a CSS custom property (`--value`). Under RTL the container's text direction is reversed, so `justify-content: flex-start` will anchor content to the **right**. The fill div's width still grows from the anchor edge — which is now the **right**, matching Hebrew visual expectation (bar depletes to the left). No CSS change is needed for the fill logic; the layout flip is automatic once `direction: rtl` is set on the container.

---

## Phase 3 — Hebrew Strings File

Create **`src/game/strings.he.ts`** — the single source of truth for all UI copy.

```ts
export const HE = {
    // ── App / document ─────────────────────────────────────────
    appTitle: 'חוה',

    // ── Meters bar ─────────────────────────────────────────────
    meters: {
        devotion: 'דְּבֵקוּת', // devekut
        morality: 'מוּסָרִיּוּת', // musariyut
        faithfulness: 'נֶאֱמָנוּת', // ne'emanut
    },

    // ── Plot tile ───────────────────────────────────────────────
    plot: {
        plant: 'זְרַע', // zra (imperative: sow)
        harvest: 'קְצֹר', // ktsor (imperative: harvest/reap)
        floatLabel: '+10 🌾',
    },

    // ── Wheat counter ───────────────────────────────────────────
    wheat: {
        unit: 'חיטה', // khita (wheat)
    },

    // ── Dilemma modal ───────────────────────────────────────────
    dilemma: {
        keepAll: 'שְׁמֹר הַכֹּל', // shmor hakol (keep everything)
        costUnit: '🌾',
        // Meter abbreviations shown on choice buttons
        meterAbbrev: {
            devotion: 'ד', // dalet
            morality: 'מ', // mem
            faithfulness: 'נ', // nun
        },
    },
} as const
```

**Translation rationale:**

| English              | Hebrew        | Transliteration | Note                                                     |
| -------------------- | ------------- | --------------- | -------------------------------------------------------- |
| Devotion             | דְּבֵקוּת     | Devekut         | Core kabbalistic/Hasidic concept; strongest cultural fit |
| Morality             | מוּסָרִיּוּת  | Musariyut       | From מוּסָר (musar), the Jewish ethical tradition        |
| Faithfulness         | נֶאֱמָנוּת    | Ne'emanut       | Standard biblical/modern Hebrew for loyalty/faithfulness |
| Plant (imperative)   | זְרַע         | Zra             | Biblical agricultural verb (Genesis, Ruth)               |
| Harvest (imperative) | קְצֹר         | Ktsor           | Biblical harvest verb (Ruth, Leviticus)                  |
| Keep all             | שְׁמֹר הַכֹּל | Shmor Hakol     | Natural imperative form                                  |

---

## Phase 4 — Dilemmas in Hebrew (`src/game/dilemmas.ts`)

Replace all English copy inside the `DILEMMAS` array with Hebrew. Titles stay Hebrew (they already are). Narratives and choice labels fully translated.

### Dilemma 1 — פֵּאָה (Corner of the Field)

```
title: 'פֵּאָה — פִּנַּת הַשָּׂדֶה'

narrative:
  'הַקָּצִיר הֵסְתַּיֵּם. הַמָּסֹרֶת מְצַוָּה לְהַשְׁאִיר אֶת פִּנּוֹת הַשָּׂדֶה
   בִּלְתִּי קְצוּרוֹת, כְּדֵי שֶׁהָעֲנִיִּים יוּכְלוּ לְלַקֵּט.
   עַד כַּמָּה תִּהְיֶה נָדִיב?'

choices:
  1. label: 'הַשְׁאֵר פִּנּוֹת נְדִיבוֹת'
     description: 'אַתָּה מַשְׁאִיר שְׁלֹשָׁה אֲחוּזִים מִן הַיְּבוּל לָעֲנִיִּים'
     (−3 wheat, +10 morality, +5 devotion)

  2. label: 'הַשְׁאֵר פִּנּוֹת מִינִימָלִיּוֹת'
     description: 'אַתָּה מַשְׁאִיר אֶחָד אֶחוּזִים בִּלְבַד'
     (−1 wheat, +3 morality, +1 devotion)

  3. label: 'שְׁמֹר הַכֹּל'
     description: 'אַתָּה לוֹקֵחַ אֶת כָּל הַקָּצִיר לְעַצְמְךָ'
     (0 wheat, −5 morality, −3 devotion)
```

### Dilemma 2 — מַעֲשֵׂר (Tithe)

```
title: 'מַעֲשֵׂר'

narrative:
  'הַקָּצִיר נֶאֱסַף. אַתָּה שׁוֹקֵל כֵּיצַד לְחַלֵּק אוֹתוֹ עִם הַקְּהִלָּה.
   כֵּיצַד תַּקְצֶה אֶת הַמַּעַשְׂרוֹת?'

choices:
  1. label: 'מַעֲשֵׂר שָׁלֵם'
     description: 'אַתָּה נוֹתֵן אֶת הַחֵלֶק הַמָּלֵא לַקְּהִלָּה'
     (−1.4 wheat → floors to 1, +8 faithfulness, +5 devotion, +5 morality)

  2. label: 'מַעֲשֵׂר חָלְקִי'
     description: 'אַתָּה נוֹתֵן מַחֲצִית מִן הַמַּעֲשֵׂר'
     (−1 wheat, +4 faithfulness, +2 devotion)

  3. label: 'וַיַּעֲבֹר אֶל דַּרְכּוֹ'
     description: 'אַתָּה מַשְׁאִיר אֶת הַכֹּל לְעַצְמְךָ הַפַּעַם'
     (0 wheat, −5 faithfulness, −3 devotion)
```

---

## Phase 5 — Component Updates

### `MetersBar.tsx`

Replace English string literals with `HE.meters.*`:

```tsx
// before
<span className={styles.label}>Devotion</span>
// after
<span className={styles.label}>{HE.meters.devotion}</span>
```

Same for Morality → `HE.meters.morality` and Faithfulness → `HE.meters.faithfulness`.

**CSS (`MetersBar.module.css`):** Meter bars stack vertically; no horizontal flow change needed. Labels are to the right of the bar fill in RTL — confirm visually this reads naturally (label on right, fill extending leftward). If the label is currently positioned with `text-align: left`, change to `text-align: right` or remove the explicit alignment and let RTL inheritance handle it.

---

### `PlotTile.tsx`

Replace button labels:

```tsx
// before
<button>{plot.state === 'empty' ? 'Plant' : 'Harvest'}</button>
// after
<button>{plot.state === 'empty' ? HE.plot.plant : HE.plot.harvest}</button>
```

**Float label:** The `+10 🌾` float animation is purely visual; numbers render LTR inside RTL text naturally via Unicode bidirectional algorithm. No change needed in the string itself. If the float div is positioned with `right: 12px`, in RTL layout this positions it to the left of the tile — verify visually and adjust if needed (may want `inset-inline-end: 12px` instead of `right`).

**CSS:** Replace any `left`/`right` positional properties with logical equivalents:

| Replace             | With                       |
| ------------------- | -------------------------- |
| `right: 12px`       | `inset-inline-end: 12px`   |
| `left: 12px`        | `inset-inline-start: 12px` |
| `margin-left: ...`  | `margin-inline-start: ...` |
| `margin-right: ...` | `margin-inline-end: ...`   |

---

### `DilemmaModal.tsx`

1. **Cost badge:** `"Keep all"` → `HE.dilemma.keepAll`
2. **Meter abbreviations:** `'D'` → `HE.dilemma.meterAbbrev.devotion` (`'ד'`), same for M/F
3. **Arrow symbols:** `↑` / `↓` stay — universal directional symbols, language-neutral

In RTL, the arrow symbols for meter effects will appear on the correct side automatically once the container is RTL. Verify that the layout of `"↑ ד  ↓ מ"` reads naturally right-to-left in context.

**CSS (`DilemmaModal.module.css`):** The slide-up animation is vertical — no RTL impact. Backdrop fade is also unaffected. Check any `text-align: left` overrides and remove them.

---

### `WheatCounter.tsx`

No text label is currently shown beyond the emoji and number. If a Hebrew label is desired:

```tsx
<span className={styles.unit}>{HE.wheat.unit}</span> {/* חיטה */}
```

This is optional — the emoji 🌾 is self-explanatory.

---

### `App.tsx`

No user-facing text lives here. No changes needed.

---

## Phase 6 — CSS Logical Properties Audit

Scan all `*.module.css` files and replace physical properties with logical ones so the layout automatically mirrors under RTL:

| Physical (LTR-specific) | Logical (RTL-safe)      |
| ----------------------- | ----------------------- |
| `text-align: left`      | `text-align: start`     |
| `text-align: right`     | `text-align: end`       |
| `padding-left`          | `padding-inline-start`  |
| `padding-right`         | `padding-inline-end`    |
| `margin-left`           | `margin-inline-start`   |
| `margin-right`          | `margin-inline-end`     |
| `left: N`               | `inset-inline-start: N` |
| `right: N`              | `inset-inline-end: N`   |
| `border-left`           | `border-inline-start`   |
| `border-right`          | `border-inline-end`     |

Logical properties are fully supported in all modern mobile browsers (Safari 15+, Chrome 89+, Firefox 66+).

---

## Phase 7 — Progress Ring (SVG)

`PlotTile` renders a circular SVG progress ring. SVG elements are not affected by CSS `direction`; the ring is symmetric so no change is required. The `stroke-dashoffset` animation is radial — RTL has no impact.

---

## Phase 8 — Vowel Marks (Niqqud)

The strings in `strings.he.ts` above include niqqud (vowel points) on key words so the agricultural/religious vocabulary reads clearly to players unfamiliar with those terms. For common everyday words (כל, לך, etc.) niqqud may be omitted where context makes pronunciation obvious. Dilemma narrative prose runs unvocalized — natural for adult readers.

---

## Phase 9 — Testing

After implementing:

1. **Visual audit** — Open on a 375px viewport. Verify:
    - All text renders right-to-left
    - Meter bars fill from right
    - Buttons are readable in Heebo
    - DilemmaModal choices align correctly
    - Progress ring is still centered on tile

2. **Unit tests (`gameTick.test.ts`)** — No string changes in pure game logic; all 11 tests should continue to pass unchanged. Run `npm test` to confirm.

3. **Persistence** — Reload after planting; localStorage key `eve-game-state` stores game state (not UI strings), so no migration needed.

4. **Dilemma cycle** — Harvest 2× to trigger dilemma, verify Hebrew narrative appears, resolve each choice, confirm wheat/meters update correctly.

---

## File Change Summary

| File                                     | Change type                               |
| ---------------------------------------- | ----------------------------------------- |
| `index.html`                             | `lang`, `dir`, `title`, Google Fonts link |
| `src/index.css`                          | font-family, `direction: rtl` on body     |
| `src/game/strings.he.ts`                 | **New file** — all Hebrew UI strings      |
| `src/game/dilemmas.ts`                   | Replace all English copy with Hebrew      |
| `src/components/MetersBar.tsx`           | Use `HE.meters.*`                         |
| `src/components/MetersBar.module.css`    | Remove/flip any LTR `text-align`          |
| `src/components/PlotTile.tsx`            | Use `HE.plot.plant` / `HE.plot.harvest`   |
| `src/components/PlotTile.module.css`     | Physical → logical properties             |
| `src/components/DilemmaModal.tsx`        | `HE.dilemma.keepAll`, meter abbrevs       |
| `src/components/DilemmaModal.module.css` | Physical → logical properties             |
| `src/components/WheatCounter.tsx`        | Optional: add `HE.wheat.unit` label       |

**No changes needed:** `src/types/index.ts`, `src/game/constants.ts`, `src/game/gameTick.ts`, `src/game/gameTick.test.ts`, `src/store/gameStore.ts`, `src/hooks/useGameLoop.ts`, `src/App.tsx`, `src/App.module.css`, `src/components/FarmGrid.tsx`, `src/components/FarmGrid.module.css`

---

## Non-Goals

- No i18n runtime (react-i18next, etc.) — single language, constants file is sufficient
- No English fallback — the game is natively Hebrew; English strings are removed, not kept alongside
- No font subsetting optimization — Heebo via Google Fonts CDN is sufficient for POC
- No RTL-specific icon mirroring — the emojis (🌱 🌾 🪵 ✨) are direction-neutral
