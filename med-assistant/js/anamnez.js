/* Anamnez bosqichi: bemor ma'lumotlari -> ehtimoliy tashxislar va sabablari.
   Internet bo'lsa: sun'iy intellekt (Claude API). Internet bo'lmasa: oddiy ichki bilim bazasi. */
const SYMPTOMS = [
  ['fever', 'Isitma'], ['cough', "Yo'tal"], ['sputum', "Balg'am"], ['dyspnea', 'Hansirash / nafas qisishi'],
  ['chest', "Ko'krak qafasida og'riq"], ['palp', 'Yurak tez urishi'], ['headache', "Bosh og'rig'i"], ['dizzy', 'Bosh aylanishi'],
  ['nausea', "Ko'ngil aynishi"], ['vomit', 'Qusish'], ['abd', "Qorin og'rig'i"], ['diarrhea', 'Ich ketishi'],
  ['constip', 'Ich qotishi'], ['dysuria', "Siyganda og'riq / achishish"], ['freq', 'Tez-tez siyish'], ['thirst', 'Kuchli chanqash'],
  ['weightloss', 'Ozib ketish'], ['weak', 'Holsizlik, tez charchash'], ['throat', "Tomoq og'rig'i"], ['nose', 'Burun bitishi / oqishi'],
  ['joint', "Bo'g'im og'rig'i"], ['rash', 'Teri toshmasi / qichishish'], ['edema', 'Shishlar'], ['jaundice', 'Sariqlik'],
  ['back', "Bel og'rig'i"], ['pale', 'Rangparlik'], ['wheeze', 'Xirillash (hushtakli nafas)'], ['photo', "Yorug'likdan bezovtalanish"],
];
const KB = [
  { n: "O'tkir respirator virusli infeksiya (O'RVI)", s: { fever: 2, cough: 2, throat: 2, nose: 3, headache: 1, weak: 1 }, r: 'Yuqori nafas yo\'llari simptomlari va isitma virusli infeksiyaga xos.' },
  { n: 'Gripp', s: { fever: 3, headache: 2, weak: 3, cough: 2, joint: 1 }, r: "Keskin boshlangan yuqori isitma, kuchli holsizlik va mushak-bo'g'im og'riqlari grippga xos." },
  { n: 'Pnevmoniya (zotiljam)', s: { fever: 3, cough: 3, sputum: 3, dyspnea: 3, chest: 2, weak: 1 }, r: "Isitma, balg'amli yo'tal va hansirash o'pka to'qimasi yallig'lanishiga ishora qiladi." },
  { n: "O'tkir bronxit", s: { cough: 3, sputum: 2, fever: 1, wheeze: 1, chest: 1 }, r: "Asosiy simptom — yo'tal (ko'pincha balg'amli), isitma yengil." },
  { n: 'Bronxial astma', s: { dyspnea: 3, wheeze: 3, cough: 2, chest: 1 }, r: "Xurujsimon nafas qisishi va hushtakli nafas bronxlar obstruksiyasiga xos." },
  { n: "O'tkir tonzillit (angina)", s: { throat: 3, fever: 3, headache: 1, weak: 1 }, r: "Kuchli tomoq og'rig'i va yuqori isitma bodomcha bezlari yallig'lanishiga xos." },
  { n: 'Stenokardiya / o\'tkir koronar sindrom', s: { chest: 4, dyspnea: 2, palp: 1, dizzy: 1, nausea: 1 }, r: "Ko'krak qafasidagi og'riq (ayniqsa zo'riqishda, chap qo'lga/jag'ga tarqaluvchi) miokard ishemiyasini istisno qilishni talab qiladi." },
  { n: 'Arterial gipertenziya', s: { headache: 2, dizzy: 2, palp: 1 }, r: "Bosh og'rig'i, bosh aylanishi va yuqori arterial bosim.", bp: true },
  { n: 'Yurak yetishmovchiligi', s: { dyspnea: 3, edema: 3, weak: 2, palp: 1 }, r: "Hansirash va oyoqlardagi shishlar qon aylanishi yetishmovchiligiga ishora qiladi." },
  { n: 'Gastrit / oshqozon yarasi', s: { abd: 3, nausea: 2, vomit: 1 }, r: "Epigastral sohadagi og'riq va dispepsiya." },
  { n: "O'tkir appenditsit", s: { abd: 4, nausea: 2, vomit: 2, fever: 2 }, r: "Qorin og'rig'i (o'ng yonbosh sohasiga ko'chuvchi), ko'ngil aynishi va subfebril isitma. Jarroh ko'rigi zarur." },
  { n: 'Xoletsistit', s: { abd: 3, nausea: 2, vomit: 2, fever: 1, jaundice: 1 }, r: "O'ng qovurg'a ostidagi og'riq, yog'li ovqatdan keyin kuchayishi." },
  { n: 'Gastroenterit (ichak infeksiyasi)', s: { diarrhea: 4, vomit: 2, nausea: 2, abd: 2, fever: 1 }, r: "Ich ketishi va qusish ichak infeksiyasiga xos; suvsizlanish xavfi bor." },
  { n: 'Sistit', s: { dysuria: 4, freq: 3, abd: 1 }, r: "Siyganda achishish va tez-tez siyish quyi siydik yo'llari infeksiyasiga xos." },
  { n: 'Pielonefrit', s: { fever: 3, back: 3, dysuria: 2, freq: 1, vomit: 1 }, r: "Isitma, bel og'rig'i va siydik buzilishlari buyrak infeksiyasiga ishora qiladi." },
  { n: 'Qandli diabet', s: { thirst: 4, freq: 3, weightloss: 2, weak: 2 }, r: "Chanqash, ko'p siyish va ozib ketish giperglikemiyaga xos. Qonda glyukozani tekshirish kerak." },
  { n: 'Virusli gepatit', s: { jaundice: 4, weak: 2, nausea: 2, abd: 1, fever: 1 }, r: "Sariqlik va holsizlik jigar zararlanishiga ishora qiladi." },
  { n: 'Migren', s: { headache: 4, nausea: 2, photo: 3, vomit: 1 }, r: "Xurujsimon kuchli bosh og'rig'i, yorug'likdan bezovtalanish va ko'ngil aynishi." },
  { n: 'Temir tanqisligi anemiyasi', s: { weak: 3, pale: 3, dizzy: 2, palp: 1, dyspnea: 1 }, r: "Rangparlik, holsizlik va bosh aylanishi gemoglobin kamligiga xos." },
  { n: 'Allergik reaksiya', s: { rash: 3, nose: 2, wheeze: 1, edema: 1 }, r: "Toshma, qichishish va burun oqishi allergik javobga xos." },
  { n: "Revmatoid artrit / artrit", s: { joint: 4, edema: 1, weak: 1 }, r: "Bo'g'imlardagi og'riq va shish yallig'lanishli bo'g'im kasalligiga ishora qiladi." },
  { n: 'Gipotireoz', s: { weak: 3, constip: 2, edema: 1, pale: 1 }, r: "Holsizlik, ich qotishi va shishlar qalqonsimon bez faoliyati pasayishiga xos bo'lishi mumkin." },
];

const Anamnez = {
  data: null, chat: [],
  home() {
    const d = this.data || {};
    const online = navigator.onLine;
    view(`<section class="page">
      <div class="pagehead"><h1>🩺 Anamnez — AI yordamchi</h1>
        <p>Bemor ma'lumotlarini kiriting. Tizim ehtimoliy tashxislar va ularning sabablarini ko'rsatadi.</p></div>
      <div class="notice ${online && S.settings.apiKey ? 'ok' : 'warn'}">
        ${online && S.settings.apiKey ? "✅ Sun'iy intellekt ulangan (internet bor)." :
          !online ? "📴 Internet yo'q: sun'iy intellekt ishlamaydi, ichki bilim bazasi asosida taxminiy tahlil qilinadi." :
          "⚠️ AI kaliti kiritilmagan (Admin → Sozlamalar). Hozircha ichki bilim bazasi ishlatiladi."}
      </div>
      <form class="card" id="af">
        <h3>1. Pasport ma'lumotlari</h3>
        <div class="formgrid">
          <div><label>Yoshi</label><input class="inp" name="age" type="number" min="0" value="${esc(d.age || '')}"></div>
          <div><label>Jinsi</label><select class="inp" name="sex"><option value="">—</option><option ${d.sex === 'Erkak' ? 'selected' : ''}>Erkak</option><option ${d.sex === 'Ayol' ? 'selected' : ''}>Ayol</option></select></div>
          <div><label>Kasbi</label><input class="inp" name="job" value="${esc(d.job || '')}"></div>
        </div>
        <h3>2. Shikoyatlar</h3>
        <textarea class="inp" name="complaints" rows="3" placeholder="Masalan: 3 kundan beri isitma 38.5, quruq yo'tal, holsizlik...">${esc(d.complaints || '')}</textarea>
        <label>Asosiy simptomlarni belgilang</label>
        <div class="symgrid">${SYMPTOMS.map(([k, l]) => `<label class="sym"><input type="checkbox" name="s_${k}" ${d['s_' + k] ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div>
        <h3>3. Kasallik anamnezi (Anamnesis morbi)</h3>
        <div class="formgrid">
          <div><label>Qachondan beri?</label><input class="inp" name="duration" placeholder="masalan, 3 kun" value="${esc(d.duration || '')}"></div>
          <div><label>Qanday boshlangan?</label><select class="inp" name="onset"><option value="">—</option>${['To\'satdan', 'Asta-sekin'].map(o => `<option ${d.onset === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
        </div>
        <textarea class="inp" name="morbi" rows="2" placeholder="Kasallik qanday rivojlangan, nima bilan bog'liq, qanday davolangan...">${esc(d.morbi || '')}</textarea>
        <h3>4. Hayot anamnezi (Anamnesis vitae)</h3>
        <div class="formgrid">
          <div><label>O'tkazilgan / surunkali kasalliklar</label><input class="inp" name="chronic" value="${esc(d.chronic || '')}"></div>
          <div><label>Qabul qilayotgan dorilar</label><input class="inp" name="meds" value="${esc(d.meds || '')}"></div>
          <div><label>Allergiya</label><input class="inp" name="allergy" value="${esc(d.allergy || '')}"></div>
          <div><label>Zararli odatlar</label><input class="inp" name="habits" placeholder="chekish, alkogol..." value="${esc(d.habits || '')}"></div>
          <div><label>Irsiyat</label><input class="inp" name="family" value="${esc(d.family || '')}"></div>
          <div><label>Epidemiologik anamnez</label><input class="inp" name="epid" placeholder="safar, bemor bilan kontakt..." value="${esc(d.epid || '')}"></div>
        </div>
        <h3>5. Obyektiv ko'rsatkichlar</h3>
        <div class="formgrid">
          <div><label>Tana harorati (°C)</label><input class="inp" name="temp" type="number" step="0.1" value="${esc(d.temp || '')}"></div>
          <div><label>Arterial bosim (mm sim. ust.)</label><input class="inp" name="bp" placeholder="120/80" value="${esc(d.bp || '')}"></div>
          <div><label>Puls (urish/daq)</label><input class="inp" name="pulse" type="number" value="${esc(d.pulse || '')}"></div>
          <div><label>Nafas soni (daq)</label><input class="inp" name="rr" type="number" value="${esc(d.rr || '')}"></div>
          <div><label>SpO₂ (%)</label><input class="inp" name="spo2" type="number" value="${esc(d.spo2 || '')}"></div>
          <div><label>Glyukoza (mmol/l)</label><input class="inp" name="glu" type="number" step="0.1" value="${esc(d.glu || '')}"></div>
        </div>
        <textarea class="inp" name="exam" rows="2" placeholder="Ko'rik natijalari, laborator tahlillar (ixtiyoriy)...">${esc(d.exam || '')}</textarea>
        <div class="row"><button class="btn big" type="submit">🔎 Tahlil qilish</button><button class="btn ghost" type="button" id="clr">Tozalash</button></div>
      </form>
      <div id="ares"></div>
    </section>`);
    $('#clr').onclick = () => { this.data = null; this.chat = []; this.home(); };
    $('#af').onsubmit = (e) => { e.preventDefault(); this.analyze(); };
  },

  collect() {
    const fd = new FormData($('#af')); const d = {};
    for (const [k, v] of fd.entries()) d[k] = v === 'on' ? true : v;
    this.data = d; return d;
  },
  summary(d) {
    const sy = SYMPTOMS.filter(([k]) => d['s_' + k]).map(([, l]) => l).join(', ');
    const L = [];
    const add = (lab, v) => { if (v) L.push(`${lab}: ${v}`); };
    add('Yoshi', d.age); add('Jinsi', d.sex); add('Kasbi', d.job);
    add('Shikoyatlar', d.complaints); add('Belgilangan simptomlar', sy);
    add('Davomiyligi', d.duration); add('Boshlanishi', d.onset); add('Kasallik anamnezi', d.morbi);
    add('Surunkali kasalliklar', d.chronic); add('Dorilar', d.meds); add('Allergiya', d.allergy);
    add('Zararli odatlar', d.habits); add('Irsiyat', d.family); add('Epidemiologik anamnez', d.epid);
    add('Harorat', d.temp && d.temp + ' °C'); add('AB', d.bp); add('Puls', d.pulse); add('Nafas soni', d.rr);
    add('SpO2', d.spo2 && d.spo2 + '%'); add('Glyukoza', d.glu && d.glu + ' mmol/l'); add("Ko'rik/tahlillar", d.exam);
    return L.join('\n');
  },

  async analyze() {
    const d = this.collect();
    const sum = this.summary(d);
    if (!sum.trim()) return toast("Avval bemor ma'lumotlarini kiriting", 'err');
    const box = $('#ares');
    if (navigator.onLine && S.settings.apiKey) {
      box.innerHTML = `<div class="card"><div class="spinner"></div> Sun'iy intellekt tahlil qilmoqda...</div>`;
      try {
        const txt = await this.callAI([{ role: 'user', content: `Bemor ma'lumotlari:\n${sum}\n\nTahlilni faqat JSON ko'rinishida qaytaring.` }], true);
        const json = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
        this.chat = [{ role: 'user', content: `Bemor ma'lumotlari:\n${sum}` }, { role: 'assistant', content: txt }];
        this.render(json, 'ai');
        return;
      } catch (e) {
        console.error(e);
        toast('AI bilan bog\'lanib bo\'lmadi: ' + e.message, 'err');
      }
    }
    this.render(this.offline(d), 'offline');
  },

  offline(d) {
    const temp = parseFloat(d.temp); const sys = parseInt(String(d.bp || '').split('/')[0], 10);
    const text = (d.complaints + ' ' + d.morbi).toLowerCase();
    const has = (k) => !!d['s_' + k];
    const kwords = { fever: /isitma|harorat|temperatura/, cough: /yo'tal|yotal/, dyspnea: /hansira|nafas qis/, chest: /ko'krak|yurak og'ri/, headache: /bosh og'ri/, abd: /qorin|oshqozon/, diarrhea: /ich ket/, vomit: /qus/, throat: /tomoq/, jaundice: /sariq/, thirst: /chanqa/, rash: /toshma|qichi/, joint: /bo'g'im/, back: /bel og'ri/, edema: /shish/ };
    const sym = {}; SYMPTOMS.forEach(([k]) => sym[k] = has(k) || (kwords[k] && kwords[k].test(text)));
    if (temp >= 37.5) sym.fever = true;
    const scored = KB.map(c => {
      let sc = 0, max = 0;
      for (const k in c.s) { max += c.s[k]; if (sym[k]) sc += c.s[k]; }
      if (c.bp) { max += 4; if (sys >= 140) sc += 4; }
      if (c.n === 'Qandli diabet' && parseFloat(d.glu) >= 7) sc += 4;
      return { name: c.n, score: sc, prob: max ? sc / max : 0, reasons: [c.r] };
    }).filter(c => c.score > 0).sort((a, b) => b.prob - a.prob || b.score - a.score).slice(0, 5);
    const red = [];
    if (temp >= 39.5) red.push('Juda yuqori harorat (≥39.5 °C)');
    if (parseInt(d.spo2) && parseInt(d.spo2) < 94) red.push('SpO₂ 94% dan past — nafas yetishmovchiligi xavfi');
    if (sys >= 180) red.push('Arterial bosim ≥180 — gipertonik kriz xavfi');
    if (sym.chest) red.push("Ko'krak og'rig'i — EKG va troponinni zudlik bilan tekshiring");
    if (parseInt(d.pulse) > 120) red.push('Taxikardiya >120');
    return {
      summary: "Ichki bilim bazasi asosida taxminiy tahlil (internetsiz rejim). Natija simptomlar mosligiga asoslangan va aniq tashxis emas.",
      diagnoses: scored.map(c => ({ name: c.name, probability: Math.round(c.prob * 100), reasons: c.reasons })),
      questions: ["Simptomlar qaysi vaqtda kuchayadi?", "Avval shunga o'xshash holat bo'lganmi?", "Oilada shunday kasallik bormi?", "Qanday dorilar qabul qilindi va samarasi?"],
      tests: ['Umumiy qon tahlili', 'Umumiy siydik tahlili', 'Qonda glyukoza', 'Kerak bo\'lsa: EKG, ko\'krak qafasi rentgenografiyasi, qorin bo\'shlig\'i UZI'],
      redFlags: red,
    };
  },

  render(r, mode) {
    const box = $('#ares');
    box.innerHTML = `<div class="card ares">
      <div class="row between"><h2>Tahlil natijasi</h2><span class="tag ${mode}">${mode === 'ai' ? "🤖 Sun'iy intellekt" : '📴 Internetsiz rejim'}</span></div>
      ${r.summary ? `<p>${nl2br(r.summary)}</p>` : ''}
      ${r.redFlags && r.redFlags.length ? `<div class="notice bad"><b>⚠️ Xavfli belgilar:</b><ul>${r.redFlags.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <h3>Ehtimoliy tashxislar</h3>
      ${(r.diagnoses || []).length ? r.diagnoses.map(dg => `<div class="dx">
        <div class="row between"><b>${esc(dg.name)}</b><span class="pct">${esc(dg.probability)}%</span></div>
        <div class="pbar"><i style="width:${Math.min(100, +dg.probability || 0)}%"></i></div>
        <ul>${(dg.reasons || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('') : '<p class="muted">Mos keluvchi tashxis topilmadi. Ko\'proq ma\'lumot kiriting.</p>'}
      ${r.questions && r.questions.length ? `<h3>Aniqlashtiruvchi savollar</h3><ul>${r.questions.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${r.tests && r.tests.length ? `<h3>Tavsiya etiladigan tekshiruvlar</h3><ul>${r.tests.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <p class="muted small">Eslatma: bu natija yordamchi vosita bo'lib, yakuniy tashxis shifokor tomonidan qo'yiladi.</p>
    </div>
    ${mode === 'ai' ? `<div class="card"><h3>💬 AI bilan suhbatni davom ettirish</h3><div class="chat" id="chat"></div>
      <form class="row" id="cf"><input class="inp" id="cmsg" placeholder="Qo'shimcha savol yoki ma'lumot yozing..."><button class="btn">Yuborish</button></form></div>` : ''}`;
    box.scrollIntoView({ behavior: 'smooth' });
    if (mode === 'ai') {
      $('#cf').onsubmit = async (e) => {
        e.preventDefault();
        const v = $('#cmsg').value.trim(); if (!v) return;
        $('#cmsg').value = '';
        this.chat.push({ role: 'user', content: v }); this.drawChat(true);
        try {
          const ans = await this.callAI(this.chat, false);
          this.chat.push({ role: 'assistant', content: ans });
        } catch (err) { this.chat.push({ role: 'assistant', content: 'Xatolik: ' + err.message }); }
        this.drawChat(false);
      };
    }
  },
  drawChat(loading) {
    const md = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    $('#chat').innerHTML = this.chat.slice(2).map(m => `<div class="msg ${m.role}">${md(m.content)}</div>`).join('') + (loading ? '<div class="msg assistant"><div class="spinner"></div></div>' : '');
  },

  async callAI(messages, wantJson) {
    const system = `Siz tajribali klinitsist-shifokorga yordam beruvchi tibbiy AI yordamchisiz. Faqat o'zbek tilida (lotin yozuvida) javob bering.
Shifokor kiritgan anamnez asosida differensial tashxis qiling. Bu shifokor uchun yordamchi vosita; yakuniy qarorni shifokor qabul qiladi.
${wantJson ? `Javobni FAQAT quyidagi JSON ko'rinishida bering, boshqa matnsiz:
{"summary":"qisqa klinik xulosa","diagnoses":[{"name":"tashxis","probability":0-100 butun son,"reasons":["nega bu tashxis ehtimoli bor — anamnezdagi qaysi belgilar"]}],"redFlags":["shoshilinch e'tibor talab qiladigan belgilar"],"questions":["tashxisni aniqlashtirish uchun bemorga beriladigan savollar"],"tests":["tavsiya etiladigan tekshiruvlar"]}
3–6 ta tashxisni ehtimollik kamayishi tartibida bering.` : "Qisqa va aniq javob bering. Kerak bo'lsa aniqlashtiruvchi savollar bering va tashxislar ro'yxatini yangilang."}`;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': S.settings.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: S.settings.model || 'claude-sonnet-5-5', max_tokens: 2000, system, messages }),
    });
    if (!res.ok) { let m = res.status + ''; try { m = (await res.json()).error.message; } catch (e) {} throw new Error(m); }
    const j = await res.json();
    return j.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
  },
};
