// 구구덕의 독서 취향 테스트
// - questions: 질문과 보기. 보기마다 type(결과 유형)에 1점씩 더해요.
// - results: 가장 점수가 높은 유형이 결과로 나와요. (같으면 그중 하나)
// - pose: 그 화면에 보여 줄 캐릭터 그림 이름 (images/chars.js 에 있는 이름)

window.QUIZ = {
  intro: {
    pose: 'duk-wave',
    title: '구구덕의 독서 취향 테스트',
    text: '안녕! 나는 취향 큐레이터 구구덕이야. 질문 10개에 답하면 너의 독서 취향을 찾아 줄게!',
    start: '테스트 시작하기',
  },
  questions: [
    { q: '주말 오후, 나는?', pose: 'duk-think', options: [
      { text: '가 본 적 없는 동네로 탐방 가기', type: 'adv' },
      { text: '좋아하는 노래 틀어 놓고 일기 쓰기', type: 'emo' },
      { text: '방탈출 카페에서 수수께끼 풀기', type: 'mys' },
      { text: '궁금한 걸 끝까지 찾아보기', type: 'know' },
      { text: '친구랑 웃긴 영상 보며 깔깔대기', type: 'fun' },
    ] },
    { q: '영화를 고른다면?', pose: 'duk-search', options: [
      { text: '마법과 모험이 가득한 판타지', type: 'adv' },
      { text: '마음이 몽글해지는 성장 영화', type: 'emo' },
      { text: '마지막에 깜짝 놀라는 반전 스릴러', type: 'mys' },
      { text: '진짜 있었던 일을 다룬 다큐', type: 'know' },
      { text: '배꼽 잡는 코미디', type: 'fun' },
    ] },
    { q: '하나만 가질 수 있다면, 어떤 초능력?', pose: 'duk-think', options: [
      { text: '어디든 갈 수 있는 순간이동', type: 'adv' },
      { text: '다른 사람의 마음 읽기', type: 'emo' },
      { text: '거짓말을 단번에 알아채기', type: 'mys' },
      { text: '한 번 본 건 다 기억하기', type: 'know' },
      { text: '모두를 웃게 만드는 개그 능력', type: 'fun' },
    ] },
    { q: '친구들 사이에서 나는?', pose: 'duk-shush', options: [
      { text: '새로운 걸 먼저 해 보자는 사람', type: 'adv' },
      { text: '고민을 잘 들어 주는 사람', type: 'emo' },
      { text: '숨은 단서를 잘 찾는 눈치왕', type: 'mys' },
      { text: '물어보면 척척 대답하는 박사', type: 'know' },
      { text: '분위기를 띄우는 분위기 메이커', type: 'fun' },
    ] },
    { q: '책을 고를 때 가장 먼저 보는 건?', pose: 'duk-search', options: [
      { text: '두근거리는 제목', type: 'adv' },
      { text: '예쁜 표지와 마음에 남는 문장', type: 'emo' },
      { text: '뒤표지의 수상한 줄거리', type: 'mys' },
      { text: '목차와 새로 알게 될 내용', type: 'know' },
      { text: '그림이나 만화가 있는지', type: 'fun' },
    ] },
    { q: '도서관에서 앉고 싶은 자리는?', pose: 'duk-read', options: [
      { text: '아무도 안 가 본 서가 끝', type: 'adv' },
      { text: '햇살이 드는 창가', type: 'emo' },
      { text: '조용하고 아늑한 구석 자리', type: 'mys' },
      { text: '넓은 책상이 있는 자리', type: 'know' },
      { text: '푹신한 빈백', type: 'fun' },
    ] },
    { q: '여행을 간다면 어디로?', pose: 'duk-wave', options: [
      { text: '지도에 없는 숲속 오두막', type: 'adv' },
      { text: '바다가 보이는 조용한 마을', type: 'emo' },
      { text: '비밀의 방이 있는 오래된 성', type: 'mys' },
      { text: '볼거리가 가득한 박물관', type: 'know' },
      { text: '신나는 놀이공원', type: 'fun' },
    ] },
    { q: '하루 중 가장 좋아하는 시간은?', pose: 'duk-think', options: [
      { text: '새로운 일을 시작하는 아침', type: 'adv' },
      { text: '노을 지는 저녁', type: 'emo' },
      { text: '모두 잠든 조용한 밤', type: 'mys' },
      { text: '집중이 잘 되는 오후', type: 'know' },
      { text: '친구들이랑 노는 쉬는 시간', type: 'fun' },
    ] },
    { q: '선물로 받고 싶은 건?', pose: 'duk-shush', options: [
      { text: '세계 지도와 나침반', type: 'adv' },
      { text: '예쁜 엽서와 다이어리', type: 'emo' },
      { text: '비밀번호 자물쇠 상자', type: 'mys' },
      { text: '망원경이나 현미경', type: 'know' },
      { text: '웃긴 캐릭터 굿즈', type: 'fun' },
    ] },
    { q: '내가 책 속 주인공이라면?', pose: 'duk-music', options: [
      { text: '용과 맞서는 용감한 모험가', type: 'adv' },
      { text: '친구의 마음을 위로하는 단짝', type: 'emo' },
      { text: '사건을 해결하는 명탐정', type: 'mys' },
      { text: '세상을 바꾼 발명가', type: 'know' },
      { text: '모두를 웃게 만드는 장난꾸러기', type: 'fun' },
    ] },
  ],
  results: {
    adv: {
      emoji: '🧭', name: '모험 탐험가형', pose: 'dok-wink',
      text: '새로운 세계로 떠나는 걸 좋아하는 너는 구구독이랑 똑같은 탐험가! 책장을 넘길 때마다 낯선 곳으로 여행하는 기분을 즐겨.',
      genres: ['판타지', '모험 소설', 'SF', '여행 에세이'],
    },
    emo: {
      emoji: '💌', name: '감성 수집가형', pose: 'dok-hearts',
      text: '마음에 오래 남는 문장을 모으는 너! 이야기 속 사람들의 마음에 깊이 공감하고, 좋아하는 구절을 따로 적어 두기도 해.',
      genres: ['에세이', '시집', '성장 소설', '그림책'],
    },
    mys: {
      emoji: '🔍', name: '추리 탐정형', pose: 'duk-search',
      text: '숨은 단서를 찾아내는 게 제일 재밌는 너! 마지막 장까지 범인을 추리하며 두근두근 읽는 걸 좋아해.',
      genres: ['추리 소설', '미스터리', '스릴러', '퍼즐·수수께끼 책'],
    },
    know: {
      emoji: '🔬', name: '지식 탐구형', pose: 'dok-read',
      text: '"왜?"라는 질문이 끝이 없는 너! 새로운 사실을 알게 될 때 가장 신나고, 읽고 나면 친구들에게 알려 주고 싶어져.',
      genres: ['과학', '역사', '인물 이야기', '교양 책'],
    },
    fun: {
      emoji: '😆', name: '웃음 충전형', pose: 'duk-music',
      text: '읽으면서 깔깔 웃을 수 있는 책이 최고인 너! 재미있게 읽다 보면 어느새 한 권을 다 읽고 있어.',
      genres: ['만화', '유머 소설', '웹툰 원작 책', '학교생활 이야기'],
    },
  },
  // 결과 화면 아래에 구구덕이 하는 말
  outro: '너의 취향을 찾을 수 있게 앞으로 노력할게! 홈페이지에 추천되어 있는 사서 추천 큐레이션도서 중에서 이 장르의 책을 찾아보는 건 어때?',
};
