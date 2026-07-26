# Handoff: Issue 003

next session needs to implement playbook edit/delete for owned playbooks, with validation errors visible and delete blocked when the playbook is still referenced.

key decisions were:
- treat Playbooks as real persisted records, not derived UI-only state
- scope all playbook routes by `userId`
- use the same Zod + `issues` error shape as trade routes
- keep playbook performance derived from trades, not stored

done so far:
- read `CONTEXT.md`, the PRD, the figma plan, and the relevant ADRs
- confirmed trade route ownership patterns and the current Playbooks UI placeholder
- confirmed there was no persisted Playbook CRUD in the observed tree
- identified the next implementation likely needs `prisma/schema.prisma`, playbook validation, playbook API routes, `app/page.tsx`, and `app/components/trade-journal.tsx`

suggested skills:
- `mattpocock-skills:implement`
- `mattpocock-skills:tdd`
