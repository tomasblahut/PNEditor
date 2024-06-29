'use strict';

(function () {
    angular.module('PNGui', [])
        .directive('toolPanel', function () {
            return {
                replace: true,
                restrict: 'E',
                scope: true,
                link: function (scope) {

                    scope.setActiveTool = function (toolType) {
                        scope.pnManager.setActiveTool(toolType);
                        scope.activeTool = toolType;
                    };

                    scope.$watch('gui.currentMode', function () {
                        refreshTools();
                    });

                    function refreshTools() {
                        var tools = scope.pnManager.getTools();

                        scope.tools = tools;
                        if (tools && tools.length > 0) {
                            scope.setActiveTool(tools[0].type);
                        }
                    }

                    refreshTools();
                },
                templateUrl: 'editor/modelling/gui/toolPanel/toolPanel.tmpl.html'
            };
        });
}());