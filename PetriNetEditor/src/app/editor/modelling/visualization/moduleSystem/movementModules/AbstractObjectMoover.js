'use strict';

(function () {
    angular.module('PNMovementModules', [
        'CanvasModules',
        'PNModuleAssets'
    ])
        .factory('AbstractObjectMoover', function (CanvasDecoratorModule, AMP) {

            function AbstractObjectMoover() {
                CanvasDecoratorModule.call(this);
                this.id = StringUtils.uuid();
            }

            var modulePrototype = createjs.extend(AbstractObjectMoover, CanvasDecoratorModule);
            modulePrototype._doInit = function () {
                this._changedObjects = [];
            };

            modulePrototype.decorateObject = function (canvasObject, args) {
                this._movementHandler = this._initHandler(canvasObject, args);
                this._movementHandler.topLeftBound = this._calculateHandlerBounds();
                this._doDecorate();
            };
            modulePrototype._calculateHandlerBounds = function () {
                throw new Error('Method calculateHandlerBounds not implemented');
            };
            modulePrototype._doDecorate = function () {
                throw new Error('Method doDecorate not implemented');
            };

            modulePrototype.removeDecorations = function () {
                this._doRemoveDecorations();
                this._clearModuleData();
                this._movementHandler = undefined;
            };
            modulePrototype._doRemoveDecorations = function () {
                throw new Error('Method doRemoveDecorations not implemented');
            };
            modulePrototype._clearModuleData = function () {
                this._changedObjects = [];
                this._draggedObj = undefined;
                this._dragInProgress = false;
            };

            modulePrototype._recordMovementStart = function (position) {
                this._movementHandler.position = this._layerBus.localPositionAt(position, 'net');
                this._dragInProgress = true;
            };
            modulePrototype._moveHandler = function (movementVector) {
                CanvasUtils.moveAlongVector(movementVector, this._movementHandler.position);
                this._movementHandler.topLeftBound = this._calculateHandlerBounds();
            };

            modulePrototype._createAmps = function (arc) {
                var module = this;
                var busAmps = _.map(arc.points, function (point) {
                    return module._createBusAmp(point, arc);
                });

                _.forEach(busAmps, function (amp, index) {
                    amp.previous = index > 0 ? busAmps[index - 1] : undefined;
                    amp.next = index < busAmps.length - 1 ? busAmps[index + 1] : undefined;
                });

                return busAmps;
            };
            modulePrototype._createBusAmp = function (point, arc) {
                return new AMP({point: point, arc: arc});
            };
            modulePrototype._moveConnectedAmp = function (moveVector, connectedObject, arc) {
                var arcPoints = arc.points;
                var srcPoint = arc.src.id === connectedObject.id ? arcPoints[0] : arcPoints[arcPoints.length - 1];
                var destPoint = arc.src.id === connectedObject.id ? arcPoints[1] : arcPoints[arcPoints.length - 2];

                var draggedAmp = this._createBusAmp(srcPoint, arc);
                var neighborAmp = this._createBusAmp(destPoint, arc);
                draggedAmp[arc.src.id === connectedObject.id ? 'next' : 'previous'] = neighborAmp;

                var newLocation = draggedAmp.magnetic ?
                    CanvasUtils.pointAlongVector(moveVector, draggedAmp.position) :
                    CanvasUtils.shapeCenterIntersect(draggedAmp.connectedObject, neighborAmp.getCalcPosition());

                draggedAmp.moveTo(newLocation);
                arc.drawObject();
                this._addChangedObject(arc);
            };

            modulePrototype._getDraggedObj = function (position) {
                var handledObj = this._movementHandler.handledObject;
                var draggedObj = this._draggedObj;

                if (!draggedObj && handledObj) {
                    var locPoint = handledObj.globalToLocal(position.x, position.y);
                    this._draggedObj = handledObj.getObjectUnderPoint(locPoint.x, locPoint.y);
                }

                return this._draggedObj;
            };
            modulePrototype._moveObjLabel = function (position) {
                var gridGlobalPoint = this._navigator.getNearestGridPoint(position, 2);

                var handledObj = this._movementHandler.handledObject;
                var labelGlobalPoint = handledObj.getLabelGlobalPosition();
                if (labelGlobalPoint.x === gridGlobalPoint.x && labelGlobalPoint.y === gridGlobalPoint.y) {
                    return;
                }

                handledObj.moveLabel(gridGlobalPoint);
                this._movementHandler.topLeftBound = this._calculateHandlerBounds();

                this._addChangedObject(handledObj);
                this._stageHandler.updateStage();
            };
            modulePrototype._calculateMovementVector = function (position, cardinality) {
                var objLocalPoint = this._movementHandler.position;
                var gridLocalPoint = this._navigator.moveAtGrid(position, objLocalPoint, 'net', cardinality);
                if (!gridLocalPoint) {
                    return CanvasUtils.ZERO_VECTOR;
                }

                var moveVector = CanvasUtils.vector(objLocalPoint, gridLocalPoint);
                var topLeftBefore = this._movementHandler.topLeftBound;
                var topLeftAfter = CanvasUtils.pointAlongVector(moveVector, topLeftBefore);

                if (topLeftAfter.x < 0) {
                    moveVector.x = -topLeftBefore.x;
                }

                if (topLeftAfter.y < 0) {
                    moveVector.y = -topLeftBefore.y;
                }

                return moveVector;
            };

            modulePrototype._addChangedObject = function (object) {
                var changedObject = _.find(this._changedObjects, function (changedObject) {
                    return object.id === changedObject.id;
                });

                if (!changedObject) {
                    this._changedObjects.push(object);
                }
            };
            modulePrototype._saveChanges = function () {
                try {
                    var delegates = _.map(this._changedObjects, function (changedObj) {
                        var delegate;
                        if (changedObj.type === 'arc') {
                            delegate = {
                                srcId: changedObj.src.id,
                                destId: changedObj.dest.id,
                                changes: {
                                    points: changedObj.points
                                }
                            };

                            if (changedObj.connectionChanges) {
                                var magnets = changedObj.connectionChanges.magnets;
                                _.assign(delegate.changes, magnets.new);

                                var objects = changedObj.connectionChanges.objects;
                                if (objects) {
                                    delegate.changes.connection = objects;
                                }
                            }
                        }
                        else {
                            delegate = {
                                objId: changedObj.id,
                                changes: {
                                    position: new createjs.Point(changedObj.x, changedObj.y)
                                }
                            };
                        }

                        if (changedObj.labelPosition) {
                            delegate.changes.labelPosition = new createjs.Point(changedObj.labelPosition.x, changedObj.labelPosition.y);
                        }

                        delegate.type = 'update';
                        delegate.objType = changedObj.type;
                        return delegate;
                    });

                    var pnConstructor = this._moduleBus.getModule('pnConstructor');
                    pnConstructor.applyChanges(delegates);
                }
                finally {
                    this._clearModuleData();
                }
            };

            modulePrototype.dispose = function () {
                this.removeDecorations();
            };

            return AbstractObjectMoover;
        });
}());