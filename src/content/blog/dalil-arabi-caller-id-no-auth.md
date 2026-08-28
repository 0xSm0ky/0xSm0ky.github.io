---
title: "Reading a Caller-ID App That Forgot to Add Authentication"
description: "Dalil Arabi's backend has no authentication layer at all - grepping the decompiled app for any auth header comes back empty. Reverse lookups are anonymous, and note ownership is decided entirely on the client. A static teardown, and the single live test that would turn it from likely into proven."
date: 2026-08-20
lang: en
draft: false
tags: ["mobile", "recon", "privacy"]
---

Some findings you prove by firing a request and watching the server hand over something it shouldn't. Others you find by reading the app and realising the server was never asked to say no. Dalil Arabi (`com.dalilarabi.sa`, a caller-ID/directory app, backends `kashefar.com` and `arabias.reviews`) is the second kind. Grepping its decompiled network code for anything resembling authentication - `Authorization`, `Bearer`, `X-Api-Key`, `token`, an HMAC, a signature - returns nothing. Every call is an anonymous form POST or GET.

This is a static teardown. Nothing here was fired at the live server, and I'll be clear throughout about where the line between "the code says" and "the server does" sits. But the code says a lot.

## TL;DR

- **No authentication layer anywhere.** The only per-user value is `user_id`, read from local `SharedPreferences` with a default of `""`, and it's sent on exactly one endpoint. Everything else is anonymous.
- **Reverse phone lookup is unauthenticated:** `GET notes.php?phone=<number>` returns notes and identity data others saved about that number - the makings of bulk reverse lookup over a directory.
- **Note ownership is decided client-side.** The app ships *two* delete paths, one labelled "my note" and one "delete request from an external user" - which only makes sense if the client, not the server, is the thing choosing whether you're allowed.
- **`user_id` is attacker-controlled.** On the edit path it's read straight from local prefs (default blank), so a forged or blank value rides along unverified - the setup for editing notes you don't own.
- Every item below is `[STATIC]`: derived from shipped code, not yet observed in live traffic. None is submittable until the one confirming test passes.

## The root cause, in one grep

The whole thing rests on a single absence. Across the network classes and `MainActivity`, there is no auth header construction, no key, no token, no request signing. The one identity-shaped value is `user_id`, pulled from `SharedPreferences("MyAppPrefs")` with default `""`, and it appears on only one call (`edit_note`). Everything else is a bare anonymous request. There is also no certificate pinning (the only pin-like match is a Google Ads class) and no `network_security_config`, so TLS on the backend is interceptable for confirmation.

When there's no server-side identity, "who is allowed to do this" has to be answered somewhere - and the only place left is the client. That's the theme every finding below is a variation of.

## F1 - Anonymous reverse phone lookup

```
GET https://www.kashefar.com:7703/android/notes.php?phone=<number>&s=1
```

No `user_id`, no auth header on this call. The constant `notes.php?phone=` and its `&s=1`/`&s=2` modes are right there in the decompiled network class. For a caller-ID app, the value being returned is exactly the sensitive part: the labels and identity notes other users have attached to a number. If this answers anonymously - and there's nothing in the code that would stop it - then it's a reverse-lookup and enumeration primitive over the whole directory.

**What would confirm it:** query a number *you own* through a proxy, read the response body, then query an unrelated number and check for rate limiting or batchability. **What would kill it:** a session cookie or device binding not visible in the code, a server that only returns the caller's own data, or a hard rate limit that blocks enumeration.

## F2 - Delete an arbitrary note

```
POST https://www.kashefar.com:7703/android/delete_note.php
params: note_id, phone      ← no user_id, no identity of any kind
```

The tell here is architectural. Alongside `delete_note.php` ("my note") the app ships `request_delete_note.php`, explicitly labelled in the code as the *"delete request from an external user"* path. Two different endpoints for "delete mine" versus "delete someone else's" is the client deciding ownership and then politely telling the server which case it thinks applies. If the server takes the "my note" path at its word and doesn't re-check ownership, any note is deletable by `note_id` - and enumerable IDs turn that into mass deletion.

**What would confirm it:** create a note, delete it via the baseline path, then attempt to delete a note you did *not* create by supplying its `note_id`. **What would kill it:** the server rejecting a delete without a matching session/owner, or `note_id` being an unguessable token *and* deletion scoped server-side to the owner.

## F3 - Edit an arbitrary note

```
POST https://www.kashefar.com:7703/android/edit_note.php
params: user_id (from prefs, default ""), note_id, note, phone
```

This is the one endpoint that carries `user_id`, and it carries it from a place the attacker controls: local prefs, default blank. Because the value is client-supplied and there's no server identity to check it against, a forged or empty `user_id` paired with a `note_id`/`phone` you don't own is the recipe for overwriting or forging notes on arbitrary numbers - content injection served to every other user who looks that number up.

**What would confirm it:** edit your own note as a baseline, then replay with a different or blank `user_id` and a `note_id`/`phone` you don't own. **What would kill it:** the server binding edits to an authenticated owner and ignoring the client's `user_id`.

## What I deliberately did *not* do

I didn't fire any of these at the live server. The backends serve real users' PII, and I didn't have confirmed authorization for these hosts. So this stays a code-derived teardown, and the honest status of every finding above is "the shipped app is built as if the server enforces nothing, and one owned-data test each would show whether it actually does." I also ruled one thing *out* while reading: the app's `update.json` is a version check only - no APK download, no install intent - so it isn't an update-hijack RCE, and I'm noting that so no one re-chases it.

## Impact (if confirmed)

- **Directory-wide reverse lookup.** Anonymous `notes.php` queries mean anyone, not just app users, can turn a phone number into whatever identity data the crowd attached to it - at whatever rate the server tolerates.
- **Integrity of the whole dataset.** If edits and deletes are client-gated, the caller-ID labels other people rely on can be forged or wiped by anyone who can guess a `note_id`. A directory whose entries anyone can rewrite is a directory that can be weaponised for harassment or impersonation.
- **It compounds with name search.** A separate `search_by_name.php` endpoint (same no-auth shape) runs the lookup in reverse, name/company to numbers - so the two together enable name-to-number correlation.

## Takeaway

The bug class here isn't any single endpoint; it's an architecture that put authentication nowhere and then split "mine" and "not mine" into two client-chosen code paths. Reading the app tells you what it's *built to allow*; only a request tells you what the server *actually enforces*. I'm comfortable publishing the first as a teardown and refusing to claim the second until an owned-data baseline earns it. When there's no auth layer in the client, the interesting question is always the same - does the server have one the client just isn't using, or is there no "no" anywhere in the system?
