//전역변수 선언
var learnstatus_Array = [];
var course_Array = [];
var userID = null;
var studentID = null;

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
    if(response[0].enrollments[0].user_id != null){
        userID = response[0].enrollments[0].user_id;
    }
    else{
        userID = response[1].enrollments[1].user_id;
    }
    for(var i=0; i<response.length; i++) {
        var courseData = {
            "name":response[i].name,
            "id":response[i].id
        }
        course_Array.push(courseData);
    }
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
console.log(studentID);

//과목별 강의출석, 과제 등 필요한 데이터 받기
for(var i=0; i<course_Array.length; i++) {
    var targetURL = "https://canvas.skku.edu/learningx/api/v1/courses/"+course_Array[i].id+"/sections/learnstatus_db?user_id="+userID+"&user_login="+studentID+"&role=1";
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
        if(response.total_count != 0){
            var studyData = {
                "name": course_Array[i].name,
                "data": response.sections
            }
            console.log(studyData.name);
            learnstatus_Array.push(studyData);
        }
    });
}
//popup.html에 넘겨줄 변수
learnstatus_Array;