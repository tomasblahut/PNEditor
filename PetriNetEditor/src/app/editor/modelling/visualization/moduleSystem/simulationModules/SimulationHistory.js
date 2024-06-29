'use strict';

(function () {
    angular.module('SimulationHistory', [])
        .factory('History', function () {

            function History() {
                this._steps = [];
                this._curStep = undefined;
                this._states = {};
            }

            History.prototype.getCurrentState = function () {
                if (this._curStep) {
                    return this._states[this._curStep.stateHash];
                }
            };

            History.prototype.addSimulationStep = function (netState, transition) {
                var stepToken = this._parseStep(netState, transition);
                this._steps.push(stepToken);
                this._curStep = stepToken;
                return stepToken;
            };
            History.prototype._parseStep = function (netState, transition) {
                var state = this._states[netState.stateHash];
                if (!state) {
                    state = netState;
                    state.name = 'M' + _.keys(this._states).length;
                    this._states[netState.stateHash] = netState;
                }

                return {
                    id: StringUtils.uuid(),
                    transName: transition,
                    stateName: state.name,
                    stateHash: state.stateHash
                };
            };

            History.prototype.goToStep = function (stepId) {
                var callResult = {};

                var curStepId = _.get(this._curStep, 'id');
                if (curStepId !== stepId) {
                    var newStep = _.find(this._steps, 'id', stepId);
                    if (newStep) {
                        this._curStep = newStep;
                        callResult.state = this._states[newStep.stateHash];
                    }
                }

                return callResult;
            };
            History.prototype.goToPreviousStep = function () {
                var callResult = {};

                if (this._curStep) {
                    var curStepIndex = this._steps.indexOf(this._curStep);
                    if (curStepIndex > 0) {
                        var prevStep = this._steps[curStepIndex - 1];
                        if (prevStep.stateHash !== this._curStep.stateHash) {
                            callResult.state = this._states[prevStep.stateHash];
                        }

                        this._curStep = prevStep;
                        callResult.step = prevStep;
                    }
                }

                return callResult;
            };
            History.prototype.goToNextStep = function () {
                var callResult = {};

                if (this._curStep) {
                    var curStepIndex = this._steps.indexOf(this._curStep);
                    if (curStepIndex < this._steps.length - 1) {
                        var nextStep = this._steps[curStepIndex + 1];
                        if (nextStep.stateHash !== this._curStep.stateHash) {
                            callResult.state = this._states[nextStep.stateHash];
                        }

                        this._curStep = nextStep;
                        callResult.step = nextStep;
                    }
                }

                return callResult;
            };

            History.prototype.beginBatch = function () {
                this._checkpoint = this._steps.length - 1;
            };
            History.prototype.commitBatch = function () {
                var newSteps = [];
                if (typeof this._checkpoint !== 'undefined') {
                    newSteps = this._steps.slice(this._checkpoint + 1, this._steps.length);
                }
                delete this._checkpoint;
                return newSteps;
            };
            History.prototype.rollbackBatch = function () {
                if (typeof this._checkpoint !== 'undefined') {
                    this._steps = this._steps.slice(0, this._checkpoint + 1);
                    var stepHashes = _.pluck(this._steps, 'stateHash');
                    this._states = _.pick(this._states, function (value, key) {
                        return stepHashes.indexOf(key) !== -1;
                    });

                    this._curStep = _.last(this._steps);
                }
                delete this._checkpoint;
            };

            History.prototype.clear = function () {
                var originState;
                var originStep = this._steps[0];
                if (originStep) {
                    originState = this._states[originStep.stateHash];
                }

                this._steps = [];
                this._states = {};
                delete this._checkpoint;

                return originState;
            };

            return History;
        });
}());