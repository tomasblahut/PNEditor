'use strict';

(function () {
    angular.module('CanvasNavigationSupport', [
        'CanvasNavigationObjects'
    ])
        .factory('CanvasNavigator', function ($rootScope, $timeout, NavigationObjectFactory, SimpleLayer) {

            var STAGE_ZOOM_CHANGED = 'stageZoomChanged';

            function CanvasNavigator(api) {
                this._stageHandler = api.stageHandler;
                this._eventManager = api.eventManager;
                this._layerBus = api.layerBus;
                this._bgManager = api.bgManager;
            }

            CanvasNavigator.prototype.init = function () {
                this._navObjFactory = new NavigationObjectFactory();
                this._snapToGrid = true;

                //-- Shifting
                this._repaintNeeded = false;
                this._shiftSmoothness = 0;

                //-- Zoom
                this._zoomSetting = {
                    minZoom: 0.5,
                    maxZoom: 1.0,
                    zoomStep: 0.1,
                    curZoom: 1.0
                };
                this._zoomHelper = new createjs.Shape();

                //-- Indicators
                this._canvasSize = this._stageHandler.getCanvasSize();
                this._initIndicators();

                var navigator = this;
                this._listenerTokens = [
                    this._eventManager.addListener('bgMousedown', function (bmde) {
                        if (bmde.button === 'right') {
                            navigator.performPositionCorrection();
                            navigator.origPosition = new createjs.Point(bmde.x, bmde.y);
                        }
                    }),
                    this._eventManager.addListener('bgPressmove', function (bpme) {
                        if (navigator.origPosition) {
                            var newPosition = new createjs.Point(bpme.x, bpme.y);
                            navigator.shiftTo(newPosition);
                        }
                    }),
                    this._eventManager.addListener('bgPressup', function () {
                        delete navigator.origPosition;
                    }),
                    this._eventManager.addListener('stageMousewheel', function (smwe) {
                        var position = new createjs.Point(smwe.x, smwe.y);
                        navigator._scrollZoom(position, smwe.delta);
                    }),
                    this._eventManager.addListener('stageResize', function (sre) {
                        navigator.resize(sre.width, sre.height);
                    })
                ];
            };
            CanvasNavigator.prototype.restoreState = function () {
                var layers = this._layerBus.getLayers({navigationEnabled: true});
                _.forEach(layers, function (layer) {
                    layer.x = layer.y = 0;
                    layer.scaleX = layer.scaleY = 1.0;
                });

                this._zoomSetting.curZoom = 1.0;
                this._updateIndicators(layers);
                this._stageHandler.updateStage();
                this._notifyZoomChanged();
            };

            //- Shifting
            CanvasNavigator.prototype.centerPoint = function (point) {
                var canvasGlobalCenter = new createjs.Point(this._canvasSize.width / 2, this._canvasSize.height / 2);
                var movementVector = CanvasUtils.vector(point, canvasGlobalCenter);

                var shifted = this._shiftLayersAlongVector(movementVector, true);
                if (shifted) {
                    this._updateIndicators();
                }
                return shifted;
            };
            CanvasNavigator.prototype.shiftTo = function (position) {
                var moveVector = CanvasUtils.vector(this.origPosition, position);
                var shifted = this._checkVectorSmoothness(moveVector) && this._shiftLayersAlongVector(moveVector);

                if (shifted) {
                    this._updateIndicators();
                    this.origPosition = position;
                    this._stageHandler.updateStage();
                }
            };
            CanvasNavigator.prototype.performPositionCorrection = function () {
                var layers = this._layerBus.getLayers({navigationEnabled: true});
                if (layers.length > 0) {
                    var repairVector = this._calcLayerRepairVector(layers);
                    if (!repairVector.isZero()) {
                        CanvasUtils.moveAlongVector(repairVector, layers);
                    }

                    var needsRepaint = this._updateIndicators(layers);
                    if (needsRepaint) {
                        this._stageHandler.updateStage();
                    }
                }
            };
            CanvasNavigator.prototype._shiftLayersAlongVector = function (movementVector, skipSmoothnessCheck) {
                var shifted = skipSmoothnessCheck || movementVector.getLength() > this._shiftSmoothness;

                if (shifted) {
                    shifted = false;
                    var layers = this._layerBus.getLayers({navigationEnabled: true});
                    if (layers.length > 0) {
                        var layerBounds = this._calcLayersBounds(layers);
                        var correctVector = this._correctMovementVector(movementVector, layerBounds);

                        if (!correctVector.isZero()) {
                            shifted = true;
                            if (this._activeGrid) {
                                this._activeGrid.stageShifted(correctVector);
                            }
                            CanvasUtils.moveAlongVector(correctVector, layers);
                            this._updateObjectVisibility(layers);
                        }
                    }
                }

                return shifted;
            };

            CanvasNavigator.prototype._calcLayersBounds = function (layers) {
                var bounds = {};

                _.forEach(layers, function (layer) {
                    if (!bounds.topLeftX) {
                        bounds.topLeftX = layer.x;
                    }
                    if (!bounds.topLeftY) {
                        bounds.topLeftY = layer.y;
                    }

                    var layerBounds = layer.getTransformedBounds();
                    if (layerBounds) {
                        var botRightX = layerBounds.x + layerBounds.width;
                        var botRightY = layerBounds.y + layerBounds.height;
                        bounds.botRightX = !bounds.botRightX || bounds.botRightX < botRightX ? botRightX : bounds.botRightX;
                        bounds.botRightY = !bounds.botRightY || bounds.botRightY < botRightY ? botRightY : bounds.botRightY;
                    }
                });

                if (typeof bounds.botRightX === 'undefined') {
                    bounds.botRightX = bounds.topLeftX + this._canvasSize.width;
                }
                if (typeof bounds.botRightY === 'undefined') {
                    bounds.botRightY = bounds.topLeftY + this._canvasSize.height;
                }

                return bounds;
            };
            CanvasNavigator.prototype._calcLayerRepairVector = function (layers) {
                var layerBounds = this._calcLayersBounds(layers);
                var repairX = 0;
                var repairY = 0;

                if (layerBounds.topLeftX > 0) {
                    repairX = -layerBounds.topLeftX;
                }
                else if (layerBounds.botRightX < 0) {
                    repairX = -layerBounds.botRightX;
                }

                if (layerBounds.topLeftY > 0) {
                    repairY = -layerBounds.topLeftY;
                }
                else if (layerBounds.botRightY < 0) {
                    repairY = -layerBounds.botRightY;
                }

                return new CanvasUtils.Vector(repairX, repairY);
            };
            CanvasNavigator.prototype._correctMovementVector = function (movementVector, bounds) {
                var vector = movementVector.clone();

                if (bounds.topLeftX + vector.x > 0) {
                    vector.x = -bounds.topLeftX;
                }
                else if (bounds.botRightX + vector.x < 0) {
                    vector.x = -bounds.botRightX;
                }

                if (bounds.topLeftY + vector.y > 0) {
                    vector.y = -bounds.topLeftY;
                }
                else if (bounds.botRightY + vector.y < 0) {
                    vector.y = -bounds.botRightY;
                }

                return vector;
            };
            CanvasNavigator.prototype._checkVectorSmoothness = function (movementVector) {
                return movementVector.getLength() > this._shiftSmoothness;
            };

            //- Zooming
            CanvasNavigator.prototype.setZoomLevel = function (newZoom) {
                var canvasSize = this._stageHandler.getCanvasSize();
                var position = new createjs.Point(canvasSize.width / 2, canvasSize.height / 2);
                this._applyZoom(position, newZoom);
            };
            CanvasNavigator.prototype._scrollZoom = function (position, delta) {
                var newZoom = this._calculateNewZoom(delta);
                var zoomed = this._applyZoom(position, newZoom);
                if (zoomed) {
                    this._notifyZoomChanged();
                }
            };
            CanvasNavigator.prototype._applyZoom = function (position, newZoom) {
                this.performPositionCorrection();
                var actZoom = this._correctZoomLevel(newZoom);
                if (actZoom === this._zoomSetting.curZoom) {
                    return false;
                }
                return this._zoomLayers(position, actZoom);
            };
            CanvasNavigator.prototype._zoomLayers = function (position, newZoom) {
                var zoomChanged = false;

                try {
                    var layers = this._layerBus.getLayers({navigationEnabled: true});
                    if (layers.length) {
                        var layer = layers[0];
                        var local = layer.globalToLocal(position.x, position.y);
                        this._zoomHelper.x = local.x;
                        this._zoomHelper.y = local.y;
                        layer.addChild(this._zoomHelper);

                        _.forEach(layers, function (toUpdate) {
                            toUpdate.scaleX = toUpdate.scaleY = newZoom;
                        });

                        var afterGlobal = layer.localToGlobal(this._zoomHelper.x, this._zoomHelper.y);
                        layer.removeChild(this._zoomHelper);

                        var shiftVector = CanvasUtils.vector(afterGlobal, position);
                        var shifted = this._shiftLayersAlongVector(shiftVector, true);
                        if (!shifted) {
                            this._updateObjectVisibility(layers);
                        }
                        this._updateIndicators(layers);

                        this._zoomSetting.curZoom = newZoom;
                        this._stageHandler.updateStage();
                        zoomChanged = true;
                    }
                }
                catch (err) {
                    console.error('Error while zooming: ' + err);
                }

                return zoomChanged;
            };
            CanvasNavigator.prototype._correctZoomLevel = function (newZoom) {
                var actZoom = newZoom;
                if (newZoom > this._zoomSetting.maxZoom) {
                    actZoom = this._zoomSetting.maxZoom;
                }
                else if (newZoom < this._zoomSetting.minZoom) {
                    actZoom = this._zoomSetting.minZoom;
                }

                return actZoom;
            };
            CanvasNavigator.prototype._calculateNewZoom = function (delta) {
                var curZoom = this._zoomSetting.curZoom;
                var newZoom = curZoom;

                if (delta > 0 && curZoom < this._zoomSetting.maxZoom) {
                    newZoom = curZoom + this._zoomSetting.zoomStep;
                }
                else if (delta < 0 && curZoom > this._zoomSetting.minZoom) {
                    newZoom = curZoom - this._zoomSetting.zoomStep;
                }

                return newZoom;
            };
            CanvasNavigator.prototype._notifyZoomChanged = function () {
                var eventArgs = {
                    zoom: this._zoomSetting.curZoom,
                    contextId: this._stageHandler.getContextId()
                };
                $timeout(function () {
                    $rootScope.$broadcast(STAGE_ZOOM_CHANGED, eventArgs);
                });
            };

            //- Resizing
            CanvasNavigator.prototype.resize = function (width, height) {
                this._canvasSize = this._stageHandler.getCanvasSize();
                this.performPositionCorrection();

                if (this._activeGrid) {
                    this._activeGrid.stageResized(width, height);
                }
                this._updateObjectVisibility();
                this._stageHandler.updateStage();
            };

            //- Handling object visibility
            CanvasNavigator.prototype._updateObjectVisibility = function (loadedLayers) {
                var layers = loadedLayers || this._layerBus.getLayers({navigationEnabled: true});
                if (layers.length > 0) {
                    var canvasSize = this._stageHandler.getCanvasSize();
                    var min_x = -10;
                    var min_y = -10;
                    var max_x = canvasSize.width;
                    var max_y = canvasSize.height;

                    _.forEach(layers, function (layer) {
                        var displayObjects = layer.getDisplayObjects();
                        for (var index = 0; index < displayObjects.length; index++) {
                            var shape = displayObjects[index];
                            var bounds = shape.getBounds();
                            if (!bounds) {
                                continue;
                            }

                            var global = shape.localToGlobal(bounds.x, bounds.y);
                            var globalBounds = {
                                x: global.x,
                                y: global.y,
                                width: Math.round(bounds.width * layer.scaleX),
                                height: Math.round(bounds.height * layer.scaleY)
                            };

                            var visibleX = globalBounds.x < max_x && (globalBounds.x + globalBounds.width) > min_x;
                            var visibleY = globalBounds.y < max_y && (globalBounds.y + globalBounds.height) > min_y;
                            shape.visible = visibleX && visibleY;
                        }
                    });
                }
            };

            //- Indication
            CanvasNavigator.prototype._initIndicators = function () {
                var layers = this._layerBus.getLayers({navigationEnabled: true});
                if (layers.length > 0) {
                    var leftIndicator = this._navObjFactory.create('indicator', {navigator: this, vertical: true});
                    leftIndicator.x = 0;
                    leftIndicator.y = 0;

                    var topIndicator = this._navObjFactory.create('indicator', {navigator: this, vertical: false});
                    topIndicator.x = 0;
                    topIndicator.y = 0;

                    this._indicators = [leftIndicator, topIndicator];
                    this._indicatorLayer = new SimpleLayer();
                    this._indicatorLayer.addChild(leftIndicator);
                    this._indicatorLayer.addChild(topIndicator);
                    this._stageHandler.addLayer(this._indicatorLayer);
                }
            };
            CanvasNavigator.prototype._updateIndicators = function (layers) {
                var actLayers = layers || this._layerBus.getLayers({navigationEnabled: true});
                var bounds = this._calcLayersBounds(actLayers);
                var canvasSize = this._canvasSize;

                var needsRepaint = false;
                _.forEach(this._indicators, function (indicator) {
                    needsRepaint = indicator.updateDimensions({
                            canvasSize: canvasSize,
                            drawableArea: bounds
                        }) || needsRepaint;
                });
                return needsRepaint;
            };

            //- Grid
            CanvasNavigator.prototype.getSupportedGrids = function () {
                return this._navObjFactory.getSupportedGrids();
            };
            CanvasNavigator.prototype.setActiveGrid = function (type) {
                if (this._activeGrid) {
                    this._bgManager.hideGrid();
                    this._activeGrid = undefined;
                }

                var canvasSize = this._stageHandler.getCanvasSize();
                var gridOptions = {
                    width: canvasSize.width,
                    height: canvasSize.height,
                    zoom: this._currentZoom,
                    shift: this._currentShift
                };
                this._activeGrid = this._navObjFactory.create(type, gridOptions);
                this._bgManager.setGrid(this._activeGrid);

                this._stageHandler.updateStage();
            };
            CanvasNavigator.prototype.setGridVisible = function (visible) {
                if (visible) {
                    this._bgManager.setGrid(this._activeGrid);
                }
                else {
                    this._bgManager.hideGrid();
                }

                this._stageHandler.updateStage();
            };
            CanvasNavigator.prototype.setSnapToGrid = function (snap) {
                this._snapToGrid = snap;
            };
            CanvasNavigator.prototype.getNearestGridPoint = function (position, cardinality) {
                if (this._activeGrid && this._snapToGrid) {
                    return this._activeGrid.getNearestGridPoint(position, cardinality);
                }
                else {
                    return position;
                }
            };
            CanvasNavigator.prototype.moveAtGrid = function (globalPos, localPos, layerType, cardinality) {
                var gridPoint = this.getNearestGridPoint(globalPos, cardinality);
                var globalCheckPos = this._layerBus.globalPositionFrom(localPos, layerType);
                var position = (gridPoint.x === globalCheckPos.x && gridPoint.y === globalCheckPos.y) ? undefined : gridPoint;
                return position ? this._layerBus.localPositionAt(position, layerType) : undefined;
            };


            CanvasNavigator.prototype.dispose = function () {
                var tool = this;
                _.forEach(this._listenerTokens, function (token) {
                    tool._eventManager.clearListener(token);
                });
                this._listenerTokens = undefined;

                if (this._indicatorLayer) {
                    this._indicatorLayer.dispose();
                    this._stageHandler.removeLayer(this._indicatorLayer);
                }
                this._indicatorLayer = undefined;
                this._indicators = undefined;

                if (this._activeGrid) {
                    this._bgManager.hideGrid();
                }
                this._activeGrid = undefined;
            };

            return CanvasNavigator;
        });
}());