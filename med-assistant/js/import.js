/* Fayldan savollarni avtomatik o'qish: DOCX, Excel (xlsx/xls/csv), PDF, TXT
   kind = 'mcq' (4 variantli test) yoki 'qa' (savol-javob) */
const Importer = (() => {
  const loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Kutubxona yuklanmadi: ' + src));
      document.head.appendChild(s);
    });
    return loaded[src];
  }

  async function read(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'docx') {
      await loadScript('vendor/mammoth.browser.min.js');
      const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return { text: r.value };
    }
    if (['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
      await loadScript('vendor/xlsx.full.min.js');
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      let rows = [];
      wb.SheetNames.forEach(n => { rows = rows.concat(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '' })); });
      return { rows };
    }
    if (ext === 'pdf') {
      await loadScript('vendor/pdf.min.js');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      let text = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const tc = await page.getTextContent();
        let lastY = null;
        tc.items.forEach(it => {
          const y = it.transform ? it.transform[5] : null;
          if (lastY !== null && y !== null && Math.abs(y - lastY) > 2 && !text.endsWith('\n')) text += '\n';
          text += it.str; if (it.hasEOL) text += '\n';
          lastY = y;
        });
        text += '\n';
      }
      return { text };
    }
    if (['txt', 'md'].includes(ext)) return { text: await file.text() };
    throw new Error('Bu fayl turi qo\'llab-quvvatlanmaydi. DOCX, XLSX, XLS, CSV, PDF yoki TXT yuklang.');
  }

  const OPT_RE = /^([*+✓✔]?)\s*([A-Fa-fАБВГДабвгд])\s*[\)\.\:]\s*(.*?)\s*([*+✓✔]?)$/;
  const ANS_RE = /^(javob|to['‘’`ʻʼ]?g['‘’`ʻʼ]?ri\s*javob|answer|ответ|правильный\s*ответ|j)\s*[:\-–—]\s*(.+)$/i;
  const NUM_RE = /^(?:savol\s*)?(\d{1,4})\s*[\.\)\-:]\s*(.*)$/i;
  const SAVOL_RE = /^(savol|question|вопрос)\s*\d*\s*[:\.\-]\s*(.*)$/i;
  const CYR = { 'А': 0, 'Б': 1, 'В': 2, 'Г': 3, 'Д': 4 };
  const letterIdx = (l) => { const u = l.toUpperCase(); return CYR[u] ?? (u.charCodeAt(0) - 65); };

  function answerToIndex(ans, options) {
    ans = String(ans ?? '').trim();
    if (!ans) return -1;
    const m = ans.match(/^([A-Fa-fАБВГДабвгд])(?:\s*[\)\.\:]|$)/);
    if (m) return letterIdx(m[1]);
    if (/^\d$/.test(ans)) return parseInt(ans, 10) - 1;
    const low = ans.toLowerCase();
    return options.findIndex(o => String(o).trim().toLowerCase() === low);
  }

  function splitBlocks(text) {
    const lines = text.split(/\r?\n/).map(l => l.replace(/ /g, ' ').trim());
    const hasNumbers = lines.filter(l => (NUM_RE.test(l) || SAVOL_RE.test(l)) && !OPT_RE.test(l)).length >= 1;
    const blocks = [];
    let cur = null;
    if (hasNumbers) {
      for (const l of lines) {
        if (!l) continue;
        const isStart = (NUM_RE.test(l) || SAVOL_RE.test(l)) && !OPT_RE.test(l) && !ANS_RE.test(l);
        if (isStart) { cur = []; blocks.push(cur); const mm = l.match(SAVOL_RE) || l.match(NUM_RE); cur.push(mm[2]); }
        else if (cur) cur.push(l);
      }
    } else {
      for (const l of lines) {
        if (!l) { cur = null; continue; }
        if (!cur) { cur = []; blocks.push(cur); }
        cur.push(l);
      }
    }
    return blocks.filter(b => b.length && b.join('').trim());
  }

  function parseBlockMCQ(b) {
    let q = [], options = [], answer = -1, ansText = '';
    for (const l of b) {
      const a = l.match(ANS_RE);
      if (a) { ansText = a[2]; continue; }
      const o = l.match(OPT_RE);
      if (o && (options.length || q.length)) {
        if (o[1] || o[4]) answer = options.length;
        options.push(o[3]);
      } else if (options.length) options[options.length - 1] += ' ' + l;
      else q.push(l);
    }
    if (answer < 0 && ansText) answer = answerToIndex(ansText, options);
    // Variantlar bitta qatorda yozilgan bo'lsa: "A) ... B) ... C) ... D) ..."
    if (!options.length && q.length) {
      const joined = q.join(' ');
      const parts = joined.split(/\s(?=[A-DА-Г]\s*\))/);
      if (parts.length >= 3) { q = [parts.shift()]; parts.forEach(p => { const o = p.match(OPT_RE); if (o) { if (o[1] || o[4]) answer = options.length; options.push(o[3]); } }); if (answer < 0 && ansText) answer = answerToIndex(ansText, options); }
    }
    const question = q.join(' ').trim();
    if (!question || options.length < 2) return null;
    if (answer < 0 || answer >= options.length) answer = 0; // belgilanmagan bo'lsa birinchi variant — admin tekshiradi
    return { id: uid(), q: question, options, answer, _noAnswer: !(ansText || b.some(l => { const o = l.match(OPT_RE); return o && (o[1] || o[4]); })) };
  }
  function parseBlockQA(b) {
    let q = [], a = [], inAns = false;
    for (const l of b) {
      const m = l.match(ANS_RE);
      if (m) { inAns = true; a.push(m[2]); continue; }
      (inAns ? a : q).push(l);
    }
    if (!a.length && q.length > 1) { a = q.slice(1); q = q.slice(0, 1); }
    const question = q.join(' ').trim();
    if (!question) return null;
    return { id: uid(), q: question, a: a.join('\n').trim() || '—' };
  }

  function fromRows(rows, kind) {
    rows = rows.map(r => r.map(c => String(c ?? '').trim())).filter(r => r.some(Boolean));
    if (rows.length && /savol|question|вопрос|№/i.test(rows[0].join(' '))) rows.shift();
    const out = [];
    for (let r of rows) {
      if (/^\d{1,4}$/.test(r[0]) && r.length > (kind === 'mcq' ? 5 : 2)) r = r.slice(1); // raqam ustuni
      if (kind === 'mcq') {
        const q = r[0]; const opts = r.slice(1, 5).filter(Boolean);
        if (!q || opts.length < 2) continue;
        let ans = answerToIndex(r[5], opts); const marked = ans >= 0;
        if (ans < 0) ans = 0;
        out.push({ id: uid(), q, options: opts, answer: ans, _noAnswer: !marked });
      } else {
        if (!r[0]) continue;
        out.push({ id: uid(), q: r[0], a: r[1] || '—' });
      }
    }
    return out;
  }

  async function parse(file, kind) {
    const data = await read(file);
    if (data.rows) return fromRows(data.rows, kind);
    const blocks = splitBlocks(data.text);
    return blocks.map(kind === 'mcq' ? parseBlockMCQ : parseBlockQA).filter(Boolean);
  }

  return { parse, read, loadScript };
})();
