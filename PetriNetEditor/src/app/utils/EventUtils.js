'use strict';

var EventUtils = {};

(function () {
    EventUtils.translateButton = function (event) {
        var button = event && (event.button || (event.nativeEvent && event.nativeEvent.button));

        var btnStr;
        switch (button) {
            case 0:
            {
                btnStr = 'left';
                break;
            }
            case 1:
            {
                btnStr = 'middle';
                break;
            }
            case 2:
            {
                btnStr = 'right';
                break;
            }
        }

        return btnStr;
    };
}());