'use strict';

(function () {
    angular.module('Invariant', [
        'SharedEditorAssets',
        'InvDirectives'
    ])
        .config(function ($stateProvider) {
            $stateProvider.state('invariant', {
                parent: 'model',
                url: '/invariant',
                templateUrl: 'editor/analysis/invariant/invariant.html',
                controller: 'invariantCtrl'
            });
        })
        .controller('invariantCtrl', function ($scope, $rootScope, CurrentNet) {
            $scope.$watch('analysisData', function () {
                refreshInvariants();
            });

            function refreshInvariants() {
                var petriNet = CurrentNet.getCurrentNet();
                var invariantData = _.cloneDeep(_.find($scope.analysisData, 'method', 'Invariant'));

                $scope.invErrors = _.get(invariantData, 'errors');

                var pInvs = _.get(invariantData, 'pInvariants');
                if (pInvs) {
                    _.forEach(pInvs, function (pInv) {
                        _.invoke(pInv.struct, function () {
                            var place = petriNet.findPlace(this.id);
                            this.name = place.name;
                        });
                        pInv.struct = _.sortBy(pInv.struct, 'name');
                    });
                }
                $scope.pInvariants = pInvs;

                var tInvs = _.get(invariantData, 'tInvariants');
                if (tInvs) {
                    _.forEach(tInvs, function (tInv) {
                        _.invoke(tInv.struct, function () {
                            var transition = petriNet.findTransition(this.id);
                            this.name = transition.name;
                        });
                        tInv.struct = _.sortBy(tInv.struct, 'name');

                        if (tInv.system.length > 0) {
                            tInv.system = _.map(tInv.system, function (sysInv) {
                                return _.map(sysInv, function (invItem) {
                                    var transition = petriNet.findTransition(invItem);
                                    return {
                                        id: invItem,
                                        name: transition.name
                                    };
                                });
                            });
                        }
                    });
                }
                $scope.tInvariants = tInvs;
            }
        });
})();