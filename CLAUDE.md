# CommuniServe — Instructions for Claude Code

## ⚠️ Database Safety Rule (Supabase MCP)

**When using the Supabase MCP to interact with the database, NEVER delete, drop, or truncate any tables, columns, or rows on your own.** This applies to `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM ...`, and any MCP tool call that has the same destructive effect, on any table — including seed/test data.

You must **ALWAYS ask for explicit permission first**: explain exactly what you want to delete and why, then **wait for the developer to say "Approved"** before executing the action. This applies every time, even if a similar deletion was approved earlier in the same conversation — do not treat a prior approval as blanket consent for a later one.

Non-destructive operations (`SELECT`, `INSERT`, `UPDATE`, `CREATE TABLE`, `ALTER TABLE ADD COLUMN`, adding or updating RLS policies, etc.) do not require this confirmation step, but should still be explained before running when they change the schema.

## Project context

CommuniServe is an LGU workforce-verification web app for Anini-y, Antique (Next.js 14 App Router, JavaScript/JSX, vanilla CSS only — no Tailwind). See `CAPSTONE_DOCS.md` for the full functional spec (modules, business rules, schema).

## Mandatory Verification & Testing Guidelines

These rules are permanent and apply to every session.

### Mobile-First & Phone Viewport Testing (Critical)

- Every feature, bug fix, or UI change affecting the Customer or Service Provider portals **must be tested in mobile viewports** (iPhone/Android widths, e.g. 375px to 412px, via Playwright).
- Never assume a feature works on mobile just because it functions on desktop. Explicitly test phone-specific mechanics: bottom sheets, bottom tab bars, touch taps, overflow behavior, and responsive forms.

### Deep Functional Testing (Beyond Visual Checks)

- Do not rely solely on visual rendering checks or screenshot inspections.
- Perform complete functional test flows: click mobile buttons, fill out forms, open/close sheets, trigger API actions, and verify full state changes end-to-end on mobile.

### Desktop & Mobile Feature Parity

- Ensure all interactive options available on the desktop view are fully functional, accessible, and tap-friendly on phone screens.
- If a feature behaves differently on mobile (e.g. a modal on desktop vs. a bottom sheet on mobile), test both contexts explicitly using Playwright automation.
