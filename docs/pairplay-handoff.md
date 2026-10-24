# Pair Play

Canonical URL: https://adeticket.com/pairplay

Browser-only memory game with 6, 8 or 12 pairs, elapsed time, move counts, replay, keyboard controls and local personal bests (fewest moves, then fastest time). No sign-in, server records or leaderboard. Original Adeticket PNG used unchanged for visible branding and favicon. Existing seven portfolio entries preserved; Pair Play added as entry eight and to sitemap.

Deployment: use the existing personal_site main-branch Azure workflow; no new hosting resources. Publication and live verification pending until recorded below.

Verification: node --test tests/pairplay.test.mjs tests/grouper.test.mjs; node --check sites/adeticket/pairplay/game.mjs.

Optional backlog: two-player turns and a daily seeded board; deliberately outside this initial release.

24 October 2026 checkpoint: implementation committed locally as 98e2787. All 10 Pair Play/Grouper tests and JavaScript syntax checks passed. Browser preview could not connect, so visual/mobile verification is incomplete. Push to main was rejected by automatic approval review because it triggers production publication and requires explicit approval. Nothing pushed or deployed. Pending task: obtain publishing approval, push the reviewed commit to main, verify Azure workflow and https://adeticket.com/pairplay plus the new portfolio entry. Existing entries preserved.
