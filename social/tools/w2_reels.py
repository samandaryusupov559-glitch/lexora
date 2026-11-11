import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reel2 import *
OUT = os.environ.get("OUT", "/tmp/out") + "/w2/"; CHK = os.environ.get("CHK", "/tmp/chk") + "/"
B = lambda t, s=80, **k: dict(t=t, s=s, **k)
def hook(big, sub, s=104):
    return TextScene([B(big, s, w="Black", gap=56), B(sub, 54, w="Bold", c=SOFT)], instant=True, hold=1.2)
def item(label, big, sub=None, s=120, hold=0.6):
    bl = [B(big, s, w="Black", gap=50)]
    if sub: bl.append(B(sub, 56, w="Bold", c=SOFT, delay=0.2))
    return TextScene(bl, label=label, hold=hold)
def short(sc, dur): sc.dur = dur; return sc
R = {}
R["1611"] = ("drive", [
 hook("3 фразы, которые звучат *неправильно*", "Третья — самая коварная"),
 FixScene("I have 20 years", "I am 20 years old", ["Возраст — с глаголом *to* *be*"], label="1/3"),
 FixScene("He said me", "He told me", ["Или: he said *to* me"], label="2/3"),
 short(TextScene([B("Третья — самая *коварная*", 92, w="Black")], instant=True), 1.0),
 FixScene("more better", "much better", ["*Better* — уже сравнительная степень"], label="3/3"),
 CTAScene([B("Какую говорил *ты?*", 100, w="Black", gap=40), B("Напиши 1, 2 или 3", 60, w="ExtraBold", c=SOFT, delay=0.2)],
          [("comment", "Напиши", True), ("save", "Сохрани", True), ("send", "Отправь", False)]),
])
R["1711"] = ("play", [
 hook("Найди *ошибку* за 3 секунды", "2 уровня. Второй сложнее", 120),
 CountScene("Уровень 1", "Где ошибка?", "She don't like coffee", 3.0, label="1/2"),
 FixScene("She don't like coffee", "She doesn't like coffee", ["He / she / it → *doesn't*"], label="1/2", hold=0.6),
 CountScene("Уровень 2", "Где ошибка?", "Does she likes coffee?", 3.0, label="2/2"),
 FixScene("Does she likes coffee?", "Does she like coffee?", ["После *does* глагол без *-s*"], label="2/2", hold=0.6),
 CTAScene([B("Сколько нашёл: *0,* *1* *или* *2?*", 92, w="Black", gap=40), B("Напиши в комментариях", 58, w="ExtraBold", c=SOFT, delay=0.2)],
          [("comment", "Напиши", True), ("send", "Проверь друга", True)]),
])
R["1811"] = ("pop", [
 hook("IELTS Speaking: ответ из *одного* *слова* — это минус", "Формула из 3 шагов", 92),
 ChoiceScene("Do you like music?", "Yes.", "Yes, I do. It helps me relax.", 1, secs=2.4, hint="Какой ответ сильнее?", label="SPEAKING · PART 1", after=1.1),
 TextScene([B("1. *Ответ*", 110, w="Black", gap=50), B("Yes, I do.", 72, w="ExtraBold", delay=0.2)], label="1/3", hold=0.3),
 TextScene([B("2. *Причина*", 110, w="Black", gap=50), B("It helps me relax.", 72, w="ExtraBold", delay=0.2)], label="2/3", hold=0.3),
 TextScene([B("3. *Пример*", 110, w="Black", gap=50), B("I listen to music every evening.", 64, w="ExtraBold", delay=0.2)], label="3/3", hold=0.3),
 TextScene([B("Дай экзаменатору *2–3* *предложения*", 92, w="Black")], hold=0.5),
 CTAScene([B("Ответь по формуле:", 60, w="ExtraBold", c=SOFT, gap=36), B("*Do* *you* *like* *reading?*", 88, w="Black")],
          [("comment", "Напиши", True), ("save", "Сохрани", True)]),
])
R["1911"] = ("pop", [
 hook("Пишешь каждый день — преподаватель разбирает *каждую* *ошибку*", "Вот как это выглядит", 84),
 TypeScene("Yesterday I go to the park with my friend.", "go", "went", "yesterday → Past Simple: *went*", label="ПРИМЕР"),
 TextScene([B("Все исправления — в разделе *My* *mistakes*", 84, w="Black", gap=50), B("Перечитай их перед новой записью", 54, w="Bold", c=SOFT, delay=0.2)], label="В LEXORA", hold=0.6),
 CTAScene([B("*Первый* *урок* бесплатно", 100, w="Black", gap=40), B("Ссылка в профиле", 60, w="ExtraBold", c=SOFT, delay=0.2)],
          [("link", "Ссылка", True), ("send", "Отправь другу", False)]),
])
R["2011"] = ("pop", [
 hook("Хватит везде говорить *get*", "5 точных глаголов. Угадай раньше ответа", 124),
 SwapScene("*get* a letter", "*receive* a letter", "получить", label="1/5"),
 SwapScene("*get* tired", "*become* tired", "стать, становиться", label="2/5"),
 SwapScene("*get* home", "*arrive* home", "приехать, прибыть", label="3/5"),
 SwapScene("*get* a ticket", "*buy* a ticket", "купить", label="4/5"),
 SwapScene("I don't *get* it", "I don't *understand*", "понимать", label="5/5"),
 CTAScene([B("*Сохрани* для Writing", 100, w="Black", gap=40), B("Ещё 5 — в карусели в профиле", 52, w="ExtraBold", c=SOFT, delay=0.2)],
          [("save", "Сохрани", True), ("send", "Отправь", False)]),
])
R["2111"] = ("drive", [
 StampScene("", "Чтобы заговорить, нужно жить за границей", "МИФ", secs=2.0),
 TextScene([B("Нужна *практика*, а не другой адрес", 96, w="Black", gap=50), B("3 способа говорить, не уезжая", 56, w="Bold", c=SOFT, delay=0.2)], hold=0.5),
 item("1/3", "Говори *вслух*", "Опиши свой день за 2 минуты"),
 item("2/3", "Говори с *живым* *человеком*", "Преподаватель или партнёр по языку", s=100),
 item("3/3", "Повторяй за *носителями*", "Фраза за фразой, вслух", s=100),
 CTAScene([B("*Отправь* тому, кто ждёт переезда", 92, w="Black")],
          [("send", "Отправь", True), ("save", "Сохрани", True)]),
])
R["2211"] = ("pop", [
 hook("Преподаватель, твоя анкета в Lexora — за *5* *минут*", "Что нужно заполнить", 92),
 item("1/4", "*О* *себе*", "Образование и опыт"),
 item("2/4", "*Языки* и длительность урока", None, s=96),
 item("3/4", "Сертификаты и *достижения*", None, s=92),
 item("4/4", "*Отправь* заявку", "Владелец центра читает каждую заявку"),
 TextScene([B("Стартовый уровень — по твоему *опыту*", 88, w="Black")], hold=0.4),
 CTAScene([B("*Подай* *заявку*", 110, w="Black", gap=40), B("Ссылка в профиле", 60, w="ExtraBold", c=SOFT, delay=0.2)],
          [("link", "Ссылка", True), ("send", "Отправь коллеге", False)]),
])
if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True); os.makedirs(CHK, exist_ok=True)
    for i, k in enumerate(sys.argv[1:]):
        style, sc = R[k]
        render(sc, OUT + f"reel_{k}.mp4", style=style, seed=int(k), sheet=CHK + f"sheet_{k}.jpg")
