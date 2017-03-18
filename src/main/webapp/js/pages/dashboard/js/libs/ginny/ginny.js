//Created by azee

(function(global) {
    var Ginny = function() {};

    //Init function
    Ginny.init = function() {
        //Support TRIM in IE
        if(typeof String.prototype.trim !== 'function') {
            String.prototype.trim = function() {
                return this.replace(/^\s+|\s+$/g, '');
            }
        }
    };

    //Get a parameter value from the location
    Ginny.getParameterByName = function (name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.search);
        if (results == null)
            return "";
        else
            return decodeURIComponent(results[1].replace(/\+/g, " "));
    };


    //Get a cookie value by name
    Ginny.getCookie = function(name) {
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ))
        return matches ? decodeURIComponent(matches[1]) : undefined
    }

    //Escape html tags from a string
    Ginny.escapeHtml = function(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    };


    //Convert milliseconds to date and time
    Ginny.timeToDate = function (time) {
        var date = new Date(parseInt(time));
        var currMinutes = date.getMinutes();
        var monthNames = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
        if (currMinutes < 10) {
            currMinutes = "0" + currMinutes;
        }
        return date.getDate() + " " + monthNames[date.getMonth()]
            + " " + date.getHours() + ":" + currMinutes;
    };

    //Convert milliseconds to date
    Ginny.timeToDateNoTime = function (time) {
        var date = new Date(parseInt(time));
        var monthNames = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
        return date.getDate() + " " + monthNames[date.getMonth()];
    };

    //Convert milliseconds to time - how many time passed
    Ginny.timePassed = function (passedTime, undefinedAsZero){
        var passedTimeDisplayValue;

        if (passedTime == null || passedTime == undefined || passedTime == 'undefined' || passedTime == "" || passedTime == 0){
            if (undefinedAsZero){
                passedTimeDisplayValue = "0";
            } else {
                passedTimeDisplayValue = "Undefined";
            }

        }

        if (passedTime > 0 && passedTime < 1000 ){
            passedTimeDisplayValue = "Less than 1 second"
        }

        if (passedTime >= 1000 && passedTime < 60000 ){
            passedTimeDisplayValue = Math.floor(passedTime / 1000) + " sec"
        }

        if (passedTime >= 60000 && passedTime < 3600000 ){
            passedTimeDisplayValue = Math.floor(passedTime / 60000) + " min"
        }

        if (passedTime >= 3600000 ){
            passedTimeDisplayValue = Math.floor(passedTime / 3600000) + " hour "
            passedTimeDisplayValue = passedTimeDisplayValue +
                Math.floor(((passedTime/3600000 - Math.floor(passedTime / 3600000)) * 60)) +  " min"
        }
        return passedTimeDisplayValue;
    };

    //Create an array from comma separated string
    Ginny.stringToArray = function(str){
        var result = str.split(',');
        for (i in result){
            result[i] = result[i].trim();
        }
        return result;
    };

    //Return a comma separated string from an array
    Ginny.arrayToString = function(arr){
        var result = "";
        for (i in arr){
            var currentValue = $.trim(arr[i]);
            if (currentValue != ""){
                result = result + ", " + currentValue;
            }
        };
        result = result.replace(/^,/, '').trim();
        return result;
    };

    Ginny.init();
    global.Ginny = Ginny;

})(window);