---
name: frontend-verification
description: Verify frontend web app changes through build, runtime, browser, visual, responsive, interaction, accessibility, and asset-rendering checks. Use when the user asks to validate UI changes, inspect a frontend implementation, ensure a web page/app works visually, test responsive layout, check text overflow/overlap, run browser verification, or confirm a frontend feature is production-ready.
---

# Frontend Verification

## Core Rules

- Verify the actual usable interface, not just source code.
- Match the app's existing design system, routing, component conventions, and interaction patterns.
- Run build, lint, typecheck, and tests when the project provides them and risk justifies them.
- Start the dev server when the app needs one; provide the URL when leaving it running.
- Inspect desktop and mobile layouts when visual correctness matters.
- Check that text fits, controls remain stable, assets load, and interactive states work.
- Do not claim visual correctness without a browser, screenshot, or explicit reason verification could not run.

## Verification Workflow

1. Identify the frontend stack and run commands.
   - Inspect package/config files and existing scripts.
   - Prefer project-defined commands over invented commands.

2. Run deterministic checks.
   - Build, lint, typecheck, unit tests, or component tests as available.
   - Fix or report failures with the exact command and error class.

3. Start the app when needed.
   - Use an available port.
   - Keep background server handling explicit.
   - Confirm the route or screen under test loads.

4. Inspect visually.
   - Check at least one desktop and one mobile viewport for layout, clipping, overflow, overlapping text, and broken assets.
   - For canvas, 3D, animation, or media-heavy UI, confirm pixels render and the scene is not blank.

5. Exercise interactions.
   - Click primary controls, forms, menus, tabs, filters, navigation, dialogs, and error states affected by the change.
   - Confirm loading, empty, success, and failure states when relevant.

6. Report outcome.
   - State commands run, viewports checked, issues fixed, issues remaining, and any verification that could not run.

## Acceptance Checks

- Build or equivalent project check passes.
- Target route renders without console-breaking errors.
- Desktop and mobile layouts are coherent.
- Text does not overflow, clip, or cover adjacent content.
- Primary interactions work with visible state changes.
- Images, icons, fonts, media, charts, canvas, or 3D assets render as intended.
- No obvious accessibility regressions in labels, focus, contrast, or keyboard reachability for touched controls.

## Output Contract

```text
Output: a verification report stating what was checked and the pass/fail outcome.
Must include: commands run (build/lint/typecheck/tests), viewports inspected (>=1 desktop, >=1 mobile), issues fixed, issues remaining, and any check that could not run with the reason.
Must preserve: the app's existing design system, routing, and component conventions.
Must verify: target route renders without console-breaking errors; text does not overflow/clip; assets render; primary interactions show visible state changes.
Must not: claim visual correctness without a browser/screenshot or an explicit stated reason it could not run.
```

## References

Read `references/visual-checklist.md` for viewport suggestions, interaction prompts, visual failure classes, and reporting templates.
