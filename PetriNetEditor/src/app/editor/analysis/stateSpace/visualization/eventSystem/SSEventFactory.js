'use strict';

(function () {
    angular.module('SSEventSystem', [
        'CanvasEventSupport',
        'SSObjectEvents'
    ])
        .factory('SSEventFactory', function (CanvasEventFactory, SSObjectEvents) {

            function SSEventFactory() {
                this._supportedEvents = _.union(SSObjectEvents);
            }

            var factoryPrototype = createjs.extend(SSEventFactory, CanvasEventFactory);
            factoryPrototype._getSupportedEvents = function () {
                return this._supportedEvents;
            };

            return SSEventFactory;
        });
}());