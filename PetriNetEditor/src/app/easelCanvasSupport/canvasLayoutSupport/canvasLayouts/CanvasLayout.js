'use strict';

(function () {
    angular.module('CanvasLayouts', [])
        .factory('CanvasLayout', function ($q, $timeout) {

            function CanvasLayout() {
            }

            CanvasLayout.prototype.performLayout = function (graph, options, defered) {
                throw new Error('Method _doLayout not implemented');
            };

            CanvasLayout.prototype.getDefaultOptions = function () {
                throw new Error('Method getDefaultOptions not implemented');
            };

            CanvasLayout.prototype.interrupt = function () {
                //Optional to implement
            };

            CanvasLayout.prototype.dispose = function () {
                //Optional to implement
            };

            return CanvasLayout;
        });
})();