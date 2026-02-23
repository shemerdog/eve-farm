# Camera

## Overview

The camera lets players comfortably explore the map and always find their farm without friction.

## Sub-Features

- Center on farm
- Pan
- Zoom
- Advanced: rotate and tilt (future)

## Sub-Feature: Center on Farm

### Description & Motivation

On entry, players should immediately see their farm without hunting for it.

### User Workflows

1. Player opens the game.
2. The view lands on the farm tile.
3. If the player returns later, the view still starts on the farm.

### Diagram / Screenshot

```
[ ] [ ] [ ]
[ ] [F] [ ]   F = farm centered in view
[ ] [ ] [ ]
```

### Acceptance Criteria

1. The farm tile is visible on first load.
2. The farm tile starts centered or near-centered in the viewport.

## Sub-Feature: Pan

### Description & Motivation

Players need to drag the map to see nearby tiles and new expansion options.

### User Workflows

1. Player drags on the map.
2. The map moves with the finger or cursor.
3. The motion eases to a stop when the drag ends.

### Diagram / Screenshot

- Optional

### Acceptance Criteria

1. Dragging moves the map in the same direction as the drag.
2. The camera does not jitter or snap unexpectedly.
3. The map cannot be dragged so far that all tiles leave the view.

## Sub-Feature: Zoom

### Description & Motivation

Zoom helps players see the whole area or focus on detail when space grows.

### User Workflows

1. Player uses pinch or scroll to zoom in and out.
2. The map scales smoothly.

### Diagram / Screenshot

- Optional

### Acceptance Criteria

1. Zoom in increases tile size on screen.
2. Zoom out decreases tile size on screen.
3. Zoom stays within a reasonable min and max.

## Notes

- Rotate and tilt are advanced and out of current scope.
