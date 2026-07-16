---
title: "Arguing a 'Not Applicable' Verdict: A Laravel Debug Page That Leaked a Private Repo"
description: "A staging environment left Laravel debug mode on, leaking full stack traces, file paths, and a link to a private GitHub repository. The program marked it Not Applicable anyway, here's the finding, the back-and-forth, and why debug mode in production (or staging) is never really 'no impact.'"
date: 2026-07-16
lang: en
draft: false
tags: ["bug-bounty", "information-disclosure"]
---

Not every report closes the way the technical severity suggests it should. This is a writeup of a Laravel debug page finding that got marked **Not Applicable**, despite leaking a link to a private source repository.

## The finding

A staging environment's `/livewire/update` endpoint returned a full Laravel debug/error page instead of a generic error response:

```
https://<REDACTED_STAGING_HOST>/livewire/update
```

Debug mode being on in a non-production environment still matters, because the page didn't just show a stack trace. It exposed:

- Full file paths, line numbers, and variable values from the application internals.
- The specific PHP and Laravel versions in use.
- A "publish" button on the same page that could make the error page publicly shareable with one click.
- A direct link to the project's **private** GitHub repository, and a link to a specific commit in that repository.

Laravel is open-source, so an attacker doesn't need the repo link to understand the framework's internals, they need it to see *this specific project's* application code, business logic, and commit history.

## Proof of concept

Visiting the endpoint directly, no authentication, no special headers, was enough:

```
https://<REDACTED_STAGING_HOST>/livewire/update
```

A companion `/check` route on the same host confirmed the root cause directly: debug mode was enabled.

## Impact

- **Targeted exploitation**, outdated PHP/Laravel version strings let an attacker check for known CVEs against the exact versions running, instead of guessing.
- **Code-level exploitation**, function names, variable values, and line numbers from the trace make it far easier to reverse-engineer application logic and spot logic flaws.
- **File inclusion attacks**, exposed paths are a head start for Local/Remote File Inclusion attempts against files like `config.php` or `.env`.
- **Directory traversal**, knowing the real file structure removes a lot of the guesswork attackers normally have to do first.
- **Source and history exposure**, the private repository link and commit reference meant the underlying (supposedly private) codebase and its change history were reachable from an unauthenticated error page.

## Remediation

Suppress debug mode outside local development, and implement custom error handlers that log internally instead of rendering stack traces to the client. In Laravel terms, that's `APP_DEBUG=false` in any environment reachable outside the dev team, with errors routed to application logs rather than the response body.

## The triage timeline

The report didn't go straight to a verdict. It moved through a few states:

1. **New**, initial submission.
2. **Needs More Info**, the triager asked for clarification.
3. **New**, reopened after I responded.
4. **Not Applicable**, final verdict, about a month after submission.

At the "Needs More Info" stage, I wasn't sure what additional detail was being asked for, since the PoC was a single unauthenticated GET request:

> "I was trying to send an HTTP request, and I think the error page is the reason for it. Can I know what more information is required?"

The report was reopened to **New** after that, then closed as **Not Applicable** roughly a month later, with no further detail on which part of the impact reasoning didn't hold up.

## Why this matters more broadly

A visible debug page is easy to wave off as "just an error message," but the actual question is the same one that applies to any information disclosure report: **what does the leaked information let an attacker do that they couldn't do before?** Here, that list wasn't hypothetical:

- The exact framework and language version, which narrows a CVE search to a specific target instead of a guess.
- Real file paths and internal logic, which shortcuts the reconnaissance phase of an actual attack.
- A link into a private source repository, which is a confidentiality breach on its own, independent of anything else on the page.

Debug pages get dismissed a lot because most of them really are noise, a stack trace with nothing sensitive in it. The distinguishing factor is whether the page leaks something that was supposed to be private, a version string is trivia, but a link to a private repo and commit history is a different category entirely.

## Takeaway

A "Not Applicable" verdict on a debug page isn't always about whether debug mode is a real misconfiguration, it usually comes down to whether the specific leaked content clears the bar for impact. Here, the case was that it did: a private repository link is not something a generic 500 page should ever expose, regardless of environment.
