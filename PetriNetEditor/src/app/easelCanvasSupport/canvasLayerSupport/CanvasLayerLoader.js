'use strict';

(function () {
    angular.module('CanvasLayerSupport')
        .factory('CanvasLayerLoader', function () {

            function CanvasLayerLoader() {
            }

            CanvasLayerLoader.prototype.loadLayers = function () {
                var layerInfo = this._getRegisteredLayers();
                _.sortBy(layerInfo, 'order');

                return _.map(layerInfo, function (info) {
                    var layer = _.clone(info);
                    layer.instance = new info.layerConstructor();
                    delete layer.layerConstructor;

                    return layer;
                });
            };

            /**
             * Returns array of objects which contains info about supported layers.
             * Each object consists of properties: type, order, layerConstructor. Type is
             * string identificator that is going to be used when requesting layer.
             * Order determines at what level should be layer added into Easel stage.
             * LayerConstructor is layer object constructor function.
             * @private
             */
            CanvasLayerLoader.prototype._getRegisteredLayers = function () {
                throw new Error('Method getLayers not implemented');
            };

            return CanvasLayerLoader;
        });
}());