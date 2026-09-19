# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Anit Rai's personal portfolio/blog: a fork of the [AstroPaper](https://github.com/satnaing/astro-paper) Astro theme, customized with a "persona" tagging system (posts are tagged `cxo` for executive-audience posts or `sauce` for hands-on technical posts, shown as badges on post cards) and a `/demos` section of interactive demo pages. Deployed to GitHub Pages at `anit.github.io`.

## Commands

Package manager is `pnpm` (see `pnpm-lock.yaml`; `package-lock.json` also exists but is not the source of truth).

```bash
pnpm install        # install dependencies
pnpm run dev         # dev server at localhost:4321
pnpm run build       # astro check + astro build + pagefind indexing -> dist/
pnpm run preview     # preview the production build locally
pnpm run lint        # eslint .
pnpm run format      # prettier --write .
pnpm run format:check
```

There is no test suite/runner configured in this repo.

## Deployment

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds with `pnpm run build` and deploys straight to GitHub Pages — **there is no staging step**, so a push to `master` is a production deploy.

## Architecture

- **Content collection**: blog posts are Markdown files under `src/data/blog/` (flat directory, filenames become slugs), loaded via the glob-based collection defined in `src/content.config.ts`. The Zod schema there is the source of truth for frontmatter fields — notably `persona: "cxo" | "sauce"` (optional), `draft`, `pubDatetime`/`modDatetime`, `tags`, `featured`.
- **Publish gating**: `src/utils/postFilter.ts` hides a post when `draft: true`, or when `pubDatetime` is in the future (with a `SITE.scheduledPostMargin` grace window from `src/config.ts`), except in dev mode where scheduled posts still show. `getSortedPosts.ts` applies this filter and sorts by `modDatetime ?? pubDatetime`.
- **Routing/paths**: `src/utils/getPath.ts` derives a post's URL from its file path relative to `BLOG_PATH` (`src/data/blog`), supporting nested subdirectories (any segment prefixed `_` is excluded from the path, letting you namespace/organize source files without affecting the URL).
- **Persona badges**: rendered in `src/components/Card.astro` based on `data.persona`; styling lives alongside in the component/global CSS. This is the one piece of custom theme logic layered on top of stock AstroPaper — when touching post cards or the content schema, keep the two in sync.
- **Site identity/nav/socials**: centralized in `src/config.ts` (`SITE`) and `src/constants.ts` (`SOCIALS`, `SHARE_LINKS`); `MENU_LINKS`-style nav items live in `src/config.ts`.
- **Demos**: `/demos` (`src/pages/demos.astro`) links out to `src/pages/demos/{kyc,cost-audit,search}.astro`. As of now these are static placeholder stubs ("Demo coming soon"), not implemented interactive components.
- **OG images**: generated dynamically via `src/pages/og.png.ts` and `src/utils/generateOgImages.ts`/`og-templates/` using `satori` + `resvg`, gated by `SITE.dynamicOgImage`.
- **Search**: Pagefind indexes the built site (`pagefind --site dist`, run as part of `pnpm run build`) and output is copied into `public/pagefind` so it ships as a static asset.

## Notes

- `.claude/plan.md` is an early aspirational setup plan for this site (it references Vercel and `src/content/blog/`) and is out of date — the site actually deploys to GitHub Pages and posts live in `src/data/blog/`. Treat the README and this file as authoritative over `plan.md`.
