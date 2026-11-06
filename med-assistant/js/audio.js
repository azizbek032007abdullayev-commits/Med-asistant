/* Musiqa va ovoz effektlari (Web Audio — internetsiz ishlaydi).
   Admin har bir o'yin uchun o'z musiqa faylini yuklasa, o'sha ijro etiladi. */
const Sound = (() => {
  let ctx = null, master = null, musicGain = null;
  let muted = localStorage.getItem('ma_muted') === '1';
  let loopTimer = null, customAudio = null, current = null;

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.32; musicGain.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, { type = 'sine', vol = 0.3, dest = null, attack = 0.01, slide = 0 } = {}) {
    const c = ac(); const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(dest || master); o.start(start); o.stop(start + dur + 0.05);
  }
  function noise(start, dur, vol = 0.2, dest = null, hp = 4000) {
    const c = ac(); const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(dest || master); s.start(start);
  }
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz

  /* Har bir o'yin uchun alohida kuy */
  const THEMES = {
    lobby:   { bpm: 96,  prog: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], lead: 'triangle', drums: 1 },
    zakovat: { bpm: 72,  prog: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], lead: 'sine', drums: 0 },
    think:   { bpm: 120, prog: [[50, 53, 57], [50, 53, 58], [50, 53, 57], [49, 52, 57]], lead: 'square', drums: 2 },
    kahoot:  { bpm: 128, prog: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], lead: 'square', drums: 1 },
    quiz:    { bpm: 112, prog: [[55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57]], lead: 'triangle', drums: 1 },
  };

  function startSynth(name) {
    const th = THEMES[name] || THEMES.lobby; const c = ac();
    const step = 60 / th.bpm / 2; // sakkizlik nota
    let next = c.currentTime + 0.1, i = 0;
    loopTimer = setInterval(() => {
      while (next < c.currentTime + 0.4) {
        const bar = Math.floor(i / 8) % th.prog.length, pos = i % 8, ch = th.prog[bar];
        if (pos === 0 || pos === 4) tone(N(ch[0] - 12), next, step * 3.5, { type: 'sine', vol: 0.35, dest: musicGain });
        const arp = [0, 1, 2, 1, 2, 0, 1, 2][pos];
        tone(N(ch[arp] + 12), next, step * 0.9, { type: th.lead, vol: th.lead === 'square' ? 0.06 : 0.12, dest: musicGain });
        if (pos === 0 && bar % 2 === 0) ch.forEach(n => tone(N(n), next, step * 7, { type: 'sine', vol: 0.05, dest: musicGain, attack: 0.3 }));
        if (th.drums) {
          if (pos % 4 === 0) tone(110, next, 0.15, { type: 'sine', vol: 0.4, dest: musicGain, slide: 0.4 });
          if (pos % 2 === 1) noise(next, 0.05, th.drums === 2 ? 0.12 : 0.06, musicGain);
        }
        next += step; i++;
      }
    }, 100);
  }

  async function music(name) {
    if (current === name) return;
    stopMusic(); current = name;
    const fid = S && S.music && S.music[name === 'think' ? 'zakovat_think' : name];
    if (fid) {
      try {
        const f = await DB.get('files', fid);
        if (f && current === name) {
          customAudio = new Audio(URL.createObjectURL(f.blob));
          customAudio.loop = true; customAudio.volume = muted ? 0 : 0.6;
          customAudio.play().catch(() => {});
          return;
        }
      } catch (e) {}
    }
    try { startSynth(name); } catch (e) {}
  }
  function stopMusic() {
    current = null;
    clearInterval(loopTimer); loopTimer = null;
    if (customAudio) { customAudio.pause(); URL.revokeObjectURL(customAudio.src); customAudio = null; }
  }
  function sfx(kind) {
    try {
      const c = ac(), t = c.currentTime;
      switch (kind) {
        case 'click': tone(880, t, 0.06, { type: 'triangle', vol: 0.15 }); break;
        case 'correct': tone(N(72), t, 0.15, { type: 'triangle', vol: 0.3 }); tone(N(76), t + 0.1, 0.15, { type: 'triangle', vol: 0.3 }); tone(N(79), t + 0.2, 0.35, { type: 'triangle', vol: 0.3 }); break;
        case 'wrong': tone(220, t, 0.25, { type: 'sawtooth', vol: 0.15, slide: 0.6 }); tone(160, t + 0.18, 0.35, { type: 'sawtooth', vol: 0.15, slide: 0.6 }); break;
        case 'tick': tone(1200, t, 0.04, { type: 'square', vol: 0.08 }); break;
        case 'tock': tone(700, t, 0.05, { type: 'square', vol: 0.12 }); break;
        case 'gong': [1, 2.4, 3.9, 5.3].forEach((m, k) => tone(98 * m, t, 3 - k * 0.5, { type: 'sine', vol: 0.35 / (k + 1), attack: 0.005 })); break;
        case 'start': [60, 64, 67, 72].forEach((n, k) => tone(N(n), t + k * 0.09, 0.2, { type: 'square', vol: 0.1 })); break;
        case 'win': [60, 64, 67, 72, 67, 72, 76, 79].forEach((n, k) => tone(N(n), t + k * 0.12, 0.3, { type: 'triangle', vol: 0.25 })); break;
        case 'whoosh': noise(t, 0.3, 0.15, null, 1200); break;
      }
    } catch (e) {}
  }
  function toggle() {
    muted = !muted; localStorage.setItem('ma_muted', muted ? '1' : '0');
    if (master) master.gain.value = muted ? 0 : 0.8;
    if (customAudio) customAudio.volume = muted ? 0 : 0.6;
    return muted;
  }
  return { music, stopMusic, sfx, toggle, isMuted: () => muted };
})();
