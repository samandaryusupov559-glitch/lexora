import sys; sys.path.insert(0, "/tmp/scripts")
from brand import *
W, H = 1080, 1350
img = bg(W, H); d = ImageDraw.Draw(img)
chip(d, (70, 90), "JAVOB", font("ExtraBold", 40), CORAL, WHITE)
d.ellipse([70, 240, 270, 440], fill=YELLOW)
d.text((170, 345), "A", font=font("Black", 140), fill=(20, 30, 90), anchor="mm")
d.text((70, 500), "I agree with you", font=font("Black", 96), fill=WHITE)
y = 660
for ln in ["\"Agree\" o'zi fe'l.", "Oldiga \"am\" qo'yilmaydi."]:
    d.text((70, y), ln, font=font("Bold", 56), fill=SOFT); y += 82
d.rounded_rectangle([70, 880, W - 70, 1090], radius=44, fill=(38, 66, 175), outline=(120, 150, 240), width=4)
d.text((110, 925), "Xuddi shunday:", font=font("SemiBold", 40), fill=YELLOW)
d.text((110, 995), "I know · I like · I want", font=font("ExtraBold", 54), fill=WHITE)
d.text((70, 1160), "Saqlab qo'ying va do'stingizga yuboring", font=font("Bold", 40), fill=YELLOW)
footer(d, W, H)
img.save("/tmp/out/w1/post_1011_b.jpg", quality=92)
