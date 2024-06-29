'use strict';

var SSBusiness;
if (!SSBusiness) {
    SSBusiness = {};
}

(function () {

    function SSGraphData() {
        this._arcsTable = new CollectionUtils.Table(); //Marking id, Marking id, arc
        this._arcIdMap = {};

        this._markingIdMap = {};
        this._markingStateHashMap = {};
    }

    SSGraphData.prototype.loadData = function (data) {
        this._arcsTable.loadData(data._arcsTable);
        this._arcIdMap = data._arcIdMap;

        this._markingIdMap = data._markingIdMap;
        this._markingStateHashMap = data._markingStateHashMap;
    };
    SSGraphData.prototype.clear = function () {
        this._arcsTable.clear();
        this._arcIdMap = {};

        this._markingIdMap = {};
        this._markingStateHashMap = {};
    };

    SSGraphData.prototype.initFromPetrinet = function (data, petriNet) {
        this._constructArcs(data, petriNet);
        this._constructMarkings(data, petriNet);
    };
    SSGraphData.prototype._constructArcs = function (data, petriNet) {
        var edges = data && data.edges || [];
        var graphData = this;

        var sortedTransitions = CollectionUtils.sortBy(petriNet._transitions, 'id');
        for (var edgeIndex = 0; edgeIndex < edges.length; edgeIndex++) {
            var edge = edges[edgeIndex];
            var arcData = mapEdgeValues(edge.transitions);
            graphData._arcIdMap[arcData.id] = arcData;
            graphData._arcsTable.put(edge.src + '', edge.dest + '', arcData);
        }

        function mapEdgeValues(transIndexes) {
            var transNames = [];

            for (var transIndex = 0; transIndex < transIndexes.length; transIndex++) {
                var curTransIndex = transIndexes[transIndex];
                var trans = sortedTransitions[curTransIndex];
                transNames.push(trans.name);
            }

            return {id: StringUtils.uuid(), transNames: transNames};
        }
    };
    SSGraphData.prototype._constructMarkings = function (data, petriNet) {
        var graphData = this;

        var initialMarkingId = data && data.initialMarking;
        if (initialMarkingId) {
            this._initialMarkingId = initialMarkingId = initialMarkingId.toString();

            var markings = data && data.markings || {};
            var visitedNodes = [];
            var nodeIds = [initialMarkingId];

            var sortedPlaces = CollectionUtils.sortBy(petriNet._places, 'id');
            var curMarkingNumber = 0;

            while (nodeIds.length > 0) {
                var nextLevelIds = [];
                for (var nodeIndex = 0; nodeIndex < nodeIds.length; nodeIndex++) {
                    var nodeId = nodeIds[nodeIndex];
                    if (visitedNodes.indexOf(nodeId) === -1) {
                        var marking = parseMarkingData(nodeId, markings[nodeId]);
                        graphData._markingIdMap[marking.id] = marking;
                        graphData._markingStateHashMap[marking.stateHash] = marking;
                        visitedNodes.push(nodeId);
                    }

                    var successors = graphData._arcsTable.colKeys(nodeId);
                    for (var successorIndex = 0; successorIndex < successors.length; successorIndex++) {
                        var successorId = successors[successorIndex];
                        var visited = visitedNodes.indexOf(successorId) !== -1 || nextLevelIds.indexOf(successorId) !== -1;
                        if (!visited) {
                            nextLevelIds.push(successorId);
                        }
                    }
                }
                nodeIds = nextLevelIds;
            }
        }

        function mapNetState(placeTokens) {
            var netState = [];
            for (var placeIndex = 0; placeIndex < placeTokens.length; placeIndex++) {
                var tokenCount = placeTokens[placeIndex];
                var place = sortedPlaces[placeIndex];
                netState.push({
                    placeId: place.id,
                    placeName: place.name,
                    tokens: tokenCount
                });
            }
            return netState;
        }

        function parseMarkingData(markingId, markingData) {
            return {
                id: markingId,
                name: 'M' + curMarkingNumber++,
                stateHash: markingData.stateHash,
                netState: mapNetState(markingData.tokens),
                deadlock: markingData.deadlock,
                fullyConnected: markingData.fullyConnected
            };
        }
    };

    SSGraphData.prototype.markings = function () {
        return this._markingIdMap;
    };
    SSGraphData.prototype.getInitialMarking = function () {
        return this._markingIdMap[this._initialMarkingId];
    };
    SSGraphData.prototype.findMarkingById = function (marking) {
        var markingId = marking ? typeof marking === 'string' ? marking : marking.id : undefined;
        var ssMarking = this._markingIdMap[markingId];
        if (!ssMarking) {
            throw new Error('Graph does not contain marking: ' + marking);
        }
        return ssMarking;
    };
    SSGraphData.prototype.findMarkingByStateHash = function (marking) {
        var markingStateHash = marking ? typeof marking === 'string' ? marking : marking.stateHash : undefined;
        var ssMarking = this._markingStateHashMap[markingStateHash];
        if (!ssMarking) {
            throw new Error('Graph does not contain marking: ' + marking);
        }
        return ssMarking;
    };
    SSGraphData.prototype.getMarkingGuiData = function (marking) {
        var ssMarking = this.findMarkingByStateHash(marking);
        return {
            name: ssMarking.name,
            deadlock: ssMarking.deadlock,
            fullyConnected: ssMarking.fullyConnected
        };
    };

    SSGraphData.prototype.arcs = function () {
        return this._arcIdMap;
    };
    SSGraphData.prototype.arcTable = function () {
        return this._arcsTable;
    };
    SSGraphData.prototype.findArc = function (arc) {
        var arcId = arc ? typeof arc === 'string' ? arc : arc.id : undefined;
        var ssArc = this._arcIdMap[arcId];
        if (!ssArc) {
            throw new Error('Graph does not contain arc: ' + arc);
        }
        return ssArc;
    };
    SSGraphData.prototype.getArcGuiData = function (arc) {
        var ssArc = this.findArc(arc);
        return {
            transNames: ssArc.transNames
        };
    };

    SSGraphData.prototype.subgraph = function (level, nodeFrom, ssGraph) {
        var nodes = [];
        var arcs = [];

        var curLevel = 1;
        var graphData = this;

        var ownNodeFrom = this.findMarkingById(nodeFrom);
        var curNodeIds = [ownNodeFrom.id];

        var visitedNodeIds = [ownNodeFrom.id];
        var graphMarkings = ssGraph.markings();

        while (curNodeIds.length > 0) {
            var nextLevelIds = [];

            for (var nodeIndex = 0; nodeIndex < curNodeIds.length; nodeIndex++) {
                var curNodeId = curNodeIds[nodeIndex];
                var successorIds = graphData._arcsTable.colKeys(curNodeId);

                for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
                    var successorId = successorIds[successorIndex];
                    var addNode = visitedNodeIds.indexOf(successorId) === -1 && !graphMarkings[successorId];

                    if (addNode) {
                        var markingData = graphData._markingIdMap[successorId];
                        var marking = {
                            id: successorId,
                            name: markingData.name,
                            stateHash: markingData.stateHash
                        };

                        var expanded = true;
                        if (level !== -1) {
                            expanded = curLevel < level;
                            if (!expanded) {
                                expanded = this._arcsTable.colKeys(successorId).length === 0;
                            }
                        }
                        marking.expanded = expanded;
                        nodes.push(marking);

                        visitedNodeIds.push(successorId);
                        nextLevelIds.push(successorId);
                    }

                    var arcData = graphData._arcsTable.get(curNodeId, successorId);
                    var arc = {srcId: curNodeId, destId: successorId, arcId: arcData.id};
                    arcs.push(arc);
                }
            }

            curLevel++;
            if (curLevel > level && level !== -1) {
                break;
            }
            curNodeIds = nextLevelIds;
        }

        return {nodes: nodes, arcs: arcs, empty: nodes.length === 0 && arcs.length === 0};
    };

    SSBusiness.SSGraphData = SSGraphData;
}());