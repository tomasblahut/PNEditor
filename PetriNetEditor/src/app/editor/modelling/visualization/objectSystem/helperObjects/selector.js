'use strict';

(function () {
    angular.module('PNHelperObjects')
        .factory('Selector', function () {

            function Selector(args) {
                this.Super_constructor();

                this.origin = args.origin;
                this.endpoint = new createjs.Point(this.origin.x + 1, this.origin.y + 1);

                this.drawObject();
            }

            var selectorPrototype = createjs.extend(Selector, createjs.Shape);
            selectorPrototype.drawObject = function () {
                this.graphics.clear();

                var boundRect = this._calculateBoundRectangle();

                this.graphics.beginStroke('#1276FF')
                    .setStrokeStyle(2)
                    .setStrokeDash([5, 5])
                    .drawRect(boundRect.x, boundRect.y, boundRect.width, boundRect.height)
                    .endStroke();
            };
            selectorPrototype.updateEndpoint = function (point) {
                this.endpoint = point;
                this.drawObject();
            };

            selectorPrototype._calculateBoundRectangle = function () {
                var width = Math.abs(this.origin.x - this.endpoint.x);
                var xCoord = this.origin.x > this.endpoint.x ? -width : 0;

                var height = Math.abs(this.origin.y - this.endpoint.y);
                var yCoord = this.origin.y > this.endpoint.y ? -height : 0;

                return {x: xCoord, y: yCoord, width: width, height: height};
            };
            selectorPrototype.getSelectionRect = function () {
                var boundRect = this._calculateBoundRectangle();
                var globalPoint = this.localToGlobal(boundRect.x, boundRect.y);
                boundRect.x = globalPoint.x;
                boundRect.y = globalPoint.y;
                return boundRect;
            };

            return createjs.promote(Selector, "Super");
        });
})();