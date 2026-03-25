# Anit Rai — Portfolio Site Setup Plan
> Stack: AstroPaper + Vercel | Zero cost | MD-based posts

---

## Step 1 — Fork & Clone (5 min)

1. Go to https://github.com/satnaing/astro-paper
2. Click **Fork** → fork to your GitHub account
3. Clone locally:

```bash
git clone https://github.com/YOUR_USERNAME/astro-paper
cd astro-paper
npm install
npm run dev
# Site live at http://localhost:4321
```

---

## Step 2 — Configure Site Identity (10 min)

Edit `src/config.ts`:

```ts
export const SITE = {
  website: "https://anit.vercel.app/", // update after Vercel deploy
  author: "Anit Rai",
  desc: "Fractional CTO & Infrastructure Architect. I help startups build reliable infra and ship faster.",
  title: "Anit Rai",
  ogImage: "anit-og.png",
  lightAndDarkMode: true,
  postPerPage: 8,
};

export const LOGO_IMAGE = {
  enable: false,
  svg: false,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/anit",
    linkTitle: "Github",
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:anitrai011@gmail.com",
    linkTitle: "Email",
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/in/YOUR_HANDLE", // update this
    linkTitle: "LinkedIn",
    active: true,
  },
];
```

---

## Step 3 — Clean Out Default Content (5 min)

```bash
# Delete all sample posts
rm src/content/blog/*.md

# Delete sample assets you don't need
rm public/assets/dev-portfolio.jpg  # or whatever sample images exist
```

---

## Step 4 — Customize the About Page (15 min)

Edit `src/pages/about.md` (or `about.astro` depending on version).

Replace with your content. Keep it direct and opinionated — no fluff.
See **Appendix A** at the bottom of this file for a draft.

---

## Step 5 — Add the Persona Tag System (20 min)

This gives every post a visible 🏢 CXO or ⚙️ Sauce badge.

### 5a. Update the post frontmatter type

Edit `src/content/config.ts` — find the blog schema and add `persona`:

```ts
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    // ... existing fields ...
    persona: z.enum(["cxo", "sauce"]).optional(),
  }),
});
```

### 5b. Show the badge on post cards

Find the post card component (usually `src/components/Card.tsx` or `PostCard.astro`).

Add this wherever the tags are rendered:

```astro
{persona === "cxo" && (
  <span class="persona-badge cxo">🏢 CXO</span>
)}
{persona === "sauce" && (
  <span class="persona-badge sauce">⚙️ Sauce</span>
)}
```

Add to your global CSS:

```css
.persona-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
  margin-right: 6px;
}
.persona-badge.cxo {
  background: #e8f4f0;
  color: #0a7b6b;
}
.persona-badge.sauce {
  background: #f0f0ff;
  color: #4444aa;
}
```

---

## Step 6 — Add the /demos Page (20 min)

Create `src/pages/demos.astro`:

```astro
---
import Layout from "@layouts/Layout.astro";
---

<Layout title="Live Demos | Anit Rai">
  <main>
    <h1>Live Demos</h1>
    <p class="subtitle">
      Interactive demos of real architectural patterns.
      Each demo is simulated — no live cloud costs incurred.
      Every demo links to the real implementation writeup.
    </p>

    <div class="demos-grid">

      <div class="demo-card">
        <h2>🪪 KYC Face Check</h2>
        <p>Simulate an identity verification flow using AWS Rekognition pattern. Capture photo → analyse → match result.</p>
        <a href="/demos/kyc" class="btn">Try Demo →</a>
        <a href="/blog/kyc-rekognition-sauce" class="link">Read the implementation ↗</a>
      </div>

      <div class="demo-card">
        <h2>💸 AWS Cost Audit</h2>
        <p>Paste a mock AWS bill and get a simulated waste analysis report — the same process I run for clients.</p>
        <a href="/demos/cost-audit" class="btn">Try Demo →</a>
        <a href="/blog/aws-cost-audit-sauce" class="link">Read the implementation ↗</a>
      </div>

      <div class="demo-card">
        <h2>🔍 Smart Search</h2>
        <p>Type a query and see a simulated Elasticsearch response with relevance scores and dynamic filters.</p>
        <a href="/demos/search" class="btn">Try Demo →</a>
        <a href="/blog/elasticsearch-search-sauce" class="link">Read the implementation ↗</a>
      </div>

    </div>
  </main>
</Layout>
```

Add demos to the nav in `src/config.ts`:

```ts
export const MENU_LINKS = [
  { name: "Blog", href: "/blog" },
  { name: "Demos", href: "/demos" },
  { name: "About", href: "/about" },
];
```

---

## Step 7 — Add Demo Pages (placeholders for now)

Create these files as stubs. You'll drop the real demo components in later.

```bash
src/pages/demos/kyc.astro
src/pages/demos/cost-audit.astro
src/pages/demos/search.astro
```

Each stub:

```astro
---
import Layout from "@layouts/Layout.astro";
---
<Layout title="KYC Demo | Anit Rai">
  <main>
    <h1>🪪 KYC Face Check</h1>
    <p>Demo coming soon.</p>
  </main>
</Layout>
```

---

## Step 8 — Write Your First Two Posts (your call on timing)

Create `src/content/blog/aws-cost-audit-cxo.md`:

```markdown
---
title: "Your AWS bill has a $2k leak. Here's what it looks like."
date: 2026-03-24
tags: [aws, cost]
persona: cxo
description: "Most growing startups overpay AWS by 10-15%. Here's the pattern I see every time."
---

Three things I find in almost every $10k+/month AWS bill...
```

Create `src/content/blog/aws-cost-audit-sauce.md`:

```markdown
---
title: "AWS cost audit in 40 min: the exact CLI commands"
date: 2026-03-24
tags: [aws, cost, cli]
persona: sauce
description: "The shell script I use to find waste fast — RDS snapshots, unused EIPs, orphaned volumes."
---

```bash
# Find snapshots older than 90 days
aws ec2 describe-snapshots --owner-ids self \
  --query 'Snapshots[?StartTime<=`2025-12-01`].[SnapshotId,StartTime,VolumeSize]' \
  --output table
```

...
```

---

## Step 9 — Deploy to Vercel (5 min)

1. Push your repo to GitHub
2. Go to https://vercel.com → **Add New Project**
3. Import your `astro-paper` fork
4. Vercel auto-detects Astro — hit **Deploy**
5. You get a free URL: `your-username.vercel.app`
6. Update `website` in `src/config.ts` with your live URL
7. Push again → auto-deploys

**Custom domain later:** Add any domain in Vercel dashboard → point DNS → done.

---

## Publishing Workflow (ongoing)

```bash
# Write a new post
touch src/content/blog/my-new-post.md
# ... write in your editor ...

# Publish
git add .
git commit -m "post: your title here"
git push
# Vercel deploys in ~30 seconds
```

That's it. No CMS, no admin panel, no dependencies.

---

## Demo Components

The three interactive demos (KYC, Cost Audit, Search) are self-contained
React/HTML components. These will be built separately and dropped into:

```
src/pages/demos/kyc.astro         ← KYC face check demo
src/pages/demos/cost-audit.astro  ← AWS cost audit demo
src/pages/demos/search.astro      ← Smart search demo
```

Each demo follows the same pattern:
- User interaction
- Fake 2-3s loader with realistic status messages
- Simulated result output
- Disclaimer: "This is a demo. Not connected to live AWS services."
- Link to the real implementation blog post (Sauce post)

**Next step:** Ask Claude to build each demo component one at a time.
Start with: "Build me the AWS Cost Audit demo component for my Astro site"

---

## Appendix A — About Page Draft

```markdown
# Anit Rai

I'm a software engineer and architect with 10+ years building production systems —
from React frontends to Kubernetes clusters to data compliance pipelines.

I've co-founded a company, led engineering teams, and I still write production code.

### What I actually do

I help startups and growing engineering teams with three things:

**Infrastructure that doesn't bleed money.**
Most teams overpay AWS by 10–20%. I find the waste, fix the architecture, and
make sure it doesn't come back.

**Systems that can scale without a rewrite.**
Microservices, event-driven architecture, Kubernetes — done pragmatically,
not because it's fashionable.

**Technical leadership without the overhead.**
Fractional CTO or Architect-on-call. I make opinionated decisions, document
the tradeoffs, and get out of the way.

### How I think

I'm a generalist who goes deep. I'll never sell you a migration you don't need.
I prefer boring technology that works over clever technology that doesn't.

### Currently available for

- Fractional CTO / Architect engagements
- AWS infrastructure audits (fixed scope, fixed price)
- Kubernetes and microservices architecture reviews

→ anitrai011@gmail.com
```

---

## File Structure After Setup

```
astro-paper/
├── src/
│   ├── config.ts                  ← site identity, nav, socials
│   ├── content/
│   │   └── blog/                  ← YOUR POSTS GO HERE (.md files)
│   ├── pages/
│   │   ├── about.md               ← about page
│   │   ├── demos.astro            ← demos index
│   │   └── demos/
│   │       ├── kyc.astro
│   │       ├── cost-audit.astro
│   │       └── search.astro
│   └── components/
│       └── Card.astro             ← add persona badge here
└── public/
    └── assets/                    ← images, OG image
```
