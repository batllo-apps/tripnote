tools/ — 앱 실행에는 필요 없는 개발용 파일이에요.

i18n/  영어 번역 만들기
  - en.txt, en2.txt : 한국어 문장 번호 → 영어 번역
  - build.py        : 번역표를 읽어 ../../i18n.js 를 다시 만들어요 (python3 tools/i18n/build.py)
  - 새 한국어 문구를 넣었으면 build.py 안의 exact.update({...}) 에 '한국어':'English' 를 추가하고 다시 실행해요.

test/  가짜 서버로 폰 2대 테스트
  - server.js + fake-fb.js : Firebase 대신 쓰는 가짜 서버 (node server.js <앱폴더> <fake-fb.js 경로>, 포트 8770)
  - two.js : Playwright로 폰 2대가 같은 여행을 쓰는 시나리오 예시 (SP=<사진 폴더> node two.js)
