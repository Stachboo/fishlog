# FishLog — Project Instructions

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Language
- UI: French (default) + Arabic (RTL)
- Code: English (variables, functions, comments)
- Communication with user: French informal

## Key Constraints
- No fish capture logging — sessions only (spot, weather, technique, bait)
- No forum, no shareable cards, no photos
- Offline-first: IndexedDB + sync queue, client-wins
- Admin: single email in env var, no RBAC
- Mobile-first: 375px baseline
