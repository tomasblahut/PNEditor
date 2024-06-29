'use strict';

(function () {
    self.importScripts('/workers/layout/dagre.min.js');
    self.importScripts('/utils/CollectionUtils.js', '/utils/CanvasUtils.js');
    self.importScripts('/businessObjects/ssBusiness/SSGraph.js');

    self._toDagreGraph = function (graph, dagreGraph) {
        var markings = graph.markings();
        for (var markingId in markings) {
            var marking = markings[markingId];
            dagreGraph.setNode(marking.id, {label: marking.name, width: 40, height: 40});
        }

        var arcCells = graph.arcs().cellSet();
        for (var cellIndex = 0; cellIndex < arcCells.length; cellIndex++) {
            var arcCell = arcCells[cellIndex];
            dagreGraph.setEdge(arcCell.rowKey, arcCell.colKey);
        }
    };
    self._fromDagreGraph = function (graph, dagreGraph, options) {
        var markings = graph.markings();

        var dagreNodes = dagreGraph.nodes();
        for (var nodeIndex = 0; nodeIndex < dagreNodes.length; nodeIndex++) {
            var nodeId = dagreNodes[nodeIndex];
            var dagreNode = dagreGraph.node(nodeId);

            var marking = markings[nodeId];
            marking.position = {x: dagreNode.x + options.leftMargin, y: dagreNode.y + options.topMargin};
        }

        var graphArcs = graph.arcs();
        var dagreEdges = dagreGraph.edges();
        for (var edgeIndex = 0; edgeIndex < dagreEdges.length; edgeIndex++) {
            var edgeId = dagreEdges[edgeIndex];

            var dagreEdge = dagreGraph.edge(edgeId);
            var edgePoints = dagreEdge.points;
            var dagrePoints = [];

            for (var pointIndex = 0; pointIndex < edgePoints.length; pointIndex++) {
                var point = edgePoints[pointIndex];
                dagrePoints.push({
                    x: point.x += options.leftMargin,
                    y: point.y += options.topMargin
                });
            }

            var actPoints = [];
            for (var index = 0; index < dagrePoints.length; index++) {
                var prevPoint = dagrePoints[index - 1];
                var curPoint = dagrePoints[index];
                var nextPoint = dagrePoints[index + 1];

                if (index === 0) {
                    var srcObj = self._prepareConnectedObj(edgeId.v, markings);
                    actPoints.push(CanvasUtils.circleCenterIntersect(srcObj, nextPoint));
                }
                else if (index === dagrePoints.length - 1) {
                    var destObj = self._prepareConnectedObj(edgeId.w, markings);
                    actPoints.push(CanvasUtils.circleCenterIntersect(destObj, prevPoint));
                }
                else {
                    var skip = prevPoint && nextPoint;
                    if (skip) {
                        var xMatches = prevPoint.x === curPoint.x && curPoint.x === nextPoint.x;
                        var yMatches = prevPoint.y === curPoint.y && curPoint.y === nextPoint.y;
                        skip = xMatches || yMatches;
                    }

                    if (!skip) {
                        actPoints.push(curPoint);
                    }
                }
            }

            var arc = graphArcs.get(edgeId.v, edgeId.w);
            arc.points = actPoints;
            arc.labelPosition = undefined;
        }
    };

    self._prepareConnectedObj = function (id, markingIdMap) {
        var marking = markingIdMap[id];
        return {center: marking.position, radius: 20};
    };

    self.onmessage = function (event) {
        var graphData = event.data[0];
        var options = event.data[1];

        var ssGraph = new SSBusiness.SSGraph();
        ssGraph.loadData(graphData);

        var dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setGraph({});
        dagreGraph.setDefaultEdgeLabel(function () {
            return {};
        });

        self._toDagreGraph(ssGraph, dagreGraph);
        dagre.layout(dagreGraph, options);
        self._fromDagreGraph(ssGraph, dagreGraph, options);

        self.postMessage(ssGraph);
    };
}());