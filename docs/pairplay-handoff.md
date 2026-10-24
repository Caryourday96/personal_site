# Pair Play

Canonical URL: https://adeticket.com/pairplay

Browser-only memory game with 6, 8 or 12 pairs, elapsed time, move counts, replay, keyboard controls and local personal bests (fewest moves, then fastest time). No sign-in, server records or leaderboard. Original Adeticket PNG used unchanged for visible branding and favicon. Existing seven portfolio entries preserved; Pair Play added as entry eight and to sitemap.

Deployment: use the existing personal_site main-branch Azure workflow; no new hosting resources. Publication and live verification pending until recorded below.

Verification: node --test tests/pairplay.test.mjs tests/grouper.test.mjs; node --check sites/adeticket/pairplay/game.mjs.

Optional backlog: two-player turns and a daily seeded board; deliberately outside this initial release.
