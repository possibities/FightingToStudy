# Frontend Visual Checklist

## Contents

- Setup checks
- Viewports
- Visual failure classes
- Interaction checks
- Accessibility checks
- Reporting template

## Setup Checks

- Identify the package manager and scripts from project files.
- Use project commands for build, lint, typecheck, unit tests, component tests, and e2e tests.
- Start a dev server only when the app requires one for runtime verification.
- Use the target route, story, or page state that exercises the change.
- Capture screenshots when layout, canvas, media, charts, or animation correctness matters.

## Viewports

Use project standards when available. Otherwise check:

| Class | Example size |
| --- | --- |
| Mobile | 390 x 844 |
| Tablet or narrow desktop | 768 x 1024 |
| Desktop | 1440 x 900 |

For dense dashboards or games, add a smaller height check to catch vertical overflow.

## Visual Failure Classes

Look for:

- Blank screens, blank canvas, broken 3D scenes, or missing primary content.
- Text overflow, clipping, wrapping failures, or labels that resize controls.
- Controls, popovers, modals, toolbars, and cards overlapping incoherently.
- Images, icons, videos, fonts, charts, and backgrounds failing to load.
- Hover, focus, selected, disabled, loading, empty, success, and error states missing or shifting layout.
- Mobile navigation, sticky headers, sidebars, and bottom controls blocking content.
- One-note palettes or visual drift from the existing product style.

## Interaction Checks

Exercise touched flows:

- Navigation and routing.
- Form input, validation, submit, reset, and disabled states.
- Menus, tabs, filters, sort, search, pagination, and dialogs.
- Upload/download, drag/drop, canvas, keyboard shortcuts, and pointer gestures when relevant.
- Network loading and failure states if the feature depends on data.

## Accessibility Checks

Do a lightweight pass:

- Interactive controls have accessible names.
- Focus is visible and follows modal/dialog boundaries.
- Keyboard navigation reaches primary controls.
- Color contrast is not obviously poor.
- Form errors are associated with inputs.
- Motion or animation is not required to understand the UI.

## Reporting Template

```text
Commands run:
- <command>: pass/fail

Runtime:
- URL/route:
- Viewports:

Interactions checked:
- <flow/state>

Issues fixed:
- <file/change>

Remaining risks:
- <what could not be verified and why>
```
