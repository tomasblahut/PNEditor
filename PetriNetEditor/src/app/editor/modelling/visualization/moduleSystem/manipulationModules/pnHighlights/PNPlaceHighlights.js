'use strict';

(function () {
    angular.module('PNHighlights')
        .service('PNPlaceHighlights', function () {

            var accent = {
                shadow: '#FF4081',
                border: '#A90038',
                data: '#A90038'
            };
            var connectionPositive = {
                shadow: '#009688',
                border: '#008073'
            };
            var connectionNegative = {
                shadow: '#FF4081',
                border: '#A90038'
            };
            var selection = {
                shadow: '#378BFF',
                border: '#1276FF'
            };

            return [
                {type: 'accent', objType: 'place', highlightObj: accent},
                {type: 'connPos', objType: 'place', highlightObj: connectionPositive},
                {type: 'connNeg', objType: 'place', highlightObj: connectionNegative},
                {type: 'selection', objType: 'place', highlightObj: selection}
            ];
        });
}());