// 구구독 구구덕의 책 속 대결: 미니게임 그림(에셋)
// 그림은 모두 이 파일 안에서 직접 그린 SVG와 캔버스 그림이에요. 외부 이미지·폰트를 쓰지 않아서 저작권 걱정이 없어요.
// - STORY_ART.load(): 그림을 한 번 준비해요(게임 창을 열 때 미리 불러요).
// - STORY_ART.put(c, '이름', x, y, 크기배율, 가로기준, 세로기준): 준비된 그림을 캔버스에 그려요.
// - towerWall / towerRoom / dustyRoom / cloudSea / bookTown / ring / book: 배경·소품을 그려 둔 캔버스를 만들어요.
window.STORY_ART = (() => {
  const DPR = Math.min(2, window.devicePixelRatio || 1), RS = DPR * 1.5;
  const S = {}, C = {};
  const api = {};
  let loading = null;

  // ---------- SVG helpers ----------
  const f = n => +n.toFixed(2);
  const star4 = (x, y, r) => `M${f(x)} ${f(y - r)}Q${f(x + r * .2)} ${f(y - r * .2)} ${f(x + r)} ${f(y)}Q${f(x + r * .2)} ${f(y + r * .2)} ${f(x)} ${f(y + r)}Q${f(x - r * .2)} ${f(y + r * .2)} ${f(x - r)} ${f(y)}Q${f(x - r * .2)} ${f(y - r * .2)} ${f(x)} ${f(y - r)}Z`;
  const star5 = (cx, cy, R, r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; d += (i ? 'L' : 'M') + f(cx + Math.cos(a) * q) + ' ' + f(cy + Math.sin(a) * q); } return d + 'Z'; };
  const stops = list => list.map(([o, col, a]) => `<stop offset="${o}" stop-color="${col}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
  const lg = (id, list, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`;
  const rg = (id, list, cx = .5, cy = .5, r = .5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(list)}</radialGradient>`;
  const GOLD = lg('gd', [[0, '#a8761f'], [.45, '#ffe795'], [1, '#9c6a1c']], 1, 0);
  // w, h: the size the sprite is drawn at in game pixels; vw, vh: the SVG's own drawing box
  const def = (name, w, h, vw, vh, body, defs = '') => {
    S[name] = { w, h, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}"><defs>${defs}</defs>${body}</svg>` };
  };

  // ================= 올빼미 사서 (무궁화 꽃이 피었습니다) =================
  const OWL_DEFS = lg('w', [[0, '#80553a'], [1, '#4a2c18']]) +
    rg('b', [[0, '#d6a273'], [.55, '#97653f'], [1, '#5a3922']], .38, .3, .85) +
    rg('f', [[0, '#fffbf2'], [1, '#ead3ac']], .5, .35, .7) +
    rg('e', [[0, '#fffcd8'], [.55, '#ffd23f'], [1, '#e39612']], .42, .38, .62) +
    lg('c', [[0, '#cdb0ff'], [1, '#7044cc']], 1, 1) +
    rg('sh', [[0, '#000', .35], [1, '#000', 0]]) +
    '<clipPath id="ec"><circle cx="88" cy="56" r="11"/></clipPath>';
  const OWL_CAP = `<path d="M25 37 Q25 10 58 7 Q91 5 103 27 Q111 41 106 55 Q100 41 90 36 Q62 25 25 37Z" fill="url(#c)"/>
    <path d="M42 15 Q58 9 74 12" stroke="#fff" stroke-opacity=".4" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g fill="#ffe28a"><path d="${star4(48, 23, 3.4)}"/><path d="${star4(73, 18, 2.8)}"/><path d="${star4(91, 29, 3)}"/></g>
    <path d="M23 37 Q60 23 95 36 L94 43 Q60 31 24 44Z" fill="#f7f1ff"/>
    <path d="M24 41 Q60 29 94 41" stroke="#ddd0f5" stroke-width="1.4" fill="none"/>
    <circle cx="106" cy="57" r="8" fill="#f7f1ff"/><circle cx="103.5" cy="54.5" r="2.6" fill="#fff"/>`;
  const OWL_FEET = `<ellipse cx="60" cy="128" rx="34" ry="4" fill="url(#sh)"/><g fill="#f0a640"><ellipse cx="47" cy="124" rx="8" ry="4"/><ellipse cx="73" cy="124" rx="8" ry="4"/></g>`;
  const OWL_TUFTS = (dx = 0) => `<path d="M${23 + dx} 45 Q${13 + dx} 32 ${16 + dx} 20 Q${28 + dx} 28 ${35 + dx} 38Z" fill="#6b4529"/><path d="M${97 + dx} 45 Q${107 + dx} 32 ${104 + dx} 20 Q${92 + dx} 28 ${85 + dx} 38Z" fill="#6b4529"/>`;
  const OWL_BACK_BODY = `${OWL_FEET}<path d="M48 114 L60 130 L72 114Z" fill="#5a3922"/>
    <ellipse cx="60" cy="88" rx="40" ry="38" fill="url(#b)"/>
    <path d="M60 62 Q26 64 20 92 Q22 118 54 125 Q46 98 60 62Z" fill="url(#w)"/>
    <path d="M60 62 Q94 64 100 92 Q98 118 66 125 Q74 98 60 62Z" fill="url(#w)"/>
    <g fill="none" stroke="#a8754d" stroke-width="2" opacity=".6" stroke-linecap="round"><path d="M30 90q6 6 12 0M27 103q6 6 12 0M35 114q6 5 11 0M78 90q6 6 12 0M81 103q6 6 12 0M74 114q6 5 11 0"/></g>`;
  // 졸 때: 뒤돌아 앉아 있어요(얼굴이 안 보여요)
  def('owlBack', 54, 60, 120, 132, `${OWL_BACK_BODY}
    <ellipse cx="60" cy="54" rx="41" ry="35" fill="url(#b)"/>${OWL_TUFTS()}
    <g fill="none" stroke="#6b4529" stroke-width="2.2" opacity=".45" stroke-linecap="round"><path d="M40 60q10 7 20 0q10 7 20 0M48 74q12 6 24 0"/></g>
    <ellipse cx="50" cy="44" rx="14" ry="6" fill="#fff" opacity=".1"/>
    <g transform="translate(120 0) scale(-1 1)">${OWL_CAP}</g>`, OWL_DEFS);
  // 수상할 때: 어깨 너머로 고개를 돌려 한쪽 눈을 가늘게 떠요
  def('owlPeek', 54, 60, 120, 132, `${OWL_BACK_BODY}
    <ellipse cx="62" cy="54" rx="41" ry="35" fill="url(#b)"/>${OWL_TUFTS(2)}
    <path d="M75 40 C89 30 105 40 103 58 C101 72 87 76 75 70 C69 62 67 48 75 40Z" fill="url(#f)"/>
    <circle cx="88" cy="56" r="11" fill="url(#e)"/>
    <circle cx="92" cy="58.5" r="5.6" fill="#2b1a10"/><circle cx="90" cy="56" r="2" fill="#fff"/>
    <path d="M74 60 Q88 44 102 60 L102 42 L74 42Z" fill="#c8915f" clip-path="url(#ec)"/>
    <path d="M77 54 Q88 46 99 54" stroke="#5a3922" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <circle cx="88" cy="56" r="14.5" fill="none" stroke="#d9a441" stroke-width="2.8"/>
    <path d="M78 50 q3 -5 9 -6" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M101 64 L111 67 L101 72Z" fill="#f2a33a"/>
    ${OWL_CAP}`, OWL_DEFS);
  // 들켰을 때: 정면을 보며 노란 눈을 번쩍 떠요
  def('owlFront', 54, 60, 120, 132, `${OWL_FEET}
    <ellipse cx="60" cy="88" rx="40" ry="38" fill="url(#b)"/>
    <path d="M22 74 Q8 100 26 124 Q40 104 36 78Z" fill="url(#w)"/><path d="M98 74 Q112 100 94 124 Q80 104 84 78Z" fill="url(#w)"/>
    <ellipse cx="60" cy="99" rx="25" ry="24" fill="url(#f)"/>
    <g fill="none" stroke="#c99f6f" stroke-width="2" stroke-linecap="round" opacity=".75"><path d="M45 90q3.5 4 7 0M56.5 90q3.5 4 7 0M68 90q3.5 4 7 0M50 101q3.5 4 7 0M63 101q3.5 4 7 0M45 112q3.5 4 7 0M56.5 112q3.5 4 7 0M68 112q3.5 4 7 0"/></g>
    <ellipse cx="60" cy="54" rx="41" ry="35" fill="url(#b)"/>${OWL_TUFTS()}
    <path d="M60 40 C46 28 21 34 23 56 C25 73 45 78 60 69 C75 78 95 73 97 56 C99 34 74 28 60 40Z" fill="url(#f)"/>
    <circle cx="44" cy="56" r="12.5" fill="url(#e)"/><circle cx="76" cy="56" r="12.5" fill="url(#e)"/>
    <circle cx="45.5" cy="57" r="6.5" fill="#2b1a10"/><circle cx="74.5" cy="57" r="6.5" fill="#2b1a10"/>
    <circle cx="42.5" cy="53.5" r="2.7" fill="#fff"/><circle cx="71.5" cy="53.5" r="2.7" fill="#fff"/>
    <circle cx="47.5" cy="60" r="1.2" fill="#fff"/><circle cx="76.5" cy="60" r="1.2" fill="#fff"/>
    <g fill="none" stroke="#d9a441" stroke-width="2.8"><circle cx="44" cy="56" r="15.5"/><circle cx="76" cy="56" r="15.5"/><path d="M58.5 54 Q60 51 61.5 54"/></g>
    <g stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round"><path d="M33 49 q4 -6 11 -6"/><path d="M65 49 q4 -6 11 -6"/></g>
    <path d="M55 68 Q60 66 65 68 L60 77Z" fill="#f2a33a"/>
    <path d="M60 84 L47 77 Q45 84 47 91Z M60 84 L73 77 Q75 84 73 91Z" fill="#a35cf5"/><circle cx="60" cy="84" r="4" fill="#7c3fd6"/>
    ${OWL_CAP}`, OWL_DEFS);
  // 올빼미가 앉은 책상(올빼미 앞을 가려요)
  def('desk', 78, 37, 168, 80, `
    <rect x="16" y="20" width="14" height="60" rx="3" fill="#4e2f1a"/><rect x="138" y="20" width="14" height="60" rx="3" fill="#4e2f1a"/>
    <rect x="8" y="14" width="152" height="44" rx="4" fill="url(#p)"/>
    <rect x="18" y="22" width="60" height="28" rx="4" fill="url(#pp)" stroke="#3f2414" stroke-opacity=".45" stroke-width="2"/>
    <rect x="90" y="22" width="60" height="28" rx="4" fill="url(#pp)" stroke="#3f2414" stroke-opacity=".45" stroke-width="2"/>
    <g fill="url(#gd)"><circle cx="48" cy="36" r="3.6"/><circle cx="120" cy="36" r="3.6"/></g>
    <rect x="8" y="18" width="152" height="5" fill="#000" opacity=".22"/>
    <rect x="0" y="4" width="168" height="15" rx="5" fill="url(#t)"/>
    <rect x="6" y="6" width="156" height="3" rx="1.5" fill="#fff" opacity=".3"/>`,
    lg('t', [[0, '#dca26a'], [1, '#9a6438']]) + lg('p', [[0, '#93603a'], [1, '#5c371f']]) + lg('pp', [[0, '#7d4c2c'], [1, '#673d22']]) + GOLD);
  // 초록 갓 스탠드
  def('lamp', 24, 28, 52, 60, `
    <ellipse cx="26" cy="55" rx="15" ry="4.5" fill="url(#gd)"/>
    <rect x="24.5" y="24" width="3" height="31" fill="url(#gd)"/>
    <path d="M3 28 Q3 12 26 11 Q49 12 49 28Z" fill="url(#g)"/>
    <path d="M10 19 Q19 14 31 14" stroke="#fff" stroke-opacity=".55" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <rect x="3" y="27" width="46" height="3.5" rx="1.75" fill="#14603a"/>
    <path d="M36 31 V44" stroke="#c9a24a" stroke-width="1"/><circle cx="36" cy="45" r="1.8" fill="url(#gd)"/>`,
    lg('g', [[0, '#64e3a6'], [1, '#1c7448']]) + GOLD);
  // 책상 위 책 더미와 깃펜
  def('deskBooks', 28, 21, 60, 44, `
    <rect x="3" y="31" width="40" height="11" rx="2" fill="#3d6cae"/><rect x="3" y="31" width="40" height="3" rx="1.5" fill="#fff" opacity=".22"/><rect x="7" y="33" width="2.5" height="8" fill="#e8c46a"/><rect x="36" y="33" width="2.5" height="8" fill="#e8c46a"/>
    <rect x="7" y="21" width="34" height="10" rx="2" fill="#b04a4a"/><rect x="7" y="21" width="34" height="3" rx="1.5" fill="#fff" opacity=".22"/><rect x="34" y="22" width="5" height="8" rx="1" fill="#f6ead0"/>
    <rect x="5" y="12" width="30" height="9" rx="2" fill="#4f9558"/><rect x="5" y="12" width="30" height="3" rx="1.5" fill="#fff" opacity=".22"/><rect x="12" y="14" width="10" height="5" rx="1" fill="#f6ead0" opacity=".85"/>
    <path d="M46 42 h11 v-8 q0 -5 -5.5 -5 q-5.5 0 -5.5 5z" fill="#2d2a4a"/><ellipse cx="51.5" cy="30" rx="4" ry="1.4" fill="#4a4670"/>
    <path d="M52 30 Q55 14 59 2 Q51 10 50 24Z" fill="#f7f1ff"/><path d="M52 30 Q55 14 59 2" stroke="#cdb0ff" stroke-width="1" fill="none"/>`);
  // 꼭대기 서재: 빛나는 책이 펼쳐진 독서대
  def('lectern', 44, 52, 80, 96, `
    <circle cx="40" cy="32" r="38" fill="url(#gl)"/>
    <path d="M35 54 L45 54 L44 88 L36 88Z" fill="url(#wd)"/>
    <ellipse cx="40" cy="90" rx="17" ry="4.5" fill="#4e2f1a"/>
    <path d="M10 44 L70 44 L63 58 L17 58Z" fill="url(#wd)"/>
    <path d="M10 44 L70 44" stroke="#e8b880" stroke-width="2.2"/>
    <path d="M40 43 Q27 32 12 36 L14 45 Q27 41 40 48Z" fill="#fffbf0"/>
    <path d="M40 43 Q53 32 68 36 L66 45 Q53 41 40 48Z" fill="#f2e3c2"/>
    <g stroke="#c9a273" stroke-width="1" opacity=".8" fill="none"><path d="M19 40 Q27 37 36 41M19 43 Q27 40 36 44M44 41 Q52 37 61 39M44 44 Q52 40 61 42"/></g>
    <path d="M40 43 V48" stroke="#b58b5a" stroke-width="1.2"/>
    <path d="M50 45 L50 56 L53 53 L56 56 L56 45Z" fill="#e05570"/>
    <g fill="#fff6c8"><path d="${star4(18, 18, 5)}"/><path d="${star4(62, 12, 3.6)}"/><path d="${star4(70, 30, 2.6)}"/><path d="${star4(10, 30, 2.6)}"/><path d="${star4(40, 14, 2.2)}"/></g>`,
    rg('gl', [[0, '#ffe39a', .8], [.5, '#ffd27a', .25], [1, '#ffd27a', 0]]) + lg('wd', [[0, '#b07a4a'], [1, '#6a4226']]));

  // ================= 탑을 받쳐라 =================
  // 금빛 북엔드(구구덕이 가져오는 받침대)
  def('bookend', 24, 124, 48, 248, `
    <path d="M6 10 Q6 2 14 2 L34 2 Q42 2 42 10 L42 236 L6 236Z" fill="url(#br)"/>
    <rect x="0" y="230" width="48" height="18" rx="5" fill="url(#br2)"/>
    <path d="M11 12 Q11 7 16 7 L32 7 Q37 7 37 12 L37 226 L11 226Z" fill="none" stroke="#fff3c4" stroke-opacity=".5" stroke-width="2"/>
    <path d="${star5(24, 54, 11, 4.6)}" fill="#c48a2a" stroke="#fff3c4" stroke-opacity=".6" stroke-width="1.2"/>
    <path d="${star5(24, 190, 7, 3)}" fill="#c48a2a" opacity=".8"/>
    <rect x="13" y="14" width="4.5" height="206" rx="2.25" fill="#fff" opacity=".4"/>
    <g fill="#fff3c4"><circle cx="24" cy="98" r="2.2"/><circle cx="24" cy="140" r="2.2"/></g>`,
    lg('br', [[0, '#d9a441'], [.45, '#fff0b0'], [1, '#b98328']], 1, 0) + lg('br2', [[0, '#e0b04a'], [1, '#8f6420']]));
  // 바람에 날리는 종이
  def('page', 13, 15, 28, 32, `<path d="M3 3 L21 1 Q26 12 25 29 L5 31 Q8 16 3 3Z" fill="#fffaf0"/>
    <path d="M21 1 Q22 5 25 7" stroke="#e0d2b4" fill="none"/><g stroke="#c9b48f" stroke-width="1.2"><path d="M7 9 L20 8M7 13 L21 12M8 17 L21 16M8 21 L19 20"/></g>`);

  // ================= 진짜 명작을 찾아라 =================
  def('chestBase', 60, 40, 120, 80, `
    <rect x="6" y="2" width="108" height="74" rx="8" fill="url(#wd)"/>
    <g stroke="#4e2f1a" stroke-opacity=".45" stroke-width="2"><path d="M8 27 H112 M8 52 H112"/></g>
    <g fill="#fff" opacity=".1"><rect x="12" y="5" width="96" height="3" rx="1.5"/><rect x="12" y="30" width="96" height="2" rx="1"/><rect x="12" y="55" width="96" height="2" rx="1"/></g>
    <rect x="22" y="2" width="11" height="74" fill="url(#gd)"/><rect x="87" y="2" width="11" height="74" fill="url(#gd)"/>
    <g fill="#fff6cf"><circle cx="27.5" cy="13" r="1.9"/><circle cx="27.5" cy="40" r="1.9"/><circle cx="27.5" cy="65" r="1.9"/><circle cx="92.5" cy="13" r="1.9"/><circle cx="92.5" cy="40" r="1.9"/><circle cx="92.5" cy="65" r="1.9"/></g>
    <path d="M6 56 V68 Q6 76 14 76 H20 V68 H14 V56Z" fill="url(#gd)"/><path d="M114 56 V68 Q114 76 106 76 H100 V68 H106 V56Z" fill="url(#gd)"/>
    <rect x="48" y="2" width="24" height="30" rx="5" fill="url(#gd)"/>
    <circle cx="60" cy="13" r="4.2" fill="#3b2414"/><path d="M58 15 L56.8 24 H63.2 L62 15Z" fill="#3b2414"/>
    <rect x="6" y="70" width="108" height="6" rx="3" fill="#000" opacity=".2"/>`,
    lg('wd', [[0, '#bf8656'], [1, '#78492a']]) + GOLD);
  def('chestLid', 60, 22, 120, 44, `
    <path d="M4 44 V26 Q4 2 60 2 Q116 2 116 26 V44Z" fill="url(#lw)"/>
    <g clip-path="url(#lc)"><rect x="22" y="0" width="11" height="44" fill="url(#gd)"/><rect x="87" y="0" width="11" height="44" fill="url(#gd)"/>
    <path d="M4 20 Q60 8 116 20" stroke="#4e2f1a" stroke-opacity=".35" stroke-width="2" fill="none"/></g>
    <path d="M18 12 Q60 2 102 12" stroke="#fff" stroke-opacity=".32" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="48" y="30" width="24" height="14" rx="3" fill="url(#gd)"/>
    <rect x="2" y="39" width="116" height="5" rx="2.5" fill="#5a361f"/>`,
    lg('lw', [[0, '#d69c66'], [1, '#8a5632']]) + GOLD + '<clipPath id="lc"><path d="M4 44 V26 Q4 2 60 2 Q116 2 116 26 V44Z"/></clipPath>');
  def('chestLidOpen', 60, 24, 120, 48, `
    <path d="M8 46 L15 6 Q60 -2 105 6 L112 46Z" fill="url(#li)"/>
    <path d="M23 46 L27 5 M97 46 L93 5" stroke="#c9a24a" stroke-width="9" stroke-opacity=".75"/>
    <path d="M15 6 Q60 -2 105 6" stroke="#e8b880" stroke-width="2" fill="none"/>
    <rect x="6" y="42" width="108" height="6" rx="3" fill="#2e1a0d"/>`,
    lg('li', [[0, '#73472a'], [1, '#3a2212']]));
  // 진짜 명작(빛나는 옛날 책)
  def('masterpiece', 30, 35, 60, 70, `
    <rect x="16" y="9" width="38" height="56" rx="3" fill="#f6ead0"/>
    <g stroke="#d8c39a" stroke-width="1"><path d="M52 12 V62 M49 12 V62"/></g>
    <rect x="8" y="5" width="42" height="60" rx="5" fill="url(#cv)"/>
    <rect x="8" y="5" width="9" height="60" rx="4" fill="#24307a"/>
    <rect x="9" y="12" width="7" height="2.5" fill="url(#gd)"/><rect x="9" y="56" width="7" height="2.5" fill="url(#gd)"/>
    <rect x="21" y="13" width="23" height="44" rx="3" fill="none" stroke="url(#gd)" stroke-width="2"/>
    <path d="M32.5 22 L38 35 L32.5 48 L27 35Z" fill="url(#gem)" stroke="url(#gd)" stroke-width="1.6"/>
    <path d="M30.4 28 L32.5 23.5 L34 27" stroke="#fff" stroke-opacity=".75" stroke-width="1.2" fill="none"/>
    <path d="M43 6 h6.5 v6.5z" fill="url(#gd)"/><path d="M43 64 h6.5 v-6.5z" fill="url(#gd)"/>
    <path d="M20 8 Q30 6 44 7" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none"/>`,
    lg('cv', [[0, '#6f86ea'], [1, '#283686']], 1, 1) + rg('gem', [[0, '#ffd6e8'], [.5, '#ff5c9a'], [1, '#b0205c']], .4, .35, .7) + GOLD);
  // 가짜 1: 영수증
  def('receipt', 24, 32, 48, 64, `
    <path d="M6 4 H42 V56 L37 61 L32 56 L27 61 L22 56 L17 61 L12 56 L6 61Z" fill="#fdfcf7"/>
    <path d="M6 4 H42" stroke="#d9d4c4" stroke-width="2"/>
    <g fill="#b9b2a0"><rect x="12" y="11" width="24" height="3.4" rx="1.7"/><rect x="12" y="20" width="16" height="2" rx="1"/><rect x="31" y="20" width="5" height="2" rx="1"/>
    <rect x="12" y="26" width="13" height="2" rx="1"/><rect x="31" y="26" width="5" height="2" rx="1"/><rect x="12" y="32" width="18" height="2" rx="1"/><rect x="31" y="32" width="5" height="2" rx="1"/></g>
    <path d="M12 39 H36" stroke="#b9b2a0" stroke-dasharray="2 2"/>
    <rect x="12" y="43" width="12" height="4.4" rx="2.2" fill="#7d7464"/><rect x="27" y="43" width="9" height="4.4" rx="2.2" fill="#e05570"/>`);
  // 가짜 2: 거미줄과 꼬마 거미
  def('web', 32, 30, 68, 64, (() => {
    let d = ''; const cx = 34, cy = 22, n = 7, ang = [];
    for (let i = 0; i < n; i++) ang.push(-Math.PI / 2 + i * Math.PI * 2 / n);
    ang.forEach(a => { d += `M${cx} ${cy}L${f(cx + Math.cos(a) * 24)} ${f(cy + Math.sin(a) * 22)}`; });
    [7, 13, 19].forEach(r => ang.forEach((a, i) => {
      const b = ang[(i + 1) % n], m = (a + b) / 2 + (i === n - 1 ? Math.PI : 0), s = r * .8;
      d += `M${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r * .92)}Q${f(cx + Math.cos(m) * s)} ${f(cy + Math.sin(m) * s * .92)} ${f(cx + Math.cos(b) * r)} ${f(cy + Math.sin(b) * r * .92)}`;
    }));
    return `<path d="${d}" stroke="#eef0ff" stroke-opacity=".9" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <path d="M34 22 V44" stroke="#eef0ff" stroke-width="1"/>
      <g stroke="#3a3550" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M29 48 L22 44 M29 51 L21 52 M29 54 L23 59 M39 48 L46 44 M39 51 L47 52 M39 54 L45 59"/></g>
      <ellipse cx="34" cy="51" rx="7" ry="6" fill="#3a3550"/><ellipse cx="32" cy="48.5" rx="2.6" ry="1.6" fill="#fff" opacity=".25"/>
      <circle cx="31.5" cy="51" r="2.1" fill="#fff"/><circle cx="36.5" cy="51" r="2.1" fill="#fff"/><circle cx="31.8" cy="51.4" r="1" fill="#222"/><circle cx="36.8" cy="51.4" r="1" fill="#222"/>
      <path d="M32 55 Q34 56.5 36 55" stroke="#fff" stroke-width=".9" fill="none"/>`;
  })());
  // 가짜 3: 줄무늬 양말
  def('sock', 24, 31, 48, 62, `
    <g clip-path="url(#sk)"><rect x="0" y="0" width="48" height="62" fill="#fff6f6"/>
    <g fill="#ff8fa8"><rect x="0" y="14" width="48" height="4"/><rect x="0" y="23" width="48" height="4"/><rect x="0" y="32" width="48" height="4"/></g>
    <ellipse cx="14" cy="47" rx="9" ry="8" fill="#e05570"/><ellipse cx="40" cy="55" rx="9" ry="7" fill="#e05570"/></g>
    <rect x="13" y="3" width="23" height="9" rx="3" fill="#e05570"/>
    <path d="M16 5 H33" stroke="#fff" stroke-opacity=".4" stroke-width="1.5"/>
    <path d="M24 44 l-2 -2.4 a1.6 1.6 0 0 1 2 -2.4 a1.6 1.6 0 0 1 2 2.4z" fill="#a35cf5"/>`,
    '<clipPath id="sk"><path d="M14 4 H35 V34 Q35 40 39 44 L44 49 Q48 55 42 59 Q36 63 27 59 L12 51 Q6 47 8 40 L14 30Z"/></clipPath>');
  // 구구독의 돋보기
  def('magnifier', 24, 24, 48, 48, `
    <path d="M30 30 L44 44" stroke="#6a4226" stroke-width="7" stroke-linecap="round"/>
    <path d="M30 30 L35 35" stroke="url(#gd)" stroke-width="8" stroke-linecap="round"/>
    <circle cx="19" cy="19" r="15" fill="url(#gl)" stroke="url(#gd)" stroke-width="4"/>
    <path d="M11 14 Q14 9 20 8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".9"/>`,
    rg('gl', [[0, '#ffffff', .9], [1, '#9fdcff', .55]], .4, .35, .7) + GOLD);

  // ================= 구름 고리 통과 =================
  const DRAGON_DEFS = rg('d', [[0, '#9df4d2'], [.6, '#4cc9a0'], [1, '#2a9474']], .4, .3, .8) +
    lg('bl', [[0, '#fff7da'], [1, '#f2d79c']]) + lg('sp', [[0, '#d2b6ff'], [1, '#8a5ce0']]) +
    lg('hn', [[0, '#fff0b0'], [1, '#d9a441']]) + rg('sn', [[0, '#b5f7dc'], [1, '#62d3aa']], .4, .35, .7);
  // 꼬마 용 몸(오른쪽을 보고 날아요)
  def('dragonBody', 92, 65, 176, 124, `
    <path d="M50 76 Q24 88 11 72 Q3 60 11 48 Q14 62 28 66 Q40 68 52 62Z" fill="url(#d)"/>
    <path d="M11 48 L1 40 L12 41 L9 30 L18 43Z" fill="url(#sp)"/>
    <ellipse cx="66" cy="98" rx="11" ry="8" fill="#38a884"/>
    <ellipse cx="82" cy="74" rx="46" ry="29" fill="url(#d)"/>
    <path d="M50 84 Q82 108 120 86 Q114 98 84 101 Q58 101 50 84Z" fill="url(#bl)"/>
    <g stroke="#dcb978" stroke-width="1.5" opacity=".7" fill="none"><path d="M64 92 Q66 98 70 99M78 95 Q80 100 84 100M92 95 Q94 99 98 99M106 91 Q108 95 112 95"/></g>
    <path d="M44 58 L50 46 L56 55 L63 41 L69 52 L77 38 L83 50 L91 38 L96 50 L104 42 L106 54Z" fill="url(#sp)"/>
    <path d="M60 49 Q82 40 106 49 L104 61 Q82 55 62 61Z" fill="#7c4fd6"/>
    <path d="M60 49 Q82 40 106 49" stroke="#ffd98f" stroke-width="2.2" fill="none"/><path d="M62 61 Q82 55 104 61" stroke="#ffd98f" stroke-width="2.2" fill="none"/>
    <ellipse cx="108" cy="98" rx="10" ry="7.5" fill="#44b892"/>
    <g stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"><path d="M58 104 l-2 3M64 105 l-1 3M70 104 l0 3M101 103 l-2 3M107 104 l-1 3M113 103 l0 3"/></g>
    <ellipse cx="138" cy="54" rx="31" ry="27" fill="url(#d)"/>
    <ellipse cx="160" cy="66" rx="15" ry="12" fill="url(#sn)"/>
    <circle cx="164" cy="61" r="1.9" fill="#2a6f58"/><circle cx="170" cy="63" r="1.6" fill="#2a6f58"/>
    <path d="M150 74 Q158 79 166 74" stroke="#2a6f58" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M122 34 Q116 16 126 8 Q125 22 131 31Z" fill="url(#hn)"/><path d="M140 30 Q142 12 154 9 Q146 21 148 32Z" fill="url(#hn)"/>
    <path d="M114 48 Q100 40 101 28 Q113 36 120 44Z" fill="url(#sp)"/>
    <ellipse cx="144" cy="50" rx="7.5" ry="9.5" fill="#24160c"/>
    <circle cx="141.5" cy="46" r="3.2" fill="#fff"/><circle cx="146.5" cy="53.5" r="1.5" fill="#fff"/>
    <ellipse cx="149" cy="65" rx="6.5" ry="3.8" fill="#ff8fa8" opacity=".65"/>
    <ellipse cx="72" cy="64" rx="20" ry="6" fill="#fff" opacity=".2"/><ellipse cx="130" cy="38" rx="11" ry="5" fill="#fff" opacity=".24"/>`,
    DRAGON_DEFS);
  // 날개(뿌리를 축으로 위아래로 펄럭여요)
  def('dragonWing', 46, 41, 100, 90, `
    <path d="M10 84 L44 22 Q66 6 96 4 Q80 22 92 40 Q72 42 72 62 Q54 54 40 74 Q28 70 10 84Z" fill="url(#wm)"/>
    <g stroke="#2c977a" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".8"><path d="M44 22 L92 40M44 22 L72 62M44 22 L40 74"/></g>
    <path d="M10 84 L44 22 Q66 6 96 4" stroke="#2c977a" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 70 L44 26 Q62 14 84 10" stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="44" cy="22" r="4" fill="#2c977a"/><path d="M44 20 L41 12 L48 18Z" fill="#ffd98f"/>`,
    lg('wm', [[0, '#c3f7e4'], [.6, '#7fe0bd'], [1, '#56c8a0']], 1, 1));
  // 심술 먹구름
  def('storm', 60, 41, 124, 84, `
    <g fill="url(#s)"><circle cx="34" cy="48" r="20"/><circle cx="60" cy="34" r="25"/><circle cx="88" cy="44" r="21"/><circle cx="106" cy="58" r="14"/><circle cx="18" cy="60" r="14"/><rect x="18" y="48" width="90" height="26" rx="13"/></g>
    <ellipse cx="52" cy="24" rx="14" ry="6" fill="#fff" opacity=".2"/>
    <g stroke="#25213a" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M44 45 L55 50"/><path d="M80 45 L69 50"/><path d="M54 66 Q62 61 70 66"/></g>
    <circle cx="51" cy="56" r="3.3" fill="#25213a"/><circle cx="73" cy="56" r="3.3" fill="#25213a"/>`,
    rg('s', [[0, '#a59dc2'], [1, '#4f4870']], .4, .3, .8));
  // 뭉게구름 두 가지
  const CLOUD_DEFS = rg('cw', [[0, '#ffffff'], [.7, '#f4f0ff'], [1, '#d9d0f5']], .4, .3, .8);
  def('cloudA', 84, 42, 160, 80, `<g fill="url(#cw)"><circle cx="46" cy="44" r="24"/><circle cx="78" cy="30" r="28"/><circle cx="112" cy="42" r="24"/><circle cx="136" cy="56" r="16"/><circle cx="24" cy="58" r="16"/><rect x="24" y="44" width="112" height="28" rx="14"/></g>
    <path d="M26 66 Q80 76 136 66 L136 72 Q80 80 26 72Z" fill="#cbbff0" opacity=".55"/>`, CLOUD_DEFS);
  def('cloudB', 56, 30, 112, 60, `<g fill="url(#cw)"><circle cx="34" cy="34" r="18"/><circle cx="58" cy="24" r="20"/><circle cx="82" cy="34" r="17"/><circle cx="18" cy="44" r="12"/><circle cx="96" cy="44" r="12"/><rect x="18" y="34" width="78" height="22" rx="11"/></g>`, CLOUD_DEFS);
  def('moon', 40, 40, 80, 80, `<circle cx="40" cy="40" r="38" fill="url(#mg)"/><circle cx="40" cy="40" r="19" fill="url(#md)"/>
    <g fill="#e2d39c" opacity=".7"><circle cx="33" cy="34" r="4"/><circle cx="46" cy="46" r="3"/><circle cx="44" cy="31" r="2"/></g>`,
    rg('mg', [[0, '#fff6c8', .55], [1, '#fff6c8', 0]]) + rg('md', [[0, '#fffbe6'], [1, '#f2e2a6']], .4, .35, .7));

  // ---------- loading ----------
  function raster(name) {
    return new Promise(res => {
      const s = S[name], img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = Math.ceil(s.w * RS); cv.height = Math.ceil(s.h * RS);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        C[name] = cv; res();
      };
      img.onerror = () => res();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.svg);
    });
  }
  function tint(from, to, col) {
    const s = C[from]; if (!s) return;
    const cv = document.createElement('canvas'); cv.width = s.width; cv.height = s.height;
    const x = cv.getContext('2d'); x.drawImage(s, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, cv.width, cv.height);
    C[to] = cv; S[to] = S[from];
  }
  api.load = () => loading || (loading = Promise.all(Object.keys(S).map(raster)).then(() => {
    tint('dragonBody', 'dragonBodyHurt', 'rgba(255,110,130,.5)');
    tint('dragonWing', 'dragonWingBack', 'rgba(20,70,60,.35)');
    tint('dragonWing', 'dragonWingHurt', 'rgba(255,110,130,.5)');
  }));
  // draw a sprite: (x, y) is the anchor point, ax/ay where the anchor sits on the sprite (0..1)
  api.put = (c, name, x, y, scale = 1, ax = .5, ay = 1) => {
    const d = S[name], cv = C[name]; if (!d || !cv) return;
    const w = d.w * scale, h = d.h * scale;
    c.drawImage(cv, x - w * ax, y - h * ay, w, h);
  };
  api.drawBox = (c, name, x, y, w, h) => { const cv = C[name]; if (cv) c.drawImage(cv, x, y, w, h); };

  // ---------- canvas helpers ----------
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const tone = (h, k) => { const c0 = hex(h), t = k >= 0 ? 255 : 0, a = Math.abs(k); return `rgb(${c0.map(v => Math.round(v + (t - v) * a)).join(',')})`; };
  const layer = (W, H, fn) => { const cv = document.createElement('canvas'); cv.width = Math.ceil(W * DPR); cv.height = Math.ceil(H * DPR); const x = cv.getContext('2d'); x.scale(DPR, DPR); fn(x); return cv; };
  const rr = (c, x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  api.rr = rr;
  api.sparkle = (c, x, y, r, a = 1, col = '#fff6c8') => {
    c.save(); c.globalAlpha *= a; c.fillStyle = col; c.beginPath();
    c.moveTo(x, y - r); c.quadraticCurveTo(x + r * .2, y - r * .2, x + r, y); c.quadraticCurveTo(x + r * .2, y + r * .2, x, y + r);
    c.quadraticCurveTo(x - r * .2, y + r * .2, x - r, y); c.quadraticCurveTo(x - r * .2, y - r * .2, x, y - r); c.fill(); c.restore();
  };
  // a soft round light: col like 'rgba(255,217,143,A)'
  api.glow = (c, x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
  // a white speech bubble with a short word in it
  api.bubble = (c, x, y, text, col = '#5b3a8a', size = 15) => {
    c.save(); c.font = `${size}px Jua, 'Malgun Gothic', sans-serif`;
    const w = Math.max(size + 8, c.measureText(text).width + 14), h = size + 10;
    c.fillStyle = 'rgba(0,0,0,.18)'; rr(c, x - w / 2 + 1, y - h + 2, w, h, h / 2); c.fill();
    c.fillStyle = '#fff'; rr(c, x - w / 2, y - h, w, h, h / 2); c.fill();
    c.beginPath(); c.moveTo(x - 4, y - 1); c.lineTo(x + 2, y + 6); c.lineTo(x + 5, y - 1); c.fill();
    c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y - h / 2 + 1);
    c.restore();
  };

  // ---------- 책장 ----------
  const PAL = ['#b04a4a', '#3d6cae', '#4f9558', '#8459b3', '#c8873a', '#3b97a5', '#ad5d7d', '#5f66bd', '#a7853c', '#4b7d67', '#c26a4a', '#6d4f9e'];
  const DUSTY = ['#8a6a5a', '#5f6f8a', '#6a7f62', '#7a6390', '#9a7a52', '#5a8088', '#8a5f6f', '#6a6a8f'];
  function spine(c, x, y, w, h, col, r, dusty) {
    const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, tone(col, .22)); g.addColorStop(.4, col); g.addColorStop(1, tone(col, -.38));
    c.fillStyle = g; rr(c, x, y, w, h, Math.min(1.8, w / 4)); c.fill();
    c.fillStyle = r() < .55 ? '#e6c36a' : tone(col, -.5); c.globalAlpha = dusty ? .5 : .85;
    c.fillRect(x + .8, y + 3.5, w - 1.6, 1.4); c.fillRect(x + .8, y + h - 5, w - 1.6, 1.4);
    if (r() < .45) c.fillRect(x + .8, y + 6.5, w - 1.6, .9);
    if (w > 7.5 && r() < .55) { c.fillStyle = 'rgba(255,246,225,.8)'; c.fillRect(x + 1.8, y + h * .34, w - 3.6, h * .2); c.fillStyle = 'rgba(80,60,40,.5)'; c.fillRect(x + 2.6, y + h * .42, w - 5.2, .9); }
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x + .8, y + 1, Math.max(1, w * .18), h - 2);
  }
  function bookcase(c, x0, y0, w, h, o = {}) {
    const r = rng(o.seed || 7), rowH = o.rowH || 40, pal = o.palette || PAL;
    const bg = c.createLinearGradient(0, y0, 0, y0 + h); bg.addColorStop(0, o.back0 || '#241936'); bg.addColorStop(1, o.back1 || '#1a1228');
    c.fillStyle = bg; c.fillRect(x0, y0, w, h);
    for (let y = y0 + (o.offset || 0); y < y0 + h; y += rowH) {
      const floor = y + rowH - 6;
      let x = x0 + 3;
      while (x < x0 + w - 3) {
        const t = r();
        if (t < .05) { x += 5 + r() * 9; continue; }
        const bw = 5.5 + r() * 6.5, bh = rowH - 11 - r() * 10, col = pal[(r() * pal.length) | 0];
        if (t > .95 && x + rowH * .7 < x0 + w) {
          // a few books lying flat
          let yy = floor; const len = rowH * .5 + r() * 8;
          for (let k = 0; k < 2 + (r() * 2 | 0); k++) {
            const th = 4 + r() * 2.5, cc = pal[(r() * pal.length) | 0], g2 = c.createLinearGradient(0, yy - th, 0, yy);
            g2.addColorStop(0, tone(cc, .2)); g2.addColorStop(1, tone(cc, -.3));
            c.fillStyle = g2; rr(c, x, yy - th, len, th, 1.2); c.fill();
            c.fillStyle = 'rgba(255,246,225,.55)'; c.fillRect(x + len - 3, yy - th + 1, 2, th - 2);
            yy -= th;
          }
          x += len + 2; continue;
        }
        if (t > .9 && x + bw + 6 < x0 + w) { c.save(); c.translate(x + bw, floor); c.rotate(.2); spine(c, -bw, -bh, bw, bh, col, r, o.dusty); c.restore(); x += bw + 5; continue; }
        spine(c, x, floor - bh, bw, bh, col, r, o.dusty);
        x += bw + .6;
      }
      const sg = c.createLinearGradient(0, y, 0, y + 14); sg.addColorStop(0, 'rgba(0,0,0,.45)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = sg; c.fillRect(x0, y, w, 14);
      const pg = c.createLinearGradient(0, floor, 0, floor + 7); pg.addColorStop(0, '#a87346'); pg.addColorStop(1, '#5e3a21');
      c.fillStyle = pg; c.fillRect(x0, floor, w, 7);
      c.fillStyle = 'rgba(255,225,180,.35)'; c.fillRect(x0, floor, w, 1);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x0, floor + 7, w, 3);
    }
    if (o.dusty) {
      c.fillStyle = 'rgba(70,62,84,.35)'; c.fillRect(x0, y0, w, h);
      for (let i = 0; i < w * h / 110; i++) { c.fillStyle = `rgba(230,225,210,${.08 + r() * .16})`; c.fillRect(x0 + r() * w, y0 + r() * h, 1, 1); }
    }
  }
  function archWindow(c, x, y, w, h, seed = 3) {
    const r = rng(seed);
    const path = () => { c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); };
    const gg = c.createRadialGradient(x + w / 2, y + h / 2, 4, x + w / 2, y + h / 2, w * 1.3); gg.addColorStop(0, 'rgba(150,165,255,.2)'); gg.addColorStop(1, 'rgba(150,165,255,0)');
    c.fillStyle = gg; c.fillRect(x - w, y - w, w * 3, h + w * 2);
    c.save(); path(); c.clip();
    const sky = c.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, '#0c1033'); sky.addColorStop(1, '#2d2f73'); c.fillStyle = sky; c.fillRect(x, y, w, h);
    for (let i = 0; i < w * h / 40; i++) { c.fillStyle = `rgba(255,250,220,${.35 + r() * .65})`; const s = r() < .15 ? 1.6 : 1; c.fillRect(x + r() * w, y + r() * h, s, s); }
    const mx = x + w * .64, my = y + w * .44, mr = w * .17;
    api.glow(c, mx, my, mr * 3, 'rgba(255,246,200,A)', .45);
    c.fillStyle = '#fff4c8'; c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#121640'; c.beginPath(); c.arc(mx - mr * .55, my - mr * .28, mr * .9, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(170,160,230,.28)'; c.beginPath(); c.ellipse(x + w * .3, y + h * .8, w * .45, 4, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 6; c.beginPath(); c.moveTo(x + w * .1, y + h); c.lineTo(x + w * .9, y + h * .15); c.stroke();
    c.restore();
    path(); c.lineWidth = 5; c.strokeStyle = '#6e4628'; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,220,170,.35)'; c.stroke();
    c.strokeStyle = '#6e4628'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + w / 2, y + 2); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h * .58); c.lineTo(x + w, y + h * .58); c.stroke();
    const sg = c.createLinearGradient(0, y + h, 0, y + h + 6); sg.addColorStop(0, '#b07a4a'); sg.addColorStop(1, '#5e3a21'); c.fillStyle = sg; rr(c, x - 5, y + h - 1, w + 10, 6, 2); c.fill();
  }
  function stairs(c, P) {
    // landings where the flights turn
    for (let i = 1; i < P.length - 1; i++) {
      const [x, y] = P[i], g = c.createLinearGradient(0, y + 3, 0, y + 14); g.addColorStop(0, '#c9965f'); g.addColorStop(1, '#6e4426');
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x, y + 16, 22, 4, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = g; rr(c, x - 20, y + 3, 40, 10, 4); c.fill();
      c.fillStyle = 'rgba(255,240,210,.45)'; c.fillRect(x - 18, y + 3.5, 36, 1);
      c.fillStyle = '#4a2f1d'; c.fillRect(x - 3, y + 13, 6, 18);
    }
    // the flights, top one first so the lower (nearer) ones overlap it
    for (let i = P.length - 2; i >= 0; i--) {
      const [x1, y1] = P[i], [x2, y2] = P[i + 1], len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(4, Math.round(len / 12));
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(255,214,150,.12)'; c.lineWidth = 26; c.beginPath(); c.moveTo(x1, y1 + 6); c.lineTo(x2, y2 + 6); c.stroke();
      c.strokeStyle = '#38231a'; c.lineWidth = 12; c.beginPath(); c.moveTo(x1, y1 + 14); c.lineTo(x2, y2 + 14); c.stroke();
      c.strokeStyle = '#6b4329'; c.lineWidth = 3; c.beginPath(); c.moveTo(x1, y1 + 10); c.lineTo(x2, y2 + 10); c.stroke();
      for (let k = 0; k <= n; k++) {
        const x = x1 + (x2 - x1) * k / n, y = y1 + (y2 - y1) * k / n, sw = 17;
        c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x - sw / 2 + 2, y + 11, sw, 3);
        const fg = c.createLinearGradient(0, y + 5, 0, y + 11); fg.addColorStop(0, '#a46c41'); fg.addColorStop(1, '#6e4426');
        c.fillStyle = fg; c.fillRect(x - sw / 2, y + 5, sw, 6);
        c.fillStyle = '#d9aa76'; c.fillRect(x - sw / 2, y + 3, sw, 2.6);
        c.fillStyle = 'rgba(255,240,210,.55)'; c.fillRect(x - sw / 2, y + 3, sw, .8);
      }
    }
  }
  // 무궁화 배경: 책으로 가득한 탑 벽 + 아치 창문 + 나선 계단 + 꼭대기 서재
  api.towerWall = (W, H, P, opt = {}) => layer(W, H, c => {
    bookcase(c, 0, 0, W, H, { seed: 5, rowH: 38, offset: -6 });
    // darken the wall so the stairs and characters stand out
    const dk = c.createLinearGradient(0, 0, 0, H); dk.addColorStop(0, 'rgba(18,10,36,.6)'); dk.addColorStop(1, 'rgba(18,10,36,.74)');
    c.fillStyle = dk; c.fillRect(0, 0, W, H);
    if (opt.window) archWindow(c, ...opt.window);
    // moonlight from the window
    if (opt.window) {
      const [wx, wy, ww, wh] = opt.window;
      const mg = c.createLinearGradient(wx, wy, wx - 60, wy + 240); mg.addColorStop(0, 'rgba(190,200,255,.16)'); mg.addColorStop(1, 'rgba(190,200,255,0)');
      c.fillStyle = mg; c.beginPath(); c.moveTo(wx, wy + wh * .4); c.lineTo(wx + ww, wy + wh * .4); c.lineTo(wx - 20, wy + 260); c.lineTo(wx - 110, wy + 260); c.fill();
    }
    stairs(c, P);
    // vignette
    const vg = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
  });
  // 촛불 시계: frac 1(새 초) → 0(다 탐)
  api.candle = (c, x, y, frac, now) => {
    const hg = c.createLinearGradient(x - 12, 0, x + 12, 0); hg.addColorStop(0, '#a8761f'); hg.addColorStop(.5, '#ffe795'); hg.addColorStop(1, '#9c6a1c');
    c.strokeStyle = hg; c.lineWidth = 2.2; c.beginPath(); c.arc(x + 13, y - 3, 3.6, -Math.PI / 2, Math.PI / 2); c.stroke();
    c.fillStyle = hg; c.beginPath(); c.ellipse(x, y, 12, 3.8, 0, 0, Math.PI * 2); c.fill();
    const H = 3 + 44 * frac, top = y - 2 - H;
    const wg = c.createLinearGradient(x - 6, 0, x + 6, 0); wg.addColorStop(0, '#fffaf0'); wg.addColorStop(.6, '#f1e6cf'); wg.addColorStop(1, '#cdbf9f');
    c.fillStyle = wg; rr(c, x - 6, top, 12, H + 1, 2); c.fill();
    c.fillStyle = '#fffdf6'; c.beginPath(); c.ellipse(x, top + 1, 6, 1.8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fbf5e6'; rr(c, x - 6, top, 2.6, Math.min(H, 10), 1.3); c.fill(); rr(c, x + 2.4, top, 2.4, Math.min(H, 6), 1.2); c.fill();
    c.strokeStyle = '#3b2a1c'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, top); c.lineTo(x, top - 3); c.stroke();
    const fl = 1 + Math.sin(now / 70) * .08 + Math.sin(now / 33) * .05, fx = x + Math.sin(now / 120) * .8;
    api.glow(c, fx, top - 9, 28, 'rgba(255,200,120,A)', .5);
    c.save(); c.translate(fx, top - 3); c.scale(1, fl);
    const ff = c.createLinearGradient(0, -15, 0, 0); ff.addColorStop(0, '#ff9f3a'); ff.addColorStop(.55, '#ffe28a'); ff.addColorStop(1, '#fff8e0');
    c.fillStyle = ff; c.beginPath(); c.moveTo(0, -15); c.quadraticCurveTo(5.2, -6, 3.7, -2); c.quadraticCurveTo(0, 2, -3.7, -2); c.quadraticCurveTo(-5.2, -6, 0, -15); c.fill();
    c.fillStyle = 'rgba(120,170,255,.55)'; c.beginPath(); c.ellipse(0, -2.4, 1.6, 2.2, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  };
  // 작은 발자국
  api.paw = (c, x, y, a) => {
    c.save(); c.globalAlpha *= a; c.fillStyle = '#e9d8ff';
    c.beginPath(); c.ellipse(x, y, 3, 2.2, 0, 0, Math.PI * 2); c.fill();
    [-2.6, 0, 2.6].forEach(dx => { c.beginPath(); c.arc(x + dx, y - 3, 1, 0, Math.PI * 2); c.fill(); });
    c.restore();
  };

  // ---------- 탑을 받쳐라: 탑 꼭대기 방 ----------
  function roundWindow(c, cx, cy, R, seed = 9) {
    const r = rng(seed);
    api.glow(c, cx, cy, R * 2, 'rgba(150,165,255,A)', .2);
    // curtains
    const cg = c.createLinearGradient(0, cy - R, 0, cy + R + 30); cg.addColorStop(0, '#8f62e0'); cg.addColorStop(1, '#4b2a8f');
    [-1, 1].forEach(s => {
      c.fillStyle = cg; c.beginPath();
      c.moveTo(cx + s * (R - 2), cy - R - 14); c.lineTo(cx + s * (R + 22), cy - R - 14);
      c.quadraticCurveTo(cx + s * (R + 26), cy, cx + s * (R + 18), cy + R + 34);
      c.lineTo(cx + s * (R + 4), cy + R + 34); c.quadraticCurveTo(cx + s * (R + 10), cy + 8, cx + s * (R - 2), cy - R - 14); c.fill();
      c.strokeStyle = 'rgba(30,10,60,.35)'; c.lineWidth = 1.5;
      for (let k = 1; k < 3; k++) { c.beginPath(); c.moveTo(cx + s * (R + k * 7), cy - R - 12); c.quadraticCurveTo(cx + s * (R + 6 + k * 6), cy, cx + s * (R + 4 + k * 5), cy + R + 32); c.stroke(); }
      c.fillStyle = '#ffd98f'; rr(c, cx + s * (R + 6) - (s < 0 ? 18 : 0), cy + 10, 18, 4, 2); c.fill();
    });
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip();
    const sky = c.createLinearGradient(0, cy - R, 0, cy + R); sky.addColorStop(0, '#0c1033'); sky.addColorStop(1, '#33337a'); c.fillStyle = sky; c.fillRect(cx - R, cy - R, R * 2, R * 2);
    for (let i = 0; i < R * R / 18; i++) { c.fillStyle = `rgba(255,250,220,${.35 + r() * .65})`; const s = r() < .15 ? 1.7 : 1; c.fillRect(cx - R + r() * R * 2, cy - R + r() * R * 2, s, s); }
    const mx = cx - R * .35, my = cy - R * .35, mr = R * .2;
    api.glow(c, mx, my, mr * 3, 'rgba(255,246,200,A)', .45);
    c.fillStyle = '#fff4c8'; c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(226,211,156,.7)'; c.beginPath(); c.arc(mx - mr * .3, my - mr * .2, mr * .22, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(40,30,80,.75)'; c.beginPath(); c.moveTo(cx - R, cy + R); c.lineTo(cx - R, cy + R * .55); c.lineTo(cx - R * .6, cy + R * .42); c.lineTo(cx - R * .35, cy + R * .6); c.lineTo(cx, cy + R * .35); c.lineTo(cx + R * .3, cy + R * .55); c.lineTo(cx + R * .65, cy + R * .3); c.lineTo(cx + R, cy + R * .5); c.lineTo(cx + R, cy + R); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 7; c.beginPath(); c.moveTo(cx - R, cy + R * .6); c.lineTo(cx + R * .6, cy - R); c.stroke();
    c.restore();
    c.lineWidth = 6; c.strokeStyle = '#6e4628'; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1.4; c.strokeStyle = 'rgba(255,220,170,.4)'; c.beginPath(); c.arc(cx, cy, R - 2, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#6e4628'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke();
    // curtain rod
    c.strokeStyle = '#d9a441'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - R - 26, cy - R - 14); c.lineTo(cx + R + 26, cy - R - 14); c.stroke();
    c.fillStyle = '#ffe28a'; [-1, 1].forEach(s => { c.beginPath(); c.arc(cx + s * (R + 28), cy - R - 14, 3.5, 0, Math.PI * 2); c.fill(); });
  }
  api.towerRoom = (W, H, BASE) => layer(W, H, c => {
    const wall = c.createLinearGradient(0, 0, 0, BASE[1]); wall.addColorStop(0, '#22183a'); wall.addColorStop(1, '#3b2b5f');
    c.fillStyle = wall; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.04)';
    for (let y = 8; y < BASE[1] - 54; y += 16) for (let x = (y / 16 % 2) * 8; x < W; x += 16) { c.beginPath(); c.moveTo(x, y - 3); c.lineTo(x + 3, y); c.lineTo(x, y + 3); c.lineTo(x - 3, y); c.fill(); }
    // a bookcase built into the right wall
    const bx = W - 64, by = 30, bw = 60, bh = BASE[1] - 30;
    c.save(); rr(c, bx, by, bw, bh, 3); c.clip(); bookcase(c, bx, by, bw, bh, { seed: 11, rowH: 38 }); c.restore();
    const fr = c.createLinearGradient(bx - 6, 0, bx, 0); fr.addColorStop(0, '#8a5a35'); fr.addColorStop(1, '#5a3822');
    c.fillStyle = fr; c.fillRect(bx - 6, by - 6, 6, bh + 6); c.fillRect(bx - 6, by - 8, bw + 10, 8);
    c.fillStyle = 'rgba(255,225,180,.3)'; c.fillRect(bx - 6, by - 8, bw + 10, 1.2);
    // wainscot
    const wy = BASE[1] - 50, wg = c.createLinearGradient(0, wy, 0, BASE[1]); wg.addColorStop(0, '#6e4426'); wg.addColorStop(1, '#4a2c18');
    c.fillStyle = wg; c.fillRect(0, wy, bx - 6, 50);
    c.fillStyle = '#9a6a42'; c.fillRect(0, wy - 5, bx - 6, 6); c.fillStyle = 'rgba(255,225,180,.35)'; c.fillRect(0, wy - 5, bx - 6, 1.2);
    c.strokeStyle = 'rgba(30,15,5,.4)'; c.lineWidth = 1.5;
    for (let x = 8; x < bx - 30; x += 46) { rr(c, x, wy + 8, 38, 34, 3); c.stroke(); }
    roundWindow(c, 70, 84, 40);
    // floor
    const fg = c.createLinearGradient(0, BASE[1], 0, H); fg.addColorStop(0, '#6a4428'); fg.addColorStop(1, '#3a2416');
    c.fillStyle = fg; c.fillRect(0, BASE[1], W, H - BASE[1]);
    c.strokeStyle = 'rgba(25,12,5,.45)'; c.lineWidth = 1.2;
    for (let y = BASE[1] + 9; y < H; y += 10) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    const r = rng(4); for (let y = BASE[1]; y < H; y += 10) for (let x = r() * 60; x < W; x += 60 + r() * 30) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 10); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, BASE[1], W, 3);
    // rug under the tower
    const [rx, ry] = [BASE[0], BASE[1] + 13];
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(rx, ry + 2, 98, 15, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6a2f8f'; c.beginPath(); c.ellipse(rx, ry, 96, 14, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#ffd98f'; c.lineWidth = 1.6; c.setLineDash([4, 3]); c.beginPath(); c.ellipse(rx, ry, 88, 11, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#9b5fd6'; c.beginPath(); c.ellipse(rx, ry, 60, 7.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd98f'; c.beginPath(); c.ellipse(rx, ry, 18, 2.6, 0, 0, Math.PI * 2); c.fill();
    // warm sconce glow
    api.glow(c, W - 96, 40, 60, 'rgba(255,200,130,A)', .18);
    const vg = c.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, H * .9); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
  });
  // 하드커버 책 한 권(옆으로 눕힌 모습)
  api.book = (w, h, col, seed = 1) => layer(w + 2, h + 2, c => {
    const r = rng(seed);
    c.translate(1, 1);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, tone(col, .3)); g.addColorStop(.45, col); g.addColorStop(1, tone(col, -.35));
    c.fillStyle = g; rr(c, 0, 0, w, h, 2.5); c.fill();
    c.fillStyle = '#f6ead0'; rr(c, w - 7, 2.2, 5, h - 4.4, 1); c.fill();
    c.strokeStyle = 'rgba(180,150,110,.6)'; c.lineWidth = .6;
    for (let y = 3.6; y < h - 3; y += 1.7) { c.beginPath(); c.moveTo(w - 6.5, y); c.lineTo(w - 2.5, y); c.stroke(); }
    c.fillStyle = r() < .6 ? '#e8c46a' : tone(col, -.45); c.fillRect(6, .8, 2.2, h - 1.6); c.fillRect(w - 14, .8, 2.2, h - 1.6);
    c.fillStyle = 'rgba(255,246,225,.88)'; rr(c, w * .3, h * .26, w * .32, h * .48, 1.2); c.fill();
    c.fillStyle = tone(col, -.4); c.fillRect(w * .35, h * .44, w * .22, 1.1); c.fillRect(w * .38, h * .58, w * .15, .8);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(2.5, 1.4, w - 11, 1.2);
  });

  // ---------- 진짜 명작을 찾아라: 먼지 쌓인 서가 ----------
  function webCorner(c, x, y, R, dir) {
    c.save(); c.translate(x, y); c.scale(dir, 1);
    c.strokeStyle = 'rgba(235,235,250,.55)'; c.lineWidth = .9;
    const angs = [0, 1, 2, 3, 4].map(i => i / 4 * Math.PI / 2);
    angs.forEach(a => { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * R, Math.sin(a) * R); c.stroke(); });
    for (let k = 1; k <= 4; k++) {
      const q = R * k / 4.4; c.beginPath();
      angs.forEach((a, i) => { const px = Math.cos(a) * q, py = Math.sin(a) * q; if (!i) c.moveTo(px, py); else { const am = (a + angs[i - 1]) / 2, s = q * .8; c.quadraticCurveTo(Math.cos(am) * s, Math.sin(am) * s, px, py); } });
      c.stroke();
    }
    c.restore();
  }
  api.dustyRoom = (W, H, FLOOR) => layer(W, H, c => {
    bookcase(c, 0, 0, W, FLOOR, { seed: 21, rowH: 42, dusty: true, palette: DUSTY, offset: -8 });
    const dk = c.createLinearGradient(0, 0, 0, FLOOR); dk.addColorStop(0, 'rgba(20,12,30,.25)'); dk.addColorStop(1, 'rgba(20,12,30,.6)');
    c.fillStyle = dk; c.fillRect(0, 0, W, FLOOR);
    webCorner(c, 0, 0, 48, 1); webCorner(c, W, 0, 42, -1);
    const fg = c.createLinearGradient(0, FLOOR, 0, H); fg.addColorStop(0, '#5e3e26'); fg.addColorStop(1, '#2e1d12');
    c.fillStyle = fg; c.fillRect(0, FLOOR, W, H - FLOOR);
    c.strokeStyle = 'rgba(20,10,5,.45)'; c.lineWidth = 1.2;
    for (let y = FLOOR + 11; y < H; y += 12) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    const r = rng(8); for (let y = FLOOR; y < H; y += 12) for (let x = r() * 70; x < W; x += 70 + r() * 30) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 12); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, FLOOR, W, 3);
    // dust bunnies
    [[40, FLOOR + 30], [250, FLOOR + 46], [292, FLOOR + 22]].forEach(([x, y]) => { c.fillStyle = 'rgba(200,190,175,.35)'; c.beginPath(); c.ellipse(x, y, 7, 3, 0, 0, Math.PI * 2); c.fill(); });
    const vg = c.createRadialGradient(W / 2, H * .55, H * .3, W / 2, H * .55, H * .85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
  });

  // ---------- 구름 고리 통과 ----------
  // 고리 반쪽(뒤쪽 back / 앞쪽 front)을 뭉게구름으로
  api.ring = (rx, ry, kind) => {
    const pad = 12, W = rx * 2 + pad * 2, H = ry * 2 + pad * 2;
    const make = side => layer(W, H, c => {
      const cx = W / 2, cy = H / 2, n = 26, pr = 7.6;
      const from = side === 'back' ? Math.PI / 2 : -Math.PI / 2, pts = [];
      for (let i = 0; i <= n / 2; i++) { const a = from + i / (n / 2) * Math.PI; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
      if (kind === 'gold') api.glow(c, cx, cy, ry + 10, 'rgba(255,214,120,A)', .35);
      pts.forEach(([x, y], i) => {
        const g = c.createRadialGradient(x - 2.5, y - 3, 1, x, y, pr + 1);
        if (kind === 'gold') { g.addColorStop(0, '#fffbe0'); g.addColorStop(.6, '#ffe08a'); g.addColorStop(1, '#e8a93a'); }
        else { g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#f2eeff'); g.addColorStop(1, '#c9bdf0'); }
        c.fillStyle = g; c.beginPath(); c.arc(x, y, pr * (i % 2 ? .92 : 1.05), 0, Math.PI * 2); c.fill();
      });
    });
    return { back: make('back'), front: make('front'), w: W, h: H };
  };
  // 바닥에 깔리는 구름 바다(옆으로 이어 붙여 흘려요)
  api.cloudSea = (Wd, h) => layer(Wd, h, c => {
    const r = rng(12), puffs = [];
    for (let x = 0; x < Wd; x += 26 + r() * 14) puffs.push([x, 14 + r() * 12, 16 + r() * 10]);
    [-Wd, 0, Wd].forEach(off => puffs.forEach(([x, y, q]) => {
      const g = c.createRadialGradient(x + off - q * .3, y - q * .4, 2, x + off, y, q);
      g.addColorStop(0, '#ffffff'); g.addColorStop(.7, '#f1ecff'); g.addColorStop(1, '#cfc3f0');
      c.fillStyle = g; c.beginPath(); c.arc(x + off, y, q, 0, Math.PI * 2); c.fill();
    }));
    c.fillStyle = '#ebe5ff'; c.fillRect(0, 24, Wd, h - 24);
  });
  // 멀리 보이는 책 마을 실루엣(책을 쌓아 만든 탑들)
  api.bookTown = (Wd, h) => layer(Wd, h, c => {
    const r = rng(31);
    for (let x = 6; x < Wd - 10;) {
      const tw = 18 + r() * 22; let y = h;
      const n = 3 + (r() * 6 | 0);
      for (let k = 0; k < n; k++) {
        const bh = 6 + r() * 6, w = tw - r() * 8, dx = (r() - .5) * 5;
        c.fillStyle = r() < .5 ? '#5a4690' : '#65509c'; rr(c, x + dx + (tw - w) / 2, y - bh, w, bh, 1.5); c.fill();
        if (r() < .5) { c.fillStyle = 'rgba(255,217,143,.85)'; c.fillRect(x + dx + tw / 2 - 1, y - bh / 2 - 1, 2, 2); }
        y -= bh;
      }
      // roof or flag
      c.fillStyle = '#6a55a4';
      if (r() < .6) { c.beginPath(); c.moveTo(x + 2, y); c.lineTo(x + tw / 2, y - 12 - r() * 8); c.lineTo(x + tw - 2, y); c.fill(); }
      else { c.fillRect(x + tw / 2 - .8, y - 14, 1.6, 14); c.fillStyle = '#ff8fa8'; c.beginPath(); c.moveTo(x + tw / 2 + .8, y - 14); c.lineTo(x + tw / 2 + 9, y - 11); c.lineTo(x + tw / 2 + .8, y - 8); c.fill(); }
      x += tw + 4 + r() * 16;
    }
  });
  api.bolt = (c, x, y, a) => {
    c.save(); c.globalAlpha *= a;
    api.glow(c, x, y + 16, 26, 'rgba(255,230,100,A)', .55);
    const g = c.createLinearGradient(0, y, 0, y + 34); g.addColorStop(0, '#fff6b0'); g.addColorStop(1, '#ffc21f');
    c.fillStyle = g; c.beginPath(); c.moveTo(x + 2, y); c.lineTo(x - 7, y + 17); c.lineTo(x, y + 17); c.lineTo(x - 5, y + 34); c.lineTo(x + 9, y + 12); c.lineTo(x + 2, y + 12); c.lineTo(x + 7, y); c.fill();
    c.restore();
  };
  return api;
})();
