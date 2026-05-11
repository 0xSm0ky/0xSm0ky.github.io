# ~/blog

Dark-themed, bilingual (EN + AR) static blog at [0xSm0ky.github.io](https://0xSm0ky.github.io).
Built with [Astro](https://astro.build), written in [Obsidian](https://obsidian.md),
auto-deployed to GitHub Pages on every push to `main`.

## Quickstart

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs dist/
npm run preview   # serve dist/ locally
```

## Writing a post

1. Open `src/content/blog/` as an Obsidian vault.
2. Create a new note with this frontmatter:

   ```yaml
   ---
   title: "Your title"
   description: "Optional one-liner."
   date: 2026-05-11
   tags: [security, notes]
   lang: en        # or 'ar' for Arabic (auto-RTL)
   draft: false    # set true to hide
   ---
   ```

3. Write markdown below. Standard Markdown + fenced code blocks (Shiki, dark theme).
4. `git push origin main` — GitHub Actions builds and publishes to GitHub Pages.

## Deploy target

Configured for **https://0xSm0ky.github.io** (user root repo
`0xSm0ky/0xSm0ky.github.io`). No `base` path is needed.

In the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Project layout

```
src/
├── content/blog/     # ← markdown posts (Obsidian vault)
├── layouts/          # BaseLayout, PostLayout
├── components/       # Header, PostCard, LangFilter, TagBadge
├── pages/            # index, blog/[slug], tags/[tag], about, rss.xml
└── styles/global.css # dark theme + RTL
.github/workflows/deploy.yml   # GitHub Pages deploy
reference/            # untouched reference projects (not deployed)
```

## Theme

Minimal dark — near-black background (`#0b0d10`), soft terminal-green accent
(`#7ee787`), Inter / IBM Plex Sans Arabic / JetBrains Mono. Tweak in
`src/styles/global.css`.

## Languages

`lang: en` or `lang: ar` in each post's frontmatter. Arabic posts auto-render
RTL with IBM Plex Sans Arabic. The index page has an `all / en / ar` filter.

## Obsidian tips

- Open `src/content/blog/` as a vault (`Open folder as vault`).
- Set the attachments folder to `_attachments` to keep images under the same dir.
- The `aliases` frontmatter field is honored by Obsidian for note search.
