# ADR-0001: Frontend dependency architecture

- Status: accepted
- Date: 2026-08-24

## Context

The React application grew around technical folders. Pages currently own data
access, business state and rendering, while legacy and current API models coexist.
A big-bang move would make ongoing delivery unsafe.

## Decision

New and migrated code follows this dependency direction:

`app/routes -> widgets -> features -> entities -> shared`

Higher layers may skip layers when appropriate. A lower layer must never import a
higher layer. Routes also cannot import the `app` composition root. `shared`
contains infrastructure and domain-agnostic UI only.
`entities` owns canonical models and runtime response schemas. `features` owns user
actions and their queries or mutations. Routes remain thin compositions.

Path aliases make ownership visible. ESLint enforces aliases and relative imports
at any nesting depth in every target layer. Architecture-policy tests exercise
both forbidden and allowed directions. Legacy folders remain operational until
each vertical slice replaces and deletes its corresponding code.

API responses must be generated from the backend contract or validated at runtime.
HTTP failures cross the transport boundary as `ApiError`. Public environment
variables are validated before application startup; an empty API URL deliberately
selects Vite's same-origin proxy in development.

## Migration rule

Each pull request migrates one vertical slice, adds its tests, and removes only the
legacy code made unreachable by that slice. No compatibility barrel may be added.

## Consequences

The repository temporarily contains both legacy and target structures. This is an
explicit migration state, not permission to create new code in the legacy design.
