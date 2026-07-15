---
ignore: true
---

# Vault notes

This folder is the Obsidian vault **and** the Astro content collection. Open this folder (`src/content/blog/`) as a vault in Obsidian.

Anything starting with `_` is ignored by Astro and will not become a page:
- `_templates/` — post templates (Templates plugin points here)
- `_attachments/` — images for posts
- `_drafts/` — optional scratch folder

## Creating a post

1. `Cmd/Ctrl+N` — new note in the vault root.
2. `Cmd/Ctrl+Shift+T` — insert template (choose `post-en` or `post-ar`).
3. Fill in `title`, `description`, set `draft: false` when ready.
4. The **filename** becomes the URL slug: `my-post.md` → `/blog/my-post/`.
   - Keep filenames lowercase, hyphen-separated, ASCII for clean URLs.
   - For Arabic posts, still use ASCII filenames; the `title` is what readers see.
5. `git push` — GitHub Actions builds and deploys.

## Frontmatter reference

| Field | Required | Notes |
|-------|----------|-------|
| `title` | yes | Post title (any language). |
| `description` | no | One-line summary; used for SEO and RSS. |
| `date` | yes | `YYYY-MM-DD`. Used for sort + display. |
| `updated` | no | `YYYY-MM-DD`. Shown as "(updated …)". |
| `lang` | yes | `en` or `ar`. Drives RTL + language badge. |
| `draft` | no | `true` hides the post from build. |
| `cover` | no | Path to a cover image. |
| `aliases` | no | Obsidian-only; ignored by the site. |

## Markdown that "just works"

Standard CommonMark + GFM, rendered by Astro:

- **bold**, *italic*, ~~strike~~, `inline code`
- Headings `#`–`######`
- Ordered / unordered lists, task lists `- [ ]`
- Tables
- Blockquotes
- Links and images (relative paths to `_attachments/` work)
- Fenced code blocks with language tag — syntax highlighted by Shiki (dark theme)
- Footnotes `[^1]`
- Horizontal rules `---`

## Obsidian-only syntax (avoid in published posts)

These render in Obsidian but **not** on the site:
- `[[wiki-links]]` — use standard `[text](./other-post)` instead.
- `![[image.png]]` — use `![alt](./_attachments/image.png)`.
- `%%comments%%` — Astro will leave these in the HTML; delete before publishing.
- Callouts `> [!note]` — render as a plain blockquote on the site.

## Images

Drop into `_attachments/`. In a post:

```markdown
![alt text](./_attachments/screenshot.png)
```

Obsidian's attachment folder is already pointed at `_attachments`, so pasting an image into a note saves it there automatically.

## Drafts

Either set `draft: true` in frontmatter, or stash the file in `_drafts/` (Astro ignores the folder entirely).
