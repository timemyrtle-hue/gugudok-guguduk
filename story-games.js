// 구구독 구구덕의 책 속 대결: 미니게임 6가지
// story.js 의 장면에 game: { type: '…' } 으로 적으면 그 게임이 열려요. 그림은 story-art.js 에서 가져와요.
// 게임마다 g(story.js 에 적힌 그 게임의 설정)와 도구 묶음을 받아요.
//   area      게임 화면을 넣는 칸
//   done(ok)  게임이 끝났을 때 부르기 (true 이기면 / false 지면)
//   over()    이미 끝났는지  ·  alive()  게임 창이 아직 열려 있는지
//   make, button  화면 조각 만들기  ·  shuffle  섞기  ·  pic(id)  캐릭터 그림(아직 준비 전이면 null)
//   stage(W, H)   그림을 그릴 캔버스 { cv, c } (위쪽 캐릭터 그림은 비켜 줘요)
// 게임 설정 값(난이도 등)의 뜻은 story.js 맨 위 설명에 있어요.
window.STORY_GAMES = (() => {
  const ART = window.STORY_ART;

  // 취향 저격 책 추천: 상대의 취향을 보고 책 3권 중 딱 맞는 책 고르기
  function match(g, { area, done, over, make, button, shuffle }) {
    const card = make('div', 'story-taste');
    card.append(make('b', null, `${g.who}의 취향`));
    const chips = make('div', 'quiz-chips');
    g.likes.forEach(l => chips.append(make('span', null, '♥ ' + l)));
    card.append(chips);
    const list = make('div', 'quiz-options story-books');
    shuffle(g.books).forEach(bk => {
      const b = button(`${bk.emoji} 『${bk.title}』`, null, () => {
        if (over()) return;
        list.querySelectorAll('button').forEach(x => { x.disabled = true; });
        b.classList.add(bk.ok ? 'pick-ok' : 'pick-no');
        done(!!bk.ok);
      });
      list.append(b);
    });
    area.append(card, make('div', 'story-how', '구구덕이 추천할 책은?'), list);
  }

  // 탑을 받쳐라: 자꾸 기우는 책 탑을 연타로 밀어 받치며 구구덕이 받침대를 가져올 때까지 버티기
  function tower(g, { area, done, over, alive, make, button, pic, stage }) {
    // 탑을 받쳐라: the book tower keeps leaning; taps push it back. hold on until 구구덕 brings the bookend.
    const W = 320, H = 300, { cv, c } = stage(W, H);
    const COLORS = ['#b04a4a', '#3d6cae', '#4f9558', '#8459b3', '#c8873a', '#3b97a5', '#ad5d7d', '#5f66bd', '#a7853c', '#c26a4a'];
    const books = Array.from({ length: 13 }, (_, i) => ({ w: 58 + Math.random() * 30, h: 13 + Math.random() * 5, col: COLORS[i % COLORS.length], dx: (Math.random() - .5) * 8 }));
    books.forEach((b, i) => { b.img = ART.book(Math.round(b.w), Math.round(b.h), b.col, i + 3); });
    let room = null, pages = [];
    const BASE = [130, 262];
    let tilt = 0.15, started = false, t0 = 0, last = 0, lastTap = 0, push = 0, gust = 0, gustUntil = 0, nextGust = 0, fall = null, propAt = 0, taps = 0;
    const meter = make('div', 'story-meter'), mfill = make('span'); meter.append(mfill);
    const status = make('div', 'story-owl-say', '탑이 기울기 시작했어!');
    status.dataset.s = 'sleep';
    const stack = () => {
      // each book's centre, bending more toward the top
      let y = BASE[1];
      return books.map((b, i) => {
        const k = (i + 1) / books.length;
        y -= b.h;
        return { ...b, x: BASE[0] + b.dx + tilt * 95 * k * k + Math.sin(performance.now() / 180 + i) * tilt * 2, y, rot: tilt * 0.5 * k };
      });
    };
    const draw = now => {
      if (!room) room = ART.towerRoom(W, H, BASE);
      c.drawImage(room, 0, 0, W, H);
      // the bookend (once 구구덕 arrives)
      if (propAt) ART.put(c, 'bookend', BASE[0] + 58, BASE[1] + 2);
      // books
      const bs = fall ? fall.books : stack();
      if (!fall) { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(BASE[0] + tilt * 8, BASE[1] + 1, 48, 5, 0, 0, Math.PI * 2); c.fill(); }
      bs.forEach(b => {
        c.save(); c.translate(b.x, b.y); c.rotate(b.rot);
        c.drawImage(b.img, -b.w / 2 - 1, -b.h / 2 - 1, b.w + 2, b.h + 2);
        c.restore();
      });
      // 구구독 pushing on the leaning side
      const dok = pic('dok-books');
      if (dok && !fall) {
        const top = bs[5], hgt = 70, w = hgt * dok.width / dok.height;
        const shove = push > 0 ? -4 : 0, dx = top.x + top.w / 2 + w / 2 - 6;
        c.save(); c.translate(dx + shove, BASE[1] - 2); c.rotate(-0.12); c.scale(-1, 1);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, 0, 18, 4, 0, 0, Math.PI * 2); c.fill();
        c.drawImage(dok, -w / 2, -hgt, w, hgt); c.restore();
        if (taps && now - lastTap < 220) ART.bubble(c, Math.min(W - 30, dx), BASE[1] - 76, '영차!', '#8b3ff0', 13);
      }
      // 구구덕 running in with the bookend
      const duk = pic('duk-books');
      if (duk && started) {
        const k = propAt ? 1 : Math.min(1, (now - t0) / (g.time * 1000));
        const x = -30 + k * (BASE[0] - 46 + 30), hgt = 62, w = hgt * duk.width / duk.height;
        const hop = propAt ? 0 : Math.abs(Math.sin(now / 110)) * 5;
        if (!propAt) { c.save(); c.translate(x + 14, BASE[1] - hop - 40); c.rotate(-.5 + Math.sin(now / 110) * .06); ART.put(c, 'bookend', 0, 0, .42, .5, .5); c.restore(); }
        c.save(); c.translate(x, BASE[1] - hop);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, hop, 16, 4, 0, 0, Math.PI * 2); c.fill();
        c.drawImage(duk, -w / 2, -hgt, w, hgt); c.restore();
        ART.bubble(c, Math.max(62, x), BASE[1] - 72, propAt ? '받침대 도착!' : '받침대 가져갈게!', '#8b3ff0', 12);
      }
      // gust: swirling wind and loose pages
      if (now < gustUntil && !fall) {
        c.save(); c.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
          const yy = 56 + i * 36, xx = ((now / 2.6) + i * 80) % (W + 90) - 90;
          c.strokeStyle = 'rgba(225,238,255,.55)'; c.lineWidth = 2.4;
          c.beginPath(); c.moveTo(xx, yy); c.bezierCurveTo(xx + 20, yy - 10, xx + 40, yy + 8, xx + 62, yy - 2); c.stroke();
          c.lineWidth = 1.4; c.beginPath(); c.arc(xx + 66, yy - 8, 6, Math.PI * .8, Math.PI * 2.2); c.stroke();
        }
        c.font = "17px Jua, 'Malgun Gothic', sans-serif"; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(30,20,60,.6)'; c.strokeText('휘이잉~', 236, 38); c.fillStyle = '#dff1ff'; c.fillText('휘이잉~', 236, 38);
        c.restore();
      }
      pages.forEach(pg => { c.save(); c.translate(pg.x, pg.y); c.rotate(pg.r); ART.put(c, 'page', 0, 0, 1, .5, .5); c.restore(); });
      if (tilt > 0.75 && !fall && !propAt) { c.strokeStyle = `rgba(255,107,107,${.4 + .4 * Math.sin(now / 60)})`; c.lineWidth = 5; c.strokeRect(2, 2, W - 4, H - 4); }
    };
    const btn = button(g.button, 'story-mash', null);
    const loop = now => {
      if (!alive()) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (started && !over()) {
        if (now > nextGust) { gust = 0.25 + Math.random() * 0.2; gustUntil = now + 700; nextGust = now + 1600 + Math.random() * 1600; status.textContent = '바람이 분다! 더 세게!'; status.dataset.s = 'warn'; }
        const g2 = now < gustUntil ? gust : 0;
        tilt += (0.12 + tilt * 0.45 + g2) * dt;
        tilt = Math.max(0, tilt - push); push = 0;
        if (now >= gustUntil && status.dataset.s === 'warn') { status.textContent = tilt > .6 ? '위험해! 연타 연타!' : '좋아, 버텨!'; status.dataset.s = tilt > .6 ? 'look' : 'sleep'; }
        if (tilt >= 1) {
          fall = { books: stack().map(b => ({ ...b, vx: 40 + Math.random() * 120, vy: -60 - Math.random() * 120, vr: (Math.random() - .3) * 6 })) };
          status.textContent = '와르르르!'; status.dataset.s = 'look'; btn.disabled = true; done(false);
        } else if (now - t0 >= g.time * 1000) {
          propAt = now; tilt = Math.min(tilt, 0.25); status.textContent = '구구덕이 받침대를 끼웠다!'; status.dataset.s = 'sleep'; btn.disabled = true; done(true);
        }
      }
      if (started && now < gustUntil && !fall && Math.random() < .14) pages.push({ x: -12, y: 30 + Math.random() * 160, vx: 170 + Math.random() * 90, vy: (Math.random() - .5) * 40, r: Math.random() * 6, vr: (Math.random() - .5) * 9 });
      pages.forEach(pg => { pg.x += pg.vx * dt; pg.y += (pg.vy + Math.sin(pg.x / 30) * 30) * dt; pg.r += pg.vr * dt; });
      pages = pages.filter(pg => pg.x < W + 20);
      if (fall) fall.books.forEach(b => { b.vy += 520 * dt; b.x += b.vx * dt; b.y = Math.min(BASE[1] - b.h / 2, b.y + b.vy * dt); b.rot += b.vr * dt; if (b.y >= BASE[1] - b.h / 2) { b.vx *= .9; b.vr *= .8; } });
      mfill.style.width = Math.min(100, tilt * 100) + '%';
      mfill.style.background = tilt > .75 ? '#ff6b6b' : tilt > .45 ? '#ffd98f' : '#8fe3a8';
      draw(now);
      requestAnimationFrame(loop);
    };
    const hit = e => {
      e.preventDefault();
      if (over()) return;
      if (!started) { started = true; t0 = performance.now(); nextGust = t0 + 1500; status.textContent = '좋아, 버텨!'; }
      push += g.power || 0.075; taps++; lastTap = performance.now();
      btn.classList.remove('hit'); void btn.offsetWidth; btn.classList.add('hit');
      if (taps % 3 === 0) SFX.play('tick');
    };
    btn.addEventListener('pointerdown', hit); cv.addEventListener('pointerdown', hit);
    btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') hit(e); });
    const lab = make('div', 'story-meter-label', '기울기');
    area.append(status, cv, lab, meter, btn, make('div', 'quiz-hint', `처음 누르면 시작! ${g.time}초 버티면 구구덕이 도착해.`));
    requestAnimationFrame(t => { last = t; loop(t); });
  }

  // 진짜 명작을 찾아라: 📜 든 상자를 눈으로 따라가서 고르기 (단계마다 상자가 늘고 빨라져요, 돋보기 힌트 1번)
  function chests(g, { area, done, over, alive, make, button, shuffle, pic, stage }) {
    // 진짜 명작을 찾아라: watch the real classic go into a chest, follow it through the shuffle, pick it.
    // stages get harder (more chests, faster). 구구독's magnifier can be used once to make the right chest glint.
    const W = 320, H = 280, { cv, c } = stage(W, H);
    const FLOOR = 214, DECOYS = g.decoys || ['🧾', '🕸️', '🧦'];
    const ITEM = { '📜': 'masterpiece', '🧾': 'receipt', '🕸️': 'web', '🧦': 'sock' };
    let room = null;
    const motes = Array.from({ length: 24 }, () => ({ x: W / 2 - 70 + Math.random() * 150, y: Math.random() * FLOOR, s: .6 + Math.random() * 1.3, v: 4 + Math.random() * 9, p: Math.random() * 6 }));
    let round = 0, n = 3, chests = [], phase = 'idle', phaseAt = 0, swaps = [], swapI = 0, prize = 0, picked = -1, glintUntil = 0, lens = true, dust = [];
    const status = make('div', 'story-owl-say'); status.dataset.s = 'sleep';
    const stageLab = make('div', 'story-stage-lab');
    const lensBtn = button('🔍 탐험가의 돋보기 (1번)', 'story-lens', () => {
      if (!lens || phase !== 'shuffle') return;
      lens = false; lensBtn.disabled = true; lensBtn.textContent = '🔍 돋보기 사용 완료';
      glintUntil = performance.now() + 900; SFX.play('chance');
    });
    lensBtn.disabled = true;
    const slotX = i => W / (n + 1) * (i + 1);
    const setup = () => {
      const st = g.stages[round]; n = st.n;
      prize = Math.floor(Math.random() * n);
      const decoys = shuffle(DECOYS);
      chests = Array.from({ length: n }, (_, i) => ({ slot: i, x: slotX(i), y: FLOOR, lid: 1, item: i === prize ? '📜' : decoys[i % decoys.length] }));
      swaps = [];
      for (let k = 0; k < st.swaps; k++) { const a = Math.floor(Math.random() * n); let b = Math.floor(Math.random() * (n - 1)); if (b >= a) b++; swaps.push([a, b]); }
      swapI = 0; picked = -1;
      stageLab.textContent = `${round + 1}단계 / ${g.stages.length}단계 · 상자 ${n}개`;
      status.textContent = round ? '이번엔 더 빨라! 눈 크게 떠!' : '📜 진짜 명작이 들어가는 상자를 잘 봐!'; status.dataset.s = round ? 'warn' : 'sleep';
      phase = 'show'; phaseAt = performance.now();
    };
    const chestAt = s => chests.find(ch => ch.slot === s);
    const puff = (x, y) => { for (let i = 0; i < 6; i++) dust.push({ x, y, vx: (Math.random() - .5) * 40, vy: -10 - Math.random() * 20, t: performance.now() }); };
    const drawChest = (ch, now, glint) => {
      const { x, y } = ch, sc = n > 3 ? 0.82 : 1, open = 1 - ch.lid, real = ch.item === '📜';
      c.save(); c.translate(x, y); c.scale(sc, sc);
      c.fillStyle = 'rgba(0,0,0,.38)'; c.beginPath(); c.ellipse(0, 1, 33, 6, 0, 0, Math.PI * 2); c.fill();
      if (glint) ART.glow(c, 0, -28, 58, 'rgba(255,226,140,A)', .4 + .3 * Math.sin(now / 70));
      // the open lid stands behind the box
      if (open > .5) { const k = (open - .5) * 2; ART.drawBox(c, 'chestLidOpen', -30, -40 - 24 * k + 3, 60, 24 * k); }
      // what's inside rises out
      if (open > .02) {
        c.fillStyle = '#1e1008'; ART.rr(c, -26, -43, 52, 8, 3); c.fill();
        if (real) ART.glow(c, 0, -50, 46 * open, 'rgba(255,220,130,A)', .8 * open);
        c.save(); c.globalAlpha = Math.min(1, open * 1.4);
        ART.put(c, ITEM[ch.item] || 'receipt', 0, -36 - open * 22, 1, .5, 1);
        c.restore();
        if (real && open > .6) for (let i = 0; i < 4; i++) { const a = now / 500 + i * 1.57; ART.sparkle(c, Math.cos(a) * 24, -64 + Math.sin(a) * 12, 3.2, .95); }
      }
      ART.put(c, 'chestBase', 0, 0, 1, .5, 1);
      if (open < .5) { const k = 1 - open * 2; ART.drawBox(c, 'chestLid', -30, -40 - 22 * k + 3, 60, 22 * k); }
      if (glint) for (let i = 0; i < 3; i++) { const t = (now / 600 + i / 3) % 1; ART.sparkle(c, -22 + i * 22, -52 - t * 20, 3.6, 1 - t); }
      if (picked === ch.slot && phase === 'reveal') { c.strokeStyle = real ? '#8fe3a8' : '#ff6b6b'; c.lineWidth = 3.5; ART.rr(c, -37, -82, 74, 88, 14); c.stroke(); }
      c.restore();
    };
    const draw = now => {
      if (!room) room = ART.dustyRoom(W, H, FLOOR);
      c.drawImage(room, 0, 0, W, H);
      // light from a high window, with dust floating in it
      c.save(); c.globalCompositeOperation = 'lighter';
      const ls = c.createLinearGradient(0, 0, 0, FLOOR + 24); ls.addColorStop(0, 'rgba(255,236,190,.22)'); ls.addColorStop(1, 'rgba(255,236,190,0)');
      c.fillStyle = ls; c.beginPath(); c.moveTo(W / 2 - 26, 0); c.lineTo(W / 2 + 34, 0); c.lineTo(W / 2 + 134, FLOOR + 24); c.lineTo(W / 2 - 104, FLOOR + 24); c.fill();
      motes.forEach(m => { const yy = (m.y + now / 1000 * m.v) % FLOOR, xx = m.x + Math.sin(now / 900 + m.p) * 6 + yy * .18; c.fillStyle = `rgba(255,240,200,${.3 + .25 * Math.sin(now / 400 + m.p)})`; c.beginPath(); c.arc(xx, yy, m.s, 0, Math.PI * 2); c.fill(); });
      c.restore();
      // chests: the moving ones last so they pass in front
      const glint = now < glintUntil;
      chests.slice().sort((a, b) => (a.front || 0) - (b.front || 0)).forEach(ch => drawChest(ch, now, glint && ch.item === '📜'));
      // dust
      dust = dust.filter(d => now - d.t < 600);
      dust.forEach(d => { const k = (now - d.t) / 600; c.fillStyle = `rgba(220,210,190,${.5 * (1 - k)})`; c.beginPath(); c.arc(d.x + d.vx * k, d.y + d.vy * k, 3 + k * 4, 0, Math.PI * 2); c.fill(); });
      // 구구독 watching with his magnifier
      const dok = pic('dok-wave');
      if (dok) {
        const hgt = 56, w = hgt * dok.width / dok.height;
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(8 + w / 2, H - 5, w * .4, 4, 0, 0, Math.PI * 2); c.fill();
        c.drawImage(dok, 8, H - hgt - 4, w, hgt);
        ART.put(c, 'magnifier', 12 + w, H - hgt + 14 + Math.sin(now / 300) * 3, 1, .5, .5);
      }
      if (phase === 'pick') ART.bubble(c, W / 2 + 40, H - 14, '👆 상자를 눌러 골라!', '#8a5a00', 13);
    };
    const loop = now => {
      if (!alive()) return;
      const st = g.stages[round];
      if (phase === 'show') {
        const k = (now - phaseAt) / 1600;
        chests.forEach(ch => { ch.lid = ch.item === '📜' ? Math.max(0, 1 - Math.min(1, k * 3)) * 1 + (k > .75 ? Math.min(1, (k - .75) * 4) : 0) : 1; });
        if (k >= 1) { chests.forEach(ch => { ch.lid = 1; }); phase = 'shuffle'; phaseAt = now; status.textContent = '빙글빙글… 따라가!'; lensBtn.disabled = !lens; puff(W / 2, FLOOR); }
      } else if (phase === 'shuffle') {
        const k = Math.min(1, (now - phaseAt) / st.speed), [a, b] = swaps[swapI];
        const A = chestAt(a), B = chestAt(b), xa = slotX(a), xb = slotX(b), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        A.x = xa + (xb - xa) * e; A.y = FLOOR - Math.sin(Math.PI * e) * 34; A.front = 1;
        B.x = xb + (xa - xb) * e; B.y = FLOOR + Math.sin(Math.PI * e) * 6; B.front = 0;
        if (k >= 1) {
          A.slot = b; B.slot = a; A.x = xb; B.x = xa; A.y = B.y = FLOOR; A.front = B.front = 0;
          puff(xb, FLOOR); puff(xa, FLOOR); SFX.play('tick');
          swapI++; phaseAt = now;
          if (swapI >= swaps.length) { phase = 'pick'; lensBtn.disabled = true; status.textContent = '진짜 명작은 어디에?'; status.dataset.s = 'sleep'; }
        }
      } else if (phase === 'reveal') {
        const k = Math.min(1, (now - phaseAt) / 500);
        chests.forEach(ch => { if (ch.slot === picked || k > .6) ch.lid = Math.max(0, 1 - k * 1.6); });
      }
      draw(now);
      requestAnimationFrame(loop);
    };
    cv.addEventListener('pointerdown', e => {
      if (phase !== 'pick' || over()) return;
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
      const ch = chests.find(ch => Math.abs(ch.x - x) < (n > 3 ? 28 : 34) && y > FLOOR - 70 && y < FLOOR + 14);
      if (!ch) return;
      choose(ch);
    });
    const choose = ch => {
      picked = ch.slot; phase = 'reveal'; phaseAt = performance.now();
      const ok = ch.item === '📜';
      if (!ok) { status.textContent = '앗, 그건 가짜야!'; status.dataset.s = 'look'; done(false); return; }
      SFX.play('right');
      if (round + 1 < g.stages.length) {
        status.textContent = '찾았다! 그런데 상자가 또 움직인다…'; status.dataset.s = 'sleep';
        setTimeout(() => { if (!alive() || over()) return; round++; setup(); }, 1500);
      } else { status.textContent = '진짜 명작 발견!'; done(true); }
    };
    // keyboard: number keys pick a chest (1 = leftmost)
    cv.tabIndex = 0; cv.setAttribute('role', 'group'); cv.setAttribute('aria-label', '상자들');
    cv.addEventListener('keydown', e => { const i = +e.key - 1; if (phase === 'pick' && i >= 0 && i < n) choose(chestAt(i)); });
    area.append(stageLab, status, cv, lensBtn, make('div', 'quiz-hint', '돋보기는 상자가 섞이는 동안 딱 한 번! 진짜 명작 상자가 반짝여.'));
    setTimeout(() => { if (alive()) setup(); }, 300);
    requestAnimationFrame(loop);
  }

  // 구름 고리 통과: 꾹 누르면 위로, 떼면 아래로 날며 구름 고리 통과하기 (먹구름은 피하기)
  function flight(g, { area, done, over, alive, make, pic, stage }) {
    // 구름 고리 통과: fly the little dragon (with 구구독 and 구구덕 on its back) through cloud rings.
    // hold to climb, let go to glide down. thunder clouds cost a ring.
    const W = 320, H = 280, { cv, c } = stage(W, H);
    const DX = 92, SPEED = g.speed || 115;
    let y = H / 2, vy = 0, holding = false, started = false, last = 0, dist = 0, spawned = 0, passed = 0, missed = 0, nextAt = 0, prevY = H / 2, hitUntil = 0, flashUntil = 0;
    const rings = [], storms = [], sparks = [];
    const clouds = Array.from({ length: 6 }, (_, i) => ({ x: Math.random() * W, y: 18 + Math.random() * (H - 130), s: .5 + Math.random() * .5, l: i % 2 }));
    let sea = null, town = null, ringN = null, ringG = null;
    const lerpC = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
    const stars = Array.from({ length: 30 }, () => [Math.random() * W, Math.random() * H * .6, Math.random()]);
    const marks = make('div', 'story-marks');
    const paint = () => { marks.textContent = Array.from({ length: g.rings }, (_, i) => i < passed ? '🟡' : i < passed + missed ? '❌' : '⚪').join(''); };
    paint();
    const status = make('div', 'story-owl-say', `고리 ${g.rings}개 중 ${g.need}개를 통과하자!`); status.dataset.s = 'sleep';
    const drawRing = (r, half) => {
      // half: 'back' or 'front' so the dragon flies through it
      const sp = r.done === 'ok' ? ringG : ringN;
      c.save(); if (r.done === 'no') c.globalAlpha = .4;
      c.drawImage(sp[half], r.x - sp.w / 2, r.y - sp.h / 2, sp.w, sp.h);
      c.restore();
    };
    const drawDragon = now => {
      const per = holding ? 75 : 150, flap = Math.sin(now / per), flap2 = Math.sin(now / per + .7);
      const tilt = Math.max(-0.4, Math.min(0.4, vy / 500)), hurt = now < hitUntil;
      c.save(); c.translate(DX + (hurt ? Math.sin(now / 20) * 3 : 0), y); c.rotate(tilt);
      c.save(); c.translate(-3, -7); c.scale(1, .15 + .85 * flap2); ART.put(c, hurt ? 'dragonWingHurt' : 'dragonWingBack', 0, 0, .9, .1, .93); c.restore();
      ART.put(c, hurt ? 'dragonBodyHurt' : 'dragonBody', 0, 0, 1, .5, .5);
      c.save(); c.translate(4, -6); c.scale(1, .15 + .85 * flap); ART.put(c, hurt ? 'dragonWingHurt' : 'dragonWing', 0, 0, 1, .1, .93); c.restore();
      // riders
      const dok = pic('dok-wave');
      const duk = pic('duk-wave');
      [[duk, -8, -6], [dok, 6, -5]].forEach(([im, ox, oy]) => { if (!im) return; const hh = 29, ww = hh * im.width / im.height; c.drawImage(im, ox - ww / 2, oy - hh + 2, ww, hh); });
      c.restore();
    };
    const draw = now => {
      if (!sea) { sea = ART.cloudSea(W * 2, 60); town = ART.bookTown(W * 2, 90); ringN = ART.ring(14, g.ringSize || 34, 'white'); ringG = ART.ring(14, g.ringSize || 34, 'gold'); }
      // sunset sky turning to night as we fly
      const k = Math.min(1, dist / (g.rings * 200));
      const sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, lerpC([75, 63, 150], [18, 15, 51], k)); sky.addColorStop(.58, lerpC([212, 110, 168], [42, 35, 102], k)); sky.addColorStop(1, lerpC([255, 191, 128], [74, 59, 128], k));
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      // the setting sun, then stars and the moon
      if (k < 1) { const sy = 168 + k * 120; ART.glow(c, 246, sy, 80, 'rgba(255,196,120,A)', .65 * (1 - k)); c.fillStyle = `rgba(255,228,170,${1 - k})`; c.beginPath(); c.arc(246, sy, 20, 0, Math.PI * 2); c.fill(); }
      stars.forEach(([x, yy, t], i) => { const a = k * (.4 + .6 * Math.abs(Math.sin(now / 500 + t * 9))); if (i % 6 === 0) ART.sparkle(c, x, yy, 2.6, a); else { c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(x, yy, 1.6, 1.6); } });
      c.save(); c.globalAlpha = k; ART.put(c, 'moon', 262, 74 - k * 26, 1, .5, .5); c.restore();
      // the book town far away
      const tw = W * 2, to = (dist * .12) % tw;
      c.save(); c.globalAlpha = .85; c.drawImage(town, -to, H - 120, tw, 90); c.drawImage(town, -to + tw, H - 120, tw, 90); c.restore();
      // clouds
      clouds.forEach(cl => { c.save(); c.globalAlpha = cl.l ? .45 : .85; ART.put(c, cl.l ? 'cloudB' : 'cloudA', cl.x, cl.y, cl.s, .5, .5); c.restore(); });
      // storms
      storms.forEach(st => {
        ART.put(c, 'storm', st.x, st.y, 1, .5, .5);
        if ((now / 120 | 0) % 5 === 0 || st.hit) ART.bolt(c, st.x - 2, st.y + 12, 1);
      });
      rings.forEach(r => drawRing(r, 'back'));
      drawDragon(now);
      rings.forEach(r => drawRing(r, 'front'));
      sparks.forEach(sp => { const t = (now - sp.t) / 600; ART.sparkle(c, sp.x + sp.vx * t, sp.y + sp.vy * t, 4.5, 1 - t, '#fff2b0'); });
      // the sea of clouds below
      const so = (dist * .6) % tw;
      c.drawImage(sea, -so, H - 40, tw, 60); c.drawImage(sea, -so + tw, H - 40, tw, 60);
      if (!started) { c.fillStyle = 'rgba(20,10,40,.4)'; c.fillRect(0, 0, W, H); c.font = "20px Jua, 'Malgun Gothic', sans-serif"; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('👆 꾹 누르면 위로, 떼면 아래로!', W / 2, H / 2 + 40); c.font = "15px Jua, 'Malgun Gothic', sans-serif"; c.fillText('누르면 출발!', W / 2, H / 2 + 66); }
      if (now < flashUntil) { c.fillStyle = 'rgba(255,240,150,.3)'; c.fillRect(0, 0, W, H); }
    };
    const loop = now => {
      if (!alive()) return;
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      if (started && !over()) {
        vy += (holding ? -400 : 300) * dt; vy = Math.max(-170, Math.min(170, vy));
        y += vy * dt;
        if (y < 24) { y = 24; vy = 0; } if (y > H - 50) { y = H - 50; vy = Math.min(vy, 0); }
        dist += SPEED * dt;
        clouds.forEach(cl => { cl.x -= SPEED * dt * (cl.l ? .25 : .5); if (cl.x < -60) { cl.x = W + 60; cl.y = 18 + Math.random() * (H - 130); } });
        if (spawned < g.rings && now >= nextAt) {
          const ny = Math.max(64, Math.min(H - 70, prevY + (Math.random() * 2 - 1) * 70));
          rings.push({ x: W + 30, y: ny, r: g.ringSize || 34 }); prevY = ny; spawned++;
          // sometimes a thunder cloud between rings
          if (spawned > 1 && spawned < g.rings && Math.random() < (g.storms || .55)) storms.push({ x: W + 30 + SPEED * 0.75, y: ny < H / 2 ? ny + 70 + Math.random() * 30 : ny - 70 - Math.random() * 30 });
          nextAt = now + (g.gap || 1500);
        }
        rings.forEach(r => {
          r.x -= SPEED * dt;
          if (!r.done && r.x <= DX) {
            if (Math.abs(y - r.y) < r.r) { r.done = 'ok'; passed++; SFX.play('yes'); flashUntil = now + 120; for (let i = 0; i < 6; i++) sparks.push({ x: r.x, y: r.y, vx: (Math.random() - .5) * 80, vy: (Math.random() - .5) * 80, e: '✨', t: now }); }
            else { r.done = 'no'; missed++; SFX.play('no'); hitUntil = now + 400; }
            paint();
          }
        });
        storms.forEach(st => {
          st.x -= SPEED * dt;
          if (!st.hit && Math.abs(st.x - DX) < 26 && Math.abs(st.y - y) < 26) { st.hit = 1; missed++; hitUntil = now + 600; SFX.play('wrong'); status.textContent = '⚡ 찌릿! 먹구름에 부딪혔다!'; status.dataset.s = 'look'; paint(); setTimeout(() => { if (!over()) { status.textContent = '조심조심!'; status.dataset.s = 'sleep'; } }, 900); }
        });
        for (let i = rings.length - 1; i >= 0; i--) if (rings[i].x < -40) rings.splice(i, 1);
        for (let i = storms.length - 1; i >= 0; i--) if (storms[i].x < -60) storms.splice(i, 1);
        for (let i = sparks.length - 1; i >= 0; i--) if (now - sparks[i].t > 600) sparks.splice(i, 1);
        if (passed >= g.need) { status.textContent = '구름 고리 통과! 시장 너머로 날아간다!'; status.dataset.s = 'sleep'; done(true); }
        else if (missed > g.rings - g.need) { status.textContent = '앗, 너무 많이 놓쳤어!'; status.dataset.s = 'look'; done(false); }
      } else if (!started) { y = H / 2 + Math.sin(now / 400) * 6; }
      draw(now);
      requestAnimationFrame(loop);
    };
    const down = e => { e.preventDefault(); if (over()) return; holding = true; if (!started) { started = true; nextAt = performance.now() + 600; } };
    const up = () => { holding = false; };
    cv.addEventListener('pointerdown', down);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => cv.addEventListener(t, up));
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.tabIndex = 0; cv.setAttribute('aria-label', '꾹 누르면 위로, 떼면 아래로 나는 용');
    cv.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') && !e.repeat) down(e); });
    cv.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') up(); });
    area.append(status, marks, cv, make('div', 'quiz-hint', `🟡 고리 ${g.need}개 통과하면 성공! ⚡ 먹구름에 부딪히면 고리 하나를 잃어.`));
    requestAnimationFrame(t => { last = t; loop(t); });
    setTimeout(() => { try { cv.focus({ preventScroll: true }); } catch (e) {} }, 50);
  }

  // 무궁화 꽃이 피었습니다: 올빼미 사서가 졸 때만 꾹 눌러 계단 오르기 (촛불 시간 제한, 가짜로 깨는 척)
  function freeze(g, { area, done, over, alive, make, button, pic, stage }) {
    // 무궁화 꽃이 피었습니다: climb the spiral stairs of the tower while the owl sleeps.
    // hold to climb; when the owl opens its eyes its lamp sweeps the stairs: let go!
    const W = 320, H = 300, { cv, c } = stage(W, H);
    const limit = g.limit || 14;
    // the stair path: zig-zag flights from bottom-left up to the owl's desk
    const P = [[34, 272], [262, 236], [58, 182], [258, 132], [96, 84]];
    const segLen = P.slice(1).map((q, i) => Math.hypot(q[0] - P[i][0], q[1] - P[i][1]));
    const total = segLen.reduce((x, y) => x + y, 0);
    const at = t => {
      let d = t * total;
      for (let i = 0; i < segLen.length; i++) {
        if (d <= segLen[i] || i === segLen.length - 1) { const k = Math.min(1, d / segLen[i]); return [P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k, P[i + 1][0] < P[i][0]]; }
        d -= segLen[i];
      }
    };
    const DESK = [216, 58], LAMP = [247, 62], LECTERN = [54, 92];
    let bg = null;
    let prog = 0, holding = false, state = 'sleep', until = 0, lookAt = 0, stateAt = 0, started = false, t0 = 0, last = 0, caught = 0, steps = [];
    const msg = make('div', 'story-owl-say', g.safe || '쿨… 쿨…');
    const setState = st => {
      const now = performance.now();
      state = st; stateAt = now;
      if (st === 'sleep') { msg.textContent = g.safe || '쿨… 쿨…'; msg.dataset.s = 'sleep'; until = now + 1000 + Math.random() * 1700; }
      if (st === 'warn') { msg.textContent = g.warn || '…음?'; msg.dataset.s = 'warn'; until = now + 520; SFX.play('tick'); }
      if (st === 'fake') { msg.textContent = '…아함, 기분 탓인가.'; msg.dataset.s = 'sleep'; until = now + 700; }
      if (st === 'look') { msg.textContent = g.look || '👀 거기 누구냐!'; msg.dataset.s = 'look'; lookAt = now; until = now + 1000 + Math.random() * 800; SFX.play('no'); }
    };
    const next = () => {
      if (state === 'sleep') setState('warn');
      else if (state === 'warn') setState(Math.random() < 0.3 ? 'fake' : 'look');
      else setState('sleep');
    };
    // --- drawing ---
    const draw = now => {
      if (!bg) bg = ART.towerWall(W, H, P, { window: [128, 12, 38, 50] });
      c.drawImage(bg, 0, 0, W, H);
      const look = state === 'look', warn = state === 'warn';
      // the reading nook at the top: a glowing book on a lectern
      const pulse = .5 + .5 * Math.sin(now / 400);
      ART.glow(c, LECTERN[0], LECTERN[1] - 32, 50, 'rgba(255,214,130,A)', .22 + pulse * .15);
      ART.put(c, 'lectern', LECTERN[0], LECTERN[1]);
      for (let i = 0; i < 3; i++) { const t = (now / 1000 + i / 3) % 1; ART.sparkle(c, LECTERN[0] - 16 + i * 16, LECTERN[1] - 48 - t * 22, 2.4 + i % 2, 1 - t); }
      // the lamp light sweeping the stairs while the owl is looking
      if (look) {
        const sw = Math.sin((now - lookAt) / 260) * 0.5, ang = Math.PI * 0.7 + sw, spread = 0.36, ox = LAMP[0] - 2, oy = LAMP[1] - 20;
        c.save(); c.globalCompositeOperation = 'lighter';
        const gr = c.createRadialGradient(ox, oy, 6, ox, oy, 330);
        gr.addColorStop(0, 'rgba(255,226,140,.5)'); gr.addColorStop(1, 'rgba(255,226,140,0)');
        c.fillStyle = gr; c.beginPath(); c.moveTo(ox, oy); c.arc(ox, oy, 330, ang - spread, ang + spread); c.closePath(); c.fill();
        c.restore();
      }
      // footprints
      steps = steps.filter(f => now - f.t < 1100);
      steps.forEach(f => ART.paw(c, f.x, f.y, .8 * (1 - (now - f.t) / 1100)));
      // the owl librarian behind the desk
      const owl = look ? 'owlFront' : warn ? 'owlPeek' : 'owlBack';
      const pop = 1 + .14 * Math.max(0, 1 - (now - stateAt) / 200);
      const bob = state === 'sleep' || state === 'fake' ? Math.sin(now / 500) * 1.5 : warn ? Math.sin(now / 40) * .8 : 0;
      ART.put(c, owl, DESK[0], DESK[1] + 24 + bob, 1.2 * pop);
      ART.put(c, 'desk', DESK[0], DESK[1], 1, .5, 0);
      ART.put(c, 'deskBooks', DESK[0] - 24, DESK[1] + 3);
      ART.glow(c, LAMP[0], LAMP[1] - 16, look ? 44 : 22, 'rgba(255,230,150,A)', look ? .65 : .35);
      ART.put(c, 'lamp', LAMP[0], LAMP[1] + 1);
      // Zzz / ? / !
      const bx = DESK[0] - 40, by = DESK[1] - 26;
      if (state === 'sleep' || state === 'fake') {
        const k = (now / 1100) % 1;
        c.save(); c.globalAlpha = 1 - k; c.textAlign = 'center'; c.fillStyle = '#efe6ff';
        c.font = "14px Jua, 'Malgun Gothic', sans-serif"; c.fillText('z', DESK[0] + 34 + k * 8, DESK[1] - 18 - k * 10);
        c.font = "19px Jua, 'Malgun Gothic', sans-serif"; c.fillText('Z', DESK[0] + 46 + k * 6, DESK[1] - 30 - k * 12);
        c.restore();
      }
      if (warn) ART.bubble(c, bx, by, '?', '#c98a00', 17);
      if (look) ART.bubble(c, bx, by, '!', '#e0565b', 18);
      // 구구독 tiptoeing up the stairs
      const [px, py, left] = at(prog / 100);
      const img = pic('dok-shush');
      const hop = holding && !caught ? Math.abs(Math.sin(now / 90)) * 4 : 0;
      const shake = caught ? Math.sin(now / 25) * 3 : 0;
      if (img) {
        const h = 50, w = h * img.width / img.height;
        c.save(); c.translate(px + shake, py - hop);
        if (left) c.scale(-1, 1);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, 6, 13, 4, 0, 0, Math.PI * 2); c.fill();
        c.drawImage(img, -w / 2, -h + 6, w, h);
        c.restore();
      }
      if (caught) ART.bubble(c, px, py - 48, '들켰다!', '#e0565b', 14);
      else if (look && !holding) ART.bubble(c, px, py - 48, '얼음!', '#1f9d55', 13);
      // candle clock
      ART.candle(c, 18, 78, started ? Math.max(0, 1 - (now - t0) / (limit * 1000)) : 1, now);
      if (look) { c.strokeStyle = 'rgba(255,107,107,.65)'; c.lineWidth = 4; c.strokeRect(2, 2, W - 4, H - 4); }
    };
    const btn = button(g.button, 'story-mash story-hold', null);
    const loop = now => {
      if (!alive()) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!over()) {
        if (started && now >= until) next();
        if (started && now - t0 > limit * 1000) { msg.textContent = '🕯️ 촛불이 다 탔어! 올빼미가 깼다!'; msg.dataset.s = 'look'; btn.disabled = true; done(false); }
        else if (holding) {
          if (state === 'look' && now - lookAt > 160) { caught = now; btn.disabled = true; done(false); }
          else {
            const before = prog;
            prog = Math.min(100, prog + dt * 100 / g.time);
            if (Math.floor(prog / 6) !== Math.floor(before / 6)) { const [fx, fy] = at(prog / 100); steps.push({ x: fx, y: fy + 6, t: now }); }
            if (prog >= 100) { btn.disabled = true; msg.textContent = '도착! 올빼미는 아무것도 몰라~'; msg.dataset.s = 'sleep'; done(true); }
          }
        }
      }
      draw(now);
      requestAnimationFrame(loop);
    };
    const down = e => { e.preventDefault(); if (over()) return; holding = true; btn.classList.add('hit'); if (!started) { started = true; t0 = performance.now(); setState('sleep'); } };
    const up = () => { holding = false; btn.classList.remove('hit'); };
    [btn, cv].forEach(el => {
      el.addEventListener('pointerdown', down);
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => el.addEventListener(t, up));
      el.addEventListener('contextmenu', e => e.preventDefault());
    });
    btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) down(e); });
    btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') up(); });
    msg.dataset.s = 'sleep';
    area.append(msg, cv, btn, make('div', 'quiz-hint', `🕯️ 촛불(${limit}초)이 다 타기 전에 올라가! 가짜로 깨는 척도 하니까 조심!`));
    requestAnimationFrame(t => { last = t; loop(t); });
  }

  // 취향 책 잡기: 떠오르는 책 방울 중 취향에 맞는 책만 톡톡 잡기
  function catchBooks(g, { area, done, over, alive, make, button }) {
    const card = make('div', 'story-taste');
    card.append(make('b', null, `${g.who}의 취향`));
    const chips = make('div', 'quiz-chips');
    g.likes.forEach(l => chips.append(make('span', null, '♥ ' + l)));
    card.append(chips);
    let got = 0, miss = 0, t0 = 0, spawnAt = 0, started = false;
    const score = make('div', 'story-catch-score');
    const paint = () => { score.textContent = `📚 ${got} / ${g.goal}   ${'💥'.repeat(miss)}${'·'.repeat(Math.max(0, g.misses - miss))}`; };
    const bar = make('div', 'quiz-bar story-time'), fill = make('span'); bar.append(fill); fill.style.width = '100%';
    const sea = make('div', 'story-sea');
    const startBtn = button('🫧 시작!', 'story-mash', null);
    const bubbles = new Set();
    const spawn = () => {
      const good = Math.random() < 0.6, pool = good ? g.good : g.bad;
      const b = button(pool[Math.floor(Math.random() * pool.length)], 'story-bubble ' + (good ? 'g' : 'b'), null);
      b.style.left = (4 + Math.random() * 52) + '%';
      b.dataset.t = performance.now(); b.dataset.d = 3600 + Math.random() * 1400;
      b.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (over() || b.dataset.hit) return;
        b.dataset.hit = 1; b.classList.add(good ? 'ok' : 'no');
        if (good) { got++; SFX.play('yes'); } else { miss++; SFX.play('no'); }
        paint();
        setTimeout(() => { b.remove(); bubbles.delete(b); }, 260);
        if (got >= g.goal) done(true);
        else if (miss > g.misses) done(false);
      });
      sea.append(b); bubbles.add(b);
    };
    const loop = now => {
      if (over() || !alive()) { bubbles.forEach(b => { b.disabled = true; }); return; }
      const left = Math.max(0, 1 - (now - t0) / (g.time * 1000));
      fill.style.width = (left * 100) + '%';
      if (left <= 0) { bubbles.forEach(b => { b.disabled = true; }); done(false); return; }
      if (now >= spawnAt) { spawn(); spawnAt = now + 520 + Math.random() * 380; }
      bubbles.forEach(b => {
        if (b.dataset.hit) return;
        const k = (now - b.dataset.t) / b.dataset.d;
        if (k >= 1) { b.remove(); bubbles.delete(b); return; }
        b.style.top = (100 - k * 125) + '%';
      });
      requestAnimationFrame(loop);
    };
    startBtn.addEventListener('click', () => {
      if (started) return; started = true; startBtn.remove();
      t0 = performance.now(); spawnAt = t0; requestAnimationFrame(loop);
    });
    paint();
    sea.append(startBtn);
    area.append(card, score, bar, sea);
  }

  return { match, tower, chests, flight, freeze, catch: catchBooks };
})();
