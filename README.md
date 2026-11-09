# Lexora — ingliz tili platformasi

Talabalar kunlari haqida ingliz tilida yozadi, o'qituvchi esa grammatikasini tekshiradi.
Har bir talaba faqat o'z kundaligini ko'radi. O'qituvchi hammasini ko'radi.

- **Talaba:** email va parol bilan bir marta ro'yxatdan o'tadi, keyin istalgan qurilmadan kiradi.
- **O'qituvchi:** "Teacher sign-in" tugmasi bilan emailiga kelgan havola orqali kiradi.
- **Yangi yozuvlar:** Inbox'ga keladi. Brauzer yorlig'ida kutayotganlar soni chiqadi, masalan `(3) Lexora · ...`.
- **Tuzatishlar:** talaba "Corrected" tugmasi bilan to'g'rilangan matnni, "My mistakes" bo'limida esa barcha xatolarini ko'radi.

- **Tillar:** yuqoridagi EN / UZ / RU tugmalari bilan sayt ingliz, o'zbek yoki rus tilida ochiladi. Tanlov har bir qurilmada eslab qolinadi. Tarjimalar `i18n.js` faylida.
- **To'lovlar:** o'qituvchi sahifasidagi **To'lovlar** bo'limi (avvalgi Tuition Ledger): oylik to'lov, tushumlar, qarzlar va dars narxi kalkulyatori.
- **Premium (Do'kon ichida):** **Kundalik gazeta** va **Mashq to'plami** (kartochkalar, viktorinalar, testlar). Ikkalasi ham har bir to'lagan talaba uchun alohida tayyorlanadi.
- **Talaba balansi:** to'lovlardagi talabani uning kundalik akkauntiga bog'lasangiz, talaba kirganda **To'lovlarim** bo'limida o'z balansini ko'radi.

Sayt Firebase'siz ham ochiladi, lekin unda faqat namunaviy sinf ko'rinadi va hech narsa saqlanmaydi.

---

## Bir martalik sozlash (taxminan 15 daqiqa)

### 1. Firebase loyihasini oching

1. https://console.firebase.google.com saytiga Google akkauntingiz bilan kiring.
2. **Create a project** tugmasini bosing va nom bering, masalan `daybook`. Google Analytics shart emas.
3. Chap menyuda **Build → Firestore Database → Create database** ni tanlang.
   - Joylashuv: `eur3 (europe-west)`.
   - Rejim: **Production mode**.
4. **Build → Authentication → Get started** ni bosing.
   - **Sign-in method** bo'limida **Email/Password** ni tanlang.
   - Ikkala tugmani yoqing: **Email/Password** va **Email link (passwordless sign-in)**.
   - Talabalar parol bilan kiradi. Bepul tarifda emailga havola kuniga atigi 5 ta xat bilan cheklangan, shuning uchun havoladan faqat siz foydalanasiz.
   - **Save** ni bosing.

### 2. `config.js` faylini to'ldiring

1. Firebase'da ⚙️ **Project settings → General** bo'limiga o'ting.
2. Pastdagi **Your apps** qismida **</>** (Web) belgisini bosing.
3. Ilovaga nom bering va **Register app** ni bosing.
4. Ko'rsatilgan `firebaseConfig` qiymatlarini `config.js` ga ko'chiring.
5. `TEACHER_EMAIL` qatoriga o'zingiz kiradigan emailni yozing.

### 3. Xavfsizlik qoidalarini qo'ying

1. **Firestore Database → Rules** bo'limini oching.
2. `firestore.rules` faylidagi hamma matnni u yerga qo'ying.
3. `teacher@example.com` o'rniga o'z emailingizni yozing. Bu `config.js` dagi email bilan bir xil bo'lishi kerak.
4. **Publish** ni bosing.

Bu qoidalar har bir talabaning yozuvini boshqalardan himoya qiladi.

### 4. GitHub Pages manzilini ruxsat bering

1. **Authentication → Settings → Authorized domains → Add domain** ni bosing.
2. `samandaryusupov559-glitch.github.io` ni qo'shing.

### 5. Saytni yoqing

1. GitHub repozitoriysida **Settings → Pages** bo'limiga o'ting.
2. **Source:** `Deploy from a branch` ni tanlang.
3. **Branch:** `main` va `/ (root)` ni tanlang.
4. Bir daqiqadan keyin sayt shu manzilda ochiladi: `https://samandaryusupov559-glitch.github.io/<repo-nomi>/`

---

## Yangilash: xavfsizlik qoidalari

Yangi bo'limlar (to'lovlar, e'lonlar, vazifalar, band qilish) ishlashi uchun Firebase qoidalarini yangilash kerak. Har safar `firestore.rules` o'zgarsa, shuni takrorlang:

1. **Firestore Database → Rules** bo'limini oching.
2. Yangi `firestore.rules` faylidagi hamma matnni u yerga qo'ying (eski matnni o'chirib).
3. **Publish** ni bosing.

Qoidalar yangilanmaguncha tegishli sahifalarda shu haqda ogohlantirish chiqadi.

**Xavfsizlik:** talaba to'lovlarni, qarzini, narxlarni yoki band qilish holatini o'zgartira olmaydi, boshqa talabaning ma'lumotini ko'ra olmaydi. Buni `tests/rules.test.mjs` tekshiradi (86 ta tekshiruv, jumladan to'lamasdan gazeta yoki mashq to'plamini o'qishga urinishlar). Firebase → **Authentication → Users** ro'yxatida sizning emailingiz bilan faqat bitta (o'zingizning) akkaunt borligiga ishonch hosil qiling.

## Chat va so'rovlarni taqsimlash

- **Mehmon chati:** saytdagi **Biz bilan yozishish** tugmasi (bosh sahifa, ustoz profili, sinov darsi oynasi). Mehmon ismi, telefon yoki Telegrami va savolini yozadi, keyin Lexoraning o'zida yozishadi. Javobni ko'rish uchun saytni shu brauzerda ochadi.
- **O'quvchi–ustoz chati:** darsni boshlagan o'quvchi chap menyudagi **Xabarlar** bo'limida yoki **Ustozlar** sahifasidagi **Yozish** tugmasi orqali o'z ustozlariga yozadi. Bunga asosiy ustozi va tasdiqlangan qo'shimcha ustozlari kiradi.
- **Kim ko'radi:** markaz egasi hamma chatni ko'radi. Ustoz o'z o'quvchilarining chatini va o'ziga biriktirilgan mehmon chatlarini ko'radi. O'quvchi faqat o'z chatini ko'radi.
- **Adolatli taqsimlash:** "Istalgan ustoz" tanlangan sinov so'rovlari va mehmon chatlari **Ustozlar → Sinov darsi so'rovlari** bo'limida taqsimlanadi. So'rov shu tilni o'qitadigan, o'quvchilari va yangi so'rovlari eng kam bo'lgan ko'rinadigan ustozga beriladi. Har birini qo'lda biriktirish, **Hammasini adolatli taqsimlash** tugmasini bosish yoki avtomatik taqsimlashni yoqish mumkin. Avtomatik taqsimlash sizning sahifangiz ochiq turganda ishlaydi. So'rovni faqat markaz egasi biriktiradi, shuning uchun ustozlar uni o'zaro talashmaydi.

## Speaking club va kutubxona tillar bo'yicha

- Markaz tillari: ingliz, rus, nemis, turk, koreys, xitoy, yapon, ispan. Har bir tilning o'z speaking clubi va kutubxona javoni bor.
- O'quvchi faqat o'qiyotgan tillarining clubida qatnashadi va faqat o'sha tillar kitoblarini ko'radi. Bular asosiy ustozining tillari va siz tasdiqlagan qo'shimcha darslar tillari. Ustoz o'zi o'qitadigan tillarning clubini boshqaradi va faqat o'sha tillarda kitob qo'shadi. Markaz egasi hammasini ko'radi.
- Ustozning tillari uning profilidagi "Tillar" ro'yxatidan olinadi. Tillari belgilanmagan ustoz ingliz tili ustozi hisoblanadi.

Bu bo'limlar ishlashi uchun yangi `firestore.rules` ni Firebase'ga qo'ying (yuqoridagi "Yangilash" bo'limi). Tekshiruvlar: `tests/chat.test.mjs`, `tests/langs.test.mjs`.

## Xatlar spamga tushmasligi uchun

**Firebase xatlari** (email tasdiqlash, parolni tiklash, kirish havolasi) `noreply@daybook-4497a.firebaseapp.com` manzilidan keladi va ko'pincha spamga tushadi. Bir martalik sozlash:

1. Firebase → ⚙️ **Project settings → General → Public-facing name**: `Lexora` deb yozing. Shunda xat sarlavhasida "daybook-4497a" o'rniga "Lexora" chiqadi.
2. **Authentication → Templates**: har bir shablonda (Email address verification, Password reset, Email link sign-in) qalam belgisini bosing:
   - **Sender name**: `Lexora`
   - **Reply to**: o'z Gmail manzilingiz
   - **Subject**: qisqa va aniq, masalan `Lexora: emailingizni tasdiqlang`
3. O'quvchilardan birinchi xatni Spam papkasida ochib, **"Spam emas"** tugmasini bosishini so'rang.

Bu xatlarni butunlay spamdan chiqarishning eng ishonchli yo'li o'z domeningiz (masalan `lexora.uz`). Uni **Authentication → Templates → Customize domain** orqali ulaysiz va Firebase bergan DNS yozuvlarini qo'shasiz.

**Lexora xabarnomalari** sizning Gmail'ingizdan ketadi. Oddiy Gmail kuniga taxminan 100 ta xat yuboradi, limit tugasa qolganlari yuborilmaydi. E'lonlar sahifasidagi Email kartasida bugun yana nechta xat yuborish mumkinligi ko'rinadi. Keraksiz xat turlarini o'sha yerda o'chirib qo'ying.

## Foydalanish

1. Saytga birinchi bo'lib **o'zingiz** kiring: **Teacher sign-in** tugmasini bosing, `TEACHER_EMAIL` dagi emailni yozing va kelgan havolani o'sha qurilmada oching. O'qituvchi sahifasi ochiladi.
2. Havolani talabalarga yuboring. Har biri **New here? Create an account** tugmasini bosib, emaili va parolini yozadi. Keyin ismi va darajasini kiritadi.
3. Parolini unutgan talaba **Forgot password?** tugmasini bosadi.
4. Yozuvlar **Inbox**'ga keladi. So'zlarni belgilab xato qo'ying, band ball bering va **Return to student** ni bosing.
5. Talaba sahifasida "Your teacher checked…" xabari chiqadi. U xatolarini ko'radi yoki **Please revise** bo'lsa qayta yozadi.
6. **E'lonlar taxtasi:** e'lon yozing (muhimini tepaga mahkamlang), maslahat, so'z yoki idioma postlarini joylang. Shu yerda **butun sinfga vazifa** ham berasiz.
7. **Vazifalar:** talaba sahifasida unga alohida vazifa yoki o'rganadigan narsa qo'shing, muddat qo'yish mumkin. "Yozma vazifa" belgilansa, talaba **Yozish** tugmasi bilan darhol jurnalga yozadi. Talaba bajarganini belgilaydi, siz ko'rasiz.
8. **Xizmatlar va bo'sh vaqtlar:** qo'shimcha dars, kitob o'qish, kino klubi kabi xizmatlarni narxi bilan qo'shing va bo'sh vaqtlaringizni kiriting. Talabalar band qiladi, siz **Band qilishlar** sahifasida tasdiqlaysiz yoki rad etasiz.
9. **Talabalar to'lovi:** **To'lovlar** sahifasining pastida Click, Payme yoki karta raqamingizni qo'shing. Talaba o'z ilovasida to'laydi va **To'ladim** ni bosadi. Xabar **To'lovlar** sahifasining tepasida chiqadi. Pul ilovangizga kelganini tekshiring va **Tasdiqlash** ni bosing: shundagina to'lov hisobga qo'shiladi. Talaba o'zi hech narsani o'zgartira olmaydi.
10. **Do'kon:** **Do'kon** sahifasida kitob, material yoki kurs qo'shing (narxi, tavsifi, xohlasangiz rasm havolasi). Talaba to'laydi va buyurtma yuboradi. Siz pul kelganini tekshirib **To'lov keldi** ni bosasiz va xohlasangiz xabar yozasiz (masalan, PDF havolasi). Keyin **Topshirildi** ni bosasiz. Narxni faqat siz o'zgartira olasiz.
11. **Talabalarga email:** **E'lonlar taxtasi → Talabalarga email → Emailni sozlash** ni bosing va 4 qadamni bajaring (skriptni nusxalash, script.google.com'ga qo'yish, Web app qilib deploy qilish, URL'ni qo'yish). Shundan keyin e'lonlar, vazifalar, tekshirilgan yozuvlar, to'lov, band qilish va buyurtma tasdiqlari talabalarning Gmail'iga o'z Gmail'ingizdan avtomatik boradi. Talaba emailni bosh sahifasida o'chirib qo'yishi mumkin. Google kuniga taxminan 100 ta oluvchiga ruxsat beradi.
12. **O'chirish:** rad etilgan to'lov xabarlari, rad etilgan band qilish so'rovlari va rad etilgan buyurtmalar yonida **O'chirish** tugmasi bor (ikki marta bosiladi). Ketib qolgan talabani o'chirish uchun **Talabalar → talaba → Talabani o'chirish** ni bosing: uning yozuvlari, vazifalari, so'rovlari, buyurtmalari va emaili o'chadi.
13. **Bo'sh vaqtda so'rov:** talaba **Qo'shimcha darslar** sahifasida bo'sh vaqtingizni bosib, mashg'ulotlaringizdan birini yoki o'z taklifini (masalan, IELTS speaking) so'raydi. So'rov **Band qilish so'rovlari** ro'yxatiga tushadi.
14. **Reyting:** **Reyting** sahifasida ballar avtomatik hisoblanadi (yozuvlar, so'zlar, bajarilgan vazifalar, oxirgi baho, kelgan qo'shimcha darslar) va siz +5 / −5 bonus bera olasiz. Talabalar faqat ism va ballarni ko'radi. **Talabalarga ko'rsatish** belgisini olib tashlasangiz, reyting yopiladi.

15. **Kundalik gazeta (Do'kon → The Lexora Daily → Boshqarish):** narxi 30 kunga 50 000 so'm (**Sozlamalar**da o'zgartirasiz). Talaba to'laydi va **To'ladim** ni bosadi, siz **To'lov keldi** ni bosasiz: gazeta 30 kunga ochiladi (yana to'lasa, kunlar qo'shiladi). **Yoziladigan sonlar** jadvalida har qator — bitta o'quvchi, har katak — bir kun. Katakni bosing va o'sha o'quvchi uchun son yozing: maqolalar (kalit so'zlar va test bilan), kun so'zi, ibora, fakt, hazil, topishmoq, yozish mavzusi. Son o'sha kuni soat 07:00 da faqat o'sha o'quvchiga ochiladi; ob-havo o'zi qo'shiladi. **Boshqa talabalarga nusxalash** bir sonni bir nechta o'quvchiga beradi. **AI bilan yozish**: so'rovni nusxalab Claude'ga qo'ying, javobni qaytarib qo'ying — hafta to'ladi.
16. **Mashq to'plami (Do'kon → Mashq to'plami → Boshqarish):** 30 kunga 50 000 so'm. Har darsdan keyin **Yangi to'plam**ni bosing. Ikki yo'l bor:
    - **Butun dars (AI):** darsda yozgan hamma narsangizni borligicha qo'ying (so'zlar tarjimasi bilan, qoidalar, misollar, yillar…). **So'rovni nusxalash** → Claude'ga qo'ying → javobni qaytarib qo'ying → **Tuzish**. AI faqat sizning yozuvlaringizdagi so'zlarni oladi (yozuvlarda yo'q so'z olib tashlanadi), grammatikani topib inglizcha va o'zbekcha tushuntiradi, har bir mavzu uchun viktorina, bo'sh joy to'ldirish va gap tuzish mashqlarini yozadi.
    - **So'zlar va grammatika:** so'zlarni har qatorga bittadan yozing: `so'z – tarjima` (darsdagidek) yoki `so'z = inglizcha ma'no | misol | tarjima`. **AI bilan to'ldiring**: so'rovda sizning tarjimangiz ham boradi, shuning uchun AI siz o'rgatgan ma'noni oladi (masalan, `bear – tug'moq` fe'l, ayiq emas).
    - **Xatolar:** ikkala yo'lda ham AI imlo, tarjima, ma'no va grammatika xatolarini tuzatadi. Tuzatilganlar ro'yxati (**AI N ta narsani tuzatdi**) faqat sizga ko'rinadi; o'quvchi faqat to'g'ri variantni oladi. Rozi bo'lmasangiz, saqlashdan oldin o'zgartiring. **Ko'rib chiqish** tugmasi o'quvchi ko'radigan sahifani ochadi.
    - O'quvchi bitta mashq sahifasini oladi: grammatika tushuntirishi, ovozli so'zlar ro'yxati, kartochkalar, so'z viktorinasi, grammatika viktorinasi, vaqtli test, moslashtirish, imlo va gap tuzish o'yinlari. Uni faqat o'sha talaba ko'radi va HTML fayl qilib yuklab olishi mumkin.
    - **Talabani o'chirish:** gazeta jadvalida yoki mashq to'plamida talaba yonidagi 🗑 tugmasi. Ruxsati darhol tugaydi, unga tayyorlangan sonlar/so'zlar va to'lov so'rovlari o'chiriladi (kundaligi qoladi).
    - **Takrorlanmaydi:** bir talabaga bir maqola ikki marta berilmaydi. Lexora saqlashda, nusxalashda va AI importida buni tekshiradi; AI so'roviga avval o'qilgan sarlavhalar ro'yxati qo'shiladi.
17. **Ertalabki email:** gazeta chiqqanda o'quvchiga xat borishi uchun email skriptini **3-versiyaga** yangilang (E'lonlar taxtasi → Email → Skriptni yangilash, keyin Deploy → Manage deployments → New version).

18. **Til markazi (ochiq sahifa):** saytga kirmagan mehmon endi markaz sahifasini ko'radi: ustozlar kartochkalari (rasm, tillar, darajalar, tajriba, yutuqlar, ustoz darajasi ★), til bo'yicha saralash va **Bepul sinov darsi** formasi. So'rovlar **Ustozlar** sahifasidagi **Sinov darsi so'rovlari** ro'yxatiga tushadi.
19. **Ustozlar sahifasi (faqat siz):** avval **Profilimni yaratish** ni bosing (hozirgi o'quvchilaringiz sizniki hisoblanadi). Keyin **Ustoz qo'shish**: ism, rasm (yuklash yoki havola), tillar, darajalar, tajriba, yutuqlar, Google Meet havolasi va kirish emaili. "Ochiq sahifada ko'rsatish" belgisini olib tashlasangiz, mehmonlar ko'rmaydi. Shu sahifada har bir ustozning o'quvchilari soni, tekshirgan yozuvlari, o'quvchilarining o'sishi, oxirgi faolligi va **Ustozlar nima qilyapti** lentasi bor.
    - **Ustoz darajasi** avtomatik: har bir o'quvchi +10, har bir tekshirilgan yozuv +1, o'quvchi bahosi har bir bandga oshsa +20, va sizning +10/−10 bonusingiz. Darajalar: Boshlovchi 0+, O'sayotgan 60+, Tajribali 150+, Ekspert 300+, Ustoz 500+. Ball faqat siz saytni ochganingizda qayta hisoblanadi.
    - **Ustozlar uchun xizmatlar:** xona, reklama, seminar kabi xizmatlarni narxi bilan qo'shing. Ustozlar **Markazdan** sahifasida so'raydi, siz **Qabul qilish** yoki **Rad etish** ni bosasiz.
    - **Kirish emaili** berilgan ustoz saytga o'quvchilar formasida **o'sha email va parol** bilan ro'yxatdan o'tadi, emailiga kelgan havola bilan uni tasdiqlaydi va faqat o'z o'quvchilarini ko'radi (Inbox, Talabalar, Mening profilim, Markazdan). To'lovlar, do'kon, e'lonlar va boshqalar faqat sizda qoladi.
    - O'quvchi ro'yxatdan o'tganda ustozini tanlaydi. Keyin uni faqat siz **Talabalar → talaba → Ustoz → O'tkazish** orqali boshqa ustozga o'tkazasiz. Inbox va Talabalar sahifasida **Mening o'quvchilarim / Barcha ustozlar** tugmasi bor.
20. **Google Meet darslar:** har bir ustoz profilida doimiy Meet havolasini saqlaydi (**Yaratish** tugmasi meet.google.com/new ni ochadi). O'quvchi bosh sahifasida **Darsga qo'shilish** tugmasini ko'radi. Qo'shimcha darslar uchun: **Qo'shimcha darslar** sahifasida vaqt yonidagi 🎥 tugmasini bosing va **Google Meet bilan yaratish** ni bosing yoki havolani qo'ying. Band qilishni tasdiqlaganingizda havola o'zi yaratiladi va o'quvchi **Qo'shilish** tugmasini ko'radi. Avtomatik havola uchun email skriptini **4-versiyaga** yangilang (E'lonlar taxtasi → Email → Skriptni yangilash, Deploy → Manage deployments → New version) va Google so'raganda **Calendar** ruxsatini bering. Bepul Google akkauntda 3+ kishilik uchrashuv 60 daqiqa bilan cheklangan; birga-bir darslar 24 soatgacha.
21. **O'qituvchi bo'lish arizasi:** ochiq sahifadagi **O'qituvchi bo'lish** tugmasi orqali mehmon ariza yuboradi: rasm, ism, telefon/Telegram, email, tillar, darajalar, dars davomiyligi, tajriba yili, o'zi haqida, sertifikatlar. Arizalar **Ustozlar → O'qituvchilik arizalari** bo'limiga tushadi. **O'qituvchi qilib qabul qilish** profilni avtomatik yaratadi (email bo'lsa, kirish ruxsati bilan). Boshlang'ich daraja tajribaga qarab: 0–2 yil Boshlovchi, 3–4 O'sayotgan, 5–7 Tajribali, 8+ Ekspert; Ustoz darajasiga o'quvchilar bilan erishiladi.
22. **Bir nechta ustoz:** o'quvchilarda **Ustozlar** sahifasi bor: o'z ustozlari (Darsga qo'shilish tugmasi bilan) va boshqa ustozlar. **Darsga yozilish** so'rovi sizga **Ustozlar → Boshqa ustozga yozilish so'rovlari** bo'limiga keladi; **Tasdiqlash**dan keyin o'quvchi shu ustozning Meet havolasini oladi, ustoz esa uni **Markazdan → Qo'shimcha o'quvchilarim** ro'yxatida ko'radi.
23. **Chegirma (2+ kurs):** **Ustozlar** sahifasidagi "2+ kurs uchun chegirma" bo'limida yoqing: foiz, nechta ustozdan boshlab, muddat. Aksiya mehmonlarga va o'quvchilarga ko'rinadi, shartga mos o'quvchilar o'z chegirmasini ko'radi, sizda esa ularning ro'yxati bor. To'lov summasini **To'lovlar**da o'zingiz kamaytirasiz.
24. **Darsni boshlash:** ustoz yuqoridagi **Darsni boshlash** tugmasini bosadi: Meet ochiladi va havola darhol uning barcha o'quvchilariga boradi — bosh sahifada "Jonli — Darsga qo'shilish" banneri, email sozlangan bo'lsa, emailga ham (E'lonlar → Email → "Dars boshlandi"). Birinchi marta havola so'raladi (meet.google.com/new dan nusxalanadi va doimiy saqlanadi). Bugun boshqa havola kerak bo'lsa, **Boshqa havola**ni bosib uni qo'ying. Dars vaqt bo'yicha o'zi tugamaydi: **Darsni tugatish** bosilguncha ochiq turadi (unutilsa, 6 soatdan keyin o'chadi).
25. **Ustozlarning xizmatlari:** har bir ustoz **Mening profilim → Mening xizmatlarim**da narxi bilan xizmat qo'shadi (mock test, essay tekshirish, speaking club…). O'quvchi ustoz profilidan **Buyurtma berish**ni bosadi; ustoz **Markazdan** sahifasida qabul qiladi va "Bajarildi" deb belgilaydi. Siz hamma buyurtmalarni **Ustozlar** sahifasida ko'rasiz.
26. **Guruhlar va darsni boshlash:** **Guruhlar** sahifasida guruh yarating (nom va o'quvchilar). **Darsni boshlash** bosilganda "Dars kim uchun?" so'raladi: guruh, bitta o'quvchi (individual) yoki barcha o'quvchilar. Meet havolasini faqat tanlanganlar oladi.
27. **Speaking club:** har kuni yangi mavzu va savollar o'zi chiqadi (ustoz o'zgartirishi mumkin). O'quvchilar chatda yozishadi; ustoz **Video suhbatni boshlash**ni bossa, hamma Google Meet orqali qo'shiladi. Ustozlar moderator: mavzuni o'zgartiradi va xabarlarni o'chiradi.
28. **Kutubxona:** ustozlar til va daraja bo'yicha kitob (PDF), audio, video va havola qo'shadi. Fayllar Google Drive'da turadi (ulashish: "Anyone with the link"), YouTube havolalari ham qo'yiladi. O'quvchilar ularni saytning ichida ochadi, tinglaydi, ko'radi va yuklab oladi.
29. **Namunani ko'rish** tugmalari olib tashlandi: ro'yxatdan o'tmagan mehmon faqat markaz sahifasini ko'radi.
30. **Xizmatlarim (o'quvchida):** Do'kon faqat sotib olish uchun. Sotib olingan hamma narsa — kundalik gazeta, mashq to'plami, do'kondan olingan materiallar (ustoz yuborgan havolalar bilan), ustozlarning xizmatlari va ularning to'lovlari — o'quvchining **Xizmatlarim** bo'limida turadi va o'sha yerda ochiladi.
31. **Kurs narxlari (biznes reja, 1-jadval):** **Ustozlar → Kurs narxlari** bo'limida har bir ustoz darajasi va dars turi uchun oylik narx oralig'i (12 dars) turadi: Junior — guruh 250–350 ming, individual 500–650 ming; Teacher — 350–450 ming / 650–800 ming; Senior — 450–600 ming / 800 ming–1 mln so'm. Daraja avtomatik: boshida Junior, 3 yil tajriba yoki 10 o'quvchidan Teacher, 6 yil va 25 o'quvchidan Senior (raqamlarni o'zgartirish mumkin); jadvalda har bir ustozga darajani o'zingiz ham tanlay olasiz. Til bo'yicha foiz (masalan, Korean 110%) shu tilning oraliqlarini oshiradi yoki kamaytiradi. Ustoz **Mening profilim → Mening kurs narxlarim**da o'z oralig'idagi narxni tanlaydi; darajasini o'zi o'zgartira olmaydi. Narxlar ustoz kartochkasida ("… dan / oy") va profilida ko'rinadi; oraliqdan tashqaridagi narx eng yaqin ruxsat etilgan narx bo'lib ko'rinadi.
32. **Muhim:** bu bo'limlar ishlashi uchun yangi `firestore.rules` ni Firebase'ga qo'ying (yuqoridagi "Yangilash: xavfsizlik qoidalari"). Yangi tekshiruvlar: `tests/centre.test.mjs`.

## Fayllar

| Fayl | Nima uchun |
|---|---|
| `index.html` | Butun sayt: dizayn, o'qituvchi va talaba sahifalari |
| `config.js` | Firebase kalitlari va o'qituvchi emaili |
| `i18n.js` | Ingliz, o'zbek va rus tilidagi barcha matnlar |
| `firestore.rules` | Kim nimani ko'rishi mumkinligi (Firebase'ga qo'yiladi) |
| `tests/rules.test.mjs` | Qoidalarni buzishga urinib tekshiruvchi test |

Firebase'ning bepul tarifi kuniga 50 000 o'qish va 20 000 yozishgacha ruxsat beradi. Bu bir necha o'nlab talabaga bemalol yetadi.

## Telefonga ilova qilib o'rnatish

- **Android (Chrome):** saytni oching → tepadagi **Ilovani o'rnatish** tugmasi (yoki ⋮ menyu → **Ilovani o'rnatish**). Lexora ilovalar ro'yxatida paydo bo'ladi.
- **iPhone (Safari):** saytni oching → pastdagi **Ulashish** (strelkali kvadrat) → **Add to Home Screen / На экран «Домой»** → **Add**.
- **APK fayl kerak bo'lsa:** https://www.pwabuilder.com saytiga sayt manzilini kiriting → **Package for stores** → **Android** → **Download**. Zip ichidagi `.apk` faylni telefonga yuboring. Zip ichidagi `signing.keystore` va parollarni saqlab qo'ying: keyingi yangilanishlar uchun kerak bo'ladi.

