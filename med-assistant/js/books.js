/* Kitoblar bo'limi: bo'limchalar va kitoblar */
const Books = {
  home(secId) {
    const secs = S.bookSections;
    const active = secs.find(s => s.id === secId) || null;
    const list = active ? active.books.map(b => ({ ...b, sec: active.name })) : secs.flatMap(s => s.books.map(b => ({ ...b, sec: s.name })));
    view(`<section class="page">
      <div class="pagehead"><h1>📚 Kitoblar</h1><p>O'qish va bilimlarni oshirish uchun adabiyotlar.</p></div>
      <div class="booklayout">
        <aside class="card side">
          <a href="#/books" class="${!active ? 'on' : ''}">Barchasi <small>${secs.reduce((n, s) => n + s.books.length, 0)}</small></a>
          ${secs.map(s => `<a href="#/books/${s.id}" class="${active && active.id === s.id ? 'on' : ''}">${esc(s.name)} <small>${s.books.length}</small></a>`).join('')}
        </aside>
        <div>
          <input class="inp" id="bsearch" placeholder="🔍 Kitob nomi yoki muallif bo'yicha qidirish...">
          <div class="grid books" id="blist"></div>
        </div>
      </div>
    </section>`);
    const draw = (f = '') => {
      const items = list.filter(b => (b.title + ' ' + b.author).toLowerCase().includes(f.toLowerCase()));
      $('#blist').innerHTML = items.length ? items.map(b => `<div class="card book">
        <div class="bcover">📘</div>
        <div class="binfo"><h4>${esc(b.title)}</h4>${b.author ? `<div class="muted">${esc(b.author)}</div>` : ''}
        <small class="tag">${esc(b.sec)}</small>${b.desc ? `<p>${esc(b.desc)}</p>` : ''}
        <div class="row">${b.fileId ? `<button class="btn sm" data-open="${b.fileId}">📖 O'qish</button>` : ''}${b.url ? `<a class="btn sm ghost" href="${esc(b.url)}" target="_blank" rel="noopener">🔗 Havola</a>` : ''}</div></div>
      </div>`).join('') : `<div class="empty">Kitob topilmadi.</div>`;
      $$('[data-open]').forEach(b => b.onclick = () => openFile(b.dataset.open));
    };
    $('#bsearch').oninput = (e) => draw(e.target.value);
    draw();
  },
};
