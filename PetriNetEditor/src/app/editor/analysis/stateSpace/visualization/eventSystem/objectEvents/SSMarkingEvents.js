'use strict';

(function () {
    angular.module('SSObjectEvents', [
        'CanvasEvents'
    ])
        .service('SSObjectEvents', function (MarkingBasicEvent) {
            return [
                {type: 'markingClick', eventConstructor: MarkingBasicEvent},
                {type: 'markingMouseover', eventConstructor: MarkingBasicEvent},
                {type: 'markingMouseout', eventConstructor: MarkingBasicEvent}
            ];
        })
        .factory('MarkingBasicEvent', function (CanvasEvent) {
            function MarkingBasicEvent(event) {
                this.Super_constructor(event);
                this.marking = event.target;
            }

            var eventPrototype = createjs.extend(MarkingBasicEvent, CanvasEvent);
            return createjs.promote(MarkingBasicEvent, "Super");
        });
}());