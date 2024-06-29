'use strict';

(function () {
    angular.module('SSObjectSystem', [
        'CanvasObjectSupport',
        'SSGraphObjects'
    ])
        .factory('SSObjectFactory', function (CanvasObjectFactory, SSGraphMarking, SSGraphArc) {

            function SSObjectFactory() {
                this._registeredObjects = [
                    {type: 'marking', objectConstructor: SSGraphMarking},
                    {type: 'arc', objectConstructor: SSGraphArc}
                ];
            }

            var factoryPrototype = createjs.extend(SSObjectFactory, CanvasObjectFactory);
            factoryPrototype._getRegisteredObjects = function () {
                return this._registeredObjects;
            };

            return SSObjectFactory;
        });
}());