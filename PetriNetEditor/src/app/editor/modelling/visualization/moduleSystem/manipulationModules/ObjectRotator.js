'use strict';

(function () {
    angular.module('PNManipulationModules', [
        'BasicCanvasModules',
        'PNHighlights',
        'PNModuleAssets'
    ])
        .factory('ObjectRotator', function (CanvasDecoratorModule, AMP) {

            function ObjectRotator() {
                CanvasDecoratorModule.call(this);
                this._changedObjects = [];
                this.id = StringUtils.uuid();
            }

            var modulePrototype = createjs.extend(ObjectRotator, CanvasDecoratorModule);

            modulePrototype.canDecorateObject = function (canvasObject) {
                return canvasObject.type === 'transition';
            };

            modulePrototype.decorateObject = function (canvasObject) {
                if (canvasObject) {
                    var decoratedObject = this._decoratedObject = canvasObject;
                    var objCenter = decoratedObject.getCenter();

                    var rotator = this._rotator = this._objectFactory.create('rotator', {angle: decoratedObject.getRotation(true)});
                    rotator.x = objCenter.x;
                    rotator.y = objCenter.y;

                    var module = this;
                    this._listenerTokens = {
                        mousedown: rotator.on('mousedown', function () {
                            rotator.active = true;
                            rotator.drawObject();
                            module._stageHandler.updateStage();
                        }),
                        pressmove: rotator.on('pressmove', function (event) {
                            module._rotate(new createjs.Point(event.stageX, event.stageY));
                        }),
                        pressup: rotator.on('pressup', function () {
                            module._saveChanges();
                            rotator.active = false;
                            rotator.drawObject();
                            module._stageHandler.updateStage();
                        })
                    };

                    var enhancLayer = this._layerBus.getLayer('enhancement');
                    enhancLayer.addChild(rotator);
                }
            };

            modulePrototype.removeDecorations = function () {
                if (this._rotator) {
                    var enhancLayer = this._layerBus.getLayer('enhancement');
                    enhancLayer.removeChild(this._rotator);
                    this._rotator = undefined;
                }
                this._decoratedObject = undefined;
            };

            modulePrototype._rotate = function (position) {
                var rotationCenter = this._rotator.getCenter();
                var enhancLayer = this._layerBus.getLayer('enhancement');
                var localPosition = enhancLayer.globalToLocal(position.x, position.y);

                var decoratedObject = this._decoratedObject;
                var angle = CanvasUtils.circlePointAngle({center: rotationCenter}, localPosition, true);
                var oldAngle = decoratedObject.getRotation(true);
                var angleDelta = oldAngle - angle;

                if (Math.abs(angleDelta) > 5) {
                    angleDelta = 5 * Math.floor(angleDelta / 5);
                    angle = oldAngle - angleDelta;

                    decoratedObject.rotate(angle);
                    this._addChangedObject(decoratedObject);
                    this._rotator.setAngle(angle);
                    this._rotator.drawObject();

                    var module = this;
                    var pnConstructor = this._moduleBus.getModule('pnConstructor');
                    _.forEach(pnConstructor.findConnectedArcs(decoratedObject), function (arc) {
                        var arcPoints = arc.points;
                        var srcPoint = arc.src.id === decoratedObject.id ? arcPoints[0] : arcPoints[arcPoints.length - 1];
                        var destPoint = arc.src.id === decoratedObject.id ? arcPoints[1] : arcPoints[arcPoints.length - 2];

                        var draggedAmp = new AMP({point: srcPoint, arc: arc});
                        var neighborAmp = new AMP({point: destPoint, arc: arc});
                        draggedAmp[arc.src.id === decoratedObject.id ? 'next' : 'previous'] = neighborAmp;

                        var newLocation;
                        if (!draggedAmp.magnetic) {
                            newLocation = CanvasUtils.shapeCenterIntersect(draggedAmp.connectedObject, neighborAmp.getCalcPosition());
                        }
                        else {
                            newLocation = CanvasUtils.rotate(rotationCenter, draggedAmp.position, angleDelta);
                        }

                        draggedAmp.moveTo(newLocation);
                        arc.drawObject();
                        module._addChangedObject(arc);
                    });

                    this._stageHandler.updateStage();
                }
            };
            modulePrototype._addChangedObject = function (object) {
                var changedObject = _.find(this._changedObjects, function (changedObject) {
                    var matches = object.type === changedObject.type;
                    if (matches) {
                        if (object.type === 'arc') {
                            matches = object.src.id === changedObject.src.id && object.dest.id === changedObject.dest.id;
                        }
                        else {
                            matches = object.id === changedObject.id;
                        }
                    }
                    return matches;
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
                        }
                        else {
                            delegate = {
                                objId: changedObj.id,
                                changes: {
                                    gui: {rotation: changedObj.getRotation(true)}
                                }
                            };
                        }

                        delegate.type = 'update';
                        delegate.objType = changedObj.type;
                        return delegate;
                    });

                    var pnConstructor = this._moduleBus.getModule('pnConstructor');
                    pnConstructor.applyChanges(delegates);
                }
                finally {
                    this._changedObjects = [];
                }
            };

            modulePrototype.dispose = function () {
                this.removeDecorations();
            };

            return ObjectRotator;
        });
}());