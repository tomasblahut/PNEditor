'use strict';

(function () {
    angular.module('CanvasGrids', [])
        .factory('CanvasGrid', function () {

            function CanvasGrid(args) {
                this.Super_constructor();

                this.color = args.color || '#EEEEEE';
                this.width = args.width;
                this.height = args.height;

                this.shiftX = 0;
                this.shiftY = 0;
            }

            var gridPrototype = createjs.extend(CanvasGrid, createjs.Shape);
            gridPrototype.drawObject = function () {
                throw new Error('Method drawObject not implemented');
            };

            gridPrototype.stageShifted = function (shiftVector) {
                this.shiftX += shiftVector.x;
                this.shiftY += shiftVector.y;
                this.drawObject();
            };
            gridPrototype.stageResized = function (width, height) {
                this.width = width;
                this.height = height;
                this.drawObject();
            };
            gridPrototype.getNearestGridPoint = function (point, cardinality) {
                throw new Error('Method getNearestGridPoint not implemented');
            };

            return createjs.promote(CanvasGrid, "Super");
        });
})();