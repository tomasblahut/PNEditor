'use strict';

(function () {
    angular.module('CyclesDirectives', [])
        .directive('cyclesPanel', function ($rootScope, $timeout, $mdDialog) {
            var arrowCharacter = '⇾';

            return {
                replace: true,
                restrict: 'E',
                scope: {
                    cycles: '='
                },
                link: function (scope) {
                    scope.$watch('cycles', function (newVal) {
                        _.forEach(newVal, function (cycle) {
                            cycle.cycleStr = _.pluck(cycle.components, 'name').join(' ' + arrowCharacter + ' ');
                        });
                        scope.hasCycles = newVal && newVal.length > 0;
                    });

                    scope.highlightCycle = function (cycle) {
                        var cycleData = _.map(cycle.components, function (component) {
                            return {id: component.id};
                        });
                        notifyCycle({identificationMethod: 'cycle', highlightType: 'accent', objects: cycleData});
                    };
                    scope.clearHighlight = function () {
                        notifyCycle();
                    };

                    scope.showDetailsOf = function (cycle, index) {
                        $mdDialog.show({
                            clickOutsideToClose: true,
                            templateUrl: 'editor/analysis/cycles/cyclesPanel/cyclesDialog.tmpl.html',
                            controller: function ($scope) {
                                $scope.cycleIndex = index;
                                $scope.cycleComponents = _.map(cycle.components, function (component, index) {
                                    var componentNamt = component.name;
                                    return index === cycle.components.length - 1 ? componentNamt : componentNamt + ' ' + arrowCharacter;
                                });

                                $scope.close = function () {
                                    $mdDialog.cancel();
                                };
                            }
                        });
                    };

                    function notifyCycle(data) {
                        $timeout(function () {
                            $rootScope.$broadcast('highlight_pn_objects', {highlightData: data});
                        });
                    }
                },
                templateUrl: 'editor/analysis/cycles/cyclesPanel/cyclesPanel.tmpl.html'
            };
        });
}());