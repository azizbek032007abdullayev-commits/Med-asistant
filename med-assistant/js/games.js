/* O'yinlar: Zakovat, Bilimlar bellashuvi (Kahoot uslubida), Shifo sayohati (animatsion viktorina) */
const CHARS = [
  { e: '🦊', n: 'Doktor Tulki', c: '#ff8a3d' }, { e: '🐼', n: 'Hamshira Panda', c: '#5c6b73' },
  { e: '🦉', n: 'Professor Boyqush', c: '#8d6e63' }, { e: '🐯', n: "Jarroh Yo'lbars", c: '#f4a259' },
  { e: '🐸', n: 'Farmatsevt Qurbaqa', c: '#43aa8b' }, { e: '🐨', n: 'Pediatr Koala', c: '#90a4ae' },
  { e: '🦁', n: 'Kardiolog Sher', c: '#e9c46a' }, { e: '🐙', n: 'Laborant Sakkizoyoq', c: '#c77dff' },
  { e: '🦄', n: 'Nevrolog Yagonashox', c: '#ff8fab' }, { e: '🐧', n: 'Stomatolog Pingvin', c: '#4cc9f0' },
  { e: '🐰', n: 'Terapevt Quyon', c: '#f08080' }, { e: '🐻', n: 'Travmatolog Ayiq', c: '#a47148' },
];
const avatar = (ci, size = '') => { const ch = CHARS[ci % CHARS.length]; return `<span class="ava ${size}" style="--c:${ch.c}"><span class="ae">${ch.e}</span><span class="acc">🩺</span></span>`; };
const TILES = [
  { cls: 't0', icon: '❤️' }, { cls: 't1', icon: '💊' }, { cls: 't2', icon: '🧬' }, { cls: 't3', icon: '🩸' },
];

function sourceList(kind) {
  // kind: 'mcq' yoki 'qa'
  if (kind === 'qa') return [
    { id: 'g:zakovat', name: `Zakovat savollari (${S.games.zakovat.length})`, qs: S.games.zakovat },
    ...S.writtenSections.map(s => ({ id: 'w:' + s.id, name: `Yozma: ${s.name} (${s.questions.length})`, qs: s.questions })),
  ];
  return [
    { id: 'g:kahoot', name: `Bellashuv savollari (${S.games.kahoot.length})`, qs: S.games.kahoot },
    { id: 'g:quiz', name: `Sayohat savollari (${S.games.quiz.length})`, qs: S.games.quiz },
    ...S.testSections.map(s => ({ id: 't:' + s.id, name: `Test: ${s.name} (${s.questions.length})`, qs: s.questions })),
  ];
}

const Games = {
  home() {
    Sound.music('lobby');
    view(`<section class="page">
      <div class="pagehead"><h1>🎮 O'yinlar</h1><p>Bilimlarni o'yin orqali sinang. Musiqa uchun 🔊 tugmasini yoqing.</p></div>
      <div class="grid games">
        <a class="gamecard zak" href="#/game/zakovat"><div class="gi">🧠</div><h3>Zakovat</h3><p>Jamoalar bellashuvi, 1 daqiqa o'ylash vaqti, ballar avtomatik hisoblanadi.</p></a>
        <a class="gamecard kah" href="#/game/kahoot"><div class="gi">🏁</div><h3>Bilimlar bellashuvi</h3><p>Personajni tanlang, tez va to'g'ri javob bering — eng ko'p ball to'plagan g'olib!</p></a>
        <a class="gamecard qz" href="#/game/quiz"><div class="gi">🚀</div><h3>Shifo sayohati</h3><p>Animatsion viktorina: to'g'ri javoblar bilan marragacha yeting, 3 ta hayot.</p></a>
      </div>
    </section>`);
  },

  /* ================= ZAKOVAT ================= */
  zakovatSetup() {
    Sound.music('zakovat');
    const srcs = sourceList('qa');
    view(`<section class="page dark zakbg">
      <div class="pagehead"><h1>🧠 Zakovat</h1><p>Jamoalar nomini kiriting va o'yinni boshlang.</p></div>
      <div class="card glass">
        <label>Jamoalar</label>
        <div id="teams"></div>
        <button class="btn ghost sm" id="addteam">+ Jamoa qo'shish</button>
        <div class="formgrid">
          <div><label>Savollar manbasi</label><select class="inp" id="src">${srcs.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
          <div><label>Savollar soni</label><input class="inp" type="number" id="cnt" value="10" min="1"></div>
          <div><label>Har savol uchun ball</label><input class="inp" type="number" id="pts" value="1" min="1"></div>
          <div><label>O'ylash vaqti (soniya)</label><input class="inp" type="number" id="tm" value="${S.settings.zakovatTime}" min="10"></div>
        </div>
        <label class="chk"><input type="checkbox" id="shuf" checked> Savollarni aralashtirish</label>
        <button class="btn big" id="go">O'yinni boshlash ▶</button>
      </div>
    </section>`);
    const teams = ['1-jamoa', '2-jamoa'];
    const drawTeams = () => {
      $('#teams').innerHTML = teams.map((t, i) => `<div class="row teamrow"><input class="inp" data-t="${i}" value="${esc(t)}"><button class="btn ghost sm" data-del="${i}">✕</button></div>`).join('');
      $$('[data-t]').forEach(inp => inp.oninput = () => teams[inp.dataset.t] = inp.value);
      $$('[data-del]').forEach(b => b.onclick = () => { if (teams.length > 1) { teams.splice(+b.dataset.del, 1); drawTeams(); } });
    };
    drawTeams();
    $('#addteam').onclick = () => { teams.push(`${teams.length + 1}-jamoa`); drawTeams(); };
    $('#go').onclick = () => {
      const src = srcs.find(s => s.id === $('#src').value);
      if (!src || !src.qs.length) return toast('Bu manbada savollar yo\'q', 'err');
      const n = +$('#cnt').value || 10;
      const qs = $('#shuf').checked ? pickRandom(src.qs, n) : src.qs.slice(0, n);
      const t = Math.max(10, +$('#tm').value || 60);
      S.settings.zakovatTime = t; saveState();
      Games.zakovatPlay(teams.map(n => ({ name: n.trim() || 'Jamoa', score: 0 })), qs, +$('#pts').value || 1, t);
    };
  },

  zakovatPlay(teams, qs, pts, T) {
    let idx = 0, phase = 'q', awarded = new Set(), timerId = null;
    Sound.sfx('start');
    const app = view(`<section class="page dark zakbg zakplay">
      <div class="scoreboard" id="sb"></div>
      <div class="zakstage" id="stage"></div>
    </section>`);
    const sb = () => {
      const max = Math.max(...teams.map(t => t.score));
      $('#sb').innerHTML = teams.map((t, i) => `<div class="team ${t.score === max && max > 0 ? 'lead' : ''} ${awarded.has(i) ? 'got' : ''}">
        <div class="tn">${esc(t.name)}</div><div class="ts">${t.score}</div>
        <div class="tadj"><button data-adj="${i}" data-v="-1">−</button><button data-adj="${i}" data-v="1">+</button></div></div>`).join('');
      $$('[data-adj]').forEach(b => b.onclick = () => { teams[b.dataset.adj].score = Math.max(0, teams[b.dataset.adj].score + +b.dataset.v); sb(); });
    };
    const stopTimer = () => { if (timerId) { clearInterval(timerId); timerId = null; } };
    Cleanup.add(stopTimer);
    const draw = () => {
      const q = qs[idx];
      $('#stage').innerHTML = `
        <div class="zakq card glass pop">
          <div class="qnum">Savol ${idx + 1} / ${qs.length}</div>
          <div class="qtext big">${nl2br(q.q)}</div>
          <div class="ring" id="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="rbg"/><circle cx="60" cy="60" r="52" class="rfg" id="rfg"/></svg><div class="rt" id="rt">${T}</div></div>
          <div class="answer ${phase === 'answer' ? '' : 'hidden'}" id="zans"><b>Javob:</b> ${nl2br(q.a)}</div>
          <div class="row center ctrl">
            <button class="btn big timerbtn" id="tstart" ${phase !== 'q' ? 'disabled' : ''}>⏱ ${T} soniya — boshlash</button>
            <button class="btn big ghost" id="show" ${phase === 'answer' ? 'disabled' : ''}>Javobni ko'rsatish</button>
          </div>
          <div class="award ${phase === 'answer' ? '' : 'hidden'}" id="award">
            <p>To'g'ri javob bergan jamoa(lar)ni belgilang (+${pts} ball):</p>
            <div class="row center wrap">${teams.map((t, i) => `<button class="btn teamaward ${awarded.has(i) ? 'on' : ''}" data-aw="${i}">${esc(t.name)}</button>`).join('')}</div>
            <button class="btn big ok" id="nextq">${idx < qs.length - 1 ? 'Keyingi savol →' : 'Natijalar 🏆'}</button>
          </div>
        </div>`;
      $('#tstart').onclick = startTimer;
      $('#show').onclick = showAnswer;
      $$('[data-aw]').forEach(b => b.onclick = () => {
        const i = +b.dataset.aw;
        if (awarded.has(i)) { awarded.delete(i); teams[i].score -= pts; } else { awarded.add(i); teams[i].score += pts; Sound.sfx('correct'); }
        b.classList.toggle('on'); sb();
      });
      const nx = $('#nextq'); if (nx) nx.onclick = next;
    };
    const startTimer = () => {
      phase = 'timer'; $('#tstart').disabled = true; Sound.music('think'); Sound.sfx('start');
      const end = Date.now() + T * 1000, C = 2 * Math.PI * 52, fg = $('#rfg');
      fg.style.strokeDasharray = C; $('#ring').classList.add('running');
      let lastSec = T;
      timerId = setInterval(() => {
        const left = Math.max(0, (end - Date.now()) / 1000), s = Math.ceil(left);
        $('#rt').textContent = s; fg.style.strokeDashoffset = C * (1 - left / T);
        $('#ring').classList.toggle('warn', left <= 10);
        if (s !== lastSec) { lastSec = s; if (s <= 10 && s > 0) Sound.sfx(s % 2 ? 'tick' : 'tock'); }
        if (left <= 0) { stopTimer(); Sound.stopMusic(); Sound.sfx('gong'); $('#ring').classList.add('done'); $('#rt').textContent = 'Vaqt!'; Sound.music('zakovat'); }
      }, 100);
    };
    const showAnswer = () => { stopTimer(); phase = 'answer'; Sound.music('zakovat'); Sound.sfx('whoosh'); draw(); };
    const next = () => {
      if (idx < qs.length - 1) { idx++; phase = 'q'; awarded = new Set(); sb(); draw(); Sound.sfx('whoosh'); }
      else finish();
    };
    const finish = () => {
      Cleanup.run(); Sound.music('zakovat'); Sound.sfx('win'); confetti(3500);
      const ranked = teams.slice().sort((a, b) => b.score - a.score);
      view(`<section class="page dark zakbg">
        <div class="card glass result">
          <div class="trophy">🏆</div><h1>G'olib: ${esc(ranked[0].name)}</h1>
          <ol class="rank">${ranked.map((t, i) => `<li class="${i === 0 ? 'first' : ''}"><span>${['🥇', '🥈', '🥉'][i] || i + 1 + '.'} ${esc(t.name)}</span><b>${t.score} ball</b></li>`).join('')}</ol>
          <div class="row center"><a class="btn" href="#/game/zakovat">Yangi o'yin</a><a class="btn ghost" href="#/games">O'yinlar</a></div>
        </div></section>`);
    };
    sb(); draw();
  },

  /* ================= BILIMLAR BELLASHUVI (Kahoot uslubida) ================= */
  kahootSetup() {
    Sound.music('kahoot');
    const srcs = sourceList('mcq');
    const players = [{ name: '', ch: 0 }, { name: '', ch: 1 }];
    view(`<section class="page kahbg">
      <div class="pagehead light"><h1>🏁 Bilimlar bellashuvi</h1><p>O'yinchilar qo'shing va har biriga personaj tanlang. Bitta qurilmada navbat bilan o'ynaladi.</p></div>
      <div class="card">
        <div id="players"></div>
        <button class="btn ghost sm" id="addp">+ O'yinchi qo'shish</button>
        <div class="formgrid">
          <div><label>Savollar manbasi</label><select class="inp" id="src">${srcs.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
          <div><label>Savollar soni</label><input class="inp" type="number" id="cnt" value="8" min="1"></div>
          <div><label>Javob vaqti (soniya)</label><input class="inp" type="number" id="tm" value="${S.settings.kahootTime}" min="5"></div>
        </div>
        <button class="btn big kbtn" id="go">Boshlash ▶</button>
      </div>
    </section>`);
    const draw = () => {
      $('#players').innerHTML = players.map((p, i) => `<div class="player">
        <button class="avapick" data-pick="${i}" title="Personajni almashtirish">${avatar(p.ch, 'lg')}</button>
        <div class="pinfo"><input class="inp" data-pn="${i}" placeholder="${i + 1}-o'yinchi ismi" value="${esc(p.name)}"><small>${esc(CHARS[p.ch].n)} · bosib almashtiring</small></div>
        ${players.length > 1 ? `<button class="btn ghost sm" data-pdel="${i}">✕</button>` : ''}</div>`).join('');
      $$('[data-pn]').forEach(inp => inp.oninput = () => players[inp.dataset.pn].name = inp.value);
      $$('[data-pdel]').forEach(b => b.onclick = () => { players.splice(+b.dataset.pdel, 1); draw(); });
      $$('[data-pick]').forEach(b => b.onclick = () => {
        const i = +b.dataset.pick;
        const box = modal(`<h3>Personajni tanlang</h3><div class="charsel">${CHARS.map((c, k) => `<button data-c="${k}" class="${players[i].ch === k ? 'on' : ''}">${avatar(k, 'lg')}<small>${esc(c.n)}</small></button>`).join('')}</div>`, { wide: true });
        box.onclick = (e) => { const c = e.target.closest('[data-c]'); if (!c) return; players[i].ch = +c.dataset.c; Sound.sfx('click'); closeModal(); draw(); };
      });
    };
    draw();
    $('#addp').onclick = () => { if (players.length >= 12) return; players.push({ name: '', ch: players.length % CHARS.length }); draw(); };
    $('#go').onclick = () => {
      const src = srcs.find(s => s.id === $('#src').value);
      if (!src || !src.qs.length) return toast('Bu manbada savollar yo\'q', 'err');
      const T = Math.max(5, +$('#tm').value || 20); S.settings.kahootTime = T; saveState();
      const ps = players.map((p, i) => ({ name: p.name.trim() || CHARS[p.ch].n, ch: p.ch, score: 0, streak: 0 }));
      Games.kahootPlay(ps, pickRandom(src.qs, +$('#cnt').value || 8).map(shuffleOptions), T);
    };
  },

  kahootPlay(ps, qs, T) {
    let qi = 0;
    Sound.music('kahoot');
    const intro = () => {
      Cleanup.run();
      view(`<section class="page kahbg center-screen"><div class="qintro"><div class="qbadge">Savol ${qi + 1} / ${qs.length}</div><div class="qtext big light">${nl2br(qs[qi].q)}</div><div class="loadbar"><i></i></div></div></section>`);
      Sound.sfx('whoosh');
      Cleanup.timeout(() => turn(0, []), ps.length > 1 ? 2200 : 2600);
    };
    const turn = (pi, picks) => {
      const p = ps[pi], q = qs[qi];
      const go = () => {
        Cleanup.run();
        const start = performance.now();
        view(`<section class="page kahbg kplay">
          <div class="ktop"><div class="kwho">${avatar(p.ch)}<b>${esc(p.name)}</b></div><div class="kcount" id="kc">${T}</div><div class="kq">${qi + 1}/${qs.length}</div></div>
          <div class="kquestion">${nl2br(q.q)}</div>
          <div class="ktimebar"><i id="kbar"></i></div>
          <div class="tiles">${q.options.map((o, i) => `<button class="tile ${TILES[i % 4].cls}" data-i="${i}"><span class="ticon">${TILES[i % 4].icon}</span><span>${esc(o)}</span></button>`).join('')}</div>
        </section>`);
        let done = false;
        const pick = (i) => {
          if (done) return; done = true;
          const t = (performance.now() - start) / 1000;
          picks[pi] = { i, t };
          Sound.sfx('click');
          $$('.tile').forEach(b => b.classList.toggle('dim', +b.dataset.i !== i));
          Cleanup.timeout(() => (pi < ps.length - 1 ? turn(pi + 1, picks) : reveal(picks)), 500);
        };
        $$('.tile').forEach(b => b.onclick = () => pick(+b.dataset.i));
        let last = T;
        Cleanup.interval(() => {
          const left = T - (performance.now() - start) / 1000;
          const s = Math.max(0, Math.ceil(left));
          const kc = $('#kc'); if (!kc) return;
          kc.textContent = s; $('#kbar').style.width = Math.max(0, left / T * 100) + '%';
          if (s !== last) { last = s; if (s <= 5 && s > 0) Sound.sfx('tick'); }
          if (left <= 0) { pick(-1); }
        }, 100);
      };
      if (ps.length > 1) {
        Cleanup.run();
        view(`<section class="page kahbg center-screen"><div class="handoff pop">${avatar(p.ch, 'xl bounce')}<h2>${esc(p.name)} navbati!</h2><p>Qurilmani ${esc(p.name)}ga bering</p><button class="btn big kbtn" id="ready">Tayyorman ▶</button></div></section>`);
        $('#ready').onclick = go;
      } else go();
    };
    const reveal = (picks) => {
      Cleanup.run();
      const q = qs[qi];
      const gained = ps.map((p, i) => {
        const pk = picks[i]; const ok = pk && pk.i === q.answer;
        if (ok) { p.streak++; const pts = Math.round(1000 * (1 - (pk.t / T) / 2)) + (p.streak > 1 ? 100 * Math.min(p.streak - 1, 5) : 0); p.score += pts; return { ok, pts }; }
        p.streak = 0; return { ok: false, pts: 0 };
      });
      const anyOk = gained.some(g => g.ok);
      Sound.sfx(anyOk ? 'correct' : 'wrong');
      view(`<section class="page kahbg">
        <div class="kquestion small">${nl2br(q.q)}</div>
        <div class="tiles reveal">${q.options.map((o, i) => `<div class="tile ${TILES[i % 4].cls} ${i === q.answer ? 'correct' : 'dim'}"><span class="ticon">${i === q.answer ? '✔' : TILES[i % 4].icon}</span><span>${esc(o)}</span>
          <span class="pickers">${ps.map((p, k) => picks[k] && picks[k].i === i ? avatar(p.ch, 'sm') : '').join('')}</span></div>`).join('')}</div>
        <div class="card leader"><h3>🏆 Reyting</h3><div id="lb"></div></div>
        <div class="row center"><button class="btn big kbtn" id="kn">${qi < qs.length - 1 ? 'Keyingi savol →' : 'Yakuniy natijalar 🏆'}</button></div>
      </section>`);
      const ranked = ps.map((p, i) => ({ ...p, g: gained[i] })).sort((a, b) => b.score - a.score);
      const max = Math.max(1, ranked[0].score);
      $('#lb').innerHTML = ranked.map((p, k) => `<div class="lbrow" style="animation-delay:${k * 0.08}s">${avatar(p.ch, 'sm')}<span class="lbn">${esc(p.name)}</span>
        <div class="lbbar"><i style="--w:${p.score / max * 100}%"></i></div><b>${p.score}</b>
        <span class="lbg ${p.g.ok ? 'ok' : 'no'}">${p.g.ok ? '+' + p.g.pts + (p.streak > 1 ? ' 🔥' + p.streak : '') : '✘'}</span></div>`).join('');
      if (anyOk) confetti(900);
      $('#kn').onclick = () => { if (qi < qs.length - 1) { qi++; intro(); } else podium(); };
    };
    const podium = () => {
      Cleanup.run(); Sound.sfx('win'); confetti(4000);
      const r = ps.slice().sort((a, b) => b.score - a.score);
      const slot = (p, place) => p ? `<div class="pod p${place}"><div class="podava">${avatar(p.ch, 'xl bounce')}</div><b>${esc(p.name)}</b><span>${p.score}</span><div class="podblock">${place}</div></div>` : '<div class="pod empty"></div>';
      view(`<section class="page kahbg">
        <h1 class="light center">🏆 G'oliblar</h1>
        <div class="podium">${slot(r[1], 2)}${slot(r[0], 1)}${slot(r[2], 3)}</div>
        ${r.length > 3 ? `<div class="card"><ol start="4">${r.slice(3).map(p => `<li>${esc(p.name)} — ${p.score}</li>`).join('')}</ol></div>` : ''}
        <div class="row center"><a class="btn big kbtn" href="#/game/kahoot">Yana o'ynash</a><a class="btn ghost light" href="#/games">O'yinlar</a></div>
      </section>`);
    };
    intro();
  },

  /* ================= SHIFO SAYOHATI (animatsion viktorina) ================= */
  quizSetup() {
    Sound.music('quiz');
    const srcs = sourceList('mcq');
    let ch = 0;
    view(`<section class="page skybg">
      <div class="clouds"><i></i><i></i><i></i></div>
      <div class="pagehead light"><h1>🚀 Shifo sayohati</h1><p>Har bir to'g'ri javob sizni marraga yaqinlashtiradi. 3 ta hayotingiz bor!</p></div>
      <div class="card">
        <label>Qahramoningizni tanlang</label>
        <div class="charsel inline" id="cs">${CHARS.map((c, k) => `<button data-c="${k}" class="${k === 0 ? 'on' : ''}">${avatar(k, 'lg')}<small>${esc(c.n)}</small></button>`).join('')}</div>
        <div class="formgrid">
          <div><label>Savollar manbasi</label><select class="inp" id="src">${srcs.map(s => `<option value="${s.id}" ${s.id === 'g:quiz' ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
          <div><label>Savollar soni</label><input class="inp" type="number" id="cnt" value="10" min="1"></div>
          <div><label>Har savol vaqti (soniya)</label><input class="inp" type="number" id="tm" value="${S.settings.quizTime}" min="5"></div>
        </div>
        <button class="btn big qbtn" id="go">Sayohatni boshlash 🚀</button>
      </div>
    </section>`);
    $('#cs').onclick = (e) => { const b = e.target.closest('[data-c]'); if (!b) return; ch = +b.dataset.c; $$('#cs button').forEach(x => x.classList.toggle('on', x === b)); Sound.sfx('click'); };
    $('#go').onclick = () => {
      const src = srcs.find(s => s.id === $('#src').value);
      if (!src || !src.qs.length) return toast('Bu manbada savollar yo\'q', 'err');
      const T = Math.max(5, +$('#tm').value || 15); S.settings.quizTime = T; saveState();
      Games.quizPlay(ch, pickRandom(src.qs, +$('#cnt').value || 10).map(shuffleOptions), T);
    };
  },

  quizPlay(ch, qs, T) {
    let qi = 0, lives = 3, score = 0, combo = 0, correct = 0;
    Sound.music('quiz'); Sound.sfx('start');
    view(`<section class="page skybg qplay">
      <div class="clouds"><i></i><i></i><i></i></div>
      <div class="qhud"><div class="hearts" id="hearts"></div><div class="qscore">⭐ <b id="qs">0</b></div><div class="combo" id="combo"></div></div>
      <div class="track" id="track">
        <div class="road"></div>
        ${qs.map((_, i) => `<span class="cp" style="left:${(i + 1) / (qs.length + 1) * 100}%"></span>`).join('')}
        <span class="flag" style="left:calc(100% - 28px)">🏁</span>
        <div class="runner" id="hero">${avatar(ch, 'lg')}</div>
      </div>
      <div class="card qcard flipin" id="qc"></div>
    </section>`);
    const hud = () => {
      $('#hearts').innerHTML = [0, 1, 2].map(i => `<span class="${i < lives ? '' : 'lost'}">❤️</span>`).join('');
      $('#qs').textContent = score;
      $('#combo').innerHTML = combo > 1 ? `🔥 x${combo}` : '';
      $('#hero').style.left = `calc(${qi / (qs.length + 1) * 100}% + 4px)`;
    };
    const draw = () => {
      Cleanup.run();
      const q = qs[qi], qc = $('#qc');
      qc.classList.remove('flipin'); void qc.offsetWidth; qc.classList.add('flipin');
      qc.innerHTML = `<div class="qnum">Bekat ${qi + 1} / ${qs.length}</div><div class="qtext">${nl2br(q.q)}</div>
        <div class="qtimer"><i id="qbar"></i></div>
        <div class="opts">${q.options.map((o, i) => `<button class="opt bubbly" data-i="${i}" style="animation-delay:${i * 0.07}s"><b>${LETTERS[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>`;
      const start = performance.now(); let done = false;
      const answer = (i) => {
        if (done) return; done = true; Cleanup.run();
        const ok = i === q.answer;
        $$('.opt', qc).forEach(b => { const k = +b.dataset.i; b.disabled = true; if (k === q.answer) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
        if (ok) {
          combo++; correct++;
          const t = (performance.now() - start) / 1000;
          const gain = Math.round(100 + 100 * Math.max(0, 1 - t / T)) * Math.min(combo, 5);
          score += gain; Sound.sfx('correct');
          floatText(`+${gain}`, 'good'); $('#hero').classList.add('jump'); setTimeout(() => $('#hero') && $('#hero').classList.remove('jump'), 700);
        } else {
          combo = 0; lives--; Sound.sfx('wrong');
          qc.classList.add('shake'); setTimeout(() => qc.classList.remove('shake'), 500);
          floatText(i < 0 ? 'Vaqt tugadi!' : '−❤️', 'bad');
        }
        qi++; hud();
        setTimeout(() => { if (!$('#qc')) return; if (lives <= 0 || qi >= qs.length) end(); else draw(); }, 1300);
      };
      $$('.opt', qc).forEach(b => b.onclick = () => answer(+b.dataset.i));
      Cleanup.interval(() => {
        const left = T - (performance.now() - start) / 1000;
        const bar = $('#qbar'); if (!bar) return;
        bar.style.width = Math.max(0, left / T * 100) + '%';
        bar.classList.toggle('warn', left < T * 0.3);
        if (left <= 0) answer(-1);
      }, 100);
    };
    const floatText = (txt, cls) => {
      const f = document.createElement('div'); f.className = 'floattxt ' + cls; f.textContent = txt;
      $('#track').appendChild(f); setTimeout(() => f.remove(), 1200);
    };
    const end = () => {
      Cleanup.run();
      const win = lives > 0;
      const acc = correct / qs.length;
      const stars = win ? (acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1) : 0;
      Sound.sfx(win ? 'win' : 'gong'); if (win) confetti(3500);
      view(`<section class="page skybg"><div class="clouds"><i></i><i></i><i></i></div>
        <div class="card result pop">
          <div class="podava">${avatar(ch, 'xl bounce')}</div>
          <h1>${win ? 'Marraga yetdingiz! 🎉' : "Hayotlar tugadi 😔"}</h1>
          <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('')}</div>
          <p>To'g'ri javoblar: <b>${correct} / ${qs.length}</b> · Ball: <b>${score}</b></p>
          <div class="row center"><a class="btn big qbtn" href="#/game/quiz">Qayta o'ynash</a><a class="btn ghost" href="#/games">O'yinlar</a></div>
        </div></section>`);
    };
    hud(); draw();
  },
};
