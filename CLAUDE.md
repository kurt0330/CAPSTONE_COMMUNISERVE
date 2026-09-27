# CommuniServe — Instructions for Claude Code

## ⚠️ Database Safety Rule (Supabase MCP)

**When using the Supabase MCP to interact with the database, NEVER delete, drop, or truncate any tables, columns, or rows on your own.** This applies to `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM ...`, and any MCP tool call that has the same destructive effect, on any table — including seed/test data.

You must **ALWAYS ask for explicit permission first**: explain exactly what you want to delete and why, then **wait for the developer to say "Approved"** before executing the action. This applies every time, even if a similar deletion was approved earlier in the same conversation — do not treat a prior approval as blanket consent for a later one.

Non-destructive operations (`SELECT`, `INSERT`, `UPDATE`, `CREATE TABLE`, `ALTER TABLE ADD COLUMN`, adding or updating RLS policies, etc.) do not require this confirmation step, but should still be explained before running when they change the schema.

## Project context

CommuniServe is an LGU workforce-verification web app for Anini-y, Antique (Next.js 14 App Router, JavaScript/JSX, vanilla CSS only — no Tailwind). See `CAPSTONE_DOCS.md` for the full functional spec (modules, business rules, schema).
