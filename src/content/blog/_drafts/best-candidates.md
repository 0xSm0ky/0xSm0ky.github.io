---
ignore: true
---

# Best candidates — professional/expert-positioning angle

Re-scanned the vault specifically for technical security/pentest content, since the goal is a post that makes hiring managers see expertise (CV already leads with eMAPT, mobile pentesting, and a bug bounty disclosure). Searched `04 رئيسية` for bug bounty / CVE / pentest / Android / reverse-engineering material (~100 matching files). Most of it is scratch recon dumps, raw nmap output, or copy-pasted course/reference notes — not original narrated work. One file stands far above the rest.

## 1. The flagship candidate — jQuery Prototype Pollution + DOM XSS disclosure
- **Vault path:** `Personal/04 رئيسية/Report Critical jQuery 3.2.1 Prototype Pollution (CVE-2019-11358) + DOM XSS Leading to CSRF Token & Cookie Exfiltration.md`
- **What it is:** the actual, submitted IssueHunt bug bounty report — the same one your CV cites ("critical-severity (9.3) prototype-pollution + DOM XSS vulnerability chain"). Full vulnerability chain, working PoC payloads, reproduction steps, screenshots referenced, CVSS context, fix recommendation.
- **Why this is the one:** it's real, disclosed, CVE-backed, and already proven credible (it's on your CV). A blog post walking through *how* you found and chained these two bugs is exactly the kind of post that gets shared in security circles and makes a hiring manager or bug bounty program trust you're not just certified on paper.
- **What it needs before publishing (this is a rewrite, not a copy-paste):**
  - Drop the Japanese-language duplicate section (it was submitted to a JP-based program; the blog post only needs one language).
  - Reframe from "report template" prose into a narrative walkthrough: how you noticed jQuery 3.2.1 was loaded, why that version rang a bell (CVE-2019-11358), how you chained it with the `<option>` DOM XSS quirk, then the exfiltration PoC.
  - Redact/replace the real captured token and cookie values with clearly-fake placeholders (`<REDACTED_CSRF_TOKEN>`) — they're already disclosed to the vendor, but there's no reason to publish real captured session data verbatim.
  - Keep the domain generic or confirm the program is fine with public write-ups (some bounty programs require permission before public disclosure — worth a quick check before this goes live).
  - Add a short intro/outro in your voice: why you went looking at this target, what you'd tell someone trying to find similar bugs.

## Weaker/supporting candidates (not enough on their own)
- **Rekhta Android App Reverse Engineering** (`Personal/04 رئيسية/Rekhta Android App Reverse Engineering.md`) — a real recon pass you did on an Android dictionary app (package `com.rekhta.dict`), following a structured methodology (files, shared prefs, APIs, native libs, crypto). Genuine work, but it's a raw checklist full of `TODO`s, not a finished write-up — would need you to actually finish the analysis and narrate findings before it's postable.
- **"Did you have a mentor when you were learning mobile hacking?"** (`Personal/04 رئيسية/Did you have a mentor when you were learning mobile hacking, Or did you learn everything on your own.md`) — good material but it's a copy-pasted Q&A from a HackerOne blog interview, not your own writing. Could inspire an original "how I got into mobile pentesting" post, but shouldn't be published as-is (not your words).
- **HTB box notes** (`HTB Artificial Box.md`, `EscapeTwo box.md`, `Outbound box.md`) — just raw `nmap` scan dumps, no narrative or methodology explanation. Would essentially need to be written from scratch as full walkthroughs; the notes are barely a skeleton.
- **GreatRef-RECON android hacking template** — this one is explicitly someone else's public KakaoTalk research (copied as a personal reference template), not your work — don't publish it as your own.

## Recommendation
Lead with #1. It's the only piece in the vault that's simultaneously original, technically substantial, already credentialed (matches your CV), and close to complete. Everything else here needs to be built from a checklist/reference into an actual finished piece — the CVE report just needs a rewrite pass, not new research.
