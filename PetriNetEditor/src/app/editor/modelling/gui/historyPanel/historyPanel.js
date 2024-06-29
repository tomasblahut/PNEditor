'use strict';

(function () {
    angular.module('PNGui')
        .directive('historyPanel', function () {
            return {
                replace: true,
                restrict: 'E',
                scope: true,
                link: function (scope) {
                    scope.steps = [];

                    var listeners = [
                        scope.$on('newSimulationStep', function (event, args) {
                            var steps = _.get(args, 'steps');
                            if (steps && steps.length) {
                                scope.steps = scope.steps.concat(steps);
                                scope.currentStepId = steps[steps.length - 1].id;
                                scope.topIndex = scope.steps.length - 1;
                            }
                        }),
                        scope.$on('simulationStepChanged', function (event, args) {
                            var stepId = _.get(args, 'stepId');
                            if (stepId) {
                                scope.currentStepId = stepId;

                                var currentStep = _.find(scope.steps, 'id', stepId);
                                scope.topIndex = scope.steps.indexOf(currentStep);
                            }
                        }),
                        scope.$on('simulationCleared', function () {
                            scope.steps = [];
                            scope.currentStepId = undefined;
                            scope.topIndex = 0;
                        }),
                        scope.$on('automaticFiringStarted', function () {
                            scope.automaticFiring = true;
                        }),
                        scope.$on('automaticFiringEnded', function () {
                            scope.automaticFiring = false;
                        })
                    ];
                    scope.topIndex = 0;
                    scope.currentStepId = undefined;

                    scope.goToStep = function (stepId) {
                        scope.currentStepId = stepId;
                        scope.pnManager.goToStep(stepId);
                    };

                    scope.$on('destroy', function () {
                        _.forEach(listeners, function (listener) {
                            listener();
                        });
                    });
                },
                templateUrl: 'editor/modelling/gui/historyPanel/historyPanel.tmpl.html'
            };
        });
}());