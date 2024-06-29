'use strict';

(function () {
    angular.module('PNModelObjects', [
        'BasicCanvasObjects'
    ])
        .factory('PNGraphPlace', function (CanvasObject) {

            function PNGraphPlace(pnPlace) {
                CanvasObject.call(this, pnPlace);

                this.id = pnPlace.id;
                this.name = pnPlace.name;
                this.tokens = pnPlace.tokens;
                this.labelPosition = pnPlace.labelPosition;

                this.drawObject();
            }

            var placePrototype = createjs.extend(PNGraphPlace, CanvasObject);
            placePrototype._gui = {
                radius: 20,
                bodyColor: '#FAFAFA',
                shadowColor: '#656565',
                tokenColor: '#2E2E2E',
                border: {
                    width: 2.5,
                    color: '#2E2E2E'
                },
                label: {
                    font: 'Arial',
                    font_size: 20,
                    font_weight: 'normal',
                    color: '#2E2E2E'
                }
            };

            placePrototype.applyChanges = function (pnPlace) {
                this.x = pnPlace.position.x;
                this.y = pnPlace.position.y;
                this.labelPosition = pnPlace.labelPosition;
            };
            placePrototype._doDrawObject = function () {
                var gui = this._gui;

                var background = new createjs.Shape();
                background.graphics
                    .beginFill(this._getBodyColor())
                    .drawCircle(0, 0, gui.radius)
                    .endFill();
                background.shadow = this._getShadow();
                background.setBounds(-gui.radius, -gui.radius, gui.radius * 2, gui.radius * 2);
                this.addChild(background);

                var bgBorder = new createjs.Shape();
                bgBorder.graphics.setStrokeStyle(gui.border.width)
                    .beginStroke(this._getBorderColor())
                    .drawCircle(0, 0, gui.radius)
                    .endStroke();
                this.addChild(bgBorder);

                var tokenShape = this._drawTokens();
                if (tokenShape) {
                    this.addChild(tokenShape);
                }

                if (!this.labelPosition) {
                    this.labelPosition = new createjs.Point(0, gui.radius + 15);
                }
            };
            placePrototype._drawTokens = function () {
                var gui = this._gui;

                var tokenShape;
                if (this._highlight && this._highlight.data) {
                    tokenShape = new createjs.Text(this._highlight.data, 'bold 15px Arial', this._getDataTextColor());
                    tokenShape.textBaseline = 'middle';
                    tokenShape.textAlign = 'center';
                    tokenShape.x = 0;
                    tokenShape.y = 0;
                }
                else {
                    var tokenRadius = gui.radius / 4;

                    if (this.tokens === 1) {
                        tokenShape = new createjs.Shape();
                        tokenShape.graphics
                            .beginFill(gui.tokenColor)
                            .drawCircle(0, 0, tokenRadius)
                            .endFill();
                    } else if (this.tokens > 1 && this.tokens < 6) {
                        var angleIncrement = 360 / this.tokens;
                        var origin = new createjs.Point(0, 0);
                        var basePoint = new createjs.Point(gui.radius - 2 * gui.border.width - tokenRadius, 0);

                        tokenShape = new createjs.Shape();
                        tokenShape.graphics.beginFill(gui.tokenColor);

                        for (var index = 0; index < this.tokens; index++) {
                            var point = CanvasUtils.rotate(origin, basePoint, angleIncrement * index);
                            tokenShape.graphics.moveTo(point.x, point.y).drawCircle(point.x, point.y, tokenRadius);
                        }

                        tokenShape.graphics.endFill();
                        tokenShape.x = 0;
                        tokenShape.y = 0;
                    } else if (this.tokens >= 6) {
                        tokenShape = new createjs.Text(this.tokens, 'bold 15px Arial', gui.tokenColor);
                        tokenShape.textBaseline = 'middle';
                        tokenShape.textAlign = 'center';
                        tokenShape.x = 0;
                        tokenShape.y = 0;
                    }
                }
                return tokenShape;
            };

            placePrototype._getLabelText = function () {
                return this.name;
            };

            placePrototype.radius = function () {
                return this._gui.radius;
            };
            placePrototype.width = function () {
                return this._gui.radius * 2;
            };
            placePrototype.height = function () {
                return this._gui.radius * 2;
            };

            return PNGraphPlace;
        });
})();