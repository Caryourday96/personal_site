# personal_site

Static sites for Kayode Adetunji and Adeticket Inc.

- `sites/portfolio` — personal cloud and DevOps portfolio (work history intentionally excluded)
- `sites/adeticket` — Adeticket Inc. landing page
- `sites/adeticket/grouper` — browser-only group randomizer at https://adeticket.com/grouper
- `sites/catalogue` — game catalogue for play.adeticket.com

Deployment and domain notes are in `domain-and-sites-backlog.md`.

## Portfolio continuity

Owner instruction (2 October 2026): add every new website to the Adeticket portfolio. Preserve existing entries, use canonical URLs, and clearly identify sign-in requirements. Do not publish personal records or unverified claims.

Grouper is included as a fifth portfolio card and in the guide/sitemap. Its canonical public URL is `https://adeticket.com/grouper`, with no login. Azure Static Web Apps redirects the trailing-slash version to this address. Published after owner approval on 7 October 2026. Run `node --test tests/grouper.test.mjs` for focused logic checks; serve `sites/adeticket` as a static root to preview it.

## Bible Blitz release

The Adeticket workflow builds a pinned Bible Blitz revision from `bible-blitz-release.json` into `/bibleblitz`. The build script checks the exact Git SHA. Generated output and the vendor checkout are ignored. All five existing portfolio projects remain; Bible Blitz is the sixth entry and requires no sign-in. Its realtime service uses the existing Friends Showdown Azure App Service on a separate path. No new hosting resource is provisioned.

To reproduce, clone Caryourday96/bible-blitz into `.vendor/bible-blitz`, check out the manifest revision, then run `node scripts/build-bible-blitz.mjs`. The workflow publishes the prepared `sites/adeticket` directory. To update or roll back, change the pinned revision after its tests pass and ensure the compatible backend release is deployed.
