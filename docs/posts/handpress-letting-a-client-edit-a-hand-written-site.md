---
layout: BookLayout
title: "Handpress: Letting a Client Edit a Hand-written Site Without a CMS"
date: 2026-09-26T06:30:00.000Z
---

# Handpress: Letting a Client Edit a Hand-written Site Without a CMS

![Editing a page in place, with the editor bar along the bottom](/images/posts/handpress-cover.png)

Every hand-built website ends with the same question, and it always arrives after the invoice:

> "Can I change the concert date myself?"

The site in question was for a sarod player — ten pages of hand-written HTML with hand-drawn Mithila borders, a raga clock that tints the hero by time of day, and an interactive family tree of a gharana going back a century and a half. Nothing about it came out of a template, and that was the point. The design *is* the product.

And now the owner needs to change a date. Twice a year. Maybe swap a photograph.

## Everything I could have done, and why I didn't

**Rebuild it in a CMS.** Break the design into templates, move the words into a database. This is the correct answer for a publication with a thousand posts, and the wrong one here: it is a week of work to convert, and the thing I'd be converting is precisely the thing the client is paying for. Every hand-placed ornament becomes a field in an admin form.

**TinaCMS.** Content in markdown, editing in React. That means rebuilding the pages as components first. Same week of work, same loss.

**Decap (ex-Netlify CMS).** Git-backed, which I liked — but you edit in a form on a separate admin route, not on the page. For an artist who thinks in terms of *the page*, "edit the `intro_paragraph` field" is the wrong mental model.

**CloudCannon.** Actually does this — visual editing of static HTML, git-backed. It's also about $55/month, forever, for a site that changes twice a year.

**"Just email me the changes."** The honest status quo for most small client sites, and the reason so many of them show a concert that happened in 2023. I've been that bottleneck. I didn't want to be it again.

So: the HTML files are already the content. What if the browser just edited them?

## The idea

Sign in on the real site. Click a paragraph. Type. Press Save. The file changes, and the change is a git commit.

No templating, no database, no build step. The repository stays the source of truth, `git revert` is the undo, and a changed sentence produces a one-line diff you can review like any other code:

```diff
-      <p class="subdisplay" data-e="t9">Sarod. Shahjahanpur Gharana. Lucknow and Bengal, held in one pair of hands.</p>
+      <p class="subdisplay" data-e="t9">Sarod. Shahjahanpur Gharana. Lucknow and Bengal, in one pair of hands.</p>
```

One line, in the file where the sentence actually lives, with a commit message naming who saved it. That diff is the whole pitch.

## The part that took the thinking: two DOMs

The naive version — "make the page `contenteditable` and save `document.body.innerHTML`" — is a trap, and it took me one afternoon to walk into it.

By the time you click anything, the page on screen is no longer the page in the file. My site's own JavaScript had already rendered a concert list from a config object, animated the counters from `0` to `1,000+`, appended "(opens in a new tab)" to every external link, and injected an SVG sprite. Save what's on screen and all of that runtime debris gets written into your source. Do it twice and the file is unrecognisable.

So the editor keeps **two** DOMs:

1. **The live page** — what the client sees and clicks.
2. **The source** — the file as it exists in the repository, fetched through the API and parsed into a second, script-free DOM.

Every edit is applied to both. Only the second one is ever saved. The live page is a preview; the file is the truth.

Which raises the matching problem: when someone edits the third paragraph on screen, which element is that in the file? A DOM path won't do — the scripts have inserted and moved things. So a small script keys every editable element once:

```html
<h2 id="intro-title" data-e="t18">A sarod that sings in the voice of khayal and dhrupad</h2>
```

`t` for text, `m` for images, `i` for list items, and a `g` prefix for anything inside the shared header and footer so those keys line up across all ten pages — edit the footer once, it's written to every page.

## The detail I nearly shipped wrong

The keying script rewrites your HTML, and the first version rewrote it *slightly* differently from how a browser would. Which meant the client's first innocent edit produced a diff touching all 1,400 lines of the page.

The fix was to make the offline script serialise exactly the way `outerHTML` does — same library the browser's own algorithm is specified against — then normalise every page once, in a commit of its own, before any content change. After that, saves diff cleanly forever.

I verified it rather than assuming it: parse each page in a real browser, serialise, compare byte-for-byte with what the script produced. Ten of ten identical. That test is still in the repo, and it is the reason I trust the whole thing.

## Letting them add a concert without inventing a layout

Text editing is the easy half. The real request is "add another concert", and that is where clients usually destroy a design — pasted markup, a stray `<div>`, a heading that's now bold and purple.

So repeating structures are handled structurally: hover any card, list item, paragraph or button and you get duplicate, move up, move down, delete.

![Duplicate, move and delete controls on a card](/images/posts/handpress-lists.png)

A new entry is always a **copy of one that already exists**, so it inherits the markup, the classes, the spacing. The client can add ten concerts and the design holds. They cannot invent a new layout by accident, which is a feature disguised as a limitation.

Anything the site renders from data — the concert list, the gallery, the video embeds — gets a generated form instead, over a plain JSON file.

## The backend changed hosts halfway through

First version: a Cloudflare Worker. Google sign-in, an allowlist of editable paths, and each save committed through the GitHub API. It worked, with one annoyance — after Save you wait about a minute for the rebuild, so the editor polls until the live file matches the commit and then refreshes itself.

Then the client's hosting turned out to be a DreamHost shared plan. cPanel-shaped. PHP.

I expected this to be the downgrade. It's the opposite: **on shared hosting the files are right there**. A save writes `about.html` and the next visitor gets it. No build, no deploy, no minute of waiting. The PHP version writes each file (to a temp name, then `rename()`, so nobody ever sees half a page), then runs `git commit` and pushes — same history, same offsite copy, instant publish.

The Worker is still in the repo, and the shared-hosting version is the one I'd now recommend. That sentence surprised me too.

## Things that bit me

- **The hover toolbar duplicated the wrong card.** Moving the mouse toward the little ⧉ button crossed the item *above*, which grabbed the toolbar on the way past. Caught by a browser test, fixed by putting the toolbar inside the item's own corner.
- **A counter ate the client's typing.** The count-up animation was still running and overwrote the number being typed. Elements the site animates now get detached from their animation while editing — which is also why the library has a `beforeEdit` hook: every site has one of these.
- **Sessions landed in a shared `/tmp`.** On shared hosting that directory holds 10,000 session files belonging to every other account on the machine. Ours now live in a private directory above the web root.
- **Two writers, one branch.** My laptop and the server both push to `main`. My push got rejected mid-session because the client had saved first — exactly the race I'd hardened the server against the hour before. A save that can't push now rebases once and retries, and never fails the save, because the file is already live.
- **An SVG upload was saved as `.jpg`.** The image pipeline resized everything through a canvas. Vectors now pass through untouched.

Each of those was found by driving a real browser against a real server, not by reading the code. I've stopped trusting green output that came through a pipe: one publish went out with a failing test because `| tail -2` swallowed the exit code.

## What it deliberately doesn't do

No drafts. No approval workflow. No content types. No simultaneous editors — a second concurrent save is refused rather than merged, with a "reload and redo it" message.

If you need those, you need a CMS, and you should go use one. This is for the case where a person who is not a developer needs to change a few words on a site that someone built by hand, and everybody involved would rather that not require an email.

## Try it

It's on npm as [handpress](https://www.npmjs.com/package/handpress), MIT licensed, with a [demo you can edit right now](https://handpress-demo.bikramtuladhar2011.workers.dev) — no sign-up, it's a real page and your changes stay in your browser.

```sh
npm i -D handpress
npx handpress install ./public --php
npx handpress keys "public/*.html" --global "header, footer"
```

[Documentation](https://bikramtuladhar.github.io/handpress/) · [cPanel guide](https://bikramtuladhar.github.io/handpress/cpanel.html) · [source](https://github.com/bikramtuladhar/handpress)

The sarod player's site runs on it. The next time a date changes, nobody has to email me — which was the entire point.
