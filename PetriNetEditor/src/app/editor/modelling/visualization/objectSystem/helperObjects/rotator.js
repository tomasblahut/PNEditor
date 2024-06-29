'use strict';

(function () {
    angular.module('PNHelperObjects')
        .factory('Rotator', function (CanvasObject) {

            function Rotator(args) {
                CanvasObject.call(this, args);
                this.angle = args.angle || 0;
                this.drawObject();
            }

            var rotatorPrototype = createjs.extend(Rotator, CanvasObject);
            rotatorPrototype._gui = {
                bodyColor: '#F8AA19',
                lineColor: '#FFBF48',
                radiusSmall: 3,
                radiusBig: 5,
                length: 35,
                label: {
                    font: 'Arial',
                    font_size: 14,
                    font_weight: 'normal',
                    color: '#F8AA19'
                }
            };

            rotatorPrototype.drawObject = function () {
                var shouldAdd = !this._handle;
                if (shouldAdd) {
                    this._handle = this._createHandle();
                }

                this.removeChild(this._angleMeter);
                this.removeChild(this._textIndicator);

                if (this.active) {
                    var gui = this._gui;
                    this._angleMeter = new createjs.Shape();
                    this._angleMeter.graphics.beginStroke(gui.lineColor)
                        .setStrokeStyle(2)
                        .setStrokeDash([3, 4])
                        .moveTo(0, 0)
                        .lineTo(gui.length, 0)
                        .arc(0, 0, gui.length, 0, CanvasUtils.radians(this.angle), true)
                        .endStroke();

                    this.addChild(this._angleMeter);

                    var label = gui.label;
                    this._textIndicator = new createjs.Text(360 - this.angle + '°', label.font_weight + ' ' + label.font_size + 'px ' + label.font, label.color);
                    this._textIndicator.textBaseline = "middle";
                    this._textIndicator.textAlign = "center";

                    this._textIndicator.x = gui.length + 15;
                    this._textIndicator.y = -gui.length;

                    this.addChild(this._textIndicator);
                }

                if (shouldAdd) {
                    this.addChild(this._handle);
                }
            };
            rotatorPrototype._createHandle = function () {
                var gui = this._gui;

                var handle = new createjs.Shape();
                handle.graphics.beginStroke(gui.lineColor)
                    .setStrokeStyle(2)
                    .setStrokeDash([2, 2])
                    .moveTo(0, 0).lineTo(gui.length, 0)
                    .endStroke()
                    .beginFill(gui.bodyColor)
                    .drawCircle(0, 0, gui.radiusSmall)
                    .endFill()
                    .beginFill(this._getBodyColor())
                    .drawCircle(gui.length, 0, gui.radiusBig)
                    .endFill();
                handle.rotation = this.angle;

                return handle;
            };

            rotatorPrototype.setAngle = function (angle) {
                this.angle = angle;
                if (this._handle) {
                    this._handle.rotation = angle;
                }
            };

            return Rotator;
        });
})();