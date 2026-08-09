---
title: "One Bad Email Address, and a Dev Server Printed Its Database Password"
description: "A password-reset page on Shamela's development host answered an invalid email with an unhandled error, and the error page rendered the app's database credentials straight into the browser. The finding, why 'it's only dev' doesn't rescue it, and how I reported it."
date: 2026-08-09
lang: en
draft: false
tags: ["information-disclosure", "responsible-disclosure", "secrets"]
---

Early in 2025 I spent an evening poking at [Shamela](https://shamela.ws) (المكتبة الشاملة), the huge Arabic Islamic-text library. It is the kind of site that is quietly load-bearing for a whole field: students, researchers, and app developers all pull from it. Sites like that tend to grow features faster than they grow security review, so I went looking at the edges rather than the front door.

The edge that answered was a development host, and the thing it handed over was not a stack trace. It was the application's database username and password.

## TL;DR

- The password-reset flow on `dev.shamela.ws` did not handle an invalid email address.
- Instead of rejecting it cleanly, it threw an unhandled error inside the email-validation library and rendered an interactive debug page.
- That page printed environment configuration, including `DB_USERNAME` and `DB_PASSWORD`, to an unauthenticated visitor.
- The leaked password was a short keyboard-pattern string, so the disclosure and the credential were each a failure on their own.
- No authentication, no special headers, no tooling. One form submission in a browser.

## The finding

The password-reset page on the development host:

```
https://dev.shamela.ws/password/reset
```

Submitting a malformed email address should produce one boring outcome: a validation message saying the address is not valid. This flow produced something else. The string tripped a bug inside the framework's email-validation library, the exception went uncaught, and the debug handler rendered its full diagnostic page instead:

```
ErrorException (E_NOTICE): Trying to access array offset on value of type null
.../vendor/egulias/email-validator/EmailValidator/Parser/Parser.php:147
```

That trace gives the stack away on sight, `egulias/email-validator` is a Laravel dependency and the handler is Laravel's, running with debug output left on. The same page also printed the absolute server path it was all sitting under, `/var/www/vhosts/shamela.ws/dev.shamela.ws/dev/`.

Debug pages of that kind include a panel for the application environment. Sitting in it, in plain text:

```
DB_USERNAME=api
DB_PASSWORD=<redacted>   # a short keyboard-pattern password
```

The `DB_USERNAME` / `DB_PASSWORD` naming is the standard `.env` convention used by Laravel and other PHP frameworks, which is exactly the file that is supposed to never leave the server. The whole point of moving secrets out of source code and into an environment file is that the file stays on the box. A debug handler that prints the environment reverses that decision in a single HTTP response.

I am holding the actual password back here. It follows the pattern that anyone who has run a password audit will recognize instantly, four letters alternating case, then `1234`, and describing it is enough to make the point without publishing a working credential.

## Why a password-reset page, specifically

It is not a coincidence that this is where it broke. On most applications, password reset is the only unauthenticated endpoint that does real work: it takes attacker-controlled input, validates it, queries the user table with it, and usually reaches a mail service on the way out. Maximum machinery, minimum authentication. If any layer of that chain throws and nothing catches it, the error surfaces to a stranger. Here it threw at the very first layer, parsing the address, before the lookup or the mailer ever came into play.

That is also why malformed input is such a common unhandled case here. The happy path gets tested constantly during development, because developers reset their own passwords with their own valid addresses. The ugly inputs, the ones just malformed enough to trip a parser, get exercised approximately never.

## Impact

The usual defense of a debug page is that it only leaks trivia: framework version, a file path, a line number. That defense does not apply when the page leaks the credential itself.

- **Direct data access.** A database username and password is not a hint about the attack surface, it *is* the attack surface. If the database port is reachable from anywhere the credentials can be replayed from, the disclosure is the entire compromise.
- **Credential reuse.** A weak, human-chosen password on a dev database is rarely unique to that database. The same string tends to reappear on staging, on an admin panel, or on a service account somewhere else.
- **Trivially guessable regardless.** A password of that shape falls to an offline crack or a small online spray in seconds. Even without the leak it was a weak credential. The leak just removed the need to guess.
- **Everything a normal debug page leaks, on top.** Framework and language versions for narrowing a CVE search, real file paths for traversal and file-inclusion attempts, and internal logic from the trace.

## Takeaway

Two settings, one on each side of the same request, and either one alone would have made this a non-event: debug output disabled, or a secret that was not worth stealing. The pattern that keeps repeating is that secrets management gets treated as solved once the values are out of source control and into a `.env` file, when all that actually did was move the secret to a place that a single misconfigured error handler will read aloud.

Test the unhappy paths. The failure case is the one nobody exercises, and it is the one that talks.
