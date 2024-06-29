'use strict';

(function () {
    angular.module('BasicCanvasLayouts', [
        'CanvasLayouts'
    ])
        .factory('DagreLayout', function (CanvasLayout) {

            function DagreLayout() {
            }

            var layoutPrototype = createjs.extend(DagreLayout, CanvasLayout);

            layoutPrototype._doLayout = function (graph, options, defered) {
                var dagreGraph = new dagre.graphlib.Graph();
                dagreGraph.setGraph({}); //graph label
                dagreGraph.setDefaultEdgeLabel(function () {
                    return {};
                });

                this._toDagreGraph(graph, dagreGraph);
                dagre.layout(dagreGraph, options);
                this._fromDagreGraph(graph, dagreGraph);

                defered.resolve('done');
            };
            layoutPrototype._toDagreGraph = function (graph, dagreGraph) {
                throw new Error("Method _toDagreGraph not implemented");
            };
            layoutPrototype._fromDagreGraph = function (graph, dagreGraph) {
                throw new Error("Method _fromDagreGraph not implemented");
            };

            layoutPrototype.getDefaultOptions = function () {
                return {
                    horizontalOffset: 100,
                    verticalOffset: 100,
                    ranksep: 75,
                    nodesep: 75
                };
            };

            return DagreLayout;
        });
})();