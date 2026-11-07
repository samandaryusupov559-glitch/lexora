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
16. **Mashq to'plami (Do'kon → Mashq to'plami → Boshqarish):** 30 kunga 50 000 so'm. Har darsdan keyin talaba bilmagan so'zlarni qo'shasiz: **Yangi to'plam** → so'zlarni har qatorga bittadan yozing (`so'z = ma'no | misol | tarjima`, yoki faqat so'zlarning o'zi). Ma'nolarni o'zingiz yozing yoki **AI bilan to'ldiring**: so'rovni nusxalab Claude'ga qo'ying, javobni qaytarib qo'ying (faqat sizning so'zlaringiz qoladi). Lexora ulardan bitta mashq sahifasini tuzadi: so'zlar ro'yxati (ovozli), kartochkalar, viktorina, vaqtli test, moslashtirish va imlo o'yinlari. Uni faqat o'sha talaba ko'radi va HTML fayl qilib yuklab olishi mumkin.
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
21. **Muhim:** bu bo'limlar ishlashi uchun yangi `firestore.rules` ni Firebase'ga qo'ying (yuqoridagi "Yangilash: xavfsizlik qoidalari"). Yangi tekshiruvlar: `tests/centre.test.mjs`.

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

