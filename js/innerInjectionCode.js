var DOMAIN = "https://canvas.skku.edu";

async function inner(){
    var tempCourses=null;
    var cookie = document.cookie.match('(^|;) ?' + "xn_api_token" + '=([^;]*)(;|$)');
    cookie = cookie? cookie[2] : null;
    if(cookie==null)
    {
        
        var get_courses=
        {
            "url":`${DOMAIN}/api/v1/courses`,
            "method":"GET",
            "timeout":0,
            "async":false,
            "dataType":"json"
        };
        await $.ajax(get_courses).done
        (
            function(response){
                tempCourses=response;
            }
        )
    }
    return inner2(tempCourses);
}

function inner2(result){
    console.log(result);
    item_list = []
    if(result!=null){
        var index = 0;
        while(!result[index].hasOwnProperty("name")) index = index + 1;
        item_list.push(result[index].id);
    }
    return item_list;
}

inner();
