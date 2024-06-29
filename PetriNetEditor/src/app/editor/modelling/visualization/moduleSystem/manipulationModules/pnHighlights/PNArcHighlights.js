'use strict';

(function () {
    angular.module('PNHighlights', [])
        .service('PNArcHighlights', function () {

            var selection = {
                shadow: '#378BFF'
            };
            var accent = {
                shadow: '#FF4081'
            };

            return [
                {type: 'selection', objType: 'arc', highlightObj: selection},
                {type: 'accent', objType: 'arc', highlightObj: accent}
            ];
        });
}());