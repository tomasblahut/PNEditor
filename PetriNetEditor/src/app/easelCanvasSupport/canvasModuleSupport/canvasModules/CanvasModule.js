'use strict';

(function () {
    angular.module('CanvasModules', [])
        .factory('CanvasModule', function () {

            function CanvasModule() {
            }

            CanvasModule.prototype.init = function (api) {
                this._stageHandler = api.stageHandler;
                this._objectFactory = api.objectFactory;
                this._layerBus = api.layerBus;
                this._moduleBus = api.moduleBus;
                this._eventManager = api.eventManager;
                this._navigator = api.navigator;
                this._layoutPerformer = api.layoutPerformer;
                this._doInit();
            };

            CanvasModule.prototype._doInit = function () {
                //optional to implement
            };

            CanvasModule.prototype.dispose = function () {
                //optional to implement
            };

            return CanvasModule;
        });
}());