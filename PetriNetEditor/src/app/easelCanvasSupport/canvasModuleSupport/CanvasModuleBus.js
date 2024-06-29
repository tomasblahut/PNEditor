'use strict';

(function () {
    angular.module('CanvasModuleSupport', [])
        .factory('CanvasModuleBus', function () {

            function CanvasModuleBus(api) {
                this._api = api;
                this._api.moduleBus = this;
            }

            CanvasModuleBus.prototype.loadModules = function (moduleLoader, initialMode) {
                if (!moduleLoader) {
                    throw new Error('Module loader must be specified');
                }
                this.dispose();

                this._modules = moduleLoader.loadModules();
                this._activeModules = [];
                this.switchToMode(initialMode);
            };
            CanvasModuleBus.prototype.getModule = function (type) {
                var module = _.find(this._activeModules, 'type', type);
                if (!module) {
                    throw new Error('Requested unknown module: ' + type);
                }
                return module.instance;
            };

            CanvasModuleBus.prototype.findAllCanDecorate = function (canvasObject) {
                return _.filter(_.map(this._activeModules, 'instance'), function (module) {
                    return typeof module.canDecorateObject === 'function' && module.canDecorateObject(canvasObject);
                });
            };

            CanvasModuleBus.prototype.switchToMode = function (mode) {
                var actMode = mode || 'all';
                var satisfactoryModules = _.filter(this._modules, function (module) {
                    var moduleModes = module.modes ? [].concat(module.modes) : [];
                    return moduleModes.length === 0 || moduleModes.indexOf(actMode) !== -1;
                });

                var moduleBus = this;
                var modulesToRemove = _.difference(this._activeModules, satisfactoryModules);
                _.forEach(modulesToRemove, function (modToRemove) {
                    var moduleInstance = modToRemove.instance;
                    moduleInstance.dispose();

                    var index = moduleBus._activeModules.indexOf(modToRemove);
                    moduleBus._activeModules.splice(index, 1);
                });

                _.forEach(satisfactoryModules, function (modToAdd) {
                    if (moduleBus._activeModules.indexOf(modToAdd) === -1) {
                        var moduleInstance = modToAdd.instance;
                        moduleInstance.init(moduleBus._api);
                    }
                });

                this._activeModules = satisfactoryModules;
            };

            CanvasModuleBus.prototype.dispose = function () {
                _.forEach(this._modules, function (module) {
                    var moduleInstance = module.instance;
                    moduleInstance.dispose();
                });
                this._modules = undefined;
                this._activeModules = undefined;
            };

            return CanvasModuleBus;
        });
}());