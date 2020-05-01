//필요한 토큰이 발행되었는지 확인하고, (x)이면 새창열어 토큰 발행(로딩시간생각해서 반복)
function checkTokenAndRun(){
    //xn_api_token이 발행되지 않았다면, https://canvas.skku.edu/api/v1/courses에서 과목id를 가져와 새 창을 연다.
    chrome.tabs.executeScript({
        code: 'var tempID=null;if(getCookie("xn_api_token")==null){var get_courses={"url":"https://canvas.skku.edu/api/v1/courses","method":"GET","timeout":0,"async":false,"dataType":"json"};$.ajax(get_courses).done(function(response){tempID=response[0].id})}tempID;'
    }, function (result) {
        if(result[0]!=null){
            var action_url = "https://canvas.skku.edu/courses/"+result[0]+"/external_tools/5";
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
        var learnstatus_Array = result[0];
        // console.log(learnstatus_Array);
        // console.log(findToDo(learnstatus_Array));
        var tingsToDo = sortToDo(findToDo(learnstatus_Array));
        viewToDo(tingsToDo);
    });
}

//가져 온 데이터에서 필요한 것[(강의,과제)의 강의 명, 제목, 마감기한, 남은시간] 뽑아내기
function findToDo(learnstatus_Array){
    var tingsToDo = {"lecture":[], "assignment":[]};
    var now = new Date();

    for(var a=0; a<learnstatus_Array.length; a++){
        for(var b=0; b<learnstatus_Array[a].data.length; b++){
            for(var c=0; c<learnstatus_Array[a].data[b].subsections.length; c++){
                for(var d=0; d<learnstatus_Array[a].data[b].subsections[c].units.length; d++){
                    for(var e=0; e<learnstatus_Array[a].data[b].subsections[c].units[d].components.length; e++){
                        var remainingTime = gapTime(now, learnstatus_Array[a].data[b].subsections[c].units[d].components[e].due_at);
                        if(remainingTime > 0){
                            if(learnstatus_Array[a].data[b].subsections[c].units[d].components[e].use_attendance && learnstatus_Array[a].data[b].subsections[c].units[d].components[e].attendance_status != "attendance"){
                                tingsToDo.lecture.push({
                                    "course":learnstatus_Array[a].name,
                                    "title":learnstatus_Array[a].data[b].subsections[c].units[d].components[e].title,
                                    "remainingTime_ms":remainingTime,
                                    "due":new Date(learnstatus_Array[a].data[b].subsections[c].units[d].components[e].due_at)});
                            }
                            if(learnstatus_Array[a].data[b].subsections[c].units[d].components[e].type == "assignment" && !(learnstatus_Array[a].data[b].subsections[c].units[d].components[e].completed)){
                                tingsToDo.assignment.push({
                                    "course":learnstatus_Array[a].name,
                                    "title":learnstatus_Array[a].data[b].subsections[c].units[d].components[e].title,
                                    "remainingTime_ms":remainingTime,
                                    "due":new Date(learnstatus_Array[a].data[b].subsections[c].units[d].components[e].due_at)});
                            }
                        }
                    }
                }
            }
        }
    }
    return tingsToDo;
}

//html에 ToDoList 띄우기
function viewToDo(tingsToDo){
    var lecture = document.querySelector("#lecture");
    var assignment = document.querySelector("#assignment");
    lecture.border = 1;
    assignment.border = 1;
    var lecture_HTML = "<table class='lecture'><caption>강의</caption>" + add_HTMLTAG(tingsToDo.lecture);
    var assignment_HTML = "<table class='assignment'><caption>과제</caption>" + add_HTMLTAG(tingsToDo.assignment);
    lecture.innerHTML = lecture_HTML;
    assignment.innerHTML = assignment_HTML;
}

//table에 삽입 할 내용
function add_HTMLTAG(data){
    var HTML_data = '<thead><tr><th class="colum1">과목</th><th class="colum2">강의명</th><th class="colum3">마감기한</th><th class="colum4">남은시간</th></tr></thead><tbody>';
    for(i=0; i<data.length; i++){
        var row_class = ""
        if(parseInt(i%2)==0)  row_class = ' class="even"'
        HTML_data = HTML_data + `<tr${row_class}><td>${data[i].course}</td><td>${data[i].title}</td><td>${dateToLocaleString(data[i].due)}</td><td class="colum4">${msToTime(data[i].remainingTime_ms)}</td></tr>`;
    }
    HTML_data = HTML_data + '</tbody></table>'
    return HTML_data;
}

//적게남은 시간, 과목명, 과제명 순으로 정렬
function sortToDo(tingsToDo){
    tingsToDo.lecture.sort(function(a, b){
        return a["remainingTime_ms"]-b["remainingTime_ms"];
    });
    tingsToDo.assignment.sort(function(a, b){
        return a["remainingTime_ms"]-b["remainingTime_ms"];
    });
    return tingsToDo
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
    return addSpace(date.getMonth()+1)+"월 "+addSpace(date.getDate())+"일("+dayOfWeek(date)+") "+date.toLocaleTimeString().substring(0,date.toLocaleTimeString().length-3);
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

//html DOM이 로드되면, 다음 함수 실행
document.addEventListener('DOMContentLoaded',function(){
    checkTokenAndRun();
});
