'use strict';

(function () {
    angular.module('TrapCotrapDirectives', [])
        .directive('placeSubsetPanel', function ($rootScope, $timeout, $mdDialog) {
            return {
                replace: true,
                restrict: 'E',
                scope: {
                    subsets: '=',
                    type: '@'
                },
                link: function (scope) {
                    scope.$watch('subsets', function (newVal) {
                        _.forEach(newVal, function (subset) {
                            subset.subsetStr = '{ ' + _.pluck(subset.places, 'name').join(', ') + ' }';
                        });
                        scope.hasSubsets = newVal && newVal.length > 0;
                    });

                    scope.subsetType = scope.type === 'C' ? 'Cotraps' : 'Traps';

                    scope.highlightSubset = function (sub) {
                        var invData = _.map(sub.places, function (place) {
                            return {id: place.id};
                        });
                        notifyTrapCotrapSubset({
                            identificationMethod: 'byId',
                            highlightType: 'accent',
                            objects: invData
                        });
                    };
                    scope.clearHighlight = function () {
                        notifyTrapCotrapSubset();
                    };

                    scope.showDetailsOf = function (subset, index) {
                        var type = scope.type;

                        $mdDialog.show({
                            clickOutsideToClose: true,
                            templateUrl: 'editor/analysis/trapCotrap/placeSubsetPanel/placeSubsetDialog.tmpl.html',
                            controller: function ($scope) {
                                $scope.subsetType = type === 'C' ? 'Cotrap' : 'Trap';
                                $scope.subsetName = type + index;
                                $scope.subsetPlaceNames = _.pluck(subset.places, 'name');

                                $scope.close = function () {
                                    $mdDialog.cancel();
                                };
                            }
                        });
                    };

                    function notifyTrapCotrapSubset(data) {
                        $timeout(function () {
                            $rootScope.$broadcast('highlight_pn_objects', {highlightData: data});
                        });
                    }
                },
                templateUrl: 'editor/analysis/trapCotrap/placeSubsetPanel/placeSubsetPanel.tmpl.html'
            };
        });
}());