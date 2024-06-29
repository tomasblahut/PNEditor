'use strict';

(function () {
    angular.module('PNMovementModules', [
        'CanvasModules',
        'PNModuleAssets'
    ])
        .factory('SetObjectMoover', function (AbstractObjectMoover) {

            function SetObjectMoover() {
                AbstractObjectMoover.call(this);
            }

            var modulePrototype = createjs.extend(SetObjectMoover, AbstractObjectMoover);

            modulePrototype.canDecorateObject = function (canvasObject) {
                var objectType = canvasObject && canvasObject.type;
                return objectType === 'pnObjectSet';
            };
            modulePrototype._initHandler = function (canvasObject, args) {
                var initPosition = this._layerBus.localPositionAt(args.initialPosition, 'net');
                return {
                    handledObject: canvasObject,
                    position: initPosition
                };
            };
            modulePrototype._calculateHandlerBounds = function () {
                var handledSet = this._movementHandler.handledObject;

                var bounds = {};
                _.forEach(handledSet.toArray(), function (obj) {
                    var curBounds = obj.getTransformedBounds();
                    if (!curBounds) {
                        return;
                    }

                    if (typeof bounds.x === 'undefined' || bounds.x > curBounds.x) {
                        bounds.x = curBounds.x;
                    }

                    if (typeof bounds.y === 'undefined' || bounds.y > curBounds.y) {
                        bounds.y = curBounds.y;
                    }
                });

                return _.isEmpty(bounds) ? this._movementHandler.position : bounds;
            };
            modulePrototype._doDecorate = function () {
                var module = this;

                function onMouseDown(event) {
                    var button = EventUtils.translateButton(event);
                    if (button === 'left') {
                        var position = new createjs.Point(event.stageX, event.stageY);
                        module._initSetMovement(position);
                    }
                }

                function onPressMove(event) {
                    var position = new createjs.Point(event.stageX, event.stageY);
                    module._executeSetMovement(position);
                }

                function onPressUp() {
                    module._commitSetMovement();
                }

                var handledSet = this._movementHandler.handledObject;
                this._listenerTokens = [];

                _.forEach(handledSet.toArray(), function (object) {
                    var listenerTokens = {
                        mousedown: object.on('mousedown', onMouseDown),
                        pressmove: object.on('pressmove', onPressMove),
                        pressup: object.on('pressup', onPressUp)
                    };
                    module._listenerTokens.push({object: object, listenerTokens: listenerTokens});
                });
            };

            modulePrototype._initSetMovement = function (position) {
                this._recordMovementStart(position);

                var handledSet = this._movementHandler.handledObject;
                var pnConstructor = this._moduleBus.getModule('pnConstructor');
                var arcsToMoveByAmp = [];

                _.forEach(handledSet.places, function (place) {
                    var arcTokens = _.map(pnConstructor.findConnectedArcs(place), function (arc) {
                        return {connectedObject: place, arc: arc};
                    });
                    arcsToMoveByAmp = arcsToMoveByAmp.concat(arcTokens);
                });

                _.forEach(handledSet.transitions, function (transition) {
                    var arcTokens = _.map(pnConstructor.findConnectedArcs(transition), function (arc) {
                        return {connectedObject: transition, arc: arc};
                    });
                    arcsToMoveByAmp = arcsToMoveByAmp.concat(arcTokens);
                });

                var idsToRemove = [];
                _.forEach(handledSet.arcs, function (arc) {
                    var endPoints = handledSet.identifyArcEndpoints(arc);
                    var keep = endPoints.isPartiallyAttached() && arc.points.length === 2;
                    if (!keep) {
                        idsToRemove.push(arc.id);
                    }
                });

                _.remove(arcsToMoveByAmp, function (arcToken) {
                    var arcToCheck = arcToken.arc;
                    return idsToRemove.indexOf(arcToCheck.id) !== -1;
                });

                handledSet.arcsToMoveByAmp = arcsToMoveByAmp;
            };
            modulePrototype._executeSetMovement = function (position) {
                if (this._dragInProgress) {
                    var moveVector = this._calculateMovementVector(position);
                    if (!moveVector.isZero()) {
                        var module = this;
                        var handledSet = this._movementHandler.handledObject;

                        //Move places
                        _.forEach(handledSet.places, function (place) {
                            CanvasUtils.moveAlongVector(moveVector, place);
                            module._addChangedObject(place);
                        });

                        //Move transitions
                        _.forEach(handledSet.transitions, function (transition) {
                            CanvasUtils.moveAlongVector(moveVector, transition);
                            module._addChangedObject(transition);
                        });

                        //Move arcs
                        _.forEach(handledSet.arcs, function (arc) {
                            var arcProcessed = true;

                            var endpoints = handledSet.identifyArcEndpoints(arc);
                            if (endpoints.isNotAttached()) {
                                arcProcessed = module._handleDetachedArc(moveVector, arc);
                            }
                            else if (endpoints.isPartiallyAttached()) {
                                arcProcessed = module._handlePartiallyAttachedArc(moveVector, endpoints, arc);
                            } else {
                                arcProcessed = module._handleFullyAttachedArc(moveVector, arc);
                            }

                            if (arcProcessed) {
                                arc.drawObject();
                                module._addChangedObject(arc);
                            }
                        });

                        _.forEach(handledSet.arcsToMoveByAmp, function (arcToken) {
                            module._moveConnectedAmp(moveVector, arcToken.connectedObject, arcToken.arc);
                        });

                        this._moveHandler(moveVector);
                        this._stageHandler.updateStage();
                    }
                }
            };
            modulePrototype._handleDetachedArc = function (moveVector, arc) {
                var arcPoints = arc.points;
                var arcProcessed = arcPoints.length >= 3;

                if (arcProcessed) {
                    var amps = this._createAmps(arc);
                    _.forEach(amps, function (amp, index) {
                        if (index > 0 && index < arcPoints.length - 1) {
                            amp.moveTo(CanvasUtils.pointAlongVector(amp.position, moveVector));
                        }
                    });
                }

                return arcProcessed;
            };
            modulePrototype._handlePartiallyAttachedArc = function (moveVector, endpoints, arc) {
                var arcPoints = arc.points;
                var arcProcessed = arcPoints.length > 2;

                if (arcProcessed) {
                    var draggedPoint, neighborPoint;
                    if (endpoints.hasSource()) {
                        draggedPoint = arcPoints[arcPoints.length - 2];
                        neighborPoint = arcPoints[arcPoints.length - 1];
                    }
                    else {
                        draggedPoint = arcPoints[1];
                        neighborPoint = arcPoints[0];
                    }

                    var draggedAmp = this._createBusAmp(draggedPoint, arc);
                    draggedAmp[endpoints.hasSource() ? 'next' : 'previous'] = this._createBusAmp(neighborPoint, arc);
                    draggedAmp.moveTo(CanvasUtils.pointAlongVector(draggedAmp.position, moveVector));

                    var vectorShiftPoints = arcPoints.slice(endpoints.src ? 0 : 2, endpoints.src ? arcPoints.length - 2 : arcPoints.length);
                    CanvasUtils.moveAlongVector(moveVector, vectorShiftPoints);
                }

                return arcProcessed;
            };
            modulePrototype._handleFullyAttachedArc = function (moveVector, arc) {
                CanvasUtils.moveAlongVector(moveVector, arc.points);
                return true;
            };

            modulePrototype._commitSetMovement = function () {
                if (this._dragInProgress) {
                    delete this._movementHandler.handledObject.arcsToMoveByAmp;
                    this._saveChanges();
                }
            };

            modulePrototype._doRemoveDecorations = function () {
                var listenerTokens = this._listenerTokens;
                _.forEach(listenerTokens, function (token) {
                    var object = token.object;
                    _.forEach(token.listenerTokens, function (wrapper, type) {
                        object.off(type, wrapper);
                    });
                });
            };

            return SetObjectMoover;
        });
}());