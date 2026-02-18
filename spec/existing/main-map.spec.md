# Main Map Feature Spec

## Overview
The main map is the primary play surface. It shows the farm tile, locked tiles around it, and supports panning. It anchors the core loop UI (meters, farm, wheat, dilemmas).

## Scope
In scope:
- Pannable grid map with one unlocked farm tile and adjacent locked tiles.
- Camera centering on load.
- Buying adjacent tiles with wheat cost.
Out of scope:
- Terrain variety beyond basic tiles.
- Buildings, NPCs, or production chains.
- Monetization or social features.

## Requirements
1. The map renders a grid of tiles with a single unlocked farm tile by default.
2. Locked tiles show a price and can be purchased only if adjacent to an unlocked tile.
3. Camera starts centered on the farm tile and re-centers on reload.
4. Panning works with pointer drag on desktop and touch on mobile.
5. The farm tile hosts the farm grid UI; locked tiles show a fog/locked state.
6. All tile purchase actions update game state and persist across reloads.

## Workflow
1. Player opens the game and sees the farm tile centered.
2. Player pans to view neighboring locked tiles.
3. Player taps a locked tile adjacent to farm.
4. If enough wheat, tile unlocks and price is deducted.
5. The new tile becomes available for future expansion.

## Data & State
- Tile coordinates: integer grid (`x`, `y`).
- `isPurchased(tile)`: true if tile is unlocked.
- `isAdjacentToUnlocked(tile)`: true if any neighbor is unlocked.
- Purchase updates stored world state and persists via store.

## UI
- Map viewport with tiles rendered in a grid.
- Unlocked farm tile renders the farm grid.
- Locked tiles show a price badge and buy button.
- Panning should include momentum and bounds clamping.

## Diagrams
```
      [L][L][L]
      [L][F][L]   F = farm tile (unlocked)
      [L][L][L]   L = locked tile
```

## Assets
- Placeholder tile textures only; no sprite pipeline required.

## Open Questions
- What is the initial grid size (fixed vs. infinite)?
- What is the exact tile price curve?
