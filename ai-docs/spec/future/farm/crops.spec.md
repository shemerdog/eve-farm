# Farm and Crops

## Overview

The farm tile hosts the core crop loop: choose a crop, plant it, wait, and harvest.

## Sub-Features

- Crop selection
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

- Sowing is specified in `spec/future/farm/sowing.spec.md`.
- Advanced crop mechanics are out of current scope.
