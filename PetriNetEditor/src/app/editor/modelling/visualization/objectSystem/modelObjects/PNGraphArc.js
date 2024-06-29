'use strict';

(function () {
    angular.module('PNModelObjects')
        .factory('PNGraphArc', function (GraphArc) {

            function PNGraphArc(pnArc) {
                GraphArc.call(this, pnArc);

                this.srcMagnetic = pnArc.srcMagnetic;
                this.destMagnetic = pnArc.destMagnetic;
                this.multiplicity = pnArc.multiplicity || 1;
                this.labelPosition = pnArc.labelPosition;

                this.drawObject();
            }

            var arcPrototype = createjs.extend(PNGraphArc, GraphArc);
            arcPrototype._cloningPoints = true;
            arcPrototype._usingHitBox = true;

            arcPrototype._getLabelText = function () {
                return this.multiplicity > 1 ? this.multiplicity : undefined;
            };

            return PNGraphArc;
        });
})();