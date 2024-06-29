'use strict';

(function () {
    angular.module('CanvasEvents', [])
        .factory('CanvasEvent', function () {

            function CanvasEvent(event) {
                this.x = event.stageX;
                this.y = event.stageY;

                this.button = EventUtils.translateButton(event);
            }

            return CanvasEvent;
        });
}());