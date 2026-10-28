// 구구독 구구덕의 스무고개 게임
// 구구독·구구덕이 이야기 속 주인공 한 명이 되어 숨어요. 질문을 골라 물으면 "응!" 또는 "아니!"로 대답해요.
// - 화면에 주인공 후보 카드 12장이 나오고, 대답과 맞지 않는 후보는 흐려져요.
// - 질문 하나 = 한 고개, 틀린 카드를 누르면 두 고개가 지나가요. 스무 고개 안에 카드를 눌러 맞히면 돼요.
// - 적은 고개로 맞힐수록 점수가 높아요 (scores). 한 게임에 3문제.
// - 주인공은 모두 전래동화이거나 저작권이 끝난 옛 명작이에요.
//
// 주인공을 더하거나 고칠 때:
// - yes: 아래 questions 중 "응!"이라고 대답할 질문의 id. 여기 없는 질문은 모두 "아니!"예요.
// - about: 맞힌 뒤 주인공이 하는 한마디
// - we: true 는 주인공이 여럿이라 "우리는"으로 말해요

window.RIDDLE = {
  intro: {
    pose: 'duk-search',
    title: '구구독 구구덕의 스무고개 게임',
    text: '구구독이랑 구구덕이 이야기 속 주인공으로 변신해서 숨을게! 질문을 골라 물어보면 "응!" 아니면 "아니!"로만 대답해 줄게. 스무 고개 안에 누구인지 맞혀 봐. 모두 3문제야!',
    start: '스무고개 시작',
  },
  rounds: 3,
  limit: 20,           // 고개 수
  wrongCost: 2,        // 틀린 카드를 누르면 지나가는 고개 수
  boardSize: 12,       // 후보 카드 수
  // 쓴 고개 수에 따른 점수: 4고개 이하 5점, 6고개 이하 4점 …
  scores: [{ upTo: 4, pts: 5 }, { upTo: 6, pts: 4 }, { upTo: 9, pts: 3 }, { upTo: 13, pts: 2 }, { upTo: 20, pts: 1 }],
  ask: '나는 이야기 속 주인공이야. 질문해서 누구인지 맞혀 봐!',
  yesLines: ['응! 맞아.', '응, 그래!', '딩동, 맞아!'],
  noLines: ['아니!', '아니야~', '땡, 아니야.'],
  lastOne: '이제 한 명만 남았어! 카드를 눌러서 맞혀 봐!',
  wrongGuess: ['땡! 나는 그 주인공이 아니야. 두 고개가 지나갔어!', '아니야~ 다시 생각해 봐! (두 고개 지나감)'],
  right: ['딩동댕! 정답이야!', '맞았어! 대단한걸?', '정답! 이야기 박사구나!'],
  timeUp: '스무 고개를 다 넘었어! 정답을 알려 줄게.',
  results: [
    { min: 12, emoji: '🏆', name: '스무고개 박사', pose: 'dok-hearts', text: '딱 필요한 질문만 골라서 척척! 이야기 속 주인공을 다 꿰고 있구나.' },
    { min: 7, emoji: '🔍', name: '이야기 탐정', pose: 'duk-search', text: '질문을 잘 골랐어! 조금만 더 읽으면 스무고개 박사가 될 거야.' },
    { min: 0, emoji: '📖', name: '이야기 새싹', pose: 'dok-read', text: '오늘 만난 주인공들 이야기를 읽어 보면 다음엔 더 잘 맞힐 수 있어!' },
  ],
  outro: '오늘 만난 주인공들이 나오는 책은 도서관에서 찾아볼 수 있어. 한번 읽어 볼래?',

  // 물어볼 수 있는 질문 (id 는 yes 목록에 쓰는 이름)
  questions: [
    { id: 'kor', q: '우리나라 옛이야기야?' },
    { id: 'human', q: '사람 모습이야?' },
    { id: 'animal', q: '동물이야?' },
    { id: 'female', q: '여자 주인공이 있어?' },
    { id: 'group', q: '주인공이 여럿이야?' },
    { id: 'old', q: '할아버지나 할머니야?' },
    { id: 'royal', q: '왕이나 공주가 나와?' },
    { id: 'siblings', q: '형제나 자매가 나와?' },
    { id: 'stepmom', q: '새어머니가 나와?' },
    { id: 'sea', q: '바다에 간 적 있어?' },
    { id: 'sky', q: '하늘을 날거나 하늘에 올라가 봤어?' },
    { id: 'forest', q: '숲이나 산속에 간 적 있어?' },
    { id: 'journey', q: '먼 곳으로 여행을 떠나?' },
    { id: 'magic', q: '마법이나 신기한 일이 일어나?' },
    { id: 'small', q: '몸이 작아지거나 아주 작은 사람이 나와?' },
    { id: 'beast', q: '무서운 동물이 나와?' },
    { id: 'clever', q: '꾀를 내서 위기를 넘겨?' },
    { id: 'villain', q: '욕심쟁이나 심술쟁이야?' },
    { id: 'kind', q: '착한 마음씨 덕분에 복을 받아?' },
    { id: 'treasure', q: '보물이나 금을 얻어?' },
    { id: 'music', q: '노래나 음악이 나와?' },
  ],

  characters: [
    // ----- 전래동화·옛이야기 -----
    { name: '흥부', book: '흥부와 놀부', about: '다친 제비를 고쳐 줬더니, 박에서 금은보화가 쏟아져 나왔어!',
      yes: ['kor', 'human', 'siblings', 'magic', 'kind', 'treasure'] },
    { name: '놀부', book: '흥부와 놀부', about: '욕심을 부려 제비 다리를 다치게 했더니, 박에서 도깨비가 나왔어…',
      yes: ['kor', 'human', 'siblings', 'magic', 'villain'] },
    { name: '콩쥐', book: '콩쥐 팥쥐', about: '두꺼비와 새들의 도움을 받았고, 잃어버린 꽃신 덕분에 원님을 만났어.',
      yes: ['kor', 'human', 'female', 'siblings', 'stepmom', 'magic', 'kind'] },
    { name: '팥쥐', book: '콩쥐 팥쥐', about: '언니 콩쥐를 샘내고 괴롭혔다가 벌을 받았어.',
      yes: ['kor', 'human', 'female', 'siblings', 'stepmom', 'villain'] },
    { name: '심청', book: '심청전', about: '아버지 눈을 뜨게 하려고 인당수에 뛰어들었다가 연꽃을 타고 돌아왔어.',
      yes: ['kor', 'human', 'female', 'royal', 'sea', 'magic', 'kind'] },
    { name: '토끼', book: '토끼전 (별주부전)', about: '"간을 육지에 두고 왔어요!" 하고 꾀를 내서 용궁을 빠져나왔어.',
      yes: ['kor', 'animal', 'royal', 'sea', 'journey', 'clever'] },
    { name: '자라', book: '토끼전 (별주부전)', about: '아픈 용왕님을 위해 토끼를 데리러 육지까지 갔어.',
      yes: ['kor', 'animal', 'royal', 'sea', 'journey'] },
    { name: '홍길동', book: '홍길동전', about: '활빈당을 만들어 가난한 사람들을 돕고, 율도국의 왕이 되었어.',
      yes: ['kor', 'human', 'royal', 'journey', 'magic', 'clever', 'kind'] },
    { name: '혹부리 영감', book: '혹부리 영감', about: '도깨비들 앞에서 노래를 불렀더니 혹을 떼 주고 보물까지 줬어.',
      yes: ['kor', 'human', 'old', 'forest', 'magic', 'kind', 'treasure', 'music'] },
    { name: '해와 달이 된 오누이', book: '해님 달님', we: true, about: '호랑이를 피해 하늘에서 내려온 동아줄을 타고 올라가 해와 달이 되었어.',
      yes: ['kor', 'human', 'female', 'group', 'siblings', 'sky', 'magic', 'beast', 'clever'] },
    { name: '정직한 나무꾼', book: '금도끼 은도끼', about: '쇠도끼가 내 것이라고 솔직하게 말해서 금도끼, 은도끼까지 받았어.',
      yes: ['kor', 'human', 'forest', 'magic', 'kind', 'treasure'] },
    { name: '선녀', book: '선녀와 나무꾼', about: '날개옷을 찾아 입고 아이들과 함께 하늘나라로 돌아갔어.',
      yes: ['kor', 'human', 'female', 'sky', 'forest', 'magic'] },
    { name: '까치', book: '은혜 갚은 까치', about: '나를 구해 준 선비를 살리려고 머리로 종을 세 번 울렸어.',
      yes: ['kor', 'animal', 'sky', 'forest', 'beast', 'kind'] },
    { name: '팥죽 할머니', book: '팥죽 할머니와 호랑이', about: '알밤, 자라, 멍석, 지게 친구들이 호랑이를 혼내 줬어.',
      yes: ['kor', 'human', 'female', 'old', 'beast'] },
    // ----- 세계 명작·옛이야기 -----
    { name: '피노키오', book: '피노키오의 모험', about: '거짓말을 하면 코가 길어지는 나무 인형이었는데, 진짜 소년이 되었어.',
      yes: ['human', 'sea', 'journey', 'magic', 'beast'] },
    { name: '앨리스', book: '이상한 나라의 앨리스', about: '토끼를 따라 이상한 나라에 가서 하트 여왕을 만났어.',
      yes: ['human', 'female', 'royal', 'journey', 'magic', 'small'] },
    { name: '신데렐라', book: '신데렐라', about: '요정 할머니의 마법으로 무도회에 갔다가 유리 구두를 남기고 왔어.',
      yes: ['human', 'female', 'royal', 'siblings', 'stepmom', 'magic', 'kind'] },
    { name: '헨젤과 그레텔', book: '헨젤과 그레텔', we: true, about: '과자 집의 마녀를 꾀로 물리치고 보물을 가지고 집에 돌아왔어.',
      yes: ['human', 'female', 'group', 'siblings', 'stepmom', 'forest', 'magic', 'clever', 'treasure'] },
    { name: '미운 오리 새끼', book: '미운 오리 새끼', about: '못생겼다고 놀림받았지만 사실은 아름다운 백조였어.',
      yes: ['animal', 'siblings', 'sky'] },
    { name: '인어 공주', book: '인어 공주', about: '왕자님을 만나려고 목소리를 내주고 다리를 얻었어.',
      yes: ['human', 'female', 'royal', 'sea', 'magic', 'music'] },
    { name: '빨간 모자', book: '빨간 모자', about: '할머니 댁에 가다가 늑대를 만났어. "귀가 왜 이렇게 커요?"',
      yes: ['human', 'female', 'forest', 'beast'] },
    { name: '거북이', book: '토끼와 거북이', about: '느리지만 쉬지 않고 걸어서 토끼와의 경주에서 이겼어.',
      yes: ['animal'] },
    { name: '아기 돼지 삼형제', book: '아기 돼지 삼형제', we: true, about: '늑대가 아무리 불어도 벽돌집은 끄떡없었어!',
      yes: ['animal', 'group', 'siblings', 'beast', 'clever'] },
    { name: '브레멘 음악대', book: '브레멘 음악대', we: true, about: '당나귀, 개, 고양이, 수탉이 함께 도둑들을 쫓아냈어.',
      yes: ['animal', 'group', 'journey', 'clever', 'music'] },
    { name: '엄지 공주', book: '엄지 공주', about: '다친 제비를 돌봐 줬더니 제비가 나를 꽃의 나라로 데려다줬어.',
      yes: ['human', 'female', 'royal', 'sky', 'journey', 'magic', 'small', 'kind'] },
    { name: '로빈슨 크루소', book: '로빈슨 크루소', about: '배가 부서져 아무도 없는 섬에서 오랫동안 혼자 살았어.',
      yes: ['human', 'sea', 'journey'] },
    { name: '걸리버', book: '걸리버 여행기', about: '소인국과 거인국을 모두 다녀온 여행가야.',
      yes: ['human', 'sea', 'journey', 'magic', 'small'] },
    { name: '피터 팬', book: '피터 팬', about: '어른이 되지 않는 아이로, 네버랜드에서 후크 선장과 싸웠어.',
      yes: ['human', 'sea', 'sky', 'journey', 'magic'] },
    { name: '장화 신은 고양이', book: '장화 신은 고양이', about: '장화를 신고 꾀를 내서 가난한 주인을 부자로 만들어 줬어.',
      yes: ['animal', 'royal', 'clever', 'treasure'] },
    { name: '도로시', book: '오즈의 마법사', about: '회오리바람에 날아가 노란 벽돌 길을 따라 에메랄드 시에 갔어.',
      yes: ['human', 'female', 'sky', 'journey', 'magic'] },
    { name: '잭', book: '잭과 콩나무', about: '하늘까지 자란 콩나무를 타고 올라가 거인의 성에서 보물을 가져왔어.',
      yes: ['human', 'sky', 'magic', 'clever', 'treasure'] },
    { name: '백설 공주', book: '백설 공주', about: '숲속에서 일곱 난쟁이와 살다가, 독사과를 먹고 깊은 잠에 빠졌어.',
      yes: ['human', 'female', 'royal', 'stepmom', 'forest', 'magic', 'small', 'kind'] },
  ],
};
