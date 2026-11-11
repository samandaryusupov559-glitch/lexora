window.SPEC = { bpm: 120, style: "drive", scenes: [
 { type: "hook", beats: 5, big: "3 фразы, которые звучат *неправильно*", sub: "Третья — самая коварная", size: 116 },
 { type: "fix", beats: 8, label: "1/3", wrong: "I have 20 years", right: "I am 20 years old", note: "Возраст — с глаголом *to* *be*" },
 { type: "fix", beats: 8, label: "2/3", wrong: "He said me", right: "He told me", note: "Или: he said *to* me" },
 { type: "beat", beats: 2, big: "Третья — самая *коварная*" },
 { type: "fix", beats: 9, label: "3/3", wrong: "more better", right: "much better", note: "*Better* — уже сравнительная степень" },
 { type: "cta", beats: 7, big: "Какую говорил *ты?*", sub: "Напиши 1, 2 или 3", icons: [["comment", "Напиши", true], ["save", "Сохрани", true], ["send", "Отправь", false]] },
]};
