'use strict';

var SSBusiness;
if (!SSBusiness) {
    SSBusiness = {};
}

(function () {

    function CollapsingGraph(ssGraph) {
        this._ssGraph = ssGraph;
        this._markings = {};
        this._arcs = {};

        this._collapsibleNodes = {};
    }

    CollapsingGraph.prototype.findFrom = function (marking) {
        this._rootId = marking.id;
        if (this._ssGraph.type === 'graph') {
            this._buildGraph();
            this._evaluateMarkings();
        }
        else {
            this._cutTreeBranch();
        }

        var collapsibleNodeIds = [];
        for (var nodeId in this._collapsibleNodes) {
            var isCollapsible = this._collapsibleNodes[nodeId];
            if (isCollapsible && nodeId !== marking.id) {
                collapsibleNodeIds.push(nodeId);
            }
        }
        return collapsibleNodeIds;
    };

    CollapsingGraph.prototype._buildGraph = function () {
        var markings = this._ssGraph.markings();
        var arcs = this._ssGraph.arcs();
        var levelCap = markings[this._rootId].level;

        var currentNodeIds = [this._rootId];
        while (currentNodeIds.length > 0) {
            var nextLevelNodeIds = [];
            for (var nodeIndex = 0; nodeIndex < currentNodeIds.length; nodeIndex++) {
                var nodeId = currentNodeIds[nodeIndex];
                var marking = markings[nodeId];
                this._markings[nodeId] = marking;

                var successorIds = arcs.colKeys(nodeId);
                for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
                    var successorId = successorIds[successorIndex];
                    var successorMarking = markings[successorId];

                    if (successorMarking.level > levelCap) {
                        var shouldAdd = !this._markings[successorId] &&
                            nextLevelNodeIds.indexOf(successorId) === -1 &&
                            currentNodeIds.indexOf(successorId) === -1;
                        if (shouldAdd) {
                            nextLevelNodeIds.push(successorId);
                        }

                        var nodeArcs = this._arcs[nodeId];
                        if (!nodeArcs) {
                            nodeArcs = [];
                            this._arcs[nodeId] = nodeArcs;
                        }
                        nodeArcs.push(successorId);
                    }
                }
            }
            currentNodeIds = nextLevelNodeIds;
        }
    };
    CollapsingGraph.prototype._evaluateMarkings = function () {
        var currentNodeIds = [this._rootId];

        while (currentNodeIds.length > 0) {
            var nextLevelNodeIds = [];
            for (var nodeIndex = 0; nodeIndex < currentNodeIds.length; nodeIndex++) {
                var nodeId = currentNodeIds[nodeIndex];
                var nodeCollapsible = this._collapsibleNodes[nodeId];
                if (!LangUtils.isUndefined(nodeCollapsible)) {
                    continue;
                }

                nodeCollapsible = this._rootId === nodeId || this._checkNodeCollapsible(nodeId);
                if (nodeCollapsible) {
                    this._collapsibleNodes[nodeId] = true;
                    var successorIds = this._arcs[nodeId] || [];
                    for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
                        var successorId = successorIds[successorIndex];
                        if (nextLevelNodeIds.indexOf(successorId) === -1) {
                            nextLevelNodeIds.push(successorId);
                        }
                    }
                }
                else {
                    this._propagateNodeNotCollapsible(nodeId);
                }
            }
            currentNodeIds = nextLevelNodeIds;
        }
    };
    CollapsingGraph.prototype._checkNodeCollapsible = function (nodeId) {
        var graphArcs = this._ssGraph.arcs();

        var predecesorIds = graphArcs.rowKeys(nodeId);
        for (var predecesorIndex = 0; predecesorIndex < predecesorIds.length; predecesorIndex++) {
            var predecesorId = predecesorIds[predecesorIndex];
            if (!this._markings[predecesorId]) {
                return false;
            }
        }

        return true;
    };
    CollapsingGraph.prototype._propagateNodeNotCollapsible = function (nodeId) {
        var currentNodeIds = [nodeId];
        while (currentNodeIds.length > 0) {
            var nextLevelNodeIds = [];
            for (var nodeIndex = 0; nodeIndex < currentNodeIds.length; nodeIndex++) {
                var curNodeId = currentNodeIds[nodeIndex];
                var nodeCollapsible = this._collapsibleNodes[curNodeId];
                if (nodeCollapsible === false) {
                    continue;
                }

                this._collapsibleNodes[curNodeId] = false;
                var successorIds = this._arcs[curNodeId] || [];
                for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
                    var successorId = successorIds[successorIndex];
                    if (nextLevelNodeIds.indexOf(successorId) === -1) {
                        nextLevelNodeIds.push(successorId);
                    }
                }
            }
            currentNodeIds = nextLevelNodeIds;
        }
    };

    CollapsingGraph.prototype._cutTreeBranch = function () {
        var currentNodeIds = [this._rootId];
        var arcs = this._ssGraph.arcs();

        while (currentNodeIds.length > 0) {
            var nextLevelNodeIds = [];
            for (var nodeIndex = 0; nodeIndex < currentNodeIds.length; nodeIndex++) {
                var nodeId = currentNodeIds[nodeIndex];
                this._collapsibleNodes[nodeId] = true;

                var successorIds = arcs.colKeys(nodeId);
                for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
                    var successorId = successorIds[successorIndex];
                    nextLevelNodeIds.push(successorId);
                }
            }
            currentNodeIds = nextLevelNodeIds;
        }
    };

    SSBusiness.CollapsingGraph = CollapsingGraph;
}());