# Sowing

## Overview

Sowing is the moment the player commits to a crop and begins the growth cycle. It should feel tactile, quick, and rewarding for kids and casual players.

## Sub-Features

- Crop selection (paired with sowing)
- Plowing animation
- Sowing animation
- Sowing interaction mechanic
- Feedback (sound, haptics, visual)

## Sub-Feature: Crop Selection (Paired)

### Description & Motivation

Crop choice should happen at the same moment as sowing so the player feels a single, clear action.

### User Workflows

1. Player taps an empty plot.
2. Crop choices appear.
3. Player picks a crop.
4. The sowing interaction begins immediately.

### Diagram / Screenshot

- Optional

### Acceptance Criteria

- Crop selection is required before sowing begins.
- Crop selection and sowing feel like one continuous action.

## Sub-Feature: Plowing Animation

### Description & Motivation

Plowing signals preparation and builds anticipation before seeds are placed.

### User Workflows

1. Player confirms a crop.
2. The plot shows a short plowing animation.

### Diagram / Screenshot

- Optional

### Acceptance Criteria

- Plowing animation is short (1–2 seconds) and skippable by fast players.
- The plot looks visually "prepared" after plowing.

## Sub-Feature: Sowing Animation

### Description & Motivation

Sowing should feel like the player is actively putting seeds in the soil.

### User Workflows

1. After plowing, sowing animation begins.
2. Seeds appear and the plot transitions to a planted state.

### Diagram / Screenshot

- Optional

### Acceptance Criteria

- Sowing animation is visible and ends with a planted state.
- The planted state appears immediately after sowing finishes.

## Sub-Feature: Sowing Interaction Mechanic

### Description & Motivation

The sowing mechanic should be engaging and easy for kids.

### Default Mechanic

- **Hybrid**: drag a seed bag to "paint" the plot; planting completes when coverage is enough.
- **Quick-sow unlock**: after 10 harvests, a one-tap option is unlocked for fast players.

### User Workflows

1. Player selects a crop.
2. The sowing mechanic starts.
3. The plot completes planting and starts growth.

### Diagram / Screenshot

- Optional

### Acceptance Criteria

- The mechanic can be completed quickly and without precision.
- It works with one finger and no precision gestures.
- After 10 harvests, a one-tap quick-sow option becomes available.
- Once unlocked, quick-sow immediately completes sowing.

## Sub-Feature: Feedback (Sound, Haptics, Visual)

### Description & Motivation

Feedback makes the action feel delightful and understandable to kids.

### User Workflows

1. Player sows seeds.
2. Subtle sounds and haptics confirm progress.

### Diagram / Screenshot

- Optional

### Acceptance Criteria

- Sowing and completion each have distinct feedback.
- Feedback can be turned off in settings later (future).

## Additional Fun Aspects (Suggestions)

- Tiny animated critters (birds, insects) react briefly to sowing.
- Sparkle or dust puff effects when seeds land.
- A "growth wink" where the first sprout pops up immediately after sowing.
- A short combo meter for fast, clean sowing (purely cosmetic).

## Notes

- Decide the default sowing mechanic after a quick prototype.
- For now, pair crop selection with sowing to avoid extra menus.
- Accessibility skip is advanced and out of current scope.
