'use strict';

(function () {
    angular.module('CanvasBackgroundSupport', [
        'BasicCanvasLayers',
        'CanvasBackgroundObjects'
    ])
        .factory('CanvasBackgroundManager', function (SimpleLayer, CanvasBackground) {

            function CanvasBackgroundManager(api) {
                this._stageHandler = api.stageHandler;
                this._eventManager = api.eventManager;
            }

            CanvasBackgroundManager.prototype.init = function () {
                this._bgLayer = new SimpleLayer();
                this._bgLayer.init(this._eventManager);

                var options = this._stageHandler.getCanvasSize();
                this._background = new CanvasBackground(options);
                this._background.x = 0;
                this._background.y = 0;

                this._bgLayer.addChild(this._background);
                this._stageHandler.addLayer(this._bgLayer);

                this._initBackgroundEvents();
            };
            CanvasBackgroundManager.prototype._initBackgroundEvents = function () {
                var bgManager = this;
                this._listenerTokens = {
                    click: bgManager._background.on('click', function (event) {
                        bgManager._eventManager.fireEvent('bgClick', event);
                    }),
                    mousedown: bgManager._background.on('mousedown', function (event) {
                        bgManager._eventManager.fireEvent('bgMousedown', event);
                    }),
                    pressmove: bgManager._background.on('pressmove', function (event) {
                        bgManager._eventManager.fireEvent('bgPressmove', event);
                    }),
                    pressup: bgManager._background.on('pressup', function (event) {
                        bgManager._eventManager.fireEvent('bgPressup', event);
                    })
                };

                this._systemListenerTokens = [
                    this._eventManager.on('stageResize', function (sre) {
                        bgManager._redrawBackground(sre.width, sre.height);
                    })
                ];
            };

            CanvasBackgroundManager.prototype._redrawBackground = function (width, height) {
                var canvas = this._stageHandler.getCanvas();
                canvas.width = width;
                canvas.height = height;

                if (this._background) {
                    this._background.width = width;
                    this._background.height = height;
                    this._background.drawObject();
                }

                this._stageHandler.updateStage();
            };
            CanvasBackgroundManager.prototype.setGrid = function (gridObj) {
                this.hideGrid();

                if (gridObj) {
                    this._grid = this._bgLayer.addChild(gridObj);
                }
            };
            CanvasBackgroundManager.prototype.hideGrid = function () {
                if (this._grid) {
                    this._bgLayer.removeChild(this._grid);
                }
                this._grid = undefined;
            };

            CanvasBackgroundManager.prototype.dispose = function () {
                var bgManager = this;
                _.forEach(this._listenerTokens, function (wrapper, type) {
                    bgManager._background.off(type, wrapper);
                });
                this._listenerTokens = undefined;

                _.forEach(this._systemListenerTokens, function (token) {
                    bgManager._eventManager.clearListener(token);
                });
                this._systemListenerTokens = undefined;

                this._background = undefined;
                this._bgLayer.dispose();
                this._stageHandler.removeLayer(this._bgLayer);
                this._bgLayer = undefined;
            };

            return CanvasBackgroundManager;
        });
}());