'use strict';

(function () {
    angular.module('PNGui', [])
        .directive('simulationPanel', function ($mdDialog) {
            return {
                replace: true,
                restrict: 'E',
                scope: true,
                link: function (scope) {
                    var listeners = [
                        scope.$on('automaticFiringStarted', function () {
                            scope.data.automaticFiring = true;
                        }),
                        scope.$on('automaticFiringEnded', function () {
                            scope.data.automaticFiring = false;
                        })
                    ];

                    scope.data = {
                        automaticFiring: false,
                        delay: 1000
                    };

                    scope.toggleAutomaticFiring = function () {
                        if (scope.data.automaticFiring) {
                            scope.pnManager.startAutomaticSimulation(scope.data.delay);
                        }
                        else {
                            scope.pnManager.stopAutomaticSimulation();
                        }
                    };

                    scope.showBatchDialog = function () {
                        var netManager = scope.pnManager;
                        $mdDialog.show({
                            clickOutsideToClose: false,
                            templateUrl: 'editor/modelling/gui/simulationPanel/batchDialog.tmpl.html',
                            locals: {netManager: netManager},
                            controller: function ($scope, $timeout, netManager) {
                                var listeners = [
                                    $scope.$on('batchCompleted', function (event, args) {
                                        $scope.data.message = 'Finished after ' + _.get(args, 'steps') + ' steps';
                                        $scope.data.status = 'finishedOK';
                                    }),
                                    $scope.$on('batchError', function (event, args) {
                                        $scope.data.message = 'Error while simulating net';
                                        $scope.data.status = 'finishedError';
                                    })
                                ];

                                $scope.data = {
                                    status: 'init',
                                    message: 'Executing simulation...',
                                    inProgress: true,
                                    batchSteps: 1000
                                };

                                $scope.executeBatch = function () {
                                    $scope.data.status = 'inProgress';
                                    netManager.executeBatch($scope.data.batchSteps);
                                };

                                $scope.cancelBatch = function () {
                                    netManager.cancelBatch();
                                    $scope.data.status = 'finishedOK';
                                    $scope.close();
                                };

                                $scope.close = function () {
                                    $mdDialog.cancel();
                                };

                                $scope.$on('destroy', function () {
                                    _.forEach(listeners, function (listener) {
                                        listener();
                                    });
                                });
                            }
                        });
                    };

                    scope.$on('destroy', function () {
                        _.forEach(listeners, function (listener) {
                            listener();
                        });
                    });
                },
                templateUrl: 'editor/modelling/gui/simulationPanel/simulationPanel.tmpl.html'
            };
        });
}());