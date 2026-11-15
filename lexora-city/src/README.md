# Hoshimjon game: source

`../index.html` is BUILT from these files. Never edit it by hand.

- `data.js`: all content. `LEX` (word cards), `CHAPTERS`, `NPCS` (story dialogues), `TOPICS` (extra dialogues).
- `game.js`: the engine (Three.js scene, dialogue, catalog, adaptive difficulty). `live.js`: the online city (other players, chat, feedback); build.py inlines it into game.js at `/*__LIVE__*/`.
- `template.html`: page shell and CSS.
- `check.js`: validates data.js. Must print `bad: 0`.

Build and check (run inside this folder):

    node check.js && node --check game.js && python3 build.py ../index.html

## Adding a new weekly topic (the only thing the weekly task does)

Append ONE object to the list of ONE npc inside `TOPICS` in data.js. NPC ids: farid, maya, elena, keeper, leo.
Players see a topic after finishing that NPC's chapter (Leo: after his first talk), one new topic per visit, in list order,
so always APPEND to the end of a list. Never reorder or delete old topics.

    { id: 'maya-menu', tree: {
      n1: { say: "Today we have {soup of the day}. What would you like?", uz: "Uzbekcha tarjima.",
        choices: [
          { t: "I would like the soup, please.", uz: "Uzbekcha.", ok: true, next: 'n2' },       // exactly one correct way through
          { t: "I want soup me.", uz: "Uzbekcha.", ok: false, why: "Uzbek tilida qisqa grammatik izoh." }
        ] },
      n2: { say: "...", uz: "...", choices: [ { t: "...", uz: "...", ok: true, next: 'END' } ] }
    } }

Rules:
- 1 to 3 nodes, start node is `n1`, the last correct choice has `next: 'END'`, others point to an existing node.
- Every node has 2 or 3 choices, exactly one `ok: true`, each wrong choice has a `why` (Uzbek, short, names the rule).
- Dialogue is A1 to A2 English, one idea per line. Words to learn are marked `{like this}` inside `say` (2 to 4 per topic).
- Each marked word needs an entry in `LEX`: `{ uz: "tarjima", g: "Uzbek grammar/usage note", ex: "example sentence that contains the key exactly" }`.
  Do not reuse an existing LEX key. No braces inside choices.
- Do not change the story chapters, the engine, models or any file outside this folder.


## Dunyo (world.js, world1.js)
- `world1.js`: katta binolar (daraxtlardan oldin kiradi). `world.js`: mashinalar, qushlar, shahar aholisi (`RES`). Ikkalasi `build.py` orqali `game.js` ichiga qo'shiladi.
- Aholi `LANES` bo'ylab yuradi, juftlashib uchrashadi va `CHAT[til]` dan suhbat qiladi. Yangi suhbat qo'shish: `CHAT` ga qator qo'shing (4 ta gap), `CHAT_UZ` ga tarjima.
- Yangi aholi qo'shish: `RES_NAMES` ga ism, `LANES` sonini oshiring.


## Til paketlari (packs.js)
- Ingliz tilidan boshqa 7 til (Russian, German, Turkish, Spanish, Korean, Chinese, Japanese) uchun NPC darslari. Stsenariy `SCEN` da bir xil, har til faqat o'z matnini beradi (`defPack`).
- Til `LX.lang` (Lexora) yoki ochiq sahifadagi tanlovdan olinadi; `usePack(til)` lug'at, NPC daraxtlari va idle matnlarini almashtiradi. Saqlangan so'zlar til bo'yicha alohida kalitda turadi.
- Yangi til: `defPack('Til', 'xx-XX', kalitlar[14], ui, k => ({ nodes: [10 ta [gap, to'g'ri, xato1, xato2]], idle: [4 ta [gap, javob]] }))`. Yangi mavzular (haftalik) hozircha faqat inglizcha `TOPICS` ga qo'shiladi.
- Matnlar tilshunos tomonidan tekshirilmagan: ustoz ko'rib chiqishi kerak.
- Build: `node check.js && python3 build.py ../index.html` (packs.js va world*.js avtomatik qo'shiladi).
