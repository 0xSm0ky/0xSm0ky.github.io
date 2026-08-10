---
title: "From a Google Search Result to a Live Cloud Key: Inside the StoryGo App's Backend"
description: A random IP in a Google result led to the Alibaba-Cloud backend of a reading app — a self-hosted GitLab/ZenTao/InfluxDB box, and a long-term Alibaba Cloud AccessKey hardcoded into the APK that a live proxy capture proved is still valid.
date: 2026-08-08
lang: en
draft: false
tags: ["mobile", "recon", "secrets", "disclosure", "en"]
---

It started with a single IP address in a Google search result. I was looking up an Android app's permissions, landed on an indexed page pointing at `47.115.9.59`, and noticed two things: it's in an **Alibaba Cloud** range, and it was answering on several ports. Pulling that thread led to the backend of two Play Store apps, a pile of internet-facing admin tooling, and — the part that matters — a **long-term Alibaba Cloud credential baked straight into the app**, which a live traffic capture proved is still valid and in active use.

Everything below is passive recon plus static and dynamic analysis of an app I could download myself. No credential found in the app was ever used against anyone's cloud account, and nothing intrusive was attempted. The one value held back is the live AccessKey **secret** itself — it's still valid, so it stays masked until it's rotated; everything else is here in full.

## TL;DR

- A Google result surfaced `47.115.9.59` (Alibaba Cloud), which fronts the backend brand `zrole.com` behind the apps `com.storygo.novel` and `com.storypro.vida`.
- That host exposes a self-managed **GitLab**, a **ZenTao** suite, an **Adminer** DB panel (behind basic auth), and an **InfluxDB** instance — a lot of admin surface on production infrastructure.
- The app is the **overseas build of a Chinese reading app** (`com.storygo.app_oversea.OverseaApp`), bundling Alibaba (Aliyun/CicadaPlayer) and Tencent (MMKV) components alongside AppsFlyer, Facebook, and Firebase.
- It ships analytics to **Alibaba Cloud Log Service (Singapore)** using a **hardcoded, long-term AccessKey pair** compiled into the APK. A proxy capture confirmed the key is **live** — Alibaba accepts the signed request with `200 OK`.

## Part 1 — The host behind the IP

Unauthenticated banner recon on `47.115.9.59`:

| Port | Service | Note |
|---|---|---|
| 22 | OpenSSH 8.2p1 (Ubuntu) | admin SSH |
| 80 | nginx 1.18.0 | returns 403 |
| 443 | nginx → **GitLab CE** | `302 → /users/sign_in`, `Sign in · GitLab`; TLS cert **CN = `git.zrole.com`** |
| 8086 | **InfluxDB OSS 1.8.4** | `/ping → 204`, version leaked in headers |
| 9001 | Apache → **ZenTao** | `Welcome to zentao!`; `/zentao/` sets `lang=zh-cn`; `/adminer/ → 401` basic realm `"zentao admin"` |

DNS ties it together: `www.zrole.com → 47.115.9.59`, `git.zrole.com` is the TLS identity, and the public app domain `storygo.cc → 8.222.217.104` — a different **Alibaba Cloud** IP in the Singapore range. One box simultaneously serving source control, a project-management suite, a DB admin panel, and a metrics DB, co-located with production app infrastructure, is a broad exposure footprint even though the sensitive panels sit behind auth.

## Part 2 — The app

**Target:** `com.storygo.novel` ("StoryGo"), v2.6.4 (versionCode 1080), min SDK 22 / target SDK 35. Decompiled with apktool.

### It's a Chinese app's "overseas" edition

The application class is literally `com.storygo.app_oversea.OverseaApp`. It ships both English and Chinese legal assets — including Chinese copyright-takedown notice PDFs. Per Google Play (self-reported), the publisher is a Singapore entity with a `+86` China support phone. The internals are consistent with a China-origin team shipping a Singapore-fronted overseas product.

### The SDK mix

Chinese-origin components: Alibaba **Aliyun** SDK, Alibaba **CicadaPlayer** (ApsaraVideo), the Alibaba Cloud **Log Service (SLS)** client, and Tencent **MMKV**. A Umeng (Alibaba analytics) appkey deeplink scheme is also declared in the manifest. Western/global components: **AppsFlyer**, **Facebook**, and **Firebase / AdMob / Crashlytics**. So the app runs a dual telemetry stack.

### The finding: a hardcoded Alibaba Cloud AccessKey

The app's own analytics reporter (`OasisReporter`) constructs an Alibaba SLS log-producer with credentials compiled directly into the binary:

```
endpoint        : https://ap-southeast-1.log.aliyuncs.com   // Alibaba Cloud SLS, Singapore
project         : novel-app-tracking
logstore        : storygo-app-tracking-prod
accessKeyId     : LTAI5tDN4fCYFGTxXp6YQxUN   // "LTAI…" = a long-term Alibaba Cloud AccessKey
accessKeySecret : nnjZbbVptTemolBObqTTZsVjvtw9hT
```

An `LTAI…` key is a *long-term* credential, not a short-lived STS token. Anyone who downloads the APK can extract it. Best case it's tightly scoped to write into one log store — which still allows forged telemetry, cost inflation, and potential log-data exposure for every user. Worst case, if it's over-privileged (a common mistake), the blast radius is much larger. Either way, client-side SLS ingestion is supposed to use short-lived STS tokens minted server-side, never a baked-in permanent key.

Other notes: the app sets `android:usesCleartextTraffic="true"` (plaintext HTTP allowed), and requests a broad permission set for a reading app — `ACCESS_FINE_LOCATION`, `READ_PHONE_STATE`, `CAMERA`, calendar, and media — consistent with an ad/attribution-heavy model.

## Part 3 — Live traffic capture

Static analysis tells you what an app *can* do; a proxy shows what it *actually* does. I ran the app on an Android 9 emulator through an intercepting proxy with the CA installed as a system certificate.

**No certificate pinning.** Every host — including the core API and the SLS endpoint — decrypted cleanly. Zero failed handshakes.

**The hardcoded key is live.** The SLS reporter fires every few seconds, signed with the exact key from the APK, and Alibaba accepts it:

```
POST https://novel-app-tracking.ap-southeast-1.log.aliyuncs.com/logstores/storygo-app-tracking-prod/shards/lb
Authorization: LOG LTAI5tD…REDACTED:…REDACTED…
x-log-signaturemethod: hmac-sha1
content-type: application/x-protobuf   (lz4-compressed)
→ 200 OK   server: AliyunSLS
```

That upgrades the finding from "a credential is hardcoded" to "the credential is **valid and used from every install**." (I observed only the app's own traffic — I never used the key.)

**The main API, proven from headers to be Alibaba-fronted.** The app calls `POST https://wup.storygo.cc/tup` (an OkHttp client). During capture the origin was unhealthy and returned `502 Bad Gateway`, but the error headers are diagnostic:

```
server: Tengine                                 # Alibaba's nginx fork
via: ens-cache…sg30[...], cache…l2sg5[...]      # Alibaba Cloud CDN, Singapore edges
set-cookie: acw_tc=… ; cdn_sec_tc=…             # Alibaba CDN/WAF tokens
```

The API itself is a **Tencent TARS/WUP** RPC — the decoded request calls servant `noveluif`, method `listTabSectionsList` (the home feed), and carries a device-fingerprint string on every call:

```
os=android;appChannel=official/android;appVerName=2.6.4;appVerCode=1080;
appBundleId=com.storygo.novel;sysVer=android/9;device=samsung/SM-N975F
```

Alongside it, AppsFlyer, Facebook Graph, Firebase Analytics/Crashlytics, and FCM registration all fired — the dual telemetry stack, confirmed at runtime.

## What it all adds up to

A random IP in a search result turned out to be the operator's Alibaba-Cloud footprint (`zrole.com`) behind the StoryGo/StoryPro apps. The apps are the overseas edition of a Chinese product, wired to Alibaba and Tencent components, and one of those wires carries a **hardcoded cloud credential that is still valid**. The more actionable issue than "which country hosts it" is that leaked key, plus the broad, admin-heavy surface on the backend host.

## Ethics and disclosure

Everything here is passive recon and analysis of a self-downloaded app. No login was attempted against GitLab/ZenTao/Adminer; the leaked key was never used against Alibaba Cloud (its validity was confirmed only from the app's own request); no data was read from or written to the operator's systems. The responsible sequence for a finding like this is: report the hardcoded key to the vendor and the cloud provider, give them time to rotate and revoke it, and keep the *working secret* out of any public writeup while it's still live — which is the one value masked here. Once the key is rotated it's inert, and there's no reason not to publish it in full.

## Takeaway

Static analysis finds the credential; a proxy proves it's live. If you're shipping a mobile app, the lesson is the boring one that keeps showing up: never compile a long-term cloud key into a client. Mint short-lived tokens server-side, scope them to exactly one action, and assume anything in the APK is already public.
