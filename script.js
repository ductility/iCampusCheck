//html DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded',function(){
    checkTokenAndRun();
});

var getCookie = function(name) {
    var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return value? value[2] : null;
};

function checkToken()
{
    var tempCourses=null;
    var cookie;
    cookie = document.cookie.match('(^|;) ?' + "xn_api_token" + '=([^;]*)(;|$)');
    cookie = cookie? cookie[2] : null
    if(cookie !== null)
    {
        var get_courses={
            "url":"https://canvas.skku.edu/api/v1/courses",
            "method":"GET",
            "timeout":0,
            "async":false,
            "dataType":"json"
        };
        $.ajax(get_courses).done(

            function(response)
            {
                tempCourses=response;
            }).fail(
                function(a,b,c)
                {
                    console.log("임시 과목 가져오기 xhr 실패")
                    console.log(c);
                }
        );
        return [false, tempCourses];
    }
    else
    {
        return [true, cookie];
    }
}

//필요한 토큰이 발행되었는지 확인하고, (x)이면 새창열어 토큰 발행(로딩시간생각해서 반복)
function checkTokenAndRun(){
    //xn_api_token이 발행되지 않았다면, https://canvas.skku.edu/api/v1/courses에서 과목id를 가져와 새 창을 연다.
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs)
    {

        chrome.scripting.executeScript({
            target: {tabId:tabs[0].id, frameIds:[0]},
            func:checkToken
        }, function (result) {
            console.log("injection result is");
            console.log(result[0]);
            console.log(result[0].result);
            console.log("api 토큰 검사 중...");
            if(result[0].result[0] === true){
                console.log("api 토큰을 가져옵니다...");
                var index = 0;
                while(result[0].result==null) index = index + 1;
                var action_url = "https://canvas.skku.edu/courses/"+result[0][index].id+"/external_tools/5";
                chrome.tabs.create({ url: action_url, active: false});
                var timerID = setInterval(function(){
                    chrome.scripting.executeScript({
                        target: {tabId:tabs[0].id, frameIds:[0]},
                        func: getCookie,
                        args:["xn_api_token"],
                    }, function (result) {
                        if(result[0].result !== null){ //가져온 쿠키 값
                            getLearnStatus(result[0].result);
                            clearInterval(timerID);
                        }});
                }, 500);//500ms 마다 재시도
            }
            else //쿠키 가져오기에 성공
            {

                console.log("쿠키를 성공적으로 가져왔으므로 학습 내용을 가져옵니다...");
                getLearnStatus(result[0].result[1]);
            }


        });
    });

}



//getComponents()를 실행해, 필요한 데이터 가져오기
function getLearnStatus(cookie){
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs)
    {
        console.log("필요한 탭 가져옴.");
        console.log(tabs);
        chrome.scripting.executeScript({
            func:getComponents,
            args:[cookie],
            target: {tabId:tabs[0].id, frameIds:[0]}
        }, function (result) {


            result = result[0].result;
            console.log("과목 정보 가져옴!");
            if(result !== null) {
                let thingsToDo = sortToDo(result);
                //콜백함수 사용, Table에 강의/과제 자료를 띄운 뒤 클릭하면 해당 url로 이동할 수 있게함
                viewToDo(thingsToDo, function(){
                    for(let i=0; i<thingsToDo.lecture.length; i++){
                        const id = "lecture"+i;
                        const action_url = thingsToDo.lecture[i].url;
                        document.getElementById(id).addEventListener('click', function(event){
                            console.log(action_url);
                            moveToContent(action_url);
                        });
                    }
                    for(let i=0; i<thingsToDo.assignment.length; i++){
                        const id = "assignment"+i;
                        const action_url = thingsToDo.assignment[i].url;
                        document.getElementById(id).addEventListener('click', function(event){
                            moveToContent(action_url);
                        });
                    }
                    for(let i=0; i<thingsToDo.zoom.length; i++){
                        const id = "zoom"+i;
                        const action_url = thingsToDo.zoom[i].url;
                        document.getElementById(id).addEventListener('click', function(event){
                            moveToContent(action_url);
                        });
                    }
                });
            }
            else document.querySelector("#assignment").innerHTML = "데이터를 불러오는데 실패했습니다. 새로고침 후 재실행 해주세요";
        });
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
    var zoom = document.querySelector("#zoom");
    lecture.border = 1;
    assignment.border = 1;
    zoom.border = 1;
    var lecture_HTML = "<table class='lecture'><caption>강의</caption>" + add_HTMLTAG(thingsToDo.lecture, "lecture");
    var assignment_HTML = "<table class='assignment'><caption><span class='caption'>과제</span></caption>" + add_HTMLTAG(thingsToDo.assignment, "assignment");
    var zoom_HTML = "<table class='zoom'><caption><span class='caption'>실시간 강의</span></caption>" + add_HTMLTAG(thingsToDo.zoom, "zoom");
    // var assignment_HTML = "<table class='assignment'><caption><span class='caption'><span class='tooltip'>과목 사이드바에 '과제 및 평가'가 있는 과목은 직접 확인해야합니다. ༼༎ຶ෴༎ຶ༽</span>과제<span class='badge'>1</span></span></caption>" + add_HTMLTAG(thingsToDo.assignment, "assignment");
    lecture.innerHTML = lecture_HTML;
    assignment.innerHTML = assignment_HTML;
    zoom.innerHTML = zoom_HTML;
    document.getElementById('lectureDetail').style.display = 'block';
    document.getElementById('zoomDetail').style.display = 'block';
    document.getElementById('assignmentDetail').style.display = 'block';
    deleteLoadingBar();
    callback();
}
function openInNewTab(url) {
    window.open(url, '_blank').focus();
   }
//table에 삽입 할 내용
function add_HTMLTAG(data, type){
    var HTML_data = '<thead><tr><th class="colum1">과목</th><th class="colum2">제목</th><th class="colum3">' + (type === "zoom" ? '시작시간' : '마감시간') + '</th><th class="colum4">남은시간</th></tr></thead><tbody>';
    for(i=0; i<data.length; i++){
        var id = type+i;
        var row_class = ""
        if(parseInt(i%2)===0)  row_class = ' class="even"'
        HTML_data = HTML_data + `<tr${row_class}><td>${replaceUnderbar(data[i].course)}</td><td class="title" id="${id}">${replaceUnderbar(data[i].title)}</td><td>${dateToLocaleString(data[i].due_at)}</td><td class="colum4" style="color:${timeLeftTextStyle(data[i].remainingTime_ms)}">${msToTime(data[i].remainingTime_ms)}</td></tr>`;
    }
    HTML_data = HTML_data + '</tbody></table>'
    return HTML_data;
}
//loadingbar 지우기
function deleteLoadingBar() {
    const div = document.getElementById('loadingBar');

    div.remove();
} 

function toggleDiv() {
    const div = document.getElementById('my_div');

    if (div.style.display === 'none') {
        div.style.display = 'block';
    } else {
        div.style.display = 'none';
    }
} 
//적게남은 시간, 과목명, 과제명 순으로 정렬
function sortToDo(thingsToDo){
    thingsToDo.lecture.sort(function(a, b){
        return a["remainingTime_ms"]-b["remainingTime_ms"];
    });
    thingsToDo.assignment.sort(function(a, b){
        return a["remainingTime_ms"]-b["remainingTime_ms"];
    });
    thingsToDo.zoom.sort(function(a, b){
        return a["start_time"]-b["start_time"];
    });
    return thingsToDo;
}
function handleChange(src) {
    //checkTokenAndRun()
}

//적게남은 시간, 과목명, 과제명 순으로 정렬
function sortWithTime(thingsToDo) {
    thingsToDo.lecture.sort(function (a, b) {
        return a["remainingTime_ms"] - b["remainingTime_ms"];

    });
    thingsToDo.assignment.sort(function (a, b) {
        return a["remainingTime_ms"] - b["remainingTime_ms"];
    });
    return thingsToDo
}

//과목 별 정렬
function sortWithCourse(thingsToDo) {
    thingsToDo.lecture.sort(function (a, b) {
        return a["course"] - b["course"];

    });
    thingsToDo.assignment.sort(function (a, b) {
        return a["course"] - b["course"];
    });
    return thingsToDo
}

//시간차 계산
function gapTime(now, date){
    return (new Date(date)).getTime() - now.getTime();
}

//글씨 빨갛게 표시 => 1일 이하 남음
function timeLeftTextStyle(time_ms){
    var time_out = "";
    var minutes = parseInt((time_ms/(1000*60))%60);
    var hours = parseInt((time_ms/(1000*60*60))%24);
    var days = parseInt(time_ms/(1000*60*60*24));

    if(days>0)
        return "black";
    else
    {
        return "red";
    }
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

function getComponents()
{
    let now = new Date();

    var course_Array = [];
    let userID = null;
    let studentID = null;

    //모든 xhr 처리가 완료될 때 까지 대기하려고 만든 장치.
    //execute script의 선천적 문제로 불가.
    let RequestCompleteCount = 0; //allcomponents 하나 끝낼때마다 +1, assignments 하나 끝낼때마다 +1.
    let TargetCompleteFlag = 0;


    //GET요청 헤더에 실어보낼 인증 키
    const authorizationToken = "Bearer " + getCookie("xn_api_token");

    //대시보드에서 수강 과목들 가져오기 (전체과목 아님)
    const getCourses = {
        "url": "https://canvas.skku.edu/api/v1/users/self/favorites/courses",
        "method": "GET",
        "timeout": 0,
        "async": false,
        "dataType": "json"
    };

    $.ajax(getCourses).done(function (response) {
        for(var i=0; i<response.length; i++) {
            if(true){
                var courseData = {
                    "name":response[i].name,
                    "id":response[i].id
                }
                if(userID==null) userID = response[i].enrollments[0].user_id;
                course_Array.push(courseData);
            }
        }
    });

    TargetCompleteFlag = course_Array.length * 2; //이 수가 될때 만큼 대기를 탐.

    //학번 가져오기. 대시보드화면에서 학번이 나와있지 않아 특정 과목 안에있는 정보를 이용함
    var get_studentID = {
        "url": "https://canvas.skku.edu/learningx/api/v1/courses/"+course_Array[0].id+"/total_learnstatus/users/"+userID,
        "method": "GET",
        "timeout": 0,
        "async": false,
        "headers": {
            "Authorization": authorizationToken,
            "Accept": "*/*"},
        "dataType": "json"
    };
    $.ajax(get_studentID).done(function (response) {
        studentID = response.item.user_login;
    });
    console.log("찾은 과목 정보:");
    console.log(course_Array);

    var assignmentsList = {};
    var inappropriateAssignments = [];
    //과목별 강의/과제 목록 가져오기(강의콘텐츠에서 가져옴)
    for(let i=0; i<course_Array.length; i++) {
        const lectureContentsURL = "https://canvas.skku.edu/learningx/api/v1/courses/"+course_Array[i].id+"/allcomponents_db?user_id="+userID+"&user_login="+studentID+"&role=1";
        //const targetURL = "https://canvas.skku.edu/api/v1/courses/"+course_Array[i].id+"/assignments?per_page=100"
        const getFromLectureContents = {
            "url": lectureContentsURL,
            "method": "GET",
            "timeout": 0,
            "headers": {
                "Authorization":authorizationToken,
                "Accept": "*/*"
            },
            "dataType": "json",
            "async": false
        };
        $.ajax(getFromLectureContents).done(function (response) {
            if(response.length>0){
                for (let j = 0; j < response.length; j++)
                {
                    let raw = response[j];
                    const timeLeftToUnlock = gapTime(now, raw.unlock_at); //과제가 오픈된건지 확인
                    let remainingTime = Number.MAX_SAFE_INTEGER;
                    if (raw.due_at !== undefined)
                    {
                        remainingTime = gapTime(now, raw.due_at);
                    }

                    if (timeLeftToUnlock < 0 && remainingTime > 0) //열린 과제만 집어넣음
                    {

                        let assignment = {
                            "course_name": course_Array[i].name,
                            "title": raw.title,
                            "source": "lecture_contents",
                            "course_id": course_Array[i].id,

                            "due_at": raw.due_at,
                            "unlock_at": raw.unlock_at,
                            "use_attendance": raw.use_attendance,
                            "attendance_status": raw.attendance_status, //absent (결석), attendance (출석), none (미결)
                            "remainingTime_ms":remainingTime,

                            "id": raw.assignment_id,
                            "url": raw.view_info.view_url
                        };
                        if (raw.type === "commons") //영상 혹은 과제 혹은
                        {
                            if (raw.commons_content.content_type === "movie" || raw.commons_content.content_type === "mp4" || raw.commons_content.content_type === "zoom")
                            {
                                assignment.type = "movie";
                                assignment.duration = raw.commons_content.duration;
                            }
                            else if (raw.commons_content.content_type === "pdf" || raw.commons_content.content_type === "file") //교안. pdf 또는 ppt
                            {
                                assignment.type = "file";
                                assignment.file_name = raw.commons_content.file_name;
                            }
                        }
                        else if (raw.type === "video_conference") //줌 실시간 회의
                        {
                            assignment.type = "zoom";
                            assignment.schedule_time = raw.schedule_time;
                            if (gapTime(now, raw.schedule_time) < 0) //이미 시작한 미팅
                            {
                                inappropriateAssignments.push(raw.assignment_id);
                                continue;
                            }
                            assignment.duration = Number(raw.integration_data.duration_hour) * 3600 + Number(raw.integration_data.duration_minute) * 60;

                        }
                        else if (raw.type === "discussion")
                        {
                            assignment.type = "discussion";
                        }
                        else if (raw.type === "text")
                        {
                            assignment.type = "text";
                        }
                        else
                        {
                            if (raw.submitted === true) //제출한 과제는 패스
                            {
                                inappropriateAssignments.push(raw.assignment_id);
                                continue;
                            }
                            assignment.type = raw.type;
                        }
                        //여기서는 과제 끼리 중복이 없음.
                        assignmentsList[raw.assignment_id] = assignment;
                    }


                }
            }

            RequestCompleteCount++;
        }).fail(function(a, b,c,d)
        {
            console.log(c);
        });
    }

    //기존 아캠에서는 안보이는, 놓친 숙제가 있는지 확인.
    //과제 및 평가에서 가져옴
    for(let i=0; i<course_Array.length; i++) {
        const assignmentsURL = "https://canvas.skku.edu/api/v1/courses/"+course_Array[i].id+"/assignments?per_page=100"
        const getFromAssignments = {
            "url": assignmentsURL,
            "method": "GET",
            "timeout": 0,
            "headers": {
                "Accept": "*/*"
            },
            "dataType": "text",
            "async": false
        };
        $.ajax(getFromAssignments).done(function (response) {
            //이상한 문자열이 같이 앞에서 들어옴
            //해당 이슈에 대해 대응
            const strangeString = "while(1);";
            if (response.substring(0, strangeString.length) === strangeString)
            {
                response = response.substring(strangeString.length);
                response = JSON.parse(response);
            }
            else
            {
                response = JSON.parse(response);
            }
            if(response.length>0){
                for (let j = 0; j < response.length; j++)
                {
                    let raw = response[j];
                    if (!(raw.id in assignmentsList))
                    {
                        if (inappropriateAssignments.includes(raw.id) === true)
                        {
                            continue;
                        }
                        const timeLeftToUnlock = gapTime(now, raw.unlock_at); //과제가 오픈된건지 확인
                        let remainingTime = Number.MAX_SAFE_INTEGER;
                        if (raw.due_at !== undefined)
                        {
                            remainingTime = gapTime(now, raw.due_at);
                        }

                        if (timeLeftToUnlock < 0 && remainingTime > 0) //열린 과제만 집어넣음
                        {

                            let assignment = {
                                "course_name":course_Array[j].name,
                                "title":raw.name,
                                "source":"assignments",
                                "course_id": course_Array[j].id,

                                "due_at":raw.due_at,
                                "unlock_at":raw.unlock_at,

                                "attendance_status":raw.has_submitted_submissions, //true, false bool형. 강의 영상에는 보통 false. 토론 및 제출 과제에서 의미있음
                                "remainingTime_ms":remainingTime,

                                "id":raw.id,
                                "url":raw.html_url
                            };

                            //해당 id의 과제가 있는지 없는지 이미 확인함. 따라서 중복 없음.
                            assignmentsList[raw.id] = assignment;
                        }

                    }
                }


            }
            RequestCompleteCount++;

        }).fail(function(a, b,c,d)
        {
            console.log("xhr 실패.");
            console.log(c);
        });
    }

    //과목별 출석자료 중 필요한 자료만 뽑아내기
    let toDoList = {"lecture":[], "assignment":[], "zoom":[]};

    var assignments = Object.values(assignmentsList);
    for(let i=0; i<assignments.length; i++) {

        let current = assignments[i];
        if (current.source === "lecture_contents") //강의컨텐츠
        {
            if (current.attendance_status !== "attendance") //아직 출석 안한 과제
            {
                if (current.type === "movie") {
                    if (current.use_attendance) {
                        toDoList.lecture.push({
                            "course": current.course_name,
                            "title": current.title,
                            "url": current.url,
                            "due_at": current.due_at,
                            "duration": current.duration,
                            "remainingTime_ms": gapTime(now, current.due_at)
                        });
                    }
                } else if (current.type === "zoom") {
                    if (current.use_attendance) {
                        toDoList.zoom.push({
                            "course": current.course_name,
                            "title": current.title,
                            "url": current.url,
                            "start_time": current.schedule_time,
                            "duration": current.duration
                        });
                    }
                } else if (current.type === "text") {
                    if (current.use_attendance) {
                        toDoList.assignment.push({
                            "course": current.course_name,
                            "title": current.title,
                            "url": current.url,
                            "due_at": current.due_at,
                            "remainingTime_ms": gapTime(now, current.due_at)
                        });
                    }
                } else if (current.type === "file") {
                    if (current.use_attendance) {
                        toDoList.assignment.push({
                            "course": current.course_name,
                            "title": current.title,
                            "url": current.url,
                            "due_at": current.due_at,
                            "remainingTime_ms": gapTime(now, current.due_at)
                        });
                    }
                } else if (current.type === "discussion") {
                    //일단 토론은 전부 표시
                    toDoList.assignment.push({
                        "course": current.course_name,
                        "title": current.title,
                        "url": current.url,
                        "due_at": current.due_at,
                        "remainingTime_ms": gapTime(now, current.due_at)
                    });
                }
                else //type이 assignment인 경우 대응.
                {
                    toDoList.assignment.push({
                        "course": current.course_name,
                        "title": current.title,
                        "url": current.url,
                        "due_at": current.due_at,
                        "remainingTime_ms": gapTime(now, current.due_at)
                    });
                }

            }


        }
        else //과제 및 평가 (숨겨진 과제)
        {
            const remainingTime = gapTime(now, current.due_at); //과제 마감시간이 남아있는지 확인
            const timeLeftToUnlock = gapTime(now, current.unlock_at); //과제가 오픈된건지 확인

            if (remainingTime > 0 && timeLeftToUnlock < 0) {
                if (!current.attendance_status) {
                    toDoList.assignment.push({
                        "course": current.course_name,
                        "title": current.title,
                        "url": current.url,
                        "due_at": current.due_at,
                        "remainingTime_ms": remainingTime,
                    });
                }
            }


        }

    }

    console.log("최종 리스트:");
    console.log(toDoList);
    return toDoList;
}