# Lexora social media tools (social-media branch)

Not part of the site. Python/PIL + ffmpeg generators used for the Lexora Instagram plan.

- brand.py: colours (blue gradient, coral, yellow), Inter fonts, helpers
- reel.py: silent 9:16 reel engine (TextScene, CountScene, FixScene, render)
- r1.py, r2_6.py: example reel specs (week 1)
- feed_w1.py, post_1011*.py: example carousel/post renderers (1080x1350)

Fonts: /usr/share/fonts/opentype/inter/Inter-*.otf. Scripts expect to be copied to /tmp/scripts and output to /tmp/out.
Media is served to Metricool via raw.githubusercontent.com/<repo>/social-media/social/<week>/<file>.

## v2 (week 2 onwards): music and interactive reels

- music.py: original backing tracks and sound effects synthesized with numpy/scipy (no samples, no third-party music). Styles: pop, lofi, drive, play.
- reel2.py: reel engine v2 (animated background, word pops, beat-synced scenes, CountScene, FixScene, ChoiceScene, SwapScene, StampScene, TypeScene, CTAScene). `render(scenes, out, style=..., sheet=...)` also writes a contact sheet with safe-zone lines.
- w2_reels.py, feed_w2.py: week 2 (16-22 Nov) reels and feed items. w1_music.py: week 1 reels 12-15 Nov re-rendered with music.
- Run with OUT=<dir> CHK=<dir> python3 w2_reels.py 1611 ...; scripts import from their own folder.
