//전역변수 선언
var learnstatus_Array = [];
var assignmentstatus_Array = [];

var thingsToDo = {"lecture":[], "assignment":[]};
var now = new Date();

var course_Array = [];
var userID = null;
var studentID = null;

var DOMAIN = "https://canvas.skku.edu";

function executeScript() {
    //GET요청 헤더에 실어보낼 인증 키
    var authorizationToken = "Bearer " + getCookie("xn_api_token");

    //수강 과목들 가져오기
    var get_courses = {
        "url": `${DOMAIN}/api/v1/users/self/favorites/courses`,
        "method": "GET",
        "timeout": 0,
        "async": false,
        "dataType": "json"
    };

    $.ajax(get_courses).done(function (response) {
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
        console.log(course_Array);
    });

    console.log("학번 가져오기");
    //학번 가져오기. 대시보드화면에서 학번이 나와있지 않아 특정 과목 안에있는 정보를 이용함
    var get_studentID = {
        "url": `${DOMAIN}/learningx/api/v1/courses/`+course_Array[0].id+"/total_learnstatus/users/"+userID,
        "method": "GET",
        "timeout": 0,
        "async": false,
        "headers": {
        "Authorization": authorizationToken,
        "Accept": "*/*"},
        "dataType": "json"
    };

    console.log(authorizationToken);
    console.log(get_studentID);

    $.ajax(get_studentID).done(function (response) {
        console.log(response);
        studentID = response.item.user_login;
        console.log(studentID);
    });

    console.log(studentID);

    //과목별 강의/과제 목록 가져오기(출결/학습현황에서 가져옴)
    for(var i=0; i<course_Array.length; i++) {
        var targetURL = `${DOMAIN}/learningx/api/v1/courses/`+course_Array[i].id+"/allcomponents_db?user_id="+userID+"&user_login="+studentID+"&role=1";
        var get_learnstatus = {
            "url": targetURL,
            "method": "GET",
            "timeout": 0,
            "headers": {
                "Authorization":authorizationToken, 
                "Accept": "*/*"},
            "dataType": "json",
            "async": false
            };
        $.ajax(get_learnstatus).done(function (response) {
            if(response.length>0){
                var studyData = {
                    "name": course_Array[i].name,
                    "course_id": course_Array[i].id,
                    "data": response
                }
                // console.log(studyData.name);
                learnstatus_Array.push(studyData);
            }
        });
    }

    //과목별 출석자료 중 필요한 자료만 뽑아내기
    for(var i=0; i<learnstatus_Array.length; i++){
        for(var j=0; j<learnstatus_Array[i].data.length; j++){
            var remainingTime = gapTime(now, learnstatus_Array[i].data[j].due_at);
            if(remainingTime>0 && gapTime(now, learnstatus_Array[i].data[j].unlock_at)<0){
                if(learnstatus_Array[i].data[j].use_attendance && learnstatus_Array[i].data[j].attendance_status != "attendance"){
                    thingsToDo.lecture.push({
                        "course":learnstatus_Array[i].name,
                        "title":learnstatus_Array[i].data[j].title,
                        "remainingTime_ms":remainingTime,
                        "due":learnstatus_Array[i].data[j].due_at,               
                        "url":learnstatus_Array[i].data[j].view_info.view_url
                    });
                }
                if(learnstatus_Array[i].data[j].type == "assignment" && !(learnstatus_Array[i].data[j].completed)){
                    thingsToDo.assignment.push({
                        "course":learnstatus_Array[i].name,
                        "title":learnstatus_Array[i].data[j].title,
                        "remainingTime_ms":remainingTime,
                        "due":learnstatus_Array[i].data[j].due_at,               
                        "url":learnstatus_Array[i].data[j].view_info.view_url
                    });
                }
            }
        }
    }

    //popup.html에 넘겨줄 변수
    console.log(thingsToDo);
    return thingsToDo;
}

function gapTime(now, date){
    return (new Date(date)).getTime() - now.getTime();
}

function getCookie(name) {
    var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return value? value[2] : null;
};


executeScript();