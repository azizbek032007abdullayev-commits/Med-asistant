/* Bilimni sinash: testlar va yozma savollar */
const Study = {
  testsHome() {
    const secs = S.testSections;
    view(`<section class="page">
      <div class="pagehead"><h1>📝 Testlar</h1><p>Bo'limni tanlang. Har bir testda 4 ta variant, vaqt cheklangan.</p></div>
      ${secs.length ? `<div class="grid">${secs.map(s => `
        <div class="card sec">
          <h3>${esc(s.name)}</h3>
          <div class="meta"><span>❓ ${Math.min(s.count || s.questions.length, s.questions.length)} ta savol</span><span>⏱ ${s.timeMin} daqiqa</span></div>
          <button class="btn" ${s.questions.length ? '' : 'disabled'} data-start="${s.id}">Boshlash</button>
        </div>`).join('')}</div>` : `<div class="empty">Hozircha test bo'limlari yo'q. Admin paneldan qo'shing.</div>`}
    </section>`);
    $$('[data-start]').forEach(b => b.onclick = () => location.hash = '#/test/' + b.dataset.start);
  },

  runTest(id) {
    const sec = S.testSections.find(s => s.id === id);
    if (!sec) return location.hash = '#/tests';
    const qs = pickRandom(sec.questions, sec.count).map(shuffleOptions);
    const ans = new Array(qs.length).fill(-1);
    let cur = 0, finished = false;
    const endAt = Date.now() + sec.timeMin * 60000;

    const app = view(`<section class="page testrun">
      <div class="testbar"><h2>${esc(sec.name)}</h2><div class="timer" id="tt">${fmtTime(sec.timeMin * 60)}</div></div>
      <div class="qnav" id="qnav"></div>
      <div class="card qcard" id="qbox"></div>
      <div class="row between"><button class="btn ghost" id="prev">← Oldingi</button>
      <button class="btn ok" id="finish">Yakunlash</button><button class="btn ghost" id="next">Keyingi →</button></div>
    </section>`);

    const draw = () => {
      const q = qs[cur];
      $('#qbox').innerHTML = `<div class="qnum">${cur + 1} / ${qs.length}</div><div class="qtext">${nl2br(q.q)}</div>
        <div class="opts">${q.options.map((o, i) => `<button class="opt ${ans[cur] === i ? 'sel' : ''}" data-i="${i}"><b>${LETTERS[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>`;
      $('#qnav').innerHTML = qs.map((_, i) => `<button class="${i === cur ? 'cur' : ''} ${ans[i] >= 0 ? 'done' : ''}" data-n="${i}">${i + 1}</button>`).join('');
      $$('.opt', app).forEach(b => b.onclick = () => { ans[cur] = +b.dataset.i; Sound.sfx('click'); if (cur < qs.length - 1) { cur++; } draw(); });
      $$('#qnav button').forEach(b => b.onclick = () => { cur = +b.dataset.n; draw(); });
    };
    $('#prev').onclick = () => { if (cur > 0) { cur--; draw(); } };
    $('#next').onclick = () => { if (cur < qs.length - 1) { cur++; draw(); } };
    $('#finish').onclick = async () => {
      const left = ans.filter(a => a < 0).length;
      if (left && !(await ask(`${left} ta savolga javob berilmagan. Testni yakunlaysizmi?`, { ok: 'Yakunlash' }))) return;
      finish();
    };
    const finish = () => {
      if (finished) return; finished = true; Cleanup.run();
      const correct = qs.filter((q, i) => ans[i] === q.answer).length;
      const pct = Math.round(correct / qs.length * 100);
      if (pct >= 70) { Sound.sfx('win'); confetti(); } else Sound.sfx('gong');
      view(`<section class="page">
        <div class="card result">
          <div class="bigpct ${pct >= 70 ? 'good' : pct >= 50 ? 'mid' : 'bad'}">${pct}%</div>
          <h2>${esc(sec.name)}: ${correct} / ${qs.length} to'g'ri</h2>
          <p>${pct >= 86 ? "A'lo natija! 🏆" : pct >= 70 ? 'Yaxshi natija! 👍' : pct >= 50 ? "Qoniqarli. Yana mashq qiling." : "Bilimlarni mustahkamlash kerak."}</p>
          <div class="row center"><button class="btn" id="again">Qayta ishlash</button><a class="btn ghost" href="#/tests">Bo'limlar</a></div>
        </div>
        <h3>Tahlil</h3>
        ${qs.map((q, i) => `<div class="card review ${ans[i] === q.answer ? 'right' : 'wrongc'}">
          <div class="qtext"><b>${i + 1}.</b> ${nl2br(q.q)}</div>
          <ul>${q.options.map((o, k) => `<li class="${k === q.answer ? 'ans' : ''} ${k === ans[i] && k !== q.answer ? 'mine' : ''}">${LETTERS[k]}) ${esc(o)} ${k === q.answer ? '✔' : ''}${k === ans[i] && k !== q.answer ? ' ✘ (sizning javobingiz)' : ''}</li>`).join('')}</ul>
          ${ans[i] < 0 ? '<small class="muted">Javob berilmagan</small>' : ''}
        </div>`).join('')}
      </section>`);
      $('#again').onclick = () => Study.runTest(id);
    };
    Cleanup.interval(() => {
      const left = (endAt - Date.now()) / 1000;
      const t = $('#tt'); if (!t) return;
      t.textContent = fmtTime(left);
      t.classList.toggle('warn', left < 60);
      if (left <= 0) { toast('Vaqt tugadi!', 'err'); finish(); }
    }, 250);
    draw();
  },

  writtenHome() {
    const secs = S.writtenSections;
    view(`<section class="page">
      <div class="pagehead"><h1>✍️ Yozma savollar</h1><p>Javobingizni yozing, so'ng “Javobni tekshirish” orqali to'g'ri javobni ko'ring.</p></div>
      ${secs.length ? `<div class="grid">${secs.map(s => `
        <div class="card sec"><h3>${esc(s.name)}</h3>
          <div class="meta"><span>❓ ${Math.min(s.count || s.questions.length, s.questions.length)} ta savol</span></div>
          <button class="btn" ${s.questions.length ? '' : 'disabled'} data-start="${s.id}">Boshlash</button></div>`).join('')}</div>`
        : `<div class="empty">Hozircha yozma bo'limlar yo'q. Admin paneldan qo'shing.</div>`}
    </section>`);
    $$('[data-start]').forEach(b => b.onclick = () => location.hash = '#/written/' + b.dataset.start);
  },

  runWritten(id) {
    const sec = S.writtenSections.find(s => s.id === id);
    if (!sec) return location.hash = '#/written';
    const qs = pickRandom(sec.questions, sec.count);
    view(`<section class="page">
      <div class="pagehead"><h1>${esc(sec.name)}</h1><p>${qs.length} ta savol</p></div>
      ${qs.map((q, i) => `<div class="card wq">
        <div class="qtext"><b>${i + 1}.</b> ${nl2br(q.q)}</div>
        <textarea class="inp" rows="3" placeholder="Javobingizni yozing..."></textarea>
        <div class="row"><button class="btn sm" data-show="${i}">Javobni tekshirish</button>
        <span class="selfgrade hidden" data-g="${i}">O'zingizni baholang: <button class="btn sm ok" data-r="1">To'g'ri</button><button class="btn sm danger" data-r="0">Noto'g'ri</button></span></div>
        <div class="answer hidden" data-a="${i}"><b>To'g'ri javob:</b><br>${nl2br(q.a)}</div>
      </div>`).join('')}
      <div class="card" id="wsum">Baholangan: <b id="wg">0</b> / ${qs.length} · To'g'ri: <b id="wr">0</b></div>
      <div class="row center"><button class="btn" id="again">Yangi savollar</button><a class="btn ghost" href="#/written">Bo'limlar</a></div>
    </section>`);
    const grades = {};
    $$('[data-show]').forEach(b => b.onclick = () => {
      const i = b.dataset.show;
      $(`[data-a="${i}"]`).classList.remove('hidden'); $(`[data-g="${i}"]`).classList.remove('hidden');
      b.disabled = true; Sound.sfx('whoosh');
    });
    $$('.selfgrade').forEach(g => g.onclick = (e) => {
      const r = e.target.closest('[data-r]'); if (!r) return;
      grades[g.dataset.g] = +r.dataset.r; Sound.sfx(r.dataset.r === '1' ? 'correct' : 'wrong');
      g.innerHTML = r.dataset.r === '1' ? '✅ To\'g\'ri' : '❌ Noto\'g\'ri';
      $('#wg').textContent = Object.keys(grades).length;
      $('#wr').textContent = Object.values(grades).filter(Boolean).length;
    });
    $('#again').onclick = () => Study.runWritten(id);
  },
};
