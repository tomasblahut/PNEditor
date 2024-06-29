'use strict';

(function () {
    angular.module('CanvasToolSupport')
        .factory('CanvasToolLoader', function () {
            function CanvasToolLoader() {
            }

            CanvasToolLoader.prototype.loadTools = function () {
                var toolInfo = this._getRegisteredTools();
                _.sortBy(toolInfo, 'order');

                return _.map(toolInfo, function (info) {
                    var tool = _.clone(info);
                    tool.instance = new info.toolConstructor();
                    delete tool.toolConstructor;

                    return tool;
                });
            };

            /**
             * Returns array of objects which contains info about supported tools.
             * Each object consists of properties: type, order, toolConstructor. Type is
             * string identificator that is going to be used when requesting layer.
             * Order determines at what level should be layer added into Easel stage.
             * ToolConstructor is layer object constructor function.
             * @private
             */
            CanvasToolLoader.prototype._getRegisteredTools = function () {
                throw new Error('Method getRegisteredTools not implemented');
            };

            return CanvasToolLoader;
        })
        .service('EmptyToolLoader', function (CanvasToolLoader) {
            function EmptyToolLoader() {
            }

            var loaderPrototype = createjs.extend(EmptyToolLoader, CanvasToolLoader);
            loaderPrototype._getRegisteredTools = function () {
                return [];
            };

            var instance = new EmptyToolLoader();
            return instance;
        });
}());