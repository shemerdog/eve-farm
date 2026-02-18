# Farm and Crops

## Overview
The farm tile hosts the core crop loop: choose a crop, plant it, wait, and harvest.

## Sub-Features
- Crop selection
- Sowing
- Harvest
- Advanced: fertilize, maintain, deter pests, crop rotation (future)

## Sub-Feature: Crop Selection

### Description & Motivation
Players choose what to plant to set their short-term goals.

### User Workflows
1. Player taps an empty plot.
2. A crop choice view appears.
3. Player selects a crop and confirms.

### Diagram / Screenshot
- Optional

### Acceptance Criteria
1. Crop options are visible before planting.
2. Choosing a crop immediately commits the selection.

## Sub-Feature: Sowing

### Description & Motivation
Sowing starts the growth cycle and gives immediate feedback.

### User Workflows
1. Player selects a crop.
2. The plot changes to a planted state.
3. A growth indicator becomes visible.

### Diagram / Screenshot
- Optional

### Acceptance Criteria
1. A planted plot is visually distinct from an empty plot.
2. The player can plant only if the plot is empty.

## Sub-Feature: Harvest

### Description & Motivation
Harvesting is the reward moment and updates resources.

### User Workflows
1. The crop finishes growing.
2. The plot shows a harvest-ready state.
3. Player taps to harvest and receives resources.

### Diagram / Screenshot
- Optional

### Acceptance Criteria
1. A ready plot is clearly marked as harvestable.
2. Harvesting grants the promised resources.
3. The plot returns to an empty state after harvesting.

## Notes
- Advanced crop mechanics are out of current scope.
