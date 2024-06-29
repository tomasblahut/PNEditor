'use strict';

(function () {
    angular.module('CanvasLayers', [])
        .factory('CanvasLayer', function () {

            function CanvasLayer() {
                this.Super_constructor();
            }

            var layerPrototype = createjs.extend(CanvasLayer, createjs.Container);
            layerPrototype.init = function (api) {
                this._eventManager = api.eventManager;
                this._doInit();
            };
            layerPrototype._doInit = function () {
                //Optional to implement
            };

            layerPrototype.getDisplayObjects = function () {
                throw new Error('Method getDisplayObjects not implemented');
            };
            layerPrototype.clearContent = function () {
                throw new Error('Method clearContent not implemented');
            };

            layerPrototype.dispose = function () {
                this._doDispose();
                this.removeAllChildren();
            };
            layerPrototype._doDispose = function () {
                //Optional to implement
            };

            return createjs.promote(CanvasLayer, "Super");
        });
})();