'use strict';

(function () {
    angular.module('CommonCanvasEvents')
        .service('BackgroundEvents', function (CanvasEvent) {
            return [
                {type: 'bgClick', eventConstructor: CanvasEvent},
                {type: 'bgMousedown', eventConstructor: CanvasEvent},
                {type: 'bgPressmove', eventConstructor: CanvasEvent},
                {type: 'bgPressup', eventConstructor: CanvasEvent}
            ];
        });
}());