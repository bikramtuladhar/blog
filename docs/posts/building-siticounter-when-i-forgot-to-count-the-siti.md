---
layout: BookLayout
title: "Building siticounter.com Because I Forgot to Count the Siti"
date: 2026-05-12T10:00:00.000Z
---

# Building siticounter.com Because I Forgot to Count the Siti

There's a very specific kind of failure that only happens in a South Asian kitchen: you put the pressure cooker on, the recipe says "Mustang simi — 6 siti", you start counting *one… two…*, the phone rings, and forty minutes later you're scraping a pot of beans that have dissolved into paste. That was a Sunday. The dal was supposed to be the easy part of the meal.

I've lost count of siti more times than I've lost count of siti. Phone rings — lost count. Kid asks something — lost count. Walk into the next room to grab something — can't even hear it. New cooks have it worse: they don't know whether dal is 3 siti or 6 in the first place. The result is always the same — undercooked, overcooked, mushy, redo.

So I built [siticounter.com](https://siticounter.com): a phone-first app that listens to your pressure cooker through the mic, counts the whistles for you, and sets off an alarm when you hit the target. No accounts, no servers in the cooking path, works offline. This post is the story of building it — and because I work in git, the story basically *is* the git history.

## The idea, written down before the code

Before writing a line I wrote a [PRD](https://en.wikipedia.org/wiki/Product_requirements_document). Not because anyone asked — because I've learned that a one-page "here's the problem, here's the audience, here's what v1 must do" doc keeps me from accidentally building a recipe social network when all I wanted was a whistle counter.

The shape it settled into:

- **Listens** for whistles via the device mic, FFT the audio, find the peak in the cooker's whistle band.
- **Counts** automatically, with manual +/- correction for when it gets it wrong.
- **Alerts** with a looping alarm + vibration when the target siti is reached.
- **Survives** phone calls, screen-off, the cook walking away.
- **Teaches** — ships with built-in recipes (dal, rice, chana, rajma, biryani, plus Nepali staples like kwati, Mustang simi, khasi ko masu, gundruk, bhatmas) so a new cook doesn't need to know the siti count.

Non-goals were just as important: no native app (PWA only), no cross-device sync, no monetisation, no pressure/temperature sensing — just count the siti.

## Day 0: the boring foundation

The repo starts from a TanStack Start + TypeScript template. First real commit after that is, of all things, SEO — wiring `siticounter.com` as the canonical, a sitemap, `robots.txt`, even an `llms.txt`. Unglamorous, but doing it on day one means I never have to retrofit it.

Then a "production sprint" landed in one go: Sentry for error capture, self-hosted fonts, app icons, OpenGraph tags, the legal pages (privacy + terms), Cloudflare Pages config, and a service-worker update toast. The stack:

- **Frontend:** React + TanStack Router + Tailwind
- **Audio:** Web Audio API — an `AnalyserNode` doing the FFT
- **Storage:** `localStorage` for the cooking flow (so a reload doesn't reset your count)
- **PWA:** a service worker that precaches every asset — fully offline after first visit
- **Hosting:** Cloudflare Pages, with a D1 database reserved for the optional community marketplace

## The hard part: detecting an actual whistle

Counting siti sounds trivial — "loud noise = +1" — and that naive version is exactly what I shipped first. It was wrong constantly.

The problems, in the order they bit me:

**One long siti counted as three.** A pressure cooker doesn't go *beep*. It goes *ssssssiiiiiii* for a couple of seconds. A bare amplitude threshold fires on every frame that's above the line, so one whistle becomes a burst of counts. Fix: require a *silence gap* before re-arming — you only get the next count after the detector has heard genuine quiet since the last fire. One siti → one count.

**Wrong frequency band.** I'd guessed the whistle lived around 2 kHz. Real recordings peak closer to 6 kHz, so I moved the detection band to 4–10 kHz (later narrowed). Guessing is no substitute for recordings.

**Kitchen clatter triggered it.** A spoon on a steel plate is loud and brief — it sailed past a simple loudness gate. So the detector grew teeth: a *sustain* requirement (the sound has to hold for ~220 ms continuously, with a few frames of dropout tolerated), a *tonality* gate (a whistle is a narrow tone, not broadband clatter), and a *pitch-stability* gate (the peak frequency has to sit still). Clatter is loud but messy and short; it fails all three.

**Every cooker is different.** Brands whistle at different pitches. So there's a *calibrate* button — you tap it during a real whistle and the app learns *your* cooker's band — plus a manual band override in settings for the stubborn cases.

**It still drifted in noisy kitchens.** I tried an adaptive noise floor; it chased the noise and went deaf. Replaced it with an asymmetric silence-floor — quick to notice quiet, slow to forgive noise — which behaved far better against real recordings.

And the thing that actually moved the needle: **calibrating against 12 real cooker recordings.** I stopped tuning constants against my imagination and started tuning them against a folder of WAVs from actual kitchens. The detector now also keeps a 6-second PCM ring buffer with a tiny WAV encoder, so the cook screen can save a clean playable snapshot of the audio around each fire — when it gets one wrong, I can *hear* why.

There's also a heart-monitor-style scrolling graph of the detection level on the cook screen — partly a debugging tool, partly just reassurance that the mic is hearing *something*. And a beta path: an optional TensorFlow.js classifier head that runs per-frame inference on the FFT bins and replaces the amplitude threshold entirely. Still beta. The hand-tuned gates are doing fine.

## The recipe side

A whistle counter that doesn't know how many whistles you need is half a product. So recipes got real: each one carries ingredients, steps, base portions, the flame/wattage per step, and a per-step countdown timer. A portions slider scales the timer durations. You tick steps off as you go. When the per-step timer ends it plays a short two-tone ding with a haptic; when the *session* hits its target siti the alarm loops — highlighting the step — until you tap Stop, and the session auto-logs to history.

The built-in catalog moved from a hardcoded list to DB-first, which set up the optional **community marketplace** — sign in with Google, share a recipe, browse and search what others posted, save them for offline. There's an admin queue (`/admin/recipes`, gated to my email) for approving submissions, with free status transitions so I can unpublish or re-approve. Apple Sign In got cut early — it needs a paid Apple Developer account, and "free, no servers in the way" was the whole point.

History tracks every session — recipe, target, actual count, duration, timestamp — plus aggregate stats. Settings expose the sensitivity dial, the whistle band override, the minimum gap between siti (I dropped the default from 30 s to 10 s after testing), cooktop type, default portions, theme (including a "Night Kitchen" amber-on-near-black for late cooking), and a clear-all-data button. Privacy is a first-class screen, not a footnote: a consent banner on first visit, `localStorage` only for cooking, no audio ever leaving the device.

## Making it feel like an appliance, not a webpage

The last stretch of commits is all UI polish, and it's the part that decides whether anyone actually uses this while cooking:

- A **kitchen-glance home grid** — recipe tiles big enough to tap with one greasy thumb, a side nav drawer, one consistent menu opener on every page via a shared `PageHeader`.
- A **landscape dashboard** for the cook screen — phone propped sideways on the counter, giant live counter, a "predicted next siti" pill, the listening/muted/mic-blocked indicator, a fat +1 button, the level graph.
- **Count scaling** so the current/target number stays huge and readable from across the kitchen, and a calmer surface toggle so a dark kitchen isn't a flashlight.
- A pile of **SSR/hydration fixes** — the recipe grid and the step ticker were rendering differently on the server vs the client; suppressing the right hydration warnings and reconciling the markup got rid of the flash.

Six days, eighty-odd commits, from `template:` to "fix(home): avoid SSR/hydration mismatch on the recipe grid". Most of that time went into the detector — which is the right place for it to go, because everything else is just a nice wrapper around the one question that matters: *was that a siti?*

## Try it

[siticounter.com](https://siticounter.com) — open it on your phone, add it to your home screen, prop the phone near the stove, pick a recipe (or type a custom siti target), and tap Start. Take the call you were going to take anyway. The cooker will get counted; the dal will not become paste.

And if it miscounts your cooker, hit calibrate during a whistle — it learns. That's the whole trick: I stopped trying to count siti, and taught a phone to do it instead.
