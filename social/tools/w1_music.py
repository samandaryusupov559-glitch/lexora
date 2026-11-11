"""Re-render the still-unpublished week 1 reels (12-15 Nov) with the v2 engine: music, sound effects, animated background."""
import sys, os; HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
src = open(os.path.join(HERE, "r2_6.py")).read().replace("from reel import *", "from reel2 import *").split("for k in sys.argv[1:]")[0]
exec(src)
OUT = os.environ.get("OUT", "/tmp/out") + "/w1m/"; CHK = os.environ.get("CHK", "/tmp/chk") + "/"; os.makedirs(OUT, exist_ok=True)
STYLE = {"1211": "pop", "1311": "play", "1411": "lofi", "1511": "drive"}
for k in sys.argv[1:]:
    sc = R[k]
    for w in sc[0].words: w["t0"] = -2.0
    sc[0].instant = True
    sc[-1] = CTAScene([dict(t=w_, s=s_, w="Black") for w_, s_ in [({"1211": "Попробуй *бесплатно*", "1311": "*Сохрани* для IELTS Speaking", "1411": "*Сохрани* график 1-3-7", "1511": "*Подай* *заявку*"}[k], 96)]],
                      {"1211": [("link", "Ссылка в профиле", True)], "1311": [("save", "Сохрани", True), ("send", "Отправь", False)],
                       "1411": [("save", "Сохрани", True), ("send", "Отправь", False)], "1511": [("link", "Ссылка в профиле", True)]}[k])
    render(sc, OUT + f"reel_{k}_m.mp4", style=STYLE[k], seed=int(k), sheet=CHK + f"sheet_w1_{k}.jpg")
