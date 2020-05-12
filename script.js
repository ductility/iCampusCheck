//필요한 토큰이 발행되었는지 확인하고, (x)이면 새창열어 토큰 발행(로딩시간생각해서 반복)
function checkTokenAndRun(){
    //xn_api_token이 발행되지 않았다면, https://canvas.skku.edu/api/v1/courses에서 과목id를 가져와 새 창을 연다.
    chrome.tabs.executeScript({
        code: 'var tempCourses=null;if(getCookie("xn_api_token")==null){var get_courses={"url":"https://canvas.skku.edu/api/v1/courses","method":"GET","timeout":0,"async":false,"dataType":"json"};$.ajax(get_courses).done(function(response){tempCourses=response})}tempCourses;'
    }, function (result) {
        if(result[0]!=null){
            console.log(result[0]);
            var index = 0;
            while(result[0][index].name==null) index = index + 1;
            var action_url = "https://canvas.skku.edu/courses/"+result[0][index].id+"/external_tools/5";
            chrome.tabs.create({ url: action_url, active: false});
            var timerID = setInterval(function(){
                chrome.tabs.executeScript({
                    code: 'getCookie("xn_api_token");'
                }, function (result) {
                    if(result[0]!=null){
                        getLearnStatus();
                        clearInterval(timerID);
                    }});
            }, 500);
        }
        else getLearnStatus();
    });
}

//executescript.js를 실행해, 필요한 데이터 가져오기
function getLearnStatus(){
    chrome.tabs.executeScript({
        file: "/executescript.js",
        allFrames: true
    }, function (result) {
        if(result[0]!=null){
            ///여기수정수정!!!!
            // var learnstatus_Array = result[0];
            // var thingsToDo = sortToDo(findToDo(learnstatus_Array));
            console.log(result[0]);
            var thingsToDo = sortToDo(result[0]);
            ///여기수정수정
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

//가져 온 데이터에서 필요한 것[(강의,과제)의 강의 명, 제목, 마감기한, 남은시간] 뽑아내기
function findToDo(learnstatus_Array){
    var thingsToDo = {"lecture":[], "assignment":[]};
    var now = new Date();

    for(var i=0; i<learnstatus_Array.length; i++){
        for(var j=0; j<learnstatus_Array[i].data.length; j++){
            var remainingTime = gapTime(now, learnstatus_Array[i].data[j].due_at);
            if(remainingTime>0 && gapTime(now, learnstatus_Array[i].data[j].unlock_at)<0 && learnstatus_Array[i].data[j].use_attendance && learnstatus_Array[i].data[j].attendance_status != "attendance"){
                console.log(gapTime(now, learnstatus_Array[i].data[j].unlock_at));
                thingsToDo.lecture.push({
                    "course":learnstatus_Array[i].name,
                    "title":learnstatus_Array[i].data[j].title,
                    "remainingTime_ms":remainingTime,
                    "due":new Date(learnstatus_Array[i].data[j].due_at),               
                    "url":learnstatus_Array[i].data[j].view_info.view_url});
            }                
        }
    }

    
    return thingsToDo;
}

//html에 ToDoList 띄우기
function viewToDo(thingsToDo, callback){
    var lecture = document.querySelector("#lecture");
    var assignment = document.querySelector("#assignment");
    lecture.border = 1;
    assignment.border = 1;
    var lecture_HTML = "<table class='lecture'><caption>강의</caption>" + add_HTMLTAG(thingsToDo.lecture, "lecture");
    var assignment_HTML = "<table class='assignment'><caption><span class='caption'><span class='tooltip'>과목 사이드바에 과제 및 평가가 있는 과목은 직접 확인해야합니다. ༼༎ຶ෴༎ຶ༽</span>과제<span class='badge'>1</span></span></caption>" + add_HTMLTAG(thingsToDo.assignment, "assignment");
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

//html DOM이 로드되면, 다음 함수 실행
document.addEventListener('DOMContentLoaded',function(){
    checkTokenAndRun();
});