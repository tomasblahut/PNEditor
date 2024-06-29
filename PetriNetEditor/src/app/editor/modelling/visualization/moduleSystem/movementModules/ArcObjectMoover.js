'use strict';

(function () {
    angular.module('PNMovementModules')
        .factory('ArcObjectMoover', function (AbstractObjectMoover) {

            function ArcObjectMoover() {
                AbstractObjectMoover.call(this);
            }

            var modulePrototype = createjs.extend(ArcObjectMoover, AbstractObjectMoover);

            modulePrototype.canDecorateObject = function (canvasObject) {
                var objectType = canvasObject && canvasObject.type;
                return objectType === 'arc';
            };
            modulePrototype._initHandler = function (canvasObject, args) {
                var initPosition = this._layerBus.localPositionAt(args.initialPosition, 'net');
                return {
                    handledObject: canvasObject,
                    position: initPosition
                };
            };
            modulePrototype._calculateHandlerBounds = function () {
                var handledArc = this._movementHandler.handledObject;
                var bounds = handledArc.getTransformedBounds();
                return bounds ? new createjs.Point(bounds.x, bounds.y) : this._movementHandler.position;
            };
            modulePrototype._doDecorate = function () {
                var module = this;
                var handledArc = this._movementHandler.handledObject;

                this._dragInProgress = true;
                this._listenerTokens = {
                    dblclick: handledArc.on('dblclick', function (event) {
                        var position = new createjs.Point(event.stageX, event.stageY);
                        module._addArcPoint(position);
                    }),
                    mousedown: handledArc.on('mousedown', function (event) {
                        var button = EventUtils.translateButton(event);
                        if (button === 'left') {
                            var position = new createjs.Point(event.stageX, event.stageY);
                            module._initArcMovement(position);
                        }
                    }),
                    pressmove: handledArc.on('pressmove', function (event) {
                        var position = new createjs.Point(event.stageX, event.stageY);
                        module._executeArcMovement(position);
                    }),
                    pressup: handledArc.on('pressup', function () {
                        module._commitArcMovemenet();
                    })
                };

                var enhancLayer = this._layerBus.getLayer('enhancement');
                var busAmps = this._createAmps(handledArc);
                this._amps = _.map(busAmps, function (busAmp) {
                    var guiAmp = module._createGuiAmp(busAmp);
                    enhancLayer.addChild(guiAmp);
                    return {bus: busAmp, gui: guiAmp};
                });
            };

            modulePrototype._addArcPoint = function (point) {
                var bendPoint = this._layerBus.localPositionAt(point, 'enhancement');
                var handledArc = this._movementHandler.handledObject;
                var arcPoints = handledArc.points;

                var module = this;
                for (var index = 0; index < arcPoints.length - 1; index++) {
                    var segStart = arcPoints[index];
                    var segEnd = arcPoints[index + 1];

                    if (CanvasUtils.liesOnSegment(segStart, segEnd, bendPoint)) {
                        handledArc.points.splice(index + 1, 0, bendPoint);

                        var newBusAmp = module._createBusAmp(bendPoint, handledArc);
                        var newGuiAmp = module._createGuiAmp(newBusAmp);

                        var prevAmp = module._amps[index].bus;
                        var nextAmp = module._amps[index + 1].bus;

                        module._amps.splice(index + 1, 0, {bus: newBusAmp, gui: newGuiAmp});

                        newBusAmp.previous = prevAmp;
                        prevAmp.next = newBusAmp;
                        newBusAmp.next = nextAmp;
                        nextAmp.previous = newBusAmp;

                        var enhancLayer = module._layerBus.getLayer('enhancement');
                        enhancLayer.addChild(newGuiAmp);

                        module._stageHandler.updateStage();
                        module._changedObjects.push(handledArc);
                        module._saveChanges();
                        break;
                    }
                }
            };
            modulePrototype._initArcMovement = function (position) {
                this._recordMovementStart(position);
            };
            modulePrototype._executeArcMovement = function (position) {
                if (this._dragInProgress) {
                    var draggedObj = this._getDraggedObj(position);

                    if (draggedObj instanceof createjs.Text) {
                        this._moveObjLabel(position);
                    }
                    else {
                        var handledArc = this._movementHandler.handledObject;
                        var arcPoints = handledArc.points;
                        if (arcPoints < 3) {
                            return;
                        }

                        var moveVector = this._calculateMovementVector(position, 2);
                        if (!moveVector.isZero()) {
                            var busAmps = _.pluck(this._amps, 'bus');

                            _.forEach(busAmps, function (amp, index) {
                                if (index > 0 && index < arcPoints.length - 1) {
                                    amp.moveTo(CanvasUtils.pointAlongVector(moveVector, amp.position));
                                }
                            });

                            handledArc.drawObject();
                            this._moveHandler(moveVector);
                            this._addChangedObject(handledArc);
                            this._stageHandler.updateStage();
                        }
                    }
                }
            };
            modulePrototype._commitArcMovemenet = function () {
                if (this._dragInProgress) {
                    this._saveChanges();
                }
            };

            modulePrototype._createGuiAmp = function (busAmp) {
                var guiAmp = this._objectFactory.create('arcMoovingPoint');
                guiAmp.x = busAmp.position.x;
                guiAmp.y = busAmp.position.y;
                busAmp.assignGuiComponent(guiAmp);

                var module = this;
                guiAmp._listenerTokens = {
                    mousedown: guiAmp.on('mousedown', function (event) {
                        var button = EventUtils.translateButton(event);
                        if (button === 'left') {
                            module._initAmpMovement(guiAmp, busAmp);
                        }
                    }),
                    pressmove: guiAmp.on('pressmove', function (event) {
                        var position = new createjs.Point(event.stageX, event.stageY);
                        module._executeAmpMovement(guiAmp, busAmp, position);
                    }),
                    pressup: guiAmp.on('pressup', function () {
                        module._commitAmpMovement(guiAmp, busAmp);
                    }),
                    click: guiAmp.on('click', function (event) {
                        var button = EventUtils.translateButton(event);
                        if (button === 'right') {
                            module._removeAmp(guiAmp, busAmp);
                        }
                    })
                };

                return guiAmp;
            };
            modulePrototype._initAmpMovement = function (guiAmp, busAmp) {
                guiAmp.beingDragged = true;

                if (busAmp.connectedObject) {
                    var handledArc = this._movementHandler.handledObject;
                    var srcOCP = {
                        conObj: busAmp.startOfArc ? handledArc.dest : handledArc.src,
                        magnetic: busAmp.startOfArc ? handledArc.destMagnetic : handledArc.srcMagnetic
                    };

                    var objConnector = this._moduleBus.getModule('objectConnector');
                    objConnector.setSource(srcOCP);
                    objConnector.initConnection();

                    //So that mouseover events are triggered on objects, that this object is hovered over
                    guiAmp.mouseEnabled = false;
                }
            };
            modulePrototype._executeAmpMovement = function (guiAmp, busAmp, position) {
                if (!guiAmp.beingDragged) {
                    return;
                }

                var gridLocalPoint = this._navigator.moveAtGrid(position, busAmp.position, 'enhancement', 2);
                if (gridLocalPoint) {
                    busAmp.moveTo(gridLocalPoint);

                    var handledArc = this._movementHandler.handledObject;
                    handledArc.drawObject();
                    this._movementHandler.topLeftBound = this._calculateHandlerBounds();

                    this._addChangedObject(handledArc);
                    this._stageHandler.updateStage();
                }
            };
            modulePrototype._commitAmpMovement = function (guiAmp, busAmp) {
                if (!guiAmp.beingDragged) {
                    return;
                }
                guiAmp.beingDragged = false;
                guiAmp.mouseEnabled = true;

                var objConnector = this._moduleBus.getModule('objectConnector');
                var handledArc = this._movementHandler.handledObject;

                try {
                    if (busAmp.connectedObject) {
                        objConnector.alterArcConnection(busAmp);
                        busAmp.applyChanges(handledArc);
                    }

                    if (busAmp.changesOccured()) {
                        this._saveChanges();
                        busAmp.updateOriginData();
                    }
                }
                catch (err) {
                    console.error('Error while reconnecting arc. ' + err.toLocaleString());
                    busAmp.resetToOrigin(handledArc);
                }
                finally {
                    delete handledArc.connectionChanges;
                    handledArc.drawObject();
                    objConnector.restoreState(true);
                }
            };
            modulePrototype._removeAmp = function (guiAmp, busAmp) {
                if (busAmp.connectedObject) {
                    return; //Cannot remove arc points directly connected to other object
                }
                var handledArc = this._movementHandler.handledObject;
                var arcPoints = handledArc.points;

                var pointIndex = arcPoints.indexOf(busAmp.position);
                arcPoints.splice(pointIndex, 1);
                busAmp.adjustNeighborsAfterRemoval();
                handledArc.drawObject();

                var enhancLayer = this._layerBus.getLayer('enhancement');
                enhancLayer.removeChild(guiAmp);

                this._stageHandler.updateStage();
                this._changedObjects.push(handledArc);
                this._saveChanges();
            };

            modulePrototype._doRemoveDecorations = function () {
                if (this._movementHandler) {
                    var handlerArc = this._movementHandler.handledObject;
                    _.forEach(this._listenerTokens, function (wrapper, type) {
                        handlerArc.off(type, wrapper);
                    });
                }

                var enhancLayer = this._layerBus.getLayer('enhancement');
                _.forEach(this._amps, function (arcDecor) {
                    var guiAmp = arcDecor.gui;
                    _.forEach(guiAmp._listenerTokens, function (wrapper, type) {
                        guiAmp.off(type, wrapper);
                    });

                    enhancLayer.removeChild(guiAmp);
                });
                this._amps = [];
            };

            return ArcObjectMoover;
        });
}());