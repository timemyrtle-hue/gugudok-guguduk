// 구구독 구구덕 페이지의 모든 동작
// 문장·문제·책 목록 같은 내용은 데이터 파일(replies.js, quiz.js …)에 있고, 여기는 그것을 화면에 움직이게 해요.
// 차례: 캐릭터 → 책장 배경 → 반짝이 → 나타나기·사라지기 → 말풍선 → 말 알아듣기 → 이름 → 끝 인사 → 숨은 비밀
//       → 그리기 반복 → 게임 창 → 취향 테스트 → 책장 정리 → 스무고개 → 오늘의 책 → 오늘의 책 카드 → 독서 영수증
//       → 책 속 대결 → 게임 메뉴
(() => {
  const shelf = document.getElementById('shelf');
  const stage = document.getElementById('stage');
  const sctx = shelf.getContext('2d');
  const ctx = stage.getContext('2d');
  const hint = document.getElementById('hint');
  const silhouette = document.getElementById('silhouette');
  silhouette.src = window.CHAR_IMAGES['duo-stand'];
  // the shadow stands below the welcome words and above the input bar, never under the words
  function placeSilhouette() {
    const top = hint.getBoundingClientRect().bottom + 16;
    const room = form.getBoundingClientRect().top - 12 - top;
    silhouette.hidden = room < 100;
    silhouette.style.top = top + 'px';
    silhouette.style.height = Math.min(room, 560) + 'px';
  }
  const heard = document.getElementById('heard');
  const toastEl = document.getElementById('toast');
  const form = document.getElementById('form');
  const input = document.getElementById('say');
  const title = document.getElementById('title');

  // split the title into letters so they can pop in one by one
  let letterIndex = 0;
  title.querySelectorAll('[data-split]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    for (const ch of text) {
      const s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.setProperty('--i', letterIndex++);
      el.appendChild(s);
    }
  });
  let W = 0, H = 0, DPR = 1;
  const DUST = [255, 236, 200];
  const IDLE_COUNT = 420;

  // ---------- characters ----------
  const CHARS = {
    dok: { name: '구구독', color: '#2fa9d8' },
    duk: { name: '구구덕', color: '#8b3ff0' },
  };
  // every pose the dust can turn into
  const POSES = {
    dok: ['dok-wave', 'dok-music', 'dok-hearteyes', 'dok-read', 'dok-shush', 'dok-books', 'dok-wink', 'dok-hearts'].map(id => ({ id })),
    duk: ['duk-music', 'duk-search', 'duk-wave', 'duk-read', 'duk-shush', 'duk-books', 'duk-think'].map(id => ({ id })),
    // concept art with both twins in one picture; `at` = where each stands, as a share of the original width
    duo: [
      // pom: where to look for 구구독's hat pom (x0, y0, x1, y1 as shares of the picture), for the lamp (eggs.js)
      { id: 'duo-stand', at: { dok: 0.29, duk: 0.70 }, pom: [0.2, 0, 0.5, 0.25] },
      { id: 'duo-cart', at: { dok: 0.39, duk: 0.68 }, pom: [0.3, 0.4, 0.65, 0.58] },
    ],
  };
  // filled with trimmed canvases once the pictures have loaded (see the bottom of the script)
  const IMGS = {};
  // a picture that is ready to draw, or null while it is still loading
  const pic = id => (IMGS[id] && IMGS[id].width ? IMGS[id] : null);
  // poses, plus the face-only pictures used as game menu icons (never shown as a pose)
  const ICONS = ['icon-dok-hearts', 'icon-duk-shush'];
  for (const id of [...Object.values(POSES).flat().map(p => p.id), ...ICONS]) {
    IMGS[id] = new Image();
    IMGS[id].src = window.CHAR_IMAGES[id];
  }
  // the original art has wide transparent margins; crop each picture to the figure itself
  function trim(img) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let j = 0; j < c.height; j += 2) for (let i = 0; i < c.width; i += 2) {
      if (d[(j * c.width + i) * 4 + 3] > 8) {
        if (i < x0) x0 = i; if (i > x1) x1 = i;
        if (j < y0) y0 = j; if (j > y1) y1 = j;
      }
    }
    // ox/ow remember the crop so positions in the original art can be found again
    c.ox = 0; c.ow = c.width;
    if (x1 <= x0 || y1 <= y0) return c;
    const pad = 4;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(c.width, x1 + pad); y1 = Math.min(c.height, y1 + pad);
    const out = document.createElement('canvas');
    out.width = x1 - x0; out.height = y1 - y0;
    out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    out.ox = x0; out.ow = c.width;
    return out;
  }
  const lastPose = {};
  function randomPose(key) {
    const list = POSES[key].filter(p => p !== lastPose[key]);
    return (lastPose[key] = pick(list));
  }
  // a shown item is one twin ('dok' / 'duk') or a 'duo' picture holding both
  const isDuo = s => s.key === 'duo';
  const isOut = key => shown.some(s => s.key === key || (isDuo(s) && key in s.pose.at));
  // where a twin's speech bubble should point, and which picture holds the twin
  function anchorOf(key) {
    for (const s of shown) {
      if (s.key === key) return { s, cx: s.dx + s.w / 2 };
      if (isDuo(s) && key in s.pose.at) {
        const px = s.pose.at[key] * (s.img.ow || s.img.width) - (s.img.ox || 0);
        return { s, cx: s.dx + px / s.img.width * s.w };
      }
    }
    return null;
  }

  // ---------- background: bookshelves + light beam ----------
  function drawShelf() {
    sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    sctx.clearRect(0, 0, W, H);
    const rnd = mulberry(7);
    const palette = ['#5b3f8f', '#3f6fa8', '#a6466f', '#c08a3e', '#2f7d6d', '#7c4ea8', '#4d5fb8', '#b5566a', '#3c8fa5', '#8a6a3a'];
    const shelfH = Math.max(110, H / 5.2);
    const rows = Math.ceil(H / shelfH) + 1;
    // the 독서 영수증 corner: the top row is left as bare wall, with a little wall shelf at the left.
    // On it the 독서 영수증 book (as big as the other books) stands upright, with three books beside it.
    const rcW = 30, rc = RECEIPT ? (() => {
      const y = Math.round(shelfH - 14), h = Math.round(shelfH * 0.72), lean = 0;
      const x0 = Math.max(8, Math.round(W * 0.02));
      const rx = x0 + 10, reach = rcW;
      const books = [{ w: 12, f: 0.76, c: 3 }, { w: 15, f: 0.84, c: 0 }];
      // the 취향 테스트 book stands right beside the 독서 영수증 book, as big as it
      const qx = rx + rcW + 3, qw = 26;
      let x = qx + qw + 3;
      books.forEach(b => { b.x = x; x += b.w + 1; });
      return { y, h, lean, rx, reach, x0, x1: x + 24, books, qx, qw };
    })() : null;
    // the hidden golden book (eggs.js) stands in a gap of its own on a shelf in the middle band, near a side
    let goldRow = -1, goldGap = null;
    if (gold && !gold.found) {
      const first = Math.ceil(H * 0.3 / shelfH), last = Math.max(first, Math.floor(H * 0.55 / shelfH));
      goldRow = first + Math.floor(gold.row * (last - first + 1)) - 1;
      if (rc) goldRow = Math.max(goldRow, 1); // never on the bare-wall 독서 영수증 row
      const w = 17, h = shelfH * 0.64, gx = Math.round(gold.fx * W - w / 2), baseY = (goldRow + 1) * shelfH;
      gold.rect = { x: gx, y: baseY - 8 - h, w, h };
      goldGap = [gx - 3, gx + w + 3];
    }
    for (let r = 0; r < rows; r++) {
      const baseY = (r + 1) * shelfH;
      let x = -10;
      while (x < W + 10) {
        const bw = 14 + rnd() * 26;
        const bh = shelfH * (0.55 + rnd() * 0.32);
        const tilt = rnd() < 0.06 ? (rnd() - 0.5) * 0.25 : 0;
        if ((r === 0 && rc) || (r === goldRow && x + bw > goldGap[0] && x < goldGap[1])) {
          x += bw + (rnd() < 0.08 ? 20 + rnd() * 30 : 0);
          continue;
        }
        sctx.save();
        sctx.translate(x + bw / 2, baseY - 8);
        sctx.rotate(tilt);
        sctx.fillStyle = palette[Math.floor(rnd() * palette.length)];
        sctx.globalAlpha = 0.28;
        roundRect(sctx, -bw / 2, -bh, bw - 2, bh, 3);
        sctx.fill();
        sctx.globalAlpha = 0.18;
        sctx.fillStyle = '#fff';
        sctx.fillRect(-bw / 2 + 3, -bh + 10, bw - 8, 3);
        sctx.fillRect(-bw / 2 + 3, -bh * 0.3, bw - 8, 2);
        sctx.restore();
        x += bw + (rnd() < 0.08 ? 20 + rnd() * 30 : 0);
      }
      // (the top row has no shelf board when it is the 독서 영수증 corner)
      if (r === 0 && rc) continue;
      sctx.globalAlpha = 0.55;
      sctx.fillStyle = '#3a2a1f';
      sctx.fillRect(0, baseY - 8, W, 12);
    }
    sctx.globalAlpha = 1;
    // the little wall shelf and the books around the 독서 영수증 book, in the room's own wood and book colours
    if (rc) {
      rc.books.forEach(b => {
        const bh = rc.h * b.f;
        sctx.globalAlpha = 0.4; sctx.fillStyle = palette[b.c];
        roundRect(sctx, b.x, rc.y - bh, b.w, bh, 2); sctx.fill();
        sctx.globalAlpha = 0.22; sctx.fillStyle = '#fff';
        sctx.fillRect(b.x + 2, rc.y - bh + 8, b.w - 4, 2.5); sctx.fillRect(b.x + 2, rc.y - bh * 0.3, b.w - 4, 2);
      });
      sctx.globalAlpha = 0.7; sctx.fillStyle = '#3a2a1f';
      sctx.fillRect(rc.x0, rc.y, rc.x1 - rc.x0, 10);
      [rc.x0 + 10, rc.x1 - 18].forEach(bx => { sctx.beginPath(); sctx.moveTo(bx, rc.y + 10); sctx.lineTo(bx + 8, rc.y + 10); sctx.lineTo(bx, rc.y + 22); sctx.closePath(); sctx.fill(); });
      sctx.globalAlpha = 1;
    }
    // the golden book: gilt cloth with a few raised bands, in the same light as its neighbours
    if (goldRow >= 0) {
      const { x, y, w, h } = gold.rect;
      const g = sctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#8a6420'); g.addColorStop(0.45, '#f2cf6a'); g.addColorStop(1, '#7a5618');
      sctx.globalAlpha = 0.85; sctx.fillStyle = g;
      roundRect(sctx, x, y, w, h, 3); sctx.fill();
      sctx.globalAlpha = 0.55; sctx.fillStyle = '#5a3f12';
      [10, 16, h * 0.7, h * 0.7 + 6].forEach(yy => sctx.fillRect(x + 2, y + yy, w - 4, 2));
      sctx.globalAlpha = 1;
    }
    // dim the room so the beam pops
    const dim = sctx.createRadialGradient(W * 0.5, H * 0.55, 0, W * 0.5, H * 0.55, Math.max(W, H) * 0.8);
    dim.addColorStop(0, 'rgba(18,14,31,0.25)');
    dim.addColorStop(1, 'rgba(18,14,31,0.85)');
    sctx.fillStyle = dim;
    sctx.fillRect(0, 0, W, H);
    // a faint warm sheen on the golden book, so it can still be spotted in the dark room
    if (goldRow >= 0) {
      const { x, y, w, h } = gold.rect;
      const sheen = sctx.createRadialGradient(x + w / 2, y + h * 0.4, 1, x + w / 2, y + h * 0.4, h * 0.6);
      sheen.addColorStop(0, 'rgba(255, 214, 120, .16)'); sheen.addColorStop(1, 'rgba(255, 214, 120, 0)');
      sctx.fillStyle = sheen; sctx.fillRect(x + w / 2 - h * 0.6, y - h * 0.2, h * 1.2, h * 1.2);
    }
    // the 독서 영수증 book on the little shelf: a navy book with a receipt slip poking out of the top
    // like a bookmark, a touch brighter than the books around it, under a faint warm light
    if (rc) {
      const { y, h, lean, rx, reach } = rc, w = rcW;
      const slipH = Math.min(26, h * 0.26), slipW = 16;
      receiptRect = { x: rx - 4, y: y - h - slipH, w: reach + 8, h: h + slipH + 4 };
      const lx = rx + reach / 2, ly = y - h * 0.6, lr = h;
      const pool = sctx.createRadialGradient(lx, ly, 2, lx, ly, lr);
      pool.addColorStop(0, 'rgba(255, 216, 150, .22)'); pool.addColorStop(1, 'rgba(255, 216, 150, 0)');
      sctx.fillStyle = pool;
      sctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
      sctx.save();
      sctx.translate(rx, y); sctx.rotate(lean);
      sctx.globalAlpha = 0.9;
      // the receipt slip, its top torn in a zigzag, a few printed lines on it
      sctx.save();
      sctx.translate(w / 2 + 3, -h + 8); sctx.rotate(0.06);
      sctx.fillStyle = '#ddd3c4';
      sctx.beginPath();
      sctx.moveTo(-slipW / 2, 0); sctx.lineTo(-slipW / 2, -slipH + 4);
      for (let k = 0; k < 4; k++) { sctx.lineTo(-slipW / 2 + slipW * (k + 0.5) / 4, -slipH); sctx.lineTo(-slipW / 2 + slipW * (k + 1) / 4, -slipH + 4); }
      sctx.lineTo(slipW / 2, 0); sctx.closePath(); sctx.fill();
      sctx.fillStyle = 'rgba(60, 50, 70, .5)';
      [0.78, 0.62, 0.46].forEach(f => sctx.fillRect(-slipW / 2 + 3, -slipH * f, slipW - 6, 2));
      sctx.restore();
      // the book: navy cloth, a little rounded, two light bands and its title down the spine
      const cover = sctx.createLinearGradient(0, 0, w, 0);
      cover.addColorStop(0, '#22305a'); cover.addColorStop(0.45, '#3a4f8c'); cover.addColorStop(1, '#1d2950');
      sctx.fillStyle = cover;
      roundRect(sctx, 0, -h, w, h, 3); sctx.fill();
      sctx.fillStyle = 'rgba(255, 255, 255, .15)';
      sctx.fillRect(4, -h + 10, w - 8, 3); sctx.fillRect(4, -15, w - 8, 3);
      const chars = [...RECEIPT.spine], step = Math.min(15, (h - 24) / chars.length);
      sctx.fillStyle = 'rgba(240, 232, 255, .9)';
      sctx.font = `${Math.round(Math.max(9, Math.min(13, step)))}px 'Jua', 'Malgun Gothic', sans-serif`;
      sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
      chars.forEach((ch, k) => sctx.fillText(ch, w / 2, -h + 16 + step * (k + 0.5)));
      sctx.restore();
      // the 독서 취향 테스트 book beside it: purple cloth, the same height as the 독서 영수증 book,
      // its title starting on the same line as the 독서 영수증 title
      if (window.QUIZ) {
        const { qx, qw } = rc, qh = h;
        quizRect = { x: qx - 3, y: y - qh - slipH, w: qw + 6, h: qh + slipH + 4 };
        sctx.save();
        sctx.translate(qx, y);
        sctx.globalAlpha = 0.9;
        const qc = sctx.createLinearGradient(0, 0, qw, 0);
        qc.addColorStop(0, '#4a2a7a'); qc.addColorStop(0.45, '#7a4fc0'); qc.addColorStop(1, '#3d2266');
        // a slip just like the 독서 영수증 one (zigzag torn top), with a pink heart printed on it
        const qSlipH = slipH, qSlipW = slipW;
        sctx.save();
        sctx.translate(qw / 2 + 3, -qh + 8); sctx.rotate(0.06);
        sctx.fillStyle = '#ddd3c4';
        sctx.beginPath();
        sctx.moveTo(-qSlipW / 2, 0); sctx.lineTo(-qSlipW / 2, -qSlipH + 4);
        for (let k = 0; k < 4; k++) { sctx.lineTo(-qSlipW / 2 + qSlipW * (k + 0.5) / 4, -qSlipH); sctx.lineTo(-qSlipW / 2 + qSlipW * (k + 1) / 4, -qSlipH + 4); }
        sctx.lineTo(qSlipW / 2, 0); sctx.closePath(); sctx.fill();
        const hx = 0, hy = -qSlipH * 0.58, hr = Math.min(4.2, qSlipW * 0.26);
        sctx.fillStyle = '#e0567a';
        sctx.beginPath();
        sctx.moveTo(hx, hy + hr * 1.1);
        sctx.bezierCurveTo(hx - hr * 2, hy - hr * 0.6, hx - hr * 0.6, hy - hr * 1.6, hx, hy - hr * 0.5);
        sctx.bezierCurveTo(hx + hr * 0.6, hy - hr * 1.6, hx + hr * 2, hy - hr * 0.6, hx, hy + hr * 1.1);
        sctx.closePath(); sctx.fill();
        sctx.restore();
        sctx.fillStyle = qc;
        roundRect(sctx, 0, -qh, qw, qh, 3); sctx.fill();
        sctx.fillStyle = 'rgba(255, 255, 255, .15)';
        sctx.fillRect(4, -qh + 10, qw - 8, 3); sctx.fillRect(4, -15, qw - 8, 3);
        const qchars = [...(window.QUIZ.spine || '취향테스트')];
        // the first letter sits where the 독서 영수증 book's first letter sits; the rest follow a little tighter
        const top = -h + 16 + step * 0.5, qstep = Math.min(step, (h - 22) / qchars.length);
        sctx.fillStyle = 'rgba(245, 236, 255, .92)';
        sctx.font = `${Math.round(Math.max(9, Math.min(13, qstep)))}px 'Jua', 'Malgun Gothic', sans-serif`;
        sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
        qchars.forEach((ch, k) => sctx.fillText(ch, qw / 2, top + qstep * k));
        sctx.restore();
      }
      sctx.textAlign = 'start'; sctx.textBaseline = 'alphabetic';
    }
    // diagonal sunbeam from the top-left window
    const beam = beamPoly();
    const g = sctx.createLinearGradient(beam[0][0], 0, W * 0.6, H);
    g.addColorStop(0, 'rgba(255,230,180,0.30)');
    g.addColorStop(1, 'rgba(255,230,180,0.03)');
    sctx.fillStyle = g;
    sctx.beginPath();
    beam.forEach(([px, py], i) => i ? sctx.lineTo(px, py) : sctx.moveTo(px, py));
    sctx.closePath();
    sctx.filter = 'blur(18px)';
    sctx.fill();
    sctx.filter = 'none';
  }
  function beamPoly() {
    return [[W * 0.12, -20], [W * 0.42, -20], [W * 0.88, H + 20], [W * 0.38, H + 20]];
  }
  function inBeam(x, y) {
    // horizontal distance from the beam's centre line, normalised to its half width
    const t = y / H;
    const cx = W * (0.27 + 0.36 * t);
    const half = W * (0.15 + 0.1 * t);
    return Math.max(0, 1 - Math.abs(x - cx) / half);
  }
  function randomIdlePos() {
    // most dust lives in the light beam, a little drifts elsewhere
    if (Math.random() < 0.8) {
      const y = Math.random() * H;
      const t = y / H;
      const cx = W * (0.27 + 0.36 * t);
      const half = W * (0.15 + 0.1 * t);
      return [cx + (Math.random() * 2 - 1) * half * Math.random(), y];
    }
    return [Math.random() * W, Math.random() * H];
  }

  // ---------- particles ----------
  const particles = [];
  function makeParticle(visible) {
    const [x, y] = randomIdlePos();
    return {
      x, y, hx: x, hy: y,
      vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
      size: 0.8 + Math.random() * 1.9,
      phase: Math.random() * Math.PI * 2,
      tw: 0.6 + Math.random() * 1.6,
      a: visible ? 1 : 0, ta: visible ? 1 : 0,
      col: DUST.slice(),
      // flight
      sx: 0, sy: 0, tx: 0, ty: 0, cx: 0, cy: 0, tcol: null, scol: null, delay: 0, dur: 1,
    };
  }
  function ensureParticles(n) {
    while (particles.length < n) particles.push(makeParticle(false));
  }

  // pixel targets for a character drawn at a given rect
  function sampleTargets(img, x, y, w, h, count) {
    const off = document.createElement('canvas');
    off.width = Math.round(w); off.height = Math.round(h);
    const o = off.getContext('2d');
    o.drawImage(img, 0, 0, off.width, off.height);
    const data = o.getImageData(0, 0, off.width, off.height).data;
    const pts = [];
    const step = Math.max(2, Math.round(Math.sqrt((off.width * off.height * 0.55) / count)));
    for (let j = 0; j < off.height; j += step) {
      for (let i = 0; i < off.width; i += step) {
        const k = (j * off.width + i) * 4;
        if (data[k + 3] > 140) pts.push({ x: x + i, y: y + j, col: [data[k], data[k + 1], data[k + 2]] });
      }
    }
    return pts;
  }

  // ---------- state machine ----------
  // idle -> gather -> shown (-> gather again when the other twin joins) -> leave -> ended (back to dust)
  let state = 'idle';
  let stateT = 0;
  let shown = []; // [{key, x, y, w, h, alpha, bob}]
  let sparkles = [];

  // the title appears above the characters, so they stand below it
  // on a narrow (phone) screen each twin gets its own half of the width and
  // stands near the bottom, leaving the space above for the speech bubbles
  const isNarrow = () => W < 700;
  // a phone held sideways: too short for bubbles above, so they go beside the twins
  // (judged by the height without a keyboard: an open phone keyboard makes the screen look
  // wider than tall, but the phone is still upright)
  const isShort = () => { const h = fullH || H; return h < 520 && W > h; };
  // while a phone keyboard is open the screen gets shorter: keep the twins at their
  // full-screen size and just lift them above the input bar
  let fullH = 0, lastW = 0;
  const keyboardOpen = () => fullH - H > 120;
  function layoutFor(items) {
    const realH = H;
    H = fullH || H;
    let out;
    try { out = isShort() ? sideLayout(items) : mainLayout(items); } finally { H = realH; }
    const dy = (realH - (fullH || realH)) + (keyboardOpen() ? 50 : 0);
    out.forEach(s => s.y += dy);
    return out;
  }
  function mainLayout(items) {
    const narrow = isNarrow();
    const top0 = Math.min(240, H * 0.32);
    const bottom = H - (narrow ? 150 : 120);
    const slotW = items.length === 1 ? (narrow ? (isDuo(items[0]) ? W - 24 : W * 0.78) : W) : (narrow ? W / 2 - 14 : W);
    const out = [];
    items.forEach(({ key, pose }, i) => {
      const img = IMGS[pose.id];
      // small source images get blurry when blown up too far
      const h = Math.max(120, Math.min(440, bottom - top0, img.height * 1.9, slotW * img.height / img.width));
      const w = h * img.width / img.height;
      const cx = items.length === 1 ? W / 2
        : narrow ? W * (i === 0 ? 0.26 : 0.74)
        : W / 2 + (i === 0 ? -1 : 1) * Math.min(W * 0.22, w * 0.62);
      const top = narrow ? bottom - h : top0 + Math.max(0, (bottom - top0 - h) / 2);
      // dx is where it is drawn; it glides to x when the layout changes
      out.push({ key, pose, img, x: cx - w / 2, dx: cx - w / 2, y: top, w, h, alpha: 0, bob: Math.random() * 6 });
    });
    return out;
  }

  function sideLayout(items) {
    const top0 = 64, bottom = H - 92;
    const two = items.length === 2;
    return items.map(({ key, pose }, i) => {
      const img = IMGS[pose.id];
      const duo = key === 'duo';
      const h = Math.max(100, Math.min(440, bottom - top0, (two ? W * 0.24 : duo ? W * 0.45 : W * 0.4) * img.height / img.width));
      const w = h * img.width / img.height;
      // a duo picture stands in the middle with a bubble on each side
      const cx = two ? (i === 0 ? 16 + w / 2 : W - 16 - w / 2) : duo ? W / 2 : W * 0.3;
      return { key, pose, img, x: cx - w / 2, dx: cx - w / 2, y: bottom - h, w, h, alpha: 0, bob: Math.random() * 6 };
    });
  }

  function summon(keys, topic) {
    if (state === 'gather' || keys.every(isOut)) return;
    hint.classList.add('gone');
    silhouette.classList.add('gone');
    // characters already out stay as they are; only newcomers form out of dust
    const old = shown;
    // when both appear together, sometimes they form one piece of duo concept art
    const items = !old.length && keys.length === 2 && Math.random() < 0.4
      ? [{ key: 'duo', pose: randomPose('duo') }]
      : ['dok', 'duk']
        .filter(k => keys.includes(k) || old.some(s => s.key === k))
        .map(key => old.find(s => s.key === key) || { key, pose: randomPose(key) });
    shown = layoutFor(items).map(s => {
      const prev = old.find(o => o.key === s.key);
      if (prev) return Object.assign(s, { alpha: 1, bob: prev.bob, dx: prev.dx });
      s.isNew = true;
      return s;
    });
    const fresh = shown.filter(s => s.isNew);
    if (!fresh.length) return;
    // a found pose introduces itself with its own line
    // a twin who was already out answers right away; the newcomer speaks once formed
    let line = fresh.flatMap(s => (isDuo(s) ? ['dok', 'duk'] : [s.key])
      .map(k => [k, reply(topic, k, old.length ? 'join' : 'first')]));
    // a special day or a late night: the very first words start with that greeting (eggs.js)
    const opener = !old.length && !openerUsed && !isEgg(topic) && !(BY_ID[topic] || {}).serious
      && !/swear|crisis|crazyword|^(pain|headache|stomach|sick|hurt|eyes|teeth)$/.test(topic) && eggOpener();
    if (opener) {
      openerUsed = true;
      line = line.map(([k]) => [k, opener[k] + ' ' + reply(topic, k, 'chat')]);
    }
    old.forEach(s => say(s.key, reply(topic, s.key, 'chat')));
    let targets = [];
    for (const s of fresh) targets = targets.concat(sampleTargets(s.img, s.x, s.y, s.w, s.h, 2600 / fresh.length + 600));
    ensureParticles(Math.max(targets.length, IDLE_COUNT));
    // shuffle so dust from everywhere flows into every part of the body
    for (let i = targets.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [targets[i], targets[j]] = [targets[j], targets[i]]; }
    particles.forEach((p, i) => {
      const t = targets[i];
      p.sx = p.x; p.sy = p.y;
      if (!p.a) { // hidden dust rises up from the bookshelves
        const [hx, hy] = randomIdlePos();
        p.sx = p.x = hx; p.sy = p.y = hy;
      }
      p.scol = p.col.slice();
      p.delay = Math.random() * 0.7;
      p.dur = 1.3 + Math.random() * 0.6;
      if (t) {
        p.tx = t.x; p.ty = t.y; p.tcol = t.col; p.ta = 1;
        // swirl control point: orbit around the character centre
        const c = fresh.length === 1 ? fresh[0] : { x: W / 2, w: 0, y: fresh[0].y, h: fresh[0].h };
        const ccx = c.x + c.w / 2;
        const ang = Math.atan2(p.sy - (c.y + c.h / 2), p.sx - ccx) + (Math.random() < 0.5 ? 1 : -1) * 1.6;
        const rad = Math.max(W, H) * (0.18 + Math.random() * 0.2);
        p.cx = ccx + Math.cos(ang) * rad;
        p.cy = c.y + c.h / 2 + Math.sin(ang) * rad * 0.7;
      } else {
        p.tx = p.x; p.ty = p.y; p.tcol = DUST; p.ta = 0;
        p.cx = p.x; p.cy = p.y;
      }
      p.a = Math.max(p.a, 0.0001);
    });
    state = 'gather'; stateT = 0;
    pendingLine = line;
    layoutSize = W + 'x' + H;
  }

  // the screen can change size mid-transformation (a phone keyboard closing),
  // so the twins are laid out again once they are formed
  let layoutSize = '';
  function relayout() {
    shown = layoutFor(shown).map(s => (s.alpha = 1, s));
    layoutSize = W + 'x' + H;
  }

  let pendingLine = null;
  let openerUsed = false;
  function eggOpener() {
    if (!EGGS) return null;
    const d = new Date(), h = d.getHours();
    return EGGS.days[`${d.getMonth() + 1}-${d.getDate()}`]
      || (h >= EGGS.night.from || h < EGGS.night.to ? EGGS.night : null);
  }

  function bobOffset(s) { return Math.sin(performance.now() / 420 + s.bob) * 6; }

  // ---------- speech bubbles ----------
  let bubbles = [];
  function say(key, text) {
    if (!anchorOf(key)) return;
    // new words over the invitation take its buttons away, so it is not asked again
    if (invite === 'open' && key === inviteKey) invite = 'done';
    let b = bubbles.find(x => x.key === key);
    if (!b) {
      const el = document.createElement('div');
      el.className = 'bubble';
      document.body.appendChild(el);
      b = { key, el };
      bubbles.push(b);
    }
    // new words in the asking bubble (a tap on the twin, say) end the name question
    if (b.el.contains(nameForm)) { closeNameBox(); if (nameAsk === 'open') nameAsk = 'done'; }
    b.el.innerHTML = '';
    b.el.classList.remove('ask');
    const who = document.createElement('span');
    who.className = 'who'; who.style.color = CHARS[key].color; who.textContent = CHARS[key].name;
    b.el.append(who, document.createTextNode(text));
    positionBubbles();
    b.el.classList.remove('show');
    void b.el.offsetWidth;
    b.el.classList.add('show');
  }
  function positionBubbles() {
    const short = isShort();
    const two = isOut('dok') && isOut('duk');
    // two bubbles share the width; one bubble may use most of it
    const maxW = two ? Math.min(400, W / 2 - (isNarrow() ? 12 : 24)) : Math.min(400, W - 32);
    shown.forEach(s => { s.fitNext = 1; });
    for (const b of bubbles) {
      const a = anchorOf(b.key);
      if (!a) continue;
      const s = a.s;
      b.el.classList.toggle('side', short);
      if (short) {
        // beside the character, pointing toward the middle of the screen;
        // for a duo picture the bubbles go out to either side of it
        let right, room;
        if (isDuo(s)) {
          right = a.cx < s.dx + s.w / 2;
          room = right ? s.dx - 20 : W - (s.dx + s.w) - 20;
        } else {
          right = two && a.cx > W / 2;
          room = !two ? W - (s.dx + s.w) - 26
            : right ? s.dx - 10 - (W / 2 + 6)
            : W / 2 - 6 - (s.dx + s.w + 10);
        }
        b.el.classList.toggle('right', right);
        b.el.style.maxWidth = Math.min(400, room) + 'px';
        b.el.style.left = (right ? s.dx - 10 : s.dx + s.w + 10) + 'px';
        b.el.style.top = Math.max(8, s.y + bobOffset(s) + 4) + 'px';
        continue;
      }
      b.el.classList.remove('right');
      // the name question (with its input) may use the whole width; the other bubble hides meanwhile
      const asking = b.el.classList.contains('ask') && b.el.contains(nameForm);
      b.el.style.maxWidth = (asking ? Math.min(340, W - 32) : maxW) + 'px';
      // with both twins out, each bubble keeps to its own half so they never overlap
      const half = b.el.offsetWidth / 2;
      let cx = a.cx;
      if (two && !asking) {
        const other = anchorOf(b.key === 'dok' ? 'duk' : 'dok');
        const leftSide = a.cx < other.cx || (a.cx === other.cx && b.key === 'dok');
        cx = leftSide ? Math.min(cx, W / 2 - half - 6) : Math.max(cx, W / 2 + half + 6);
      }
      // and inside the screen edges
      b.el.style.left = Math.min(Math.max(cx, half + 8), W - half - 8) + 'px';
      // long replies grow upward; never let them cover the title
      const minTop = (title.classList.contains('show') && !keyboardOpen() ? title.getBoundingClientRect().bottom : 0) + 8;
      const bubbleBottom = Math.max(s.y + bobOffset(s) - 6, minTop + b.el.offsetHeight);
      b.el.style.top = bubbleBottom + 'px';
      // if the bubble reaches down past the picture's top, shrink the picture to stay below it
      s.fitNext = Math.min(s.fitNext, Math.max(0.5, Math.min(1, (s.y + s.h - (bubbleBottom + 18)) / s.h)));
    }
    shown.forEach(s => { s.fit = s.fitNext; });
  }

  // ---------- understanding what you said ----------
  const pick = a => a[(Math.random() * a.length) | 0];
  // never say the very same line twice in a row
  const lastLine = new Map();
  function pickFresh(a) {
    let x = pick(a);
    if (a.length > 1) while (x === lastLine.get(a)) x = pick(a);
    lastLine.set(a, x);
    return x;
  }

  // the expected messages and their replies live in replies.js
  const REPLIES = window.REPLIES;
  const BY_ID = Object.fromEntries(REPLIES.map(r => [r.id, r]));
  BY_ID.other = window.REPLY_OTHER;
  BY_ID.unsure = window.REPLY_UNSURE;
  BY_ID.poke = window.REPLY_POKE;
  // hidden surprises (eggs.js); they answer like any other topic, always both twins together
  const EGGS = window.EGGS || null;
  const EGG_TOPICS = EGGS ? EGGS.topics : [];
  EGG_TOPICS.forEach(e => { BY_ID[e.id] = e; });
  const isEgg = topic => topic === 'callno' || EGG_TOPICS.some(e => e.id === topic);
  // a call number on its own ("813", "813.6"): 구구독 tells which shelf it lives on
  function callNoTopic(t) {
    const m = EGGS && window.SHELF && t.match(/^\s*(\d{3})(\.\d+)?\s*$/);
    if (!m) return null;
    const C = EGGS.callNo, code = m[1];
    const main = window.SHELF.sections.find(s => s.code === code[0] + '00');
    if (!main) return null;
    const name = C.divisions[code] || C.divisions[code.slice(0, 2) + '0'];
    const dok = (name && code[1] !== '0' ? fill(C.dok, { code: m[0].trim(), main: main.name, top: main.code, name })
      : fill(C.dokMain, { code: m[0].trim(), main: main.name, hint: main.hint })) + (m[2] ? C.decimal : '');
    BY_ID.callno = { first: { dok: [dok], duk: C.duk }, dok: [dok], duk: C.duk };
    return 'callno';
  }
  // mode: 'first' (appears alone), 'join' (twin comes out beside the other), 'chat'
  function reply(topic, key, mode) {
    const r = BY_ID[topic] || BY_ID.other;
    // serious topics get no cheerful self-introduction in front
    if (mode === 'chat' || r.serious) return pickFresh(r[key]);
    if (topic === 'bye' || topic === 'goodnight') return reply('greet', key, mode); // a goodbye as the very first words
    if (mode === 'join') {
      return topic === 'name' ? pickFresh(r.first[key]) : pickFresh(window.REPLY_JOIN[key]) + ' ' + pickFresh(r[key]);
    }
    return r.first ? pickFresh(r.first[key]) : pickFresh(window.REPLY_INTRO[key]) + ' ' + pickFresh(r[key]);
  }
  function topicOf(t) {
    const egg = EGG_TOPICS.find(r => r.match.test(t)) || (callNoTopic(t) && { id: 'callno' });
    if (egg) return egg.id;
    const hit = REPLIES.find(r => r.match.test(t));
    if (hit) return hit.id;
    // nothing expected: a question (ends in ?) is a surprise, anything else is "not sure yet"
    return /[?？][!.~ㅎㅋ\s]*$/.test(t) ? 'other' : 'unsure';
  }
  function whoFor(t) {
    const dok = /구구독|구독|구구톡|독이/.test(t);
    const duk = /구구덕|구덕|덕이/.test(t);
    if (/쌍둥이|둘\s*다|모두|같이|다\s*같이|친구들/.test(t) || (dok && duk)) return ['dok', 'duk'];
    if (dok) return ['dok'];
    if (duk) return ['duk'];
    return [Math.random() < 0.5 ? 'dok' : 'duk'];
  }

  // swear words are hidden behind hearts when the message is echoed on screen
  const SWEAR_ALL = window.SWEAR_RE ? new RegExp(window.SWEAR_RE.source, 'gi') : null;
  const maskSwears = t => SWEAR_ALL ? t.replace(SWEAR_ALL, m => '♡'.repeat(Math.min(m.replace(/\s/g, '').length, 3))) : t;
  let swearCount = 0;

  // after 6–7 messages one twin asks once "같이 게임할래?" with yes / no buttons
  // invite: 'later' (not asked yet), 'open' (waiting for an answer), 'done' (never again)
  let talks = 0, invite = 'later', inviteKey = null;
  const inviteAt = 6 + ((Math.random() * 2) | 0);
  const YES_RE = /^\s*(응|어|예|네|넵|넹|좋아|좋지|그래|ㅇㅇ|ㅇㅋ|오케이|콜|하자|할래|할게|고고)/;
  const NO_RE = /^\s*(아니|아뇨|싫어|안\s*해|안\s*할|노|ㄴㄴ|다음에|나중에|됐어)/;
  function askGame() {
    if (ending || invite !== 'later' || state !== 'shown' || !quizEl.hidden) return;
    const keys = ['dok', 'duk'].filter(isOut);
    if (!keys.length) return;
    inviteKey = pick(keys);
    say(inviteKey, '우리 같이 게임할래? 🎮');
    invite = 'open';
    const b = bubbles.find(x => x.key === inviteKey);
    const row = document.createElement('div');
    row.className = 'invite';
    const yes = document.createElement('button');
    yes.className = 'yes'; yes.textContent = '좋아!';
    yes.addEventListener('click', () => answerGame(true));
    const no = document.createElement('button');
    no.textContent = '다음에';
    no.addEventListener('click', () => answerGame(false));
    row.append(yes, no);
    b.el.append(row);
    positionBubbles();
  }
  function answerGame(yes) {
    if (invite !== 'open') return;
    invite = 'done';
    if (yes) {
      say(inviteKey, '신난다! 어떤 게임부터 해 볼까?');
      setTimeout(() => openGames(), 700);
    } else {
      say(inviteKey, '알겠어! 하고 싶어지면 언제든 🎮 게임 버튼을 눌러 줘.');
    }
  }

  // ---------- the visitor's name (names.js) ----------
  // kept only in memory: a reload, or the next visitor, starts with no name
  const NAMES = window.NAMES;
  // nameAsk: 'later' (not asked yet), 'open' (waiting for the answer), 'done' (never ask again)
  let nameAsk = 'later', nameKey = null, visitor = null;
  const nameAskAt = 3 + ((Math.random() * 2) | 0);
  const SURNAMES = '김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하곽성차주우구민진지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용예경봉사부';
  const hasBatchim = ch => { const c = ch.charCodeAt(0) - 0xAC00; return c >= 0 && c < 11172 && c % 28 !== 0; };
  // 은/는 after a word ("사서 선생님은", "서연이는")
  const eunNeun = w => w + (hasBatchim(w[w.length - 1]) ? '은' : '는');
  // the same name always gives the same lines
  const hashOf = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
  const pickBy = (a, seed) => a[seed % a.length];
  const fill = (t, v) => t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  function nameInfo(raw) {
    const latin = /^[a-z]+$/i.test(raw);
    // three syllables starting with a common surname are called by the given name (김서연 → 서연아)
    const name = !latin && raw.length === 3 && SURNAMES.includes(raw[0]) ? raw.slice(1) : raw;
    const b = !latin && hasBatchim(name[name.length - 1]);
    return { raw, latin, name, call: latin ? name : name + (b ? '아' : '야'), nameN: latin ? name : name + (b ? '이' : ''), seed: hashOf(raw) };
  }
  const NAME_ENDINGS = /(이에요|예요|에요|입니다|이랍니다|이라고\s*해요?|라고\s*해요?|이라고\s*합니다|라고\s*합니다|이야|이다|이요|이고|야|요|임)$/;
  // in the name box only endings that can't be part of a name are cut, so 정수임, 하야, 수아 stay whole
  const NAME_BOX_ENDINGS = /(이에요|예요|에요|입니다|이랍니다|이라고\s*해요?|라고\s*해요?|이라고\s*합니다|라고\s*합니다)$/;
  const NOT_NAMES = /^(안녕|응|어|네|예|넹|넵|아니|아니요|아뇨|몰라|모름|비밀|싫어|왜|뭐|뭐게|뭘까|뭐야|고마워|감사|좋아|그래|반가워|하이|헬로|나|너|저|누구|이름|별명|구구독|구구덕|hi|hello)$/i;
  const SECRET_RE = /비밀|몰라|모름|싫어|안\s*알려|말\s*안\s*해|노코멘트|뭐게|맞혀\s*봐/;
  // finds a name in "내 이름은 서연이야", or, typed in the name box, in "서연이에요" / "김서연" / "서연"
  // (direct: it came from the name box, so any word there is meant as a name)
  function findName(text, asked, direct) {
    let t = text.replace(/[^가-힣a-zA-Z\s]/g, ' ').replace(/\s+/g, ' ').trim().replace(/사서 선생님/, '사서선생님');
    // "김 서연" → "김서연"
    const spaced = t.match(/^([가-힣]) ([가-힣]{1,3}[가-힣]*)$/);
    if (spaced && SURNAMES.includes(spaced[1])) t = spaced[1] + spaced[2];
    let m = t.match(/(?:내|제|나의)\s*이름은\s*([가-힣a-zA-Z]+)/) || t.match(/(?:나를|날|저를)\s*([가-힣a-zA-Z]+?)(?:이라고|라고)\s*불러/);
    let sure = !!m;
    if (!m && asked) {
      m = t.match(/^([가-힣a-zA-Z]+?)(?:이라고|라고)\s*(?:해|합니다|해요|불러)/) || t.match(/^(?:나는|난|저는|전)\s*([가-힣a-zA-Z]+)$/);
      sure = !!m;
      if (!m && /^[가-힣a-zA-Z]+$/.test(t)) m = [t, t];
    }
    if (!m) return null;
    const said = m[1];
    let name = said.replace(direct ? NAME_BOX_ENDINGS : NAME_ENDINGS, '') || said;
    // 서연이 → 서연 (the friendly 이 after a final consonant); 서연아 → 서연 only outside the name box,
    // where 수아 or 하야 could be a whole name
    if (/^[가-힣]{2,}이$/.test(name) && hasBatchim(name[name.length - 2])) name = name.slice(0, -1);
    else if (!direct && /^[가-힣]{2,}아$/.test(name) && hasBatchim(name[name.length - 2])) name = name.slice(0, -1);
    if (!/^([가-힣]{1,5}|[a-zA-Z]{1,12})$/.test(name) || NOT_NAMES.test(name)) return null;
    if (window.SWEAR_RE && window.SWEAR_RE.test(name)) return null;
    // a bare word is a name only if it is not something we already understand ("배고파")
    if (!direct && !sure && name === said && !['other', 'unsure'].includes(topicOf(text))) return null;
    return name;
  }
  // the name box takes the place of the message box while a twin waits for the answer
  const nameForm = document.getElementById('nameForm');
  const nameIn = document.getElementById('nameIn');
  // the name box goes inside the asking twin's yellow bubble, and back to the bar (hidden) afterwards
  function openNameBox(bubbleEl) {
    document.body.classList.add('naming');
    bubbleEl.append(nameForm);
    nameForm.hidden = false;
    nameIn.value = ''; nameIn.classList.remove('bad');
    positionBubbles();
    // on a phone, focusing would pop the keyboard up before the visitor reads the question
    if (!touch) nameIn.focus();
  }
  function closeNameBox() {
    if (document.activeElement === nameIn) nameIn.blur();
    nameForm.hidden = true;
    document.getElementById('controls').append(nameForm);
    document.body.classList.remove('naming');
  }
  nameForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = nameIn.value.trim();
    if (!text) { nameIn.focus(); return; }
    if (SECRET_RE.test(text)) { keepSecret(); return; }
    const found = findName(text, true, true);
    if (!found) {
      nameIn.classList.add('bad');
      toast('이름이나 별명을 다시 적어 줄래요? (한글 5글자, 영어 12글자까지)');
      nameIn.focus();
      return;
    }
    nameAsk = 'done'; talks++;
    closeNameBox();
    showHeard(text);
    // let a phone keyboard close first so the twins have the whole screen
    setTimeout(() => greetByName(found), touch ? 350 : 0);
    maybeEnd();
  });
  function keepSecret() {
    nameAsk = 'done'; talks++;
    closeNameBox();
    const k = nameKey && isOut(nameKey) ? nameKey : ['dok', 'duk'].find(isOut);
    if (k) say(k, pick(NAMES.secret[k]));
    maybeEnd();
  }
  document.getElementById('nameSkip').addEventListener('click', keepSecret);
  // runs fn once the twins are formed and have finished their first words
  function whenShown(fn, extra) {
    let tries = 0;
    (function wait() {
      if (state === 'shown' && !pendingLine) return void setTimeout(fn, extra);
      if (++tries < 40) setTimeout(wait, 400);
    })();
  }
  function askName(delay) {
    whenShown(() => {
      if (ending || nameAsk !== 'later' || !quizEl.hidden) return;
      const out = ['dok', 'duk'].filter(isOut);
      if (!out.length) return;
      nameKey = pick(out);
      say(nameKey, pick(NAMES.ask[nameKey]));
      const asking = bubbles.find(x => x.key === nameKey);
      if (!asking) return;
      asking.el.classList.add('ask');
      nameAsk = 'open';
      openNameBox(asking.el);
    }, delay);
  }
  function greetByName(raw) {
    // "사서" / "사서 선생님": the twins are caught off guard (eggs.js)
    const L = EGGS && EGGS.librarian;
    if (L && L.match.test(raw)) {
      visitor = { raw, latin: false, name: L.call, call: L.call, nameN: L.call, seed: hashOf(raw) };
      const out = ['dok', 'duk'].filter(isOut);
      repose(out);
      out.forEach(k => say(k, L[k]));
      return;
    }
    visitor = nameInfo(raw);
    const v = visitor, out = ['dok', 'duk'].filter(isOut);
    if (!out.length) return;
    const asker = nameKey && isOut(nameKey) ? nameKey : pick(out);
    const other = out.find(k => k !== asker);
    repose([asker]);
    if (v.latin) {
      say(asker, fill(pickBy(NAMES.latin[asker], v.seed), v));
    } else {
      // an acrostic: one line per syllable of the name as it was told (김서연 → 삼행시)
      const syl = [...raw];
      const lines = syl.map((c, i) => `${c}: ${pickBy(NAMES.lines[c] || [fill(NAMES.fallback, { c })], v.seed + i)}`);
      // 이행시, 삼행시 … in Korean numbers
      const intro = fill(pickBy(NAMES.poemIntro[asker], v.seed), { ...v, n: ['', '일', '이', '삼', '사', '오'][syl.length] });
      say(asker, [intro, ...lines, fill(pickBy(NAMES.poemOutro[asker], v.seed >> 3), v)].join('\n'));
    }
    if (!other) return;
    // the other twin adds something special about this name, or a friendly hello
    const sp = NAMES.special, mark = (raw.match(/[독덕]/) || [])[0];
    const line = raw === '구구독' || raw === '구구덕' ? pickBy(sp.twin, v.seed)
      : mark ? fill(pickBy(sp.dokduk, v.seed), { ...v, c: mark })
      : raw[0] === '구' ? pickBy(sp.gu, v.seed)
      : raw.length === 1 ? fill(pickBy(sp.one, v.seed), v)
      : fill(pickBy(NAMES.other[other], v.seed >> 2), v);
    setTimeout(() => say(other, line), 1800);
  }
  // now and then a reply starts with the visitor's name: "서연아, ..."
  function withName(text, topic, first) {
    if (!visitor || !first || /swear|crisis|frustrated/.test(topic) || Math.random() >= NAMES.callChance) return text;
    return `${visitor.call}, ${text}`;
  }

  // ---------- goodbye after the 10th message ----------
  // the twins say goodbye, scatter back into dust, and the end screen takes over
  const END_AT = 10, END_LINE = '앞으로도 경상북도교육청 구미도서관 캐릭터 구구독 구구덕을 많이 사랑해 줘!';
  let ending = false;
  function maybeEnd() {
    if (ending || talks < END_AT) return;
    ending = true;
    (function waitTurn() {
      // a question still waiting for its answer, or a game in play, comes first
      const busy = state !== 'shown' || pendingLine || nameAsk === 'open' || invite === 'open' || !quizEl.hidden;
      if (busy) return void setTimeout(waitTurn, 500);
      // no more typing: leave time to read the last answer, then say goodbye
      document.body.classList.add('ending');
      setTimeout(farewell, 2600);
    })();
  }
  function farewell() {
    const out = ['dok', 'duk'].filter(isOut);
    const hey = visitor ? visitor.call + ', ' : '';
    say(out[0], hey + END_LINE);
    if (out[1]) setTimeout(() => say(out[1], '우리 또 만나~ 도서관에서 기다릴게! 💜'), 1500);
    setTimeout(startLeave, out[1] ? 5200 : 3800);
  }
  // the reverse of the gathering: every twin breaks into dust that drifts up and fades
  function startLeave() {
    bubbles.forEach(b => b.el.remove());
    bubbles = [];
    title.classList.remove('show');
    let targets = [];
    for (const s of shown) targets = targets.concat(sampleTargets(s.img, s.dx, s.y, s.w, s.h, 2600 / shown.length + 600));
    ensureParticles(targets.length);
    particles.forEach((p, i) => {
      const t = targets[i];
      if (!t) { p.a = 0; p.ta = 0; p.sx = p.tx = p.cx = p.x; p.sy = p.ty = p.cy = p.y; return; }
      p.sx = p.x = t.x; p.sy = p.y = t.y; p.scol = t.col; p.tcol = DUST; p.col = t.col.slice(); p.ta = 1; p.a = 1;
      p.tx = t.x + (Math.random() - 0.5) * W * 0.5;
      p.ty = t.y - H * (0.25 + Math.random() * 0.45);
      p.cx = t.x + (Math.random() - 0.5) * W * 0.3;
      p.cy = t.y - Math.random() * H * 0.1;
      p.delay = Math.random() * 0.6;
      p.dur = 1.4 + Math.random() * 0.9;
    });
    for (const s of shown) for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 200;
      sparkles.push({ x: s.x + s.w / 2, y: s.y + s.h * 0.45, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80,
        r: 3 + Math.random() * 4, life: 0.6 + Math.random() * 0.7, col: pick(['#fff3c4', '#ffd1ec', s.key === 'dok' ? '#8fe6ff' : '#d3b0ff']) });
    }
    state = 'leave'; stateT = 0;
  }
  // how many people have visited, from GoatCounter ("Allow adding visitor counts" is on in its settings).
  // This page's own count first; the whole-site TOTAL as a fallback.
  function showVisitCount() {
    const el = document.getElementById('visitCount');
    const get = path => fetch('https://gugu.goatcounter.com/counter/' + encodeURIComponent(path) + '.json')
      .then(r => r.ok ? r.json() : Promise.reject());
    get(location.pathname).catch(() => get('TOTAL'))
      .then(d => {
        const n = parseInt(String(d.count).replace(/[^0-9]/g, ''), 10);
        if (!n) return;
        el.textContent = `구구독 탐험 일지: 오늘까지 만난 친구 ${n.toLocaleString('ko-KR')}명 ✍️`;
        el.hidden = false;
      })
      .catch(() => {});
  }
  // 15 seconds on the end screen, then the page starts over for the next visitor (and forgets the name)
  function showEndScreen() {
    const end = document.getElementById('endScreen');
    const setPic = (id, img) => { const c = IMGS[id]; if (c && c.toDataURL) img.src = c.toDataURL(); };
    setPic('dok-wave', document.getElementById('endDok'));
    setPic('duk-wave', document.getElementById('endDuk'));
    document.getElementById('endText').textContent = (visitor ? visitor.call + ', ' : '') + END_LINE;
    end.hidden = false;
    showVisitCount();
    const count = document.getElementById('endCount');
    let left = 15;
    const tick = () => {
      count.textContent = `${left}초 뒤에 처음 화면으로 돌아가요`;
      if (left-- <= 0) location.reload();
    };
    tick();
    setInterval(tick, 1000);
    document.getElementById('endAgain').addEventListener('click', () => location.reload());
    document.getElementById('endAgain').focus();
  }

  // every message counts towards the goodbye
  function hear(text) {
    hearOne(text);
    maybeEnd();
  }
  function hearOne(text) {
    text = text.trim();
    if (!text) return;
    showHeard(maskSwears(text));
    // a typed answer to "같이 게임할래?" works like the buttons; anything else lets it pass
    if (invite === 'open') {
      if (YES_RE.test(text)) return answerGame(true);
      if (NO_RE.test(text)) return answerGame(false);
      invite = 'done';
    }
    // a name told on its own in the message box ("내 이름은 서연이야"); answers to our question go in the name box
    if ((state === 'shown' || state === 'idle') && nameAsk === 'later') {
      const found = findName(text, false);
      if (found) {
        nameAsk = 'done'; talks++;
        if (state === 'idle') { summon(whoFor(text), 'greet'); whenShown(() => greetByName(found), 2600); }
        else greetByName(found);
        return;
      }
    }
    let topic = topicOf(text);
    // a welcome or a hello lights up 구구독's hat lamp (eggs.js lamp)
    if (EGGS && EGGS.lamp && EGGS.lamp.topics.includes(topic) && state !== 'leave') whenShown(lampOn, 200);
    // "책 추천해 줘" / "무슨 책 읽을까?": 구구독 recommends today's book, or opens the draw if none was drawn yet
    if (BOOK_LIST.length && (topic === 'recommend' || topic === 'feelrecommend')) {
      if (state !== 'idle' && state !== 'shown') return;
      talks++;
      return bookAsked();
    }
    // from the third swear word on, the twins sound more worried than hurt
    if (topic === 'swear' && ++swearCount >= 3) topic = 'swearmany';
    // the name question comes after the second or third message (not right after a swear word)
    const askNow = () => nameAsk === 'later' && talks >= nameAskAt && !/swear|crisis|^(pain|headache|stomach|sick|hurt|eyes|teeth)$/.test(topic);
    if (state === 'idle') {
      if (topic === 'bye') { toast('아직 아무도 나오지 않았어요. 먼저 환영 인사를 건네 볼까요?'); return; }
      talks++;
      summon(isEgg(topic) ? ['dok', 'duk'] : whoFor(text), topic);
      if ((BY_ID[topic] || {}).heart) whenShown(heartDust, 300);
      if (askNow()) askName(2800);
      return;
    }
    if (state !== 'shown') return;
    talks++;
    // talking to one twin again brings the other out of the dust
    if (!isOut('dok') || !isOut('duk')) {
      summon(['dok', 'duk'], topic);
      if (askNow()) askName(2800);
      return;
    }
    const named = /구구독|구독|구구덕|구덕|쌍둥이|둘\s*다|모두/.test(text);
    const keys = named && !isEgg(topic) ? whoFor(text) : ['dok', 'duk'];
    const egg = BY_ID[topic] || {};
    if (egg.pose) setPoses(egg.pose); else repose(keys);
    // both twins answer at the same time
    keys.forEach((k, i) => say(k, withName(reply(topic, k, 'chat'), topic, i === 0)));
    if (egg.heart) heartDust();
    if (askNow()) askName(3200);
    // swear words get no invitation; it waits for the next friendly message
    else if (talks >= inviteAt && !/swear/.test(topic)) setTimeout(askGame, 3000);
  }

  // with both twins out, each new message changes the picture: sometimes the duo
  // concept art, otherwise each speaker hops into a new pose of their own
  function repose(keys) {
    const duoNow = shown.length === 1 && isDuo(shown[0]);
    const r = Math.random();
    if (duoNow && r < 0.35) return showTogether([{ key: 'duo', pose: randomPose('duo') }]);
    if (duoNow) return showTogether([{ key: 'dok', pose: randomPose('dok') }, { key: 'duk', pose: randomPose('duk') }]);
    if (r < 0.25) return showTogether([{ key: 'duo', pose: randomPose('duo') }]);
    keys.forEach(changePose);
  }
  function showTogether(items) {
    shown = layoutFor(items).map(s => Object.assign(s, { alpha: 1, pop: 1 }));
    burst(shown, 24);
  }

  // a revealed twin hops into a new pose (no dust, just a little pop)
  function changePose(key) {
    const cur = shown.find(s => s.key === key);
    if (!cur) return;
    const next = randomPose(key);
    shown = layoutFor(shown.map(s => s.key === key ? { key, pose: next } : s)).map(s => {
      const prev = shown.find(o => o.key === s.key);
      return Object.assign(s, { alpha: 1, bob: prev.bob, dx: prev.dx, pop: s.key === key ? 1 : 0 });
    });
    burst(shown.filter(s => s.key === key), 18);
  }

  // ---------- hidden surprises (eggs.js) ----------
  // set given poses ({ dok: 'dok-music' }); a twin not named keeps its own (a duo picture splits in two)
  function setPoses(map) {
    const items = ['dok', 'duk'].filter(isOut).map(key => {
      const cur = shown.find(s => s.key === key);
      const pose = (map[key] && POSES[key].find(p => p.id === map[key])) || (cur ? cur.pose : randomPose(key));
      return { key, pose };
    });
    shown = layoutFor(items).map(s => {
      const prev = shown.find(o => o.key === s.key);
      return Object.assign(s, { alpha: 1, pop: map[s.key] ? 1 : 0, bob: prev ? prev.bob : s.bob, dx: prev ? prev.dx : s.dx });
    });
    burst(shown.filter(s => map[s.key]), 18);
  }
  // little stars gather into a heart between the twins for a moment
  function heartDust() {
    if (!shown.length) return;
    SFX.play('heart');
    const top = Math.min(...shown.map(s => s.y)), cy = top + 40, cx = W / 2, k = Math.min(W, H) * 0.009;
    for (let i = 0; i < 30; i++) {
      const t = i / 30 * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      sparkles.push({ x: cx + x * k, y: cy + y * k, vx: 0, vy: -50, r: 4, life: 1.8, col: pick(['#ffd1ec', '#ff9fd0', '#fff3c4']) });
    }
  }
  // a surprise that is not typed (golden book, secret code): both twins come out or answer
  function eggSay(topic) {
    if (ending || !quizEl.hidden || state === 'gather' || state === 'leave' || state === 'ended') return;
    if (state === 'idle' || !isOut('dok') || !isOut('duk')) return void summon(['dok', 'duk'], topic);
    const egg = BY_ID[topic];
    if (egg.pose) setPoses(egg.pose); else repose(['dok', 'duk']);
    ['dok', 'duk'].forEach(k => say(k, reply(topic, k, 'chat')));
  }
  // ↑↑↓↓←→←→ on a keyboard
  const SECRET_KEYS = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
  let secretAt = 0;
  document.addEventListener('keydown', e => {
    if (!EGGS) return;
    secretAt = e.key === SECRET_KEYS[secretAt] ? secretAt + 1 : e.key === SECRET_KEYS[0] ? 1 : 0;
    if (secretAt === SECRET_KEYS.length) { secretAt = 0; eggSay('konami'); }
  });
  // the 독서 영수증 book on the top shelf (receipt.js); its place is set by drawShelf
  const RECEIPT = window.RECEIPT || null;
  let receiptRect = null, receiptOpened = false, receiptHinted = false, quizRect = null;
  const onQuizBook = (x, y) => quizRect
    && x > quizRect.x - 2 && x < quizRect.x + quizRect.w + 8 && y > quizRect.y - 12 && y < quizRect.y + quizRect.h + 12;
  const onReceipt = (x, y) => receiptRect
    && x > receiptRect.x - 12 && x < receiptRect.x + receiptRect.w + 12 && y > receiptRect.y - 12 && y < receiptRect.y + receiptRect.h + 12;
  // now and then a golden book hides on a shelf near the side; a tap finds it
  const gold = EGGS && Math.random() < EGGS.goldChance ? { fx: Math.random() < 0.5 ? 0.05 + Math.random() * 0.08 : 0.87 + Math.random() * 0.08, row: Math.random(), found: false } : null;
  const onGold = (x, y) => gold && !gold.found && gold.rect
    && x > gold.rect.x - 14 && x < gold.rect.x + gold.rect.w + 14 && y > gold.rect.y - 14 && y < gold.rect.y + gold.rect.h + 14;
  // quick taps on the same twin tickle them (how many and how fast: eggs.js tickle)
  const tickles = { dok: [], duk: [] };
  // after a twin answers a tap, more taps within POKE_GAP seconds do nothing, so the words can be read
  const POKE_GAP = 5;
  const lastPoke = { dok: -1e9, duk: -1e9 };
  // one tap on 구구독 draws today's book (todaybook.js); it waits a moment so quick taps can still tickle
  // once the book window has been opened, later taps get the usual random lines
  let bookTimer = 0, bookHinted = false, bookUsed = false;
  function tickled(key) {
    if (!EGGS) return false;
    const T = EGGS.tickle, now = performance.now() / 1000;
    const list = tickles[key] = tickles[key].filter(t => now - t < T.within).concat(now);
    if (list.length < T.taps) return false;
    tickles[key] = [];
    SFX.play('giggle');
    setPoses({ [key]: T.pose[key] });
    say(key, pickFresh(T[key]));
    return true;
  }

  // eggs.js lamp: the first welcome makes the pom on 구구독's hat (the reading lamp) flash red, yellow, blue
  // only once per visit: the first welcome 구구독 hears
  let lampUntil = 0, lampDone = false;
  const lampCache = new WeakMap();
  function lampOn() {
    const L = EGGS && EGGS.lamp;
    if (!L || lampDone || !isOut('dok')) return;
    lampDone = true;
    lampUntil = performance.now() + L.seconds * 1000;
    SFX.play('gold');
  }
  // the pom of a picture with 구구독 in it, painted once in each lamp color (cached per picture):
  // the pom is the biggest pale-cyan blob inside the search box, brighter than the hat.
  // Returns { x, y, layers } (x, y: where the box starts in the picture) or null
  function lampLayers(img, box = [0, 0, 1, 0.5]) {
    if (lampCache.has(img)) return lampCache.get(img);
    let found = null;
    try {
      const x0 = Math.round(img.width * box[0]), y0 = Math.round(img.height * box[1]);
      const w = Math.round(img.width * box[2]) - x0, h = Math.round(img.height * box[3]) - y0;
      let src = img;
      if (!img.getContext) { src = document.createElement('canvas'); src.width = img.width; src.height = img.height; src.getContext('2d').drawImage(img, 0, 0); }
      const px = src.getContext('2d').getImageData(x0, y0, w, h).data;
      const on = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2], a = px[i * 4 + 3];
        if (a > 120 && g >= 235 && b >= 235 && r < g - 25) on[i] = 1;
      }
      // keep only the biggest blob (the pom), not small shiny spots elsewhere
      const seen = new Int32Array(w * h), stack = [];
      let best = 0, bestId = 0, id = 0;
      for (let i = 0; i < w * h; i++) {
        if (!on[i] || seen[i]) continue;
        id++; let n = 0; stack.push(i); seen[i] = id;
        while (stack.length) {
          const j = stack.pop(), x = j % w; n++;
          for (const k of [j - 1, j + 1, j - w, j + w]) {
            if (k < 0 || k >= w * h || seen[k] || !on[k] || (k === j - 1 && x === 0) || (k === j + 1 && x === w - 1)) continue;
            seen[k] = id; stack.push(k);
          }
        }
        if (n > best) { best = n; bestId = id; }
      }
      if (best > w * h * 0.02) {
        const hex = c => [1, 3, 5].map(o => parseInt(c.slice(o, o + 2), 16));
        const layers = EGGS.lamp.colors.map(([dark, light]) => {
          const d = hex(dark), l = hex(light), c = document.createElement('canvas');
          c.width = w; c.height = h;
          const cx = c.getContext('2d'), out = cx.createImageData(w, h);
          for (let i = 0; i < w * h; i++) {
            if (seen[i] !== bestId) continue;
            // the pom's own shading: its red channel goes from ~120 (edge) to ~230 (lit side)
            const t = Math.max(0, Math.min(1, (px[i * 4] - 110) / 130));
            for (let ch = 0; ch < 3; ch++) out.data[i * 4 + ch] = d[ch] + (l[ch] - d[ch]) * t;
            out.data[i * 4 + 3] = px[i * 4 + 3];
          }
          cx.putImageData(out, 0, 0);
          return c;
        });
        found = { x: x0, y: y0, layers };
      }
    } catch (e) { found = null; }
    lampCache.set(img, found);
    return found;
  }

  let heardTimer;
  function showHeard(text) {
    heard.textContent = '🗨️ ' + text;
    heard.classList.add('show');
    clearTimeout(heardTimer);
    heardTimer = setTimeout(() => heard.classList.remove('show'), 2800);
  }
  let toastTimer;
  function toast(msg, ms = 3200) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  // on a phone, close the keyboard first so the twins are laid out on the full screen
  const touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value;
    input.value = '';
    if (touch && document.activeElement === input) {
      input.blur();
      setTimeout(() => hear(text), 350);
    } else {
      hear(text);
    }
  });

  // nobody has said anything on the start screen yet: invite them, one quiet step at a time.
  // 5s: the box shows example words / 10s: a whisper above the shadow and the box glows twice /
  // 15s: hellos to tap. Typing or tapping anywhere puts it all away and starts the count again.
  const nudgeEl = document.getElementById('nudge');
  const quick = document.getElementById('quick');
  const NUDGE = { examples: 5, whisper: 10, hellos: 15,
    words: ['예: 안녕! 반가워~', '예: 환영해!', '예: 너희 이름이 뭐야?'] };
  let quiet = 0;
  function placeNudge() {
    const box = (silhouette.hidden ? hint : silhouette).getBoundingClientRect();
    nudgeEl.style.top = (silhouette.hidden ? box.bottom + 8 : box.top + 4) + 'px';
  }
  // the full hint is cut off on a phone, so phones get the short one
  function sayHint() { return W <= 600 ? '환영의 말을 적어 주세요' : '구구독 구구덕에게 환영의 말을 적어 주세요'; }
  function hush() {
    quiet = 0;
    input.placeholder = sayHint();
    nudgeEl.classList.remove('show');
    quick.classList.remove('show');
    input.classList.remove('glow');
  }
  setInterval(() => {
    if (state !== 'idle' || !quizEl.hidden || input.value) return void (quiet && hush());
    quiet++;
    if (quiet >= NUDGE.examples) {
      const i = Math.floor((quiet - NUDGE.examples) / 3) % NUDGE.words.length;
      input.placeholder = NUDGE.words[i];
    }
    if (quiet === NUDGE.whisper) {
      placeNudge();
      nudgeEl.classList.add('show');
      input.classList.add('glow');
    }
    if (quiet === NUDGE.hellos) quick.classList.add('show');
  }, 1000);
  input.addEventListener('input', hush);
  document.addEventListener('keydown', hush);
  document.addEventListener('pointerdown', e => { if (!quick.contains(e.target)) hush(); });
  quick.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || state !== 'idle') return;
    hush();
    hear(b.textContent.replace(/\s*\p{Extended_Pictographic}/gu, '').trim());
  });
  // the start-screen shadow: the left figure is 구구독, the right one 구구덕
  function silhouetteKeyAt(x, y) {
    if (state !== 'idle' || silhouette.hidden || !silhouette.naturalWidth) return null;
    const box = silhouette.getBoundingClientRect();
    // object-fit: contain draws the picture centred inside the box
    const ratio = silhouette.naturalWidth / silhouette.naturalHeight;
    const w = Math.min(box.width, box.height * ratio), h = w / ratio;
    const left = box.left + (box.width - w) / 2, top = box.top + (box.height - h) / 2;
    if (x < left || x > left + w || y < top || y > top + h) return null;
    return (x - left) / w < 0.5 ? 'dok' : 'duk';
  }
  stage.addEventListener('mousemove', e => {
    stage.style.cursor = silhouetteKeyAt(e.clientX, e.clientY) || onGold(e.clientX, e.clientY) || onReceipt(e.clientX, e.clientY) || onQuizBook(e.clientX, e.clientY) ? 'pointer' : '';
  });
  stage.addEventListener('click', e => {
    if (onQuizBook(e.clientX, e.clientY) && !ending && quizEl.hidden && (state === 'idle' || state === 'shown')) {
      stage.style.cursor = '';
      openGames(quizIntro);
      return;
    }
    if (onReceipt(e.clientX, e.clientY) && !ending && quizEl.hidden && (state === 'idle' || state === 'shown')) {
      stage.style.cursor = '';
      openReceipt();
      return;
    }
    if (onGold(e.clientX, e.clientY) && (state === 'idle' || state === 'shown')) {
      gold.found = true;
      SFX.play('gold');
      drawShelf();
      burst([{ key: 'gold', x: gold.rect.x - 20, y: gold.rect.y, w: gold.rect.w + 40, h: gold.rect.h }], 30);
      eggSay('goldbook');
      return;
    }
    const found = silhouetteKeyAt(e.clientX, e.clientY);
    if (found) {
      stage.style.cursor = '';
      // a tap is a hello, not a question
      summon([found], 'found');
      return;
    }
    if (state !== 'shown') return;
    const s = shown.find(s => e.clientX > s.dx && e.clientX < s.dx + s.w && e.clientY > s.y && e.clientY < s.y + s.h);
    if (!s) return;
    // on a duo picture, the twin closest to the tap answers
    const key = !isDuo(s) ? s.key
      : Math.abs(anchorOf('dok').cx - e.clientX) < Math.abs(anchorOf('duk').cx - e.clientX) ? 'dok' : 'duk';
    if (tickled(key)) { clearTimeout(bookTimer); return; }
    if (key === 'dok' && BOOK_LIST.length && !bookUsed) {
      clearTimeout(bookTimer);
      bookTimer = setTimeout(() => { if (!ending && state === 'shown' && quizEl.hidden) openBookDraw(); }, 450);
      return;
    }
    const nowS = performance.now() / 1000;
    if (nowS - lastPoke[key] < POKE_GAP) return;
    lastPoke[key] = nowS;
    // after today's book was drawn, now and then (about 1 in 20) 구구독 mentions it (todaybook.js: already)
    if (key === 'dok' && bookUsed && lastBook && BOOKS.already && BOOKS.already.length
      && Math.random() < (BOOKS.alreadyChance || 0.05)) {
      say('dok', fill(pickFresh(BOOKS.already), { title: lastBook.title }));
      return;
    }
    // each picture has its own reactions (replies.js POSE_POKES); duo pictures have one set per twin
    const own = (window.POSE_POKES || {})[s.pose.id];
    const lines = own && (Array.isArray(own) ? own : own[key]);
    say(key, lines && lines.length ? pickFresh(lines) : reply('poke', key, 'chat'));
  });

  // ---------- animation loop ----------
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    // the transformation keeps real time even when frames are slow
    stateT += Math.min(1, (now - last) / 1000);
    last = now;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // characters (drawn under the last flying dust)
    if (shown.length) {
      for (const s of shown) {
        // a newcomer only appears once its dust has nearly gathered
        if (s.isNew && state === 'gather' && stateT <= 1.9) continue;
        // leaving: the picture fades while its dust flies off
        s.alpha = state === 'leave' ? Math.max(0, 1 - stateT / 0.8) : Math.min(1, s.alpha + dt * 2.2);
        if (s.alpha <= 0) continue;
        s.dx = lerp(s.dx, s.x, Math.min(1, dt * 5));
        const by = bobOffset(s);
        // soft glow + shadow
        ctx.globalAlpha = s.alpha * 0.35;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.ellipse(s.dx + s.w / 2, s.y + s.h - 4, s.w * 0.36, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = s.alpha;
        // pop: a quick squash-and-grow when the pose changes
        if (s.pop) s.pop = Math.max(0, s.pop - dt * 3);
        // fit: shrinks the twin (feet stay put) when a tall speech bubble needs the room
        s.fitNow = lerp(s.fitNow || 1, s.fit || 1, Math.min(1, dt * 6));
        const k = (s.pop ? 1 - 0.35 * s.pop * s.pop : 1) * s.fitNow;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.translate(Math.round(s.dx + s.w / 2), Math.round(s.y + s.h + by));
        ctx.scale(k, k);
        ctx.drawImage(s.img, -s.w / 2, -s.h, s.w, s.h);
        if (now < lampUntil && (s.key === 'dok' || (isDuo(s) && s.pose.pom))) {
          const pom = lampLayers(s.img, s.pose.pom), L = EGGS.lamp;
          if (pom) {
            const n = Math.floor(now / 1000 / L.step) % pom.layers.length, layer = pom.layers[n], sc = s.w / s.img.width;
            // a glow in the same color, as if the lamp lights up around it
            ctx.shadowColor = L.colors[n][0];
            ctx.shadowBlur = 28 * k;
            ctx.drawImage(layer, -s.w / 2 + pom.x * sc, -s.h + pom.y * sc, layer.width * sc, layer.height * sc);
            ctx.shadowBlur = 0;
          }
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      positionBubbles();
    }

    if (state === 'gather' && stateT > 2.6) {
      state = 'shown'; stateT = 0;
      burst(shown.filter(s => s.isNew));
      shown.forEach(s => delete s.isNew);
      if (layoutSize !== W + 'x' + H) relayout();
      if (pendingLine) {
        pendingLine.forEach(([k, line]) => setTimeout(() => say(k, line), 250));
        pendingLine = null;
      }
      if (!bookHinted && BOOK_LIST.length && isOut('dok')) {
        bookHinted = true;
        setTimeout(() => { if (!ending && quizEl.hidden) toast('💡 구구독을 톡 누르면 오늘의 책을 뽑아 줘요!', 4500); }, 4000);
      }
      if (RECEIPT && !receiptHinted) {
        receiptHinted = true;
        setTimeout(() => { if (!ending && quizEl.hidden && !receiptOpened) toast(RECEIPT.hint, 4500); }, 16000);
      }
    }
    if (state === 'leave' && stateT > 3.2) {
      state = 'ended'; stateT = 0; shown = [];
      showEndScreen();
    }

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (state === 'gather') {
        const t = Math.max(0, Math.min(1, (stateT - p.delay) / p.dur));
        const e = ease(t);
        // quadratic bezier: start -> swirl -> target
        const u = 1 - e;
        p.x = u * u * p.sx + 2 * u * e * p.cx + e * e * p.tx;
        p.y = u * u * p.sy + 2 * u * e * p.cy + e * e * p.ty;
        const ct = Math.max(0, (e - 0.35) / 0.65);
        p.col[0] = lerp(p.scol[0], p.tcol[0], ct);
        p.col[1] = lerp(p.scol[1], p.tcol[1], ct);
        p.col[2] = lerp(p.scol[2], p.tcol[2], ct);
        p.a = p.ta ? Math.min(1, 0.3 + t) : Math.max(0, 1 - t * 2);
        // the real image fades in on top, so the dust fades out at the end
        if (stateT > 1.9) p.a *= Math.max(0, 1 - (stateT - 1.9) / 0.7);
      } else if (state === 'leave') {
        // out of the picture, up and away, fading to plain dust
        const t = Math.max(0, Math.min(1, (stateT - p.delay) / p.dur));
        const e = 1 - (1 - t) * (1 - t), u = 1 - e;
        p.x = u * u * p.sx + 2 * u * e * p.cx + e * e * p.tx;
        p.y = u * u * p.sy + 2 * u * e * p.cy + e * e * p.ty;
        for (let c = 0; c < 3; c++) p.col[c] = lerp(p.scol[c], p.tcol[c], e);
        p.a = p.ta ? 1 - t : 0;
      } else if (state === 'idle' || state === 'ended') {
        if (i >= IDLE_COUNT) { p.a = 0; continue; }
        // brownian drift, pulled gently home
        const jitter = 0.02;
        p.vx += (Math.random() - 0.5) * jitter + (p.hx - p.x) * 0.0006;
        p.vy += (Math.random() - 0.5) * jitter + (p.hy - p.y) * 0.0006 - 0.002;
        p.vx *= 0.97; p.vy *= 0.97;
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.hy = H * Math.random(); }
        p.a = 1;
      } else {
        // once the characters are out, the dust is gone so they stay crisp
        p.a = 0;
        continue;
      }
      if (p.a <= 0.01) continue;
      const flying = state === 'gather' || state === 'leave';
      const glint = flying ? 1 : (0.35 + 0.65 * Math.abs(Math.sin(now / 1000 * p.tw + p.phase))) * (0.35 + 0.9 * inBeam(p.x, p.y));
      const sz = flying ? 2.4 : p.size;
      ctx.globalAlpha = Math.min(1, p.a * glint);
      ctx.fillStyle = `rgb(${p.col[0] | 0},${p.col[1] | 0},${p.col[2] | 0})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
    }

    // sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.life -= dt;
      if (s.life <= 0) { sparkles.splice(i, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt;
      ctx.globalAlpha = Math.min(1, s.life * 1.5);
      star(s.x, s.y, s.r * (0.6 + s.life), s.col);
    }
    // the 독서 영수증 book glints softly now and then, so it can be found
    if (receiptRect && state !== 'leave' && state !== 'ended') {
      const glint = Math.pow(Math.max(0, Math.sin(now / 1300 + 1.7)), 16);
      if (glint > 0.02) {
        ctx.globalAlpha = glint * 0.6;
        star(receiptRect.x + receiptRect.w * 0.62, receiptRect.y + 4, 5, '#fff3c4');
      }
    }
    if (quizRect && state !== 'leave' && state !== 'ended') {
      const glint = Math.pow(Math.max(0, Math.sin(now / 1300 + 3.6)), 16);
      if (glint > 0.02) {
        ctx.globalAlpha = glint * 0.6;
        star(quizRect.x + quizRect.w * 0.5, quizRect.y + 6, 5, '#ffd6f0');
      }
    }
    // the golden book glints now and then
    if (gold && !gold.found && gold.rect && state !== 'leave' && state !== 'ended') {
      const glint = Math.pow(Math.max(0, Math.sin(now / 900)), 12);
      if (glint > 0.02) {
        ctx.globalAlpha = glint;
        star(gold.rect.x + gold.rect.w * 0.7, gold.rect.y + 6, 7, '#fff3c4');
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  function burst(list, count = 40) {
    title.classList.add('show');
    for (const s of list) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 260;
        sparkles.push({
          x: s.x + s.w / 2, y: s.y + s.h * 0.45, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
          r: 3 + Math.random() * 5, life: 0.7 + Math.random() * 0.8,
          col: pick(['#fff3c4', '#ffd1ec', s.key === 'dok' ? '#8fe6ff' : '#d3b0ff']),
        });
      }
    }
  }
  function star(x, y, r, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * 0.35 : r;
      const a = i * Math.PI / 4;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ---------- helpers ----------
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function mulberry(a) {
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    // remember the tallest height at this width: that is the screen without a keyboard
    if (W !== lastW) { fullH = H; lastW = W; } else fullH = Math.max(fullH, H);
    document.body.classList.toggle('kbd', keyboardOpen());
    input.placeholder = sayHint();
    for (const c of [shelf, stage]) { c.width = W * DPR; c.height = H * DPR; c.style.width = W + 'px'; c.style.height = H + 'px'; }
    drawShelf();
    particles.forEach(p => { const [x, y] = randomIdlePos(); p.hx = x; p.hy = y; if (state === 'idle') { p.x = x; p.y = y; } });
    if (state === 'shown') relayout();
  }
  window.addEventListener('resize', resize);
  resize();
  window.addEventListener('resize', placeSilhouette);
  placeSilhouette();
  // the web font can change how tall the words are once it arrives
  if (document.fonts) document.fonts.ready.then(() => { placeSilhouette(); drawShelf(); });
  for (let i = 0; i < IDLE_COUNT; i++) particles.push(makeParticle(true));

  // ---------- reading-taste test (questions and results live in quiz.js) ----------
  const QUIZ = window.QUIZ;
  const quizEl = document.getElementById('quiz');
  const quizBody = quizEl.querySelector('.quiz-body');
  const quizPose = quizEl.querySelector('.quiz-pose');
  const gameBtn = document.getElementById('gameBtn');
  let quizScore = {}, quizResult = null, quizList = [];

  function drawQuizPose(id) {
    const img = IMGS[id];
    if (!img || !img.width) { quizPose.hidden = true; return; }
    quizPose.hidden = false;
    const r = Math.min(2, window.devicePixelRatio || 1), ch = 120, cw = Math.round(ch * img.width / img.height);
    quizPose.width = cw * r; quizPose.height = ch * r;
    quizPose.style.width = cw + 'px'; quizPose.style.height = ch + 'px';
    const x = quizPose.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, quizPose.width, quizPose.height);
    quizPose.classList.remove('pop'); void quizPose.offsetWidth; quizPose.classList.add('pop');
  }
  // an <img> of a pose picture, h pixels tall (sharp on phones), or null if it has not loaded yet
  function poseImg(id, h) {
    const c = pic(id);
    if (!c) return null;
    const r = Math.min(2, window.devicePixelRatio || 1), img = make('img'), small = document.createElement('canvas');
    small.width = Math.round(h * r * c.width / c.height); small.height = Math.round(h * r);
    const x = small.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(c, 0, 0, small.width, small.height);
    img.src = small.toDataURL(); img.alt = '';
    return img;
  }
  function make(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function button(text, cls, onClick) {
    const b = make('button', cls, text);
    b.type = 'button';
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function showQuizScreen(nodes) {
    quizBody.replaceChildren(...nodes);
    quizEl.querySelector('.quiz-card').scrollTop = 0;
    const first = quizBody.querySelector('button');
    if (first) first.focus({ preventScroll: true });
  }

  function quizIntro() {
    quizScore = {}; quizResult = null;
    // a new set of questions each time (ask of them, in a random order)
    quizList = shuffle(QUIZ.questions).slice(0, QUIZ.ask || QUIZ.questions.length);
    drawQuizPose(QUIZ.intro.pose);
    const actions = make('div', 'quiz-actions');
    actions.append(button(QUIZ.intro.start, 'primary', () => quizQuestion(0)));
    showQuizScreen([make('h2', null, QUIZ.intro.title), make('p', null, QUIZ.intro.text), actions]);
  }
  function quizQuestion(i) {
    const item = quizList[i], total = quizList.length;
    drawQuizPose(item.pose);
    const bar = make('div', 'quiz-bar'), fill = make('span');
    fill.style.width = (i / total * 100) + '%';
    bar.append(fill);
    const list = make('div', 'quiz-options');
    // the answers come in a new order each time
    item.options.slice().sort(() => Math.random() - 0.5).forEach(o => list.append(button(o.text, null, () => {
      quizScore[o.type] = (quizScore[o.type] || 0) + 1;
      if (i + 1 < total) quizQuestion(i + 1); else quizShowResult();
    })));
    showQuizScreen([make('div', 'quiz-progress', `질문 ${i + 1} / ${total}`), bar, make('div', 'quiz-q', item.q), list]);
  }
  function quizShowResult() {
    const best = Math.max(...Object.values(quizScore));
    const tied = Object.keys(quizScore).filter(k => quizScore[k] === best);
    const res = quizResult = QUIZ.results[pick(tied)];
    SFX.play('fanfare');
    drawQuizPose(res.pose);
    const chips = make('div', 'quiz-chips');
    res.genres.forEach(g => chips.append(make('span', null, g)));
    const sayBox = make('div', 'quiz-say');
    sayBox.append(make('b', null, '구구덕'), document.createTextNode(QUIZ.outro));
    const actions = make('div', 'quiz-actions');
    actions.append(button('다시 하기', null, quizIntro), button('닫기', 'primary', closeQuiz));
    showQuizScreen([
      make('div', 'quiz-label', `${visitor ? visitor.nameN : '너'}의 독서 취향은`),
      make('div', 'quiz-emoji', res.emoji),
      make('h2', null, res.name),
      make('p', null, res.text),
      make('div', 'quiz-label', '어울리는 장르'),
      chips, sayBox, actions,
      make('div', 'quiz-hint', '결과 화면을 캡처해서 친구에게 보여 줘!'),
    ]);
  }
  // ---------- shelving game (books and sections live in shelf.js) ----------
  const SHELF = window.SHELF;
  const pad3 = n => String(n).padStart(3, '0');
  const shuffle = a => a.slice().sort(() => Math.random() - 0.5);
  const SPINE_COLORS = ['#4d7fd6', '#e0913a', '#3fa58a', '#b5566a'];
  let shelfRounds = [], shelfScore = 0, shelfResult = null;

  function shelfIntro() {
    shelfScore = 0; shelfResult = null;
    // the shelf-picking rounds use different books; each ordering round is a different one of the order types
    const pool = shuffle(SHELF.books), kinds = shuffle(SHELF.orderTypes);
    let next = 0, nextKind = 0;
    shelfRounds = SHELF.plan.map(type => {
      if (type === 'c') return { type, book: pool[next++ % pool.length] };
      const kind = kinds[nextKind++ % kinds.length];
      const books = kind.pick ? shuffle(kind.books).slice(0, kind.pick) : kind.books;
      return { type, kind, books: books.map(b => ({ ...b, call: b.call || kind.call })) };
    });
    drawQuizPose(SHELF.intro.pose);
    // a short KDC explanation and the ten sections, so players know the rules before starting
    const kdc = make('div', 'quiz-say');
    kdc.append(make('b', null, 'KDC가 뭐야?'), document.createTextNode(SHELF.intro.kdc));
    const list = make('div', 'kdc-list');
    SHELF.sections.forEach(sec => {
      const item = make('span');
      item.append(make('b', null, sec.code), document.createTextNode(' ' + sec.name));
      list.append(item);
    });
    const actions = make('div', 'quiz-actions');
    actions.append(button(SHELF.intro.start, 'primary', () => shelfRound(0)));
    showQuizScreen([make('h2', null, SHELF.intro.title), make('p', null, SHELF.intro.text), kdc, list, actions]);
  }
  function shelfHeader(i) {
    const total = shelfRounds.length;
    const bar = make('div', 'quiz-bar'), fill = make('span');
    fill.style.width = (i / total * 100) + '%';
    bar.append(fill);
    return [make('div', 'quiz-progress', `문제 ${i + 1} / ${total}  ·  맞힌 개수 ${shelfScore}`), bar];
  }
  // 구구독's comment after each round, plus the button to move on
  function shelfFeedback(i, ok, detail) {
    const box = make('div', 'quiz-say');
    box.append(make('b', null, '구구독'), document.createTextNode(`${pick(ok ? SHELF.right : SHELF.wrong)} ${detail}`));
    const actions = make('div', 'quiz-actions');
    const last = i + 1 >= shelfRounds.length;
    const nextBtn = button(last ? '결과 보기' : '다음 문제', 'primary', () => last ? shelfShowResult() : shelfRound(i + 1));
    actions.append(nextBtn);
    quizBody.append(box, actions);
    nextBtn.focus({ preventScroll: true });
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function shelfRound(i) {
    const round = shelfRounds[i];
    if (round.type === 'c') return shelfClassify(i, round.book);
    return shelfOrder(i, round.books, round.kind);
  }
  function shelfClassify(i, book) {
    drawQuizPose('dok-read');
    const card = make('div', 'shelf-book');
    card.append(make('b', null, book.title), make('small', null, book.about));
    const grid = make('div', 'shelf-grid');
    SHELF.sections.forEach(sec => {
      const b = button(`${sec.code} ${sec.name}`, null, () => {
        const ok = sec.code === book.cls;
        SFX.play(ok ? 'right' : 'wrong');
        if (ok) shelfScore++;
        grid.querySelectorAll('button').forEach(x => {
          x.disabled = true;
          if (x.dataset.code === book.cls) x.classList.add('right');
        });
        if (!ok) b.classList.add('wrong');
        const right = SHELF.sections.find(s => s.code === book.cls);
        shelfFeedback(i, ok, `「${book.title}」${hasBatchim(book.title[book.title.length - 1]) ? '은' : '는'} ${right.code} ${right.name} 칸이야. (${right.hint})`);
      });
      b.dataset.code = sec.code;
      grid.append(b);
    });
    showQuizScreen([...shelfHeader(i), make('div', 'quiz-q', '이 책은 어느 칸에 꽂아야 할까?'), card, grid]);
  }
  function shelfOrder(i, books, kind) {
    drawQuizPose('dok-books');
    // call numbers first (813 < 813.6), then author marks in 가나다 order, numbers by value (김12 < 김35)
    const sorted = books.slice().sort((a, b) => a.call - b.call || a.mark.localeCompare(b.mark, 'ko', { numeric: true }));
    const callNo = s => `${pad3(s.call)} ${s.mark}`;
    const rule = kind.rule;
    const row = make('div', 'shelf-row');
    const slots = sorted.map(() => { const s = make('div', 'spine-slot'); row.append(s); return s; });
    const spineFor = (book, k) => {
      const b = button('', 'spine', null);
      b.style.background = SPINE_COLORS[k % SPINE_COLORS.length];
      b.append(make('span', 'no', pad3(book.call)), make('span', 'mk', book.mark), make('span', 'tt', book.title));
      return b;
    };
    const pile = make('div', 'spines');
    // the longer explanation (kind.about) under the question
    const aboutBox = kind.about ? make('div', 'quiz-say', kind.about) : null;
    // once answered, the leftover books and the explanation step aside, so 구구독's comment
    // and the next button fit on one screen (the comment says the rule again)
    const tidy = () => { pile.remove(); if (aboutBox) aboutBox.remove(); };
    let placed = 0, done = false;
    shuffle(books).forEach((book, k) => {
      const b = spineFor(book, k);
      b.addEventListener('click', () => {
        if (done) return;
        if (book === sorted[placed]) {
          b.disabled = true;
          slots[placed].replaceChildren(spineFor(book, k));
          SFX.play('place', placed);
          placed++;
          if (placed === sorted.length) {
            done = true; shelfScore++;
            tidy();
            setTimeout(() => SFX.play('right'), 200);
            shelfFeedback(i, true, `${rule} 꽂으면 돼!`);
          }
          return;
        }
        // a wrong pick: show the right order on the shelf
        done = true;
        SFX.play('wrong');
        b.classList.add('wrong');
        pile.querySelectorAll('button').forEach(x => { x.disabled = true; });
        sorted.forEach((s, n) => slots[n].replaceChildren(spineFor(s, books.indexOf(s))));
        tidy();
        shelfFeedback(i, false, `${rule}: ${sorted.map(callNo).join(' → ')}`);
      });
      pile.append(b);
    });
    const help = [make('div', 'quiz-q', kind.help)];
    if (aboutBox) help.push(aboutBox);
    showQuizScreen([...shelfHeader(i), ...help, row, pile]);
  }
  function shelfShowResult() {
    const res = shelfResult = SHELF.results.find(r => shelfScore >= r.min);
    SFX.play('fanfare');
    drawQuizPose(res.pose);
    const box = make('div', 'quiz-say');
    box.append(make('b', null, '구구독'), document.createTextNode(SHELF.outro));
    const actions = make('div', 'quiz-actions');
    actions.append(button('다시 하기', null, shelfIntro), button('다른 게임', null, gamesMenu), button('닫기', 'primary', closeQuiz));
    showQuizScreen([
      make('div', 'quiz-label', `${visitor ? eunNeun(visitor.nameN) + ' ' : ''}${shelfRounds.length}문제 중 ${shelfScore}개 정답!`),
      make('div', 'quiz-emoji', res.emoji),
      make('h2', null, res.name),
      make('p', null, res.text),
      box, actions,
    ]);
  }

  // ---------- 구구덕의 스무고개 게임 ----------
  // a twin becomes a story character; the visitor asks yes/no questions, flips down the cards
  // that no longer fit, and picks the right one within twenty questions
  const RIDDLE = window.RIDDLE;
  // 구구덕's face changes with each answer
  const RIDDLE_POSES = { ask: ['duk-search', 'duk-think'], yes: ['duk-wave', 'duk-music'], no: ['duk-think', 'duk-shush'], win: 'duk-music' };
  const riddleYes = (c, id) => Object.prototype.hasOwnProperty.call(c.yes, id);
  // a question's answer for a character and the reason behind a yes
  const riddleAnswer = (c, q) => riddleYes(c, q.id);
  const riddleReason = (c, q) => c.yes[q.id];
  let riddleRounds = [], riddleScore = 0, riddleResult = null, riddleChance = true, riddleLevel = RIDDLE.levels[1];

  // how many questions two heroes answer differently
  const riddleDiff = (a, b) => RIDDLE.questions.filter(q => riddleAnswer(a, q) !== riddleAnswer(b, q)).length;
  // cards that are easy to tell apart: every two differ in at least minDiff answers
  // (if a board cannot be made that way, ask a little less)
  function riddleBoard(c, size) {
    for (let need = RIDDLE.minDiff || 6; need >= 0; need--) {
      for (let t = 0; t < 30; t++) {
        const board = [c];
        for (const o of shuffle(RIDDLE.characters)) {
          if (board.length >= size) break;
          if (!board.includes(o) && board.every(b => riddleDiff(b, o) >= need)) board.push(o);
        }
        if (board.length >= size) return shuffle(board);
      }
    }
    return shuffle(RIDDLE.characters).slice(0, size);
  }
  function riddleIntro() {
    riddleScore = 0; riddleResult = null; riddleChance = true;
    drawQuizPose(RIDDLE.intro.pose);
    const levels = make('div', 'quiz-actions riddle-levels');
    // a phone has room for 8 cards without scrolling, so 어려움 (12) is left out there
    const phone = matchMedia('(max-width: 600px)').matches;
    RIDDLE.levels.filter(lv => !(phone && lv.notOnPhone)).forEach(lv => {
      const b = button('', null, () => riddleStart(lv));
      b.append(make('b', null, lv.name), make('small', null, lv.desc));
      levels.append(b);
    });
    showQuizScreen([make('h2', null, RIDDLE.intro.title), make('p', null, RIDDLE.intro.text), make('div', 'quiz-label', RIDDLE.intro.choose), levels]);
  }
  function riddleStart(lv) {
    riddleLevel = lv;
    riddleRounds = shuffle(RIDDLE.characters).slice(0, RIDDLE.rounds).map(c => ({ c, board: riddleBoard(c, lv.cards) }));
    riddleRound(0);
  }
  function riddleHeader(i) {
    const total = riddleRounds.length;
    const bar = make('div', 'quiz-bar'), fill = make('span');
    fill.style.width = (i / total * 100) + '%';
    bar.append(fill);
    return [make('div', 'quiz-progress', `${riddleLevel.name}  ·  ${i + 1}번째 주인공 / ${total}  ·  점수 ${riddleScore}`), bar];
  }
  // 구구덕's pictures as images (made once from the trimmed canvases)
  const riddlePics = {};
  const riddlePic = id => {
    if (riddlePics[id]) return riddlePics[id];
    const im = IMGS[id];
    // before the pictures are trimmed, the original image is used (and not remembered)
    if (im && im.toDataURL) return (riddlePics[id] = im.toDataURL());
    return im ? im.src : '';
  };
  function riddleRound(i) {
    const { c, board } = riddleRounds[i];
    // 구구덕 answers right under the question, so the picture at the top steps aside
    quizPose.hidden = true;
    // 고개 used so far: not shown, but after twenty the answer is revealed
    let used = 0, done = false;
    const asked = [];
    // 구구덕 with a stamp: 응! / 아니! (or ? while waiting)
    const panel = make('div', 'riddle-answer'), line = make('div', 'riddle-q');
    const hostRow = make('div', 'riddle-twins'), hostBox = make('div', 'twin');
    const hostImg = make('img'), stamp = make('span', 'stamp', '?');
    hostImg.alt = CHARS.duk.name;
    hostBox.append(hostImg, stamp);
    hostRow.append(hostBox);
    panel.append(line, hostRow);
    // mood: 'ask' (thinking), 'yes', 'no' or 'win'; word: what the stamp says
    const show = (text, mood, word) => {
      line.textContent = text;
      hostImg.src = riddlePic(mood === 'win' ? RIDDLE_POSES.win : pick(RIDDLE_POSES[mood] || RIDDLE_POSES.ask));
      stamp.textContent = word;
      stamp.className = `stamp ${mood === 'yes' || mood === 'win' ? 'yes' : mood === 'no' ? 'no' : ''}`;
      // restart the little pop
      [hostImg, stamp].forEach(el => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); });
    };
    show(RIDDLE.ask, 'ask', '?');
    // the questions float up as thought clouds; pick one to ask it
    const thought = make('div', 'riddle-thought');
    thought.append(make('span', 'dot'), make('span', 'dot'), make('span', 'dot'));
    const clouds = make('div', 'riddle-clouds');
    const showClouds = () => {
      // some clouds are real clues: questions the hidden hero answers 응! to —
      // two for the first two questions of a round, then at least one
      const rest = shuffle(RIDDLE.questions.filter(q => !asked.includes(q)));
      const want = asked.length < 2 ? (RIDDLE.firstClues || 1) : 1;
      const clues = rest.filter(q => riddleAnswer(c, q)).slice(0, want);
      const others = rest.filter(q => !clues.includes(q));
      const left = shuffle([...clues, ...others.slice(0, RIDDLE.cloudCount - clues.length)]);
      clouds.replaceChildren(...left.map((q, k) => {
        const b = button(q.q, 'cloud', () => pickCloud(q, b));
        // puff in one after another, then drift gently
        b.style.animationDelay = `${k * 0.15}s, ${0.7 + k * 0.4}s`;
        return b;
      }));
      if (!left.length) clouds.append(make('p', 'riddle-none', RIDDLE.noMore));
    };
    showClouds();
    const refreshBtn = button(RIDDLE.refresh, 'refresh', () => { if (!done) showClouds(); });
    const chanceBtn = button(`✨ ${CHARS.duk.name} 찬스`, 'chance', useChance);
    chanceBtn.disabled = !riddleChance;
    const tools = make('div', 'riddle-tools');
    tools.append(refreshBtn, chanceBtn);
    // the sky holds the clouds and the two buttons; after the round the result shows here instead
    const sky = make('div', 'riddle-sky');
    sky.append(clouds, tools);
    // every question so far, newest on top, folded away until opened
    const history = make('ul', 'riddle-log');
    const fold = make('details', 'riddle-fold'), foldTitle = make('summary', null, `${RIDDLE.askedTitle} (0)`);
    fold.append(foldTitle, history);
    const cards = make('div', 'riddle-board'), cardOf = new Map();
    board.forEach(o => {
      const b = button('', null, () => guess(o));
      b.append(make('span', 'nm', o.name));
      cardOf.set(o, b);
      cards.append(b);
    });
    const alive = () => board.filter(o => !cardOf.get(o).classList.contains('out'));

    // the picked cloud puffs away, then 구구덕 answers
    function pickCloud(q, b) {
      if (done || asked.includes(q)) return;
      clouds.querySelectorAll('button').forEach(x => { x.disabled = x !== b; });
      b.classList.add('picked');
      SFX.play('puff');
      setTimeout(() => ask(q), 280);
    }
    function ask(q) {
      if (done || asked.includes(q)) return;
      used++;
      asked.push(q);
      const yes = riddleAnswer(c, q);
      SFX.play(yes ? 'yes' : 'no');
      show(q.q, yes ? 'yes' : 'no', pick(RIDDLE.answers[yes ? 'yes' : 'no']));
      history.prepend(make('li', yes ? 'yes' : 'no', `${yes ? '⭕' : '❌'} ${q.q}`));
      foldTitle.textContent = `${RIDDLE.askedTitle} (${asked.length})`;
      if (used >= RIDDLE.limit) { finish(false); return; }
      showClouds();
    }
    // a tap on a card is a guess; a wrong one costs two 고개 and that card is crossed out
    function guess(o) {
      const b = cardOf.get(o);
      if (done || b.classList.contains('out')) return;
      if (o === c) { finish(true); return; }
      used += RIDDLE.wrongCost;
      SFX.play('wrong');
      b.classList.add('wrong', 'out');
      show(pick(RIDDLE.wrongGuess), 'no', '땡!');
      if (used >= RIDDLE.limit) finish(false);
    }
    // once a game: three wrong cards are crossed out
    function useChance() {
      if (done || !riddleChance) return;
      riddleChance = false;
      SFX.play('chance');
      chanceBtn.disabled = true;
      shuffle(alive().filter(o => o !== c)).slice(0, RIDDLE.chanceCards)
        .forEach(o => cardOf.get(o).classList.add('out'));
      show(RIDDLE.chanceLine, 'yes', '✨');
    }
    function finish(ok) {
      done = true;
      refreshBtn.disabled = true; chanceBtn.disabled = true;
      clouds.querySelectorAll('button').forEach(x => { x.disabled = true; });
      cards.querySelectorAll('button').forEach(x => { x.disabled = true; });
      const answer = cardOf.get(c);
      answer.classList.remove('out');
      answer.classList.add('right');
      // fewer 고개 used, more points
      const pts = ok ? (RIDDLE.scores.find(s => used <= s.upTo) || { pts: 1 }).pts : 0;
      SFX.play(ok ? 'right' : 'lose');
      riddleScore += pts;
      show(ok ? pick(RIDDLE.right) : RIDDLE.timeUp, ok ? 'win' : 'no', ok ? '정답!' : '다음엔!');
      riddleFeedback(i, c, ok, pts, used, asked, sky);
    }

    showQuizScreen([
      ...riddleHeader(i), panel, thought, sky,
      make('div', 'riddle-label', '주인공 후보 · 누구인지 알겠으면 바로 눌러!'), cards, fold,
    ]);
  }
  // the result takes the place of the clouds (slot), so nothing grows below the cards
  function riddleFeedback(i, c, ok, pts, used, asked, slot) {
    // "나는 「피노키오의 모험」의 피노키오야!" — or 주인공 when the book has the same name, 우리는 for a group
    const who = c.book === c.name ? '주인공' : c.name;
    const me = `${c.we ? '우리는' : '나는'} 「${c.book}」의 ${who}${hasBatchim(who[who.length - 1]) ? '이야' : '야'}!`;
    const box = make('div', 'quiz-say');
    box.append(make('b', null, CHARS.duk.name), document.createTextNode(ok
      ? `${pick(RIDDLE.right)} ${me} ${c.about} (${used}고개 · ${'⭐'.repeat(pts)} +${pts}점)`
      : `${RIDDLE.timeUp} ${me} ${c.about}`));
    // 정답 확인표: every question asked, with the answer and the reason behind a yes
    const facts = asked.length ? asked : RIDDLE.questions.filter(q => riddleYes(c, q.id)).slice(0, 3);
    const check = make('ul', 'riddle-check');
    facts.forEach(q => {
      const yes = riddleAnswer(c, q);
      const li = make('li', yes ? 'yes' : 'no');
      li.append(make('b', null, `${yes ? '⭕' : '❌'} ${q.q}`), document.createTextNode(yes ? ` → ${riddleReason(c, q)}` : ' → 아니야'));
      // where in the story that answer comes from (why, in riddle.js)
      const why = yes && c.why && c.why[q.id];
      if (why) li.append(make('span', 'why', `📖 근거: ${why}`));
      check.append(li);
    });
    const actions = make('div', 'quiz-actions');
    const lastRound = i + 1 >= riddleRounds.length;
    const nextBtn = button(lastRound ? '결과 보기' : '다음 주인공', 'primary', () => lastRound ? riddleShowResult() : riddleRound(i + 1));
    actions.append(nextBtn);
    // the 정답 확인표 is folded; open it to see why each answer was 응 or 아니
    const fold = make('details', 'riddle-fold');
    fold.append(make('summary', null, asked.length ? RIDDLE.checkTitle : '이 주인공은 이랬어'), check);
    slot.classList.add('done');
    slot.replaceChildren(box, fold, actions);
    nextBtn.focus({ preventScroll: true });
  }
  function riddleShowResult() {
    const res = riddleResult = RIDDLE.results.find(r => riddleScore >= r.min);
    SFX.play('fanfare');
    drawQuizPose(res.pose);
    // the characters met in this game, so the visitor can look for their books
    const met = make('div', 'riddle-met');
    riddleRounds.forEach(({ c }) => met.append(make('span', null, c.name === c.book ? `「${c.book}」` : `${c.name} · 「${c.book}」`)));
    const box = make('div', 'quiz-say');
    box.append(make('b', null, CHARS.duk.name), document.createTextNode(RIDDLE.outro));
    const actions = make('div', 'quiz-actions');
    actions.append(button('다시 하기', null, riddleIntro), button('다른 게임', null, gamesMenu), button('닫기', 'primary', closeQuiz));
    showQuizScreen([
      make('div', 'quiz-label', `${riddleLevel.name}  ·  ${visitor ? eunNeun(visitor.nameN) + ' ' : ''}${riddleRounds.length * 5}점 중 ${riddleScore}점!`),
      make('div', 'quiz-emoji', res.emoji),
      make('h2', null, res.name),
      make('p', null, res.text),
      make('div', 'quiz-label', '오늘 만난 주인공'),
      met, box, actions,
    ]);
  }

  // ---------- 구구독의 오늘의 책 (todaybook.js) ----------
  const BOOKS = window.TODAY_BOOKS;
  // every book of every curation, each remembering its reading room and curation
  const BOOK_LIST = BOOKS ? BOOKS.curations.flatMap(cu => cu.books.map(b => ({ ...b, room: cu.room, curation: cu.name }))) : [];
  let bookResult = null, lastBook = null, bookSpin = 0;
  // one draw, plus BOOKS.redraws more (todaybook.js); a reload or the next visitor starts again
  let bookDraws = 0;
  // the reading room chosen first ("어느 자료실 책을 뽑을래?"); the draw and the redraw use only its books
  let bookRoom = null;
  const BOOK_ROOMS = BOOKS ? (BOOKS.rooms || [...new Set(BOOK_LIST.map(b => b.room))].map(room => ({ room })))
    .filter(r => BOOK_LIST.some(b => b.room === r.room)) : [];
  const BOOK_MAX = 1 + (BOOKS && BOOKS.redraws != null ? BOOKS.redraws : 1);
  // "아 813.8 안214ㄱ" → "어린이자료실 · 800 문학 › 한국 소설 서가" using the sections (shelf.js) and divisions (eggs.js)
  function bookWhere(book) {
    const m = String(book.call).match(/\d{3}/);
    const code = m ? m[0] : '';
    const main = code && SHELF && SHELF.sections.find(s => s.code === code[0] + '00');
    const div = EGGS && EGGS.callNo.divisions;
    const sub = main && div && code[1] !== '0' && (div[code] || div[code.slice(0, 2) + '0'] || '').replace(' 같은 ', '·');
    return `📍 ${book.room}${main ? ` · ${main.code} ${main.name}${sub ? ` › ${sub}` : ''} 서가` : ''}`;
  }
  function openBookDraw() {
    if (bookUsed) return;
    bookUsed = true;
    openGames(bookAskRoom);
  }
  // asked for a book in words: name the book already drawn, or open the draw
  function bookAsked() {
    const go = () => {
      if (ending || !quizEl.hidden || !isOut('dok')) return;
      if (bookUsed && lastBook) {
        say('dok', fill(pickFresh(BOOKS.recommend), { title: lastBook.title, call: lastBook.call, room: lastBook.room }));
        return;
      }
      say('dok', pickFresh(BOOKS.askOpen));
      setTimeout(() => { if (!ending && quizEl.hidden && state === 'shown') openBookDraw(); }, 1400);
    };
    // 구구독 comes out of the dust first if it is not here yet
    if (state === 'shown' && isOut('dok')) go();
    else { summon(['dok'], 'greet'); whenShown(go, 1800); }
  }
  function bookAskRoom() {
    quizResult = null; shelfResult = null; riddleResult = null; bookResult = null;
    drawQuizPose(BOOKS.pose || 'dok-books');
    const picks = make('div', 'game-picks');
    BOOK_ROOMS.forEach(r => {
      const b = button('', 'game-pick room-pick', () => { bookRoom = r; bookDraw(); });
      const txt = make('span');
      txt.append(make('b', null, r.room), make('small', null, r.desc || ''));
      // a twin's picture (pose id) on the button; an emoji only if no picture is given
      const icon = make('span', 'em');
      const c = IMGS[r.pose];
      if (c && c.width) {
        const h = 120, small = document.createElement('canvas'), img = make('img');
        small.width = Math.round(h * c.width / c.height); small.height = h;
        small.getContext('2d').drawImage(c, 0, 0, small.width, small.height);
        img.src = small.toDataURL(); img.alt = '';
        icon.append(img);
      } else icon.textContent = r.icon || '';
      b.append(icon, txt);
      picks.append(b);
    });
    showQuizScreen([make('h2', null, BOOKS.title), make('p', null, BOOKS.ask || '어느 자료실 책을 뽑을래?'), picks]);
  }
  function bookDraw() {
    if (bookDraws >= BOOK_MAX) return lastBook && bookReveal(lastBook, true);
    bookDraws++;
    quizResult = null; shelfResult = null; riddleResult = null; bookResult = null;
    const pool = bookRoom ? BOOK_LIST.filter(b => b.room === bookRoom.room) : BOOK_LIST;
    const list = pool.length > 1 ? pool.filter(b => b !== lastBook) : pool;
    const book = lastBook = pick(list);
    drawQuizPose(BOOKS.pose || 'dok-books');
    const reel = make('div', 'book-reel');
    showQuizScreen([make('h2', null, BOOKS.title), make('div', 'quiz-label', BOOKS.drawing), reel]);
    // titles spin by, slowing down, then the chosen one is shown
    const token = ++bookSpin;
    let n = 0;
    (function spin() {
      if (token !== bookSpin || quizEl.hidden) return;
      if (n++ >= 16) return bookReveal(book);
      reel.replaceChildren(make('span', null, `『${pick(pool).title}』`));
      SFX.play('tick');
      setTimeout(spin, 50 + n * n * 1.4);
    })();
  }
  function bookReveal(book, again) {
    bookResult = book;
    if (!again) SFX.play('gold');
    drawQuizPose(pick(['dok-hearteyes', 'dok-wink', 'dok-read']));
    const card = make('div', 'book-card');
    card.append(make('b', 'bk-title', `『${book.title}』`), make('span', 'bk-author', book.author),
      make('span', 'bk-call', book.call), make('span', 'bk-where', bookWhere(book)));
    const sayBox = make('div', 'quiz-say');
    sayBox.append(make('b', null, '구구독'), document.createTextNode(book.say));
    const actions = make('div', 'quiz-actions');
    const left = BOOK_MAX - bookDraws;
    actions.append(button('📸 오늘의 책 카드로 저장하기', 'card-save', () => bookCardScreen(book)));
    if (left > 0) actions.append(button(`한 번 더 뽑기 (${left}번 남음)`, null, bookDraw));
    actions.append(button('다른 게임', null, gamesMenu), button('닫기', 'primary', closeQuiz));
    showQuizScreen([
      make('div', 'quiz-label', bookRoom && bookRoom.label ? bookRoom.label : `${visitor ? visitor.nameN + '에게' : '너에게'} 온 ${BOOKS.found}`),
      card, sayBox, actions,
      make('div', 'quiz-hint', left > 0 ? BOOKS.note : BOOKS.last),
      make('div', 'book-from', `📌 ${book.room} 북큐레이션 「${book.curation}」`),
    ]);
  }

  // ---------- 오늘의 책 카드: the drawn book as a picture to keep ----------
  // The picture is made on the phone itself and is never sent anywhere.
  const CARD_FONT = "'Jua', 'Malgun Gothic', sans-serif", CARD_HAND = "'Gaegu', 'Jua', sans-serif";
  // the stamp is set in a heavy gothic (Black Han Sans, SIL Open Font License 1.1)
  const STAMP_FONT = "'Black Han Sans', 'Jua', 'Malgun Gothic', sans-serif";
  const cardFont = (size, hand) => hand ? `700 ${size}px ${CARD_HAND}` : `${size}px ${CARD_FONT}`;
  // Korean words stay whole on a line; a word longer than the line is broken by letters
  function wrapLines(c, text, maxW) {
    const lines = [], fits = s => c.measureText(s).width <= maxW;
    let line = '';
    for (const word of String(text).split(/\s+/).filter(Boolean)) {
      const test = line ? line + ' ' + word : word;
      if (fits(test)) { line = test; continue; }
      if (line) { lines.push(line); line = ''; }
      if (fits(word)) { line = word; continue; }
      for (const ch of word) { if (line && !fits(line + ch)) { lines.push(line); line = ''; } line += ch; }
    }
    if (line) lines.push(line);
    return lines;
  }
  // the web fonts only bring the letters a page uses, so ask for the card's own letters first
  async function loadCardFonts(text) {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.race([
        Promise.all([document.fonts.load(cardFont(60), text), document.fonts.load(cardFont(40, true), text),
          document.fonts.load(`30px ${STAMP_FONT}`, '구미도서관오늘의책0123456789.')]),
        new Promise(r => setTimeout(r, 2500)),
      ]);
    } catch (e) {}
  }
  // the date stamp: an old library seal in red seal ink, worn and pressed a little unevenly
  // the seal is laid out at radius 92 and drawn at whatever size r asks for, so it stays sharp
  function drawCardStamp(c, x, y, size, date) {
    const r = 92, zoom = size / r;
    const S = Math.ceil((r * 2 + 16) * zoom), m = S / 2;
    const st = document.createElement('canvas');
    st.width = st.height = S;
    const o = st.getContext('2d');
    o.translate(m, m); o.scale(zoom, zoom);
    o.strokeStyle = o.fillStyle = '#a3322b';
    o.textAlign = 'center'; o.textBaseline = 'middle';
    // a round seal: two lines on the rim, one around the middle
    o.lineWidth = 7; o.beginPath(); o.arc(0, 0, r - 4, 0, Math.PI * 2); o.stroke();
    o.lineWidth = 2; o.beginPath(); o.arc(0, 0, r - 12, 0, Math.PI * 2); o.stroke();
    o.lineWidth = 2.6; o.beginPath(); o.arc(0, 0, r - 38, 0, Math.PI * 2); o.stroke();
    // letters set around the ring: the library on top, the date below (both read left to right)
    const ring = (text, size, bottom, spacing) => {
      o.font = `${size}px ${STAMP_FONT}`;
      const rr = r - 25, gap = size * spacing, ch = [...text], w = ch.map(t => o.measureText(t).width);
      const total = w.reduce((a, b) => a + b, 0) + gap * (ch.length - 1);
      let at = 0;
      ch.forEach((t, k) => {
        const off = (total / 2 - at - w[k] / 2) / rr;
        const a = bottom ? Math.PI / 2 + off : -Math.PI / 2 - off;
        o.save(); o.translate(Math.cos(a) * rr, Math.sin(a) * rr); o.rotate(bottom ? a - Math.PI / 2 : a + Math.PI / 2);
        o.fillText(t, 0, 1); o.restore();
        at += w[k] + gap;
      });
    };
    ring('구미도서관', 20, false, 0.16);
    ring(date, 22, true, 0.04);
    // a small star at each side of the ring
    const star = (sx, sy, rad) => {
      o.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? rad * 0.42 : rad;
        o.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr);
      }
      o.closePath(); o.fill();
    };
    star(-(r - 25), 0, 6); star(r - 25, 0, 6);
    // the middle: 오늘의 over a big 책
    o.font = `19px ${STAMP_FONT}`; o.fillText('오늘의', 0, -16);
    o.font = `38px ${STAMP_FONT}`; o.fillText('책', 0, 18);
    // wear: ink missing in specks and fine scratches, and one side pressed lighter
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.globalCompositeOperation = 'destination-out';
    const rnd = mulberry(4417);
    // the band where the date sits keeps its ink, so the date always reads clearly
    const dateBand = y => y > m + 48 * zoom && y < m + 84 * zoom;
    for (let k = 0; k < 260; k++) {
      o.globalAlpha = 0.35 + rnd() * 0.65;
      const sx = rnd() * S, sy = rnd() * S;
      if (dateBand(sy)) { rnd(); continue; }
      o.beginPath(); o.arc(sx, sy, (0.5 + rnd() * rnd() * 2.6) * zoom, 0, Math.PI * 2); o.fill();
    }
    o.lineCap = 'round';
    for (let k = 0; k < 7; k++) {
      const sx = rnd() * S, sy = rnd() * S, a = rnd() * Math.PI;
      if (dateBand(sy)) continue;
      o.globalAlpha = 0.5; o.lineWidth = (0.8 + rnd() * 1.2) * zoom;
      const len = (8 + rnd() * 16) * zoom;
      o.beginPath(); o.moveTo(sx, sy); o.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len); o.stroke();
    }
    o.globalAlpha = 1;
    const fade = o.createLinearGradient(S * 0.2, S * 0.75, S * 0.95, S * 0.05);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,.4)');
    o.fillStyle = fade; o.fillRect(0, 0, S, S);
    // pressed onto the card, a little tilted, the ink soaking slightly into the paper
    c.save();
    c.translate(x, y); c.rotate(-0.22);
    c.globalAlpha = 0.86;
    c.shadowColor = 'rgba(163, 50, 43, .35)'; c.shadowBlur = 1.5;
    c.drawImage(st, -m, -m);
    c.restore();
  }
  async function makeBookCard(book) {
    const W = 1080, PAD = 70, MIN_H = 1350;
    const label = bookRoom && bookRoom.label ? bookRoom.label.replace(/은$/, '')
      : `${visitor ? visitor.nameN : '나'}에게 온 오늘의 책`;
    const where = bookWhere(book);
    const from = `📌 ${book.room} 북큐레이션 「${book.curation}」`;
    const d = new Date(), two = n => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())}`;
    await loadCardFonts([label, book.title, book.author, book.call, where, book.say, from, date,
      '『』구구독의 오늘의 책 경상북도교육청 구미도서관 청구기호를 보고 서가에서 찾아봐'].join(' '));

    // everything is drawn on a tall clear sheet first, then laid on the night-room background at its real height
    const sheet = document.createElement('canvas');
    sheet.width = W; sheet.height = 2600;
    const c = sheet.getContext('2d');
    c.textBaseline = 'top';

    // heading: 구구독의 오늘의 책
    c.font = cardFont(78);
    const hA = '구구독', hB = '의 오늘의 책', wA = c.measureText(hA).width, wB = c.measureText(hB).width;
    c.textAlign = 'left';
    c.fillStyle = '#4cc6ea'; c.fillText(hA, (W - wA - wB) / 2, 66);
    c.fillStyle = '#fff8ee'; c.fillText(hB, (W - wA - wB) / 2 + wA, 66);

    // ----- the book card: measure first, then draw -----
    const cardX = PAD, cardW = W - PAD * 2, inX = cardX + 60, inW = cardW - 120, cardTop = 196;
    const labelY = cardTop + 58;
    // the date stamp sits at the card's top right, over the dashed line, like a stamp on a loan card
    const stampR = 128, stampX = inX + inW - stampR + 18, stampY = labelY + 52 + stampR - 6;
    const stampBottom = stampY + stampR, sideW = inW - stampR * 2 - 10;
    let ts = 84, titleLines;
    for (;;) {
      c.font = cardFont(ts);
      titleLines = wrapLines(c, `『${book.title}』`, sideW);
      if (titleLines.length <= 2 || ts <= 58) break;
      ts -= 6;
    }
    if (titleLines.length > 3) { titleLines = titleLines.slice(0, 3); titleLines[2] = titleLines[2].replace(/.$/, '…'); }
    const tlh = Math.round(ts * 1.24), titleY = labelY + 34 + 34;
    const authorY = titleY + titleLines.length * tlh + 8;
    const rowY = authorY + (book.author ? 38 : 0) + 24;
    // a row that still reaches down beside the stamp keeps to the room left of it
    const callRoom = rowY < stampBottom - 10 ? sideW : inW;
    let cs = 56;
    c.font = cardFont(cs);
    while (c.measureText(book.call).width + 64 > callRoom && cs > 34) { cs -= 4; c.font = cardFont(cs); }
    const callW = c.measureText(book.call).width + 64, callH = cs + 48;
    c.font = cardFont(36);
    const whereY = rowY + callH + 26;
    const whereLines = wrapLines(c, where, whereY < stampBottom - 10 ? sideW : inW);
    const cardBottom = Math.max(whereY + whereLines.length * 50 + 52, stampBottom + 44);

    // card paper with the page's blue-to-purple stripe on top
    c.save();
    c.shadowColor = 'rgba(0, 0, 0, .35)'; c.shadowBlur = 40; c.shadowOffsetY = 14;
    c.fillStyle = '#fff4e2';
    roundRect(c, cardX, cardTop, cardW, cardBottom - cardTop, 44); c.fill();
    c.restore();
    c.save();
    roundRect(c, cardX, cardTop, cardW, cardBottom - cardTop, 44); c.clip();
    const stripe = c.createLinearGradient(cardX, 0, cardX + cardW, 0);
    stripe.addColorStop(0, '#4cc6ea'); stripe.addColorStop(1, '#a35cf5');
    c.fillStyle = stripe; c.fillRect(cardX, cardTop, cardW, 20);
    c.fillStyle = '#f1dcbc'; c.fillRect(cardX, cardBottom - 12, cardW, 12);
    c.restore();

    c.fillStyle = '#b08850'; c.font = cardFont(34);
    c.fillText(label, inX, labelY);
    c.strokeStyle = '#ecd6b3'; c.lineWidth = 3; c.setLineDash([10, 10]);
    c.beginPath(); c.moveTo(inX, labelY + 52); c.lineTo(inX + inW, labelY + 52); c.stroke();
    c.setLineDash([]);
    c.fillStyle = '#7a4b12'; c.font = cardFont(ts);
    titleLines.forEach((t, i) => c.fillText(t, inX, titleY + i * tlh));
    if (book.author) { c.fillStyle = '#8a6a3a'; c.font = cardFont(38); c.fillText(book.author, inX, authorY); }
    // the call number in a dashed box
    const callY = rowY;
    c.fillStyle = '#fff';
    roundRect(c, inX, callY, callW, callH, 20); c.fill();
    c.strokeStyle = '#e0b77a'; c.lineWidth = 4; c.setLineDash([14, 10]); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#7a4b12'; c.font = cardFont(cs); c.textBaseline = 'middle';
    c.fillText(book.call, inX + 32, callY + callH / 2 + 2);
    c.textBaseline = 'top';
    drawCardStamp(c, stampX, stampY, stampR, date);
    c.fillStyle = '#1f5f7a'; c.font = cardFont(36);
    whereLines.forEach((t, i) => c.fillText(t, inX, whereY + i * 50));

    // ----- 구구독 with its one-line note in a speech bubble -----
    const face = pic('dok-wink') || IMGS['dok-books'];
    const picH = 300, picW = face && face.width ? Math.min(260, Math.round(picH * face.width / face.height)) : 0;
    const bx = PAD + (picW ? picW + 34 : 0), bw = W - PAD - bx, sayW = bw - 76;
    c.font = cardFont(38);
    const sayLines = wrapLines(c, book.say || '', sayW);
    const bh = 34 + 34 + 12 + sayLines.length * 54 + 30;
    const secTop = cardBottom + 54, secH = Math.max(picH, bh);
    const by = secTop + (secH - bh) / 2;
    if (picW) c.drawImage(face, PAD - 6, secTop + (secH - picH), picW, Math.round(picW * face.height / face.width));
    c.fillStyle = '#fff';
    roundRect(c, bx, by, bw, bh, 36); c.fill();
    if (picW) { // the tail points to 구구독
      c.beginPath(); c.moveTo(bx + 2, by + bh / 2 - 20); c.lineTo(bx - 26, by + bh / 2 + 6); c.lineTo(bx + 2, by + bh / 2 + 18); c.fill();
    }
    c.fillStyle = '#2fa9d8'; c.font = cardFont(30);
    c.fillText('구구독', bx + 38, by + 34);
    c.fillStyle = '#3b2a55'; c.font = cardFont(38);
    sayLines.forEach((t, i) => c.fillText(t, bx + 38, by + 34 + 34 + 12 + i * 54));

    // ----- footer, kept at the bottom -----
    // a long curation name gets smaller letters before it wraps
    let fs = 30;
    c.font = cardFont(fs);
    while (c.measureText(from).width > W - PAD * 2 && fs > 24) { fs -= 2; c.font = cardFont(fs); }
    const fromLines = wrapLines(c, from, W - PAD * 2);
    const footH = fromLines.length * 44 + 14 + 44;
    const H = Math.max(MIN_H, secTop + secH + 60 + footH + 64);
    const footY = H - 64 - footH;
    c.textAlign = 'center';
    c.fillStyle = '#cbbfe6';
    fromLines.forEach((t, i) => c.fillText(t, W / 2, footY + i * 44));
    c.fillStyle = '#ffe9c4'; c.font = cardFont(40, true);
    c.fillText('경상북도교육청 구미도서관', W / 2, footY + fromLines.length * 44 + 14);

    // ----- the night-room background with golden dust, then the sheet on top -----
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const o = out.getContext('2d');
    const bg = o.createRadialGradient(W * 0.3, 0, 0, W * 0.3, 0, H);
    bg.addColorStop(0, '#3a2c5c'); bg.addColorStop(1, '#120e1f');
    o.fillStyle = bg; o.fillRect(0, 0, W, H);
    const rnd = mulberry(book.title.length * 97 + H);
    for (let i = 0; i < 110; i++) {
      o.fillStyle = `rgba(255, 236, 200, ${(0.15 + rnd() * 0.55).toFixed(2)})`;
      o.beginPath(); o.arc(rnd() * W, rnd() * H, 1.5 + rnd() * 3.5, 0, Math.PI * 2); o.fill();
    }
    o.drawImage(sheet, 0, 0, W, H, 0, 0, W, H);
    return out;
  }
  async function bookCardScreen(book) {
    const token = ++bookSpin;
    quizPose.hidden = true;
    showQuizScreen([make('h2', null, '오늘의 책 카드'), make('div', 'book-reel', '구구독이 카드를 그리는 중…')]);
    let cv = null;
    try { cv = await makeBookCard(book); } catch (e) {}
    if (token !== bookSpin || quizEl.hidden) return;
    if (!cv) return bookReveal(book, true);
    SFX.play('heart');
    const img = make('img', 'card-shot');
    img.src = cv.toDataURL('image/png');
    img.alt = `오늘의 책 카드: 『${book.title}』 ${book.call}`;
    const status = make('div', 'quiz-hint', '카드 사진을 꾹 눌러도 휴대폰에 저장할 수 있어!');
    const file = `구구독의 오늘의 책_${book.title.replace(/[\\/:*?"<>|\s]+/g, '_')}.png`;
    const actions = make('div', 'quiz-actions');
    actions.append(
      button('💾 사진 저장하기', 'primary', () => saveBookCard(cv, file, status)),
      button('돌아가기', null, () => bookReveal(book, true)),
      button('닫기', null, closeQuiz));
    showQuizScreen([make('h2', null, '오늘의 책 카드'), img, actions, status]);
  }
  // Opened inside Claude, the page may not download by itself; the viewer's own save (with a confirmation) is used there.
  // Anywhere else (GitHub Pages) window.claude is absent and this stays null.
  const claudeSave = window.claude && window.claude.use
    ? Promise.resolve(window.claude.use('downloads')).catch(() => null) : Promise.resolve(null);
  // iPhone: the share sheet (it has "이미지 저장"); other phones: a download, which lands in the gallery
  function saveBookCard(cv, file, status, what = '카드') {
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const fallback = () => { status.textContent = `${what} 사진을 꾹 눌러서 저장해 줘!`; };
    cv.toBlob(async blob => {
      if (!blob) return fallback();
      const dl = await claudeSave;
      if (dl) {
        try {
          await dl.save({ filename: file, data: blob });
          status.textContent = '저장했어! 사진첩이나 다운로드 폴더를 확인해 봐~';
        } catch (e) {
          if (!e || e.code !== 'declined') fallback();
        }
        return;
      }
      let f = null;
      try { f = new File([blob], file, { type: 'image/png' }); } catch (e) {}
      if (ios && f && navigator.canShare && navigator.canShare({ files: [f] })) {
        try {
          await navigator.share({ files: [f] });
          status.textContent = what === '카드' ? '"이미지 저장"을 눌렀다면 사진첩에 들어갔어! 서가에서 이 책을 찾아봐~'
            : '"이미지 저장"을 눌렀다면 사진첩에 들어갔어!';
          return;
        } catch (e) { if (e && e.name === 'AbortError') return; }
      }
      try {
        const a = make('a');
        a.href = URL.createObjectURL(blob); a.download = file;
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
        status.textContent = ios ? `"파일" 앱에 저장했어! 사진첩에 넣으려면 ${what} 사진을 꾹 눌러 줘.`
          : '저장했어! 갤러리나 다운로드 폴더를 확인해 봐~';
      } catch (e) { fallback(); }
    }, 'image/png');
  }

  // ---------- 구구덕의 독서 영수증 (receipt.js) ----------
  // a book on the top shelf opens it; the visitor's photo is turned into a thermal-printed receipt
  // the photo stays in this phone's memory only and is let go when the window closes
  const RC_HEAD = "'Black Han Sans', 'Jua', 'Malgun Gothic', sans-serif";
  const RC_MONO = "'Nanum Gothic Coding', 'Jua', 'Malgun Gothic', monospace";
  const RC_INK = '#2a2433';
  let receiptResult = null, receiptPhoto = null, receiptSpin = 0, rcCam = null, rcPick = null;
  let rcDraft = { title: '', stars: 0, moods: [] };
  function openReceipt() {
    receiptOpened = true;
    rcDraft = { title: '', stars: 0, moods: [] };
    dropReceiptPhoto();
    openGames(receiptIntro);
  }
  function dropReceiptPhoto() {
    if (receiptPhoto && receiptPhoto.close) { try { receiptPhoto.close(); } catch (e) {} }
    receiptPhoto = null;
  }
  // two hidden file pickers: one asks for the camera, one for the photo album
  function rcInput(camera) {
    const i = make('input');
    i.type = 'file'; i.accept = 'image/*'; i.hidden = true;
    if (camera) i.setAttribute('capture', 'environment');
    i.addEventListener('change', () => {
      const f = i.files && i.files[0];
      i.value = '';
      if (f && !quizEl.hidden) receiptTakePhoto(f);
    });
    document.body.append(i);
    return i;
  }
  function pickPhoto(camera) {
    const i = camera ? (rcCam = rcCam || rcInput(true)) : (rcPick = rcPick || rcInput(false));
    i.click();
  }
  function receiptIntro(msg) {
    quizResult = null; shelfResult = null; riddleResult = null; bookResult = null; receiptResult = null;
    drawQuizPose('duk-search');
    const actions = make('div', 'quiz-actions');
    actions.append(button(RECEIPT.camera, 'primary', () => pickPhoto(true)), button(RECEIPT.gallery, null, () => pickPhoto(false)));
    const note = make('div', 'quiz-hint', msg || RECEIPT.privacy);
    if (msg) note.classList.add('rc-note');
    showQuizScreen([make('h2', null, RECEIPT.title), make('p', null, RECEIPT.intro), actions, note]);
  }
  async function receiptTakePhoto(file) {
    let img = null;
    try { if (window.createImageBitmap) img = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) {}
    if (!img) {
      img = await new Promise(res => {
        const im = new Image(), url = URL.createObjectURL(file);
        im.onload = () => { URL.revokeObjectURL(url); res(im); };
        im.onerror = () => { URL.revokeObjectURL(url); res(null); };
        im.src = url;
      });
    }
    if (quizEl.hidden) { if (img && img.close) img.close(); return; }
    if (!img || !img.width) return receiptIntro('사진을 열 수 없었어. 다른 사진으로 해 볼래?');
    dropReceiptPhoto();
    receiptPhoto = img;
    receiptForm();
  }
  // the photo, cut to fill w × h from its middle
  function drawCover(c, img, w, h) {
    const s = Math.max(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s;
    c.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }
  function receiptForm(msg) {
    const R = RECEIPT;
    drawQuizPose('duk-think');
    const t = document.createElement('canvas');
    t.width = 168; t.height = 210;
    drawCover(t.getContext('2d'), receiptPhoto, t.width, t.height);
    const thumb = make('img', 'rc-thumb');
    thumb.src = t.toDataURL('image/jpeg', 0.85); thumb.alt = '찍은 책 사진';
    const side = make('div', 'rc-side');
    side.append(make('p', null, R.ask), button('다시 찍기', 'rc-again', () => pickPhoto(true)));
    const top = make('div', 'rc-top');
    top.append(thumb, side);
    const label = (text, forId) => { const l = make('label', 'rc-label', text); if (forId) l.htmlFor = forId; return l; };
    const title = make('input');
    title.id = 'rcTitle'; title.maxLength = 40; title.autocomplete = 'off';
    title.placeholder = R.titlePlaceholder; title.value = rcDraft.title;
    title.addEventListener('input', () => { rcDraft.title = title.value; });
    const stars = make('div', 'rc-stars');
    const paintStars = () => stars.querySelectorAll('button').forEach((b, k) => {
      b.classList.toggle('on', k < rcDraft.stars);
      b.setAttribute('aria-pressed', String(k + 1 === rcDraft.stars));
    });
    for (let n = 1; n <= 5; n++) {
      const b = button('★', null, () => { rcDraft.stars = n; paintStars(); SFX.play('place', n - 1); });
      b.setAttribute('aria-label', `별 ${n}개`);
      stars.append(b);
    }
    paintStars();
    const moods = make('div', 'rc-moods');
    // up to two moods; a third pick lets the oldest one go
    const paintMoods = () => moods.querySelectorAll('button').forEach((x, k) => {
      const on = rcDraft.moods.includes(R.moods[k]);
      x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on));
    });
    R.moods.forEach(m => {
      moods.append(button(m.label, null, () => {
        const at = rcDraft.moods.indexOf(m);
        if (at >= 0) rcDraft.moods.splice(at, 1);
        else { rcDraft.moods.push(m); if (rcDraft.moods.length > 2) rcDraft.moods.shift(); }
        paintMoods();
      }));
    });
    paintMoods();
    const note = make('div', 'quiz-hint rc-note', msg || '');
    const actions = make('div', 'quiz-actions');
    actions.append(button('영수증 끊기', 'primary', () => {
      rcDraft.title = title.value.trim();
      const miss = !rcDraft.title ? 'title' : !rcDraft.stars ? 'stars' : !rcDraft.moods.length ? 'mood' : null;
      if (miss) {
        note.textContent = R.missing[miss];
        SFX.play('wrong');
        if (miss === 'title') title.focus();
        return;
      }
      receiptPrint();
    }), button('닫기', null, closeQuiz));
    showQuizScreen([make('h2', null, R.title), top, label('책 제목', 'rcTitle'), title,
      label('별점'), stars, label(R.moodLabel || '다 읽고 난 기분'), moods, actions, note]);
  }

  // a picture as thermal print: grey levels stretched, then Atkinson dithering into ink dots (px pixels each)
  function thermal(draw, w, h, px) {
    const a = document.createElement('canvas');
    a.width = w; a.height = h;
    const x = a.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
    draw(x, w, h);
    const im = x.getImageData(0, 0, w, h), d = im.data, n = w * h, g = new Float32Array(n);
    for (let i = 0; i < n; i++) g[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
    const sorted = Float32Array.from(g).sort();
    let lo = sorted[Math.floor(n * 0.02)], hi = sorted[Math.floor(n * 0.98)];
    if (hi - lo < 40) { lo = 0; hi = 255; }
    for (let i = 0; i < n; i++) g[i] = Math.max(0, Math.min(255, (g[i] - lo) / (hi - lo) * 255));
    const ink = [42, 36, 51];
    const spread = (i, e) => { if (i >= 0 && i < n) g[i] += e; };
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const i = yy * w + xx, old = g[i], dark = old < 128, err = (old - (dark ? 0 : 255)) / 8;
      if (xx + 1 < w) spread(i + 1, err);
      if (xx + 2 < w) spread(i + 2, err);
      if (xx > 0) spread(i + w - 1, err);
      spread(i + w, err);
      if (xx + 1 < w) spread(i + w + 1, err);
      spread(i + w * 2, err);
      d[i * 4] = ink[0]; d[i * 4 + 1] = ink[1]; d[i * 4 + 2] = ink[2]; d[i * 4 + 3] = dark ? 255 : 0;
    }
    x.putImageData(im, 0, 0);
    const out = document.createElement('canvas');
    out.width = w * px; out.height = h * px;
    const o = out.getContext('2d');
    o.imageSmoothingEnabled = false;
    o.drawImage(a, 0, 0, out.width, out.height);
    return out;
  }
  function starShape(c, cx, cy, r, filled) {
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r;
      c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    c.closePath();
    if (filled) c.fill(); else { c.lineWidth = 2.5; c.stroke(); }
  }
  async function makeReceipt(d) {
    const R = RECEIPT, W = 860, PX = 70, PW = 720, x0 = PX + 48, x1 = PX + PW - 48, CW = x1 - x0, MID = PX + PW / 2;
    const now = new Date(), two = n => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}.${two(now.getMonth() + 1)}.${two(now.getDate())}`;
    const time = `${two(now.getHours())}:${two(now.getMinutes())}`;
    const no = String(1000 + Math.floor(Math.random() * 9000));
    const who = visitor ? (visitor.name === visitor.call ? visitor.name : `${visitor.name} 님`) : R.guest;
    const T = R.types, type = d.moods[0].type, typeName = T[type].name;
    const moodText = d.moods.map(m => m.label).join(' · ');
    // taste meter: the first mood leads, a second mood (of another taste) comes next;
    // the rest is set by the title, so the same book always reads the same
    const seed = hashOf(d.title), others = Object.keys(T).filter(t => t !== type);
    const picked = d.moods[1] && d.moods[1].type !== type ? d.moods[1].type : null;
    const second = picked || others[seed % others.length];
    const rest = others.filter(t => t !== second), third = rest[(seed >> 3) % rest.length];
    const meter = [[type, Math.min(99, 62 + d.stars * 7 + seed % 6)],
      [second, picked ? 44 + (seed >> 2) % 18 : 28 + (seed >> 2) % 20], [third, 10 + (seed >> 5) % 16]];
    const say = `${pick(R.moodLines[type])} ${pick(R.starLines[d.stars])}`;
    if (document.fonts && document.fonts.load) {
      const sample = [d.title, who, say, typeName, R.title, date, time, moodText,
        '경상북도교육청 구미도서관 영수증 번호 발행 일시 손님 담당 취향 큐레이터 품목 수량 별점 기분 합계 1권 완독 한마디 분석 READING RECEIPT GUGUDUK-0123456789',
        Object.values(T).map(t => t.short).join('')].join(' ');
      try {
        await Promise.race([
          Promise.all([document.fonts.load(`40px ${RC_HEAD}`, sample), document.fonts.load(`700 26px ${RC_MONO}`, sample),
            document.fonts.load(`400 26px ${RC_MONO}`, sample)]),
          new Promise(r => setTimeout(r, 2500)),
        ]);
      } catch (e) {}
    }

    // everything printed goes on a clear sheet first; the paper is cut to its height afterwards
    const ink = document.createElement('canvas');
    ink.width = W; ink.height = 4200;
    const c = ink.getContext('2d');
    c.fillStyle = c.strokeStyle = RC_INK; c.textBaseline = 'top';
    let y = 56;
    const mono = (size, bold = true) => `${bold ? 700 : 400} ${size}px ${RC_MONO}`;
    const center = (t, font, gapAfter) => { c.font = font; c.textAlign = 'center'; c.fillText(t, MID, y); y += gapAfter; };
    const row = (l, r, size = 25) => {
      c.font = mono(size); c.textAlign = 'left'; c.fillText(l, x0, y);
      c.font = mono(size, false); c.textAlign = 'right'; if (r) c.fillText(r, x1, y);
      y += size + 18;
    };
    const dash = () => { y += 4; for (let x = x0; x < x1; x += 18) c.fillRect(x, y, 10, 3); y += 28; };
    const double = () => { y += 4; c.fillRect(x0, y, CW, 3); c.fillRect(x0, y + 8, CW, 3); y += 34; };

    // 구구덕 in print, then the heading
    const duk = IMGS['duk-read'];
    if (duk && duk.width) {
      const h = 76, w = Math.round(h * duk.width / duk.height);
      const pic = thermal((x, ww, hh) => x.drawImage(duk, 0, 0, ww, hh), w, h, 2);
      c.drawImage(pic, MID - pic.width / 2, y);
      y += pic.height + 14;
    }
    center(R.title, `50px ${RC_HEAD}`, 66);
    center('R E A D I N G   R E C E I P T', mono(20), 34);
    center('경상북도교육청 구미도서관', mono(24, false), 44);
    dash();
    row('영수증 번호', `No.${no}`);
    row('발행 일시', `${date} ${time}`);
    row('손님', who);
    row('담당', '취향 큐레이터 구구덕');
    dash();

    // the photo, printed like a thermal picture
    const ph = thermal((x, w, h) => drawCover(x, d.photo, w, h), 260, 325, 2);
    y += 6;
    c.drawImage(ph, MID - ph.width / 2, y);
    y += ph.height + 18;
    dash();

    // the item: the book itself
    row('품목', '수량', 22);
    c.font = mono(34);
    let tl = wrapLines(c, `『${d.title}』`, CW - 90);
    if (tl.length > 3) { tl = tl.slice(0, 3); tl[2] = tl[2].replace(/.$/, '…'); }
    c.textAlign = 'left';
    tl.forEach((t, i) => c.fillText(t, x0, y + i * 46));
    c.font = mono(28, false); c.textAlign = 'right'; c.fillText('1권', x1, y + 4);
    y += tl.length * 46 + 14;
    row('별점', '');
    y -= 43;
    for (let k = 0; k < 5; k++) starShape(c, x1 - 15 - (4 - k) * 36, y + 13, 15, k < d.stars);
    y += 43;
    row('기분', moodText);
    double();
    c.font = `44px ${RC_HEAD}`; c.textAlign = 'left'; c.fillText('합계', x0, y);
    c.textAlign = 'right'; c.fillText('1권 완독!', x1, y);
    y += 66;
    dash();

    // 구구덕's taste reading
    center('구구덕의 취향 분석', mono(27), 42);
    center(typeName, `48px ${RC_HEAD}`, 70);
    const barX = x0 + 96, barW = CW - 96 - 84;
    meter.forEach(([t, pct]) => {
      c.font = mono(25); c.textAlign = 'left'; c.fillText(T[t].short, x0, y);
      c.lineWidth = 3; c.strokeRect(barX, y + 2, barW, 24);
      c.fillRect(barX, y + 2, Math.round(barW * pct / 100), 24);
      c.font = mono(25, false); c.textAlign = 'right'; c.fillText(`${pct}%`, x1, y);
      y += 46;
    });
    dash();

    // 구구덕 한마디
    c.font = mono(24); c.textAlign = 'left'; c.fillText('구구덕 한마디', x0, y);
    y += 40;
    c.font = mono(28, false);
    wrapLines(c, say, CW).forEach(t => { c.fillText(t, x0, y); y += 42; });
    y += 4;
    dash();

    // a barcode made from the title and the receipt number (decorative)
    const rnd = mulberry(seed ^ Number(no));
    let bx = MID - 250;
    while (bx < MID + 246) {
      const bw = 2 + Math.floor(rnd() * 4);
      c.fillRect(bx, y + 4, bw, 96);
      bx += bw + 2 + Math.floor(rnd() * 5);
    }
    y += 112;
    center(`GUGUDUK-${date.replace(/\./g, '')}-${no}`, mono(21, false), 46);
    const paperH = y + 30;

    // the paper: a long slip with torn zigzag ends (on its own, for the printer on screen)
    const TOP = 60, H = TOP + paperH + 70;
    const slip = document.createElement('canvas');
    slip.width = W; slip.height = H;
    const o = slip.getContext('2d');
    const dust = mulberry(seed + 11);
    const tooth = 18, deep = 10, bottom = TOP + paperH;
    o.beginPath();
    o.moveTo(PX, TOP + deep);
    for (let x = PX; x < PX + PW; x += tooth) { o.lineTo(x + tooth / 2, TOP); o.lineTo(Math.min(x + tooth, PX + PW), TOP + deep); }
    o.lineTo(PX + PW, bottom - deep);
    for (let x = PX + PW; x > PX; x -= tooth) { o.lineTo(x - tooth / 2, bottom); o.lineTo(Math.max(x - tooth, PX), bottom - deep); }
    o.closePath();
    o.save();
    o.shadowColor = 'rgba(0, 0, 0, .4)'; o.shadowBlur = 36; o.shadowOffsetY = 12;
    o.fillStyle = '#fbf9f3'; o.fill();
    o.restore();
    o.save();
    o.clip();
    // a faint curl at the edges and a little paper grain
    const curl = o.createLinearGradient(PX, 0, PX + PW, 0);
    curl.addColorStop(0, 'rgba(120, 100, 140, .10)'); curl.addColorStop(0.08, 'rgba(120, 100, 140, 0)');
    curl.addColorStop(0.92, 'rgba(120, 100, 140, 0)'); curl.addColorStop(1, 'rgba(120, 100, 140, .10)');
    o.fillStyle = curl; o.fillRect(PX, TOP, PW, paperH);
    for (let i = 0; i < 900; i++) {
      o.fillStyle = `rgba(90, 80, 100, ${(dust() * 0.06).toFixed(3)})`;
      o.fillRect(PX + dust() * PW, TOP + dust() * paperH, 2, 2);
    }
    // thermal ink is never quite solid black
    o.globalAlpha = 0.93;
    o.drawImage(ink, 0, 0, W, paperH, 0, TOP, W, paperH);
    o.restore();
    // ...and the picture to keep: the slip on the page's night background
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const b = out.getContext('2d');
    const bg = b.createRadialGradient(W * 0.3, 0, 0, W * 0.3, 0, H);
    bg.addColorStop(0, '#3a2c5c'); bg.addColorStop(1, '#120e1f');
    b.fillStyle = bg; b.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      b.fillStyle = `rgba(255, 236, 200, ${(0.15 + dust() * 0.5).toFixed(2)})`;
      b.beginPath(); b.arc(dust() * W, dust() * H, 1.5 + dust() * 3, 0, Math.PI * 2); b.fill();
    }
    b.drawImage(slip, 0, 0);
    // the slip alone, cut to the paper with a little room for its shadow
    const cut = document.createElement('canvas');
    cut.width = PW + 40; cut.height = H - TOP + 30;
    cut.getContext('2d').drawImage(slip, PX - 20, TOP - 10, cut.width, cut.height, 0, 0, cut.width, cut.height);
    return { out, slip: cut };
  }
  async function receiptPrint() {
    const R = RECEIPT, token = ++receiptSpin;
    const data = { photo: receiptPhoto, title: maskSwears(rcDraft.title), stars: rcDraft.stars, moods: rcDraft.moods.slice() };
    drawQuizPose('duk-music');
    const status = make('div', 'quiz-label', R.printing);
    const printer = make('div', 'rc-printer');
    printer.append(make('span', 'rc-slot'));
    const out = make('div', 'rc-out');
    const actions = make('div', 'quiz-actions');
    showQuizScreen([make('h2', null, R.title), status, actions, printer, out]);
    let made = null;
    try { made = await makeReceipt(data); } catch (e) { console.error(e); }
    if (token !== receiptSpin || quizEl.hidden) return;
    if (!made) return receiptForm('영수증을 만들지 못했어. 한 번 더 눌러 줄래?');
    const cv = made.out;
    receiptResult = { title: data.title };
    const img = make('img', 'rc-shot');
    img.alt = `독서 영수증: 『${data.title}』 별점 ${data.stars}개, ${data.moods.map(m => m.label).join(', ')}`;
    img.src = made.slip.toDataURL('image/png');
    out.style.height = '0px';
    out.append(img);
    try { await img.decode(); } catch (e) {}
    if (token !== receiptSpin || quizEl.hidden) return;
    // the slip comes out of the printer a strip at a time
    const steps = 18, full = () => img.getBoundingClientRect().height;
    let n = 0;
    (function feed() {
      if (token !== receiptSpin || quizEl.hidden) return;
      n++;
      out.style.height = Math.round(full() * n / steps) + 'px';
      SFX.play('tick');
      if (n < steps) return void setTimeout(feed, 95);
      out.style.height = '';
      SFX.play('right');
      drawQuizPose('duk-wave');
      status.textContent = R.saveHint;
      const file = `구구덕의 독서 영수증_${data.title.replace(/[\\/:*?"<>|\s]+/g, '_')}.png`;
      actions.append(
        button('💾 사진 저장하기', 'primary', () => saveBookCard(cv, file, status, '영수증')),
        button('한 장 더', null, () => { rcDraft = { title: '', stars: 0, moods: [] }; dropReceiptPhoto(); receiptIntro(); }),
        button('닫기', null, closeQuiz));
      actions.querySelector('button').focus({ preventScroll: true });
    })();
  }

  // ---------- branching story (scenes, mini games and endings live in story.js) ----------
  const STORY = window.STORY;
  const STORY_KEY = 'gugu-story-found';
  let storyResult = null, storyBag = [], storyRun = 0;
  const storyFound = () => { try { return JSON.parse(localStorage.getItem(STORY_KEY)) || []; } catch (e) { return []; } };
  function storyIntro() {
    storyResult = null; storyBag = []; storyRun++;
    if (window.STORY_ART) STORY_ART.load();
    // instead of the usual picture on top: the twins argue, each in a speech bubble, sparks between them
    quizPose.hidden = true;
    const fight = make('div', 'story-fight');
    fight.setAttribute('role', 'img');
    fight.setAttribute('aria-label', STORY.intro.fight.map(f => `${CHARS[f.who].name}: ${f.line}`).join(' / '));
    STORY.intro.fight.forEach(f => {
      const side = make('div', 'side ' + f.who);
      side.append(make('div', 'say', f.line), make('div', 'mad', '💢'), poseImg(f.pose, 104) || make('div', 'em', '🙈'));
      fight.append(side);
    });
    fight.insertBefore(make('div', 'zap', '⚡'), fight.lastChild);
    setTimeout(() => SFX.play('puff'), 250);
    const made = storyMadeUp(), n = storyFound().filter(k => made.includes(k)).length, total = made.length;
    const actions = make('div', 'quiz-actions');
    actions.append(button(STORY.intro.start, 'primary', () => { SFX.play('page'); storyScene('start'); }));
    showQuizScreen([fight, make('h2', null, STORY.intro.title), make('p', 'story-text', STORY.intro.text),
      ...(n ? [make('div', 'quiz-hint', `${STORY.found} ${n} / ${total}`)] : []), actions]);
  }
  // the endings where the twins make up (kind 'best' / 'good'): only these go in the 찾은 결말 collection
  function storyMadeUp() { return Object.keys(STORY.endings).filter(k => STORY.endings[k].kind !== 'bad'); }
  function storySay(who, line) {
    const box = make('div', 'quiz-say story-say ' + who);
    box.append(make('b', null, who === 'dok' ? '구구독' : '구구덕'), document.createTextNode(line));
    return box;
  }
  function storyBagRow() {
    const row = make('div', 'story-bag', '🎒 ');
    if (!storyBag.length) row.append(make('span', 'none', '비어 있음'));
    storyBag.forEach(k => row.append(make('span', null, `${STORY.items[k].emoji} ${STORY.items[k].name}`)));
    return row;
  }
  function storyGo(to) { SFX.play('page'); storyScene(to); }
  function storyScene(id) {
    if (STORY.endings[id]) { storyEnd(id); return; }
    const sc = STORY.scenes[id];
    let gotNew = null;
    if (sc.get && !storyBag.includes(sc.get)) { storyBag.push(sc.get); gotNew = STORY.items[sc.get]; }
    drawQuizPose(sc.pose);
    const nodes = [storyBagRow(), make('p', 'story-text', sc.text)];
    if (gotNew) { nodes.push(make('div', 'story-got', `${gotNew.emoji} ${gotNew.name} 획득!`)); setTimeout(() => SFX.play('chance'), 150); }
    if (sc.line) nodes.push(storySay(sc.who || 'dok', sc.line));
    (sc.talk || []).forEach(([who, line]) => nodes.push(storySay(who, line)));
    if (sc.after) nodes.push(make('p', 'story-text', sc.after));
    if (sc.game) {
      const actions = make('div', 'quiz-actions');
      actions.append(button(`🎮 ${sc.game.title} 시작`, 'primary', () => storyGame(sc.game)));
      nodes.push(make('div', 'story-how', sc.game.how), actions);
    } else {
      const list = make('div', 'quiz-options');
      sc.choices.forEach(c => {
        const locked = c.need && !storyBag.includes(c.need);
        const b = button(locked ? `🔒 ${STORY.items[c.need].emoji} ${STORY.items[c.need].name} 필요` : c.text, locked ? 'locked' : null, locked ? null : () => storyGo(c.to));
        if (locked) b.disabled = true;
        list.append(b);
      });
      if (sc.choices.length > 1) nodes.push(make('div', 'quiz-q', '어떻게 할까?'));
      nodes.push(list);
    }
    showQuizScreen(nodes);
  }

  // mini games live in story-games.js: each gets its settings (g) and a small kit, and calls done(ok) at the end
  function storyGame(g) {
    const run = storyRun, alive = () => run === storyRun && !quizEl.hidden;
    let finished = false;
    const area = make('div', 'story-game');
    const done = ok => {
      if (finished || !alive()) return; finished = true;
      SFX.play(ok ? 'right' : 'lose');
      // on a drawn game the result is a small pill over the picture, so the scene stays visible
      const stageCv = area.querySelector('canvas');
      const msg = make('div', 'story-result ' + (ok ? 'ok' : 'no') + (stageCv ? ' pill' : ''), ok ? '성공! 🎉' : '실패…! 😵');
      if (stageCv) msg.style.top = (stageCv.offsetTop + 12) + 'px';
      area.append(msg);
      setTimeout(() => { if (alive()) storyGo(ok ? g.win : g.lose); }, stageCv ? 1700 : 1100);
    };
    // a crisp canvas of W×H game pixels; the picture at the top of the window steps aside for it
    const stage = (W, H) => {
      quizPose.hidden = true;
      const dpr = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas');
      cv.className = 'story-stage'; cv.style.aspectRatio = `${W} / ${H}`;
      cv.width = W * dpr; cv.height = H * dpr;
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      return { cv, c };
    };
    window.STORY_GAMES[g.type](g, { area, done, over: () => finished, alive, make, button, shuffle, pic, stage });
    showQuizScreen([make('div', 'quiz-q', g.title), make('div', 'story-how', g.how), area]);
    const first = area.querySelector('button:not([disabled])');
    if (first) first.focus({ preventScroll: true });
  }

  function storyEnd(id) {
    const end = STORY.endings[id], keys = storyMadeUp();
    const found = storyFound(), isNew = !found.includes(id);
    if (isNew) { found.push(id); try { localStorage.setItem(STORY_KEY, JSON.stringify(found)); } catch (e) {} }
    storyResult = end;
    const bad = end.kind === 'bad';
    SFX.play(bad ? 'lose' : end.kind === 'best' ? 'gold' : (isNew ? 'fanfare' : 'heart'));
    drawQuizPose(end.pose);
    // the collection holds only the endings where the twins make up
    const n = keys.filter(k => found.includes(k)).length;
    const grid = make('div', 'story-found');
    keys.forEach(k => {
      const got = found.includes(k), e = STORY.endings[k];
      const cell = make('span', (got ? (k === id ? 'now made' : 'made') : 'no'));
      cell.append(make('i', null, got ? e.emoji : '❔'), document.createTextNode(got ? e.name : '???'));
      grid.append(cell);
    });
    const actions = make('div', 'quiz-actions');
    actions.append(button(STORY.again, 'primary', storyIntro), button('다른 게임', null, gamesMenu), button('닫기', null, closeQuiz));
    showQuizScreen([
      make('div', 'quiz-label', (STORY.labels[end.kind] || '결말') + (isNew ? ' · 새로 발견!' : '')),
      make('div', 'story-end-emoji', end.emoji),
      make('h2', null, end.name),
      make('p', 'story-text', end.text),
      storySay(end.who || 'dok', end.line),
      make('div', 'quiz-label', `${STORY.found} ${n} / ${keys.length}`),
      grid,
      ...(n === keys.length ? [make('div', 'quiz-hint', STORY.allFound)] : []),
      actions,
    ]);
  }

  // ---------- game menu ----------
  function gamesMenu() {
    resetResults();
    drawQuizPose('duo-stand');
    const picks = make('div', 'game-picks');
    const pickBtn = (em, title, desc, go) => {
      const b = button('', 'game-pick', go);
      const txt = make('span');
      txt.append(make('b', null, title), make('small', null, desc));
      // em is an emoji, or a picture id; 🙈 stands in for a picture that has not loaded yet
      const img = IMGS[em] ? poseImg(em, 64) : null;
      const icon = make('span', 'em', IMGS[em] ? (img ? null : '🙈') : em);
      if (img) icon.append(img);
      b.append(icon, txt);
      return b;
    };
    picks.append(
      pickBtn('icon-dok-hearts', SHELF.intro.title, '책을 알맞은 분류 칸에 꽂아 보는 퀴즈', shelfIntro),
      pickBtn('icon-duk-shush', RIDDLE.intro.title, '질문해서 이야기 속 주인공을 맞혀라!', riddleIntro),
      pickBtn('duo-stand', STORY.intro.title, '책이 최고? 취향이 최고? 둘을 화해시켜라!', storyIntro),
    );
    showQuizScreen([make('h2', null, '구구독 구구덕 게임'), make('p', null, '어떤 게임을 해 볼까?'), picks]);
  }
  // the game window opens on the menu (🎮) or straight on one game (a book on the shelf, 구구독)
  function openGames(first = gamesMenu) {
    // someone who found the games already needs no invitation
    if (invite === 'later') invite = 'done';
    quizEl.hidden = false;
    first();
  }
  // forget the last results (so closing does not cheer twice) and stop anything still running
  function resetResults() {
    quizResult = null; shelfResult = null; riddleResult = null; bookResult = null; storyResult = null; receiptResult = null;
    bookSpin++; storyRun++; receiptSpin++;
  }
  function closeQuiz() {
    if (quizEl.hidden) return;
    quizEl.hidden = true;
    if (bookUsed && !lastBook) bookUsed = false;
    // the twin who hosted the game cheers the result in the scene too
    // with a name, the cheers call the visitor by it
    const you = visitor ? visitor.nameN : '너', hey = visitor ? visitor.call + ', ' : '';
    if (quizResult && isOut('duk')) say('duk', `${quizResult.emoji} ${quizResult.name}인 ${you}! 오늘 찾은 취향으로 다음 책도 골라 보자!`);
    if (shelfResult && isOut('dok')) say('dok', `${shelfResult.emoji} ${hey}${shelfScore ? shelfScore + '문제 맞혔어!' : '처음엔 다 어려워!'} 너는 ${shelfResult.name}! 다음에도 같이 정리하자!`);
    if (riddleResult && isOut('duk')) say('duk', `${riddleResult.emoji} ${hey}${riddleScore}점! ${riddleResult.name}! 다음엔 다른 주인공으로 또 하자~`);
    if (bookResult && isOut('dok')) say('dok', hey + fill(BOOKS.close, { title: bookResult.title }));
    if (storyResult && isOut('dok')) say('dok', storyResult.kind === 'bad' ? `${storyResult.emoji} ${hey}구구덕이랑 아직 화해 못 했어… 다른 길로 다시 가 볼래?` : `${storyResult.emoji} ${hey}「${storyResult.name}」! 구구덕이랑 화해했어. 고마워!`);
    if (receiptResult && isOut('duk')) say('duk', hey + fill(RECEIPT.close, { title: receiptResult.title }));
    resetResults(); dropReceiptPhoto();
    gameBtn.focus();
  }
  gameBtn.addEventListener('click', () => openGames());
  quizEl.querySelector('.quiz-close').addEventListener('click', closeQuiz);
  quizEl.addEventListener('click', e => { if (e.target === quizEl) closeQuiz(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !quizEl.hidden) closeQuiz(); });

  Promise.all(Object.keys(IMGS).map(id => IMGS[id].decode().then(() => { IMGS[id] = trim(IMGS[id]); }).catch(() => {})))
    .then(() => requestAnimationFrame(frame));
})();
