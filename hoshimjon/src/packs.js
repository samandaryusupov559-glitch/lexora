/* ===== TIL PAKETLARI: ingliz tilidan boshqa tillar uchun NPC darslari =====
   Stsenariy hamma tilda bir xil (SCEN): har bir tugunda NPC gapi, to'g'ri javob va ikkita noto'g'ri javob.
   Har bir til faqat o'z matnlarini beradi: 14 ta kalit so'z (KEYC tartibida), 10 ta tugun, 4 ta idle, UI matnlari.
   Yangi til qo'shish: defPack('Til', 'xx-XX', kalitlar, ui, k => ({ nodes, idle })). Kalit so'zlar gapda k[i] bilan {} ichiga olinadi. */
const UI_EN = { memo: 'Nice to see you again! Do you still remember {%}?', memoYes: 'Yes, I do.', first: "Let's review your words. ", next: 'Next one. ', what: 'What does {%} mean?' };
let UI = UI_EN;
const PACKS = {};
const WHYS = { bye: "Bu xayrlashish iborasi, hozir uning o'rni emas.", greet: "Bu salomlashish, savolga javob emas.", off: "Javob savolga mos emas.", silly: "Mantiqsiz javob: savol mazmuniga mos kelmaydi." };
/* 14 ta kalit so'z: o'zbekcha ma'no va izoh hamma tilda bir xil */
const KEYC = [
  ['Xayrli tong', "Ertalab salomlashish iborasi. Kunning boshqa vaqtlarida boshqa salomlar ishlatiladi."],
  ['non', "Kundalik oziq-ovqat so'zi. Do'konda buyurtma berishda ishlatiladi."],
  ['yana biror narsa', "Xizmat ko'rsatuvchining odatiy savoli. Rad etish: rahmat, hammasi shu."],
  ['Ismingiz nima?', "Tanishuvdagi asosiy savol. Javob: mening ismim ... ."],
  ['Tanishganimdan xursandman', "Birinchi uchrashuvda aytiladigan odobli ibora."],
  ['Siz qayerdansiz?', "Davlat yoki shahar haqida savol. Javob: men ... danman."],
  ['xona', "Mehmonxona va hostelda ishlatiladigan asosiy so'z."],
  ['kalit', "Xona kaliti. Mehmonxonada uzatayotganda ishlatiladi."],
  ["to'g'riga", "Yo'l ko'rsatishda ishlatiladi: to'g'riga yuring."],
  ['chapga', "Yo'nalish: chapga; teskarisi - o'ngga."],
  ["sevimli mashg'ulot", "Suhbatda tanishish uchun mashhur mavzu: mening sevimli mashg'ulotim ... ."],
  ['kutubxona', "Kitob o'qiladigan joy."],
  ['har kuni', "Takrorlanish: har kuni. Til o'rganishda muhim."],
  ['yordam bermoq', "Yordam taklif qilish iborasi."]
];
/* stsenariy: [NPC gapi, to'g'ri javob, noto'g'ri 1 (+turi), noto'g'ri 2 (+turi)] o'zbekcha */
const SCEN = [
  ['farid', ["Xayrli tong! Nima xohlaysiz?", "Menga non, iltimos.", "Xayr!", 'bye', "Mening ismim Ali.", 'off']],
  ['farid', ["Mana nonningiz. Yana biror narsa kerakmi?", "Yo'q, rahmat. Hammasi shu.", "Xayrli tong!", 'greet', "Ha, men o'qituvchiman.", 'off']],
  ['maya', ["Salom! Ismingiz nima?", "Mening ismim Sam.", "Yaxshiman, rahmat.", 'off', "Menga non kerak.", 'off']],
  ['maya', ["Tanishganimdan xursandman! Qayerdansiz?", "Men O'zbekistondanman.", "Yaxshiman, rahmat.", 'off', "Xayr!", 'bye']],
  ['elena', ["Xush kelibsiz! Sizga xona kerakmi?", "Ha, bir kechalik xona, iltimos.", "Yo'q, menga non kerak.", 'silly', "Xayrli kech!", 'greet']],
  ['elena', ["Mana kalitingiz. Dam olishingiz yoqimli bo'lsin!", "Rahmat!", "Nonim qani?", 'silly', "Ha, marhamat.", 'off']],
  ['keeper', ["Salom! Adashdingizmi? Yordam bera olamanmi?", "Ha, iltimos. Bekat qayerda?", "Yo'q, men bekatman.", 'silly', "Mening ismim Sam.", 'off']],
  ['keeper', ["To'g'riga yuring, keyin chapga buriling.", "Katta rahmat!", "Xayrli tong!", 'greet', "Ha, men to'g'riman.", 'silly']],
  ['leo', ["Salom! Men Leoman. Sevimli mashg'ulotingiz nima?", "Mening sevimli mashg'ulotim - kitob o'qish.", "Ha, men hobbiman.", 'silly', "Yaxshiman.", 'off']],
  ['noor', ["Kutubxonaga xush kelibsiz! Yangi so'zlarni har kuni o'rganasizmi?", "Ha, har kuni.", "Xayr!", 'bye', "Yo'q, men kutubxonaman.", 'silly']]
];
const IDLE_UZ = { farid: ["Salom! Bizda har kuni yangi non bor.", "Rahmat. Xayr."], maya: ["Salom! Keyinroq keling, qahva tayyor bo'ladi.", "Yaxshi, rahmat."], elena: ["Salom! Bizda bo'sh xona bor.", "Rahmat. Xayr."], keeper: ["Salom! Men har bir ko'chani bilaman.", "Rahmat. Xayr."] };
/* nodes[i] = [say, ok, w1, w2] ; idle = [[say, reply] x4: farid, maya, elena, keeper] */
function defPack(lang, voice, keys, ui, build) {
  const k = keys.map(x => '{' + x + '}'), b = build(k);
  PACKS[lang] = { voice, keys, ui: Object.assign({}, UI_EN, ui), nodes: b.nodes, idle: b.idle };
}
function packLex(P) {
  const lex = {}, said = P.nodes.map(n => n[0]);
  P.keys.forEach((key, i) => {
    const ex = (said.find(s => s.indexOf('{' + key + '}') >= 0) || '').replace(/[{}]/g, '');
    lex[key] = { uz: KEYC[i][0], g: KEYC[i][1], ex };
  });
  return lex;
}
function packTree(P, id) {
  const idx = []; SCEN.forEach((s, i) => { if (s[0] === id) idx.push(i); });
  const tree = {};
  idx.forEach((si, j) => {
    const u = SCEN[si][1], t = P.nodes[si], last = j === idx.length - 1;
    tree['n' + (j + 1)] = { say: t[0], uz: u[0], choices: shuffle([
      { t: t[1], uz: u[1], ok: true, next: last ? 'END' : 'n' + (j + 2) },
      { t: t[2], uz: u[2], ok: false, why: WHYS[u[3]] },
      { t: t[3], uz: u[4], ok: false, why: WHYS[u[5]] }]) };
  });
  return tree;
}

defPack('Russian', 'ru-RU', ['Доброе утро', 'хлеб', 'что-нибудь ещё', 'Как вас зовут', 'Очень приятно', 'Откуда вы', 'комната', 'ключ', 'прямо', 'налево', 'хобби', 'библиотека', 'каждый день', 'помочь'],
  { memo: 'Рад снова вас видеть! Вы ещё помните {%}?', memoYes: 'Да, помню.', first: 'Повторим ваши слова. ', next: 'Следующее. ', what: 'Что значит {%}?' },
  k => ({
    nodes: [
      [`${k[0]}! Что вы хотите?`, 'Мне, пожалуйста, хлеб.', 'До свидания!', 'Меня зовут Али.'],
      [`Вот ваш ${k[1]}. ${k[2]}?`, 'Нет, спасибо. Всё.', 'Доброе утро!', 'Да, я учитель.'],
      [`Привет! ${k[3]}?`, 'Меня зовут Сэм.', 'У меня всё хорошо, спасибо.', 'Я хочу хлеб.'],
      [`${k[4]}! ${k[5]}?`, 'Я из Узбекистана.', 'У меня всё хорошо, спасибо.', 'До свидания!'],
      [`Добро пожаловать! Вам нужна ${k[6]}?`, 'Да, комната на одну ночь, пожалуйста.', 'Нет, мне нужен хлеб.', 'Добрый вечер!'],
      [`Вот ваш ${k[7]}. Приятного отдыха!`, 'Спасибо!', 'Где мой хлеб?', 'Да, пожалуйста.'],
      [`Здравствуйте! Вы потерялись? Могу я вам ${k[13]}?`, 'Да, пожалуйста. Где вокзал?', 'Нет, я вокзал.', 'Меня зовут Сэм.'],
      [`Идите ${k[8]}, потом ${k[9]}.`, 'Большое спасибо!', 'Доброе утро!', 'Да, я прямо.'],
      [`Привет! Я Лео. Какое у вас ${k[10]}?`, 'Моё хобби — чтение.', 'Да, я хобби.', 'У меня всё хорошо.'],
      [`Это наша ${k[11]}. Вы учите новые слова ${k[12]}?`, 'Да, каждый день.', 'До свидания!', 'Нет, я библиотека.']
    ],
    idle: [[`Здравствуйте! У нас свежий ${k[1]} каждый день.`, 'Спасибо. До свидания.'], ['Здравствуйте! Заходите позже, будет кофе.', 'Хорошо, спасибо.'], [`Здравствуйте! У нас есть свободная ${k[6]}.`, 'Спасибо. До свидания.'], ['Здравствуйте! Я знаю каждую улицу.', 'Спасибо. До свидания.']]
  }));

defPack('German', 'de-DE', ['Guten Morgen', 'Brot', 'noch etwas', 'Wie heißen Sie', 'Freut mich', 'Woher kommen Sie', 'Zimmer', 'Schlüssel', 'geradeaus', 'links', 'Hobby', 'Bibliothek', 'jeden Tag', 'helfen'],
  { memo: 'Schön, Sie wiederzusehen! Wissen Sie noch, was {%} bedeutet?', memoYes: 'Ja, ich weiß es noch.', first: 'Wiederholen wir Ihre Wörter. ', next: 'Das nächste. ', what: 'Was bedeutet {%}?' },
  k => ({
    nodes: [
      [`${k[0]}! Was möchten Sie?`, 'Ich möchte Brot, bitte.', 'Auf Wiedersehen!', 'Ich heiße Ali.'],
      [`Hier ist Ihr ${k[1]}. Möchten Sie ${k[2]}?`, 'Nein, danke. Das ist alles.', 'Guten Morgen!', 'Ja, ich bin Lehrer.'],
      [`Hallo! ${k[3]}?`, 'Ich heiße Sam.', 'Mir geht es gut, danke.', 'Ich möchte Brot.'],
      [`${k[4]}! ${k[5]}?`, 'Ich komme aus Usbekistan.', 'Mir geht es gut, danke.', 'Auf Wiedersehen!'],
      [`Willkommen! Brauchen Sie ein ${k[6]}?`, 'Ja, ein Zimmer für eine Nacht, bitte.', 'Nein, ich möchte Brot.', 'Guten Abend!'],
      [`Hier ist Ihr ${k[7]}. Schönen Aufenthalt!`, 'Danke schön!', 'Wo ist mein Brot?', 'Ja, bitte.'],
      [`Guten Tag! Sind Sie verloren? Kann ich Ihnen ${k[13]}?`, 'Ja, bitte. Wo ist der Bahnhof?', 'Nein, ich bin ein Bahnhof.', 'Ich heiße Sam.'],
      [`Gehen Sie ${k[8]}, dann ${k[9]}.`, 'Vielen Dank!', 'Guten Morgen!', 'Ja, ich bin geradeaus.'],
      [`Hallo! Ich bin Leo. Was ist Ihr ${k[10]}?`, 'Mein Hobby ist Lesen.', 'Ja, ich bin ein Hobby.', 'Mir geht es gut.'],
      [`Das ist unsere ${k[11]}. Lernen Sie neue Wörter ${k[12]}?`, 'Ja, jeden Tag.', 'Auf Wiedersehen!', 'Nein, ich bin eine Bibliothek.']
    ],
    idle: [[`Guten Tag! Wir haben jeden Tag frisches ${k[1]}.`, 'Danke. Auf Wiedersehen.'], ['Guten Tag! Kommen Sie später wieder, dann gibt es Kaffee.', 'Gut, danke.'], [`Guten Tag! Wir haben ein freies ${k[6]}.`, 'Danke. Auf Wiedersehen.'], ['Guten Tag! Ich kenne jede Straße hier.', 'Danke. Auf Wiedersehen.']]
  }));

defPack('Turkish', 'tr-TR', ['Günaydın', 'ekmek', 'başka bir şey', 'Adınız ne', 'Memnun oldum', 'Nerelisiniz', 'oda', 'anahtar', 'düz', 'sola', 'hobi', 'kütüphane', 'her gün', 'yardım'],
  { memo: 'Sizi tekrar görmek güzel! {%} kelimesini hâlâ hatırlıyor musunuz?', memoYes: 'Evet, hatırlıyorum.', first: 'Kelimelerinizi tekrar edelim. ', next: 'Sıradaki. ', what: '{%} ne demek?' },
  k => ({
    nodes: [
      [`${k[0]}! Ne istersiniz?`, 'Ekmek istiyorum, lütfen.', 'Hoşça kalın!', 'Benim adım Ali.'],
      [`Buyurun, ${k[1]}. ${k[2]} ister misiniz?`, 'Hayır, teşekkürler. Hepsi bu kadar.', 'Günaydın!', 'Evet, ben öğretmenim.'],
      [`Merhaba! ${k[3]}?`, 'Benim adım Sam.', 'İyiyim, teşekkürler.', 'Ekmek istiyorum.'],
      [`${k[4]}! ${k[5]}?`, 'Özbekistanlıyım.', 'İyiyim, teşekkürler.', 'Hoşça kalın!'],
      [`Hoş geldiniz! Bir ${k[6]} ister misiniz?`, 'Evet, bir gecelik bir oda lütfen.', 'Hayır, ekmek istiyorum.', 'İyi akşamlar!'],
      [`İşte ${k[7]}. İyi konaklamalar!`, 'Teşekkür ederim!', 'Ekmeğim nerede?', 'Evet, lütfen.'],
      [`Merhaba! Kayboldunuz mu? Size ${k[13]} edebilir miyim?`, 'Evet, lütfen. İstasyon nerede?', 'Hayır, ben bir istasyonum.', 'Benim adım Sam.'],
      [`${k[8]} gidin, sonra ${k[9]} dönün.`, 'Çok teşekkür ederim!', 'Günaydın!', 'Evet, ben düzüm.'],
      [`Merhaba! Ben Leo. Sizin ${k[10]}niz nedir?`, 'Hobim kitap okumak.', 'Evet, ben bir hobiyim.', 'İyiyim.'],
      [`Burası bizim ${k[11]}miz. Yeni kelimeleri ${k[12]} öğreniyor musunuz?`, 'Evet, her gün.', 'Hoşça kalın!', 'Hayır, ben bir kütüphaneyim.']
    ],
    idle: [[`Merhaba! Her gün taze ${k[1]} var.`, 'Teşekkürler. Hoşça kalın.'], ['Merhaba! Sonra tekrar gelin, kahve hazır olur.', 'Tamam, teşekkürler.'], [`Merhaba! Boş bir ${k[6]} var.`, 'Teşekkürler. Hoşça kalın.'], ['Merhaba! Buradaki her sokağı bilirim.', 'Teşekkürler. Hoşça kalın.']]
  }));

defPack('Spanish', 'es-ES', ['Buenos días', 'pan', 'algo más', '¿Cómo se llama?', 'Mucho gusto', '¿De dónde es?', 'habitación', 'llave', 'todo recto', 'a la izquierda', 'pasatiempo', 'biblioteca', 'todos los días', 'ayudar'],
  { memo: '¡Qué bueno verle otra vez! ¿Todavía recuerda {%}?', memoYes: 'Sí, lo recuerdo.', first: 'Repasemos sus palabras. ', next: 'La siguiente. ', what: '¿Qué significa {%}?' },
  k => ({
    nodes: [
      [`¡${k[0]}! ¿Qué desea?`, 'Quiero pan, por favor.', '¡Adiós!', 'Me llamo Ali.'],
      [`Aquí tiene su ${k[1]}. ¿Desea ${k[2]}?`, 'No, gracias. Eso es todo.', '¡Buenos días!', 'Sí, soy profesor.'],
      [`¡Hola! ${k[3]}`, 'Me llamo Sam.', 'Estoy bien, gracias.', 'Quiero pan.'],
      [`¡${k[4]}! ${k[5]}`, 'Soy de Uzbekistán.', 'Estoy bien, gracias.', '¡Adiós!'],
      [`¡Bienvenido! ¿Necesita una ${k[6]}?`, 'Sí, una habitación para una noche, por favor.', 'No, quiero pan.', '¡Buenas noches!'],
      [`Aquí está su ${k[7]}. ¡Buena estancia!`, '¡Muchas gracias!', '¿Dónde está mi pan?', 'Sí, por favor.'],
      [`¡Hola! ¿Está perdido? ¿Puedo ${k[13]}le?`, 'Sí, por favor. ¿Dónde está la estación?', 'No, yo soy una estación.', 'Me llamo Sam.'],
      [`Siga ${k[8]} y gire ${k[9]}.`, '¡Muchas gracias!', '¡Buenos días!', 'Sí, estoy todo recto.'],
      [`¡Hola! Soy Leo. ¿Cuál es su ${k[10]}?`, 'Mi pasatiempo es leer.', 'Sí, soy un pasatiempo.', 'Estoy bien.'],
      [`Esta es nuestra ${k[11]}. ¿Aprende palabras nuevas ${k[12]}?`, 'Sí, todos los días.', '¡Adiós!', 'No, soy una biblioteca.']
    ],
    idle: [[`¡Hola! Tenemos ${k[1]} fresco todos los días.`, 'Gracias. Adiós.'], ['¡Hola! Vuelva más tarde, habrá café.', 'Bien, gracias.'], [`¡Hola! Tenemos una ${k[6]} libre.`, 'Gracias. Adiós.'], ['¡Hola! Conozco cada calle de aquí.', 'Gracias. Adiós.']]
  }));

defPack('Korean', 'ko-KR', ['좋은 아침이에요', '빵', '더 필요하세요?', '이름이 뭐예요?', '만나서 반갑습니다', '어디에서 왔어요?', '방', '열쇠', '직진', '왼쪽', '취미', '도서관', '매일', '도와드릴까요?'],
  { memo: '다시 만나서 반가워요! {%}의 뜻을 아직 기억하세요?', memoYes: '네, 기억해요.', first: '단어를 복습해 봐요. ', next: '다음 단어. ', what: '{%}는 무슨 뜻이에요?' },
  k => ({
    nodes: [
      [`${k[0]}! 뭘 드릴까요?`, '빵 주세요.', '안녕히 계세요!', '제 이름은 알리예요.'],
      [`여기 ${k[1]} 있어요. ${k[2]}`, '아니요, 괜찮아요. 감사합니다.', '좋은 아침이에요!', '네, 저는 선생님이에요.'],
      [`안녕하세요! ${k[3]}`, '제 이름은 샘이에요.', '잘 지내요, 감사합니다.', '빵 주세요.'],
      [`${k[4]}! ${k[5]}`, '저는 우즈베키스탄에서 왔어요.', '잘 지내요, 감사합니다.', '안녕히 계세요!'],
      [`어서 오세요! ${k[6]}이 필요하세요?`, '네, 하룻밤 방 하나 주세요.', '아니요, 빵이 필요해요.', '안녕히 주무세요!'],
      [`여기 ${k[7]}예요. 즐거운 시간 되세요!`, '감사합니다!', '제 빵은 어디에 있어요?', '네, 주세요.'],
      [`안녕하세요! 길을 잃으셨어요? ${k[13]}`, '네, 부탁해요. 역이 어디예요?', '아니요, 저는 역이에요.', '제 이름은 샘이에요.'],
      [`${k[8]}하고 ${k[9]}으로 가세요.`, '정말 감사합니다!', '좋은 아침이에요!', '네, 저는 직진이에요.'],
      [`안녕하세요! 저는 레오예요. ${k[10]}가 뭐예요?`, '제 취미는 독서예요.', '네, 저는 취미예요.', '잘 지내요.'],
      [`여기는 우리 ${k[11]}이에요. 새 단어를 ${k[12]} 공부하세요?`, '네, 매일 공부해요.', '안녕히 계세요!', '아니요, 저는 도서관이에요.']
    ],
    idle: [[`안녕하세요! 매일 신선한 ${k[1]}이 있어요.`, '감사합니다. 안녕히 계세요.'], ['안녕하세요! 나중에 다시 오세요. 커피가 있어요.', '네, 감사합니다.'], [`안녕하세요! 빈 ${k[6]}이 있어요.`, '감사합니다. 안녕히 계세요.'], ['안녕하세요! 저는 이곳의 모든 길을 알아요.', '감사합니다. 안녕히 계세요.']]
  }));

defPack('Chinese', 'zh-CN', ['早上好', '面包', '还要别的吗', '你叫什么名字', '很高兴认识你', '你是哪国人', '房间', '钥匙', '一直走', '左转', '爱好', '图书馆', '每天', '帮'],
  { memo: '很高兴再见到你！你还记得{%}是什么意思吗？', memoYes: '是的，我记得。', first: '我们来复习你的单词。', next: '下一个。', what: '{%}是什么意思？' },
  k => ({
    nodes: [
      [`${k[0]}！你要什么？`, '我要面包，谢谢。', '再见！', '我叫阿里。'],
      [`这是你的${k[1]}。${k[2]}？`, '不用了，谢谢。', '早上好！', '是的，我是老师。'],
      [`你好！${k[3]}？`, '我叫山姆。', '我很好，谢谢。', '我要面包。'],
      [`${k[4]}！${k[5]}？`, '我是乌兹别克斯坦人。', '我很好，谢谢。', '再见！'],
      [`欢迎！你需要${k[6]}吗？`, '是的，我要一个房间，住一晚。', '不，我要面包。', '晚上好！'],
      [`这是你的${k[7]}。祝你住得愉快！`, '谢谢！', '我的面包在哪儿？', '是的，请。'],
      [`你好！你迷路了吗？需要我${k[13]}你吗？`, '是的，请问车站在哪儿？', '不，我是车站。', '我叫山姆。'],
      [`${k[8]}，然后${k[9]}。`, '非常感谢！', '早上好！', '是的，我是一直走。'],
      [`你好！我是莱奥。你的${k[10]}是什么？`, '我的爱好是看书。', '是的，我是爱好。', '我很好。'],
      [`这是我们的${k[11]}。你${k[12]}学新单词吗？`, '是的，每天学。', '再见！', '不，我是图书馆。']
    ],
    idle: [[`你好！我们每天都有新鲜的${k[1]}。`, '谢谢。再见。'], ['你好！请晚点再来，会有咖啡。', '好的，谢谢。'], [`你好！我们有空的${k[6]}。`, '谢谢。再见。'], ['你好！我熟悉这里的每一条街。', '谢谢。再见。']]
  }));

defPack('Japanese', 'ja-JP', ['おはようございます', 'パン', 'ほかに', 'お名前は？', 'はじめまして', 'どこから来ましたか', '部屋', '鍵', 'まっすぐ', '左', '趣味', '図書館', '毎日', 'お手伝い'],
  { memo: 'またお会いできてうれしいです！{%}の意味をまだ覚えていますか？', memoYes: 'はい、覚えています。', first: '言葉を復習しましょう。', next: '次です。', what: '{%}はどういう意味ですか？' },
  k => ({
    nodes: [
      [`${k[0]}！何にしますか？`, 'パンをください。', 'さようなら！', '私の名前はアリです。'],
      [`はい、${k[1]}です。${k[2]}何かありますか？`, 'いいえ、大丈夫です。ありがとう。', 'おはようございます！', 'はい、私は先生です。'],
      [`こんにちは！${k[3]}`, '私の名前はサムです。', '元気です、ありがとう。', 'パンをください。'],
      [`${k[4]}！${k[5]}？`, 'ウズベキスタンから来ました。', '元気です、ありがとう。', 'さようなら！'],
      [`いらっしゃいませ！${k[6]}が必要ですか？`, 'はい、一泊の部屋をお願いします。', 'いいえ、パンがほしいです。', 'こんばんは！'],
      [`こちらが${k[7]}です。ごゆっくりどうぞ！`, 'ありがとうございます！', '私のパンはどこですか？', 'はい、お願いします。'],
      [`こんにちは！道に迷いましたか？${k[13]}しましょうか？`, 'はい、お願いします。駅はどこですか？', 'いいえ、私は駅です。', '私の名前はサムです。'],
      [`${k[8]}行って、${k[9]}に曲がってください。`, 'どうもありがとうございます！', 'おはようございます！', 'はい、私はまっすぐです。'],
      [`こんにちは！私はレオです。${k[10]}は何ですか？`, '私の趣味は読書です。', 'はい、私は趣味です。', '元気です。'],
      [`ここは私たちの${k[11]}です。新しい言葉を${k[12]}勉強しますか？`, 'はい、毎日勉強します。', 'さようなら！', 'いいえ、私は図書館です。']
    ],
    idle: [[`こんにちは！毎日新しい${k[1]}があります。`, 'ありがとう。さようなら。'], ['こんにちは！あとでまた来てください。コーヒーがあります。', 'はい、ありがとう。'], [`こんにちは！空いている${k[6]}があります。`, 'ありがとう。さようなら。'], ['こんにちは！私はこの町の道をすべて知っています。', 'ありがとう。さようなら。']]
  }));

/* ---- almashtirish ---- */
const BASE = { lex: Object.assign({}, LEX), npc: NPCS.map(n => ({ tree: n.tree, idle: n.idle })), topics: Object.assign({}, TOPICS) };
function usePack(lang) {
  const k = PACKS[lang] ? lang : 'English';
  if (k === PACK) return false;
  PACK = k; const P = PACKS[k];
  Object.keys(LEX).forEach(x => delete LEX[x]); Object.assign(LEX, k === 'English' ? BASE.lex : packLex(P));
  const ids = ['farid', 'maya', 'elena', 'keeper'];
  NPCS.forEach((n, i) => {
    if (k === 'English') { n.tree = BASE.npc[i].tree; n.idle = BASE.npc[i].idle; return; }
    n.tree = packTree(P, n.id);
    const j = ids.indexOf(n.id);
    n.idle = j >= 0 ? { say: P.idle[j][0], uz: IDLE_UZ[n.id][0], reply: P.idle[j][1], replyUz: IDLE_UZ[n.id][1] } : BASE.npc[i].idle;
  });
  Object.keys(TOPICS).forEach(x => delete TOPICS[x]); if (k === 'English') Object.assign(TOPICS, BASE.topics);
  UI = k === 'English' ? UI_EN : P.ui;
  S.saved = store.get(SKEY(), {}); loadProg(); S.chapter = 1; S.hearts = 3; S.mistakes = 0;
  renderHud();
  return true;
}
const speakLang = () => (PACKS[PACK] && PACKS[PACK].voice) || 'en-US';
