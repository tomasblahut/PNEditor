'use strict';

(function () {
    angular.module('CanvasBackgroundObjects', [])
        .factory('CanvasBackground', function () {

            function CanvasBackground(args) {
                this.Super_constructor();

                this.color = args.color || '#FFFFFF';
                this.width = args.width;
                this.height = args.height;

                this.drawObject();
            }

            var gridPrototype = createjs.extend(CanvasBackground, createjs.Shape);
            gridPrototype.drawObject = function () {
                this.graphics
                    .clear().
                    beginFill(this.color)
                    .drawRect(0, 0, this.width, this.height)
                    .endFill();
            };

            return createjs.promote(CanvasBackground, "Super");
        });
})();