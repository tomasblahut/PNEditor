'use strict';

(function () {
    angular.module('StateSpace', [
        'SSVisualization',
        'SSDirectives',
        'SSSettings',
        'SharedEditorAssets'
    ])
        .config(function ($stateProvider) {
            $stateProvider
                .state('stateSpace', {
                    parent: 'model',
                    url: '/stateSpace',
                    templateUrl: 'editor/analysis/stateSpace/stateSpace.html',
                    controller: 'stateSpaceCtrl'
                });

        })
        .controller('stateSpaceCtrl', function ($scope, SSManager, SSSettingsManager, CurrentNet) {
            var stage = new createjs.Stage("ssCanvas");
            var ssManager = new SSManager(stage);

            $scope.settings = SSSettingsManager.getSettings();

            $scope.openSettingsDialog = function () {
                SSSettingsManager.showSettingsDialog().then(function (changes) {
                    ssManager.settingsChanged(changes);
                });
            };

            $scope.rebuildStateSpace = function () {
                ssManager.rebuildStateSpace();
            };
            $scope.navigateHome = function () {
                ssManager.navigateToInitialMarking();
            };

            $scope.terminate = function () {
                ssManager.interruptStateSpace();
            };

            $scope.$watch('analysisData', function () {
                var ssData = _.find($scope.analysisData, 'method', 'State space');
                $scope.ssErrors = _.get(ssData, 'errors');

                var petriNet = CurrentNet.getCurrentNet();
                var graph = _.get(ssData, 'graph');
                ssManager.initStateSpace(petriNet, graph);
            });
            $scope.$on('$destroy', function () {
                ssManager.dispose();
            });
        });
})();