// 효과음: 파일 없이 브라우저(Web Audio)에서 바로 만들어요.
// SFX.play('이름') 으로 울려요. 오른쪽 위 🔊 버튼으로 끄고 켤 수 있고, 그 선택은 이 휴대폰에 기억돼요.
// SFX.play('name'). Phones only allow sound after the first tap, so the engine wakes up then.
window.SFX = (() => {
  let ctx = null, master = null, muted = false;
  try { muted = localStorage.getItem('gugu-sfx-muted') === '1'; } catch (e) {}
  const VOLUME = 0.55;
  function wake() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 6;
      master = ctx.createGain();
      master.gain.value = muted ? 0 : VOLUME;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // sound is only made after the visitor has touched the page at least once
  let touched = false;
  const unlock = () => { touched = true; wake(); };
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture: true, passive: true }));

  // one note: frequency (optionally gliding to f2), start offset, length, wave, loudness
  function tone(f, at = 0, dur = 0.2, type = 'sine', vol = 0.3, f2 = null, attack = 0.008) {
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  // a soft bell: a sine with a quiet bright overtone
  function bell(f, at = 0, dur = 0.6, vol = 0.22) {
    tone(f, at, dur, 'sine', vol);
    tone(f * 2.01, at, dur * 0.6, 'sine', vol * 0.25);
    tone(f * 3.98, at, dur * 0.3, 'sine', vol * 0.08);
  }
  let noiseBuf = null;
  // filtered noise: whooshes and puffs
  function noise(at = 0, dur = 0.3, vol = 0.15, from = 800, to = 3000, q = 1.2) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + at;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.05);
  }
  // C major pentatonic, so random sparkles always sound pretty together
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];
  const rnd = a => a[(Math.random() * a.length) | 0];

  const SOUNDS = {
    // right answer: ding-ding
    right() { bell(1046.5, 0, 0.5, 0.2); bell(1567.98, 0.1, 0.8, 0.2); },
    // wrong answer: a gentle, funny "boo-boop" (not scary for kids)
    wrong() { tone(330, 0, 0.16, 'triangle', 0.2, 294); tone(262, 0.17, 0.28, 'triangle', 0.2, 220); },
    // a book slides into its place on the shelf; each one a step higher
    place(n = 0) { noise(0, 0.08, 0.06, 1500, 600, 2); tone(PENTA[Math.min(n, 6)], 0.03, 0.18, 'triangle', 0.14); },
    // 스무고개: 응! / 아니!
    yes() { tone(660, 0, 0.12, 'sine', 0.18, 990); bell(1320, 0.08, 0.3, 0.1); },
    no() { tone(440, 0, 0.18, 'sine', 0.16, 330); },
    // a thought cloud puffs away
    puff() { noise(0, 0.25, 0.1, 2500, 700, 1); },
    // 갈림길 동화: a page turns
    page() { noise(0, 0.22, 0.07, 700, 3200, 0.9); bell(PENTA[4], 0.12, 0.35, 0.06); },
    // 찬스: a magic sweep
    chance() { for (let i = 0; i < 8; i++) bell(PENTA[2 + i], i * 0.05, 0.4, 0.09); noise(0, 0.6, 0.05, 1000, 6000, 0.8); },
    // a round lost: two soft falling notes
    lose() { tone(523.25, 0, 0.25, 'triangle', 0.16); tone(392, 0.22, 0.45, 'triangle', 0.16); },
    // the result screen: a little fanfare
    fanfare() {
      [[523.25, 0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.38]].forEach(([f, t]) => tone(f, t, 0.18, 'square', 0.06));
      bell(1046.5, 0.38, 1.0, 0.18); bell(1318.51, 0.38, 1.0, 0.12); bell(1567.98, 0.38, 1.0, 0.1);
      for (let i = 0; i < 6; i++) bell(rnd(PENTA.slice(5)), 0.55 + i * 0.07, 0.4, 0.05);
    },
    // the golden book
    gold() { for (let i = 0; i < 10; i++) bell(PENTA[i], i * 0.06, 0.6, 0.1); bell(2093, 0.65, 1.2, 0.14); },
    // five taps: 구구독/구구덕 giggles
    giggle() { for (let i = 0; i < 5; i++) tone(900 + (i % 2) * 220, i * 0.08, 0.07, 'sine', 0.13, 1100 + (i % 2) * 220); },
    // 오늘의 책: the drum-roll ticks while titles spin by
    tick() { tone(1100 + Math.random() * 500, 0, 0.035, 'square', 0.035); },
    // the heart of little stars
    heart() { bell(783.99, 0, 0.5, 0.12); bell(1046.5, 0.12, 0.5, 0.12); bell(1318.51, 0.24, 0.8, 0.12); },
  };

  // the same sound is not played again within a few hundredths of a second (no pile-ups)
  const lastAt = {};
  function play(name, arg) {
    if (muted || !touched || !SOUNDS[name] || !wake() || ctx.state === 'closed') return;
    const now = performance.now();
    if (now - (lastAt[name] || 0) < 60) return;
    lastAt[name] = now;
    try { SOUNDS[name](arg); } catch (e) {}
  }
  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('gugu-sfx-muted', m ? '1' : '0'); } catch (e) {}
    if (master) master.gain.setTargetAtTime(m ? 0 : VOLUME, ctx.currentTime, 0.03);
  }
  // the sound button
  const btn = document.getElementById('soundBtn');
  const paint = () => {
    btn.textContent = muted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', muted ? '효과음 켜기' : '효과음 끄기');
    btn.classList.toggle('off', muted);
  };
  paint();
  btn.addEventListener('click', e => {
    e.stopPropagation();
    setMuted(!muted); paint();
    if (!muted) wake();
  });
  return { play };
})();
