# Trigger Evals — tdd

Design/test artifact to validate trigger precision. Not loaded at runtime.

| Prompt | Expected | Why |
| --- | --- | --- |
| "Build this feature with TDD." | Trigger | Test-first request |
| "Let's do red-green-refactor on the cart logic." | Trigger | Names the loop |
| "Write integration tests first, then implement." | Trigger | Test-first ordering |
| "Fix this bug test-first." | Trigger | TDD bugfix |
| "Drive this parser out with tests." | Trigger | Incremental test-driven build |
| "Just add the function, no tests needed." | No trigger | User opted out of TDD |
| "Diagnose this flaky failure." | No trigger | → diagnose |
| "Review my existing test suite." | No trigger | Review, not test-first authoring |
| User wants all tests written up front, then all code. | Failure path | Redirect to vertical slices; refuse horizontal slicing |
| No public interface is defined yet. | Failure path | Confirm the interface with the user before writing tests |
