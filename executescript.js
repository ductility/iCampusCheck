//전역변수 선언
var toDoList = {"lecture":[], "assignment":[], "zoom":[]};
var assignmentsList = {};

var now = new Date();

var course_Array = [];
var userID = null;
var studentID = null;

//모든 xhr 처리가 완료될 때 까지 대기하려고 만든 장치.
//execute script의 선천적 문제로 불가.
var RequestCompleteCount = 0; //allcomponents 하나 끝낼때마다 +1, assignments 하나 끝낼때마다 +1.
var TargetCompleteFlag = 0;


function gapTime(now, date){
    return (new Date(date)).getTime() - now.getTime();
}

//GET요청 헤더에 실어보낼 인증 키
var authorizationToken = "Bearer " + getCookie("xn_api_token");

//대시보드에서 수강 과목들 가져오기 (전체과목 아님)
var getCourses = {
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

//과목별 강의/과제 목록 가져오기(강의콘텐츠에서 가져옴)
for(let i=0; i<course_Array.length; i++) {
    const targetURL = "https://canvas.skku.edu/learningx/api/v1/courses/"+course_Array[i].id+"/allcomponents_db?user_id="+userID+"&user_login="+studentID+"&role=1";
    //const targetURL = "https://canvas.skku.edu/api/v1/courses/"+course_Array[i].id+"/assignments?per_page=100"
    const get_learnstatus = {
        "url": targetURL,
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Authorization":authorizationToken,
            "Accept": "*/*"
        },
        "dataType": "json",
        "async": false
    };
    $.ajax(get_learnstatus).done(function (response) {
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
                    //여기서는 과제 끼리 중복이 없음.
                    assignmentsList[raw.assignment_id] = assignment;
                }


            }
        }

        RequestCompleteCount++;
    });
}




//기존 아캠에서는 안보이는, 놓친 숙제가 있는지 확인.
//과제 및 평가에서 가져옴
for(let i=0; i<course_Array.length; i++) {
    const targetURL = "https://canvas.skku.edu/api/v1/courses/"+course_Array[i].id+"/assignments?per_page=100"
    const get_learnstatus = {
        "url": targetURL,
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Accept": "*/*"
        },
        "dataType": "json",
        "async": false
    };
    $.ajax(get_learnstatus).done(function (response) {
        if(response.length>0){
            for (let i = 0; i < response.length; i++)
            {
                let raw = response[i];
                if (!(raw.id in assignmentsList))
                {

                    const timeLeftToUnlock = gapTime(now, raw.unlock_at); //과제가 오픈된건지 확인
                    let remainingTime = Number.MAX_SAFE_INTEGER;
                    if (raw.due_at !== undefined)
                    {
                        remainingTime = gapTime(now, raw.due_at);
                    }

                    if (timeLeftToUnlock < 0 && remainingTime > 0) //열린 과제만 집어넣음
                    {

                        let assignment = {
                            "course_name":course_Array[i].name,
                            "title":raw.name,
                            "source":"assignments",
                            "course_id": course_Array[i].id,

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

    });
}

//과목별 출석자료 중 필요한 자료만 뽑아내기
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
                        "duration": current.duration
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
                    });
                }
            } else if (current.type === "file") {
                if (current.use_attendance) {
                    toDoList.assignment.push({
                        "course": current.course_name,
                        "title": current.title,
                        "url": current.url,
                        "due_at": current.due_at,
                    });
                }
            } else if (current.type === "discussion") {
                //일단 토론은 전부 표시
                toDoList.assignment.push({
                    "course": current.course_name,
                    "title": current.title,
                    "url": current.url,
                    "due_at": current.due_at,
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





//     for(let j=0; j<course.assignments.length; j++)
//     {
//         let info = course.assignments[j];
//         let remainingTime = gapTime(now, info.due_at);
//         //마감이 남았고, 이미 열린(unlocked) 과제를 표시
//         if(remainingTime > 0 && gapTime(now, info.unlock_at) < 0){
//             if(course.data[j].use_attendance && course.data[j].attendance_status !== "attendance"){
//                 toDoList.lecture.push({
//                     "course":course.name, //강좌 이름
//                     "title":info.name, //과제 이름
//                     "remainingTime_ms":remainingTime, //남은 시간
//                     "due":info.due_at, //마감 시간
//                     "url":info.html_url //해당 과제 url
//                 });
//             }
//             if(learnstatus_Array[i].data[j].type === "assignment" && !(learnstatus_Array[i].data[j].completed)){
//                 toDoList.assignment.push({
//                     "type":learnstatus_Array[i].data[j].title,
//                     "course":learnstatus_Array[i].name,
//                     "title":learnstatus_Array[i].data[j].title,
//                     "remainingTime_ms":remainingTime,
//                     "due":learnstatus_Array[i].data[j].due_at,
//                     "url":learnstatus_Array[i].data[j].view_info.view_url
//                 });
//             }
//             if(learnstatus_Array[i].data[j].type === "assignment" && !(learnstatus_Array[i].data[j].completed)){
//                 toDoList.assignment.push({
//                     "type":learnstatus_Array[i].data[j].title,
//                     "course":learnstatus_Array[i].name,
//                     "title":learnstatus_Array[i].data[j].title,
//                     "remainingTime_ms":remainingTime,
//                     "due":learnstatus_Array[i].data[j].due_at,
//                     "url":learnstatus_Array[i].data[j].view_info.view_url
//                 });
//             }
//         }
//     }
// }

//popup.html에 넘겨줄 변수
toDoList;