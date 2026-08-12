---
title: "No Login Required: Breaking Down NumberBook's Caller-ID API"
description: NumberBook asks for your entire contact list, then answers reverse phone lookups through a backend that has no authentication, no rate limiting, and 'encrypts' its responses with a key that ships inside the app itself.
date: 2026-08-12
lang: en
draft: false
tags:
  - mobile
  - recon
  - privacy
  - disclosure
---

NumberBook (نمبر بوك السعودية) is a Saudi caller-ID app: install it, hand over your contacts, and in exchange it tells you who's calling from a number you don't recognize, pulled from a crowd-sourced database everyone else's contact uploads built. I went looking at how it actually talks to its backend. What I found is the kind of bug that's boring to describe and alarming to actually sit with: the entire API requires no login, no token, no key of any kind, has no rate limiting, and the one thing that looks like a security measure turns out to be decorative.

## TL;DR

- NumberBook is a Flutter app that ships with no backend URL anywhere in its binary. The URL is fetched at runtime from Firebase Remote Config, and even there it isn't plaintext.
- Live traffic capture found the real backend: a single PHP endpoint that does both reverse phone lookup and contact-list upload, gated by **nothing**. No auth header, no cookie, no API key, no device token.
- There is **no rate limiting**. Twenty rapid-fire lookups in a row all returned `200 OK`. Saudi mobile numbers are a small, fully walkable space, so "no throttle" quietly means "the entire dataset is downloadable."
- The response looks encrypted (base64, high entropy, no recognizable header), and it is, technically, AES-encrypted. But the key and IV are hardcoded strings baked into the app itself, so every install already carries the means to decrypt every response. That's obfuscation wearing encryption's clothes.
- Contact upload is accepted from anyone too, meaning the same lack of authentication that lets you read the database also lets you write to it.

## Part 1: static analysis hits a wall

The APK identifies itself as `com.saudi.numberbook`, a Flutter app (Dart AOT, so the real logic lives in a compiled `libapp.so`, not in readable smali). Its permission list is the tell: `INTERNET`, `ACCESS_NETWORK_STATE`, and, doing all the work, `READ_CONTACTS`. No camera, no microphone, no phone-state access. This is an app whose entire value proposition is your address book.

Normally the next move is grepping the binary for URLs and API paths. Here it went nowhere: an exhaustive path-shaped-string sweep across the Dart snapshot turned up nothing but Flutter/Dart SDK internals and three in-app navigation routes (`/pages/splash`, `/pages/home`, `/pages/agreement`). No `/api/`, no `/lookup`, no host, nothing. The app links `firebase_remote_config`, which explained why: the base URL isn't compiled in at all, it's fetched over the network the first time the app runs.

## Part 2: chasing the URL through Firebase

Firebase Remote Config is designed to be fetched directly, no app required, if you have the project's public API key and app ID (both of which sit in the binary as plain strings, because that's how Firebase apps are supposed to work). Two REST calls, an installation registration followed by a config fetch, handed back the app's entire config template: fifteen keys, including feature flags like `checkVPN`, `checkJailbroken`, and a `perLoad` value that looks like a client-side lookup quota.

Three of those fifteen keys were the URLs I was after: `url`, `urlAndroid`, `uploadUrlAndroid`. And none of them were readable. Each one decoded from base64 into a fixed-size binary blob with no recognizable structure: not JSON, not a compressed format, just noise. So even the mechanism meant to deliver the backend address at runtime doesn't deliver it in the clear. Two layers of indirection (fetch-from-cloud, then decrypt) stood between me and a single URL.

## Part 3: what live traffic actually showed

Static analysis tells you what an app *can* do. A proxy tells you what it *does*. I ran NumberBook on an emulator with an intercepting proxy in front of it and drove it through a real lookup.

No certificate pinning. Every request decrypted cleanly, and the real backend showed up immediately:

```
POST https://snumberbook.com/android-api.php
User-Agent: android
Content-Type: application/x-www-form-urlencoded; charset=utf-8

num=<phone>&appVersion=5
```

That's the entire request. No `Authorization` header. No cookie. No API key, device ID, or signed token of any kind. Four header fields and a phone number, and the server answers with a full record.

The same endpoint doubles as the contact-upload sink:

```
POST https://snumberbook.com/android-api.php
Content-Type: application/x-www-form-urlencoded; charset=utf-8

contacts=<base64 JSON array of {displayName, phones[]}>
```

One request from the app, captured live, carried three dozen contacts, names and numbers, base64-encoded into a single POST body. That's the entire mechanism by which this app's database exists: everyone who installs it feeds it the names and numbers of people who never chose to be in it.

To confirm none of this was app-only magic, I replayed the exact same lookup request from a plain script with no app behind it at all. Same headers, same body. The response came back byte-for-byte identical to what the app itself received. Whatever gates this API, it isn't checking who's asking.

I ran the same script twenty times in a row against the endpoint. Twenty `200 OK` responses, no slowdown, no lockout, no CAPTCHA, nothing. The app's own Remote Config claims a `perLoad` quota of five lookups, presumably meant to push free users toward whatever paywall exists. The server has never heard of it.

## Part 4: breaking the "encryption"

The lookup response itself is genuinely odd-looking: a long base64 string that decodes into a block of high-entropy binary, sized as an exact multiple of 16 bytes. That's the signature of a block cipher, and testing ruled out every common compression format. It's encrypted, not just obfuscated-looking.

Here's the thing about encrypting a response for a mobile client, though: the client has to be able to decrypt it, which means the key has to travel with the app. There's no server-side secret involved once the binary is in your hands, only an assumption that nobody will bother looking.

I already had one plaintext/ciphertext pair to work with: one of those unreadable Remote Config blobs from Part 2 had to decrypt to the exact backend URL I'd already confirmed from live traffic. That's a known-plaintext attack waiting to happen. Every printable string constant sitting in the compiled binary is a candidate key; testing all of them against that one known pair (using the fact that, in this cipher mode, part of the plaintext depends only on the key, not on the initialization vector, so you can check a candidate without guessing the IV at the same time) surfaces exactly one match. From there the IV falls out by working the first block backward, and both values turn out to be sitting in the binary as literal, readable text, right next to the ciphertext they're meant to protect.

With that key and IV in hand, every lookup response decrypts into a small, consistent JSON object: `{"result": [ ...list of name strings... ]}`, one array holding every label anyone has ever attached to that number in the crowd-sourced database. I confirmed this against a junk placeholder number, the kind people register their number as before giving it away, and got back a genuinely funny list of joke labels other users had saved it under. I did not run this against anyone's real, private phone number. There was no need to: the mechanism is proven either way, and the app's own users already receive this exact decrypted output on every real lookup they make.

The same Remote Config decrypt run also surfaced a second backend host I hadn't seen in traffic yet, `dlilcom.app`, handling contact uploads. Whether that's the same operator running two brands or a shared backend behind two apps, I didn't dig further. Worth noting for anyone reading this from the vendor side.

I also wanted to confirm the decrypted data really is what the app works with at runtime, not just what my own script produces offline. On a rooted emulator, scanning the running app's own memory for a phone number I'd just looked up found it twice: once as the plain ASCII text of my outgoing request, and again as a UTF-16 string sitting inside the app's decrypted response object (UTF-16, because the record it belonged to carried an Arabic name). The cleartext record exists in the app's memory in the clear, which is exactly what you'd expect once you know the "encryption" is symmetric obfuscation with a key riding along in the same package.

## Part 5: why "no auth, no rate limit" adds up to "the whole database"

Each of these on its own reads like a checklist item. Together they compound:

- **No authentication** means anyone, not just app users, can query the API directly.
- **No rate limiting** means there's no cost to querying it a lot.
- **A small, structured number space** (Saudi mobile numbers follow a fixed format with a known set of operator prefixes) means "a lot" is a tractable, finite number of requests, not an infinite haystack.
- **The response format leaks presence even before decryption**: a registered number's response is roughly sixty times larger than an unregistered one's, so you can tell whether someone's in the database without even touching the key.

Put together, that's not "you can look up one number." That's "you can walk the entire address space and rebuild the whole crowd-sourced identity graph," offline, at your own pace, with a script that fits on one screen. And because the underlying data mostly arrived via other people's uploaded contact lists, the majority of names in that graph belong to people who never installed this app, never agreed to anything, and have no way to know they're in it.

The upload side has the same problem pointed the other direction. If anyone can write to the database with no authentication, anyone can also poison it: attach a false name to a number that isn't theirs, and it becomes the caller-ID label every other user of the app sees for that number from then on.

## Takeaway

The lesson isn't really about AES. It's that "the response is encrypted" and "the response is protected" are different claims, and a mobile app is a strange place to keep a secret, because the whole app, key included, ships to everyone who downloads it. The actual gap here was never cryptographic. It was that nothing on the server ever asked who was calling.
