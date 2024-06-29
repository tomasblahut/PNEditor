'use strict';

(function () {
    angular.module('EaselStageApi', [])
        .factory('EaselStageHandler', function () {

            createjs.Ticker.timingMode = createjs.Ticker.RAF;

            function EaselStageHandler(stage) {
                if (!stage) {
                    throw new Error('Cannot create EaselStageHandler without stage object');
                }

                this._stage = stage;
                this._canvas = stage.canvas;
                this._contextId = stage.canvas.id + Math.random();
            }

            EaselStageHandler.prototype.updateStage = function () {
                this._repaintNeeded = true;
                if (!this._tickListener) {
                    this._initRedrawing();
                }
            };
            EaselStageHandler.prototype.getCanvasSize = function () {
                return {width: this._canvas.width, height: this._canvas.height};
            };

            EaselStageHandler.prototype.addLayer = function (layer, position) {
                if (position) {
                    this._stage.addChildAt(layer, position);
                }
                else {
                    this._stage.addChild(layer);
                }
            };
            EaselStageHandler.prototype.removeLayer = function (layer) {
                this._stage.removeChild(layer);
            };

            EaselStageHandler.prototype.getStage = function () {
                return this._stage;
            };
            EaselStageHandler.prototype.getCanvas = function () {
                return this._canvas;
            };
            EaselStageHandler.prototype.getContextId = function () {
                return this._contextId;
            };

            EaselStageHandler.prototype._initRedrawing = function () {
                var handler = this;

                createjs.Ticker.init();
                this._tickListener = createjs.Ticker.on('tick', function () {
                    if (handler._repaintNeeded) {
                        handler._repaintNeeded = false;
                        handler._stage.update();
                        handler._ticksWithoutRepaint = 0;
                    }
                    else {
                        handler._ticksWithoutRepaint++;
                        if (handler._ticksWithoutRepaint >= 25) {
                            handler._stopRedrawing();
                        }
                    }
                });
            };
            EaselStageHandler.prototype._stopRedrawing = function () {
                createjs.Ticker.off('tick', this._tickListener);
                delete this._tickListener;
                this._ticksWithoutRepaint = 0;
                this._repaintNeeded = false;
            };

            EaselStageHandler.prototype.dispose = function () {
                this._stopRedrawing();
            };

            return EaselStageHandler;
        });
}());