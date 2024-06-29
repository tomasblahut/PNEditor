'use strict';

(function () {
    angular.module('CanvasToolSupport', [])
        .factory('CanvasToolManager', function () {

            function CanvasToolManager(api) {
                this._api = api;
            }

            CanvasToolManager.prototype.loadTools = function (toolLoader, initialMode) {
                if (!toolLoader) {
                    throw new Error('Tool loader must be specified');
                }
                this.dispose();

                this._tools = toolLoader.loadTools();
                this._activeTools = [];
                this.switchToMode(initialMode);
            };
            CanvasToolManager.prototype.getTools = function () {
                return _.map(this._activeTools, function (tool) {
                    return {type: tool.type, name: tool.name, icon: tool.icon};
                });
            };
            CanvasToolManager.prototype.setActiveTool = function (type) {
                this.clearActiveTool();

                var tool = type ? _.find(this._activeTools, 'type', type) : undefined;
                if (tool) {
                    var toolInstance = tool.instance;
                    toolInstance.setup();
                    this._activeTool = toolInstance;
                }
            };
            CanvasToolManager.prototype.clearActiveTool = function () {
                if (this._activeTool) {
                    this._activeTool.cleanup();
                }
                this._activeTool = undefined;
            };

            CanvasToolManager.prototype.switchToMode = function (mode) {
                var actMode = mode || 'all';
                var satisfactoryTools = _.filter(this._tools, function (tool) {
                    var toolModes = tool.modes ? [].concat(tool.modes) : [];
                    return toolModes.length === 0 || toolModes.indexOf(actMode) !== -1;
                });

                var toolManager = this;
                var toolsToRemove = _.difference(this._activeTools, satisfactoryTools);
                _.forEach(toolsToRemove, function (toolToRemove) {
                    var toolInstance = toolToRemove.instance;
                    toolInstance.cleanup();

                    var index = toolManager._activeTools.indexOf(toolToRemove);
                    toolManager._activeTools.splice(index, 1);
                });

                _.forEach(satisfactoryTools, function (toolToAdd) {
                    if (toolManager._activeTools.indexOf(toolToAdd) === -1) {
                        var toolInstance = toolToAdd.instance;
                        toolInstance.init(toolManager._api);
                    }
                });

                this._activeTools = satisfactoryTools;
            };

            CanvasToolManager.prototype.dispose = function () {
                this.clearActiveTool();
                this._tools = undefined;
                this._activeTools = undefined;
            };

            return CanvasToolManager;
        });
}());