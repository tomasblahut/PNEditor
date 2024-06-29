'use strict';

(function () {
    angular.module('PNEventSystem', [
        'CanvasEventSupport',
        'PNObjectEvents',
        'PNKeyEvents'
    ])
        .factory('PNEventFactory', function (CanvasEventFactory, PNPlaceEvents, PNTransitionEvents, PNArcEvents, PNKeyEvents) {

            function PNEventFactory() {
                this._supportedEvents = _.union(PNPlaceEvents, PNTransitionEvents, PNArcEvents, PNKeyEvents);
            }

            var factoryPrototype = createjs.extend(PNEventFactory, CanvasEventFactory);
            factoryPrototype._getSupportedEvents = function () {
                return this._supportedEvents;
            };

            return PNEventFactory;
        });
}());