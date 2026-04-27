# Repository Instructions

## Project Memory

- Always read `context.md` before starting implementation work.
- Update `context.md` after meaningful changes to product direction, architecture, implementation status, known bugs, UX feedback, or next steps.
- Before ending any meaningful work session, run `npm run context:update` and manually refine `context.md` if the generated sections miss durable decisions or next steps.
- After major code exchanges, update `context.md` in the same turn so future sessions can recover the current state.
- If no meaningful project state changed, do not update `context.md` just to change the timestamp.
- Keep `context.md` concise, structured, and action-oriented.
- Do not dump raw logs, full diffs, terminal output, or commit-by-commit changelogs into `context.md`.
- Prefer summaries of durable decisions, unresolved bugs, user feedback, implementation status, and concrete next steps.
- If `context.md` conflicts with the actual code, trust the code and update `context.md`.
- Keep durable engineering instructions in `AGENTS.md`, not in `context.md`.
- Never commit local secret files. `.env*`, `.vercel`, and `env.txt` must remain ignored; if a new credential scratch file appears, add it to `.gitignore` instead of quoting its contents.
