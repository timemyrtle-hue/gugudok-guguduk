// 구구독 구구덕의 책 속 대결 (갈림길 이야기)
// "책이 최고야!" 독서탐험가 구구독 vs "취향이 최고야!" 취향 큐레이터 구구덕.
// 다투다 책 속으로 빨려 들어가, 서로의 생각이 왜 필요한지 알게 되고 화해하는 이야기예요.
// 🎮 게임 메뉴에서 열려요. 장면 + 갈림길 + 미니게임으로 결말까지 가요. 결말은 9개.
// 찾은 결말은 그 휴대폰에만 기억돼요(결말 모음). 미니게임은 story-games.js, 그림은 story-art.js 에 있어요.
//
// scenes: 장면 (이름으로 서로 이어져요)
//   pose   캐릭터 그림 (images/chars.js 에 있는 이름)
//   text   이야기 (\n 으로 줄바꿈)
//   talk   대화 [['dok', '구구독 말'], ['duk', '구구덕 말'], …]
//   after  대화 뒤에 이어지는 이야기 (없어도 돼요)
//   get    이 장면에 오면 가방에 들어가는 아이템 (items 안의 이름)
//   choices  갈림길: { text, to, need }  need 가 있으면 그 아이템이 가방에 있어야 고를 수 있어요(없으면 🔒)
//   game   미니게임: { type, title, how, ..., win, lose }  이기면 win, 지면 lose 장면(또는 결말)으로 가요
//     match   취향 저격 책 추천: who 의 취향(likes)을 보고 books 중 딱 맞는 책(ok: true) 고르기
//     freeze  무궁화 꽃이 피었습니다: 꾹 누르고 있으면 계단을 오르고, 올빼미가 돌아보면 손 떼기
//             (time: 끝까지 오르는 초, limit: 촛불 시간 제한 초, safe/warn/look: 올빼미가 하는 말, goalIcon, button)
//     tower   탑을 받쳐라: 기우는 책 탑을 연타로 밀어 받치며 time 초 버티기 (power: 한 번 누를 때 미는 힘)
//     catch   취향 책 잡기: 떠오르는 책 중 good 만 톡톡. time 초 안에 goal 권, bad 를 misses 번 넘게 잡으면 실패
//     chests  진짜 명작을 찾아라: 📜 든 상자를 따라가서 고르기. stages 단계를 다 맞혀야 성공 (n: 상자 수, swaps: 섞는 횟수, speed: 한 번 섞는 ms)
//             decoys: 가짜 상자 속 물건 (🧾 영수증 · 🕸️ 거미줄 · 🧦 양말 그림이 있어요). 구구독의 돋보기로 한 번 힌트를 볼 수 있어요
//     flight  구름 고리 통과: 꾹 누르면 위로, 떼면 아래로. rings 개 중 need 개 통과 (ringSize: 고리 크기, gap: 고리 간격 ms, speed, storms: 먹구름 나올 확률)
// endings: 결말. kind 'best' 최고의 화해 / 'good' 화해 / 'bad' 아직 화해 못 함 (찾은 결말 모음에는 화해 결말 3개만 모여요)
//   who 는 마지막 한마디를 하는 캐릭터

window.STORY = {
  intro: {
    title: '구구독 구구덕의 책 속 대결',
    // 첫 화면: 둘이 말풍선으로 다투는 모습 (pose: 캐릭터 그림)
    fight: [
      { who: 'dok', pose: 'dok-books', line: '책이 최고야!' },
      { who: 'duk', pose: 'duk-music', line: '아냐, 취향이 최고야!' },
    ],
    text: '독서탐험가 구구독과 취향 큐레이터 구구덕이 한판 붙었다.\n누구 편을 들지, 어떻게 풀지 네가 골라 줘.\n결말은 9개. 둘이 화해하는 결말은 단 3개야!',
    start: '이야기 펼치기',
  },
  found: '찾은 화해 결말',
  again: '다른 길로 다시 하기',
  allFound: '화해 결말 3개를 다 찾았어! 이제 너는 책도 취향도 아는 진짜 독서가야! 🏆',
  labels: { best: '🏆 최고의 화해 결말', good: '🤝 화해 결말', bad: '💢 아직 화해 못 한 결말' },
  items: {
    note: { emoji: '📒', name: '취향 노트' },
    bookmark: { emoji: '🔖', name: '명작 책갈피' },
  },

  scenes: {
    start: {
      pose: 'duo-cart',
      text: '문 닫은 도서관. "이달의 추천 코너"를 꾸미던 둘이 딱 멈췄다.\n구구독 손에는 두꺼운 명작, 구구덕 손에는 알록달록 만화책.',
      talk: [
        ['dok', '추천 코너엔 명작이지! 좋은 책은 누가 읽어도 좋은 법이야.'],
        ['duk', '무슨 소리! 취향에 안 맞으면 명작도 수면제야. 취향이 최고라고!'],
      ],
      after: '투닥투닥 다투는 사이, 서가에서 낡은 책 한 권이 번쩍 빛났다.\n표지에 글자가 떠올랐다. 『누가 옳은지 직접 확인해 보시겠습니까?』',
      choices: [
        { text: '🧭 구구독 편! "책이 최고지"', to: 'tower' },
        { text: '💜 구구덕 편! "취향이 최고지"', to: 'market' },
      ],
    },

    // ----- 명작의 탑 (구구독 편) -----
    tower: {
      pose: 'dok-hearteyes',
      text: '구구독 편을 들자 책이 둘을 빨아들였다.\n도착한 곳은 구름까지 닿은 "명작의 탑". 세상의 명작이 빈틈없이 꽂혀 있다.\n그런데… 책을 읽는 사람이 한 명도 없다.',
      talk: [
        ['dok', '봐! 여기가 바로 천국이야!'],
        ['duk', '천국치고 너무 조용한데? 다들 어디 간 거야?'],
      ],
      after: '탑 입구에서는 올빼미 사서가 꾸벅꾸벅 졸고 있다.',
      choices: [
        { text: '🧭 구구독처럼: 올빼미가 조는 틈에 꼭대기로!', to: 'towerSneak' },
        { text: '💜 구구덕처럼: 올빼미를 깨워 말을 걸어 본다', to: 'owl' },
      ],
    },
    towerSneak: {
      pose: 'dok-shush',
      text: '구구독이 앞장섰다. "명작은 기다려 주지 않아!"\n올빼미가 고개를 들 때마다 멈춰야 한다.',
      game: { type: 'freeze', title: '무궁화 꽃이 피었습니다!', how: '버튼(또는 그림)을 꾹 누르고 있으면 계단을 올라가. 올빼미가 눈을 뜨면 얼른 손을 떼!',
        button: '👣 꾹 누르고 오르기', watcher: '🦉', goalIcon: '📚', safe: '쿨… 쿨…', warn: '…음?', look: '👀 거기 누구냐!', time: 5, limit: 15,
        win: 'top', lose: 'owlRules' },
    },
    owl: {
      pose: 'duk-think',
      text: '올빼미가 부스스 눈을 떴다.\n"이 탑엔 명작이 다 있는데 아무도 안 와. 사실… 나도 이제 책이 지겨워."',
      talk: [['duk', '명작이 문제가 아니라 취향을 몰라서 그래. 내가 딱 맞는 책을 골라 줄게!']],
      game: { type: 'match', title: '취향 저격 책 추천!', how: '올빼미 취향에 딱 맞는 명작을 골라 줘!', who: '🦉 올빼미 사서',
        likes: ['밤하늘', '수수께끼', '조용한 곳'],
        books: [
          { emoji: '🌌', title: '별자리에 숨은 수수께끼', ok: true },
          { emoji: '🎉', title: '시끌벅적 파티 대백과' },
          { emoji: '⏰', title: '아침형 인간 되는 법' },
        ],
        win: 'owlHappy', lose: 'owlYawn' },
    },
    owlHappy: {
      pose: 'duk-wave',
      text: '"바로 이거야! 밤새 읽어도 안 지겹겠어!"\n올빼미는 고맙다며 낡은 노트를 건넸다. 탑을 찾았던 손님들의 취향이 빼곡히 적혀 있다.',
      get: 'note',
      talk: [['dok', '…명작도 맞는 사람을 만나니까 반짝이네.']],
      choices: [{ text: '🗼 꼭대기로 올라간다', to: 'top' }],
    },
    top: {
      pose: 'dok-books',
      text: '꼭대기 서재에 닿는 순간, 우르르르!\n아무도 펼치지 않은 명작들이 너무 무거워져 탑이 기울기 시작했다.',
      talk: [['dok', '내가 받칠게! 명작을 무너지게 둘 순 없어!']],
      game: { type: 'tower', title: '탑을 받쳐라!', how: '책 탑이 자꾸 기울어! 버튼(또는 그림)을 연타해서 밀어 받쳐. 버티는 동안 구구덕이 받침대를 들고 달려와!', button: '💪 영차!', time: 7, power: 0.08, win: 'topSaved', lose: 'avalanche' },
    },
    topSaved: {
      pose: 'dok-read',
      text: '구구덕이 끼운 받침대 덕분에 탑이 멈췄다. 숨을 고르던 구구독이 작게 말했다.',
      talk: [
        ['dok', '좋은 책도 펼쳐 주는 사람이 없으면… 그냥 무거운 종이구나.'],
        ['duk', '그 사람을 찾아 주는 게 내 일이고. 우리, 같이 하면 되잖아?'],
      ],
      choices: [
        { text: '🏷️ 명작마다 "이런 친구에게 추천!" 이름표를 단다', to: 'nameTag' },
        { text: '📒 취향 노트로 손님마다 딱 맞는 명작을 찾아 준다', to: 'together', need: 'note' },
      ],
    },

    // ----- 취향 시장 (구구덕 편) -----
    market: {
      pose: 'duk-wave',
      text: '구구덕 편을 들자 책이 둘을 빨아들였다.\n도착한 곳은 알록달록 "취향 시장". 가게마다 "당신 취향만 팝니다!" 간판이 걸려 있다.',
      talk: [
        ['duk', '봤지? 다들 좋아하는 책만 읽으니까 행복하잖아!'],
        ['dok', '근데 저기… 저 용은 왜 울상이야?'],
      ],
      after: '꼬마 용이 공룡 책 더미 위에서 한숨을 쉬었다.\n"공룡 책만 백 권째야. 이제 뭘 읽어도 다 똑같아…"',
      choices: [
        { text: '💜 구구덕처럼: 용 취향에 맞는 책을 골라 준다', to: 'dragonCatch' },
        { text: '🧭 구구독처럼: 아무도 안 가 본 서가를 탐험한다', to: 'mystery' },
      ],
    },
    dragonCatch: {
      pose: 'duk-search',
      text: '"용 취향 분석 완료! 공룡, 불, 보물!"\n시장 하늘로 책들이 둥실둥실 떠오른다. 용 취향인 책만 골라 잡자!',
      game: { type: 'catch', title: '취향 책 잡기!', how: '용 취향 책만 톡톡! 10초 안에 5권 잡으면 성공. 엉뚱한 책은 조심!', who: '🐲 꼬마 용',
        likes: ['공룡', '불 뿜기', '보물'],
        good: ['🦖 공룡 대백과 2', '🔥 불꽃 공룡의 비밀', '💰 공룡 보물 지도', '🦕 공룡 화석 탐사', '🌋 화산과 공룡'],
        bad: ['🧁 컵케이크 굽기', '🧊 얼음 왕국', '🐟 금붕어 키우기'],
        goal: 5, time: 10, misses: 2, win: 'dragonSame', lose: 'dragonSneeze' },
    },
    dragonSame: {
      pose: 'duk-think',
      text: '책을 한 아름 안겨 주자 용이 시큰둥하게 말했다.\n"고마워… 근데 이것도 다 공룡 책이잖아."',
      talk: [
        ['duk', '어… 취향에 딱 맞는데 왜 안 신나지?'],
        ['dok', '취향 밖에도 재밌는 게 있다는 걸 모르면, 취향이 울타리가 돼 버리는 거야.'],
      ],
      after: '용이 날개를 펼쳤다. "그럼 너희가 아는 다른 세상을 보여 줘!"',
      choices: [{ text: '🐲 용 등에 탄다', to: 'ride' }],
    },
    mystery: {
      pose: 'dok-wave',
      text: '구구독이 시장 끝에서 "아무도 안 가는 서가"를 찾아냈다.\n먼지 쌓인 상자 세 개. 그중 하나에 진짜 명작이 들어 있다.',
      talk: [['dok', '탐험가의 눈을 믿어 봐!']],
      game: { type: 'chests', title: '진짜 명작을 찾아라!', how: '📜 진짜 명작이 든 상자를 눈으로 쫓아가서 골라! 2단계까지 맞히면 성공.',
        stages: [{ n: 3, swaps: 5, speed: 560 }, { n: 4, swaps: 7, speed: 430 }], decoys: ['🧾', '🕸️', '🧦'],
        win: 'mysteryWin', lose: 'wrongGenre' },
    },
    mysteryWin: {
      pose: 'dok-hearteyes',
      text: '상자 속엔 『용과 별을 잇는 사다리』라는 낡은 모험 소설이 들어 있었다.\n책 사이엔 반짝이는 책갈피가 꽂혀 있었다.',
      get: 'bookmark',
      talk: [['duk', '공룡 책은 아닌데… 용이 좋아하는 하늘이랑 보물이 다 들어 있잖아?']],
      after: '책을 받아 든 용의 눈이 반짝였다. "태워 줄게! 다른 세상도 보여 줘!"',
      choices: [{ text: '🐲 용 등에 탄다', to: 'ride' }],
    },
    ride: {
      pose: 'duo-stand',
      text: '용이 하늘로 솟구쳤다! 앞에 구름 고리가 줄지어 있다.\n고리를 통과해야 시장 너머로 날아갈 수 있다.',
      game: { type: 'flight', title: '구름 고리 통과!', how: '그림을 꾹 누르면 용이 위로, 떼면 아래로 날아. 고리 8개 중 5개를 통과해!', rings: 8, need: 5, ringSize: 42, gap: 1800, speed: 105, storms: 0.4, win: 'landed', lose: 'cloudFight' },
    },
    landed: {
      pose: 'duk-read',
      text: '구름을 뚫고 내려앉은 곳은 처음 보는 책 마을.\n용은 신이 나서 처음 보는 장르의 책을 하나씩 펼쳤다.',
      talk: [
        ['duk', '내 취향이 최고인 줄 알았는데… 취향도 넓힐 수 있는 거였어.'],
        ['dok', '그리고 그 첫 책은 네가 골라 주면 딱이지!'],
      ],
      choices: [
        { text: '🗺️ 좋아하는 책에서 새 책으로 가는 "취향 탐험 지도"를 만든다', to: 'openDoor' },
        { text: '🔖 명작 책갈피를 용의 새 책에 꽂아 준다', to: 'together', need: 'bookmark' },
      ],
    },
  },

  endings: {
    together: {
      emoji: '🤝', name: '구구 추천 코너', kind: 'best',
      pose: 'duo-cart', who: 'dok',
      text: '다음 날 아침, 구미도서관에 새 코너가 생겼다.\n구구독이 고른 명작과 구구덕이 찾은 취향이 짝을 이룬 "구구 추천 코너".\n"책이 최고야!" "취향이 최고야!" 둘은 여전히 우기지만, 이제는 같은 편이다.',
      line: '책도 최고, 취향도 최고! 둘이 만나면 더 최고!',
    },
    nameTag: {
      emoji: '🏷️', name: '명작에 이름표를', kind: 'good',
      pose: 'duo-stand', who: 'duk',
      text: '책 밖으로 돌아온 둘은 추천 코너를 다시 꾸몄다.\n명작마다 "모험을 좋아하는 친구에게", "밤하늘을 좋아하는 친구에게" 이름표가 달렸다.',
      line: '좋은 책에 취향 이름표를 붙이니까 딱이네!',
    },
    openDoor: {
      emoji: '🗺️', name: '취향 탐험 지도', kind: 'good',
      pose: 'dok-hearteyes', who: 'dok',
      text: '도서관으로 돌아온 둘은 커다란 지도를 그렸다.\n"공룡을 좋아한다면 → 화산 과학책 → 별자리 모험 소설!"\n좋아하는 책에서 출발해 새로운 책까지 가는 길이다.',
      line: '취향에서 출발하는 탐험, 이게 진짜 모험이지!',
    },
    owlRules: {
      emoji: '📝', name: '정숙 규칙 백 번 쓰기', kind: 'bad',
      pose: 'duk-shush', who: 'duk',
      text: '"거기 누구냐!" 올빼미에게 딱 걸렸다.\n벌로 "도서관에서는 조용히" 백 번 쓰기.\n쓰면서도 둘은 속닥속닥 다퉜다. "네가 서둘러서 그래!" "네가 꾸물대서지!"',
      line: '…다음엔 조금만 천천히 가자.',
    },
    owlYawn: {
      emoji: '🥱', name: '올빼미의 하품', kind: 'bad',
      pose: 'dok-shush', who: 'dok',
      text: '"시끌벅적 파티라니… 하아암." 올빼미가 그대로 잠들어 버렸다.\n탑 문은 잠기고, 둘은 계단에 앉아 누가 잘못했는지 밤새 따졌다.',
      line: '취향을 잘못 읽으면… 명작보다 더 지루하구나.',
    },
    avalanche: {
      emoji: '📚', name: '책 눈사태', kind: 'bad',
      pose: 'duk-think', who: 'duk',
      text: '와르르르! 명작들이 눈사태처럼 쏟아졌다.\n책 더미에서 머리만 쏙 내민 둘. "네 명작 때문이야!" "네가 같이 안 받쳐서지!"',
      line: '…일단 책부터 같이 정리하자.',
    },
    dragonSneeze: {
      emoji: '🔥', name: '용의 재채기', kind: 'bad',
      pose: 'dok-wink', who: 'dok',
      text: '"컵케이크 책?! 에… 에취!" 용의 재채기에 불꽃이 퐁!\n털끝이 살짝 그을린 둘은 시장 바닥에서 또 티격태격.',
      line: '취향을 제대로 읽는 것도 실력이구나…',
    },
    wrongGenre: {
      emoji: '🧾', name: '엉뚱한 장르', kind: 'bad',
      pose: 'duk-think', who: 'duk',
      text: '상자 속엔 『세금 계산 입문』이 들어 있었다.\n용은 세 쪽 만에 코를 골았고, 둘은 "그러게 내 말 듣지!" 하며 또 다퉜다.',
      line: '탐험도 좋지만, 읽을 사람을 생각해야지!',
    },
    cloudFight: {
      emoji: '☁️', name: '구름 위 말다툼', kind: 'bad',
      pose: 'dok-books', who: 'dok',
      text: '구름 고리에 걸린 용이 휘청! 둘은 폭신한 구름 위로 툭 떨어졌다.\n"네가 왼쪽이라며!" "오른쪽이랬지!" 구름 위에서도 말다툼은 계속됐다.',
      line: '그래도… 같이 떨어져서 다행이다.',
    },
  },
};
