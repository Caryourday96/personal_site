# Public resource guides — October 21, 2026

Addresses observed content gaps in the Adeticket portfolio following an AdSense low-value-content rejection. This is a useful-content update, not a claim of policy certification or guaranteed approval. No AdSense review request is submitted by this release.

## Pages

- `/guides/bible-blitz.html`: mode selection, rules and scoring example, private host controls, TV setup, screenshot and troubleshooting.
- `/guides/grouper.html`: participant review, worked size examples, reveal controls, randomness limits, sharing and privacy behavior.
- `/guides/game-night.html`: preparation, actual-equipment rehearsal, hosting and fallback checklist.

Homepage and guide hub link to all three. About now reflects all seven projects; all existing portfolio entries remain. Grouper links directly to its guide. Canonical URLs and sitemap entries support discovery. Updated page headers and new guide icons use the supplied original Adeticket PNG without modifying its artwork.

The pages describe verified current controls, with illustrative examples identified as examples. Keep feature claims aligned with app changes. Edit `scripts/build-resource-pages.mjs` and run `node scripts/build-resource-pages.mjs` from this repository to regenerate the three committed HTML files; the existing deployment needs no extra build step. Update dates only when reviewing or changing the content. The sample TV screenshot is from a demonstration game, not customer data.

## Verification before publication

All six updated portfolio/resource pages passed at 1440, 390 and 320 CSS pixels without horizontal overflow. Internal link targets exist. Automated WCAG A/AA checks reported zero violations after fixing the existing project-label contrast. Desktop and mobile screenshots were inspected. All five existing Grouper tests passed. App code, release pins, receiver policies and hosting configuration are unchanged.

## Follow-up

Confirm the deployed pages and sitemap before the owner requests another AdSense review. Search indexing and AdSense decisions are external and not verified by these checks. Keep adding resources only where they help users complete real tasks; do not add filler pages or fabricated testimonials. Remaining app-specific guides can be developed from verified product behavior as needed.
