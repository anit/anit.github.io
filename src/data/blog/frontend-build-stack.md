---
title: "Vite → rsbuild, TS → TS7 native, ESLint → Biome: 5x faster builds, measured"
pubDatetime: 2026-07-06T00:00:00Z
tags: [frontend, rsbuild, typescript, biome, benchmarks, tooling]
description: "Same code, same output, modern toolchain: 5x faster builds, 2.4x less memory, and a type-checker that actually runs. Exact configs, the test setup, and every gotcha, reproduced on two machines."
---

I took an enterprise React monorepo (15 pnpm workspace packages, 10 Vite-built SPAs, React 19, styled-components plus Tailwind v4, GraphQL codegen) and swapped three tools. No product code was rewritten. The shipped bundles are the same size, chunk for chunk.

One app alone is around 2,300 modules and ships 19 MB of minified JS. Legacy debt included TSLint leftovers and TypeScript versions ranging from 4.0.2 to 5.8.3 in the same repo.

Measured results on two machines: an M4 Mac, and a 2019-era i7 ultrabook that's close to what most CI runners look like.

| Metric | Before | After |
|---|---|---|
| Production build (CI-class hardware) | 63 s | **8 s** |
| Build memory | 3.5 GB | **1.4 GB** |
| Dev server: start to usable app | 39 s | **4 s** |
| Full lint pass | 34 s | **2 s** |
| Type-checking | **silently broken** | works, 4 to 13 s |

## Where the money is

**1. CI compute.** Builds finish 5x faster and use 2.4x less memory. Put those together and you can run builds on smaller machines, or fit more builds on the same runner. For a team merging 30 times a day across 10 apps, that's roughly 85% less frontend CI spend. On managed runners that's real money but not huge. On self-hosted infra, it means you can drop down an instance tier.

**2. Engineer wait time.** Harder to put a number on, but it's the bigger cost. The dev server going from 39 s to 4 s, and CI feedback from 10 minutes to 2, isn't really about the seconds. Any wait longer than about 10 seconds breaks your focus, and getting back into what you were doing costs more than the wait itself. Rough math: 20 engineers, 20 waits a day, 30 seconds saved per wait. That's over 3 hours of engineering time back every day, before you even count the time saved from staying in flow, which is harder to measure.

**3. Hardware.** Those after-numbers are from a 7-year-old laptop. If your tooling makes old machines feel fast again, you put off buying new laptops and asking for bigger CI runners.

## What we didn't expect to find

The type-checker in this codebase had been silently broken. A config error made `tsc` exit before it checked a single file, and about 3,500 type errors had piled up without anyone noticing. A check that fails instantly and quietly doesn't look broken, it just looks fast.

If your frontend is more than 3 years old, assume the same thing is happening until you check. Run `tsc --noEmit` and read the first line of output, not the last.

## The migration, in dependency order

### 1. TypeScript 7 RC (native compiler)

TS7 is the Go rewrite. `pnpm add -D -w typescript@rc`, then:

- `downlevelIteration` is deleted in TS6/7. Remove it.
- `module: commonjs` with `moduleResolution: bundler` was always invalid. TS7 forced us to fix it (`module: preserve`).
- Removed every per-package `typescript` pin so the monorepo resolves one root version. Two packages hid pins in `dependencies` instead of `devDependencies`, so grep both.

Result: full type-check of the biggest package graph in 4.4 s, versus 26 s on TS 5.8 with the same code and config. About 6x.

### 2. Biome

`typescript-eslint` loads TypeScript's JS API. The TS7 native package doesn't ship one, so ESLint hard-crashes with `ERR_PACKAGE_PATH_NOT_EXPORTED`. With TS7, ESLint doesn't just get slower, it stops working entirely.

Biome does not touch the TS compiler. One `biome.json` replaced ESLint, Prettier, and two config files. lint-staged went from two commands to one `biome check --write`.

Repo-wide lint, about 3,200 files: ESLint 33.7 s, Biome 2.2 s, on CI-class hardware. (6.7 s vs 0.29 s on an M4.)

### 3. rsbuild

Ported one app first. Config mapping from `vite.config.mjs`:

| Vite | rsbuild |
|---|---|
| `@vitejs/plugin-react` | `@rsbuild/plugin-react` |
| `vite-plugin-svgr` (`?react`) | `@rsbuild/plugin-svgr` with `mixedImport: true` |
| `@tailwindcss/vite` | `@tailwindcss/postcss` plus postcss.config |
| `vite-plugin-environment` | `source.define` with a filtered `process.env` object |
| `index.html` with module script | `html.template`. Delete the entry `<script>`, rsbuild injects its own |
| `--base=$PATH` | `output.assetPrefix` |

A gotcha that will bite you in a pnpm monorepo: rspack resolves from the importing file. A sibling package that uses React without declaring it (ours had SVG components doing exactly that) builds fine under Vite, whose optimizer papers over it, and fails under rsbuild with `Can't resolve 'react'`. Fix: `resolve.alias` for `react` and `react-dom`, or fix the missing deps properly.

Two of the Vite plugins (`babel-macros`, `tsconfig-paths`) weren't actually being used anymore, so I deleted them instead of porting them. A migration is a good time to find dead config too.

## Results (medians of 3, two machines)

| Metric | Vite 5 | rsbuild 2 | ratio |
|---|---|---|---|
| Prod build, M4 | 12.8 s | 2.5 s | 5.2x |
| Prod build, i7-8565U | 41.1 s | 8.0 s | **5.2x** |
| Peak RSS | 3.2 to 3.5 GB | 1.3 to 1.4 GB | 2.4x |
| Dev: start to usable app, M4 | ~7.9 s | ~1.3 s | ~6x |
| Dev: start to usable app, i7 | ~25 s | ~3.9 s | 6.3x |
| Output size | 18.9 MB / 33 chunks | 18.8 MB / 32 chunks | parity |

The ratios are close on both machines, and the output size matches too. That matters, because a faster build that ships a different bundle doesn't prove anything.

Two caveats:

- HMR isn't really comparable across tools. Vite's ~2 ms is just the WebSocket push (the browser re-transforms on demand). rsbuild's ~195 ms includes the full incremental rebuild. Both feel instant in practice.
- Vite's "ready in 254 ms" message is misleading. The server is up, but it transforms modules on first request, so the first page load actually took 7 to 37 seconds depending on the machine. Measure time to a usable app, not time to the server starting.

## How I measured this

I used two small Node scripts, no dependencies:

- Cold start: spawn the dev server, poll until HTTP responds.
- First load: crawl the served module graph the way a browser would. Fetch `/`, regex-extract imports, fetch recursively. This is what exposes Vite's lazy-transform cost.
- HMR: connect to the HMR WebSocket (the `vite-hmr` subprotocol, or rsbuild's token-authed `/rsbuild-hmr`, with the token extracted from the injected client chunk), append a comment to a source file, time until the update frame arrives.
- Prod: three runs under `/usr/bin/time -l` (`-v` on Linux) for wall time and peak RSS, then diff output size and chunk count.
- Medians of 3, results written to `bench/<machine-slug>/<tool>.json` so machines are comparable in git.

One thing I can't fully explain: on the i7, the pre-migration branch built about 50% slower than the exact same version of Vite on the migrated branch (63 s vs 41 s, and it held up across runs). My best guess is that removing the ESLint and Prettier trees, plus 14 duplicate TypeScript installs, made `node_modules` small enough that file resolution got faster on the slower disk. I haven't confirmed that.

## What this means for you

If you're starting fresh: just pick the modern stack from day one. It costs nothing extra, and the numbers above are what current tooling does by default.

If you already have a codebase: this took a few days, no product code changed, and I did it one app at a time: migrate one app, measure it, then roll the rest out. Before you start: run `tsc --noEmit` and see if it's actually running, grep for imports that use React without declaring it as a dependency, and check how you're using the `?react` import, macros, and path plugins before you port the config.

---

I run this as a fixed-scope engagement: benchmark your repo, migrate one app, hand you the before/after numbers and a rollout plan. If your engineers complain about build times, they are right, and fixing it is cheaper than ignoring it.

→ [anitrai011@gmail.com](mailto:anitrai011@gmail.com)
