'use strict';

(function () {
    angular.module('PNHighlights')
        .service('PNTransitionHighlights', function () {

            var accent = {
                shadow: '#FF4081',
                border: '#A90038',
                data: '#FFAAAA'
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
            var simulation = {
                shadow: '#01DF74',
                border: '#088A68'
            };

            return [
                {type: 'accent', objType: 'transition', highlightObj: accent},
                {type: 'connPos', objType: 'transition', highlightObj: connectionPositive},
                {type: 'connNeg', objType: 'transition', highlightObj: connectionNegative},
                {type: 'selection', objType: 'transition', highlightObj: selection},
                {type: 'simulation', objType: 'transition', highlightObj: simulation}
            ];
        });
}());