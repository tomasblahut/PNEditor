'use strict';

(function () {
    angular.module('PNObjectEvents')
        .service('PNTransitionEvents', function (TransitionBasicEvent) {
            return [
                {type: 'transitionClick', eventConstructor: TransitionBasicEvent},
                {type: 'transitionMousedown', eventConstructor: TransitionBasicEvent},
                {type: 'transitionMouseover', eventConstructor: TransitionBasicEvent},
                {type: 'transitionMouseout', eventConstructor: TransitionBasicEvent}
            ];
        })
        .factory('TransitionBasicEvent', function (CanvasEvent) {
            function TransitionBasicEvent(event) {
                this.Super_constructor(event);
                this.transition = event.target;
            }

            var eventPrototype = createjs.extend(TransitionBasicEvent, CanvasEvent);
            return createjs.promote(TransitionBasicEvent, 'Super');
        });
}());