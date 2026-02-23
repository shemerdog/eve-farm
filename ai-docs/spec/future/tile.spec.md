# Tiles

## Overview

Tiles form the map grid and communicate what areas are playable, locked, or purchasable.

## Sub-Features

- Grid and coordinates
- Visual states (default, fog, locked)
- Buying tiles
- Advanced: biome tile types (future)

## Sub-Feature: Grid and Coordinates

### Description & Motivation

Tiles align to a consistent grid so players can reason about space and expansion.

### User Workflows

1. Player pans the map.
2. Tiles align and stay consistent across the view.

### Diagram / Screenshot

```
[T][T][T]
[T][T][T]
[T][T][T]
```

### Acceptance Criteria

1. Tiles align to a uniform grid with no overlaps or gaps.
2. Tiles do not shift position when the camera moves.

## Sub-Feature: Visual States

### Description & Motivation

Players should clearly understand whether a tile is usable, locked, or unknown.

### User Workflows

1. Player sees the farm tile as active.
2. Nearby locked tiles show a fog/locked look.

### Diagram / Screenshot

- Optional

### Acceptance Criteria

1. Unlocked tiles look distinct from locked tiles.
2. Locked tiles show a clear visual lock or fog treatment.

## Sub-Feature: Buying Tiles

### Description & Motivation

Buying tiles is the primary expansion action and should feel clear and rewarding.

### User Workflows

1. Player taps a locked tile next to an unlocked tile.
2. The tile shows a price.
3. If the player can afford it, the tile unlocks.

### Diagram / Screenshot

- Optional

### Acceptance Criteria

1. Only tiles adjacent to an unlocked tile can be purchased.
2. If the player lacks resources, the purchase is blocked and explained.
3. Successful purchase unlocks the tile immediately and reduces resources.

## Notes

- Biome tile types are advanced and out of current scope.
