/* Marshrutlash va bosh sahifa */
function homePage() {
  Sound.stopMusic();
  const nT = S.testSections.reduce((n, s) => n + s.questions.length, 0);
  const nW = S.writtenSections.reduce((n, s) => n + s.questions.length, 0);
  const nB = S.bookSections.reduce((n, s) => n + s.books.length, 0);
  view(`<section class="hero">
      <div class="herotext">
        <h1>MED <span>ASISTANT</span></h1>
        <p>Tibbiyot talabalari va shifokorlar uchun bilim platformasi: testlar, yozma savollar, o'yinlar, kitoblar va sun'iy intellektli anamnez yordamchisi.</p>
        <div class="row"><a class="btn big" href="#/tests">Bilimni sinash</a><a class="btn big ghost light" href="#/games">O'yinlar 🎮</a></div>
        <small class="offl">📴 Internetsiz ham ishlaydi · 📱 Telefonga o'rnatish mumkin</small>
      </div>
      <div class="heroart"><div class="pulse"></div><img src="icon.svg" alt=""></div>
    </section>
    <section class="page">
      <h2>1. Bilimni sinash</h2>
      <div class="grid">
        <a class="card feat" href="#/tests"><div class="fi">📝</div><h3>Test</h3><p>4 variantli testlar, vaqt cheklovi, bo'limlar. ${nT} ta savol.</p></a>
        <a class="card feat" href="#/written"><div class="fi">✍️</div><h3>Yozma</h3><p>Savolga javob yozing va to'g'ri javob bilan solishtiring. ${nW} ta savol.</p></a>
        <a class="card feat" href="#/games"><div class="fi">🎮</div><h3>O'yin shaklida</h3><p>Zakovat, Bilimlar bellashuvi va Shifo sayohati.</p></a>
      </div>
      <h2>2. O'qish va bilimlarni oshirish</h2>
      <div class="grid"><a class="card feat" href="#/books"><div class="fi">📚</div><h3>Kitoblar</h3><p>${S.bookSections.length} ta bo'limcha, ${nB} ta kitob.</p></a></div>
      <h2>3. Anamnez bosqichi</h2>
      <div class="grid"><a class="card feat" href="#/anamnez"><div class="fi">🩺</div><h3>AI anamnez</h3><p>Bemor ma'lumotlarini kiriting — ehtimoliy tashxislar va sabablari. (AI qismi uchun internet kerak.)</p></a></div>
    </section>`);
}

function route() {
  Cleanup.run(); closeModal();
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  const [r, a] = parts;
  $$('#mainnav a').forEach(x => x.classList.toggle('on', x.dataset.r === (r === 'test' ? 'tests' : r === 'game' ? 'games' : r || '')));
  $('#mainnav').classList.remove('open');
  if (!['game', 'games', 'admin'].includes(r)) Sound.stopMusic();
  switch (r) {
    case 'tests': return Study.testsHome();
    case 'test': return Study.runTest(a);
    case 'written': return a ? Study.runWritten(a) : Study.writtenHome();
    case 'games': return Games.home();
    case 'game': return a === 'zakovat' ? Games.zakovatSetup() : a === 'kahoot' ? Games.kahootSetup() : a === 'quiz' ? Games.quizSetup() : Games.home();
    case 'books': return Books.home(a);
    case 'anamnez': return Anamnez.home();
    case 'admin': return Admin.home();
    default: return homePage();
  }
}

function netStatus() {
  const el = $('#netstatus');
  el.textContent = navigator.onLine ? '● Onlayn' : '● Oflayn';
  el.className = 'net ' + (navigator.onLine ? 'on' : 'off');
}

(async function init() {
  try { await loadState(); }
  catch (e) { console.error(e); view('<div class="page"><div class="empty">Ma\'lumotlar omborini ochib bo\'lmadi. Brauzer IndexedDB ni qo\'llab-quvvatlashi kerak.</div></div>'); return; }
  const sb = $('#soundbtn');
  sb.textContent = Sound.isMuted() ? '🔇' : '🔊';
  sb.onclick = () => { sb.textContent = Sound.toggle() ? '🔇' : '🔊'; };
  $('#menubtn').onclick = () => $('#mainnav').classList.toggle('open');
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  addEventListener('online', netStatus); addEventListener('offline', netStatus); netStatus();
  addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW', e));
})();
