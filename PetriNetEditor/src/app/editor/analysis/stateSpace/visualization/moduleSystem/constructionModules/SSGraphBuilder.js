'use strict';

(function () {
    angular.module('SSConstructionModules', [
        'CanvasModules',
        'SSSettings'
    ])
        .factory('SSGraphBuilder', function ($q, $timeout, spinnerService, Notification, CanvasModule, SSSettingsManager) {

            var MANUALLY_TERMINATED = 'manually terminated';

            function SSGraphBuilder() {
                this._graphData = new SSBusiness.SSGraphData();
                this._ssGraph = new SSBusiness.SSGraph();

                this._workerTokens = [];
                this._terminatedTokens = [];
            }

            var modulePrototype = createjs.extend(SSGraphBuilder, CanvasModule);
            modulePrototype._doInit = function () {
                this._graphWorker = new Worker('workers/graphConstruction/ssGraphWorker.js');

                var module = this;
                this._graphWorker.onmessage = function (event) {
                    var data = event.data;
                    module._processWorkerResponse(data[0], data[1], data[2]);
                };
                this._graphWorker.onerror = function (error) {
                    var message = _.get(error, 'message');
                    console.error('Error while calculating graph: ' + message);
                    Notification.error({
                        title: 'Error while calculating graph',
                        message: message || 'unknown error',
                        positionY: 'bottom', positionX: 'right',
                        delay: 3000
                    });
                    module._disposeModal();
                };
            };

            modulePrototype._performWorkerCall = function (operation, callData) {
                delete this._interrupted;

                var callToken = StringUtils.uuid();
                this._workerTokens.push(callToken);
                this._graphWorker.postMessage([callToken, operation, callData]);
            };
            modulePrototype._processWorkerResponse = function (token, operation, data) {
                var shouldProcess = this._checkShouldProcessResponse(token);
                if (shouldProcess) {
                    var module = this;

                    if (operation === 'initStateSpace') {
                        this._graphData.loadData(data.graphData);
                        this._ssGraph.loadData(data.graph);
                        this._clearGUIElements();
                        this._rebuildStateSpace();
                    }
                    else if (operation === 'rebuildStateSpace') {
                        this._ssGraph.loadData(data.graph);
                        this._clearGUIElements();
                        this._rebuildStateSpace();
                    }
                    else if (operation === 'transformGraph') {
                        var transformation = data.transformation;
                        if (transformation) {
                            this._ssGraph.loadData(data.graph);

                            var type = transformation.type;
                            if (type === 'toGraph') {
                                var removedMarkingIds = transformation.removedMarkings;
                                var graphLayer = this._layerBus.getLayer('graph');

                                for (var index = 0; index < removedMarkingIds.length; index++) {
                                    var markingId = removedMarkingIds[index];
                                    graphLayer.removeMarking(markingId);
                                }
                            }

                            this._rebuildStateSpace();
                        }
                        else {
                            this._disposeModal();
                        }
                    }
                    else if (operation === 'expandMarking') {
                        var changesOccured = data.changesOccured;
                        if (changesOccured) {
                            this._ssGraph.loadData(data.graph);
                            this._layoutAndDrawStateSpace().then(function () {
                                module._resolveExpandPromise(true, true);
                            });
                        }
                        else {
                            this._resolveExpandPromise(true, false);
                        }
                    }
                    else if (operation === 'collapseMarking') {
                        var removedElements = data.removedElements;
                        if (!removedElements.empty) {
                            this._ssGraph.loadData(data.graph);
                            this._removeGUIElements(removedElements, data.marking);
                            this._layoutAndDrawStateSpace().then(function () {
                                module._resolveCollapsePromise(true, true);
                            });
                        }
                        else {
                            this._resolveCollapsePromise(true, false);
                        }
                    }
                    else {
                        this._disposeModal();
                    }
                }
            };
            modulePrototype._checkShouldProcessResponse = function (token) {
                var terminated = _.includes(this._terminatedTokens, token);
                _.pull(this._terminatedTokens, token);
                _.pull(this._workerTokens, token);
                return !terminated;
            };

            modulePrototype.initStateSpace = function (petriNet, graphData) {
                if (!graphData || !petriNet) {
                    this._eraseStateSpace();
                }
                else {
                    this._initModal();
                    var settings = SSSettingsManager.getSettings();
                    var callData = {petriNet: petriNet, graphData: graphData, settings: settings};
                    this._performWorkerCall('initStateSpace', callData);
                }
            };
            modulePrototype.rebuildStateSpace = function () {
                this._initModal();
                var settings = SSSettingsManager.getSettings();
                var callData = {settings: settings};
                this._performWorkerCall('rebuildStateSpace', callData);
            };
            modulePrototype.transformGraph = function () {
                this._initModal();
                var settings = SSSettingsManager.getSettings();
                var callData = {settings: settings};
                this._performWorkerCall('transformGraph', callData);
            };
            modulePrototype._eraseStateSpace = function () {
                this._performWorkerCall('eraseStateSpace');
                this._graphData.clear();
                this._clearStateSpace();
            };
            modulePrototype._clearStateSpace = function () {
                this._ssGraph.clear();
                this._clearGUIElements();
                this._stageHandler.updateStage();
            };

            modulePrototype.interrupt = function () {
                this._terminatedTokens = this._terminatedTokens.concat(this._workerTokens);
                this._interrupted = true;

                this._resolveExpandPromise(false, 'interrupted manually');
                this._resolveCollapsePromise(false, 'interrupted manually');

                this._clearStateSpace();
                this._disposeModal();
            };
            modulePrototype.settingsChanged = function (changes) {
                if (changes.typeChanged) {
                    this.transformGraph();
                }
                else if (changes.layoutChanged) {
                    this._initModal();
                    this._rebuildStateSpace();
                }
            };

            modulePrototype._clearGUIElements = function () {
                var graphLayer = this._layerBus.getLayer('graph');
                graphLayer.clearContent();
            };
            modulePrototype._layoutAndDrawStateSpace = function () {
                var module = this;
                var laySettings = SSSettingsManager.getLayoutSettings();
                return this._layoutPerformer.performLayout(this._ssGraph, laySettings.type, laySettings.options)
                    .then(function () {
                        return module._redrawStateSpace();
                    });
            };
            modulePrototype._rebuildStateSpace = function () {
                var module = this;
                this._layoutAndDrawStateSpace()
                    .then(function () {
                        module._navigator._updateObjectVisibility();
                        module._stageHandler.updateStage();
                    })
                    .finally(function () {
                        module._disposeModal();
                    });
            };
            modulePrototype._redrawStateSpace = function () {
                var module = this;
                return this._redrawMarkings()
                    .then(function (markingIdMap) {
                        return module._redrawArcs(markingIdMap);
                    })
                    .catch(function (err) {
                        var message = _.get(err, 'message');
                        if (message !== MANUALLY_TERMINATED) {
                            console.error('Error while layouting graph: ' + message);
                            Notification.error({
                                title: 'Error while drawing graph',
                                message: message || 'unknown error',
                                positionY: 'bottom', positionX: 'right',
                                delay: 3000
                            });
                        }

                        return $q.reject();
                    });
            };

            modulePrototype._redrawMarkings = function () {
                var defered = $q.defer();

                var markingIds = _.keys(this._ssGraph.markings());
                var markingCount = markingIds.length;
                var indexFrom = 0;
                var batchSteps = 100;

                var markingIdMap = {};
                var module = this;

                startMarkingIteration(100);

                function startMarkingIteration(delay) {
                    $timeout(markingIterationLogic, delay || 0, false).then(markingIterationFinished, markingIterationError);
                }

                function markingIterationLogic() {
                    if (module._interrupted) {
                        throw new Error(MANUALLY_TERMINATED);
                    }

                    var indexTo = indexFrom + batchSteps >= markingCount ? indexFrom + (markingCount - indexFrom) : indexFrom + batchSteps;
                    var newMarkingMap = module._drawMarkingPortion(_.slice(markingIds, indexFrom, indexTo));
                    markingIdMap = _.merge(markingIdMap, newMarkingMap);
                    indexFrom = indexTo;
                    return indexTo === markingCount;
                }

                function markingIterationFinished(done) {
                    if (done) {
                        defered.resolve(markingIdMap);
                    }
                    else {
                        startMarkingIteration();
                    }
                }

                function markingIterationError(err) {
                    defered.reject(err);
                }

                return defered.promise;
            };
            modulePrototype._drawMarkingPortion = function (markingIds) {
                var graphLayer = this._layerBus.getLayer('graph');
                var markings = this._ssGraph.markings();
                var markingIdMap = {};

                for (var index = 0; index < markingIds.length; index++) {
                    var markingId = markingIds[index];
                    var ssMarking = markings[markingId];

                    var marking = graphLayer.findMarking(ssMarking);
                    if (!marking) {
                        marking = this._createCanvasMarking(ssMarking);
                        graphLayer.addMarking(marking);
                    }
                    markingIdMap[marking.id] = marking;
                    marking.applyChanges(ssMarking);
                }

                return markingIdMap;
            };
            modulePrototype._createCanvasMarking = function (ssMarking) {
                var markingGuiData = this._graphData.getMarkingGuiData(ssMarking);
                var markingData = _.merge(markingGuiData, ssMarking);
                return this._objectFactory.create('marking', markingData);
            };

            modulePrototype._redrawArcs = function (markingIdMap) {
                var defered = $q.defer();

                var arcsCells = this._ssGraph.arcs().cellSet();
                var arcsCount = arcsCells.length;
                var indexFrom = 0;
                var batchSteps = 100;
                var module = this;

                startArcsIteration(100);

                function startArcsIteration(delay) {
                    $timeout(arcsIterationLogic, delay || 0, false).then(arcsIterationFinished, arcsIterationError);
                }

                function arcsIterationLogic() {
                    if (module._interrupted) {
                        throw new Error(MANUALLY_TERMINATED);
                    }

                    var indexTo = indexFrom + batchSteps >= arcsCount ? indexFrom + (arcsCount - indexFrom) : indexFrom + batchSteps;
                    module._drawArcsPortion(_.slice(arcsCells, indexFrom, indexTo), markingIdMap);
                    indexFrom = indexTo;
                    return indexTo === arcsCount;
                }

                function arcsIterationFinished(done) {
                    if (done) {
                        defered.resolve();
                    }
                    else {
                        startArcsIteration();
                    }
                }

                function arcsIterationError(err) {
                    defered.reject(err);
                }

                return defered.promise;
            };
            modulePrototype._drawArcsPortion = function (arcCells, markingIdMap) {
                var graphLayer = this._layerBus.getLayer('graph');
                for (var index = 0; index < arcCells.length; index++) {
                    var cell = arcCells[index];

                    var ssArc = cell.value;
                    var arc = graphLayer.findArc(ssArc);
                    var srcMarking = markingIdMap[cell.rowKey];
                    var destMarking = markingIdMap[cell.colKey];

                    if (!arc) {
                        arc = this._createCanvasArc(srcMarking, destMarking, ssArc);
                        graphLayer.addArc(arc);
                    }
                    else {
                        arc.applyChanges(srcMarking, destMarking, ssArc);
                    }
                }
            };
            modulePrototype._createCanvasArc = function (srcMarking, destMarking, ssArc) {
                var arcGuiData = this._graphData.getArcGuiData(ssArc);
                var arcData = _.merge(arcGuiData, ssArc, {src: srcMarking, dest: destMarking});
                return this._objectFactory.create('arc', arcData);
            };

            modulePrototype.findSameMarkings = function (marking) {
                var graphLayer = this._layerBus.getLayer('graph');
                return graphLayer.findSameMarkings(marking);
            };
            modulePrototype.loadNetState = function (marking) {
                var ssMarking = this._ssGraph.findMarking(marking);
                return this._graphData.findMarkingByStateHash(ssMarking).netState;
            };
            modulePrototype.navigateToInitialMarking = function () {
                var initialMarking = this._ssGraph.findInitialMarking();
                if (initialMarking) {
                    var graphLayer = this._layerBus.getLayer('graph');
                    var guiMarking = graphLayer.findMarking(initialMarking);
                    if (guiMarking) {
                        var shifted = this._navigator.centerPoint(guiMarking.getGlobalCenter());
                        if (shifted) {
                            this._stageHandler.updateStage();
                        }
                    }
                }
            };

            modulePrototype.expandMarking = function (marking) {
                this._expandDefered = $q.defer();

                var settings = SSSettingsManager.getSettings();
                var callData = {settings: settings, marking: marking.id};
                this._performWorkerCall('expandMarking', callData);

                return this._expandDefered.promise;
            };
            modulePrototype._resolveExpandPromise = function (success, value) {
                if (this._expandDefered) {
                    if (success) {
                        this._expandDefered.resolve(value);
                    }
                    else {
                        this._expandDefered.reject(value);
                    }
                    this._expandDefered = undefined;
                }
            };

            modulePrototype.collapseMarking = function (marking) {
                this._collapseDefered = $q.defer();

                var callData = {marking: marking.id};
                this._performWorkerCall('collapseMarking', callData);

                return this._collapseDefered.promise;
            };
            modulePrototype._resolveCollapsePromise = function (success, value) {
                if (this._collapseDefered) {
                    if (success) {
                        this._collapseDefered.resolve(value);
                    }
                    else {
                        this._collapseDefered.reject(value);
                    }
                    this._collapseDefered = undefined;
                }
            };
            modulePrototype._removeGUIElements = function (removedElements, rootMarking) {
                var graphLayer = this._layerBus.getLayer('graph');

                var markings = _.get(removedElements, 'markings');
                _.forEach(markings, function (markingId) {
                    if (markingId !== rootMarking.id) {
                        graphLayer.removeMarking(markingId);
                    }
                });

                var arcs = _.get(removedElements, 'arcs');
                _.forEach(arcs, function (arcId) {
                    graphLayer.removeArc(arcId);
                });
            };

            modulePrototype._initModal = function () {
                spinnerService.show('analysisSpinner');
            };
            modulePrototype._disposeModal = function () {
                $timeout(function () {
                    spinnerService.hide('analysisSpinner');
                });
            };

            modulePrototype.dispose = function () {
                this._disposeModal();
                this._graphWorker.terminate();
                delete this._graphWorker;
            };

            return SSGraphBuilder;
        });
}());