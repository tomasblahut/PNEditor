'use strict';

var SSBusiness;
if (!SSBusiness) {
    SSBusiness = {};
}

(function () {
    function SSGraph() {
        this._arcs = new CollectionUtils.Table(); //Marking id, Marking id, arc data
        this._markings = {};
        this.type = 'graph';
    }

    SSGraph.prototype.loadData = function (data) {
        this.type = data.type;
        this._initialMarkingId = data._initialMarkingId;
        this._markings = data._markings;
        this._arcs.loadData(data._arcs);
    };
    SSGraph.prototype.clear = function () {
        this._initialMarkingId = undefined;
        this._markings = {};
        this._arcs.clear();
    };

    SSGraph.prototype.markings = function () {
        return this._markings;
    };
    SSGraph.prototype.arcs = function () {
        return this._arcs;
    };

    SSGraph.prototype.transform = function (type, graphData) {
        var changes;
        if (type !== this.type) {
            if (type === 'tree') {
                changes = this._transformToTree(graphData);
            }
            else if (type === 'graph') {
                changes = this._transformToGraph(graphData);
            }
            else {
                throw new Error('Cannot transform StateSpace graph into: ' + type);
            }
            this.type = type;
        }
        return changes;
    };
    SSGraph.prototype._transformToTree = function (graphData) {
        var initialMarking = this.findInitialMarking();
        if (!initialMarking) {
            return;
        }

        var curNodeIds = [initialMarking.id];
        var visitedMarkings = [initialMarking.id];

        while (curNodeIds.length > 0) {
            var nextLevelIds = [];
            for (var nodeIndex = 0; nodeIndex < curNodeIds.length; nodeIndex++) {
                var curNodeId = curNodeIds[nodeIndex];
                var curNode = this._markings[curNodeId];

                var successorIds = this._arcs.colKeys(curNodeId);
                for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
                    var successorId = successorIds[successorIndex];
                    var successor = this._markings[successorId];

                    if (visitedMarkings.indexOf(successorId) !== -1) {
                        var leafMarking = this._cloneMarking(successor);
                        leafMarking.id = StringUtils.uuid();
                        leafMarking.level = curNode.level + 1;
                        leafMarking.duplicity = true;
                        leafMarking.expanded = true;

                        var oldArc = this._arcs.remove(curNodeId, successorId);
                        this._markings[leafMarking.id] = leafMarking;
                        this._arcs.put(curNodeId, leafMarking.id, oldArc);
                    }
                    else {
                        nextLevelIds.push(successorId);
                        visitedMarkings.push(successorId);
                    }
                }
            }
            curNodeIds = nextLevelIds;
        }

        return {type: 'toTree'};
    };
    SSGraph.prototype._transformToGraph = function (graphData) {
        var initialMarking = this.findInitialMarking();
        if (!initialMarking) {
            return;
        }

        var stateHashMap = {};
        var dataMarkings = graphData.markings();
        for (var dataMarkingId in dataMarkings) {
            var dataMarking = dataMarkings[dataMarkingId];
            stateHashMap[dataMarking.stateHash] = dataMarking;
        }

        var removedMarkingIds = [];
        var nodeStack = [initialMarking.id];

        while (nodeStack.length > 0) {
            var curMarkingId = nodeStack.pop();
            var successorIds = this._arcs.colKeys(curMarkingId);

            for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
                var successorId = successorIds[successorIndex];
                var successor = this._markings[successorId];

                if (successor.duplicity) {
                    delete this._markings[successorId];
                    removedMarkingIds.push(successorId);

                    var originMarking = stateHashMap[successor.stateHash];
                    var graphOriginMarking = this._markings[originMarking.id];
                    if (!graphOriginMarking) {
                        graphOriginMarking = {
                            id: originMarking.id,
                            name: originMarking.name,
                            stateHash: originMarking.stateHash,
                            expanded: false
                        };
                        this._markings[originMarking.id] = graphOriginMarking;
                    }

                    var oldArc = this._arcs.remove(curMarkingId, successorId);
                    this._arcs.put(curMarkingId, graphOriginMarking.id, oldArc);
                }
                else {
                    nodeStack.push(successorId);
                }
            }
        }

        return {type: 'toGraph', removedMarkings: removedMarkingIds};
    };

    SSGraph.prototype.setInitialMarking = function (initialMarking) {
        if (initialMarking) {
            this._initialMarkingId = initialMarking.id;
            this._markings[initialMarking.id] = {
                id: initialMarking.id,
                name: initialMarking.name,
                stateHash: initialMarking.stateHash
            };
        }
    };
    SSGraph.prototype.findInitialMarking = function () {
        return this._markings[this._initialMarkingId];
    };
    SSGraph.prototype.findMarking = function (marking) {
        var markingId = marking ? typeof marking === 'string' ? marking : marking.id : undefined;
        var ssMarking = this._markings[markingId];
        if (!ssMarking) {
            throw new Error('Graph does not contain marking: ' + marking);
        }
        return ssMarking;
    };

    SSGraph.prototype.appendExpansion = function (expansion, expandedFrom) {
        var nodeIdMap = {};
        var nodes = expansion && expansion.nodes;
        if (nodes) {
            nodeIdMap = {};
            for (var nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
                var node = nodes[nodeIndex];
                nodeIdMap[node.id] = node;
            }
        }

        var arcs = expansion && expansion.arcs;
        if (arcs) {
            for (var arcIndex = 0; arcIndex < arcs.length; arcIndex++) {
                var arc = arcs[arcIndex];
                var srcId = arc.srcId;
                var srcMarking = this._markings[srcId];
                if (!srcMarking) {
                    srcMarking = nodeIdMap[srcId];
                    this._markings[srcId] = srcMarking;
                }

                var destId = arc.destId;
                var destMarking = this._markings[destId];
                if (!destMarking) {
                    destMarking = nodeIdMap[destId];
                    this._markings[destId] = destMarking;
                }
                else if (this.type === 'tree') {
                    var leafMarking = this._cloneMarking(destMarking);
                    leafMarking.id = StringUtils.uuid();
                    leafMarking.level = srcMarking.level + 1;
                    leafMarking.expanded = true;
                    leafMarking.duplicity = true;

                    this._markings[leafMarking.id] = leafMarking;
                    destId = leafMarking.id;
                }

                this._arcs.put(srcId, destId, {id: arc.arcId});
            }
        }

        var ownExpandedFromNode = this.findMarking(expandedFrom);
        ownExpandedFromNode.expanded = true;
    };
    SSGraph.prototype.removeSuccessors = function (marking) {
        var ownMarking = this.findMarking(marking);
        var collapsingGraph = new SSBusiness.CollapsingGraph(this);
        var collapsibleMarkingIds = collapsingGraph.findFrom(ownMarking);

        var removedArcIds = [];
        for (var nodeIndex = 0; nodeIndex < collapsibleMarkingIds.length; nodeIndex++) {
            var nodeId = collapsibleMarkingIds[nodeIndex];
            delete this._markings[nodeId];
            this._removeSuccessorArcs(nodeId, removedArcIds);
        }
        this._removeSuccessorArcs(ownMarking.id, removedArcIds);

        return {
            markings: collapsibleMarkingIds,
            arcs: removedArcIds,
            empty: collapsibleMarkingIds.length === 0 && removedArcIds.length === 0
        };
    };
    SSGraph.prototype._removeSuccessorArcs = function (nodeId, removedArcIds) {
        var successorIds = this._arcs.colKeys(nodeId);
        for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
            var successorId = successorIds[successorIndex];
            var arc = this._arcs.remove(nodeId, successorId);
            removedArcIds.push(arc.id);
        }
    };

    SSGraph.prototype.recountMarkingLevels = function () {
        if (this._initialMarkingId) {
            var visitedNodes = {};
            var nodeIds = [this._initialMarkingId];
            var currentLevel = 0;

            while (nodeIds.length > 0) {
                var nextLevelIds = [];
                for (var nodeIndex = 0; nodeIndex < nodeIds.length; nodeIndex++) {
                    var nodeId = nodeIds[nodeIndex];
                    var marking = this._markings[nodeId];
                    marking.level = currentLevel;
                    visitedNodes[nodeId] = marking;

                    var successors = this._arcs.colKeys(nodeId);
                    for (var successorIndex = 0; successorIndex < successors.length; successorIndex++) {
                        var successorId = successors[successorIndex];
                        var visited = visitedNodes[successorId] || nextLevelIds.indexOf(successorId) !== -1;
                        if (!visited) {
                            nextLevelIds.push(successorId);
                        }
                    }
                }
                nodeIds = nextLevelIds;
                currentLevel++;
            }
        }
    };

    SSGraph.prototype._cloneMarking = function (marking) {
        return JSON.parse(JSON.stringify(marking));
    };

    SSBusiness.SSGraph = SSGraph;
}());