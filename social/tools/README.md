# Lexora social media tools (social-media branch)

Not part of the site. Python/PIL + ffmpeg generators used for the Lexora Instagram plan.

- brand.py: colours (blue gradient, coral, yellow), Inter fonts, helpers
- reel.py: silent 9:16 reel engine (TextScene, CountScene, FixScene, render)
- r1.py, r2_6.py: example reel specs (week 1)
- feed_w1.py, post_1011*.py: example carousel/post renderers (1080x1350)

Fonts: /usr/share/fonts/opentype/inter/Inter-*.otf. Scripts expect to be copied to /tmp/scripts and output to /tmp/out.
Media is served to Metricool via raw.githubusercontent.com/<repo>/social-media/social/<week>/<file>.
