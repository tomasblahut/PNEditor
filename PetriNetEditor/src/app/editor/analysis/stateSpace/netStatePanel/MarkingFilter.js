'use strict';

(function () {
    angular.module('SSDirectives')
        .filter('markingFilter', function () {
            return function (input, compareTo) {
                return _.filter(input, function (item) {
                    var name = item.placeName.toLowerCase();
                    var tokens = item.tokens.toString();

                    var actCompareValue = compareTo && compareTo.toLowerCase();
                    if (!actCompareValue) {
                        return true;
                    }

                    return name.indexOf(compareTo) !== -1 ||
                        tokens.indexOf(compareTo) !== -1 ||
                        (compareTo === 'omega' && tokens === 'ω');
                });
            };
        });
}());
