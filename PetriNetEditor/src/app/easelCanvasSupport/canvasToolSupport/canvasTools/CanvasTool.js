'use strict';

(function () {
    angular.module('CanvasTools', [])
        .factory('CanvasTool', function () {

            function CanvasTool() {
            }

            CanvasTool.prototype.init = function (api) {
                this._eventManager = api.eventManager;
                this._moduleBus = api.moduleBus;
            };

            CanvasTool.prototype.setup = function () {
                throw new Error('Method canDecorateObject not implemented');
            };
            CanvasTool.prototype.cleanup = function () {
                throw new Error('Method dispose not implemented');
            };

            return CanvasTool;
        });
}());