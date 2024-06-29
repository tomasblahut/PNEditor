'use strict';
//--- TreeNode
(function () {

    function TreeNode(id, parent) {
        this.id = id;
        this.parent = parent;
        this.level = parent && typeof parent.level !== 'undefined' ? parent.level + 1 : 0;
    }

    TreeNode.prototype.addChild = function (child) {
        if (!this.children) {
            this.children = [];
        }
        this.children.push(child);
    };

    TreeNode.prototype.firstChild = function () {
        return this.children && this.children.length > 0 ? this.children[0] : undefined;
    };
    TreeNode.prototype.lastChild = function () {
        return this.children && this.children.length > 0 ? this.children[this.children.length - 1] : undefined;
    };

    self.TreeNode = TreeNode;
}());
//--- Tree
(function () {
    function Tree(root) {
        this.root = root;
    }

    Tree.prototype.postOrderTraversal = function (iteratee) {
        if (typeof iteratee !== 'function') {
            throw new Error('Cannot invoke non function object on tree nodes');
        }

        if (this.root) {
            var nodeStack = [{node: this.root, childNumber: 0}];
            while (nodeStack.length > 0) {
                var currentInstance = nodeStack.pop();

                var children = currentInstance.node.children;
                if (children && currentInstance.childNumber < children.length) {
                    nodeStack.push(currentInstance);
                    nodeStack.push({node: children[currentInstance.childNumber], childNumber: 0});
                    currentInstance.childNumber++;
                }
                else {
                    iteratee(currentInstance.node);
                }
            }
        }
    };

    self.Tree = Tree;
}());
//--- TreeConverter
(function () {

    function TreeConverter() {
    }

    TreeConverter.prototype.convert = function (ssGraph) {
        var tree = new self.Tree();

        var initialMarking = ssGraph.findInitialMarking();
        if (initialMarking) {
            var root = new self.TreeNode(initialMarking.id);
            var visitedNodes = [root.id];
            var nodeQueue = [root];

            var arcs = ssGraph.arcs();
            while (nodeQueue.length > 0) {
                var currentNode = nodeQueue.shift();
                var successorIds = arcs.colKeys(currentNode.id);

                for (var successorIndex = 0; successorIndex < successorIds.length; successorIndex++) {
                    var successorId = successorIds[successorIndex];

                    if (visitedNodes.indexOf(successorId) === -1) {
                        var curChild = new self.TreeNode(successorId, currentNode);
                        var leftSibling = currentNode.lastChild();
                        if (leftSibling) {
                            curChild.leftSibling = leftSibling;
                            leftSibling.rightSibling = curChild;
                        }
                        currentNode.addChild(curChild);

                        nodeQueue.push(curChild);
                        visitedNodes.push(curChild.id);
                    }
                }
            }
            tree.root = root;
        }

        return tree;
    };

    self.TreeConverter = TreeConverter;
}());
//---- Worker
(function () {
    self.importScripts('/utils/CollectionUtils.js', '/utils/CanvasUtils.js');
    self.importScripts('/businessObjects/ssBusiness/SSGraph.js');

    self._calcPreliminaryPosition = function (root) {
        var iterStack = [{node: root, childNumber: 0}];

        while (iterStack.length > 0) {
            var curIteration = iterStack.pop();

            var node = curIteration.node;
            if (!node.firstChild()) {
                var leftSibling = node.leftSibling;
                if (leftSibling) {
                    node.prelim = leftSibling.prelim + 1;
                }
            }
            else {
                if (!curIteration.defaultAncestor) {
                    curIteration.defaultAncestor = node.firstChild();
                }

                var childNumber = curIteration.childNumber;
                if (childNumber === node.children.length) {
                    var lastChild = node.lastChild();
                    curIteration.defaultAncestor = self._appendSubtree(lastChild, curIteration.defaultAncestor);

                    self._executeShifts(node);

                    var firstChild = node.firstChild();
                    var midpoint = (firstChild.prelim + lastChild.prelim) / 2;

                    if (node.leftSibling) {
                        node.prelim = node.leftSibling.prelim + 1;
                        node.mod = node.prelim - midpoint;
                    }
                    else {
                        node.prelim = midpoint;
                    }
                }
                else {
                    if (childNumber > 0) {
                        var prevChild = node.children[childNumber - 1];
                        curIteration.defaultAncestor = self._appendSubtree(prevChild, curIteration.defaultAncestor);
                    }

                    if (childNumber < node.children.length) {
                        var child = node.children[childNumber];
                        curIteration.childNumber++;

                        iterStack.push(curIteration);
                        iterStack.push({node: child, childNumber: 0});
                    }
                }
            }
        }
    };

    self._appendSubtree = function (node, defaultAncestor) {
        var leftSibling = node.leftSibling;
        if (leftSibling) {
            var ricn = node; //Right inner contour node
            var rocn = node; //Right outter contour node
            var licn = leftSibling; //Left inner contour node
            var locn = node.parent.firstChild(); //Left outer contour node

            var sir = ricn.mod; //Sum of right inner cn mods
            var sor = rocn.mod; //Sum of right outter cn mods
            var sil = licn.mod; //Sum of left inner cn mods
            var sol = locn.mod; //Sum of left outter cn mods

            var nextRicn = self._findNextContour(ricn, false);
            var nextLicn = self._findNextContour(licn, true);

            while (nextRicn && nextLicn) {
                ricn = nextRicn;
                licn = nextLicn;
                rocn = self._findNextContour(rocn, true);
                locn = self._findNextContour(locn, false);
                rocn.ancestor = node;

                var shift = (licn.prelim + sil) - (ricn.prelim + sir) + 1;
                if (shift > 0) {
                    //Find left most uncommon ancestor of collision nodes, right one is current node itself
                    var lmuAncestor = (licn.ancestor.parent === node.parent) ? licn.ancestor : defaultAncestor;
                    self._moveConflictSubtree(lmuAncestor, node, shift);
                    sir += shift;
                    sor += shift;
                }

                sil += licn.mod;
                sol += locn.mod;
                sir += ricn.mod;
                sor += rocn.mod;
                nextRicn = self._findNextContour(ricn, false);
                nextLicn = self._findNextContour(licn, true);
            }

            if (nextLicn && !self._findNextContour(rocn, true)) {
                rocn.thread = nextLicn;
                rocn.mod += sil - sor;
            }

            if (nextRicn && !self._findNextContour(locn, false)) {
                locn.thread = nextRicn;
                locn.mod += sir - sol;
                defaultAncestor = node;
            }
        }
        return defaultAncestor;
    };

    self._findNextContour = function (node, right) {
        return (right ? node.lastChild() : node.firstChild()) || node.thread;
    };

    self._moveConflictSubtree = function (lmuAncestor, rmuAncestor, shift) {
        var nodesBetween = rmuAncestor.childNumber - lmuAncestor.childNumber;
        rmuAncestor.change -= shift / nodesBetween;
        rmuAncestor.shift += shift;
        rmuAncestor.prelim += shift;
        rmuAncestor.mod += shift;
        lmuAncestor.change += shift / nodesBetween;
    };

    self._executeShifts = function (node) {
        var shift = 0;
        var change = 0;

        var children = CollectionUtils.cloneAndReverseArray(node.children);
        for (var childIndex = 0; childIndex < children.length; childIndex++) {
            var child = children[childIndex];
            child.prelim += shift;
            child.mod += shift;
            change += child.change;
            shift += child.shift + change;
        }
    };

    self._translateRealPosition = function (root) {
        var iterStack = [{nodes: [root], mod: -root.prelim, level: 0}];

        while (iterStack.length > 0) {
            var iteration = iterStack.pop();
            var nodes = iteration.nodes;
            var curMod = iteration.mod;
            var curLevel = iteration.level;

            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                node.x = node.prelim + curMod;
                node.y = curLevel;

                var children = node.children;
                if (children) {
                    iterStack.push({nodes: children, mod: curMod + node.mod, level: curLevel + 1});
                }
            }
        }
    };

    self._thirdWalk = function (currentNode) {
        var minX = currentNode.x;

        var nextLocn = self._findNextContour(currentNode, false);
        while (nextLocn) {
            if (nextLocn.x < minX) {
                minX = nextLocn.x;
            }
            nextLocn = self._findNextContour(nextLocn, false);
        }

        return minX;
    };

    self.onmessage = function (event) {
        var graphData = event.data[0];
        var options = event.data[1];

        var ssGraph = new SSBusiness.SSGraph();
        ssGraph.loadData(graphData);

        var treeConverter = new self.TreeConverter();
        var tree = treeConverter.convert(ssGraph);
        if (tree.root) {
            tree.postOrderTraversal(function (node) {
                node.ancestor = node;
                node.mod = 0;
                node.prelim = 0;
                node.change = 0;
                node.shift = 0;
                node.childNumber = node.parent ? node.parent.children.indexOf(node) : 0;
                node.thread = undefined;
            });

            self._calcPreliminaryPosition(tree.root);
            self._translateRealPosition(tree.root, -tree.root.prelim, 0);

            var rankSep = options.rankSep;
            var nodeSep = options.nodeSep;
            var minX = self._thirdWalk(tree.root);
            if (minX <= 0) {
                minX = Math.abs(minX * nodeSep) + options.leftMargin;
            }
            var minY = options.topMargin;

            var markingIdMap = ssGraph.markings();
            tree.postOrderTraversal(function (node) {
                var marking = markingIdMap[node.id];
                marking.position = {x: minX + node.x * nodeSep, y: minY + node.level * rankSep};

                delete node.ancestor;
                delete node.prelim;
                delete node.mod;
                delete node.childNumber;
                delete node.thread;
                delete node.change;
                delete node.shift;
            });

            var cellSet = ssGraph.arcs().cellSet();
            for (var cellIndex = 0; cellIndex < cellSet.length; cellIndex++) {
                var arcCell = cellSet[cellIndex];
                var arc = arcCell.value;

                var srcMark = ssGraph.findMarking(arcCell.rowKey);
                var destMark = ssGraph.findMarking(arcCell.colKey);

                var srcPos = srcMark.position;
                var destPos = destMark.position;
                var xDelta = Math.abs(srcPos.x - destPos.x);

                var arcPoints = [];
                if (xDelta === 0) {
                    arcPoints.push(CanvasUtils.circleCenterIntersect({
                        center: srcMark.position,
                        radius: 20
                    }, destMark.position));
                    arcPoints.push(CanvasUtils.circleCenterIntersect({
                        center: destMark.position,
                        radius: 20
                    }, srcMark.position));
                }
                else {
                    var yDelta = Math.abs(srcPos.y - destPos.y);
                    var middleY = srcPos.y + (yDelta / 2) - 10;
                    var firstMiddlePoint = {x: srcPos.x, y: middleY};
                    var secondMiddlePoint = {x: destPos.x, y: middleY};

                    arcPoints.push(CanvasUtils.circleCenterIntersect({
                        center: srcPos,
                        radius: 20
                    }, firstMiddlePoint));
                    arcPoints.push(firstMiddlePoint);
                    arcPoints.push({x: destPos.x, y: middleY});
                    arcPoints.push(CanvasUtils.circleCenterIntersect({
                        center: destPos,
                        radius: 20
                    }, secondMiddlePoint));
                }

                arc.points = arcPoints;
                var lastPoint = arcPoints[arcPoints.length - 1];
                arc.labelPosition = {x: lastPoint.x, y: lastPoint.y - 30};
            }
        }

        self.postMessage(ssGraph);
    };
}());