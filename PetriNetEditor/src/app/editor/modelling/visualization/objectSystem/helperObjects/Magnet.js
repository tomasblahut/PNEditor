'use strict';

(function () {
    angular.module('PNHelperObjects')
        .factory('Magnet', function (CanvasObject) {

            function Magnet(args) {
                CanvasObject.call(this, args);

                this.attachedTo = args.attachedTo;
                this.drawObject();
            }

            var magnetPrototype = createjs.extend(Magnet, CanvasObject);
            magnetPrototype._gui = {
                bodyColor: '#F8AA19',
                radius: 4
            };

            magnetPrototype.drawObject = function () {
                var gui = this._gui;

                var shape = new createjs.Shape();
                shape.graphics.beginFill(this._getBodyColor())
                    .drawCircle(0, 0, gui.radius)
                    .endFill();

                this.addChild(shape);
            };

            return Magnet;
        });
})();