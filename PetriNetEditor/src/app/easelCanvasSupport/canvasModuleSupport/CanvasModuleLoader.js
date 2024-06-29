'use strict';

(function () {
    angular.module('CanvasModuleSupport')
        .factory('CanvasModuleLoader', function () {

            function CanvasModuleLoader() {
            }

            CanvasModuleLoader.prototype.loadModules = function () {
                return _.map(this._getRegisteredModules(), function (info) {
                    var module = _.clone(info);
                    module.instance = new info.moduleConstructor();
                    delete module.moduleConstructor;

                    return module;
                });
            };

            /**
             * Returns array of objects which contains info about registered modules.
             * Each object consists of properties: type, moduleConstructor. Type is
             * string identificator that is going to be used when requesting module.
             * ModuleConstructor is module object constructor function.
             * @private
             */
            CanvasModuleLoader.prototype._getRegisteredModules = function () {
                throw new Error('Method getModuleInfo not implemented');
            };

            return CanvasModuleLoader;
        });
}());