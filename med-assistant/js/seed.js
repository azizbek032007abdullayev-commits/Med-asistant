/* Boshlang'ich namunaviy ma'lumotlar (admin o'chirib, o'zinikini kiritishi mumkin) */
function makeSeed() {
  const s = makeEmpty();
  const m = (q, o, a) => ({ id: uid(), q, options: o, answer: a });
  const w = (q, a) => ({ id: uid(), q, a });

  s.testSections = [
    { id: uid(), name: 'Anatomiya', timeMin: 10, count: 5, questions: [
      m("Odam tanasidagi eng uzun suyak qaysi?", ["Yelka suyagi", "Son suyagi", "Katta boldir suyagi", "Bilak suyagi"], 1),
      m("Bosh miya nervlari necha juft?", ["10 juft", "12 juft", "31 juft", "8 juft"], 1),
      m("Odam tanasidagi eng katta organ qaysi?", ["Jigar", "O'pka", "Teri", "Miya"], 2),
      m("Yurak necha kameradan iborat?", ["2", "3", "4", "5"], 2),
      m("Insulin qaysi a'zoda ishlab chiqariladi?", ["Jigar", "Oshqozon osti bezi", "Buyrak usti bezi", "Qalqonsimon bez"], 1),
      m("Umurtqa pog'onasining bo'yin qismida nechta umurtqa bor?", ["5", "7", "12", "4"], 1),
    ]},
    { id: uid(), name: 'Fiziologiya', timeMin: 8, count: 5, questions: [
      m("Eritrotsitlarning o'rtacha yashash davri qancha?", ["30 kun", "60 kun", "120 kun", "365 kun"], 2),
      m("Gemoglobin tarkibidagi asosiy metall qaysi?", ["Mis", "Temir", "Rux", "Magniy"], 1),
      m("Kattalarda tinch holatdagi normal yurak urish soni?", ["40–50", "60–100", "110–140", "150–180"], 1),
      m("Qonning qaysi hujayralari ivishda asosiy rol o'ynaydi?", ["Eritrotsitlar", "Leykotsitlar", "Trombotsitlar", "Limfotsitlar"], 2),
      m("Nafas markazi qayerda joylashgan?", ["Uzunchoq miyada", "Miyachada", "Bosh miya po'stlog'ida", "Orqa miyada"], 0),
    ]},
    { id: uid(), name: 'Farmakologiya', timeMin: 8, count: 4, questions: [
      m("Paratsetamol qaysi guruhga kiradi?", ["Antibiotik", "Analgetik-antipiretik", "Antikoagulyant", "Diuretik"], 1),
      m("Geparin qanday ta'sirga ega?", ["Antikoagulyant", "Gipotenziv", "Antibakterial", "Antigistamin"], 0),
      m("Furosemid qaysi guruhga kiradi?", ["Beta-blokator", "Diuretik", "Statin", "Kortikosteroid"], 1),
      m("Anafilaktik shokda birinchi navbatda yuboriladigan dori?", ["Adrenalin", "Atropin", "Diazepam", "Insulin"], 0),
    ]},
  ];

  s.writtenSections = [
    { id: uid(), name: 'Klinik tushunchalar', count: 5, questions: [
      w("Anamnez nima?", "Bemor so'rab-surishtirilganda olinadigan kasallik va hayot tarixi haqidagi ma'lumotlar yig'indisi."),
      w("Taxikardiya deb nimaga aytiladi?", "Kattalarda tinch holatda yurak urish sonining daqiqasiga 100 dan ortiq bo'lishi."),
      w("Normal arterial bosim ko'rsatkichi qancha?", "Taxminan 120/80 mm sim. ust. (optimal: 120/80 dan past)."),
      w("Miokard infarktining eng spesifik laborator markeri?", "Yurak troponinlari (troponin I yoki T)."),
      w("S vitamini yetishmovchiligida qanday kasallik rivojlanadi?", "Singa (skorbut)."),
      w("Qon guruhlarini aniqlashning asosiy tizimi?", "AB0 tizimi va Rezus omil."),
    ]},
  ];

  s.games.zakovat = [
    w("Bu suyak tanadagi eng kichik suyak bo'lib, o'rta quloqda joylashgan. U qanday nomlanadi?", "Uzangi (stapes)."),
    w("Ibn Sinoning tibbiyotga oid mashhur ko'p jildli asari qanday nomlanadi?", "«Tib qonunlari» (Al-Qonun fi-t-tib)."),
    w("Penitsillinni 1928-yilda kim kashf etgan?", "Aleksandr Fleming."),
    w("Qaysi vitamin quyosh nuri ta'sirida terida hosil bo'ladi?", "D vitamini."),
    w("Qon aylanishining ikki doirasini birinchi bo'lib batafsil tasvirlagan ingliz shifokori kim?", "Uilyam Garvey."),
  ];
  s.games.kahoot = [
    m("Qaysi a'zo safro ishlab chiqaradi?", ["Jigar", "Taloq", "Oshqozon", "Buyrak"], 0),
    m("Odamda nechta doimiy tish bo'ladi?", ["28", "30", "32", "36"], 2),
    m("Qaysi qon guruhi 'universal donor' hisoblanadi?", ["A(II)", "B(III)", "AB(IV)", "0(I)"], 3),
    m("Normal tana harorati taxminan qancha?", ["35.0 °C", "36.6 °C", "37.8 °C", "38.5 °C"], 1),
    m("Qaysi gormon 'stress gormoni' deb ataladi?", ["Kortizol", "Insulin", "Melatonin", "Prolaktin"], 0),
  ];
  s.games.quiz = [
    m("Nafas olishda asosiy rol o'ynaydigan mushak?", ["Diafragma", "Deltasimon", "Ikki boshli", "Trapetsiyasimon"], 0),
    m("Buyrakning struktur-funksional birligi?", ["Alveola", "Nefron", "Neyron", "Atsinus"], 1),
    m("Ko'z gavharining shaklini o'zgartiruvchi tuzilma?", ["Kiprikli tana", "Shox parda", "Rangdor parda", "To'r parda"], 0),
    m("Qaysi hujayralar immunitetda antitana ishlab chiqaradi?", ["T-limfotsitlar", "B-limfotsitlar (plazmotsitlar)", "Eritrotsitlar", "Trombotsitlar"], 1),
    m("Yurakning tabiiy ritm boshqaruvchisi (pesmeyker)?", ["Sinus tugun", "Gis tutami", "Purkinye tolalari", "AV tugun"], 0),
    m("Odam tanasida nechta suyak bor (kattalarda)?", ["186", "206", "226", "306"], 1),
  ];

  s.bookSections = [
    { id: uid(), name: 'Anatomiya', books: [
      { id: uid(), title: "Odam anatomiyasi (namuna)", author: "", desc: "Admin bu yerga kitob faylini yuklashi mumkin.", url: "", fileId: "" },
    ]},
    { id: uid(), name: 'Ichki kasalliklar', books: [] },
    { id: uid(), name: 'Farmakologiya', books: [] },
  ];
  return s;
}
