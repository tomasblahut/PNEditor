'use strict';

(function () {
    angular.module('PNMovementModules')
        .factory('PTObjectMoover', function (AbstractObjectMoover) {

            function PTObjectMoover() {
                AbstractObjectMoover.call(this);
            }

            var modulePrototype = createjs.extend(PTObjectMoover, AbstractObjectMoover);

            modulePrototype.canDecorateObject = function (canvasObject) {
                var objectType = canvasObject && canvasObject.type;
                return objectType === 'place' ||
                    objectType === 'transition';
            };
            modulePrototype._initHandler = function (canvasObject) {
                return {
                    handledObject: canvasObject,
                    position: canvasObject.getCenter()
                };
            };
            modulePrototype._calculateHandlerBounds = function () {
                var handledPT = this._movementHandler.handledObject;
                var bounds = handledPT.getTransformedBounds();
                return bounds ? new createjs.Point(bounds.x, bounds.y) : this._movementHandler.position;
            };
            modulePrototype._doDecorate = function () {
                var module = this;
                var handledPT = this._movementHandler.handledObject;

                this._dragInProgress = true;
                this._listenerTokens = {
                    mousedown: handledPT.on('mousedown', function (event) {
                        var button = EventUtils.translateButton(event);
                        if (button === 'left') {
                            module._initPTMovement();
                        }
                    }),
                    pressmove: handledPT.on('pressmove', function (event) {
                        var position = new createjs.Point(event.stageX, event.stageY);
                        module._executePTMovement(position);
                    }),
                    pressup: handledPT.on('pressup', function () {
                        module._commitPTMovement();
                    })
                };
            };

            modulePrototype._initPTMovement = function () {
                var handledPT = this._movementHandler.handledObject;
                this._recordMovementStart(handledPT.getGlobalCenter());
            };
            modulePrototype._executePTMovement = function (position) {
                if (this._dragInProgress) {
                    var objSelector = this._moduleBus.getModule('objectSelector');
                    objSelector.supressOtherDecorations(this.id);

                    var draggedObj = this._getDraggedObj(position);
                    if (draggedObj instanceof createjs.Text) {
                        this._moveObjLabel(position);
                    }
                    else {
                        var moveVector = this._calculateMovementVector(position);
                        if (!moveVector.isZero()) {
                            var handledPT = this._movementHandler.handledObject;
                            CanvasUtils.moveAlongVector(moveVector, handledPT);

                            var guidelinesModule = this._moduleBus.getModule('guidelinesModule');
                            guidelinesModule.drawGuidlinesFor(handledPT);

                            var pnConstructor = this._moduleBus.getModule('pnConstructor');
                            var module = this;
                            _.forEach(pnConstructor.findConnectedArcs(handledPT), function (arc) {
                                module._moveConnectedAmp(moveVector, handledPT, arc);
                            });

                            this._moveHandler(moveVector);
                            this._addChangedObject(handledPT);
                            this._stageHandler.updateStage();
                        }
                    }
                }
            };
            modulePrototype._commitPTMovement = function () {
                if (this._dragInProgress) {
                    this._saveChanges();

                    var guidelinesModule = this._moduleBus.getModule('guidelinesModule');
                    guidelinesModule.restoreState();

                    var objSelector = this._moduleBus.getModule('objectSelector');
                    objSelector.cancelDecorationSuppression();
                }
            };

            modulePrototype._doRemoveDecorations = function () {
                if (this._movementHandler) {
                    var handledPT = this._movementHandler.handledObject;
                    _.forEach(this._listenerTokens, function (wrapper, type) {
                        handledPT.off(type, wrapper);
                    });
                }
            };

            return PTObjectMoover;
        });
}());