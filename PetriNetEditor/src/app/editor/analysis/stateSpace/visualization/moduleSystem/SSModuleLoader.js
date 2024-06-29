'use strict';

(function () {
    angular.module('SSModuleSystem', [
        'CanvasModuleSupport',
        'SSConstructionModules',
        'SSManipulationModules',
        'SSNavigationModules'
    ])
        .factory('SSModuleLoader', function (CanvasModuleLoader, SSGraphBuilder, MarkingSelector, SSHighlighter, GraphExpander) {

            function SSModuleLoader() {
                this._registeredModules = [
                    {type: 'ssGraphBuilder', moduleConstructor: SSGraphBuilder},
                    {type: 'markingSelector', moduleConstructor: MarkingSelector},
                    {type: 'highlighter', moduleConstructor: SSHighlighter},
                    {type: 'graphExpander', moduleConstructor: GraphExpander}
                ];
            }

            var loaderPrototype = createjs.extend(SSModuleLoader, CanvasModuleLoader);
            loaderPrototype._getRegisteredModules = function () {
                return this._registeredModules;
            };

            return SSModuleLoader;
        });
}());