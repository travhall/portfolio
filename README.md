# Travis Hall — Design & Code

Portfolio of Travis Hall — senior UX designer and front-end developer creating thoughtful digital experiences. Built with Next.js.

## Setup

This project uses **pnpm** — see `CLAUDE.md` for why, and for the full
build/verify command reference.

```bash
pnpm install
pnpm run dev
```

Open http://localhost:3000. No environment variables are required.

## Learn more

- `CLAUDE.md` — build/lint/deploy commands, CSS architecture, and the
  `plans/` directory workflow.
- `/kit` (`app/kit/`) — the live design-token and component reference.
- Case-study content lives in `content/case-studies/*.json`, editable via
  a local-only Sveltia CMS at `/admin` (see `public/admin/config.yml`).
