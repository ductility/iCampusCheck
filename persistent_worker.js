function gapTime(now, date){
    return (new Date(date)).getTime() - now.getTime();
}
var IcampusToken = "";

chrome.alarms.create("ZoomChecker", {periodInMinutes : 5});
chrome.alarms.create("ZoomCrawler", {periodInMinutes : 5});

//키 설정에서 가져와서 설정
chrome.storage.sync.get('icampusToken', (result)=>IcampusToken = result);

//실강 알림 버튼 입장
chrome.notifications.onButtonClicked.addListener(function(notificationId, btnIndex){
    const zoomLessThan10Min = "zoomLessThan10Min";
    if (notificationId.substring(0, zoomLessThan10Min.length) === zoomLessThan10Min)
    {
        const url = notificationId.split("_")[1];
        window.open(url, '_blank').focus();
    }
});

chrome.alarms.onAlarm.addListener(
function(alarm)
        {
            if (alarm.name === "ZoomChecker")
            {
                chrome.storage.sync.get('zoom_classes',
                    function(result)
                    {
                        //Object 설계도
                        /*
                        let zoomClassObject = {
                            "title":실강제목,
                            "class_name":강좌이름,
                            "lecture_id":해당실강숙제ID,
                            "class_id":강좌ID,
                            "start_time":시간,
                            "duration_min":분,
                            "url":해당링크
                        };
                        */
                        for (let i = 0; i < result.key.length; i++)
                        {
                            let liveLecture = result.key[i];
                            if (gapTime(new Date(), liveLecture.start_time) <= 1000 * 60 * 10) //10분 후 시작
                            {

                                chrome.notifications.create('zoomLessThan10Min',{
                                    type: 'basic',
                                    iconUrl:'',
                                    title:liveLecture.title + " Zoom 수업이 10분 이내에 시작해요!",
                                    message:liveLecture.class_name + " 강좌의 " + liveLecture.title + " 수업이 " + liveLecture.start_time + "에 시작해요. " +
                                        "수업에 늦지 않으시게 미리 Zoom에 접속해주세요.",
                                    priority:2,
                                    buttons: [
                                        {
                                            title:"바로가기"
                                        }
                                    ]

                                })
                            }
                        }

                    }
                );
            } else if (alarm.name === "ZoomCrawler") {
                const authorizationToken = "Bearer " + IcampusToken;
                const url = "https://canvas.skku.edu/learningx/api/v1/courses/"+course_Array[0].id+ "/total_learnstatus/users/"+userID;
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

                var httpRequest = new XMLHttpRequest();
                httpRequest.responseType='json';
                httpRequest.onreadystatechange = function() {
                    if(httpRequest.readyState == XMLHttpRequest.DONE && httpRequest.status == 200) {
                        document.getElementById("text").innerHTML = httpRequest.responseText;
                    }
                };

                httpRequest.open("GET", "URL", true);
                httpRequest.setRequestHeader("Authorization", authorizationToken);
                httpRequest.send();


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
            }

        }
);