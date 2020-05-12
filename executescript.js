//전역변수 선언
var learnstatus_Array = [];
var assignmentstatus_Array = [];

var thingsToDo = {"lecture":[], "assignment":[]};
var now = new Date();

var course_Array = [];
var userID = null;
var studentID = null;

function gapTime(now, date){
    return (new Date(date)).getTime() - now.getTime();
}

//GET요청 헤더에 실어보낼 인증 키
var authorizationToken = "Bearer " + getCookie("xn_api_token");

//수강 과목들 가져오기
var get_courses = {
    "url": "https://canvas.skku.edu/api/v1/courses",
    "method": "GET",
    "timeout": 0,
    "async": false,
    "dataType": "json"
};
$.ajax(get_courses).done(function (response) {
    for(var i=0; i<response.length; i++) {
        if(response[i].apply_assignment_group_weights){
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

//학번 가져오기. 대시보드화면에서 학번이 나와있지 않아 특정 과목 안에있는 정보를 이용함.
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
// console.log(studentID);

//이거 고려해보기
// "https://canvas.skku.edu/learningx/api/v1/courses/"+course_Array[i].id+"/allcomponents_db?user_id="+userID+"&user_login="+studentID+"&role=1"
// "https://canvas.skku.edu/learningx/api/v1/courses/"+course_Array[i].id+"/sections/learnstatus_db?user_id="+userID+"&user_login="+studentID+"&role=1"

//과목별 출석 매기는 자료 가져오기(주로 lecture)
for(var i=0; i<course_Array.length; i++) {
    var targetURL = "https://canvas.skku.edu/learningx/api/v1/courses/"+course_Array[i].id+"/allcomponents_db?user_id="+userID+"&user_login="+studentID+"&role=1";
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

// //과목별 과제ID -> 과제title 객체만들기
// var assignment_title_Array = [];
// for(var i=0; i<learnstatus_Array.length; i++) {
//     var get_assignment_data = {
//         "url": "https://canvas.skku.edu/api/v1/courses/"+learnstatus_Array[i].course_id+"/assignment_groups?include%5B%5D=assignments&exclude_response_fields%5B%5D=description&exclude_response_fields%5B%5D=rubric&override_assignment_dates=true&per_page=50",
//         "method": "GET",
//         "timeout": 0,
//         "async": false,
//         "dataType": "json"
//     };
//     $.ajax(get_assignment_data).done(function (response) {
//         var ID_TITLE = {};
//         for(var j=0; j<response[0].assignments.length; j++) {
//                 // var ID_TITLE = {};
//                 ID_TITLE[response[0].assignments[j].id] = {"title":response[0].assignments[j].name, "url":response[0].assignments[j].html_url};
//                 // temp_assignment_title=ID_TITLE;
//             }
//         if(ID_TITLE!=null) assignment_title_Array.push(ID_TITLE);
//     });
// }
// console.log(assignment_title_Array);


// //과제 제출여부 확인
// for(var i=0; i<learnstatus_Array.length; i++) {
//     var get_submissions = {
//         "url": "https://canvas.skku.edu/api/v1/courses/"+learnstatus_Array[i].course_id+"/students/submissions?per_page=50",
//         "method": "GET",
//         "timeout": 0,
//         "async": false,
//         "dataType": "json"
//     };
//     $.ajax(get_submissions).done(function (response) {
//         for(var j=0; j<response.length; j++) {
//             var remainingTime = gapTime(now, response[j].cached_due_date);
//             if(remainingTime > 0 && response[j].workflow_state == "unsubmitted"){
//                 if(assignment_title_Array[i][response[j].assignment_id] != null){
//                     console.log(assignment_title_Array[i][response[j].assignment_id]);
//                     thingsToDo.assignment.push({
//                         "course":learnstatus_Array[i].name,
//                         "title":assignment_title_Array[i][response[j].assignment_id].title,
//                         "remainingTime_ms":remainingTime,
//                         "due":response[j].cached_due_date,
//                         "url":assignment_title_Array[i][response[j].assignment_id].url                 
//                     });
//                 }
//             }
//         }
//     });
// }
console.log(thingsToDo);

//popup.html에 넘겨줄 변수
thingsToDo;