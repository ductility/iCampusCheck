# Icampus Check(아캠체크)

<img src="https://raw.githubusercontent.com/ductility/iCampusCheck/master/icon.png">

지금 차세대 아이캠퍼스는 들어야 할 강의와 해야할 과제를 확인하기가 너무 불편합니다.
그래서 버튼 클릭으로 한눈에 할 일을 확인할 수 있는 크롬확장프로그램을 만들었습니다.

## 사용법
<img src="https://raw.githubusercontent.com/ductility/images/master/iCampusCheck(0.1.0).gif">

[아캠체크](https://chrome.google.com/webstore/detail/icampus-check/hackfjdbiccajlckgjnkejepipjjbepm?hl=ko) 를 크롬 웹 스토어에서 설치하고 canvas.skku.edu에 로그인 한 뒤 확장프로그램 아이콘을 누르면 실행됩니다.   
잠시 로딩을 기다리면 마감기한이 남은 강의와 과제를 남은시간이 적은 순으로 보여줍니다.

## 주의사항
* <강의콘텐츠>에 속해있는 자료의 출결/제출 여부를 <출결/학습현황>에서 받아오는 것이기 때문에 **<과제 및 평가>항목**이 따로 있는 강의는 과제를 받아오지 못합니다. 그런 과목은 따로 확인해 주셔야 합니다.
* 새 창에 어떤 과목의 <출결/학습현황>목록이 뜨는 것은 api 사용을 위한 토큰 쿠키를 발행하기 위한 과정입니다. 오류가 아닙니다.

## 다음에 추가할 것
* 1일 미만 남으면 강조표시
* 과제 및 평가에서도 가져오기

## 버전별 추가 내용
* **0.0.2**
>수강 철회한 과목 데이터 수집으로 인한 오류 해결
* **0.0.3**
>과목, 강의/과제 제목에서 언더바(_)를 제거해서 자동 줄바꿈이 되게 함
* **0.1.0** 
>신아캠(canvas.skku.edu)에서만 아이콘 활성화 되게 함   
아직 열리지 않은 강의/과제는 목록에서 제외   
강의/과제를 클릭하면 새 창에 강의/과제가 열림   
'과제 및 평가' 항목이 있는 과목은 가져오지못함을 알리는 툴팁 추가

* **0.1.1** 
>도전학기 강의도 불러올 수 있게 변경   
툴팁 삭제

## 참고 URL
* Chrome Extension, Getting Started Tutorial   
https://developer.chrome.com/extensions/getstarted
* Chrome Extension, Page Action
https://developer.chrome.com/extensions/pageAction
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