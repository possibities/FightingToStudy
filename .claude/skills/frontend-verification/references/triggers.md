# Trigger Evals — frontend-verification

Design/test artifact to validate trigger precision. Not loaded at runtime.

| Prompt | Expected | Why |
| --- | --- | --- |
| "Verify this UI change renders correctly." | Trigger | Frontend runtime/visual check |
| "Check responsive layout on mobile and desktop." | Trigger | Viewport verification |
| "Does the text overflow in this card?" | Trigger | Visual failure class |
| "Confirm the canvas/3D scene isn't blank." | Trigger | Pixel-render check |
| "Make sure this feature is production-ready in the browser." | Trigger | End-to-end UI verification |
| "Review this SQL query for injection." | No trigger | Backend → backend-security-review |
| "Write a new React component from scratch." | No trigger | Build task, not verification |
| "Explain CSS flexbox." | No trigger | Concept question |
| Dev server cannot start (missing deps). | Failure path | Run static checks, report what could not run |
| No browser/headless tool available. | Failure path | State visual check could not run; do not claim visual correctness |
