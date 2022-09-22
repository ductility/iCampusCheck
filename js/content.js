function getCookie(name="xn_api_token") {
    console.log("getcookie");
    var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    console.log(value);
    return value? value[2] : null;
};
console.log("getCookie");
getCookie();