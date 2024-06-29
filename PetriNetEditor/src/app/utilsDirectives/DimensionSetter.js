'use strict';

(function () {
    angular.module('UtilsDirectives')
        .directive('dimensionSetter', function () {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    var type = attr.dimensionSetter;
                    var handlingWidth = type === 'width';

                    var actElem = element[0];
                    scope.$watch(function () {
                        return handlingWidth ? actElem.offsetWidth : actElem.offsetHeight;
                    }, function (value) {
                        element.css(type, value + 'px');
                    });
                }
            };
        });
}());