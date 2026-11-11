import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from brand import *
W, H = 1080, 1350
DARK = (20, 30, 90); CARD = (38, 66, 175); EDGE = (120, 150, 240); GREEN = (120, 232, 160)
O = os.environ.get("OUT", "/tmp/out") + "/w2/"; os.makedirs(O, exist_ok=True)
def base(tag, tagcol=YELLOW, tagfg=DARK, n=None, total=None):
    img = bg(W, H); d = ImageDraw.Draw(img)
    chip(d, (70, 90), tag, font("ExtraBold", 40), tagcol, tagfg); footer(d, W, H)
    if n: d.text((W - 70, H - 70), f"{n}/{total}", font=font("Bold", 36), fill=SOFT, anchor="rm")
    return img, d
def lines(d, x, y, text, f, col, maxw=940, lh=None):
    lh = lh or int(f.size * 1.2)
    for ln in wrap(d, text, f, maxw): d.text((x, y), ln, font=f, fill=col); y += lh
    return y
def fitf(d, text, w, size, maxw):
    while size > 36 and d.textlength(text, font=font(w, size)) > maxw: size -= 2
    return font(w, size)
def swipe(d): d.text((W - 70, 120), "→", font=font("Black", 70), fill=CORAL, anchor="rm")
def save(img, name): img.save(O + name, quality=92)
def cover(tag, title, sub, cta, name, n, total, ts=112, tagcol=CORAL, tagfg=WHITE):
    img, d = base(tag, tagcol, tagfg, n, total)
    y = lines(d, 70, 300, title, font("Black", ts), WHITE, 940, int(ts * 1.18))
    lines(d, 70, y + 40, sub, font("Bold", 54), SOFT, 940, 70)
    chip(d, (70, 1060), cta, font("ExtraBold", 44), YELLOW, DARK); swipe(d); save(img, name)
def final(tag, title, sub, name, n, total, ts=112):
    img, d = base(tag, YELLOW, DARK, n, total)
    y = lines(d, 70, 340, title, font("Black", ts), WHITE, 940, int(ts * 1.18))
    lines(d, 70, y + 40, sub, font("Bold", 52), SOFT, 940, 68); save(img, name)
def wrongright(tag, n, total, wrong, right, note, name, tags=("XATO", "TO'G'RI")):
    img, d = base(tag, CORAL, WHITE, n, total)
    for i, (txt, col, tg) in enumerate(((wrong, CORAL, tags[0]), (right, GREEN, tags[1]))):
        y = 250 + i * 330
        d.rounded_rectangle([70, y, W - 70, y + 290], radius=44, fill=CARD, outline=col, width=5)
        chip(d, (110, y + 36), tg, font("ExtraBold", 34), col, WHITE if i == 0 else DARK)
        f = fitf(d, txt, "Black", 84, 860); d.text((110, y + 185), txt, font=f, fill=WHITE if i else (255, 190, 200), anchor="lm")
        if i == 0:
            wl = d.textlength(txt, font=f); d.line([104, y + 190, 116 + wl, y + 190], fill=CORAL, width=8)
    lines(d, 70, 950, note, font("Bold", 50), WHITE, 940, 66); swipe(d); save(img, name)
def step(tag, n, total, num, title, sub, name, ex=None, ts=100):
    img, d = base(tag, CORAL, WHITE, n, total)
    d.ellipse([70, 250, 290, 470], fill=YELLOW); d.text((180, 364), str(num), font=font("Black", 140), fill=DARK, anchor="mm")
    y = lines(d, 70, 540, title, font("Black", ts), WHITE, 940, int(ts * 1.18))
    y = lines(d, 70, y + 20, sub, font("Bold", 50), SOFT, 940, 66)
    if ex:
        d.rounded_rectangle([70, y + 40, W - 70, y + 40 + 170], radius=40, fill=CARD, outline=EDGE, width=4)
        d.text((110, y + 125), ex, font=fitf(d, ex, "ExtraBold", 56, 860), fill=YELLOW, anchor="lm")
    swipe(d); save(img, name)
def vocab(tag, n, total, items, name):
    img, d = base(tag, CORAL, WHITE, n, total)
    y = 250 if len(items) > 1 else 360
    for w, m, ex in items:
        d.rounded_rectangle([70, y, W - 70, y + 440], radius=44, fill=CARD, outline=EDGE, width=4)
        d.text((110, y + 40), w, font=font("Black", 92), fill=YELLOW)
        yy = lines(d, 110, y + 160, m, font("ExtraBold", 46), WHITE, 860, 58)
        lines(d, 110, max(yy + 14, y + 290), ex, font("Medium", 42), SOFT, 860, 54)
        y += 480
    swipe(d); save(img, name)
def quiz(tag, q, a, b, hint, name, n, total):
    img, d = base(tag, YELLOW, DARK, n, total)
    y = lines(d, 70, 240, q, font("Black", 110), WHITE, 940, 130)
    for i, (letter, txt, col) in enumerate((("A", a, YELLOW), ("B", b, CORAL))):
        yy = 660 + i * 260
        d.rounded_rectangle([70, yy, W - 70, yy + 220], radius=44, fill=CARD, outline=EDGE, width=4)
        d.ellipse([110, yy + 60, 210, yy + 160], fill=col); d.text((160, yy + 110), letter, font=font("Black", 64), fill=DARK, anchor="mm")
        d.text((250, yy + 110), txt, font=fitf(d, txt, "ExtraBold", 60, 700), fill=WHITE, anchor="lm")
    d.text((70, 1190), hint, font=font("Bold", 44), fill=YELLOW); swipe(d); save(img, name)

# ---- 16.11 UZ carousel: 5 mistakes from Russian/Uzbek ----
T = "5 TA XATO"
cover(T, "Rus va o'zbek tilidan kelib chiqadigan 5 ta xato", "Nechtasini siz ham aytasiz?", "SURING", "c1611_1.jpg", 1, 7, ts=96)
M = [("I have 20 years", "I am 20 years old", "Ingliz tilida yosh «to be» bilan aytiladi, «have» bilan emas."),
     ("He said me", "He told me", "«Say»dan keyin shaxs to'g'ridan-to'g'ri kelmaydi: «told me» yoki «said to me»."),
     ("I feel myself good", "I feel good", "Kayfiyat yoki sog'liq haqida gapirganda «feel»dan keyin «myself» kerak emas."),
     ("I very like it", "I really like it", "«Very» fe'l oldidan kelmaydi. «Really» ishlating yoki «I like it very much» deng."),
     ("How do you call this?", "What do you call this?", "Narsaning nomini so'raganda «how» emas, «what» ishlatiladi.")]
for i, (w, r, nt) in enumerate(M): wrongright(f"{i + 1}/5 XATO", i + 2, 7, w, r, nt, f"c1611_{i + 2}.jpg")
final("SAQLANG", "Nechta xato sizniki edi?", "Izohda yozing. Saqlab qo'ying va ingliz tilini o'rganayotgan do'stingizga yuboring.", "c1611_7.jpg", 7, 7)

# ---- 17.11 RU post: less / fewer (answer on slide 2) ----
quiz("QUIZ", "Как правильно?", "less people", "fewer people", "Ответ — на следующем слайде", "p1711_1.jpg", 1, 2)
img, d = base("ОТВЕТ", YELLOW, DARK, 2, 2)
d.rounded_rectangle([70, 240, W - 70, 500], radius=44, fill=GREEN); d.text((110, 300), "B", font=font("Black", 60), fill=DARK, anchor="lm")
d.text((110, 410), "fewer people", font=font("Black", 104), fill=DARK, anchor="lm")
y = lines(d, 70, 570, "fewer + то, что можно посчитать", font("Black", 58), WHITE, 940, 72)
y = lines(d, 70, y + 6, "fewer people, fewer books", font("Bold", 50), YELLOW, 940, 64)
y = lines(d, 70, y + 40, "less + то, что нельзя посчитать", font("Black", 58), WHITE, 940, 72)
y = lines(d, 70, y + 6, "less time, less water", font("Bold", 50), YELLOW, 940, 64)
lines(d, 70, y + 44, "На экзамене и в письме — только fewer people.", font("Bold", 40), SOFT, 940, 54)
save(img, "p1711_2.jpg")

# ---- 18.11 RU carousel: Speaking Part 1 formula ----
T = "IELTS SPEAKING"
cover(T, "Part 1: формула ответа из 3 шагов", "Чтобы не отвечать одним словом", "СВАЙПАЙ", "c1811_1.jpg", 1, 6)
step(T, 2, 6, 1, "Прямой ответ", "Сначала ответь на сам вопрос. Вопрос: Do you like music?", "c1811_2.jpg", "Yes, I do.")
step(T, 3, 6, 2, "Причина", "Объясни почему. Одного предложения достаточно.", "c1811_3.jpg", "It helps me relax.")
step(T, 4, 6, 3, "Пример", "Добавь деталь из своей жизни.", "c1811_4.jpg", "I listen to music every evening.")
img, d = base(T, CORAL, WHITE, 5, 6)
y = lines(d, 70, 250, "Весь ответ", font("Black", 100), WHITE)
d.rounded_rectangle([70, y + 40, W - 70, y + 520], radius=44, fill=CARD, outline=EDGE, width=4)
yy = y + 90
for txt, col in (("Yes, I do.", WHITE), ("It helps me relax.", YELLOW), ("I listen to music every evening.", GREEN)):
    yy = lines(d, 110, yy, txt, font("ExtraBold", 58), col, 860, 74) + 26
lines(d, 70, y + 570, "2–3 предложения: экзаменатору есть что оценивать.", font("Bold", 48), SOFT, 940, 64); swipe(d); save(img, "c1811_5.jpg")
final("СОХРАНИ", "Ответ + причина + пример", "Сохрани формулу и отправь тому, кто готовится к IELTS.", "c1811_6.jpg", 6, 6, ts=104)

# ---- 19.11 UZ carousel: journal ----
T = "KUNDALIK"
cover(T, "Lexora'da kundalik qanday ishlaydi", "Yozasiz, o'qituvchi tekshiradi", "SURING", "c1911_1.jpg", 1, 6, ts=104)
step(T, 2, 6, 1, "Kuningiz haqida yozasiz", "Bir necha gap yetarli. Muhimi, muntazam yozish.", "c1911_2.jpg")
step(T, 3, 6, 2, "O'qituvchi tekshiradi", "Xatolar belgilanadi va to'g'ri varianti ko'rsatiladi.", "c1911_3.jpg", "I go → I went")
step(T, 4, 6, 3, "To'g'rilangan matnni ko'rasiz", "O'z gapingizning to'g'ri ko'rinishini o'qiysiz.", "c1911_4.jpg", ts=92)
step(T, 5, 6, 4, "Xatolaringiz bir joyda", "«My mistakes» bo'limida barcha tuzatishlar turlari bo'yicha saqlanadi. Yangi yozuvdan oldin o'qib chiqing.", "c1911_5.jpg")
final("BEPUL", "Birinchi dars bepul", "Havola profilda. Saqlab qo'ying va til o'rganayotgan do'stingizga yuboring.", "c1911_6.jpg", 6, 6)

# ---- 20.11 UZ carousel: 10 verbs instead of get ----
T = "«GET» O'RNIGA"
cover(T, "«Get» o'rniga 10 ta aniq fe'l", "Ma'nosi va misoli bilan", "SURING", "c2011_1.jpg", 1, 7)
V = [("receive", "olmoq (xat, xabar)", "I received your email."), ("obtain", "qo'lga kiritmoq (rasmiy)", "She obtained a visa."),
     ("become", "bo'lmoq, bo'lib qolmoq", "It became cold."), ("arrive", "yetib kelmoq", "We arrived at the airport."),
     ("buy", "sotib olmoq", "I bought a ticket."), ("understand", "tushunmoq", "I don't understand this rule."),
     ("bring", "olib kelmoq", "Can you bring me some water?"), ("earn", "ishlab topmoq", "He earns a good salary."),
     ("catch", "yuqtirmoq (kasallik)", "I caught a cold."), ("reach", "yetmoq, yetib bormoq", "We reached the top.")]
for i in range(5): vocab(T, i + 2, 7, V[i * 2:i * 2 + 2], f"c2011_{i + 2}.jpg")
final("SAQLANG", "10 ta fe'l: nutqingiz aniqroq", "Saqlab qo'ying va ingliz tilini o'rganayotgan do'stingizga yuboring.", "c2011_7.jpg", 7, 7, ts=104)

# ---- 21.11 UZ post: fear of speaking ----
img, d = base("BIRINCHI QADAM", YELLOW, DARK)
y = lines(d, 70, 260, "Gapirishdan qo'rqasizmi?", font("Black", 118), WHITE, 940, 138)
y = lines(d, 70, y + 50, "Xato qilish mashqning bir qismi.", font("ExtraBold", 62), YELLOW, 940, 78)
d.rounded_rectangle([70, y + 60, W - 70, y + 330], radius=44, fill=CARD, outline=EDGE, width=4)
lines(d, 110, y + 100, "Bugun 1 daqiqa ovoz chiqarib inglizcha gapiring: kuningiz haqida.", font("Bold", 50), WHITE, 860, 66)
save(img, "post_2111.jpg")

# ---- 22.11 RU carousel: false friends ----
T = "СЛОВАРЬ НЕДЕЛИ"
cover(T, "7 слов, которые значат не то, что кажется", "Ложные друзья переводчика", "СВАЙПАЙ", "c2211_1.jpg", 1, 6, ts=96)
F = [("actually", "на самом деле (не «актуально»)", "Actually, I prefer tea."), ("eventually", "в конце концов (не «возможно»)", "Eventually, we found the house."),
     ("accurate", "точный (не «аккуратный»)", "The numbers are accurate."), ("fabric", "ткань (не «фабрика»)", "This fabric is very soft."),
     ("magazine", "журнал (не «магазин»)", "I read it in a magazine."), ("sympathetic", "сочувствующий (не «симпатичный»)", "She was very sympathetic."),
     ("prospect", "перспектива (не «проспект»)", "The job prospects are good.")]
vocab(T, 2, 6, F[0:2], "c2211_2.jpg"); vocab(T, 3, 6, F[2:4], "c2211_3.jpg"); vocab(T, 4, 6, F[4:6], "c2211_4.jpg"); vocab(T, 5, 6, F[6:7], "c2211_5.jpg")
final("СОХРАНИ", "7 ложных друзей", "Сохрани и отправь тому, кто говорит «магазин» про magazine.", "c2211_6.jpg", 6, 6)
print("done")
