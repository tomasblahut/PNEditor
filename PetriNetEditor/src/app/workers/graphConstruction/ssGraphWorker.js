'use strict';

//---- Worker
(function () {
    self.importScripts('/utils/CollectionUtils.js',
        '/utils/LangUtils.js',
        '/utils/StringUtils.js',
        '/utils/CanvasUtils.js'
    );
    self.importScripts('/businessObjects/ssBusiness/CollapsingGraph.js',
        '/businessObjects/ssBusiness/SSGraph.js',
        '/businessObjects/ssBusiness/SSGraphData.js'
    );

    self._graphData = new SSBusiness.SSGraphData();
    self._ssGraph = new SSBusiness.SSGraph();

    self.initStateSpace = function (graphData, petriNet, settings) {
        self._graphData.initFromPetrinet(graphData, petriNet);
        self.rebuildStateSpace(settings);
    };

    self.rebuildStateSpace = function (settings) {
        self._ssGraph.clear();

        var initialMarking = self._graphData.getInitialMarking();
        if (initialMarking) {
            self._ssGraph.setInitialMarking(self._graphData.getInitialMarking());
            var manualExpanding = settings.manualExpanding;
            var expandLevels = manualExpanding.expandAll ? -1 : manualExpanding.expandLevels;
            var subData = self._graphData.subgraph(expandLevels, initialMarking, self._ssGraph);
            self._ssGraph.appendExpansion(subData, initialMarking);
            self._ssGraph.recountMarkingLevels();
        }

        self.performGraphTransformation(settings);
        self._updateExpansionMarks();
    };

    self.performGraphTransformation = function (settings) {
        return self._ssGraph.transform(settings.graphType, self._graphData);
    };

    self.expandMarking = function (settings, marking) {
        var manualExpanding = settings.manualExpanding;
        var subgraph = self._graphData.subgraph(manualExpanding.expandLevels, marking, self._ssGraph);

        var changesOccured = !subgraph.empty;
        if (changesOccured) {
            self._ssGraph.appendExpansion(subgraph, marking);
            self._ssGraph.recountMarkingLevels();
        }
        return changesOccured;
    };

    self.collapseMarking = function (marking) {
        var removedElements = self._ssGraph.removeSuccessors(marking);
        if (!removedElements.empty) {
            self._ssGraph.recountMarkingLevels();
            var ssMarking = self._ssGraph.findMarking(marking);
            ssMarking.expanded = false;
        }
        return removedElements;
    };

    self._updateExpansionMarks = function () {
        var graphMarkings = self._ssGraph.markings();
        var graphArcs = self._ssGraph.arcs();
        var dataArcs = self._graphData.arcTable();

        for (var markingId in graphMarkings) {
            var graphMarking = graphMarkings[markingId];
            var successors = graphArcs.colKeys(graphMarking.id);
            if (successors.length > 0) {
                graphMarking.expanded = true;
            }
            else {
                var dataSuccessors = dataArcs.colKeys(graphMarking.id);
                graphMarking.expanded = dataSuccessors.length === 0;
            }
        }
    };

    self.onmessage = function (event) {
        var token = event.data[0];
        var operation = event.data[1];
        var callArguments = event.data[2];

        var responseArguments = {};
        if (operation === 'initStateSpace') {
            self.initStateSpace(callArguments.graphData, callArguments.petriNet, callArguments.settings);
            responseArguments = {graph: self._ssGraph, graphData: self._graphData};
        }
        else if (operation === 'eraseStateSpace') {
            self._graphData.clear();
            self._ssGraph.clear();
        }
        else if (operation === 'rebuildStateSpace') {
            self.rebuildStateSpace(callArguments.settings);
            responseArguments = {graph: self._ssGraph};
        }
        else if (operation === 'transformGraph') {
            var transformations = self.performGraphTransformation(callArguments.settings);
            responseArguments = {graph: self._ssGraph, transformation: transformations};
        }
        else if (operation === 'expandMarking') {
            var changesOccured = self.expandMarking(callArguments.settings, callArguments.marking);
            responseArguments = {changesOccured: changesOccured};
            if (changesOccured) {
                responseArguments.graph = self._ssGraph;
            }
        }
        else if (operation === 'collapseMarking') {
            var removedElements = self.collapseMarking(callArguments.marking);
            responseArguments = {removedElements: removedElements, marking: callArguments.marking};
            if (!removedElements.empty) {
                responseArguments.graph = self._ssGraph;
            }
        }

        self.postMessage([token, operation, responseArguments]);
    };
}());