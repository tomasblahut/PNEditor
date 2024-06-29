'use strict';

(function () {
    angular.module('CanvasIndicators', [])
        .factory('PositionIndicator', function () {

            function PositionIndicator(args) {
                this.Super_constructor();

                this._navigator = _.get(args, 'navigator');
                this._margin = 12;
                this._secondaryAxisSize = 12;
                this._dimensions = {};

                this._vertical = _.get(args, 'vertical');
                this.drawObject();
            }

            var indicatorPrototype = createjs.extend(PositionIndicator, createjs.Container);
            indicatorPrototype.drawObject = function () {
                this.removeAllChildren();

                //Draw background
                var width = this._vertical ? this._secondaryAxisSize : this._dimensions.mainAxisSize;
                var height = this._vertical ? this._dimensions.mainAxisSize : this._secondaryAxisSize;

                var background = new createjs.Shape();
                background.graphics.beginFill('#4F5753')
                    .drawRect(0, 0, width, height);

                var indicator = this;
                background.on('mouseover', function (event) {
                    indicator._onMouseOver();
                });
                this.addChild(background);

                //Draw dragger
                this._dragger = this._buildDragger();
                this._dragger.x = this._vertical ? 2 : this._dimensions.draggerPosition;
                this._dragger.y = this._vertical ? this._dimensions.draggerPosition : 2;
                this.addChild(this._dragger);
            };
            indicatorPrototype._buildDragger = function () {
                var width = this._vertical ? this._secondaryAxisSize - 4 : this._dimensions.draggerSize;
                var height = this._vertical ? this._dimensions.draggerSize : this._secondaryAxisSize - 4;

                var dragger = new createjs.Shape();
                dragger.graphics.beginFill('#FF4080')
                    .drawRoundRect(0, 0, width, height, 2);
                dragger.cursor = 'pointer';

                var indicator = this;
                dragger.on('mouseover', function (event) {
                    indicator._onMouseOver();
                });
                dragger.on('mousedown', function (event) {
                    indicator._initMovement(event);
                });
                dragger.on('pressmove', function (event) {
                    indicator._performMovement(event);
                });
                dragger.on('pressup', function (event) {
                    indicator._disposeMovement();
                });

                return dragger;
            };

            indicatorPrototype._initMovement = function (event) {
                this._dragStart = this._vertical ? event.stageY : event.stageX;
                this._acumulatedDelta = 0;
            };
            indicatorPrototype._performMovement = function (event) {
                var curPos = this._vertical ? event.stageY : event.stageX;
                this._moveDragger(curPos);
                this._dragStart = curPos;
            };
            indicatorPrototype._moveDragger = function (curPos) {
                var delta = this._updateDraggerPosition(curPos);
                if (delta) {
                    var indicatorSize = this._dimensions.mainAxisSize - (2 * this._margin);
                    //LayerDelta sign has to be opposite. Layers move in opposite direction than indicators
                    var layerDelta = -Math.round((delta / indicatorSize) * this._dimensions.drawableAreaSize);
                    this._acumulatedDelta += layerDelta;

                    var shiftVector = new CanvasUtils.Vector(this._vertical ? 0 : this._acumulatedDelta, this._vertical ? this._acumulatedDelta : 0);
                    var shifted = this._navigator._shiftLayersAlongVector(shiftVector);
                    if (shifted) {
                        this._navigator._stageHandler.updateStage();
                        this._acumulatedDelta = 0;
                    }
                }
            };
            indicatorPrototype._updateDraggerPosition = function (curPos) {
                var delta = curPos - this._dragStart;
                var maxDragPos = this._dimensions.mainAxisSize - (this._dimensions.draggerSize + this._margin);
                var curDragPos = this._dimensions.draggerPosition;

                if (curDragPos + delta < this._margin) {
                    delta = -(curDragPos - this._margin);
                }
                else if (curDragPos + delta > maxDragPos) {
                    delta = maxDragPos - curDragPos;
                }

                var newDragPos = curDragPos + delta;
                this._dimensions.draggerPosition = newDragPos;
                this._dragger[this._vertical ? 'y' : 'x'] = newDragPos;
                return delta;
            };
            indicatorPrototype._disposeMovement = function () {
                delete this._dragStart;
            };

            indicatorPrototype._onMouseOver = function () {
                if (!this._dragStart) {
                    this._navigator.performPositionCorrection();
                }
            };

            indicatorPrototype.updateDimensions = function (args) {
                var newValues = this._calcIndicatorDimensions(args);
                var changesOccured = this._applyIndicatorDimensions(newValues);
                if (changesOccured) {
                    this.drawObject();
                }
                return changesOccured;
            };
            indicatorPrototype._calcIndicatorDimensions = function (args) {
                var canvasSize = args.canvasSize;
                var drawableArea = args.drawableArea;

                var mainAxisSize = this._vertical ? canvasSize.height : canvasSize.width;
                var mainAxisAreaSize = Math.abs(this._vertical ?
                        drawableArea.botRightY - drawableArea.topLeftY :
                        drawableArea.botRightX - drawableArea.topLeftX
                    ) + mainAxisSize;

                //Dragger size / indicator size = canvas size / drawableAreaSize
                var indicatorSize = mainAxisSize - (2 * this._margin);
                var draggerSize = Math.round((mainAxisSize / mainAxisAreaSize) * indicatorSize);

                //dragger position / indicator size = area offset / drawableAreaSize
                var areaOffset = Math.abs(this._vertical ? drawableArea.topLeftY : drawableArea.topLeftX);
                var draggerPosition = Math.round((areaOffset / mainAxisAreaSize) * indicatorSize) + this._margin;

                return {
                    drawableAreaSize: mainAxisAreaSize,
                    mainAxisSize: mainAxisSize,
                    draggerSize: draggerSize,
                    draggerPosition: draggerPosition
                };
            };
            indicatorPrototype._applyIndicatorDimensions = function (newDimensions) {
                var changesOccured = !_.isEqual(this._dimensions, newDimensions);
                if (changesOccured) {
                    this._dimensions = newDimensions;
                }

                return changesOccured;
            };

            return createjs.promote(PositionIndicator, "Super");
        });
})();