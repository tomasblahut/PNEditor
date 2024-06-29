'use strict';

(function () {
    angular.module('CanvasLayoutCheckers', [])
        .factory('CanvasLayoutChecker', function () {

            function CanvasLayoutChecker() {
            }

            CanvasLayoutChecker.prototype.performLayoutCheck = function (graph) {
                throw new Error('Method performLayout not implemented');
            };

            return CanvasLayoutChecker;
        });
})();