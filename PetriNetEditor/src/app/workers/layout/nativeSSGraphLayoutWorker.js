'use strict';

//--- Graph converter
(function () {

    function SSGraphConverter(options) {
        this._options = options;
    }

    SSGraphConverter.prototype.toNormalizedGraph = function (ssGraph) {
        this._ssGraph = ssGraph;
        var initialMarking = ssGraph.findInitialMarking();
        if (!initialMarking) {
            return;
        }
        var normalizedGraph = new self.NormalizedGraph();

        var graphArcs = ssGraph.arcs();
        var curNodeIds = [initialMarking.id];
        var visitedNodeIds = [];
        var currentLevel = 0;

        while (curNodeIds.length > 0) {
            var nextLevelIds = [];
            for (var nodeIndex = 0; nodeIndex < curNodeIds.length; nodeIndex++) {
                var curNodeId = curNodeIds[nodeIndex];
                normalizedGraph.addNode({id: curNodeId, level: currentLevel});
                visitedNodeIds.push(curNodeId);

                var successorIds = graphArcs.colKeys(curNodeId);
                for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
                    var successorId = successorIds[successorIndex];
                    normalizedGraph.addArc(curNodeId, successorId);

                    var add = visitedNodeIds.indexOf(successorId) === -1 &&
                        nextLevelIds.indexOf(successorId) === -1 &&
                        curNodeIds.indexOf(successorId) === -1;
                    if (add) {
                        nextLevelIds.push(successorId);
                    }
                }
            }
            currentLevel++;
            curNodeIds = nextLevelIds;
        }

        normalizedGraph.normalize();
        return normalizedGraph;
    };
    SSGraphConverter.prototype.toSSGraph = function (normalizedGraph) {
        this._normalizedGraph = normalizedGraph;
        var normalizedNodes = this._normalizedGraph.nodes();

        var layers = this._normalizedGraph.layers();
        var firstLayer = layers[0];

        for (var firstLayIndex = 0; firstLayIndex < firstLayer.length; firstLayIndex++) {
            var firstLayNodeId = firstLayer[firstLayIndex];
            var firstLayNode = normalizedNodes[firstLayNodeId];
            this._layoutNode(firstLayNode);
        }

        for (var layerIndex = 0; layerIndex < layers.length; layerIndex++) {
            var layer = layers[layerIndex];

            for (var nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
                var nodeId = layer[nodeIndex];
                var node = normalizedNodes[nodeId];
                if (node.dummy) {
                    continue;
                }
                this._layoutSelfLoop(node);

                var successorIds = this._normalizedGraph.findSuccessors(node);
                for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
                    var successorId = successorIds[successorIndex];
                    var successor = normalizedNodes[successorId];

                    if (successor.dummy) {
                        this._introduceLongArc(node, successor);
                    }
                    else {
                        if (!successor.placed) {
                            this._layoutNode(successor);
                        }
                        this._layoutArcs(node, successor);
                    }
                }
            }
        }
    };

    SSGraphConverter.prototype._layoutNode = function (node) {
        if (!node.placed) {
            var graphNodes = this._ssGraph.markings();
            var realNode = graphNodes[node.id];
            realNode.position = this._calculateRealNodeCoords(node);
            node.placed = true;
        }
    };
    SSGraphConverter.prototype._layoutArcs = function (from, to, points) {
        var realNodes = this._ssGraph.markings();
        var realFrom = realNodes[from.id];
        var realTo = realNodes[to.id];

        var arcs = this._ssGraph.arcs();
        var arcToDest = arcs.get(realFrom.id, realTo.id);
        var arcToSrc = arcs.get(realTo.id, realFrom.id);

        if (!points) {
            points = [
                this._calculateIntersection(realFrom, realTo.position),
                this._calculateIntersection(realTo, realFrom.position)
            ];
        }

        if (arcToDest && arcToSrc) {
            this._splitArcs(realFrom, realTo, points);
        }
        else {
            if (arcToDest) {
                this._setArcAttributes(arcToDest, points);
            }
            else if (arcToSrc) {
                this._setArcAttributes(arcToSrc, CollectionUtils.cloneAndReverseArray(points));
            }
        }
    };
    SSGraphConverter.prototype._setArcAttributes = function (arc, points) {
        arc.points = points;
        arc.labelPosition = this._calculateArcLabelPosition(points);
    };
    SSGraphConverter.prototype._calculateArcLabelPosition = function (points) {
        var stPointIndex = Math.floor(points.length / 2);
        var ndPointIndex = stPointIndex - 1;
        var stPoint = points[stPointIndex];
        var ndPoint = points[ndPointIndex];
        return CanvasUtils.midpoint(stPoint, ndPoint);
    };

    SSGraphConverter.prototype._splitArcs = function (realFrom, realTo, points) {
        var segments = this._createArcSegments(points);
        var arcs = this._ssGraph.arcs();

        var toDestPoints = this._shiftSegments(segments, true);
        this._complementArcPoints(realFrom, realTo, toDestPoints);
        var arcToDest = arcs.get(realFrom.id, realTo.id);
        this._setArcAttributes(arcToDest, toDestPoints);

        var toSrcPoints = this._shiftSegments(segments, false);
        toSrcPoints.reverse();
        this._complementArcPoints(realTo, realFrom, toSrcPoints);
        var arcToSrc = arcs.get(realTo.id, realFrom.id);
        this._setArcAttributes(arcToSrc, toSrcPoints);
    };
    SSGraphConverter.prototype._createArcSegments = function (points) {
        var segments = [];
        for (var index = 0; index < points.length - 1; index++) {
            var firstPoint = points[index];
            var secondPoint = points[index + 1];

            var vector = CanvasUtils.vector(firstPoint, secondPoint);
            if (index === 0) {
                firstPoint = CanvasUtils.pointAtDistance(firstPoint, vector, 20);
            }

            if (index + 1 === points.length - 1) {
                var opositeVector = CanvasUtils.oppositeVector(vector);
                secondPoint = CanvasUtils.pointAtDistance(secondPoint, opositeVector, 20);
            }

            segments.push(new self.ArcSegment(firstPoint, secondPoint));
        }
        return segments;
    };
    SSGraphConverter.prototype._shiftSegments = function (segments, downwards) {
        var points = [];

        for (var segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
            var stSegment = segments[segmentIndex];
            var stShiftPoints = stSegment.shiftPoints(downwards);
            if (segmentIndex === 0) {
                points.push(stShiftPoints.start);
            }

            var ndSegment = segments[segmentIndex + 1];
            if (ndSegment) {
                var ndShiftPoints = ndSegment.shiftPoints(downwards);
                var intersection = CanvasUtils.intersect(stShiftPoints, ndShiftPoints);
                points.push(intersection);
            }
            else {
                points.push(stShiftPoints.end);
            }
        }

        return points;
    };
    SSGraphConverter.prototype._complementArcPoints = function (realFrom, realTo, midpoints) {
        var startPoint = this._calculateIntersection(realFrom, midpoints[0]);
        midpoints.unshift(startPoint);
        var endPoint = this._calculateIntersection(realTo, midpoints[midpoints.length - 1]);
        midpoints.push(endPoint);
    };

    SSGraphConverter.prototype._layoutSelfLoop = function (node) {
        var selfArc = this._ssGraph.arcs().get(node.id, node.id);
        if (selfArc) {
            var neighborIds = this._normalizedGraph.findSuccessors(node);
            neighborIds = neighborIds.concat(this._normalizedGraph.findPredecessors(node));

            var yMargin = this._options.rankSep / 2;
            var xMargin = this._options.nodeSep / 2;
            var nodeY = this._calculateRealNodeY(node);

            var boundaries = {
                minX: node.x - xMargin,
                maxX: node.x + xMargin,
                minY: nodeY - yMargin,
                maxY: nodeY + yMargin
            };
            var quadrants = {};

            var normalizedNodes = this._normalizedGraph.nodes();
            for (var neighborIndex = 0; neighborIndex < neighborIds.length; neighborIndex++) {
                var neighborId = neighborIds[neighborIndex];
                var neighbor = normalizedNodes[neighborId];

                var neighborx = neighbor.x;
                var neighborY = this._calculateRealNodeY(neighbor);

                var quadrant = this._determineQuadrant(boundaries, {x: neighborx, y: neighborY});
                var quadrantCount = quadrants[quadrant] || 0;
                quadrantCount++;
                quadrants[quadrant] = quadrantCount;
            }

            selfArc.quadrant = this._findLeastQuadrant(quadrants);
            selfArc.labelPosition = undefined;
        }
    };
    SSGraphConverter.prototype._determineQuadrant = function (boundaries, position) {
        var quadrant = 0;
        if (position.x <= boundaries.minX) {
            if (position.y <= boundaries.minY) {
                quadrant = 0;
            }
            else if (position.y >= boundaries.maxY) {
                quadrant = 6;
            }
            else {
                quadrant = 7;
            }
        }
        else if (position.x >= boundaries.maxX) {
            if (position.y <= boundaries.minY) {
                quadrant = 2;
            }
            else if (position.y >= boundaries.maxY) {
                quadrant = 4;
            }
            else {
                quadrant = 3;
            }
        }
        else {
            if (position.y <= boundaries.minY) {
                quadrant = 1;
            }
            else if (position.y >= boundaries.maxY) {
                quadrant = 5;
            }
        }
        return quadrant;
    };
    SSGraphConverter.prototype._findLeastQuadrant = function (quadrants) {
        var quadOcurences = {};
        var leastCount;

        for (var quadIndex = 0; quadIndex < 8; quadIndex++) {
            var quadCount = quadrants[quadIndex];
            if (!quadCount) {
                quadCount = 0;
            }

            var quadOcurence = quadOcurences[quadCount];
            if (!quadOcurence) {
                quadOcurence = [];
                quadOcurences[quadCount] = quadOcurence;
            }
            quadOcurence.push(quadIndex);

            if (LangUtils.isUndefined(leastCount) || leastCount > quadCount) {
                leastCount = quadCount;
            }
        }

        var leastQuads = quadOcurences[leastCount];
        var resultQuad;
        var leastNeighbors;

        for (var leastQuadIndex = 0; leastQuadIndex < leastQuads.length; leastQuadIndex++) {
            var leastQuad = leastQuads[leastQuadIndex];
            var neighbors = (quadrants[leastQuad > 0 ? leastQuad - 1 : 7] || 0) +
                (quadrants[leastQuad < 7 ? leastQuad + 1 : 0] || 0);

            if (LangUtils.isUndefined(leastNeighbors) || neighbors < leastNeighbors) {
                leastNeighbors = neighbors;
                resultQuad = leastQuad;
            }
        }

        return resultQuad || 0;
    };

    SSGraphConverter.prototype._introduceLongArc = function (nodeFrom, firstDummyNode) {
        var realNodes = this._ssGraph.markings();
        var realNodeFrom = realNodes[nodeFrom.id];

        var firstDummyRealPos = this._calculateRealNodeCoords(firstDummyNode);
        var arcPoints = [this._calculateIntersection(realNodeFrom, firstDummyRealPos)];
        arcPoints.push(firstDummyRealPos);
        var normalizedNodes = this._normalizedGraph.nodes();

        var curDummy = firstDummyNode;
        var successor;

        while (curDummy) {
            arcPoints.push();
            var sucessorId = this._normalizedGraph.findSuccessors(curDummy)[0];
            successor = normalizedNodes[sucessorId];

            var newPoint;
            if (successor.dummy) {
                newPoint = this._calculateRealNodeCoords(successor);
                curDummy = successor;
            }
            else {
                var realNodeTo = realNodes[sucessorId];
                if (!successor.placed) {
                    this._layoutNode(successor);
                }

                var prevArcPoint = arcPoints[arcPoints.length - 1];
                newPoint = this._calculateIntersection(realNodeTo, prevArcPoint);
                curDummy = undefined;
            }

            var prevPoint = arcPoints[arcPoints.length - 1];
            var ndPrevPoint = arcPoints[arcPoints.length - 2];
            if (ndPrevPoint && prevPoint) {
                var representsLines = CanvasUtils.liesOnLine(ndPrevPoint, newPoint, prevPoint);
                if (representsLines) {
                    arcPoints.pop();
                }
            }
            arcPoints.push(newPoint);
        }

        this._layoutArcs(nodeFrom, successor, arcPoints);
    };
    SSGraphConverter.prototype._calculateIntersection = function (realNode, outsidePoint) {
        var obj = {center: realNode.position, radius: 20};
        return CanvasUtils.circleCenterIntersect(obj, outsidePoint);
    };

    SSGraphConverter.prototype._calculateRealNodeCoords = function (normalizedNode) {
        var position = {
            x: this._calculateRealNodeX(normalizedNode),
            y: this._calculateRealNodeY(normalizedNode)
        };
        return position;
    };
    SSGraphConverter.prototype._calculateRealNodeX = function (node) {
        var correction = -(this._normalizedGraph.minX) + this._options.leftMargin;
        return node.x + correction;
    };
    SSGraphConverter.prototype._calculateRealNodeY = function (node) {
        return (node.level * this._options.rankSep) + this._options.topMargin;
    };

    self.SSGraphConverter = SSGraphConverter;
}());
//-- Arc segment
(function () {

    function ArcSegment(firstPoint, secondPoint) {
        this.start = firstPoint;
        this.end = secondPoint;
    }

    ArcSegment.prototype._pointShiftDistance = 10;

    ArcSegment.prototype.shiftPoints = function (downwards) {
        var orthogonalVector = this._getOrthogonalVector();
        if (!downwards) {
            orthogonalVector = CanvasUtils.oppositeVector(orthogonalVector);
        }
        return {
            start: CanvasUtils.pointAtDistance(this.start, orthogonalVector, this._pointShiftDistance),
            end: CanvasUtils.pointAtDistance(this.end, orthogonalVector, this._pointShiftDistance),
        };

    };
    ArcSegment.prototype._getOrthogonalVector = function () {
        if (!this._orthVector) {
            var dirVector = CanvasUtils.vector(this.start, this.end);
            this._orthVector = CanvasUtils.orthogonalVector(dirVector);
        }
        return this._orthVector;
    };

    self.ArcSegment = ArcSegment;
}());
//--- Normalized graph
(function () {

    function NormalizedGraph() {
        this._nodes = {};
        this._successors = {};
        this._predecessors = {};
        this._layers = [];
    }

    NormalizedGraph.prototype.normalize = function () {
        for (var layerIndex = 0; layerIndex < this._layers.length; layerIndex++) {
            var layer = CollectionUtils.cloneArray(this._layers[layerIndex]);

            for (var nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
                var nodeId = layer[nodeIndex];
                var node = this._nodes[nodeId];

                var successorIds = CollectionUtils.cloneArray(this.findSuccessors(nodeId));
                for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
                    var successorId = successorIds[successorIndex];
                    var successor = this._nodes[successorId];

                    if (nodeId === successorId) {
                        this.removeArc(nodeId, successorId);
                    }
                    else {
                        var levelDifference = successor.level - node.level;
                        if (levelDifference === 0) {
                            var loweredNodeIndex = this._lowerNode(successor);
                            if (loweredNodeIndex > nodeIndex) {
                                layer.splice(loweredNodeIndex, 1);
                            }
                        }
                        else if (levelDifference === -1) {
                            this._reverseArc(node, successor);
                        }
                        else if (levelDifference > 1) {
                            this._buildDummyPath(node, successor);
                        }
                        else if (levelDifference < -1) {
                            this._buildDummyPath(successor, node);
                        }
                    }
                }
            }
        }
    };
    NormalizedGraph.prototype._lowerNode = function (node) {
        var oldLayer = this._layers[node.level];
        var index = oldLayer.indexOf(node.id);
        oldLayer.splice(index, 1);

        node.level++;
        var newLayer = this.findOrCreateLayer(node.level);
        newLayer.push(node.id);

        this._repairDummyPaths(node);
        return index;
    };

    NormalizedGraph.prototype._reverseArc = function (from, to) {
        this.removeArc(from.id, to.id);

        var successors = this.findSuccessors(to.id);
        if (successors.indexOf(from.id) === -1) {
            this.addArc(to.id, from.id);
        }
    };
    NormalizedGraph.prototype._buildDummyPath = function (from, to) {
        var levelDifference = to.level - from.level - 1;
        if (levelDifference > 0) {
            this.removeArc(from.id, to.id);
            this.removeArc(to.id, from.id);
            var previousDummy = from;

            while (levelDifference > 0) {
                var dummyNode = {id: StringUtils.uuid(), level: to.level - levelDifference, dummy: true};
                this.addNode(dummyNode);
                this.addArc(previousDummy.id, dummyNode.id);
                previousDummy = dummyNode;
                levelDifference--;
            }
            this.addArc(previousDummy.id, to.id);
        }
    };
    NormalizedGraph.prototype._repairDummyPaths = function (node) {
        var predecessorIds = CollectionUtils.cloneArray(this.findPredecessors(node));
        for (var predecessorIndex = 0; predecessorIndex < predecessorIds.length; predecessorIndex++) {
            var predeseccorId = predecessorIds[predecessorIndex];
            var predecessor = this._nodes[predeseccorId];
            this._buildDummyPath(predecessor, node);
        }
    };

    NormalizedGraph.prototype.addNode = function (node) {
        this._nodes[node.id] = node;
        var layer = this.findOrCreateLayer(node.level);
        layer.push(node.id);
    };
    NormalizedGraph.prototype.findNode = function (node) {
        var nodeId = node ? typeof node === 'string' ? node : node.id : undefined;
        var ownNode = this._nodes[nodeId];
        if (!ownNode) {
            throw new Error('Graph does not contain node: ' + node);
        }
        return ownNode;
    };
    NormalizedGraph.prototype.findSuccessors = function (node) {
        var actNode = this.findNode(node);
        return this._successors[actNode.id] || [];
    };
    NormalizedGraph.prototype.findPredecessors = function (node) {
        var actNode = this.findNode(node);
        return this._predecessors[actNode.id] || [];
    };

    NormalizedGraph.prototype.arcs = function () {
        return this;
    };
    NormalizedGraph.prototype.addArc = function (srcId, destId) {
        var successors = this._successors[srcId];
        if (!successors) {
            successors = [];
            this._successors[srcId] = successors;
        }

        if (successors.indexOf(destId) === -1) {
            successors.push(destId);
        }

        var predecessors = this._predecessors[destId];
        if (!predecessors) {
            predecessors = [];
            this._predecessors[destId] = predecessors;
        }

        if (predecessors.indexOf(srcId) === -1) {
            predecessors.push(srcId);
        }
    };
    NormalizedGraph.prototype.removeArc = function (srcId, destId) {
        var successors = this.findSuccessors(srcId);
        var index = successors.indexOf(destId);
        if (index >= 0) {
            successors.splice(index, 1);
        }

        var predecessors = this.findPredecessors(destId);
        index = predecessors.indexOf(srcId);
        if (index >= 0) {
            predecessors.splice(index, 1);
        }
    };

    NormalizedGraph.prototype.findOrCreateLayer = function (level) {
        var layer = this._layers[level];
        if (!layer) {
            layer = [];
            this._layers.push(layer);
        }
        return layer;
    };

    NormalizedGraph.prototype.nodes = function () {
        return this._nodes;
    };
    NormalizedGraph.prototype.layers = function () {
        return this._layers;
    };
    NormalizedGraph.prototype.setLayers = function (ordering) {
        this._layers = ordering;
    };
    NormalizedGraph.prototype.setNodeX = function (nodeId, x) {
        var node = this.findNode(nodeId);
        node.x = x;

        if (LangUtils.isUndefined(this.minX) || this.minX > node.x) {
            this.minX = node.x;
        }
        if (LangUtils.isUndefined(this.maxX) || this.maxX < node.x) {
            this.maxX = node.x;
        }
    };

    self.NormalizedGraph = NormalizedGraph;
}());
//--- Cross reduction
(function () {

    function CrossReduction(normGraph) {
        this._graph = normGraph;
        this._levelMatrices = this._buildLevelMatrices();
    }

    CrossReduction.prototype._buildLevelMatrices = function () {
        var layers = this._graph.layers();
        var levelMatrices = [];

        for (var layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
            var layer = layers[layerIndex];
            var nextLayer = layers[layerIndex + 1];

            var layerMatrix = new self.LabeledMatrix();
            layerMatrix.init(layer, nextLayer, this._graph);
            levelMatrices.push(layerMatrix);
        }
        return levelMatrices;
    };

    CrossReduction.prototype.reduceCrossing = function (maxFalseAttempts) {
        var crossingBest = Number.MAX_VALUE;
        var falseAttempts = maxFalseAttempts;
        var bestOrdering;
        var downwards = true;

        while (crossingBest > 0 && falseAttempts > 0) {
            var crossingTotal = 0;
            if (downwards) {
                crossingTotal = this._downWardsReduction();
            }
            else {
                crossingTotal = this._upwardsReduction();
            }

            if (!crossingBest || crossingTotal < crossingBest) {
                crossingBest = crossingTotal;
                bestOrdering = this._persistOrdering();
            }
            else {
                falseAttempts--;
            }
            downwards = !downwards;
        }

        return bestOrdering;
    };
    CrossReduction.prototype._downWardsReduction = function () {
        var crossingTotal = 0;

        for (var layerIndex = 0; layerIndex < this._levelMatrices.length; layerIndex++) {
            var matrix = this._levelMatrices[layerIndex];
            crossingTotal += matrix.optimizeColumns();

            var nextMatrix = this._levelMatrices[layerIndex + 1];
            if (nextMatrix) {
                nextMatrix.setRowHeaders(matrix.colHeaders());
            }
        }

        return crossingTotal;
    };
    CrossReduction.prototype._upwardsReduction = function () {
        var crossingTotal = 0;

        for (var layerIndex = this._levelMatrices.length - 1; layerIndex >= 0; layerIndex--) {
            var matrix = this._levelMatrices[layerIndex];
            crossingTotal += matrix.optimizeRows();

            var prevMatrix = this._levelMatrices[layerIndex - 1];
            if (prevMatrix) {
                prevMatrix.setColHeaders(matrix.rowHeaders());
            }
        }

        return crossingTotal;
    };
    CrossReduction.prototype._persistOrdering = function () {
        var layerOrdering = [];

        for (var layerIndex = 0; layerIndex < this._levelMatrices.length; layerIndex++) {
            var matrix = this._levelMatrices[layerIndex];
            var rowHeaders = matrix.rowHeaders();
            var ordering = [];

            for (var rowIndex = 0; rowIndex < rowHeaders.length; rowIndex++) {
                var rowHeader = rowHeaders[rowIndex];
                ordering.push(rowHeader);
            }
            layerOrdering.push(ordering);

            if (layerIndex === this._levelMatrices.length - 1) {
                var colHeaders = matrix.colHeaders();
                ordering = [];

                for (var colIndex = 0; colIndex < colHeaders.length; colIndex++) {
                    var colHeader = colHeaders[colIndex];
                    ordering.push(colHeader);
                }
                layerOrdering.push(ordering);
            }
        }

        return layerOrdering;
    };

    self.CrossReduction = CrossReduction;
}());
//-- Labeled matrix
(function () {

    function LabeledMatrix() {
        this._data = new CollectionUtils.Table();
        this._rowHeaders = [];
        this._columnHeaders = [];

        this._crossCounter = new self.CrossCounter();
    }

    LabeledMatrix.prototype.rowHeaders = function () {
        return this._rowHeaders;
    };
    LabeledMatrix.prototype.setRowHeaders = function (rowHeaders) {
        this._rowHeaders = rowHeaders;
    };
    LabeledMatrix.prototype.colHeaders = function () {
        return this._columnHeaders;
    };
    LabeledMatrix.prototype.setColHeaders = function (colHeaders) {
        this._columnHeaders = colHeaders;
    };
    LabeledMatrix.prototype.arcData = function () {
        return this._data;
    };

    LabeledMatrix.prototype.init = function (layer, nextLayer, graph) {
        this._rowHeaders = layer;
        this._columnHeaders = nextLayer;

        for (var rowIndex = 0; rowIndex < this._rowHeaders.length; rowIndex++) {
            var rowNodeId = this._rowHeaders[rowIndex];
            var successorIds = graph.findSuccessors(rowNodeId);

            for (var colIndex = 0; colIndex < this._columnHeaders.length; colIndex++) {
                var colNodeId = this._columnHeaders[colIndex];
                this._data.put(rowNodeId, colNodeId, successorIds.indexOf(colNodeId) !== -1);
            }
        }
    };

    LabeledMatrix.prototype.optimizeColumns = function () {
        var barycenters = [];
        for (var colIndex = 0; colIndex < this._columnHeaders.length; colIndex++) {
            var colId = this._columnHeaders[colIndex];
            var barycenter = this._countBarycenter(false, colId);
            barycenters.push({id: colId, barycenter: barycenter});
        }

        barycenters = this._sort(barycenters);
        this._columnHeaders = this._extractBarycenterIds(barycenters);

        return this._crossCounter.countEdgeCrossing(this);
    };
    LabeledMatrix.prototype.optimizeRows = function () {
        var barycenters = [];
        for (var rowIndex = 0; rowIndex < this._rowHeaders.length; rowIndex++) {
            var rowId = this._rowHeaders[rowIndex];
            var barycenter = this._countBarycenter(true, rowId);
            barycenters.push({id: rowId, barycenter: barycenter});
        }

        barycenters = this._sort(barycenters);
        this._rowHeaders = this._extractBarycenterIds(barycenters);

        return this._crossCounter.countEdgeCrossing(this);
    };
    LabeledMatrix.prototype._extractBarycenterIds = function (barycenters) {
        var ids = [];
        for (var barycenterIndex = 0; barycenterIndex < barycenters.length; barycenterIndex++) {
            var barycenter = barycenters[barycenterIndex];
            ids.push(barycenter.id);
        }
        return ids;
    };

    LabeledMatrix.prototype._countBarycenter = function (row, id) {
        var count = 0;
        var sum = 0;

        var headers = row ? this._columnHeaders : this._rowHeaders;
        for (var index = 0; index < headers.length; index++) {
            var connectionId = headers[index];
            var hasArc = this._data.get(row ? id : connectionId, row ? connectionId : id);
            if (hasArc) {
                sum += (index + 1);
                count++;
            }
        }

        var barycenter = count === 0 ? -1 : (sum / count);
        return barycenter;
    };
    LabeledMatrix.prototype._sort = function (barycenters) {
        var sorted = barycenters.sort(function (first, second) {
            return first.barycenter - second.barycenter;
        });

        for (var index = 0; index < sorted.length - 1; index++) {
            var first = sorted[index];
            var second = sorted[index + 1];

            if (first.barycenter !== -1 && first.barycenter === second.barycenter) {
                var swap = Math.random() < 0.5;
                if (swap) {
                    sorted[index] = second;
                    sorted[index + 1] = first;
                }
            }
        }
        return sorted;
    };

    self.LabeledMatrix = LabeledMatrix;
}());
//-- Cross counter
(function () {

    function CrossCounter() {

    }

    CrossCounter.prototype.countEdgeCrossing = function (labeledMatrix) {
        var destSequence = [];

        var rowHeaders = labeledMatrix.rowHeaders();
        var colHeaders = labeledMatrix.colHeaders();
        var arcData = labeledMatrix.arcData();

        for (var rowIndex = 0; rowIndex < rowHeaders.length; rowIndex++) {
            var rowHeader = rowHeaders[rowIndex];

            for (var colIndex = 0; colIndex < colHeaders.length; colIndex++) {
                var colHeader = colHeaders[colIndex];
                var connected = arcData.get(rowHeader, colHeader);

                if (connected) {
                    destSequence.push(colIndex);
                }
            }
        }

        return this.insertionSort(destSequence);
    };

    CrossCounter.prototype.insertionSort = function (array) {
        var shiftCount = 0;

        for (var i = 0; i < array.length; i++) {
            var tmp = array[i];
            for (var j = i - 1; j >= 0 && (array[j] > tmp); j--) {
                shiftCount++;
                array[j + 1] = array[j];
            }
            array[j + 1] = tmp;
        }

        return shiftCount;
    };

    self.CrossCounter = CrossCounter;
}());
//-- HorizontalPlacement
(function () {

    function HorizontalPlacement(normGraph, nodeSep) {
        this._graph = normGraph;
        this._conflicts = new CollectionUtils.Table();

        this._delta = nodeSep;
    }

    HorizontalPlacement.prototype.placeNodes = function () {
        this._markTypeOneConflicts();

        var candidates = [];
        candidates.push(this._verticalAlignTL());
        candidates.push(this._verticalAlignTR());
        candidates.push(this._verticalAlignBL());
        candidates.push(this._verticalAlignBR());

        this._mergeCandidates(candidates);
    };
    HorizontalPlacement.prototype._mergeCandidates = function (candidates) {
        var leftmostCandidates = [], rightmostCandidates = [];
        for (var candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
            var candidate = candidates[candidateIndex];
            if (candidate.leftmost) {
                leftmostCandidates.push(candidate);
            }
            else {
                rightmostCandidates.push(candidate);
            }
        }

        var minLeftmostCandidate = leftmostCandidates[0].width < leftmostCandidates[1] ? leftmostCandidates[0] : leftmostCandidates[1];
        var maxLeftmostCandidate = leftmostCandidates[0].width < leftmostCandidates[1] ? leftmostCandidates[1] : leftmostCandidates[0];
        maxLeftmostCandidate.calculateOffset(minLeftmostCandidate);

        var minRightmostCandidate = rightmostCandidates[0].width < rightmostCandidates[1] ? rightmostCandidates[0] : rightmostCandidates[1];
        var maxRightmostCandidate = rightmostCandidates[0].width < rightmostCandidates[1] ? rightmostCandidates[1] : rightmostCandidates[0];
        maxRightmostCandidate.calculateOffset(minRightmostCandidate);

        var graph = this._graph;
        var layers = graph.layers();
        for (var layerIndex = 0; layerIndex < layers.length; layerIndex++) {
            var layer = layers[layerIndex];

            for (var nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
                var nodeId = layer[nodeIndex];
                var nodeXCoords = this._calcCandidatesCoord(candidates, nodeId);
                var finalX = (nodeXCoords[1] + nodeXCoords[2]) / 2;
                graph.setNodeX(nodeId, finalX);
            }
        }
    };
    HorizontalPlacement.prototype._calcCandidatesCoord = function (candidates, nodeId) {
        var coords = [];
        for (var candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
            var candidate = candidates[candidateIndex];
            coords.push(candidate.getNodeX(nodeId));
        }
        return coords.sort();
    };

    HorizontalPlacement.prototype._markTypeOneConflicts = function () {
        var layers = this._graph.layers();
        var nodes = this._graph.nodes();

        for (var layerIndex = 1; layerIndex < layers.length - 2; layerIndex++) {
            var upperLayer = layers[layerIndex];
            var lowerLayer = layers[layerIndex + 1];

            var k0 = 0, prevNodeIndex = 0;
            for (var nodeIndex = 0; nodeIndex < lowerLayer.length; nodeIndex++) {
                var nodeId = lowerLayer[nodeIndex];
                var node = nodes[nodeId];

                var dummyPredecessor = this._checkNodeDummyIncident(node);
                if (dummyPredecessor || nodeIndex === lowerLayer.length - 1) {
                    var k1 = upperLayer.length;
                    if (dummyPredecessor) {
                        k1 = upperLayer.indexOf(dummyPredecessor);
                    }

                    while (prevNodeIndex <= nodeIndex) {
                        var checkNodeId = lowerLayer[prevNodeIndex];
                        var predecessorIds = this._graph.findPredecessors(checkNodeId);
                        for (var predecessorIndex = 0; predecessorIndex < predecessorIds.length; predecessorIndex++) {
                            var predecessorId = predecessorIds[predecessorIndex];
                            var predecessorPos = upperLayer.indexOf(predecessorId);
                            if (predecessorPos === -1) {
                                throw new Error('Layers or graph were constructed with errors');
                            }

                            if (predecessorPos < k0 || predecessorPos > k1) {
                                this._conflicts.put(predecessorId, checkNodeId, true);
                            }
                        }
                        prevNodeIndex++;
                    }
                    k0 = k1;
                }
            }
        }
    };
    HorizontalPlacement.prototype._checkNodeDummyIncident = function (node) {
        var dummyPredecessor;

        if (node.dummy) {
            var predecessors = this._graph.findPredecessors(node);
            if (predecessors.length === 1) {
                var predecessorId = predecessors[0];
                var graphNodes = this._graph.nodes();
                var predecessor = graphNodes[predecessorId];

                if (predecessor.dummy) {
                    dummyPredecessor = predecessor;
                }
            }
        }

        return dummyPredecessor;
    };

    HorizontalPlacement.prototype._initNodesLinks = function () {
        var nodes = this._graph.nodes();
        for (var nodeId in nodes) {
            var node = nodes[nodeId];
            node.root = node;
            node.align = node;
            node.sink = node;
            node.shift = Number.MAX_VALUE;
            node.x = undefined;
        }
    };
    HorizontalPlacement.prototype._findPredecessorMedianNodes = function (nodeId, layer, leftFirst) {
        var predecessorIds = this._graph.findPredecessors(nodeId);
        var sortedPredecessorIds = [];

        var addedPredecessors = 0;
        for (var nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
            if (addedPredecessors === predecessorIds.length) {
                break;
            }

            var layerNodeId = layer[nodeIndex];
            if (predecessorIds.indexOf(layerNodeId) !== -1) {
                sortedPredecessorIds.push(layerNodeId);
                addedPredecessors++;
            }
        }

        return this._findMedianNodes(sortedPredecessorIds, leftFirst);
    };
    HorizontalPlacement.prototype._findSuccessorMedianNodes = function (nodeId, layer, leftFirst) {
        var successorIds = this._graph.findSuccessors(nodeId);
        var sortedSuccessorIds = [];

        var addedSuccessors = 0;
        for (var nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
            if (addedSuccessors === successorIds.length) {
                break;
            }

            var layerNodeId = layer[nodeIndex];
            if (successorIds.indexOf(layerNodeId) !== -1) {
                sortedSuccessorIds.push(layerNodeId);
                addedSuccessors++;
            }
        }

        return this._findMedianNodes(sortedSuccessorIds, leftFirst);
    };
    HorizontalPlacement.prototype._findMedianNodes = function (nodeIds, leftFirst) {
        var medianNodes = [];
        var median = nodeIds.length / 2;
        if (median > 0) {
            var graphNodes = this._graph.nodes();

            var medianNodeId = nodeIds[Math.floor(median)];
            var medianNode = graphNodes[medianNodeId];
            medianNodes.push(medianNode);

            if (nodeIds.length % 2 === 0) {
                var otherMedianId = nodeIds[median - 1];
                var otherMedianNode = graphNodes[otherMedianId];
                if (leftFirst) {
                    medianNodes.unshift(otherMedianNode);
                }
                else {
                    medianNodes.push(otherMedianNode);
                }
            }
        }
        return medianNodes;
    };

    HorizontalPlacement.prototype._verticalAlignTL = function () {
        this._initNodesLinks();

        var layers = this._graph.layers();
        var nodes = this._graph.nodes();

        for (var layerIndex = 1; layerIndex < layers.length; layerIndex++) {
            var prevLayer = layers[layerIndex - 1];
            var curLayer = layers[layerIndex];
            var lastAlign = -1;

            for (var nodeIndex = 0; nodeIndex < curLayer.length; nodeIndex++) {
                var nodeId = curLayer[nodeIndex];
                var node = nodes[nodeId];
                var medianNodes = this._findPredecessorMedianNodes(nodeId, prevLayer, true);

                for (var medianIndex = 0; medianIndex < medianNodes.length; medianIndex++) {
                    var medianNode = medianNodes[medianIndex];
                    if (node.align === node) {
                        var conflictSegment = this._conflicts.get(medianNode.id, nodeId);
                        var medianNodePos = prevLayer.indexOf(medianNode.id);
                        if (!conflictSegment && lastAlign < medianNodePos) {
                            medianNode.align = node;
                            node.root = medianNode.root;
                            node.align = node.root;
                            lastAlign = medianNodePos;
                        }
                    }
                }
            }
        }

        var candidate = this._horizontalCompaction();
        candidate.setLeftmost(true);
        return candidate;
    };
    HorizontalPlacement.prototype._verticalAlignTR = function () {
        this._initNodesLinks();

        var layers = this._graph.layers();
        var nodes = this._graph.nodes();

        for (var layerIndex = 1; layerIndex < layers.length; layerIndex++) {
            var prevLayer = layers[layerIndex - 1];
            var curLayer = layers[layerIndex];
            var lastAlign = Number.MAX_VALUE;

            for (var nodeIndex = curLayer.length - 1; nodeIndex >= 0; nodeIndex--) {
                var nodeId = curLayer[nodeIndex];
                var node = nodes[nodeId];
                var medianNodes = this._findPredecessorMedianNodes(nodeId, prevLayer, false);

                for (var medianIndex = 0; medianIndex < medianNodes.length; medianIndex++) {
                    var medianNode = medianNodes[medianIndex];
                    if (node.align === node) {
                        var conflictSegment = this._conflicts.get(medianNode.id, nodeId);
                        var medianNodePos = prevLayer.indexOf(medianNode.id);
                        if (!conflictSegment && lastAlign > medianNodePos) {
                            medianNode.align = node;
                            node.root = medianNode.root;
                            node.align = node.root;
                            lastAlign = medianNodePos;
                        }
                    }
                }
            }
        }

        var candidate = this._horizontalCompaction();
        candidate.setLeftmost(false);
        return candidate;
    };
    HorizontalPlacement.prototype._verticalAlignBL = function () {
        this._initNodesLinks();

        var layers = this._graph.layers();
        var nodes = this._graph.nodes();

        for (var layerIndex = layers.length - 2; layerIndex >= 0; layerIndex--) {
            var curLayer = layers[layerIndex];
            var nextLayer = layers[layerIndex + 1];
            var lastAlign = -1;

            for (var nodeIndex = 0; nodeIndex < curLayer.length; nodeIndex++) {
                var nodeId = curLayer[nodeIndex];
                var node = nodes[nodeId];
                var medianNodes = this._findSuccessorMedianNodes(nodeId, nextLayer, true);

                for (var medianIndex = 0; medianIndex < medianNodes.length; medianIndex++) {
                    var medianNode = medianNodes[medianIndex];
                    if (node.align === node) {
                        var conflictSegment = this._conflicts.get(nodeId, medianNode.id);
                        var medianNodePos = nextLayer.indexOf(medianNode.id);
                        if (!conflictSegment && lastAlign < medianNodePos) {
                            medianNode.align = node;
                            node.root = medianNode.root;
                            node.align = node.root;
                            lastAlign = medianNodePos;
                        }
                    }
                }
            }
        }

        var candidate = this._horizontalCompaction();
        candidate.setLeftmost(true);
        return candidate;
    };
    HorizontalPlacement.prototype._verticalAlignBR = function () {
        this._initNodesLinks();

        var layers = this._graph.layers();
        var nodes = this._graph.nodes();

        for (var layerIndex = layers.length - 2; layerIndex >= 0; layerIndex--) {
            var curLayer = layers[layerIndex];
            var nextLayer = layers[layerIndex + 1];
            var lastAlign = Number.MAX_VALUE;

            for (var nodeIndex = curLayer.length - 1; nodeIndex >= 0; nodeIndex--) {
                var nodeId = curLayer[nodeIndex];
                var node = nodes[nodeId];
                var medianNodes = this._findSuccessorMedianNodes(nodeId, nextLayer, false);

                for (var medianIndex = 0; medianIndex < medianNodes.length; medianIndex++) {
                    var medianNode = medianNodes[medianIndex];
                    if (node.align === node) {
                        var conflictSegment = this._conflicts.get(nodeId, medianNode.id);
                        var medianNodePos = nextLayer.indexOf(medianNode.id);
                        if (!conflictSegment && lastAlign > medianNodePos) {
                            medianNode.align = node;
                            node.root = medianNode.root;
                            node.align = node.root;
                            lastAlign = medianNodePos;
                        }
                    }
                }
            }
        }

        var candidate = this._horizontalCompaction();
        candidate.setLeftmost(false);
        return candidate;
    };

    HorizontalPlacement.prototype._horizontalCompaction = function () {
        var graphNodes = this._graph.nodes();

        var nodeId, node;
        for (nodeId in graphNodes) {
            node = graphNodes[nodeId];
            if (node.root === node) {
                this._placeBlock(node);
            }
        }

        var candidate = new self.PlacementCandidate();
        for (nodeId in graphNodes) {
            node = graphNodes[nodeId];
            var root = node.root;
            node.x = root.x;
            if (root.sink.shift < Number.MAX_VALUE) {
                node.x += root.sink.shift;
            }
            candidate.appendNode(node);
        }

        candidate.calculateWidth();
        return candidate;
    };
    HorizontalPlacement.prototype._placeBlock = function (node) {
        if (!LangUtils.isUndefined(node.x)) {
            return;
        }
        node.x = 0;
        var layers = this._graph.layers();
        var nodes = this._graph.nodes();
        var currentNode = node;

        do {
            var layer = layers[currentNode.level];
            var nodePos = layer.indexOf(currentNode.id);
            if (nodePos > 0) {
                var prevNodeId = layer[nodePos - 1];
                var prevNode = nodes[prevNodeId];
                var prevRoot = prevNode.root;
                this._placeBlock(prevRoot);

                if (node.sink === node) {
                    node.sink = prevRoot.sink;
                }

                if (node.sink !== prevRoot.sink) {
                    var newShift = node.x - prevRoot.x - this._delta;
                    prevRoot.shift = Math.min(prevRoot.shift, newShift);
                }
                else {
                    node.x = Math.max(node.x, prevRoot.x + this._delta);
                }
            }
            currentNode = currentNode.align;
        }
        while (currentNode !== node);
    };

    self.HorizontalPlacement = HorizontalPlacement;
}());
//-- PlacementCandidate
(function () {

    function PlacementCandidate() {
        this.nodes = {};
    }

    PlacementCandidate.prototype.appendNode = function (node) {
        this.nodes[node.id] = node.x;
        if (LangUtils.isUndefined(this.minX) || this.minX > node.x) {
            this.minX = node.x;
        }
        if (LangUtils.isUndefined(this.maxX) || this.maxX < node.x) {
            this.maxX = node.x;
        }
    };
    PlacementCandidate.prototype.calculateWidth = function () {
        this.width = this.maxX - this.minX;
    };
    PlacementCandidate.prototype.setLeftmost = function (leftmost) {
        this.leftmost = leftmost;
    };

    PlacementCandidate.prototype.getNodeX = function (nodeId) {
        var nodeX = this.nodes[nodeId];
        return nodeX + (this.offset || 0);
    };
    PlacementCandidate.prototype.calculateOffset = function (against) {
        this.offset = (this.leftmost ? against.minX - this.minX : against.maxX - this.maxX);
    };

    self.PlacementCandidate = PlacementCandidate;
}());
//---- Worker
(function () {
    self.importScripts('/utils/CollectionUtils.js',
        '/utils/LangUtils.js',
        '/utils/StringUtils.js',
        '/utils/CanvasUtils.js'
    );
    self.importScripts('/businessObjects/ssBusiness/SSGraph.js');

    self.onmessage = function (event) {
        var graphData = event.data[0];
        var options = event.data[1];

        var ssGraph = new SSBusiness.SSGraph();
        ssGraph.loadData(graphData);

        var graphConverter = new self.SSGraphConverter(options);
        var normalizedGraph = graphConverter.toNormalizedGraph(ssGraph);
        if (normalizedGraph) {
            var crossReduction = new self.CrossReduction(normalizedGraph);
            var ordering = crossReduction.reduceCrossing(20);
            if (ordering.length) {
                normalizedGraph.setLayers(ordering);
            }

            var horizontalPlacement = new self.HorizontalPlacement(normalizedGraph, options.nodeSep);
            horizontalPlacement.placeNodes();

            graphConverter.toSSGraph(normalizedGraph);
        }

        self.postMessage(ssGraph);
    };
}());