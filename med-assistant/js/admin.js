/* Admin panel */
const Admin = {
  tab: 'tests',
  logged() { return sessionStorage.getItem('ma_admin') === '1'; },

  login() {
    view(`<section class="page narrow"><form class="card" id="lf">
      <h2>🔐 Admin panelga kirish</h2>
      <label>Parol</label><input class="inp" type="password" id="pw" autofocus>
      <button class="btn big">Kirish</button>
      <p class="muted small">Boshlang'ich parol: <code>admin123</code> — kirgach Sozlamalar bo'limida o'zgartiring.</p>
    </form></section>`);
    $('#lf').onsubmit = (e) => {
      e.preventDefault();
      if ($('#pw').value === S.settings.adminPass) { sessionStorage.setItem('ma_admin', '1'); this.home(); }
      else toast("Parol noto'g'ri", 'err');
    };
  },

  home(tab) {
    if (!this.logged()) return this.login();
    if (tab) this.tab = tab;
    const tabs = [['tests', '📝 Testlar'], ['written', '✍️ Yozma'], ['games', '🎮 O\'yinlar'], ['books', '📚 Kitoblar'], ['music', '🎵 Musiqa'], ['settings', '⚙️ Sozlamalar']];
    view(`<section class="page admin">
      <div class="pagehead row between"><h1>Admin panel</h1><button class="btn ghost sm" id="logout">Chiqish</button></div>
      <div class="tabs">${tabs.map(([k, l]) => `<button class="${this.tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <div id="apanel"></div>
    </section>`);
    $$('[data-tab]').forEach(b => b.onclick = () => this.home(b.dataset.tab));
    $('#logout').onclick = () => { sessionStorage.removeItem('ma_admin'); location.hash = '#/'; };
    this['tab_' + this.tab]($('#apanel'));
  },

  /* ---------- bo'limlar ro'yxati (test / yozma) ---------- */
  sectionsPanel(el, arr, kind) {
    el.innerHTML = `<div class="card">
      <div class="row between"><h3>${kind === 'mcq' ? 'Test bo\'limlari' : 'Yozma savol bo\'limlari'}</h3><button class="btn sm" id="addsec">+ Bo'lim qo'shish</button></div>
      <table class="tbl"><thead><tr><th>Bo'lim nomi</th>${kind === 'mcq' ? '<th>Vaqt (daq)</th>' : ''}<th>Ko'rsatiladigan savollar soni</th><th>Bazadagi savollar</th><th></th></tr></thead>
      <tbody>${arr.map(s => `<tr>
        <td><input class="inp" data-f="name" data-id="${s.id}" value="${esc(s.name)}"></td>
        ${kind === 'mcq' ? `<td><input class="inp num" type="number" min="1" data-f="timeMin" data-id="${s.id}" value="${s.timeMin}"></td>` : ''}
        <td><input class="inp num" type="number" min="1" data-f="count" data-id="${s.id}" value="${s.count}"></td>
        <td>${s.questions.length}</td>
        <td class="nowrap"><button class="btn sm" data-edit="${s.id}">Savollar</button> <button class="btn sm danger" data-del="${s.id}">O'chirish</button></td></tr>`).join('')}</tbody></table>
      ${arr.length ? '' : '<div class="empty">Bo\'lim yo\'q</div>'}
    </div><div id="secedit"></div>`;
    $$('[data-f]', el).forEach(inp => inp.onchange = () => {
      const s = arr.find(x => x.id === inp.dataset.id);
      s[inp.dataset.f] = inp.type === 'number' ? Math.max(1, +inp.value || 1) : inp.value.trim() || s.name;
      saveState(); toast('Saqlandi', 'ok');
    });
    $('#addsec', el).onclick = async () => {
      const name = await promptText("Yangi bo'lim nomi"); if (!name) return;
      const s = { id: uid(), name, count: 10, questions: [] }; if (kind === 'mcq') s.timeMin = 10;
      arr.push(s); saveState(); this.sectionsPanel(el, arr, kind);
      this.openSection(arr, s, kind);
    };
    $$('[data-del]', el).forEach(b => b.onclick = async () => {
      const s = arr.find(x => x.id === b.dataset.del);
      if (!(await ask(`“${s.name}” bo'limi va undagi ${s.questions.length} ta savol o'chirilsinmi?`, { ok: "O'chirish", danger: true }))) return;
      arr.splice(arr.indexOf(s), 1); saveState(); this.sectionsPanel(el, arr, kind);
    });
    $$('[data-edit]', el).forEach(b => b.onclick = () => this.openSection(arr, arr.find(x => x.id === b.dataset.edit), kind));
  },
  openSection(arr, s, kind) {
    const box = $('#secedit');
    box.innerHTML = `<div class="card"><h3>“${esc(s.name)}” savollari</h3><div id="qed"></div></div>`;
    this.qEditor($('#qed'), s.questions, kind, () => { const c = $$('tbody tr').find(tr => tr.querySelector(`[data-edit="${s.id}"]`)); if (c) c.children[kind === 'mcq' ? 3 : 2].textContent = s.questions.length; });
    box.scrollIntoView({ behavior: 'smooth' });
  },

  /* ---------- savollar muharriri + fayldan import ---------- */
  qEditor(el, arr, kind, onChange = () => {}) {
    const draw = () => {
      el.innerHTML = `
        <div class="importbox">
          <div><b>📥 Fayldan avtomatik kiritish</b> (DOCX, Excel, PDF, TXT)
          <details><summary>Fayl formati namunasi</summary>${kind === 'mcq' ? `<pre>1. Insulin qayerda ishlab chiqariladi?
A) Jigar
B) Oshqozon osti bezi
C) Buyrak
D) Taloq
Javob: B</pre><p>To'g'ri variant oldiga <code>*</code> qo'yish ham mumkin: <code>*B) Oshqozon osti bezi</code>.<br>
Excel: ustunlar — <b>Savol | A | B | C | D | Javob</b> (javob harf bilan: A/B/C/D).</p>` : `<pre>1. Anamnez nima?
Javob: Bemordan so'rab olinadigan ma'lumotlar...

2. Taxikardiya nima?
Javob: Yurak urishining daqiqasiga 100 dan oshishi.</pre><p>Excel: ustunlar — <b>Savol | Javob</b>.</p>`}</details></div>
          <label class="btn sm filebtn">Fayl tanlash<input type="file" accept=".docx,.xlsx,.xls,.csv,.ods,.pdf,.txt" hidden id="qfile"></label>
        </div>
        <div class="row between"><b>Savollar: ${arr.length} ta</b><div><button class="btn sm" id="qadd">+ Qo'lda qo'shish</button> ${arr.length ? '<button class="btn sm danger ghost" id="qclear">Hammasini o\'chirish</button>' : ''}</div></div>
        <ol class="qlist">${arr.map((q, i) => `<li><div class="qli"><div>${esc(q.q)}
          ${kind === 'mcq' ? `<div class="small muted">${q.options.map((o, k) => `<span class="${k === q.answer ? 'ansmark' : ''}">${LETTERS[k]}) ${esc(o)}</span>`).join(' · ')}</div>` : `<div class="small muted">Javob: ${esc(q.a)}</div>`}</div>
          <div class="nowrap"><button class="btn sm ghost" data-qe="${i}">✎</button><button class="btn sm ghost" data-qd="${i}">✕</button></div></div></li>`).join('')}</ol>`;
      $('#qfile', el).onchange = (e) => this.doImport(e.target.files[0], arr, kind, () => { draw(); onChange(); });
      $('#qadd', el).onclick = () => this.qForm(null, kind, (q) => { arr.push(q); saveState(); draw(); onChange(); });
      const qc = $('#qclear', el); if (qc) qc.onclick = async () => { if (await ask(`${arr.length} ta savol o'chirilsinmi?`, { ok: "O'chirish", danger: true })) { arr.splice(0); saveState(); draw(); onChange(); } };
      $$('[data-qe]', el).forEach(b => b.onclick = () => this.qForm(arr[+b.dataset.qe], kind, (q) => { arr[+b.dataset.qe] = q; saveState(); draw(); }));
      $$('[data-qd]', el).forEach(b => b.onclick = () => { arr.splice(+b.dataset.qd, 1); saveState(); draw(); onChange(); });
    };
    draw();
  },
  qForm(q, kind, done) {
    const opts = q ? q.options || [] : ['', '', '', ''];
    while (kind === 'mcq' && opts.length < 4) opts.push('');
    const box = modal(`<h3>${q ? 'Savolni tahrirlash' : 'Yangi savol'}</h3>
      <label>Savol</label><textarea class="inp" id="fq" rows="3">${esc(q ? q.q : '')}</textarea>
      ${kind === 'mcq' ? `<label>Variantlar (to'g'risini belgilang)</label>${opts.map((o, i) => `<div class="row optrow"><input type="radio" name="fa" value="${i}" ${(q ? q.answer : 0) === i ? 'checked' : ''}><b>${LETTERS[i]})</b><input class="inp" data-o="${i}" value="${esc(o)}"></div>`).join('')}`
        : `<label>Javob</label><textarea class="inp" id="fa" rows="3">${esc(q ? q.a : '')}</textarea>`}
      <div class="row end"><button class="btn ghost" id="fc">Bekor qilish</button><button class="btn" id="fs">Saqlash</button></div>`, { wide: true });
    $('#fc', box).onclick = closeModal;
    $('#fs', box).onclick = () => {
      const text = $('#fq', box).value.trim(); if (!text) return toast('Savol matnini kiriting', 'err');
      if (kind === 'mcq') {
        const o = $$('[data-o]', box).map(i => i.value.trim());
        let ans = +($('input[name=fa]:checked', box) || { value: 0 }).value;
        const kept = o.map((v, i) => ({ v, i })).filter(x => x.v);
        if (kept.length < 2) return toast('Kamida 2 ta variant kiriting', 'err');
        const newAns = kept.findIndex(x => x.i === ans);
        if (newAns < 0) return toast("To'g'ri javob bo'sh variantda", 'err');
        done({ id: q ? q.id : uid(), q: text, options: kept.map(x => x.v), answer: newAns });
      } else done({ id: q ? q.id : uid(), q: text, a: $('#fa', box).value.trim() || '—' });
      closeModal(); toast('Saqlandi', 'ok');
    };
  },
  async doImport(file, arr, kind, after) {
    if (!file) return;
    modal(`<div class="spinner"></div> “${esc(file.name)}” o'qilmoqda...`);
    let items;
    try { items = await Importer.parse(file, kind); }
    catch (e) { closeModal(); console.error(e); return toast('Xatolik: ' + e.message, 'err'); }
    if (!items.length) { closeModal(); return toast("Fayldan savol topilmadi. Format namunasini tekshiring.", 'err'); }
    const noAns = items.filter(x => x._noAnswer).length;
    const box = modal(`<h3>${items.length} ta savol topildi</h3>
      ${noAns ? `<div class="notice warn">${noAns} ta savolda to'g'ri javob ko'rsatilmagan — ularda “A” javob deb olindi. Keyin tahrirlashingiz mumkin.</div>` : ''}
      <ol class="qlist preview">${items.slice(0, 50).map(q => `<li>${esc(q.q)}<div class="small muted">${kind === 'mcq' ? q.options.map((o, k) => `<span class="${k === q.answer ? 'ansmark' : ''}">${LETTERS[k]}) ${esc(o)}</span>`).join(' · ') : 'Javob: ' + esc(q.a)}</div></li>`).join('')}</ol>
      ${items.length > 50 ? `<p class="muted">...va yana ${items.length - 50} ta</p>` : ''}
      <div class="row end"><button class="btn ghost" data-a="c">Bekor qilish</button><button class="btn ghost" data-a="r">Mavjudlarini almashtirish</button><button class="btn" data-a="a">Qo'shish</button></div>`, { wide: true });
    box.onclick = (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a !== 'c') {
        items.forEach(x => delete x._noAnswer);
        if (b.dataset.a === 'r') arr.splice(0);
        arr.push(...items); saveState(); toast(`${items.length} ta savol qo'shildi`, 'ok'); after();
      }
      closeModal();
    };
  },

  tab_tests(el) { this.sectionsPanel(el, S.testSections, 'mcq'); },
  tab_written(el) { this.sectionsPanel(el, S.writtenSections, 'qa'); },
  tab_games(el) {
    el.innerHTML = `<div class="card"><p>Har bir o'yin uchun alohida savollar bazasi. O'yinlarda test va yozma bo'limlardagi savollardan ham foydalanish mumkin.</p>
      <div class="tabs sub"><button data-g="zakovat" class="on">🧠 Zakovat (savol-javob)</button><button data-g="kahoot">🏁 Bilimlar bellashuvi (4 variant)</button><button data-g="quiz">🚀 Shifo sayohati (4 variant)</button></div>
      <div id="gq"></div></div>`;
    const open = (g) => { $$('[data-g]', el).forEach(b => b.classList.toggle('on', b.dataset.g === g)); this.qEditor($('#gq'), S.games[g], g === 'zakovat' ? 'qa' : 'mcq'); };
    $$('[data-g]', el).forEach(b => b.onclick = () => open(b.dataset.g));
    open('zakovat');
  },

  tab_books(el) {
    const secs = S.bookSections;
    el.innerHTML = `<div class="card"><div class="row between"><h3>Kitob bo'limchalari</h3><button class="btn sm" id="addbs">+ Bo'limcha qo'shish</button></div>
      ${secs.map(s => `<div class="booksec">
        <div class="row between"><h4>📂 ${esc(s.name)} <small class="muted">(${s.books.length} ta kitob)</small></h4>
        <div class="nowrap"><button class="btn sm" data-addb="${s.id}">+ Kitob</button> <button class="btn sm ghost" data-ren="${s.id}">Nomini o'zgartirish</button> <button class="btn sm danger ghost" data-dels="${s.id}">O'chirish</button></div></div>
        <ul class="blist">${s.books.map(b => `<li><span>📘 <b>${esc(b.title)}</b> ${b.author ? '— ' + esc(b.author) : ''} ${b.fileId ? '<span class="tag">fayl</span>' : ''}${b.url ? '<span class="tag">havola</span>' : ''}</span>
          <span class="nowrap"><button class="btn sm ghost" data-eb="${s.id}|${b.id}">✎</button><button class="btn sm ghost" data-db="${s.id}|${b.id}">✕</button></span></li>`).join('')}</ul></div>`).join('') || '<div class="empty">Bo\'limcha yo\'q</div>'}</div>`;
    const re = () => this.tab_books(el);
    $('#addbs').onclick = async () => { const n = await promptText("Bo'limcha nomi"); if (n) { secs.push({ id: uid(), name: n, books: [] }); saveState(); re(); } };
    $$('[data-ren]', el).forEach(b => b.onclick = async () => { const s = secs.find(x => x.id === b.dataset.ren); const n = await promptText('Yangi nom', s.name); if (n) { s.name = n; saveState(); re(); } });
    $$('[data-dels]', el).forEach(b => b.onclick = async () => {
      const s = secs.find(x => x.id === b.dataset.dels);
      if (!(await ask(`“${s.name}” bo'limchasi va ${s.books.length} ta kitob o'chirilsinmi?`, { ok: "O'chirish", danger: true }))) return;
      s.books.forEach(bk => bk.fileId && DB.del('files', bk.fileId)); secs.splice(secs.indexOf(s), 1); saveState(); re();
    });
    const bookForm = (s, bk) => {
      const box = modal(`<h3>${bk ? 'Kitobni tahrirlash' : 'Yangi kitob'} — ${esc(s.name)}</h3>
        <label>Kitob nomi</label><input class="inp" id="bt" value="${esc(bk ? bk.title : '')}">
        <label>Muallif</label><input class="inp" id="ba" value="${esc(bk ? bk.author : '')}">
        <label>Qisqacha tavsif</label><textarea class="inp" id="bd" rows="2">${esc(bk ? bk.desc : '')}</textarea>
        <label>Fayl (PDF, DOCX va h.k. — internetsiz o'qish uchun qurilmada saqlanadi)</label><input type="file" class="inp" id="bf">
        ${bk && bk.fileId ? '<small class="muted">Fayl mavjud. Yangisini tanlasangiz almashtiriladi.</small>' : ''}
        <label>yoki havola (URL)</label><input class="inp" id="bu" placeholder="https://..." value="${esc(bk ? bk.url : '')}">
        <div class="row end"><button class="btn ghost" id="bc">Bekor qilish</button><button class="btn" id="bs">Saqlash</button></div>`, { wide: true });
      $('#bc', box).onclick = closeModal;
      $('#bs', box).onclick = async () => {
        const title = $('#bt', box).value.trim(); if (!title) return toast('Kitob nomini kiriting', 'err');
        const f = $('#bf', box).files[0];
        const item = bk || { id: uid(), fileId: '' };
        Object.assign(item, { title, author: $('#ba', box).value.trim(), desc: $('#bd', box).value.trim(), url: $('#bu', box).value.trim() });
        if (f) { $('#bs', box).disabled = true; if (item.fileId) DB.del('files', item.fileId); item.fileId = await saveFile(f); }
        if (!bk) s.books.push(item);
        saveState(); closeModal(); toast('Saqlandi', 'ok'); re();
      };
    };
    $$('[data-addb]', el).forEach(b => b.onclick = () => bookForm(secs.find(x => x.id === b.dataset.addb)));
    const find = (v) => { const [sid, bid] = v.split('|'); const s = secs.find(x => x.id === sid); return [s, s.books.find(x => x.id === bid)]; };
    $$('[data-eb]', el).forEach(b => b.onclick = () => bookForm(...find(b.dataset.eb)));
    $$('[data-db]', el).forEach(b => b.onclick = async () => {
      const [s, bk] = find(b.dataset.db);
      if (!(await ask(`“${bk.title}” o'chirilsinmi?`, { ok: "O'chirish", danger: true }))) return;
      if (bk.fileId) DB.del('files', bk.fileId); s.books.splice(s.books.indexOf(bk), 1); saveState(); re();
    });
  },

  async tab_music(el) {
    const slots = [['lobby', "O'yinlar menyusi"], ['zakovat', 'Zakovat (asosiy)'], ['zakovat_think', "Zakovat (1 daqiqalik o'ylash vaqti)"], ['kahoot', 'Bilimlar bellashuvi'], ['quiz', 'Shifo sayohati']];
    const names = {};
    for (const [k] of slots) if (S.music[k]) { const f = await DB.get('files', S.music[k]); names[k] = f ? f.name : ''; }
    el.innerHTML = `<div class="card"><h3>🎵 O'yin musiqalari</h3>
      <p class="muted">Har bir o'yin uchun o'rnatilgan kuy bor. Xohlasangiz o'z musiqangizni (MP3, OGG, WAV) yuklang — u qurilmada saqlanadi va internetsiz ham ijro etiladi.</p>
      ${slots.map(([k, l]) => `<div class="row between musicrow"><div><b>${l}</b><br><small class="muted">${S.music[k] ? '🎶 ' + esc(names[k] || 'yuklangan fayl') : "O'rnatilgan kuy"}</small></div>
        <div class="nowrap"><button class="btn sm ghost" data-play="${k}">▶ Tinglash</button>
        <label class="btn sm filebtn">Yuklash<input type="file" accept="audio/*" hidden data-up="${k}"></label>
        ${S.music[k] ? `<button class="btn sm danger ghost" data-rm="${k}">O'rnatilganga qaytarish</button>` : ''}</div></div>`).join('')}
      <button class="btn sm ghost" id="stopm">■ To'xtatish</button></div>`;
    $$('[data-play]', el).forEach(b => b.onclick = () => { Sound.stopMusic(); Sound.music(b.dataset.play === 'zakovat_think' ? 'think' : b.dataset.play); });
    $('#stopm').onclick = () => Sound.stopMusic();
    $$('[data-up]', el).forEach(inp => inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return; const k = inp.dataset.up;
      if (S.music[k]) DB.del('files', S.music[k]);
      S.music[k] = await saveFile(f); saveState(); toast('Musiqa saqlandi', 'ok'); this.tab_music(el);
    });
    $$('[data-rm]', el).forEach(b => b.onclick = () => { DB.del('files', S.music[b.dataset.rm]); delete S.music[b.dataset.rm]; saveState(); Sound.stopMusic(); this.tab_music(el); });
  },

  tab_settings(el) {
    const st = S.settings;
    el.innerHTML = `<div class="card"><h3>Umumiy sozlamalar</h3>
      <div class="formgrid">
        <div><label>Admin paroli</label><input class="inp" id="sp" type="password" value="${esc(st.adminPass)}"></div>
        <div><label>Zakovat o'ylash vaqti (soniya)</label><input class="inp" id="sz" type="number" min="10" value="${st.zakovatTime}"></div>
        <div><label>Bellashuv javob vaqti (soniya)</label><input class="inp" id="sk" type="number" min="5" value="${st.kahootTime}"></div>
        <div><label>Sayohat javob vaqti (soniya)</label><input class="inp" id="sq" type="number" min="5" value="${st.quizTime}"></div>
      </div>
      <h3>🤖 Sun'iy intellekt (Anamnez uchun, internet kerak)</h3>
      <div class="formgrid">
        <div><label>Anthropic API kaliti</label><input class="inp" id="sa" type="password" placeholder="sk-ant-..." value="${esc(st.apiKey)}"></div>
        <div><label>Model</label><input class="inp" id="sm" value="${esc(st.model)}"></div>
      </div>
      <p class="muted small">Kalit faqat shu qurilmada saqlanadi. Saytni ommaga joylashda kalitni server orqali (proxy) ishlatish tavsiya etiladi.</p>
      <button class="btn" id="ss">Saqlash</button></div>
      <div class="card"><h3>💾 Zaxira nusxa va ko'chirish</h3>
      <p class="muted">Barcha savollar, bo'limlar, kitoblar va musiqalarni bitta faylga saqlang va boshqa qurilmaga yuklang.</p>
      <div class="row wrap"><button class="btn" id="ex">⬇ Eksport (fayllar bilan)</button><button class="btn ghost" id="ex2">⬇ Eksport (faqat savollar)</button>
      <label class="btn ghost filebtn">⬆ Import<input type="file" accept=".json" hidden id="im"></label>
      <button class="btn danger ghost" id="rs">Namuna ma'lumotlarga qaytarish</button></div></div>`;
    $('#ss').onclick = () => {
      st.adminPass = $('#sp').value || st.adminPass; st.apiKey = $('#sa').value.trim(); st.model = $('#sm').value.trim() || 'claude-sonnet-5-5';
      st.zakovatTime = Math.max(10, +$('#sz').value || 60); st.kahootTime = Math.max(5, +$('#sk').value || 20); st.quizTime = Math.max(5, +$('#sq').value || 15);
      saveState(); toast('Sozlamalar saqlandi', 'ok');
    };
    const exportData = async (withFiles) => {
      const out = { app: 'MED ASISTANT', exported: new Date().toISOString(), state: { ...S, settings: { ...S.settings, apiKey: '', adminPass: '' } }, files: {} };
      if (withFiles) {
        const ids = [...S.bookSections.flatMap(s => s.books.map(b => b.fileId)), ...Object.values(S.music)].filter(Boolean);
        for (const id of ids) {
          const f = await DB.get('files', id); if (!f) continue;
          out.files[id] = { name: f.name, type: f.type, data: await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f.blob); }) };
        }
      }
      const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `med-asistant-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    };
    $('#ex').onclick = () => exportData(true);
    $('#ex2').onclick = () => exportData(false);
    $('#im').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await f.text()); if (!j.state) throw new Error("Fayl formati noto'g'ri");
        if (!(await ask("Joriy ma'lumotlar import qilinayotgan fayl bilan almashtirilsinmi?", { ok: 'Almashtirish', danger: true }))) return;
        for (const [id, fl] of Object.entries(j.files || {})) { const blob = await (await fetch(fl.data)).blob(); await DB.put('files', id, { name: fl.name, type: fl.type, blob }); }
        const keep = { adminPass: S.settings.adminPass, apiKey: S.settings.apiKey };
        S = j.state; S.settings = { ...makeEmpty().settings, ...S.settings, ...keep };
        await DB.put('kv', 'state', S); toast('Import qilindi', 'ok'); this.home();
      } catch (err) { toast('Xatolik: ' + err.message, 'err'); }
    };
    $('#rs').onclick = async () => {
      if (!(await ask("Barcha ma'lumotlar o'chib, namuna ma'lumotlar tiklansinmi?", { ok: 'Tiklash', danger: true }))) return;
      const keep = { ...S.settings }; S = makeSeed(); S.settings = { ...S.settings, adminPass: keep.adminPass, apiKey: keep.apiKey, model: keep.model };
      await DB.put('kv', 'state', S); toast('Tiklandi', 'ok'); this.home();
    };
  },
};
