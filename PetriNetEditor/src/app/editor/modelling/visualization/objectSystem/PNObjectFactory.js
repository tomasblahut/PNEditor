'use strict';

(function () {
    angular.module('PNObjectSystem', [
        'CanvasObjectSupport',
        'PNModelObjects',
        'PNHelperObjects'
    ])
        .factory('PNObjectFactory', function (CanvasObjectFactory, PNGraphPlace, PNGraphTransition, PNGraphArc, ArcMoovingPoint,
                                              Guideline, Magnet, Rotator, Selector) {

            function PNObjectFactory() {
                this._registeredObjects = [
                    {type: 'place', objectConstructor: PNGraphPlace},
                    {type: 'transition', objectConstructor: PNGraphTransition},
                    {type: 'arc', objectConstructor: PNGraphArc},
                    {type: 'arcMoovingPoint', objectConstructor: ArcMoovingPoint},
                    {type: 'guideline', objectConstructor: Guideline},
                    {type: 'magnet', objectConstructor: Magnet},
                    {type: 'rotator', objectConstructor: Rotator},
                    {type: 'selector', objectConstructor: Selector}
                ];
            }

            var factoryPrototype = createjs.extend(PNObjectFactory, CanvasObjectFactory);
            factoryPrototype._getRegisteredObjects = function () {
                return this._registeredObjects;
            };

            return PNObjectFactory;
        });
}());