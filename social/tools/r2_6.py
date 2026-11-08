import sys; sys.path.insert(0, "/tmp/scripts")
from reel import *
B = lambda t, s=80, **k: dict(t=t, s=s, **k)
def item(label, big, sub=None, ex=None, hold=0.7):
    bl = [B(big, 150, w="Black", gap=50)]
    if sub: bl.append(B(sub, 56, w="Bold", c=SOFT, gap=50, delay=0.3))
    if ex: bl.append(B(ex, 70, w="ExtraBold", delay=0.3))
    return TextScene(bl, label=label, hold=hold)
R = {}
R["1111"] = [
 TextScene([B("3 слова, которые *тянут вниз* твой IELTS Writing", 90, w="Black", gap=50), B("Третье — самое незаметное", 54, w="Bold", c=SOFT, delay=0.2)]),
 item("1/3", "*very*", "Слабое усиление. Лучше:", "very important → *crucial*"),
 item("2/3", "*good*", "Слишком общее. Лучше:", "good method → *effective* method"),
 item("3/3", "*thing*", "Пусто. Лучше: factor, aspect", "important thing → *important factor*"),
 TextScene([B("Точные слова поднимают *Lexical Resource*", 84, w="Black", gap=50), B("Один из 4 критериев Writing", 54, w="Bold", c=SOFT, delay=0.3)]),
 TextScene([B("*Сохрани* перед экзаменом", 90, w="Black", gap=50), B("Отправь тому, кто готовится", 54, w="Bold", c=SOFT, delay=0.3)], hold=1.2),
]
R["1211"] = [
 TextScene([B("*Первый урок* бесплатно", 100, w="Black", gap=50), B("Что происходит дальше?", 64, w="Bold", c=SOFT, delay=0.3)]),
 item("1/4", "Оставляешь *заявку*", "Ссылка в профиле"),
 item("2/4", "Мы определяем *уровень*"),
 item("3/4", "Подбираем *преподавателя*"),
 item("4/4", "Урок в *Google Meet*", "Запуск одной кнопкой из Lexora"),
 TextScene([B("Попробуй *бесплатно*", 100, w="Black", gap=50), B("Ссылка в профиле", 64, w="ExtraBold", delay=0.3), B("Lexora · онлайн-школа языков", 48, w="Bold", c=SOFT, delay=0.3)], hold=1.4),
]
R["1311"] = [
 TextScene([B("Хватит говорить *«very good»*", 96, w="Black", gap=50), B("5 слов, которые звучат сильнее", 60, w="Bold", c=SOFT, delay=0.3)]),
 item("1/5", "*excellent*", "отличный"), item("2/5", "*outstanding*", "выдающийся"),
 item("3/5", "*remarkable*", "замечательный"), item("4/5", "*impressive*", "впечатляющий"),
 TextScene([B("Последнее — самое сильное", 60, w="Bold", c=SOFT, gap=60), B("*superb*", 150, w="Black", gap=40, delay=0.6), B("превосходный", 56, w="Bold", c=SOFT, delay=0.2)], label="5/5"),
 TextScene([B("*Сохрани* — пригодится в IELTS Speaking", 84, w="Black")], hold=1.4),
]
R["1411"] = [
 TextScene([B("Почему ты *забываешь* слова через день?", 92, w="Black")]),
 TextScene([B("Ты не глупый.", 90, w="Black", gap=40), B("*Мозг* так устроен.", 90, w="Black", delay=0.5)]),
 TextScene([B("Слово, которое ты увидел *один раз*, быстро стирается", 76, w="ExtraBold")]),
 TextScene([B("Решение — *повторение* с паузами", 90, w="Black")]),
 TextScene([B("Повтори через", 60, w="Bold", c=SOFT, gap=30), B("*1* день", 100, w="Black", gap=20, delay=0.2), B("*3* дня", 100, w="Black", gap=20, delay=0.2), B("*7* дней", 100, w="Black", delay=0.2)]),
 TextScene([B("Короткие повторения работают лучше одного длинного", 76, w="ExtraBold")]),
 TextScene([B("*Сохрани* график 1-3-7", 90, w="Black")], hold=1.4),
]
R["1511"] = [
 TextScene([B("Ты *преподаёшь* язык?", 100, w="Black", gap=50), B("Вот что даёт Lexora преподавателю", 60, w="Bold", c=SOFT, delay=0.3)]),
 item("1/4", "Свой *профиль*", "Опыт, языки, достижения"),
 item("2/4", "Свои *услуги*", "Ты сам решаешь, что предложить"),
 item("3/4", "Уроки в *Google Meet*", "Запуск одной кнопкой"),
 TextScene([B("Уровень растёт вместе с опытом и результатами учеников", 62, w="Bold", c=SOFT, gap=50), B("Starter → Rising → Skilled → Expert → *Master*", 64, w="Black", delay=0.4)], label="4/4"),
 TextScene([B("*Подай заявку*", 100, w="Black", gap=50), B("Ссылка в профиле", 64, w="ExtraBold", delay=0.3)], hold=1.4),
]
for k in sys.argv[1:]:
    render(R[k], f"/tmp/out/w1/reel_{k}.mp4")
