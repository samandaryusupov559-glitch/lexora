import sys; sys.path.insert(0, "/tmp/scripts")
from brand import *
W, H = 1080, 1350
img = bg(W, H); d = ImageDraw.Draw(img)
chip(d, (70, 90), "QUIZ", font("ExtraBold", 40), YELLOW, (20, 30, 90))
y = 230
for ln in ["Qaysi gap", "to'g'ri?"]:
    d.text((70, y), ln, font=font("Black", 130), fill=WHITE); y += 150
def card(y, letter, text, col):
    d.rounded_rectangle([70, y, W - 70, y + 230], radius=44, fill=(38, 66, 175), outline=(120, 150, 240), width=4)
    d.ellipse([110, y + 65, 210, y + 165], fill=col)
    d.text((160, y + 115), letter, font=font("Black", 64), fill=(20, 30, 90), anchor="mm")
    d.text((250, y + 115), text, font=font("ExtraBold", 54), fill=WHITE, anchor="lm")
card(640, "A", "I agree with you", YELLOW)
card(910, "B", "I am agree with you", CORAL)
d.text((70, 1195), "Javobingizni izohda yozing", font=font("Bold", 44), fill=YELLOW)
footer(d, W, H)
img.save("/tmp/out/w1/post_1011.jpg", quality=92)
print("ok")
