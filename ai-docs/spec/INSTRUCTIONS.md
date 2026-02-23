# Spec Writing Instructions

## Purpose

The `spec/` folder is the blueprint set for the game. Each spec file should be usable by a code architect agent to plan implementation of that feature.

## Structure

- `spec/existing/` for features that already function in the codebase.
- `spec/future/` for planned features not yet implemented.
- One spec per feature: `feature.spec.md`.
- If a feature has advanced versions that are not near-term, list them in the overview spec. When promoted, place the spec in `spec/future/advanced/`.

## Style

- Be sharp and concise. Avoid pompous or bloated writing.
- Use short, accurate demands. Prefer bullet points.
- Include only what is needed to implement or validate the feature.

## Required Sections (adapt as needed)

- **Overview**: one-paragraph summary of the feature goal.
- **Scope**: what is included and explicitly excluded (optional if the feature is simple).
- **Requirements**: testable, numbered requirements.
- **Workflow**: key user flows, step-by-step.
- **Data & State**: key data structures and state transitions.
- **UI**: layout notes, components, and interactions.
- **Diagrams**: ASCII diagrams or links to images.
- **Assets**: image links or placeholders if needed.
- **Open Questions**: only if something is unresolved.

## Diagrams & Images

- Prefer simple ASCII diagrams inside the spec.
- If images are needed, include URLs and brief captions.

## Naming

- Use lowercase feature names with hyphens, e.g., `main-map.spec.md`.
