'use strict';

(function () {
    angular.module('CanvasLayerSupport', [])
        .factory('CanvasLayerBus', function () {
            function CanvasLayerBus(api) {
                this._api = api;
                this._stageHandler = api.stageHandler;
            }

            CanvasLayerBus.prototype.loadLayers = function (layerLoader, initialMode) {
                if (!layerLoader) {
                    throw new Error('Layer loader must be specified');
                }
                this.dispose();

                this._layers = layerLoader.loadLayers();
                this._activeLayers = [];
                this.switchToMode(initialMode);
            };
            CanvasLayerBus.prototype.getLayer = function (type) {
                var layer = _.find(this._activeLayers, 'type', type);
                if (!layer) {
                    throw new Error('Requested unknown layer type: ' + type);
                }
                return layer.instance;
            };

            CanvasLayerBus.prototype.getLayers = function (options) {
                var filteredLayers = [];

                if (options) {
                    if (options.navigationEnabled) {
                        filteredLayers = _.union(filteredLayers, _.filter(this._activeLayers, 'navigationEnabled', true));
                    }
                }
                else {
                    filteredLayers.push(this._activeLayers);
                }

                return _.pluck(filteredLayers, 'instance');
            };
            CanvasLayerBus.prototype.localPositionAt = function (globalPos, layerType) {
                var layer = this.getLayer(layerType);
                return layer.globalToLocal(globalPos.x, globalPos.y);
            };
            CanvasLayerBus.prototype.globalPositionFrom = function (localPos, layerType) {
                var layer = this.getLayer(layerType);
                return layer.localToGlobal(localPos.x, localPos.y);
            };

            CanvasLayerBus.prototype.switchToMode = function (mode) {
                var actMode = mode || 'all';
                var satisfactoryLayers = _.filter(this._layers, function (layer) {
                    var layerModes = layer.modes ? [].concat(layer.modes) : [];
                    return layerModes.length === 0 || layerModes.indexOf(actMode) !== -1;
                });

                var layerBus = this;
                var layersToRemove = _.difference(this._activeLayers, satisfactoryLayers);
                _.forEach(layersToRemove, function (layToRem) {
                    var layerInstance = layToRem.instance;
                    layerInstance.dispose();
                    layerBus._stageHandler.removeLayer(layerInstance);

                    var index = layerBus._activeLayers.indexOf(layToRem);
                    layerBus._activeLayers.splice(index, 1);
                });

                var layerIndex = 1;
                _.forEach(satisfactoryLayers, function (layToAdd) {
                    if (layerBus._activeLayers.indexOf(layToAdd) === -1) {
                        var layerInstance = layToAdd.instance;
                        layerInstance.init(layerBus._api);
                        layerBus._stageHandler.addLayer(layerInstance, layerIndex);
                    }
                    layerIndex++;
                });

                this._activeLayers = satisfactoryLayers;
            };

            CanvasLayerBus.prototype.dispose = function () {
                var layerBus = this;
                _.forEach(this._layers, function (layer) {
                    var layerInstance = layer.instance;
                    layerInstance.dispose();
                    layerBus._api.stageHandler.removeLayer(layerInstance);
                });
                this._layers = undefined;
                this._activeLayers = undefined;
            };

            return CanvasLayerBus;
        });
}());