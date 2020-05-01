# Icampus Check(아캠체크)

<img src="https://raw.githubusercontent.com/ductility/iCampusCheck/master/icon.png">

지금 차세대 아이캠퍼스는 들어야 할 강의와 해야할 과제를 확인하기가 너무 불편합니다.
그래서 버튼 클릭으로 한눈에 할 일을 확인할 수 있는 구글확장프로그램을 만들었습니다.

## 사용법
구글확장프로그램을 받은 후, canvas.skku.edu에 로그인 한 뒤 확장프로그램 버튼을 누르면 실행됩니다.   
잠시 로딩을 기다리면 마감기한이 남은 강의와 과제를 남은시간이 적은 순으로 보여줍니다.

## 주의사항
* <강의콘텐츠>에 속해있는 자료의 출결/제출 여부를 <출결/학습현황>에서 받아오는 것이기 때문에 **<과제 및 평가>항목**이 따로 있는 강의는 과제를 받아오지 못합니다. 그런 과목은 따로 확인해 주셔야 합니다.
* 새 창에 어떤 과목의 <출결/학습현황>목록이 뜨는 것은 api 사용을 위한 토큰 쿠키를 발행하기 위한 과정입니다. 오류가 아닙니다.

## 다음에 추가할 것
* 아직 안열린 강의, 과제는 제외하기
* 들어야 할 강의를 클릭하면 그 강의로 이동
* 1일 미만 남으면 강조표시

## 참고 URL
* Chrome Extension, Getting Started Tutorial
https://developer.chrome.com/extensions/getstarted
* 생활코딩, 웹페이지에서 공부한 단어의 수를 세기 (크롬 확장 기능 만들기)   
https://opentutorials.org/module/2503/14051
* 유튜브 서기, 크롬확장프로그램 만들기 #1. 특정 사이트의 input값 변경하기   
https://www.youtube.com/watch?v=f3NLUDVB23Q
* Postman을 이용한 크롤링   
https://brunch.co.kr/@joypinkgom/86
* 코딩팩토리, Ajax를 활용하여 다른페이지에 있는 데이터 받아오기   
https://coding-factory.tistory.com/144
* Stack OverFlow, Chrome Extension “Refused to load the script because it violates the following Content Security Policy directive”   
https://stackoverflow.com/questions/34950009/chrome-extension-refused-to-load-the-script-because-it-violates-the-following-c