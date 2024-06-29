'use strict';

(function () {
    angular.module('UtilsDirectives', [])
        .directive('resizeDetector', function ($rootScope, $window, $document) {
            var EVENT_KEY = 'elementResized';

            return {
                restrict: 'A',
                scope: {},
                link: function (scope, element) {
                    var actElem = element[0];

                    scope.$watch(function () {
                        return [actElem.offsetWidth, actElem.offsetHeight].join(';');
                    }, function (value) {
                        var dimensions = value.split(';');
                        var width = parseInt(dimensions[0]);
                        var height = parseInt(dimensions[1]);

                        $rootScope.$broadcast(EVENT_KEY, {element: actElem, width: width, height: height});
                    });
                }
            };
        });
}());