# Project Reference

## Project Summary
Eve is a Township-style farming game that reconnects players with ancient Jewish/Israelite heritage through casual farming mechanics and ethical dilemmas. The tone is warm, welcoming, and non-dogmatic, with cultural heritage made approachable without strict religious framing. Mobile-first for the POC, desktop later. The current POC core loop is plant wheat, wait for growth, harvest, face a dilemma, and apply resource plus meter changes. The three always-visible meters are devotion, morality, and faithfulness. The POC excludes selling/money, additional crops/animals/buildings, production chains, social features, and monetization beyond future cosmetics.

## Tech And Structure (High Level)
- Vite + React + TypeScript (strict).
- Zustand for game state, CSS Modules for styling.
- `src/` for app code, `src/game/` for pure logic, `src/store/` for Zustand stores, `src/components/` for UI components, `src/hooks/` for reusable hooks, `src/types/` for shared types.
- Tests: Vitest for unit/component tests in `src/`, Playwright for E2E tests in `e2e/`.

## Spec Folder Purpose
The `spec/` folder is the blueprint set for the game. Each spec is written so a code architect can plan implementation of that feature without extra context.

## Spec Structure
- `spec/existing/` contains specs for features that already function in the codebase.
- `spec/future/` contains specs for planned features not yet implemented.
- One feature per file, named in lowercase with hyphens: `feature.spec.md`.
- Advanced or not-near-term ideas should be listed in an overview spec and later placed in `spec/future/advanced/` when promoted.

## Spec Writing Rules
- Be sharp and concise. Avoid bloated writing.
- Prefer short, testable demands in bullet or numbered lists.
- Include only what is needed to implement or validate the feature.
- Use ASCII diagrams where helpful. If images are needed, include URLs and short captions.

## Required Sections (Adapt As Needed)
- Overview: one-paragraph summary of the feature goal.
- Scope: in-scope and explicitly out-of-scope items.
- Requirements: testable, numbered requirements.
- Workflow: key user flows, step-by-step.
- Data and State: key data structures and state transitions.
- UI: layout notes, components, interactions.
- Diagrams: ASCII diagrams or image links.
- Assets: image links or placeholders.
- Open Questions: only if unresolved.

## Spec Template
Use `spec/future/TEMPLATE.spec.md` as the default structure for new specs. It includes:
- Overview
- Sub-Features (optional)
- Sub-Feature sections with Description, User Workflows, Diagram, and Acceptance Criteria
- Notes

## Current Spec Inventory
- `spec/INSTRUCTIONS.md` is the authoritative guide for spec writing.
- `spec/existing/main-map.spec.md` documents the current main map behavior, including tile grid, panning, camera centering, and tile purchase rules.
- `spec/future/map-overview.spec.md` is the entry point for future map work and links the camera, tiles, and farm feature specs.
- `spec/future/camera.spec.md` defines center, pan, and zoom behaviors, with rotate and tilt as advanced items.
- `spec/future/tile.spec.md` defines grid alignment, tile visual states, and the tile purchase rules.
- `spec/future/farm/crops.spec.md` defines crop selection and harvest, with advanced crop mechanics deferred.
- `spec/future/farm/sowing.spec.md` defines sowing, its animations, interaction mechanics, and feedback.

## Notes For Chat Continuation
- If you continue this work in another chat, this file is a good single-source summary for the project and the spec system.
- The most important documents for scope and direction are `POC_SCAFFOLD.md`, `poc-actionable-plan.md`, and `spec/INSTRUCTIONS.md`.
