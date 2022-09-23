var tabId = null;
var DOMAIN = "https://canvas.skku.edu";

//html DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded',  function(tabs){
    chrome.tabs.query({currentWindow: true, active: true}, async function(tabs){
        tabId = tabs[0].id;
        // await loadJQuery();
        // await checkTokenAndRun();
        // await insertCalender();
    });
    
});

async function insertCalender(summary, description, start_time, end_time) {
    await chrome.identity.getAuthToken({ interactive: true }, function (token) {
      alert(token);
  
      //details about the event
      let event = {
        summary: summary,
        description: description,
        start: {
          'dateTime': start_time,
        // ex:  '2022-09-23T09:00:00-07:00'
          'timeZone': 'America/Los_Angeles'
        },
        end: {
          'dateTime': end_time,
          'timeZone': 'America/Los_Angeles'
        }
      };
  
      let fetch_options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      };
  
      fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        fetch_options
      )
        .then(function(response) {
            alert(JSON.stringify(response));
            response.json();
        }) // Transform the data into json
        .then(function (data) {
          console.log(data);//contains the response of the created event
        });
    });
  }


async function loadJQuery() {
    await chrome.scripting.executeScript({target: { tabId: tabId}, files: ["/jquery-3.5.0.min.js"]}, function(result) {
    })  
}

async function getXnApiTokenCookieValue() {
    let cookie = await chrome.cookies.get({
        name: "xn_api_token",
        url: DOMAIN
    });

    return cookie? cookie["value"] : null;
}


//새창열어 토큰 발행(로딩시간생각해서 반복)
async function checkTokenAndRun() {
    xn_api_token_value = await getXnApiTokenCookieValue();
    if(!xn_api_token_value){
        let results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["js/innerInjectionCode.js"]
        }, async (result) => {
    
            result = result[0]["result"];
    
            //xn_api_token이 발행되지 않았다면, https://canvas.skku.edu/api/v1/courses에서 과목id를 가져와 새 창을 연다.
            var action_url = `${DOMAIN}/courses/`+result[0]+"/external_tools/5";
            await chrome.tabs.create({ url: action_url, active: false});

            var timerID = setInterval(async function(){
                xn_api_token_value = await getXnApiTokenCookieValue();
                if(xn_api_token_value){
                    await getLearnStatus();
                    clearInterval(timerID);
                }   
            }, 500);//500ms 마다 재시도
        });
    }
    else{
        await getLearnStatus();
    }
}

//executescript.js를 실행해, 필요한 데이터 가져오기
async function getLearnStatus(){
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["js/executescript.js"],
    }, function (result) {
        if(result[0]!=null){
            result = result[0]["result"]
            var thingsToDo = sortToDo(result);
            //콜백함수 사용, Table에 강의/과제 자료를 띄운 뒤 클릭하면 해당 url로 이동할 수 있게함
            viewToDo(thingsToDo, function(){
                for(var i=0; i<thingsToDo.lecture.length; i++){
                    const id = "lecture"+i;
                    const action_url = thingsToDo.lecture[i].url;
                    document.getElementById(id).addEventListener('click', function(event){
                        console.log(action_url);
                        moveToContent(action_url);                        
                    });
                }
                for(var i=0; i<thingsToDo.assignment.length; i++){
                    const id = "assignment"+i;
                    const action_url = thingsToDo.assignment[i].url;
                    document.getElementById(id).addEventListener('click', function(event){
                        moveToContent(action_url);
                    });
                }
            });
        }
        else document.querySelector("#assignment").innerHTML = "데이터를 불러오는데 실패했습니다. 새로고침 후 재실행 해주세요";
    });
}

//새창열기
function moveToContent(action_url){
    chrome.tabs.create({ url: action_url, active: false});
}

//html에 ToDoList 띄우기
function viewToDo(thingsToDo, callback){
    var lecture = document.querySelector("#lecture");
    var assignment = document.querySelector("#assignment");
    lecture.border = 1;
    assignment.border = 1;
    var lecture_HTML = "<table class='lecture'><caption>강의</caption>" + add_HTMLTAG(thingsToDo.lecture, "lecture");
    var assignment_HTML = "<table class='assignment'><caption><span class='caption'>과제</span></caption>" + add_HTMLTAG(thingsToDo.assignment, "assignment");
    // var assignment_HTML = "<table class='assignment'><caption><span class='caption'><span class='tooltip'>과목 사이드바에 '과제 및 평가'가 있는 과목은 직접 확인해야합니다. ༼༎ຶ෴༎ຶ༽</span>과제<span class='badge'>1</span></span></caption>" + add_HTMLTAG(thingsToDo.assignment, "assignment");
    lecture.innerHTML = lecture_HTML;
    assignment.innerHTML = assignment_HTML;

    callback();
}

//table에 삽입 할 내용
function add_HTMLTAG(data, type){
    var HTML_data = '<thead><tr><th class="colum1">과목</th><th class="colum2">제목</th><th class="colum3">마감기한</th><th class="colum4">남은시간</th></tr></thead><tbody>';
    for(i=0; i<data.length; i++){
        var id = type+i;
        var row_class = ""
        if(parseInt(i%2)==0)  row_class = ' class="even"'
        HTML_data = HTML_data + `<tr${row_class}><td>${replaceUnderbar(data[i].course)}</td><td class="title" id=${id}>${replaceUnderbar(data[i].title)}</td><td>${dateToLocaleString(data[i].due)}</td><td class="colum4">${msToTime(data[i].remainingTime_ms)}</td></tr>`;
    }
    HTML_data = HTML_data + '</tbody></table>'
    return HTML_data;
}

//적게남은 시간, 과목명, 과제명 순으로 정렬
function sortToDo(thingsToDo){
    thingsToDo.lecture.sort(function(a, b){
        return a["remainingTime_ms"]-b["remainingTime_ms"];
    });
    thingsToDo.assignment.sort(function(a, b){
        return a["remainingTime_ms"]-b["remainingTime_ms"];
    });
    return thingsToDo
}

//시간차 계산
function gapTime(now, date){
    return (new Date(date)).getTime() - now.getTime();
}

//남은시간을 보기좋게 만들기
function msToTime(time_ms){
    var time_out = "";
    var minutes = parseInt((time_ms/(1000*60))%60);
    var hours = parseInt((time_ms/(1000*60*60))%24);
    var days = parseInt(time_ms/(1000*60*60*24));

    if(days>0) time_out = time_out + days + "일";
    else{
        if(hours>0) time_out = time_out + hours + "시간";
        else if(minutes>0) time_out = time_out + minutes + "분";
    }
    return time_out;
}

//마감기한을 보기좋게 만들기
function dateToLocaleString(date){
    newdate = new Date(date);
    return addSpace(newdate.getMonth()+1)+"월 "+addSpace(newdate.getDate())+"일("+dayOfWeek(newdate)+") "+newdate.toLocaleTimeString().substring(0,newdate.toLocaleTimeString().length-3);
}

//요일찾기
function dayOfWeek(date){
    var week = ['일', '월', '화', '수', '목', '금', '토'];
    return week[date.getDay()];
}

//보기좋게 하기 위해 (한자리 수)면 앞에 공백 추가, 글꼴 수정한다면, 여기 수정해야함!!
function addSpace(num){
    if(num<10) return "&nbsp&nbsp"+num;
    else return num;
}

//영문자 사이에 언더바(_)가 있으면 자동 줄바꿈이 안됨. 언더바를 공백으로 바꾸자.
function replaceUnderbar(str){
    return str.replace(/_/g," ");
}