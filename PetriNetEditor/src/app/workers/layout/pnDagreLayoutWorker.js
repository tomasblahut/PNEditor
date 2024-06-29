'use strict';

(function () {
    self.importScripts('/workers/layout/dagre.min.js');
    self.importScripts('/utils/CollectionUtils.js', '/utils/CanvasUtils.js');
    self.importScripts('/businessObjects/pnBusiness/PetriNet.js');

    self._toDagreGraph = function (graph, dagreGraph) {
        var places = graph.places();
        for (var placeIndex = 0; placeIndex < places.length; placeIndex++) {
            var place = places[placeIndex];
            dagreGraph.setNode(place.id, {label: place.name, width: 40, height: 40});
        }

        var transitions = graph.transitions();
        for (var transId in transitions) {
            var transition = transitions[transId];
            if (transition.gui) {
                transition.gui.rotation = 0;
            }
            dagreGraph.setNode(transition.id, {label: transition.name, width: 40, height: 40});
        }

        var arcCells = graph.arcs();
        for (var cellIndex = 0; cellIndex < arcCells.length; cellIndex++) {
            var arcCell = arcCells[cellIndex];
            dagreGraph.setEdge(arcCell.rowKey, arcCell.colKey);
        }
    };
    self._fromDagreGraph = function (graph, dagreGraph, options) {
        var placeIdMap = CollectionUtils.indexBy(graph.places(), 'id');
        var transIdMap = CollectionUtils.indexBy(graph.transitions(), 'id');

        var dagreNodes = dagreGraph.nodes();
        for (var nodeIndex = 0; nodeIndex < dagreNodes.length; nodeIndex++) {
            var nodeId = dagreNodes[nodeIndex];
            var dagreNode = dagreGraph.node(nodeId);

            var netObj = placeIdMap[nodeId];
            if (!netObj) {
                netObj = transIdMap[nodeId];
                var gui = netObj.gui;
                if (!gui) {
                    netObj.gui = gui = {};
                }
                gui.rotation = 0;
            }
            netObj.position = {x: dagreNode.x + options.leftMargin, y: dagreNode.y + options.topMargin};
            netObj.labelPosition = undefined;
        }

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
                    var srcObj = self._prepareConnectedObj(edgeId.v, placeIdMap, transIdMap);
                    actPoints.push(CanvasUtils.shapeCenterIntersect(srcObj, nextPoint));
                }
                else if (index === dagrePoints.length - 1) {
                    var destObj = self._prepareConnectedObj(edgeId.w, placeIdMap, transIdMap);
                    actPoints.push(CanvasUtils.shapeCenterIntersect(destObj, prevPoint));
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

            var arc = graph.findArc(edgeId.v, edgeId.w);
            arc.points = actPoints;
            arc.labelPosition = undefined;
        }
    };

    self._prepareConnectedObj = function (id, placeIdMap, transIdMap) {
        var place = placeIdMap[id];
        if (place) {
            return {center: place.position, radius: 20, type: 'place'};
        }
        else {
            var transition = transIdMap[id];
            return {center: transition.position, width: 15, height: 40, rotation: 0, type: 'transition'};
        }
    };

    self.onmessage = function (event) {
        var pnData = event.data[0];
        var options = event.data[1];

        var petriNet = new PNBusiness.PetriNet();
        petriNet.loadData(pnData);

        var dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setGraph({});
        dagreGraph.setDefaultEdgeLabel(function () {
            return {};
        });

        self._toDagreGraph(petriNet, dagreGraph);
        dagre.layout(dagreGraph, options);
        self._fromDagreGraph(petriNet, dagreGraph, options);

        self.postMessage(petriNet.getData());
    };
}());