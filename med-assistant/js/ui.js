/* Umumiy yordamchi funksiyalar */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/* Variantlarni aralashtirish, to'g'ri javob indeksini saqlagan holda */
function shuffleOptions(q) {
  const idx = shuffle(q.options.map((_, i) => i));
  return { ...q, options: idx.map(i => q.options[i]), answer: idx.indexOf(q.answer) };
}
function pickRandom(arr, n) { return shuffle(arr).slice(0, Math.max(0, Math.min(n || arr.length, arr.length))); }
function fmtTime(sec) { sec = Math.max(0, Math.ceil(sec)); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; }

/* Sahifa tozalanganda to'xtatiladigan taymerlar */
const Cleanup = {
  list: [],
  add(fn) { this.list.push(fn); },
  run() { this.list.forEach(f => { try { f(); } catch (e) {} }); this.list = []; },
  interval(fn, ms) { const id = setInterval(fn, ms); this.add(() => clearInterval(id)); return id; },
  timeout(fn, ms) { const id = setTimeout(fn, ms); this.add(() => clearTimeout(id)); return id; },
};

function view(html, cls = '') {
  const app = $('#app');
  app.className = cls;
  app.innerHTML = html;
  window.scrollTo(0, 0);
  return app;
}

function toast(msg, type = '') {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast show ' + type;
  clearTimeout(t._h); t._h = setTimeout(() => t.className = 'toast', 2600);
}

function modal(html, { wide = false } = {}) {
  const m = $('#modal'), box = $('#modalbox');
  box.className = 'modalbox' + (wide ? ' wide' : '');
  box.innerHTML = html;
  m.classList.remove('hidden');
  return box;
}
function closeModal() { $('#modal').classList.add('hidden'); $('#modalbox').innerHTML = ''; }

function ask(message, { ok = 'Ha', cancel = 'Bekor qilish', danger = false } = {}) {
  return new Promise(res => {
    const box = modal(`<p class="modalmsg">${nl2br(message)}</p><div class="row end">
      <button class="btn ghost" data-a="0">${esc(cancel)}</button>
      <button class="btn ${danger ? 'danger' : ''}" data-a="1">${esc(ok)}</button></div>`);
    box.onclick = (e) => { const b = e.target.closest('[data-a]'); if (!b) return; closeModal(); res(b.dataset.a === '1'); };
  });
}
function promptText(title, value = '') {
  return new Promise(res => {
    const box = modal(`<h3>${esc(title)}</h3><input class="inp" id="pt" value="${esc(value)}"><div class="row end">
      <button class="btn ghost" data-a="0">Bekor qilish</button><button class="btn" data-a="1">Saqlash</button></div>`);
    const inp = $('#pt', box); inp.focus(); inp.select();
    inp.onkeydown = (e) => { if (e.key === 'Enter') { closeModal(); res(inp.value.trim()); } };
    box.onclick = (e) => { const b = e.target.closest('[data-a]'); if (!b) return; const v = inp.value.trim(); closeModal(); res(b.dataset.a === '1' ? v : null); };
  });
}

/* Konfetti animatsiyasi */
function confetti(duration = 2500) {
  const c = $('#confetti'), ctx = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight; c.style.display = 'block';
  const colors = ['#11a39b', '#ffb703', '#fb5607', '#8338ec', '#3a86ff', '#ff006e', '#06d6a0'];
  const parts = Array.from({ length: 180 }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5,
    vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 4, r: 4 + Math.random() * 6,
    rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, col: colors[(Math.random() * colors.length) | 0],
  }));
  const end = performance.now() + duration;
  (function frame(t) {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); ctx.restore();
    });
    if (t < end) requestAnimationFrame(frame); else { ctx.clearRect(0, 0, c.width, c.height); c.style.display = 'none'; }
  })(performance.now());
}

/* Fayl (Blob) saqlash va ochish */
async function saveFile(file) {
  const id = 'f_' + uid();
  await DB.put('files', id, { name: file.name, type: file.type, blob: file });
  return id;
}
async function openFile(id) {
  const f = await DB.get('files', id);
  if (!f) { toast('Fayl topilmadi', 'err'); return; }
  const url = URL.createObjectURL(f.blob);
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener';
  if (!/pdf|image|text|audio|video/.test(f.type || '')) a.download = f.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
