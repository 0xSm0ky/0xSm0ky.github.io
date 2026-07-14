---
title: "Arguing a 'Not Applicable' Verdict: Hardcoded Google Maps API Keys Aren't Free"
description: A bug bounty report on a hardcoded, unrestricted Google Maps API key got marked Not Applicable — here's the technical rebuttal, the per-request cost math, and the precedent that makes this class of finding worth taking seriously.
date: 2026-07-14
lang: en
draft: false
---

Not every valid finding survives triage on the first pass. This is a short writeup of a report that got marked **Not Applicable** — and the case I made back, with real precedent, for why it shouldn't have been.

## The finding

While going through an Android app's decompiled resources (`res/values/strings.xml`), I found a hardcoded, unrestricted Google Maps API key:

```xml
<string name="google_api_key">AIzaSy...REDACTED</string>
```

No package/certificate restriction, no API restriction. That means the key works from anywhere, for any Google Maps Platform API it's entitled to — not just from inside the app.

Proof of concept, called directly outside the app:

```
https://maps.googleapis.com/maps/api/geocode/json?latlng=40,30&key=<REDACTED_API_KEY>
```

This returned a valid geocode response using someone else's billing.

## The triage response

The program marked it **Not Applicable**:

> "Thanks for your time and efforts. The reported issue does not show an impact, therefore, it was marked as Not Applicable."

This is a common triage reflex for "just an API key" reports — and it's *often* fair, because plenty of these reports really don't demonstrate impact. But "no impact" isn't automatically true for every leaked Maps key, and I don't think it was true here.

## The rebuttal

I followed up with the actual cost math, since that's the part most reports in this category skip:

> "I forgot to mention that for every 1000 requests for this link with api key its cost the company 5$"

An unrestricted key on a metered API isn't a theoretical issue — it's a direct line to the target's Google Cloud bill. At $5 per 1,000 Geocoding requests, a trivial script run overnight can rack up real, unauthorized charges with zero effort and zero access controls in the way.

I also pointed to precedent — this exact class of bug has been accepted and paid out elsewhere, and there's a well-known writeup on the pattern:

- [HackerOne report #724039](https://hackerone.com/reports/724039)
- [HackerOne report #1093667](https://hackerone.com/reports/1093667)
- ["Unauthorized Google Maps API Key Usage: Cases and Why You Need to Care"](https://ozguralp.medium.com/unauthorized-google-maps-api-key-usage-cases-and-why-you-need-to-care-1ccb28bf21e) — ozguralp

## Why this matters more broadly

The lesson here isn't "I was right and they were wrong" — the report may well stay closed, and that's the triager's call to make. The actual lesson is about *how* to argue impact on this bug class, because "found an API key" reports get dismissed constantly, often correctly:

- **A restricted key** (locked to a package name/cert, or to a free, uncapped API) genuinely often *is* Not Applicable. Don't skip checking restrictions before reporting.
- **An unrestricted key on a metered API** has a direct, quantifiable cost — and that number is the entire argument. "Impact" doesn't have to mean data breach; a predictable per-request dollar cost is impact.
- **If the same key gates a business-critical Maps feature** (ride tracking, hotel search, live location), the story gets worse than billing — it becomes availability risk for the actual product.
- Citing prior accepted reports for the same bug class isn't just padding — it shows the program precedent already exists for taking this seriously, which is often the deciding factor in a second look.

## Takeaway

Triage disagreements are a normal part of bug bounty work, not a failure. What separates a report that gets reconsidered from one that stays closed is usually whether you come back with a number, not just an opinion.
