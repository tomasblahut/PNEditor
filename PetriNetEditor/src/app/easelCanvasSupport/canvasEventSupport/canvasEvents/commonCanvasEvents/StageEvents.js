'use strict';

(function () {
    angular.module('CommonCanvasEvents', [
        'CanvasEvents'
    ])
        .service('StageEvents', function (CanvasEvent, StageMousewheelEvent, StageResizeEvent) {
            return [
                {type: 'stageMousemove', eventConstructor: CanvasEvent},
                {type: 'stageMousewheel', eventConstructor: StageMousewheelEvent},
                {type: 'stageResize', eventConstructor: StageResizeEvent}
            ];
        })
        .factory('StageMousewheelEvent', function (CanvasEvent) {
            function StageMousewheelEvent(event) {
                this.Super_constructor(event);
                this.delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
            }

            var eventPrototype = createjs.extend(StageMousewheelEvent, CanvasEvent);
            return createjs.promote(StageMousewheelEvent, 'Super');
        })
        .factory('StageResizeEvent', function () {
            function StageResizeEvent(event) {
                this.width = event.width;
                this.height = event.height;
            }

            return StageResizeEvent;
        });
}());