import sys; sys.path.insert(0, "/tmp/scripts")
from reel import *
cs = CountScene("Найди ошибку", "за 3 секунды", 3.0); cs.l2b = "I am agree with you"
S = [
 TextScene([{"t": "Найди *ошибку*", "s": 110, "w": "Black"}, {"t": "за 3 секунды", "s": 70, "w": "ExtraBold", "c": SOFT}], hold=0.6),
 cs,
 FixScene("I am agree with you", "I agree with you", ["Agree — уже глагол.", "«Am» здесь не нужен."], None),
 TextScene([{"t": "Нашёл за 3 секунды?", "s": 84, "w": "Black"}, {"t": "*Сохрани* и проверь друга", "s": 64, "w": "ExtraBold", "gap": 50, "delay": 0.4}], hold=1.2),
]
render(S, "/tmp/out/w1/reel_1011.mp4")
