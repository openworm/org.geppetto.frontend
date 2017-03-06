
/**
 * Web worker for counting steps
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
var lastExecutedStep = 0;
var isPaused = false;
var play = false;
var lastStepConsumed = true;
var step = 1;


onmessage = function (e) {
    if (e.data[0] == "experiment:pause") {
        isPaused = true;
    } else if (e.data[0] == "experiment:resume") {
        isPaused = false;
    } else if (e.data[0] == "experiment:lastStepConsumed") {
        lastStepConsumed = true;
    } else if (e.data[0] == "experiment:loop") {
        lastExecutedStep = 0;
        postMessage([lastExecutedStep, step]);
    } else if (e.data[0] == "experiment:play") {
        play = true;
        var timer = e.data[1];
        step = e.data[2];

        setInterval(function () {
            if (!isPaused && lastStepConsumed) {
                lastExecutedStep = lastExecutedStep + step;
                postMessage([lastExecutedStep]);
                lastStepConsumed = false;
            }
        }, timer);
    }
};