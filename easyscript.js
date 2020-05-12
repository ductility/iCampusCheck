var course_Array = [];
var userID = null;
var thingsToDo = {"lecture":[], "assignment":[]};
var now = new Date();

function gapTime(now, date){
    return (new Date(date)).getTime() - now.getTime();
}

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
            userID = response[i].enrollments[0].user_id;
            course_Array.push(courseData);
        }
    }
    console.log(course_Array);
});

//과제 title과 id 맵핑해주기
var ID_Array = [];
for(var i=0; i<course_Array.length; i++) {
    var get_assignment_data = {
        "url": "https://canvas.skku.edu/api/v1/courses/"+course_Array[i].id+"/assignment_groups?include%5B%5D=assignments&exclude_response_fields%5B%5D=description&exclude_response_fields%5B%5D=rubric&override_assignment_dates=true&per_page=50",
        "method": "GET",
        "timeout": 0,
        "async": false,
        "dataType": "json"
    };
    $.ajax(get_assignment_data).done(function (response) {
        //과제
        if(response[0].assignment!=null || response[3].assignment!=null){
            for(var j=0; j<response[0].assignments.length; j++){

            }
        }


        var ID_TITLE = null;
        // console.log(response);
        for(var j=0; j<response.length; j++) {
            if(response[j].name == "과제"){
                for(var k=0; k<response[j].assignments.length; k++) {

                    ID_TITLE = {"course_id": course_Array[i].id, "course_name": course_Array[i].name}
                    ID_TITLE[response[j].assignments[k].id] = {"title": response[j].assignments[k].name, "type": "assignment"};

                    ID_Array.push(ID_TITLE);
                }
            }
            else if(response[j].name == "주차학습"){
                for(var k=0; k<response[j].assignments.length; k++) {
                    ID_TITLE[response[j].assignments[k].id] = {"id":course_Array[i].id, "courseName": course_Array[i].name, "title": response[j].assignments[k].name, "type": "lecture"};
                    ID_Array.push(ID_TITLE);
                }   
            }
        }
        if(ID_TITLE!=null) ID_Array.push(ID_TITLE);
    });
}
console.log(ID_Array);

for(var i=0; i<ID_Array.length; i++) {
    var get_submissions = {
        "url": "https://canvas.skku.edu/api/v1/courses/"+ID_Array[i].id+"/students/submissions?per_page=50",
        "method": "GET",
        "timeout": 0,
        "async": false,
        "dataType": "json"
    };
    $.ajax(get_submissions).done(function (response) {
        // console.log(response);
        for(var j=0; j<response.length; j++) {
            var remainingTime = gapTime(now, response[j].cached_due_date);
            if(remainingTime > 0 && response[j].workflow_state == "unsubmitted"){
                if(ID_Array[ID_Array[i].id][response[j].assignment_id].type == "assignment"){
                    thingsToDo.assignment.push({
                        "course":ID_Array[i].courseName,
                        "title":ID_Array[i][response[j].assignment_id].title,
                        "remainingTime_ms":remainingTime,
                        "due":new Date(response[j].cached_due_date)});
                }
                if(ID_Array[ID_Array[i].id][response[j].assignment_id].type == "lecture"){
                    thingsToDo.lecture.push({
                        "course":ID_Array[i].courseName,
                        "title":ID_Array[i][response[j].assignment_id].title,
                        "remainingTime_ms":remainingTime,
                        "due":new Date(response[j].cached_due_date)});
                }
            }
        }
    });
}
console.log(thingsToDo);