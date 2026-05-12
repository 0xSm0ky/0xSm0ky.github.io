---
title: "Hello, world — booting the blog"
description: "First post. Notes on what this place is and how it gets built."
date: 2026-05-11
lang: en
---

Welcome. This is a dark, minimal corner of the internet where I'll be dropping notes on programming, cyber-security, reverse engineering, and the occasional side quest.

## How this works

- Posts are plain markdown in `src/content/blog/`.
- I write them in **Obsidian**, opening that folder as a vault.
- A `git push` to `main` kicks off a GitHub Actions build and ships the site to GitHub Pages.

## A small code sample

```bash
# rebuild locally
npm run build
npm run preview
```

```python
def xor(a: bytes, b: bytes) -> bytes:
    return bytes(x ^ y for x, y in zip(a, b))
```

That's the whole thing. More soon.
