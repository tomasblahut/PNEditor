'use strict';

(function () {
    angular.module('PNObjectEvents', [
        'CanvasEvents'
    ])
        .service('PNArcEvents', function (ArcBasicEvent) {
            return [
                {type: 'arcMousedown', eventConstructor: ArcBasicEvent},
                {type: 'arcClick', eventConstructor: ArcBasicEvent}
            ];
        })
        .factory('ArcBasicEvent', function (CanvasEvent) {
            function ArcBasicEvent(event) {
                this.Super_constructor(event);
                this.arc = event.target;
            }

            var eventPrototype = createjs.extend(ArcBasicEvent, CanvasEvent);
            return createjs.promote(ArcBasicEvent, 'Super');
        });
}());