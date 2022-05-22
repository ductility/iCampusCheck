# Icampus Check Plus (아캠체크 플러스)

<img src="https://user-images.githubusercontent.com/100834069/169684375-9c2bb4ec-157c-4709-b9ff-e5fae1bbe113.png">

오픈소스실습 팀 프로젝트로 기존 아이캠퍼스 체크 플러스의 기능과 가시성을 향상시켰습니다.

원본 : https://github.com/ductility/iCampusCheck

## 사용법
<img src="https://raw.githubusercontent.com/ductility/images/master/iCampusCheck(0.1.0).gif">

[아캠체크](https://chrome.google.com/webstore/detail/icampus-check/hackfjdbiccajlckgjnkejepipjjbepm?hl=ko) 를 크롬 웹 스토어에서 설치하고 canvas.skku.edu에 로그인 한 뒤 확장프로그램 아이콘을 누르면 실행됩니다.   
잠시 로딩을 기다리면 마감기한이 남은 강의와 과제를 남은시간이 적은 순으로 보여줍니다.

## 주의사항

* 새 창에 어떤 과목의 <출결/학습현황>목록이 뜨는 것은 api 사용을 위한 토큰 쿠키를 발행하기 위한 과정입니다. 오류가 아닙니다.

## 다음에 추가할 것
* Option Page를 추가해 별도 tab에 내용 더 보기 좋게 기재하기

## 버전별 추가 내용
* 1.0.0
기존 아이캠퍼스 체크 플러스의 기능 향상
과제 및 평가에서도 가져올 수 있게 함


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
