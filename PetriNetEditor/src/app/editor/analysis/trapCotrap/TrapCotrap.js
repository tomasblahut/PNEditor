'use strict';

(function () {
    angular.module('TrapCotrap', [
        'SharedEditorAssets',
        'TrapCotrapDirectives'
    ])
        .config(function ($stateProvider) {
            $stateProvider.state('trapCotrap', {
                parent: 'model',
                url: '/trapCotrap',
                templateUrl: 'editor/analysis/trapCotrap/trapCotrap.html',
                controller: 'trapCotrapCtrl'
            });
        })
        .controller('trapCotrapCtrl', function ($scope, CurrentNet) {
            $scope.$watch('analysisData', function () {
                refreshTrapsCotraps();
            });

            function refreshTrapsCotraps() {
                var petriNet = CurrentNet.getCurrentNet();
                var trapCotrapData = _.cloneDeep(_.find($scope.analysisData, 'method', 'Traps & Cotraps'));

                $scope.trapCotrapErrors = _.get(trapCotrapData, 'errors');

                var cotraps = _.get(trapCotrapData, 'cotraps');
                if (cotraps) {
                    cotraps = processPlaceSubsets(cotraps, petriNet);
                }
                $scope.cotraps = cotraps;

                var traps = _.get(trapCotrapData, 'traps');
                if (traps) {
                    traps = processPlaceSubsets(traps, petriNet);
                }
                $scope.traps = traps;
            }

            function processPlaceSubsets(subsets, petriNet) {
                var mappedSubset = _.map(subsets, function (subset) {
                    subset.places = _.sortBy(_.map(subset.placeIds, function (placeId) {
                        var place = petriNet.findPlace(placeId);
                        return {id: placeId, name: place.name};
                    }), 'name');
                    delete subset.placeIds;
                    return subset;
                });

                return _.sortBy(mappedSubset, function (subset) {
                    return subset.places.length;
                });
            }
        });
})();