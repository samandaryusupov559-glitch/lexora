"""Writes spec_<ddmm>.js for the HTML engine. d = scene length in seconds (snapped up to half beats)."""
import json, math, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, "..", "scripts")); sys.path.insert(0, os.path.join(HERE, ".."))
import music
nw = lambda *t: sum(len(x.replace("*", "").split()) for x in t if x)
def hook(big, sub, size=112): return dict(type="hook", big=big, sub=sub, size=size, d=nw(big, sub) / 3.6 + 0.6)
def T(big, sub=None, label=None, size=120, ex=None, **k): return dict(type="text", big=big, sub=sub, ex=ex, label=label, size=size, d=max(1.7, nw(big, sub, ex) / 2.5 + 0.7), **k)
def fix(wrong, right, note, label): return dict(type="fix", wrong=wrong, right=right, note=note, label=label, d=2.6 + max(1.0, nw(note) / 3))
def count(title, sentence, label): return dict(type="count", title=title, sub="Где ошибка?", sentence=sentence, secs=3, label=label, d=3.15)
def swap(old, new, tr, label): return dict(type="swap", old=old, new=new, tr=tr, label=label, d=2.4)
def cta(big, sub, icons, size=104): return dict(type="cta", big=big, sub=sub, icons=icons, size=size, d=max(3.0, nw(big, sub) / 2.5 + 1.6))
def beat(big): return dict(type="beat", big=big, d=1.0)
SAVE, SEND, COM, LINK = ["save", "Сохрани", True], ["send", "Отправь", False], ["comment", "Напиши", True], ["link", "Ссылка", True]
R = {
 "1111": ("drive", [hook("3 слова, которые *тянут* *вниз* твой IELTS Writing", "Третье — самое незаметное", 104),
    dict(swap("*very* important", "*crucial*", "Слабое усиление", "1/3"), d=2.9), dict(swap("*good* method", "*effective* method", "Слишком общее слово", "2/3"), d=2.9),
    dict(swap("important *thing*", "important *factor*", "Пустое слово. Ещё вариант: aspect", "3/3"), d=3.2),
    T("Точные слова поднимают *Lexical* *Resource*", "Один из 4 критериев Writing", None, 100), cta("*Сохрани* перед экзаменом", "Отправь тому, кто готовится", [SAVE, ["send", "Отправь", True]])]),
 "1211": ("pop", [hook("*Первый* *урок* бесплатно", "Что происходит дальше?", 128), T("Оставляешь *заявку*", "Ссылка в профиле", "1/4"), T("Мы определяем *уровень*", None, "2/4"),
    T("Подбираем *преподавателя*", None, "3/4"), T("Урок в *Google* *Meet*", "Запуск одной кнопкой из Lexora", "4/4"), cta("Попробуй *бесплатно*", "Ссылка в профиле", [LINK, ["send", "Отправь другу", False]])]),
 "1311": ("play", [hook("Хватит говорить *«very* *good»*", "5 слов, которые звучат сильнее", 116), T("*excellent*", "отличный", "1/5", 150), T("*outstanding*", "выдающийся", "2/5", 150),
    T("*remarkable*", "замечательный", "3/5", 150), T("*impressive*", "впечатляющий", "4/5", 150), beat("Последнее — самое *сильное*"), T("*superb*", "превосходный", "5/5", 170),
    cta("*Сохрани* для IELTS Speaking", None, [SAVE, SEND])]),
 "1411": ("lofi", [hook("Почему ты *забываешь* слова через день?", "И что с этим делать", 104), T("Ты не глупый. *Мозг* так устроен.", None, None, 100),
    T("Слово, которое ты увидел *один* *раз*, быстро стирается", None, None, 84), T("Решение — *повторение* с паузами", None, None, 104),
    T("*1* — *3* — *7*", "Повтори через 1 день, 3 дня и 7 дней", None, 170), cta("*Сохрани* график 1-3-7", None, [SAVE, SEND])]),
 "1511": ("drive", [hook("Ты *преподаёшь* язык?", "Вот что даёт Lexora преподавателю", 128), T("Свой *профиль*", "Опыт, языки, достижения", "1/4"), T("Свои *услуги*", "Ты сам решаешь, что предложить", "2/4"),
    T("Уроки в *Google* *Meet*", "Запуск одной кнопкой", "3/4"), T("Starter → Rising → Skilled → Expert → *Master*", "Уровень растёт с опытом и результатами учеников", "4/4", 76),
    cta("*Подай* *заявку*", "Ссылка в профиле", [LINK, ["send", "Отправь коллеге", False]], 116)]),
 "1711": ("play", [hook("Найди *ошибку* за 3 секунды", "2 уровня. Второй сложнее", 128), count("Уровень 1", "She don't like coffee", "1/2"), fix("She don't like coffee", "She doesn't like coffee", "He / she / it → *doesn't*", "1/2"),
    count("Уровень 2", "Does she likes coffee?", "2/2"), fix("Does she likes coffee?", "Does she like coffee?", "После *does* глагол без *-s*", "2/2"),
    cta("Сколько нашёл: *0,* *1* *или* *2?*", "Напиши в комментариях", [COM, ["send", "Проверь друга", True]], 96)]),
 "1811": ("pop", [hook("IELTS Speaking: ответ из *одного* *слова* — это минус", "Формула из 3 шагов", 96),
    dict(type="choice", q="Do you like music?", a="Yes.", b="Yes, I do. It helps me relax.", correct=1, secs=2.4, hint="Какой ответ сильнее?", label="SPEAKING · PART 1", d=3.3),
    T("1. *Ответ*", None, "1/3", 124, ex="Yes, I do."), T("2. *Причина*", None, "2/3", 124, ex="It helps me relax."), T("3. *Пример*", None, "3/3", 124, ex="I listen to music every evening.", exSize=68),
    T("Дай экзаменатору *2–3* *предложения*", None, None, 100), cta("*Do* *you* *like* *reading?*", "Ответь в комментариях", [COM, SAVE], 96)]),
 "1911": ("pop", [hook("Пишешь каждый день — преподаватель разбирает *каждую* *ошибку*", "Вот как это выглядит", 88),
    dict(type="type", text="Yesterday I go to the park with my friend.", wrong="go", right="went", note="yesterday → Past Simple: *went*", label="ПРИМЕР", d=7.0),
    T("Все исправления — в разделе *My* *mistakes*", "Перечитай их перед новой записью", "В LEXORA", 92), cta("*Первый* *урок* бесплатно", "Ссылка в профиле", [LINK, ["send", "Отправь другу", False]])]),
 "2011": ("pop", [hook("Хватит везде говорить *get*", "5 точных глаголов. Угадай раньше ответа", 128), swap("*get* a letter", "*receive* a letter", "получить", "1/5"), swap("*get* tired", "*become* tired", "стать, становиться", "2/5"),
    swap("*get* home", "*arrive* home", "приехать, прибыть", "3/5"), swap("*get* a ticket", "*buy* a ticket", "купить", "4/5"), swap("I don't *get* it", "I don't *understand*", "понимать", "5/5"),
    cta("*Сохрани* для Writing", "Ещё 5 — в карусели в профиле", [SAVE, SEND])]),
 "2111": ("drive", [dict(type="stamp", statement="Чтобы заговорить, нужно жить за границей", stamp="МИФ", secs=2.0, d=3.3), T("Нужна *практика*, а не другой адрес", "3 способа говорить, не уезжая", None, 104),
    T("Говори *вслух*", "Опиши свой день за 2 минуты", "1/3"), T("Говори с *живым* *человеком*", "Преподаватель или партнёр по языку", "2/3", 104), T("Повторяй за *носителями*", "Фраза за фразой, вслух", "3/3", 104),
    cta("*Отправь* тому, кто ждёт переезда", None, [["send", "Отправь", True], SAVE], 96)]),
 "2211": ("pop", [hook("Преподаватель, твоя анкета в Lexora — за *5* *минут*", "Что нужно заполнить", 96), T("*О* *себе*", "Образование и опыт", "1/4", 130), T("*Языки* и длительность урока", None, "2/4", 100),
    T("Сертификаты и *достижения*", None, "3/4", 96), T("*Отправь* заявку", "Владелец центра читает каждую заявку", "4/4"), T("Стартовый уровень — по твоему *опыту*", None, None, 96),
    cta("*Подай* *заявку*", "Ссылка в профиле", [LINK, ["send", "Отправь коллеге", False]], 116)]),
}
for k, (style, sc) in R.items():
    bpm = music.STYLES[style]["bpm"]; beat = 60 / bpm
    for s in sc: s["beats"] = math.ceil(s.pop("d") / (beat / 2) - 1e-6) / 2
    open(os.path.join(HERE, f"spec_{k}.js"), "w").write("window.SPEC = " + json.dumps(dict(bpm=bpm, style=style, scenes=sc), ensure_ascii=False, indent=1) + ";\n")
    print(k, style, round(sum(s["beats"] for s in sc) * beat, 1), "s")
