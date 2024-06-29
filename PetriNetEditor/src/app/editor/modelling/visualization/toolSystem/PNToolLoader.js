'use strict';

(function () {
    angular.module('PNToolSystem', [
        'CanvasToolSupport',
        'PNTools'
    ])
        .factory('PNToolLoader', function (CanvasToolLoader, SelectionTool, PlaceTool, TransitionTool, ArcTool, TokenTool) {

            function PNToolLoader() {
                this._registeredTools = [
                    {
                        order: 0,
                        type: 'selection',
                        name: 'Selection',
                        icon: 'fa-mouse-pointer',
                        modes: 'modelling',
                        toolConstructor: SelectionTool
                    },
                    {
                        order: 1,
                        type: 'place',
                        name: 'Place',
                        icon: 'fa-circle-o',
                        modes: 'modelling',
                        toolConstructor: PlaceTool
                    },
                    {
                        order: 2,
                        type: 'transition',
                        name: 'Transition',
                        icon: 'fa-square-o',
                        modes: 'modelling',
                        toolConstructor: TransitionTool
                    },
                    {
                        order: 3,
                        type: 'arc',
                        name: 'Arc',
                        icon: 'fa-level-up',
                        modes: 'modelling',
                        toolConstructor: ArcTool
                    },
                    {
                        order: 4,
                        type: 'token',
                        name: 'Token',
                        icon: 'fa-dot-circle-o',
                        modes: 'modelling',
                        toolConstructor: TokenTool
                    }
                ];
            }

            var loaderPrototype = createjs.extend(PNToolLoader, CanvasToolLoader);
            loaderPrototype._getRegisteredTools = function () {
                return this._registeredTools;
            };

            return PNToolLoader;
        });
}());