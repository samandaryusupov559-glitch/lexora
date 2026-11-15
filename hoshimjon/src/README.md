# Hoshimjon game: source

`../index.html` is BUILT from these files. Never edit it by hand.

- `data.js`: all content. `LEX` (word cards), `CHAPTERS`, `NPCS` (story dialogues), `TOPICS` (extra dialogues).
- `game.js`: the engine (Three.js scene, dialogue, catalog, adaptive difficulty).
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
