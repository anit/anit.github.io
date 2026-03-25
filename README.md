# Anit Rai — Personal Portfolio

Personal portfolio and blog of Anit Rai — Fractional CTO & Infrastructure Architect.

Built with [Astro](https://astro.build/), [TailwindCSS](https://tailwindcss.com/), and deployed to [GitHub Pages](https://pages.github.com/).

## Tech Stack

- **Framework** — [Astro](https://astro.build/)
- **Styling** — [TailwindCSS](https://tailwindcss.com/)
- **Type Checking** — [TypeScript](https://www.typescriptlang.org/)
- **Search** — [Pagefind](https://pagefind.app/)
- **Icons** — [Tabler Icons](https://tabler-icons.io/)
- **Deployment** — [GitHub Pages](https://pages.github.com/)

## Running Locally

```bash
pnpm install
pnpm run dev
```

The dev server starts at `http://localhost:4321`.

## Commands

| Command               | Action                                        |
| :-------------------- | :-------------------------------------------- |
| `pnpm install`        | Install dependencies                          |
| `pnpm run dev`        | Start local dev server at `localhost:4321`    |
| `pnpm run build`      | Build production site to `./dist/`            |
| `pnpm run preview`    | Preview the production build locally          |
| `pnpm run lint`       | Lint with ESLint                              |
| `pnpm run format`     | Format code with Prettier                     |
| `pnpm run format:check` | Check formatting without writing changes    |

## Project Structure

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   ├── data/
│   │   └── blog/
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   ├── utils/
│   ├── config.ts
│   └── constants.ts
└── astro.config.ts
```

Blog posts live in `src/data/blog/` as Markdown files.

## Credits

Built on top of [AstroPaper](https://github.com/satnaing/astro-paper) by [Sat Naing](https://satnaing.dev).
