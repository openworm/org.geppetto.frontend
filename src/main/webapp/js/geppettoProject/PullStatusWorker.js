
/**
 * Web worker for checking status of experiments
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
onmessage = function (e) {
    var timer = e.data;
    setInterval(function () {
        postMessage(timer);
    }, timer);
};