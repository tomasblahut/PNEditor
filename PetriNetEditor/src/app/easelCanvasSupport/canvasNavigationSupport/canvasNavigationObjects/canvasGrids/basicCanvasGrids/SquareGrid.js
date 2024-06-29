'use strict';

(function () {
    angular.module('BasicCanvasGrids', [
        'CanvasGrids'
    ])
        .factory('SquareGrid', function (CanvasGrid) {

            function SquareGrid(args) {
                CanvasGrid.call(this, args);
                this.spacing = args.spacing || 10;

                this.drawObject();
            }

            var gridPrototype = createjs.extend(SquareGrid, CanvasGrid);
            gridPrototype.drawObject = function () {
                this.graphics.clear().beginStroke(this.color).setStrokeStyle(1);

                //Vertical lines
                var beginX = this.shiftX % this.spacing;
                for (var x = beginX; x <= this.width; x += this.spacing) {
                    this.graphics.moveTo(x, 0).lineTo(x, this.height);
                }

                //Horizontal lines
                var beginY = this.shiftY % this.spacing;
                for (var y = beginY; y <= this.height; y += this.spacing) {
                    this.graphics.moveTo(0, y).lineTo(this.width, y);
                }
                this.graphics.endStroke();
            };

            gridPrototype.getNearestGridPoint = function (point, cardinality) {
                var cellLength = this.spacing / (cardinality || 1);
                var cellHalf = cellLength / 2.0;

                var xAdjust = this.spacing - (this.shiftX % this.spacing);
                var pointX = point.x + xAdjust;

                var xCellPassed = Math.floor(pointX / cellLength);
                var xCellRest = pointX % cellLength;
                var nearestX = xCellPassed * cellLength + (cellHalf > xCellRest ? 0 : cellLength) - xAdjust;

                var yAdjust = this.spacing - (this.shiftY % this.spacing);
                var pointY = point.y + yAdjust;

                var yCellPassed = Math.floor(pointY / cellLength);
                var yCellRest = pointY % cellLength;
                var nearestY = yCellPassed * cellLength + (cellHalf > yCellRest ? 0 : cellLength) - yAdjust;

                return new createjs.Point(nearestX, nearestY);
            };

            return SquareGrid;
        });
})();