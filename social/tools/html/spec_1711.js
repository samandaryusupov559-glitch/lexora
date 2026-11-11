window.SPEC = {
 "bpm": 110,
 "style": "play",
 "scenes": [
  {
   "type": "hook",
   "big": "Найди *ошибку* за 3 секунды",
   "sub": "2 уровня. Второй сложнее",
   "size": 128,
   "beats": 6.0
  },
  {
   "type": "count",
   "title": "Уровень 1",
   "sub": "Где ошибка?",
   "sentence": "She don't like coffee",
   "secs": 3,
   "label": "1/2",
   "beats": 6.0
  },
  {
   "type": "fix",
   "wrong": "She don't like coffee",
   "right": "She doesn't like coffee",
   "note": "He / she / it → *doesn't*",
   "label": "1/2",
   "beats": 9.5
  },
  {
   "type": "count",
   "title": "Уровень 2",
   "sub": "Где ошибка?",
   "sentence": "Does she likes coffee?",
   "secs": 3,
   "label": "2/2",
   "beats": 6.0
  },
  {
   "type": "fix",
   "wrong": "Does she likes coffee?",
   "right": "Does she like coffee?",
   "note": "После *does* глагол без *-s*",
   "label": "2/2",
   "beats": 8.0
  },
  {
   "type": "cta",
   "big": "Сколько нашёл: *0,* *1* *или* *2?*",
   "sub": "Напиши в комментариях",
   "icons": [
    [
     "comment",
     "Напиши",
     true
    ],
    [
     "send",
     "Проверь друга",
     true
    ]
   ],
   "size": 96,
   "beats": 10.0
  }
 ]
};
