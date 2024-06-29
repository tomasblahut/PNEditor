'use strict';

(function () {
    angular.module('PNHelperObjects')
        .factory('Guideline', function () {

            function Guideline(args) {
                this.Super_constructor();

                this.length = args.length;
                this.horizontal = args.horizontal;

                this.drawObject();
            }

            var gridPrototype = createjs.extend(Guideline, createjs.Shape);
            gridPrototype.drawObject = function () {
                this.graphics.clear();

                var endPointX = this.horizontal ? this.length : 0;
                var endPointY = this.horizontal ? 0 : this.length;

                this.graphics.beginStroke('#2C81FF')
                    .setStrokeStyle(2)
                    .setStrokeDash([5, 5])
                    .moveTo(0, 0).lineTo(endPointX, endPointY)
                    .endStroke();
            };

            return createjs.promote(Guideline, "Super");
        });
})();