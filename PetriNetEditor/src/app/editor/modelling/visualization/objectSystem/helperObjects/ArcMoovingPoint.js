'use strict';

(function () {
    angular.module('PNHelperObjects', [
        'CanvasObjects'
    ])
        .factory('ArcMoovingPoint', function (CanvasObject) {

            function ArcMoovingPoint(args) {
                CanvasObject.call(this, args);
                this.drawObject();
            }

            var ampPrototype = createjs.extend(ArcMoovingPoint, CanvasObject);
            ampPrototype._gui = {
                bodyColor: '#F8AA19',
                length: 8,
                radius: 2,
                rotation: 45
            };

            ampPrototype._doDrawObject = function () {
                var gui = this._gui;
                var startCoord = -gui.length / 2;

                var shape = new createjs.Shape();
                shape.graphics.beginFill(this._getBodyColor())
                    .drawRoundRect(startCoord, startCoord, gui.length, gui.length, gui.radius)
                    .endFill();
                shape.rotation = gui.rotation;

                this.addChild(shape);
            };

            return ArcMoovingPoint;
        });
})();