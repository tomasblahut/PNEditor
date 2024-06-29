'use strict';

(function () {
    angular.module('PNLayerSystem', [
        'CanvasLayerSupport',
        'BasicCanvasLayers',
        'PNLayers'
    ])
        .factory('PNLayerLoader', function (CanvasLayerLoader, SimpleLayer, NetLayer) {
            function PNLayerLoader() {
                this._registeredLayers = [
                    {
                        type: 'net',
                        navigationEnabled: true,
                        order: 1,
                        layerConstructor: NetLayer
                    },
                    {
                        type: 'enhancement',
                        navigationEnabled: true,
                        order: 2,
                        modes: 'modelling',
                        layerConstructor: SimpleLayer
                    },
                    {
                        type: 'selection',
                        order: 3,
                        layerConstructor: SimpleLayer
                    }
                ];
            }

            var loaderPrototype = createjs.extend(PNLayerLoader, CanvasLayerLoader);
            loaderPrototype._getRegisteredLayers = function () {
                return this._registeredLayers;
            };

            return PNLayerLoader;
        });
}());