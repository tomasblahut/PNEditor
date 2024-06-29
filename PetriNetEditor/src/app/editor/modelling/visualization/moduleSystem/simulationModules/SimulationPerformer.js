'use strict';

(function () {
    angular.module('PNSimulationModules', [
        'SimulationHistory'
    ])
        .factory('SimulationPerformer', function ($rootScope, $interval, $q, $timeout, CanvasModule, History) {

            var NEW_STEP_KEY = 'newSimulationStep';
            var STEP_CHANGED_KEY = 'simulationStepChanged';
            var SIMULATION_CLEARED_KEY = 'simulationCleared';
            var AUTOMATIC_FIRING_STARTED_KEY = 'automaticFiringStarted';
            var AUTOMATIC_FIRING_ENDED_KEY = 'automaticFiringEnded';
            var BATCH_COMPLETED = 'batchCompleted';
            var BATCH_ERROR = 'batchError';

            function SimulationPerformer() {
                CanvasModule.call(this);
            }

            var modulePrototype = createjs.extend(SimulationPerformer, CanvasModule);
            modulePrototype._doInit = function () {
                var module = this;
                this._listenerTokens = [
                    this._eventManager.addListener('transitionClick', function (tce) {
                        if (module._intervalPromise) {
                            return;
                        }

                        var transition = tce.transition;
                        module._performTransition(transition.id);
                    })
                ];
                this._history = new History();
            };
            modulePrototype.initSimulation = function () {
                this.clearSimulation();

                var pnConstructor = this._moduleBus.getModule('pnConstructor');
                var transitions = pnConstructor.findBusinessPTObjects('transition');
                this._transIdMap = _.indexBy(transitions, 'id');

                var transArcMap = this._transArcMap = {};
                _.forEach(transitions, function (transition) {
                    var outputArcs = _.map(pnConstructor.findOutputArcs(transition), function (arc, placeId) {
                        return {placeId: placeId, multiplicity: arc.multiplicity};
                    });
                    var inputArcs = _.map(pnConstructor.findInputArcs(transition), function (arc, placeId) {
                        return {placeId: placeId, multiplicity: arc.multiplicity};
                    });

                    transArcMap[transition.id] = {outputArcs: outputArcs, inputArcs: inputArcs};
                });

                var initialState = pnConstructor.getNetState();
                var stepToken = this._history.addSimulationStep(initialState);
                this._notifyAboutNewStep(stepToken);
                this._applyNetState(initialState);
            };

            modulePrototype._performTransition = function (transId) {
                if (this._enabledTrans.indexOf(transId) === -1) {
                    return;
                }

                var currentState = this._history.getCurrentState();
                var newState = this._calculateNewState(currentState, transId);

                var trans = this._transIdMap[transId];
                var stepToken = this._history.addSimulationStep(newState, trans.name);
                this._notifyAboutNewStep(stepToken);

                if (!currentState.isSameAs(newState)) {
                    this._applyNetState(newState);
                }
            };
            modulePrototype._notifyAboutNewStep = function (stepTokens) {
                var actSteps = _.compact([].concat(stepTokens));
                $timeout(function () {
                    $rootScope.$broadcast(NEW_STEP_KEY, {steps: actSteps});
                });
            };
            modulePrototype._notifyAboutBatchCompleted = function (stepCount) {
                $timeout(function () {
                    $rootScope.$broadcast(BATCH_COMPLETED, {steps: stepCount});
                });
            };
            modulePrototype._notifyAboutBatchError = function (err) {
                $timeout(function () {
                    $rootScope.$broadcast(BATCH_ERROR, {err: err});
                });
            };

            modulePrototype._identifyEnabledTransitions = function (netState) {
                var enabledTrans = [];

                if (netState) {
                    _.forEach(this._transArcMap, function (arcs, transId) {
                        var inputArcs = arcs.inputArcs;
                        var enabled = true;

                        _.forEach(inputArcs, function (inputArc) {
                            var placeTokens = netState.getTokens(inputArc.placeId);
                            if (placeTokens < inputArc.multiplicity) {
                                enabled = false;
                                return false;
                            }
                        });

                        if (enabled) {
                            enabledTrans.push(transId);
                        }
                    });
                }

                return enabledTrans;
            };
            modulePrototype._calculateNewState = function (currentState, transId) {
                var newState = currentState;

                var arcs = this._transArcMap[transId];
                if (arcs) {
                    var changes = {};
                    _.forEach(arcs.inputArcs, function (inputArc) {
                        changes[inputArc.placeId] = -inputArc.multiplicity;
                    });

                    _.forEach(arcs.outputArcs, function (outputArc) {
                        var curTokens = changes[outputArc.placeId] || 0;
                        changes[outputArc.placeId] = curTokens + outputArc.multiplicity;
                    });

                    newState = currentState.applyChanges(changes);
                }

                return newState;
            };

            modulePrototype._applyNetState = function (netState) {
                this._adjustPlaceTokens(netState);
                this._enabledTrans = this._identifyEnabledTransitions(netState);
                this._highlightTransitions(this._enabledTrans);
                this._stageHandler.updateStage();
            };
            modulePrototype._adjustPlaceTokens = function (netState) {
                var pnConstructor = this._moduleBus.getModule('pnConstructor');
                var guiPlaces = pnConstructor.findPTObjects('place');

                _.forEach(guiPlaces, function (guiPlace) {
                    guiPlace.tokens = netState.getTokens(guiPlace.id);
                    guiPlace.drawObject();
                });

            };
            modulePrototype._highlightTransitions = function (transIds) {
                this._clearTransitionHighlight();

                if (transIds.length > 0) {
                    var pnConstructor = this._moduleBus.getModule('pnConstructor');
                    var guiTrans = _.filter(pnConstructor.findPTObjects('transition'), function (guiTrans) {
                        return transIds.indexOf(guiTrans.id) !== -1;
                    });

                    var highlighter = this._moduleBus.getModule('highlighter');
                    this._highlightToken = highlighter.highlightObjects({
                        highlightType: 'simulation',
                        objects: guiTrans
                    });
                }
            };
            modulePrototype._clearTransitionHighlight = function () {
                if (this._highlightToken) {
                    var highlighter = this._moduleBus.getModule('highlighter');
                    highlighter.removeHighlight(this._highlightToken);
                    this._highlightToken = undefined;
                }
            };

            modulePrototype.goToStep = function (stepId) {
                var callResult = this._history.goToStep(stepId);
                if (callResult.state) {
                    this._applyNetState(callResult.state);
                }
            };
            modulePrototype.goToPreviousStep = function () {
                var callResult = this._history.goToPreviousStep();
                if (callResult.state) {
                    this._applyNetState(callResult.state);
                }

                if (callResult.step) {
                    $rootScope.$broadcast(STEP_CHANGED_KEY, {stepId: callResult.step.id});
                }
            };
            modulePrototype.goToNextStep = function () {
                var callResult = this._history.goToNextStep();
                if (callResult.state) {
                    this._applyNetState(callResult.state);
                }

                if (callResult.step) {
                    $rootScope.$broadcast(STEP_CHANGED_KEY, {stepId: callResult.step.id});
                }
            };
            modulePrototype.startAutomaticSimulation = function (periodMillis) {
                var module = this;

                function performRandomTransition() {
                    var transId = module._enabledTrans[Math.floor(Math.random() * module._enabledTrans.length)];
                    if (transId) {
                        module._performTransition(transId);
                    }
                    else {
                        module.stopAutomaticSimulation();
                    }
                }

                this.stopAutomaticSimulation();
                this._intervalPromise = $interval(performRandomTransition, periodMillis);

                $rootScope.$broadcast(AUTOMATIC_FIRING_STARTED_KEY, {});
            };
            modulePrototype.stopAutomaticSimulation = function () {
                if (this._intervalPromise) {
                    $interval.cancel(this._intervalPromise);
                }
                this._intervalPromise = undefined;
                $rootScope.$broadcast(AUTOMATIC_FIRING_ENDED_KEY, {});
            };
            modulePrototype.restartSimulation = function () {
                this.initSimulation();
                var originState = this._history.getCurrentState();
                if (originState) {
                    this._applyNetState(originState);
                }
            };

            modulePrototype.executeSimulationBatch = function (stepCount) {
                if (this._batchExecuting) {
                    return;
                }
                var module = this;
                var performedSteps = 0;

                this._batchExecuting = true;
                this._batchCancelled = false;

                this._history.beginBatch();
                startInteration(100);

                function startInteration(delay) {
                    $timeout(iterationLogic, delay || 0, false).then(iterationFinished, iterationError);
                }

                function iterationLogic() {
                    if (module._batchCancelled) {
                        throw new Error('cancelled manually');
                    }
                    var stepsToPerform = Math.min(stepCount - performedSteps, 100);

                    var simulationHalted = false;
                    for (var index = 0; index < stepsToPerform; index++) {
                        var currentState = module._history.getCurrentState();

                        var enabledTrans = module._identifyEnabledTransitions(currentState);
                        if (enabledTrans.length === 0) {
                            simulationHalted = true;
                            break;
                        }
                        var selectedTransId = enabledTrans[Math.floor(Math.random() * enabledTrans.length)];
                        var newState = module._calculateNewState(currentState, selectedTransId);

                        var selectedTrans = module._transIdMap[selectedTransId];
                        module._history.addSimulationStep(newState, selectedTrans.name);

                        performedSteps++;
                    }

                    return simulationHalted || performedSteps === stepCount;
                }

                function iterationFinished(simDone) {
                    if (simDone) {
                        var newSteps = module._history.commitBatch();
                        module._notifyAboutNewStep(newSteps);

                        var lastReachedState = module._history.getCurrentState();
                        module._applyNetState(lastReachedState);

                        module._notifyAboutBatchCompleted(performedSteps);
                        delete  module._batchExecuting;
                    }
                    else {
                        startInteration();
                    }
                }

                function iterationError(err) {
                    if (err.message !== 'cancelled manually') {
                        module._notifyAboutBatchError(err);
                        console.error('Error while executing simulation batch ' + err);
                    }
                    module._history.rollbackBatch();
                    delete module._batchCancelled;
                    delete module._batchExecuting;
                }
            };
            modulePrototype.cancelSimulationBatch = function () {
                this._batchCancelled = true;
            };

            modulePrototype.clearSimulation = function () {
                this._clearTransitionHighlight();
                this.stopAutomaticSimulation();
                this._transIdMap = undefined;

                $timeout(function () {
                    $rootScope.$broadcast(SIMULATION_CLEARED_KEY, {});
                });

                return this._history.clear();
            };
            modulePrototype.dispose = function () {
                var module = this;
                _.forEach(this._listenerTokens, function (token) {
                    module._eventManager.clearListener(token);
                });


                var originNetState = this.clearSimulation();
                this._adjustPlaceTokens(originNetState);
            };

            return SimulationPerformer;
        });
}());