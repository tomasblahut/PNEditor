'use strict';

(function () {
    angular.module('BasicCanvasLayers', [
        'CanvasLayers'
    ])
        .factory('SimpleLayer', function (CanvasLayer) {

            function SimpleLayer() {
                this.Super_constructor();
            }

            var layerPrototype = createjs.extend(SimpleLayer, CanvasLayer);

            layerPrototype.getDisplayObjects = function () {
                return this.children;
            };
            layerPrototype.clearContent = function () {
                this.removeAllChildren();
            };

            return SimpleLayer;
        });
})();