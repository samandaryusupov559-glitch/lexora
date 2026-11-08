import sys; sys.path.insert(0, "/tmp/scripts")
from brand import *
W, H = 1080, 1350
DARK = (20, 30, 90); CARD = (38, 66, 175); EDGE = (120, 150, 240)
def base(tag, tagcol=YELLOW, tagfg=DARK, n=None, total=None):
    img = bg(W, H); d = ImageDraw.Draw(img)
    chip(d, (70, 90), tag, font("ExtraBold", 40), tagcol, tagfg)
    footer(d, W, H)
    if n:
        d.text((W - 70, H - 70), f"{n}/{total}", font=font("Bold", 36), fill=SOFT, anchor="rm")
    return img, d
def lines(d, x, y, text, f, col, maxw=940, lh=None):
    lh = lh or int(f.size * 1.2)
    for ln in wrap(d, text, f, maxw):
        d.text((x, y), ln, font=f, fill=col); y += lh
    return y
def arrow(d):
    d.ellipse([W - 190, H - 190, W - 70, H - 70 - 0], fill=CORAL) if False else None
def swipe(d): d.text((W - 70, 120), "→", font=font("Black", 70), fill=CORAL, anchor="rm")
def step_slide(n, total, num, title, sub, out):
    img, d = base("1 → 4 qadam" if False else "ПРОБНЫЙ УРОК", n=n, total=total)
    d.ellipse([70, 330, 330, 590], fill=YELLOW); d.text((200, 465), str(num), font=font("Black", 170), fill=DARK, anchor="mm")
    y = lines(d, 70, 680, title, font("Black", 104), WHITE, 940, 122)
    if sub: lines(d, 70, y + 20, sub, font("Bold", 54), SOFT, 940, 70)
    swipe(d); img.save(out, quality=92)
def save(img, out): img.save(out, quality=92)
O = "/tmp/out/w1/"
# 12.11 RU carousel
img, d = base("ПРОБНЫЙ УРОК", CORAL, WHITE, 1, 6)
y = lines(d, 70, 330, "Как проходит бесплатный урок", font("Black", 118), WHITE, 940, 140)
lines(d, 70, y + 40, "4 шага от заявки до первого занятия", font("Bold", 56), SOFT, 940, 72)
chip(d, (70, 1040), "СВАЙПАЙ", font("ExtraBold", 44), YELLOW, DARK); swipe(d); save(img, O + "c1211_1.jpg")
step_slide(2, 6, 1, "Оставляешь заявку", "Ссылка в профиле.", O + "c1211_2.jpg")
step_slide(3, 6, 2, "Мы определяем уровень", "Чтобы урок не был ни слишком лёгким, ни слишком сложным.", O + "c1211_3.jpg")
step_slide(4, 6, 3, "Подбираем преподавателя", "Из преподавателей Lexora, под твой язык и цель.", O + "c1211_4.jpg")
step_slide(5, 6, 4, "Урок в Google Meet", "Входишь одной кнопкой из Lexora.", O + "c1211_5.jpg")
img, d = base("БЕСПЛАТНО", YELLOW, DARK, 6, 6)
y = lines(d, 70, 360, "Первый урок бесплатно", font("Black", 128), WHITE, 940, 150)
y = lines(d, 70, y + 30, "Ссылка в профиле", font("ExtraBold", 66), YELLOW, 940, 80)
lines(d, 70, y + 40, "Сохрани и отправь тому, кто хочет выучить язык", font("Bold", 48), SOFT, 940, 62); save(img, O + "c1211_6.jpg")
# 14.11 UZ post
img, d = base("TAKRORLASH", YELLOW, DARK)
y = lines(d, 70, 230, "So'zni 1 marta emas, bir necha kunda takrorlang", font("Black", 96), WHITE, 940, 114)
for i, (a, b) in enumerate((("1", "kun"), ("3", "kun"), ("7", "kun"))):
    x = 70 + i * 315
    d.rounded_rectangle([x, 800, x + 290, 1040], radius=40, fill=CARD, outline=EDGE, width=4)
    d.text((x + 145, 905), a, font=font("Black", 130), fill=YELLOW, anchor="mm"); d.text((x + 145, 995), b + "dan keyin", font=font("Bold", 34), fill=WHITE, anchor="mm")
d.text((70, 1110), "Har takrorlash 5 daqiqa. Saqlab qo'ying.", font=font("Bold", 44), fill=YELLOW)
save(img, O + "post_1411.jpg")
# 15.11 UZ vocab carousel
img, d = base("HAFTA LUG'ATI", CORAL, WHITE, 1, 6)
y = lines(d, 70, 330, "IELTS Writing uchun 7 ta so'z", font("Black", 118), WHITE, 940, 140)
lines(d, 70, y + 40, "Ma'nosi va misoli bilan", font("Bold", 56), SOFT, 940, 72)
chip(d, (70, 1040), "SURING", font("ExtraBold", 44), YELLOW, DARK); swipe(d); save(img, O + "c1511_1.jpg")
def vocab(n, items, out):
    img, d = base("HAFTA LUG'ATI", CORAL, WHITE, n, 6)
    y = 270 if len(items) > 1 else 380
    for w, m, ex in items:
        d.rounded_rectangle([70, y, W - 70, y + (430 if len(items) > 1 else 620)], radius=44, fill=CARD, outline=EDGE, width=4)
        d.text((110, y + 40), w, font=font("Black", 96 if len(items) > 1 else 120), fill=YELLOW)
        sz = 96 if len(items) > 1 else 120
        d.text((110, y + 40 + int(sz * 1.25)), m, font=font("ExtraBold", 50), fill=WHITE)
        lines(d, 110, y + 40 + int(sz * 1.25) + 80, ex, font("Medium", 42), SOFT, 860, 54)
        y += 470
    swipe(d); save(img, out)
V = [("beneficial", "foydali", "Regular reading is beneficial."), ("crucial", "hal qiluvchi, juda muhim", "Sleep is crucial for memory."),
     ("factor", "omil", "Cost is a key factor."), ("aspect", "jihat", "Consider every aspect of the problem."),
     ("significant", "sezilarli", "There was a significant increase."), ("contribute", "hissa qo'shmoq", "Exercise contributes to health."),
     ("highlight", "ta'kidlab ko'rsatmoq", "The report highlights three issues.")]
vocab(2, V[0:2], O + "c1511_2.jpg"); vocab(3, V[2:4], O + "c1511_3.jpg"); vocab(4, V[4:6], O + "c1511_4.jpg"); vocab(5, V[6:7], O + "c1511_5.jpg")
img, d = base("SAQLANG", YELLOW, DARK, 6, 6)
y = lines(d, 70, 360, "7 ta so'z: Writing balli uchun", font("Black", 118), WHITE, 940, 140)
lines(d, 70, y + 40, "Saqlab qo'ying va IELTS'ga tayyorlanayotgan do'stingizga yuboring", font("Bold", 52), SOFT, 940, 68); save(img, O + "c1511_6.jpg")
print("done")
