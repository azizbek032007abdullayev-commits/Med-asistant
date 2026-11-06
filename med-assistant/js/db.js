/* Ma'lumotlar ombori: IndexedDB (internetsiz ishlaydi) */
const DB = (() => {
  let db = null;
  function open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('medasistant', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        if (!d.objectStoreNames.contains('files')) d.createObjectStore('files');
      };
      r.onsuccess = () => { db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  }
  function run(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = () => rej(t.error);
    });
  }
  return {
    open,
    get: (store, key) => run(store, 'readonly', s => s.get(key)),
    put: (store, key, val) => run(store, 'readwrite', s => s.put(val, key)),
    del: (store, key) => run(store, 'readwrite', s => s.delete(key)),
    keys: (store) => run(store, 'readonly', s => s.getAllKeys()),
  };
})();

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* Ilova holati */
let S = null;
let saveTimer = null;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => DB.put('kv', 'state', S).catch(e => console.error(e)), 150);
}
async function loadState() {
  await DB.open();
  S = await DB.get('kv', 'state');
  if (!S) { S = makeSeed(); await DB.put('kv', 'state', S); }
  // Yangi maydonlar bo'lsa qo'shib qo'yish
  const d = makeEmpty();
  for (const k in d) if (S[k] === undefined) S[k] = d[k];
  for (const k in d.settings) if (S.settings[k] === undefined) S.settings[k] = d.settings[k];
  for (const k in d.games) if (!S.games[k]) S.games[k] = d.games[k];
}
function makeEmpty() {
  return {
    version: 1,
    testSections: [],
    writtenSections: [],
    games: { zakovat: [], kahoot: [], quiz: [] },
    bookSections: [],
    music: {},           // { zakovat: fileId, kahoot: fileId, quiz: fileId }
    settings: {
      adminPass: 'admin123',
      apiKey: '',
      model: 'claude-sonnet-5-5',
      zakovatTime: 60,
      kahootTime: 20,
      quizTime: 15,
    },
  };
}
