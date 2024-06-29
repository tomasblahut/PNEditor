'use strict';

(function () {
    angular.module('SSLayerSystem', [
        'CanvasLayerSupport',
        'BasicCanvasLayers',
        'SSLayers'
    ])
        .factory('SSLayerLoader', function (CanvasLayerLoader, SimpleLayer, GraphLayer) {
            function SSLayerLoader() {
                this._registeredLayers = [
                    {
                        type: 'graph',
                        navigationEnabled: true,
                        order: 1,
                        layerConstructor: GraphLayer
                    }
                ];
            }

            var loaderPrototype = createjs.extend(SSLayerLoader, CanvasLayerLoader);
            loaderPrototype._getRegisteredLayers = function () {
                return this._registeredLayers;
            };

            return SSLayerLoader;
        });
}());