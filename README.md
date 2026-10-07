# personal_site

Static sites for Kayode Adetunji and Adeticket Inc.

- `sites/portfolio` — personal cloud and DevOps portfolio (work history intentionally excluded)
- `sites/adeticket` — Adeticket Inc. landing page
- `sites/adeticket/grouper` — browser-only group randomizer at https://adeticket.com/grouper/
- `sites/catalogue` — game catalogue for play.adeticket.com

Deployment and domain notes are in `domain-and-sites-backlog.md`.

## Portfolio continuity

Owner instruction (2 October 2026): add every new website to the Adeticket portfolio. Preserve existing entries, use canonical URLs, and clearly identify sign-in requirements. Do not publish personal records or unverified claims.

Grouper is included as a fifth portfolio card and in the guide/sitemap. Its public URL is `https://adeticket.com/grouper/`, with no login. Published after owner approval on 7 October 2026; live route and portfolio link verified. Run `node --test tests/grouper.test.mjs` for focused logic checks; serve `sites/adeticket` as a static root to preview it.
