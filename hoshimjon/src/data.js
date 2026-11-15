/* ---------- Lug'at: {kalit} bilan belgilangan so'z va iboralar ---------- */
const LEX = {
  'Good morning': { uz: "Xayrli tong", g: "Salomlashish: Good morning (ertalab), Good afternoon (tushdan keyin), Good evening (kechqurun).", ex: "Good morning, teacher!" },
  'Good evening': { uz: "Xayrli kech", g: "Kechqurun salomlashish va xayrlashish uchun. Yotishdan oldin esa Good night deyiladi.", ex: "Good evening, everyone." },
  'get': { uz: "olib bermoq, bermoq", g: "'What can I get you?' xizmat ko'rsatuvchining odatiy savoli: Sizga nima olib beray?", ex: "What can I get you?" },
  'How many': { uz: "nechta (sanaladigan otlar uchun)", g: "How many + ko'plikdagi ot: How many books? Sanalmaydigan otlar uchun How much ishlatiladi.", ex: "How many loaves would you like?" },
  'loaves': { uz: "nonlar (loaf - bitta non)", g: "Tartibsiz ko'plik: loaf → loaves (f harfi ves ga almashadi).", ex: "Two loaves of bread, please." },
  'whole grain': { uz: "to'liq donli (butun donli non)", g: "Ikki so'zli sifat: whole grain bread. Artikl kerak emas.", ex: "I prefer whole grain bread." },
  'three dollars': { uz: "uch dollar", g: "Pul miqdori: son + dollars (ko'plikda -s). Bitta bo'lsa one dollar.", ex: "That's three dollars." },
  'in total': { uz: "jami, hammasi bo'lib", g: "Hisob-kitobda ishlatiladi: That's six dollars in total.", ex: "That's six dollars in total." },
  'anything else': { uz: "yana biror narsa", g: "Savol gapda anything (some emas): Would you like anything else?", ex: "Would you like anything else?" },
  'Have a nice day': { uz: "Kuningiz yaxshi o'tsin", g: "Xayrlashish iborasi. Javob: You too! (Sizga ham!)", ex: "Have a nice day, Anna!" },
  'Come back': { uz: "qaytib keling", g: "come back - qaytib kelmoq (phrasal verb). Buyruq shaklida fe'l boshlanadi.", ex: "Come back soon!" },
  'sell': { uz: "sotmoq", g: "sell - sold - sold (tartibsiz fe'l). Teskarisi: buy.", ex: "They sell fresh milk here." },

  'looking for': { uz: "izlayapman, izlayapsiz", g: "look for + ot: izlamoq. look - qaramoq, look for - izlamoq. Hozirgi davom zamonida: am/is/are looking for.", ex: "I am looking for a new phone." },
  'job': { uz: "ish, ish o'rni", g: "job - aniq ish o'rni (sanaladi: a job). work - ish jarayoni (sanalmaydi).", ex: "He has a good job." },
  'Nice to meet you': { uz: "Tanishganimdan xursandman", g: "Birinchi uchrashuvda aytiladi. Javob: Nice to meet you too.", ex: "Nice to meet you, Anna!" },
  'Where are you from': { uz: "Siz qayerdansiz?", g: "from - qayerdan. Javob: I am from + mamlakat/shahar.", ex: "Where are you from, Ali?" },
  'experience': { uz: "tajriba", g: "Sanalmaydigan ot: I have experience. (an experience emas.)", ex: "I have no experience." },
  'wash dishes': { uz: "idish-tovoq yuvmoq", g: "wash the dishes yoki do the dishes ham deyiladi. can dan keyin fe'l asosiy shaklda: I can wash dishes.", ex: "I wash dishes every evening." },
  'clean tables': { uz: "stollarni tozalamoq", g: "Fe'l + ko'plikdagi ot: clean tables (aniq stollar bo'lsa the tables).", ex: "Please clean tables after lunch." },
  'When': { uz: "qachon", g: "Vaqt haqida savol so'zi. Javob: at eight, tomorrow, on Monday.", ex: "When can we meet?" },
  "eight o'clock": { uz: "soat sakkiz", g: "o'clock - aniq soat (yarim yoki chorak bo'lmaganda): at eight o'clock.", ex: "The shop opens at eight o'clock." },
  'Welcome to the team': { uz: "Jamoaga xush kelibsiz", g: "Yangi xodimni kutib olish iborasi.", ex: "Welcome to the team, everyone!" },
  'per hour': { uz: "soatiga", g: "per + vaqt birligi: per hour, per day, per week.", ex: "He drives sixty kilometers per hour." },
  'tomorrow': { uz: "ertaga", g: "Kelasi vaqt ko'rsatkichi: I will call you tomorrow. Aytilishi: See you tomorrow!", ex: "I will call you tomorrow." },
  'busy': { uz: "band", g: "be + busy: I am busy. Teskarisi: free (bo'sh).", ex: "I am busy today." },

  'reservation': { uz: "bron qilish, band qilingan joy", g: "Mehmonxonada: Do you have a reservation? Bron qilganmisiz?", ex: "I have a reservation for two." },
  'single room': { uz: "bir kishilik xona", g: "double room - ikki kishilik xona. Sifat + ot birikmasi.", ex: "I need a single room for two nights." },
  'per night': { uz: "kechasiga", g: "per + vaqt birligi: narxni bildiradi (per night, per week).", ex: "The room is fifty dollars per night." },
  'How would you like to pay': { uz: "Qanday to'lamoqchisiz?", g: "How would you like...? muloyim so'rov. Javob: I'll pay in cash / by card.", ex: "How would you like to pay, cash or card?" },
  'passport': { uz: "pasport", g: "Hujjat so'ralganda: Could I see your passport, please?", ex: "Please show your passport." },
  'check out': { uz: "mehmonxonadan hisob-kitob qilib chiqmoq", g: "Phrasal verb: check in - kirish, check out - chiqish. Ot sifatida: checkout.", ex: "We check out at noon." },
  'Here is your key': { uz: "Mana kalitingiz", g: "Biror narsa uzatayotganda: Here is / Here are + ot.", ex: "Here is your key, sir." },
  'third floor': { uz: "uchinchi qavat", g: "Tartib son: first, second, third, fourth. Oldidan the va on: on the third floor.", ex: "My office is on the third floor." },
  'Enjoy your stay': { uz: "Dam olishingiz yoqimli bo'lsin", g: "Mehmonxonada xayrlashish iborasi. stay - turib qolish, mehmon bo'lish.", ex: "Enjoy your stay in London!" },
  'open': { uz: "ochiq", g: "Teskarisi: closed (yopiq). be + open.", ex: "The shop is open now." },

  'Have fun': { uz: "Maza qiling", g: "Xayrlashish yoki yaxshi tilak iborasi. Have a nice day ga yaqin.", ex: "Have fun at the party!" },
  'cool': { uz: "zo'r, ajoyib", g: "So'zlashuv tilida maqtov: That's so cool! Asl ma'nosi - salqin.", ex: "Your shoes are so cool!" },
  'traveler': { uz: "sayyoh, sayohatchi", g: "Fe'ldan yasalgan ot: travel (sayohat qilmoq) → traveler (sayohatchi). -er qo'shimchasi ishni bajaruvchini bildiradi.", ex: "She is a happy traveler." },
  'hobby': { uz: "sevimli mashg'ulot, hobbi", g: "Javob qolipi: My hobby is + ish nomi (-ing): My hobby is reading.", ex: "My hobby is chess." },
  'learn': { uz: "o'rganmoq", g: "learn - o'rganish jarayoni. teach - o'rgatmoq. Hozirgi oddiy zamonda: I learn, she learns.", ex: "I learn ten new words every day." },
  'saved': { uz: "saqlagan (save fe'lining 3-shakli)", g: "Present Perfect: have/has + 3-shakl. Have you saved...? Savol shakli: Have + ega + 3-shakl.", ex: "I saved your phone number." },
  'word list': { uz: "so'zlar ro'yxati", g: "Ikki ot birikmasi: word + list. Birinchi ot sifat vazifasida, ko'plikda ishlatilmaydi.", ex: "Please check your word list." },
  'review': { uz: "takrorlamoq, ko'rib chiqmoq", g: "review - o'tilgan narsani qayta ko'rib chiqish. Imtihondan oldin: review the lesson.", ex: "I review my notes every night." },
  'every day': { uz: "har kuni", g: "Ikki so'z: every day (har kuni, ravish). everyday - bir so'z - kundalik (sifat).", ex: "I read English every day." },
  'lost': { uz: "yo'qotdi, yo'qotgan (lose fe'lining o'tgan zamoni)", g: "lose - lost - lost (tartibsiz fe'l). I lost my hat - men qalpog'imni yo'qotdim.", ex: "I lost my keys yesterday." },
  'hat': { uz: "qalpoq", g: "Sanaladigan ot: a hat, two hats. cap - soyabonli kepka, hat - umumiy qalpoq.", ex: "He wears a red hat." },
  'describe': { uz: "tasvirlamoq, ta'riflamoq", g: "Sifatlar otdan oldin: a big, white, woolly hat. Tartib: o'lcham, rang, material.", ex: "Can you describe your friend?" },
  'clue': { uz: "iz, ma'lumot (topishga yordam beradigan)", g: "Sanaladigan ot: a clue, two clues. have a clue about - biror narsa haqida ma'lumotga ega bo'lmoq.", ex: "The police found a clue." },
  'found': { uz: "topdi, topgan (find fe'lining o'tgan zamoni)", g: "find - found - found (tartibsiz fe'l).", ex: "I found my keys yesterday." },
  'fountain': { uz: "favvora", g: "Joy oldidan near/by: near the fountain (favvora yonida).", ex: "We met near the fountain." },
  'Here you go': { uz: "Mana, marhamat", g: "Biror narsa uzatayotganda aytiladi. Here you are bilan bir xil ma'noda.", ex: "Here you go. Enjoy your meal." },
  'take care': { uz: "ehtiyot qilmoq, qarab turmoq", g: "take care of + ot: biror narsaga/kimgadir qaramoq. of ni unutmang: Take care of it.", ex: "Please take care of your health." },

  'straight ahead': { uz: "to'g'riga", g: "Yo'l ko'rsatishda: go straight ahead - to'g'ri yuring.", ex: "Go straight ahead for two blocks." },
  'turn left': { uz: "chapga burilmoq", g: "Yo'nalish: turn left (chapga), turn right (o'ngga). Buyruq shaklida fe'l boshlanadi.", ex: "Turn left at the fountain." },
  'fresh': { uz: "yangi, toza (yangi uzilgan, yangi pishirilgan)", g: "Oziq-ovqat haqida: fresh bread, fresh fruit. Teskarisi: old yoki stale (non uchun).", ex: "We sell fresh fruit every morning." },
  'a kilo of': { uz: "bir kilogramm", g: "a kilo of + ot: a kilo of apples. Ko'plik: two kilos of apples.", ex: "I would like a kilo of apples, please." },
};

/* ---------- Qismlar ---------- */
const CHAPTERS = [
  { n: 1, title: "Ovqat topish", goal: "Bozorga boring va Farid bilan gaplashib non sotib oling.", npc: 'farid', place: "Farid's Market" },
  { n: 2, title: "Ish topish", goal: "Kafega boring va Maya bilan suhbatdan o'ting.", npc: 'maya', place: "Corner Cafe" },
  { n: 3, title: "Tunash joyi", goal: "Hostelga boring va Elena bilan xona band qiling.", npc: 'elena', place: "Sunny Hostel" },
  { n: 4, title: "Yo'qolgan qalpoqcha", goal: "Favvora yonidagi Keeper bilan gaplashing va qalpoqchani qaytarib oling.", npc: 'keeper', place: "Fountain" }
];

/* ---------- Personajlar va suhbat daraxtlari ----------
   file: 3D model (GLB). look: model yuklanmasa ishlatiladigan oddiy shakl.
   say: {kalit} bilan belgilangan so'zlar bosiladigan bo'ladi.
   choices: t = inglizcha javob, uz = tarjima, ok = to'g'rimi, why = noto'g'ri bo'lsa izoh, next = keyingi tugun yoki END */
const NPCS = [
  {
    id: 'farid', name: "Farid", role: "Bozor sotuvchisi", chapter: 1, file: '01_Market_Farid.glb',
    look: { skin: 0xd79867, hair: 0x24222a, hairStyle: 'short', shirt: 0xe8a548, pants: 0x4a4a55, hat: 'flatcap', apron: 0xf6e8c8 },
    tree: {
      n1: { say: "{Good morning}! Welcome to Farid's Market. What can I {get} you?", uz: "Xayrli tong! Farid bozoriga xush kelibsiz. Sizga nima olib beray?",
        choices: [
          { t: "I would like some bread, please.", uz: "Menga non kerak, iltimos.", ok: true, next: 'n2' },
          { t: "Me bread give now.", uz: "Menga non ber hozir.", ok: false, why: "Gap tartibi noto'g'ri va qo'pol. Muloyim so'rash qolipi: I would like + ot, please." },
          { t: "Goodbye, see you.", uz: "Xayr, ko'rishguncha.", ok: false, why: "Bu xayrlashish iborasi, hozir esa salomlashish va buyurtma vaqti." }
        ] },
      n2: { say: "Of course! {How many} {loaves} would you like? We have white bread and {whole grain} bread.", uz: "Albatta! Nechta non xohlaysiz? Bizda oq non va to'liq donli non bor.",
        choices: [
          { t: "Two loaves of white bread, please.", uz: "Ikkita oq non, iltimos.", ok: true, next: 'n3' },
          { t: "I am two bread white.", uz: "Men ikki non oqman.", ok: false, why: "'I am' - 'men ...man' degani. Miqdor aytilganda: Two loaves of ..." },
          { t: "Yes, I am fine, thank you.", uz: "Ha, yaxshiman, rahmat.", ok: false, why: "Savol miqdor haqida edi (How many), hol-ahvol haqida emas." }
        ] },
      n3: { say: "That's {three dollars} {in total}. Would you like {anything else}?", uz: "Jami uch dollar. Yana biror narsa xohlaysizmi?",
        choices: [
          { t: "Here you are. No, that's all, thank you.", uz: "Marhamat. Yo'q, hammasi shu, rahmat.", ok: true, next: 'n4' },
          { t: "No money, I eat bread.", uz: "Pul yo'q, men non yeyman.", ok: false, why: "Bunday deb bo'lmaydi. Pulni uzating: Here you are (marhamat)." },
          { t: "Where is the market?", uz: "Bozor qayerda?", ok: false, why: "Siz allaqachon bozordasiz. Savolga javob bering: No, that's all." }
        ] },
      n4: { say: "Thank you! {Have a nice day}! {Come back} soon.", uz: "Rahmat! Kuningiz yaxshi o'tsin! Tezroq qaytib keling.",
        choices: [
          { t: "Thank you! You too.", uz: "Rahmat! Sizga ham.", ok: true, next: 'END' },
          { t: "Thank you! Yesterday.", uz: "Rahmat! Kecha.", ok: false, why: "Bunga 'Sizga ham' deb javob beriladi: You too." }
        ] }
    },
    idle: { say: "Hello again! We {sell} fresh fruit and bread every day.", uz: "Yana salom! Biz har kuni yangi meva va non sotamiz.", reply: "Thank you. Goodbye.", replyUz: "Rahmat. Xayr." }
  },
  {
    id: 'maya', name: "Maya", role: "Kafe baristasi", chapter: 2, file: '02_Cafe_Maya.glb',
    look: { skin: 0xbd784d, hair: 0x52332a, hairStyle: 'ponytail', shirt: 0xf3e6c4, pants: 0x35405a, apron: 0x267d76 },
    tree: {
      n1: { say: "Hi! I heard you are {looking for} a {job}. I am Maya. What is your name?", uz: "Salom! Eshitdimki, siz ish izlayapsiz. Men Mayaman. Ismingiz nima?",
        choices: [
          { t: "My name is Hoshimjon.", uz: "Mening ismim Hoshimjon.", ok: true, next: 'n2' },
          { t: "I name Hoshimjon.", uz: "Men ismlayman Hoshimjon.", ok: false, why: "Ism aytish qolipi: My name is ... yoki I am ..." },
          { t: "Yes, I am hungry.", uz: "Ha, men ochman.", ok: false, why: "Savol ism haqida (What is your name?), ochlik haqida emas." }
        ] },
      n2: { say: "{Nice to meet you}, Hoshimjon! {Where are you from}?", uz: "Tanishganimdan xursandman, Hoshimjon! Qayerdansiz?",
        choices: [
          { t: "I am from Uzbekistan.", uz: "Men O'zbekistondanman.", ok: true, next: 'n3' },
          { t: "I come Uzbekistan from.", uz: "Men keldim O'zbekiston dan.", ok: false, why: "Gap tartibi buzilgan. Eng oddiy qolip: I am from + mamlakat." },
          { t: "I am fine, thanks.", uz: "Yaxshiman, rahmat.", ok: false, why: "'Where are you from?' qayerdansiz degani. 'Fine' - hol-ahvol javobi." }
        ] },
      n3: { say: "Great! Do you have any {experience}? Can you {wash dishes} and {clean tables}?", uz: "Ajoyib! Tajribangiz bormi? Idish yuvib, stollarni tozalay olasizmi?",
        choices: [
          { t: "Yes, I can wash dishes and clean tables.", uz: "Ha, idish yuva olaman va stollarni tozalay olaman.", ok: true, next: 'n4' },
          { t: "Yes, I can washing dishes.", uz: "Ha, men yuvyapman idishlarni qila olaman.", ok: false, why: "can dan keyin fe'l asosiy shaklda keladi: I can wash (washing emas)." },
          { t: "Yes, I wash yesterday.", uz: "Ha, men kecha yuvaman.", ok: false, why: "Savol 'Can you...?' edi. Javob: Yes, I can. O'tgan zamon kerak emas." }
        ] },
      n4: { say: "{When} can you start? We open at {eight o'clock}.", uz: "Qachon boshlay olasiz? Biz soat sakkizda ochamiz.",
        choices: [
          { t: "I can start tomorrow at eight.", uz: "Men ertaga soat sakkizda boshlay olaman.", ok: true, next: 'n5' },
          { t: "I start yesterday.", uz: "Men kecha boshlayman.", ok: false, why: "Kelasi ish uchun 'yesterday' (kecha) mantiqsiz. Kelasi vaqt: tomorrow." },
          { t: "Eight dollars start.", uz: "Sakkiz dollar boshlash.", ok: false, why: "Savol vaqt haqida (When). Vaqt aytiladi: at eight." }
        ] },
      n5: { say: "{Welcome to the team}! The pay is ten dollars {per hour}. See you {tomorrow}!", uz: "Jamoaga xush kelibsiz! Haq soatiga o'n dollar. Ertagacha!",
        choices: [
          { t: "Thank you very much! See you tomorrow.", uz: "Katta rahmat! Ertagacha.", ok: true, next: 'END' },
          { t: "Thanks, you are the job.", uz: "Rahmat, siz ishsiz.", ok: false, why: "Ma'nosiz gap. Minnatdorchilik bildiring: Thank you very much!" }
        ] }
    },
    idle: { say: "Sorry, we are {busy} now. {Come back} later, please.", uz: "Kechirasiz, hozir bandmiz. Iltimos, keyinroq qaytib keling.", reply: "Okay, see you later.", replyUz: "Yaxshi, keyinroq ko'rishamiz." }
  },
  {
    id: 'elena', name: "Elena", role: "Hostel administratori", chapter: 3, file: '03_Hostel_Elena.glb',
    look: { skin: 0xf4b894, hair: 0xb8643a, hairStyle: 'short', shirt: 0x334c72, pants: 0x24366b },
    tree: {
      n1: { say: "{Good evening}! Welcome to Sunny Hostel. Do you have a {reservation}?", uz: "Xayrli kech! Sunny Hostelga xush kelibsiz. Bron qilganmisiz?",
        choices: [
          { t: "No, I don't. Do you have a room for tonight?", uz: "Yo'q. Bugun kechqurun uchun xona bormi?", ok: true, next: 'n2' },
          { t: "No, I am not a reservation.", uz: "Yo'q, men bron emasman.", ok: false, why: "'Do you have...?' ga 'Yes, I do' yoki 'No, I don't' deb javob beriladi." },
          { t: "Yes, I have a very big hostel.", uz: "Ha, mening juda katta hostelim bor.", ok: false, why: "Siz mehmonsiz va bron qilmagansiz. To'g'ri javob: No, I don't." }
        ] },
      n2: { say: "Yes, we have a {single room}. It is forty dollars {per night}. {How would you like to pay}?", uz: "Ha, bir kishilik xona bor. Kechasiga qirq dollar. Qanday to'lamoqchisiz?",
        choices: [
          { t: "I'll pay in cash, please.", uz: "Naqd to'layman, iltimos.", ok: true, next: 'n3' },
          { t: "I pay with my bread.", uz: "Men nonim bilan to'layman.", ok: false, why: "To'lov usuli kerak: cash (naqd) yoki card (karta)." },
          { t: "I will paying cash.", uz: "Men to'layotgan bo'laman naqd.", ok: false, why: "will dan keyin fe'l asosiy shaklda: I will pay (paying emas)." }
        ] },
      n3: { say: "Could I see your {passport}, please? And what time would you like to {check out}?", uz: "Pasportingizni ko'rsam bo'ladimi? Soat nechada chiqib ketmoqchisiz?",
        choices: [
          { t: "Here is my passport. I'd like to check out at ten.", uz: "Mana pasportim. Soat o'nda chiqib ketmoqchiman.", ok: true, next: 'n4' },
          { t: "I check out ten at.", uz: "Men chiqaman o'n da.", ok: false, why: "Gap tartibi: I'd like to check out at ten. Soat oldidan at keladi." },
          { t: "I don't have a passport, thanks.", uz: "Pasportim yo'q, rahmat.", ok: false, why: "Hostelda pasport kerak. Uni uzating: Here is my passport." }
        ] },
      n4: { say: "{Here is your key}. Your room is on the {third floor}. {Enjoy your stay}!", uz: "Mana kalitingiz. Xonangiz uchinchi qavatda. Dam olishingiz yoqimli bo'lsin!",
        choices: [
          { t: "Thank you. Have a good evening!", uz: "Rahmat. Kechangiz xayrli bo'lsin!", ok: true, next: 'END' },
          { t: "Thank you. Good morning!", uz: "Rahmat. Xayrli tong!", ok: false, why: "Hozir kechqurun, Good morning esa ertalab uchun. Kechqurun: Good evening." },
          { t: "Where is my bread?", uz: "Nonim qani?", ok: false, why: "Hostelda minnatdorchilik bildiriladi: Thank you." }
        ] }
    },
    idle: { say: "Hello! The hostel is {open} all day and all night.", uz: "Salom! Hostel kechayu kunduz ochiq.", reply: "Thank you. Goodbye.", replyUz: "Rahmat. Xayr." }
  },
  {
    id: 'keeper', name: "Keeper", role: "Qalpoqcha izidan boruvchi", chapter: 4, file: '06_Quest_Keeper.glb',
    look: { skin: 0xd79867, hair: 0x24222a, hairStyle: 'short', shirt: 0x6c4c88, pants: 0x3a2f4a, hat: 'flatcap' },
    tree: {
      n1: { say: "Hello again! I heard you {lost} your {hat}. Can you {describe} it?", uz: "Yana salom! Eshitdimki, qalpog'ingizni yo'qotibsiz. Uni tasvirlab bera olasizmi?",
        choices: [
          { t: "It is a big, white, woolly hat.", uz: "U katta, oq, jun qalpoq.", ok: true, next: 'n2' },
          { t: "It is a hat white woolly big.", uz: "U qalpoq oq jun katta.", ok: false, why: "Ingliz tilida sifat otdan oldin keladi: a big, white, woolly hat." },
          { t: "I am a white hat.", uz: "Men oq qalpoqman.", ok: false, why: "Siz qalpoq emassiz. Narsani tasvirlashda 'It is ...' deyiladi." }
        ] },
      n2: { say: "I {found} it near the {fountain}! {Here you go}. Please {take care} of it.", uz: "Men uni favvora yonidan topdim! Marhamat. Iltimos, uni asrang.",
        choices: [
          { t: "Thank you so much! I will take care of it.", uz: "Katta rahmat! Uni asrayman.", ok: true, next: 'END' },
          { t: "Thank you. I will take care you.", uz: "Rahmat. Men sizni asrayman.", ok: false, why: "take care of + ot: 'of' ni unutmang. Take care of it." },
          { t: "No, this is not hat.", uz: "Yo'q, bu qalpoq emas.", ok: false, why: "Bu sizning qalpog'ingiz. Minnatdorchilik bildiring: Thank you so much!" }
        ] }
    },
    idle: { say: "Hello! I have a {clue} about your {hat}. Come back when you can speak English.", uz: "Salom! Qalpog'ingiz haqida menda bir iz bor. Ingliz tilida gaplasha olganingizda qaytib keling.", reply: "Okay, I will come back.", replyUz: "Yaxshi, qaytib kelaman." }
  },
  {
    id: 'leo', name: "Leo", role: "Do'stona sayyoh", chapter: 0, file: '04_Street_Leo.glb',
    look: { skin: 0x855339, hair: 0x24222a, hairStyle: 'short', shirt: 0xe8a548, pants: 0x354d67 },
    tree: {
      n1: { say: "Hey! I am Leo. I am a {traveler}. What is your {hobby}?", uz: "Salom! Men Leoman. Men sayyohman. Sevimli mashg'ulotingiz nima?",
        choices: [
          { t: "My hobby is reading books.", uz: "Mening hobbim kitob o'qish.", ok: true, next: 'n2' },
          { t: "I hobby reading.", uz: "Men hobbi o'qish.", ok: false, why: "Qolip: My hobby is + ish nomi (-ing)." },
          { t: "Yes, I am a hobby.", uz: "Ha, men hobbiman.", ok: false, why: "Savol sevimli mashg'ulot haqida. 'My hobby is...' deb javob bering." }
        ] },
      n2: { say: "That's {cool}! {Have fun} in the city!", uz: "Bu zo'r! Shaharda maza qiling!",
        choices: [
          { t: "Thanks! See you.", uz: "Rahmat! Ko'rishguncha.", ok: true, next: 'END' }
        ] }
    },
    idle: null
  },
  {
    id: 'noor', name: "Noor", role: "So'z ustozi (kutubxona)", chapter: 0, file: '05_Library_Noor.glb', afterEnd: 'catalog',
    look: { skin: 0xd5a16d, hair: 0xd4d2cf, hairStyle: 'short', shirt: 0x6a82b8, pants: 0x2b2f44 },
    tree: {
      n1: { say: "Welcome to the library! I help people {learn} new words. Have you {saved} any words today?", uz: "Kutubxonaga xush kelibsiz! Men odamlarga yangi so'zlarni o'rganishda yordam beraman. Bugun biror so'z saqladingizmi?",
        choices: [
          { t: "Yes, I have saved some words.", uz: "Ha, bir nechta so'z saqladim.", ok: true, next: 'n2' },
          { t: "Yes, I have save some words.", uz: "Ha, men saqlash bir nechta so'z.", ok: false, why: "Have + 3-shakl: have saved. 'save' emas." },
          { t: "No, I am a library.", uz: "Yo'q, men kutubxonaman.", ok: false, why: "Savolga 'Yes, I have' yoki 'No, I haven't' deb javob beriladi." }
        ] },
      n2: { say: "Great! Open your {word list} and {review} the words {every day}.", uz: "Ajoyib! So'zlar ro'yxatingizni oching va so'zlarni har kuni takrorlang.",
        choices: [
          { t: "I will review them every day.", uz: "Ularni har kuni takrorlayman.", ok: true, next: 'END' },
          { t: "I will reviewing them every day.", uz: "Men takrorlayotgan bo'laman.", ok: false, why: "will dan keyin fe'l asosiy shaklda: I will review." },
          { t: "Yes, I am every day.", uz: "Ha, men har kunman.", ok: false, why: "Mantiqsiz gap. Reja haqida: I will review them every day." }
        ] }
    },
    idle: null
  }
];

/* Qo'shimcha suhbat mavzulari. Har bir NPC uchun ro'yxat: har safar yangi mavzu (haftalik avtomatik qo'shiladi). */
const TOPICS = {
  leo: [
    { id: 'leo-directions', tree: {
      n1: { say: "Excuse me, do you know the way to the station? I think go {straight ahead} and then {turn left}.", uz: "Kechirasiz, bekatga yo'lni bilasizmi? Menimcha to'g'riga yurib, keyin chapga burilish kerak.",
        choices: [
          { t: "Yes, go straight ahead and turn left at the fountain.", uz: "Ha, to'g'ri yuring va favvorada chapga buriling.", ok: true, next: 'END' },
          { t: "Yes, go straight ahead and left turn.", uz: "Ha, to'g'ri yuring va chap burilish.", ok: false, why: "Buyruqda fe'l bo'lishi kerak: turn left (left turn emas)." },
          { t: "Yes, I am straight ahead.", uz: "Ha, men to'g'riman.", ok: false, why: "Savol yo'l haqida. Yo'l ko'rsatish: go straight ahead, turn left." }
        ] }
    } }
  ],
  farid: [
    { id: 'farid-fruit', tree: {
      n1: { say: "Today I have {fresh} apples. Would you like {a kilo of} apples?", uz: "Bugun menda yangi olmalar bor. Bir kilogramm olma olasizmi?",
        choices: [
          { t: "Yes, I would like a kilo of apples, please.", uz: "Ha, bir kilogramm olma olaman.", ok: true, next: 'END' },
          { t: "Yes, I like a kilo apples.", uz: "Ha, menga bir kilo olma yoqadi.", ok: false, why: "Buyurtmada I would like ishlatiladi, ot oldidan of kerak: a kilo of apples." },
          { t: "No, the apples are fresh me.", uz: "Yo'q, olmalar yangi menga.", ok: false, why: "Gap mantiqsiz. Rad etish: No, thank you." }
        ] }
    } }
  ]
};

/* So'zlar matn ichida {kalit} ko'rinishida; shu funksiya qism bo'yicha barcha kalitlarni yig'adi */
function collectKeys(npc) {
  const out = [];
  Object.values(npc.tree).forEach(n => {
    (n.say.match(/\{([^}]+)\}/g) || []).forEach(m => {
      const k = m.slice(1, -1);
      if (!out.includes(k)) out.push(k);
    });
  });
  return out;
}
