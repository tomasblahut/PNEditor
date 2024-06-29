'use strict';

(function () {
    angular.module('Cycles', [
        'SharedEditorAssets',
        'CyclesDirectives'
    ])
        .config(function ($stateProvider) {
            $stateProvider.state('cycles', {
                parent: 'model',
                url: '/cycles',
                templateUrl: 'editor/analysis/cycles/cycles.html',
                controller: 'cyclesCtrl'
            });
        })
        .controller('cyclesCtrl', function ($scope, CurrentNet) {
            $scope.$watch('analysisData', function () {
                refreshCycles();
            });

            function refreshCycles() {
                var petriNet = CurrentNet.getCurrentNet();
                var placeIdMap = _.indexBy(petriNet.places(), 'id');
                var transIdMap = _.indexBy(petriNet.transitions(), 'id');

                var cyclesData = _.cloneDeep(_.find($scope.analysisData, 'method', 'Cycles'));
                $scope.cyclesErrors = _.get(cyclesData, 'errors');

                var cycles = _.get(cyclesData, 'cycles');
                if (cycles) {
                    var mappedCycles = _.map(cycles, function (cycle) {
                        cycle.components = _.map(cycle.componentIds, function (componentId) {
                            var ptObj = placeIdMap[componentId];
                            if (!ptObj) {
                                ptObj = transIdMap[componentId];
                            }
                            return {id: componentId, name: ptObj.name};
                        });
                        delete cycle.componentIds;
                        return cycle;
                    });

                    cycles = _.sortBy(mappedCycles, function (cycle) {
                        return cycle.components.length;
                    });
                }
                $scope.cycles = cycles;

                var placesNotCovered = _.get(cyclesData, 'placesNotCovered');
                if (placesNotCovered) {
                    var placeNames = _.map(placesNotCovered, function (placeId) {
                        return placeIdMap[placeId].name;
                    });
                    placesNotCovered = {
                        ids: placesNotCovered,
                        names: placeNames,
                    };
                }

                var transNotCovered = _.get(cyclesData, 'transitionsNotCovered');
                if (transNotCovered) {
                    var transNames = _.map(transNotCovered, function (transId) {
                        return transIdMap[transId].name;
                    });
                    transNotCovered = {
                        ids: transNotCovered,
                        names: transNames
                    };
                }

                $scope.carrierData = undefined;
                var hasPlaces = _.get(petriNet.places(), 'length') > 0;
                var hasTransitions = _.get(petriNet.transitions(), 'length') > 0;
                if (hasPlaces && hasTransitions) {
                    $scope.carrierData = {
                        places: placesNotCovered,
                        transitions: transNotCovered
                    };
                }
            }
        });
})();