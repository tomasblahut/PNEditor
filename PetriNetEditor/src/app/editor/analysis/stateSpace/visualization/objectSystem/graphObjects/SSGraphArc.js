'use strict';

(function () {
    angular.module('SSGraphObjects')
        .factory('SSGraphArc', function (GraphArc) {

            function SSGraphArc(ssArc) {
                GraphArc.call(this, ssArc);
                this.transNames = ssArc.transNames;

                this.usingTextBackground = true;
                this.snapToPixel = true;
                this.cursor = 'normal';
                this.drawObject();
            }

            var arcPrototype = createjs.extend(SSGraphArc, GraphArc);
            arcPrototype._gui = {
                line_width: 2,
                bodyColor: '#2E2E2E',
                label: {
                    font: 'Arial',
                    font_size: 14,
                    font_weight: 'normal',
                    color: '#2E2E2E'
                }
            };

            arcPrototype._getLabelText = function () {
                return this.transNames;
            };

            return SSGraphArc;
        });
})();