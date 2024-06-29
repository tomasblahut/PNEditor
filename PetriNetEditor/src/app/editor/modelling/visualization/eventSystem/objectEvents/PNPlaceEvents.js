'use strict';

(function () {
    angular.module('PNObjectEvents')
        .service('PNPlaceEvents', function (PlaceBasicEvent) {
            return [
                {type: 'placeClick', eventConstructor: PlaceBasicEvent},
                {type: 'placeMousedown', eventConstructor: PlaceBasicEvent},
                {type: 'placeMouseover', eventConstructor: PlaceBasicEvent},
                {type: 'placeMouseout', eventConstructor: PlaceBasicEvent}
            ];
        })
        .factory('PlaceBasicEvent', function (CanvasEvent) {
            function PlaceBasicEvent(event) {
                this.Super_constructor(event);
                this.place = event.target;
            }

            var eventPrototype = createjs.extend(PlaceBasicEvent, CanvasEvent);
            return createjs.promote(PlaceBasicEvent, 'Super');
        });
}());