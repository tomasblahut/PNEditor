'use strict';

(function () {
    angular.module('CanvasNavigationObjects', [
        'CanvasObjectSupport',
        'CanvasIndicators',
        'BasicCanvasGrids'
    ])
        .factory('NavigationObjectFactory', function (CanvasObjectFactory, PositionIndicator, SquareGrid) {

            function NavigationObjectFactory() {
                this._registeredObjects = [
                    {type: 'indicator', objectConstructor: PositionIndicator},
                    {type: 'grid_square', name: 'Square grid', objectConstructor: SquareGrid}
                ];
            }

            var factoryPrototype = createjs.extend(NavigationObjectFactory, CanvasObjectFactory);
            factoryPrototype._getRegisteredObjects = function () {
                return this._registeredObjects;
            };

            factoryPrototype.getSupportedGrids = function () {
                var registeredGrids = _.filter(this._registeredObjects, function (regObj) {
                    var strTokens = regObj.type.split('_');
                    return strTokens[0] === 'grid' && strTokens.length > 1;
                });

                return _.map(registeredGrids, function (regGrid) {
                    return {type: regGrid.type, name: regGrid.name};
                });
            };

            return NavigationObjectFactory;
        });
}());