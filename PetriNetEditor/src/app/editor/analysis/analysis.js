'use strict';

(function () {
    angular.module('Analysis', [
        'ui.router',
        'AnalysisDirectives',
        'NetProperties',
        'Classification',
        'StateSpace',
        'Invariant',
        'TrapCotrap',
        'Cycles',
        'AnalysisSettings'
    ])
        .controller('analysisCtrl', function ($rootScope, $scope, $state, $http, AnalysisConfig, Notification, CurrentNet, AnalysisSettings) {
            $scope.guiData = {};
            $scope.analysisData = [];
            $scope.netProperties = [];

            $scope.refresh = function () {
                if ($scope.guiData.refreshing) {
                    return;
                }

                clear();
                refreshAnalysisTabs();
                
                var prefLength = AnalysisSettings.getReachabilityPreferences().length || Object.keys(AnalysisSettings.getReachabilityPreferences()).length;
                var currentPlaces = CurrentNet.getCurrentNet().places();
                
                if (prefLength === 0 || prefLength != currentPlaces.length) {
                	AnalysisSettings.initReachabilityPreferences();
                } else {
                	var prefs = AnalysisSettings.getReachabilityPreferences();
                	for (var place in currentPlaces) {
                		if (!prefs.hasOwnProperty(currentPlaces[place].id)) {
                			AnalysisSettings.initReachabilityPreferences();
                			break;
                		}
                	}
                }

                var petriNet = CurrentNet.getCurrentNet();
                if (petriNet) {
                    $scope.guiData.refreshing = true;
                    var data = {
                        petriNet: petriNet,
                        propertiesToCheck: AnalysisSettings.getSelectedProperties(),
                        analysisMethods: AnalysisSettings.getSelectedAnalysisMethods(),
                        reachabilityPreferences: AnalysisSettings.getReachabilityPreferences()
                    };

                    var address = AnalysisConfig.serverAddress + AnalysisConfig.resourceURI + AnalysisConfig.resources.analyzeNet;
                    $http.post(address, JSON.stringify(data), {timeout: AnalysisConfig.timeout})
                        .then(function (response) {
                            $scope.guiData.refreshing = false;
                            var data = response.data;
                            $scope.analysisData = _.get(data, 'analysisResults') || [];
                            $scope.netProperties = _.get(data, 'netProperties') || [];
                        },
                        function (response) {
                            Notification.error({
                                title: 'Communication error',
                                message: 'Error while contacting analysis server. ' +
                                (response.data ? '. ' + response.data : 'Unknown error') + '.<br/> Response status: ' + response.status,
                                positionY: 'bottom', positionX: 'right',
                                delay: 3000
                            });
                            $scope.guiData.refreshing = false;
                        });
                }
            };
            $scope.showSettingsDialog = function () {
                AnalysisSettings.showSettingsDialog();
            };

            $scope.$on('analysisInvalidated', function () {
                clear();
            });

            $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
                var stateFromName = fromState.name;
                var toStateName = toState.name;

                if (stateFromName === 'model' && toStateName === 'netProperties') {
                    $scope.refresh();
                }
            });

            var analysisTabsMap = {
                classification: {name: 'Classification', type: 'classification', link: 'classification'},
                invariant: {name: 'Invariant', type: 'invariant', link: 'invariant'},
                stateSpace: {name: 'State space', type: 'stateSpace', link: 'stateSpace'},
                trapCotrap: {name: 'Traps & Cotraps', type: 'trapCotrap', link: 'trapCotrap'},
                cycles: {name: 'Cycles', type: 'cycles', link: 'cycles'}
            };

            function refreshAnalysisTabs() {
                var analysisMethods = AnalysisSettings.getSelectedAnalysisMethods();
                var currentTabs = _.get($scope.guiData, 'analysisTabs');
                var selectedTabIndex = _.get($scope.guiData, 'currentTab') - 1;
                var currentTab = currentTabs && _.isNumber(selectedTabIndex) ? currentTabs[selectedTabIndex] : undefined;

                $scope.guiData.analysisTabs = _.sortBy(_.map(analysisMethods, function (method) {
                    return analysisTabsMap[method.type];
                }), 'type');

                if (currentTab) {
                    var tabToReselect = _.find($scope.guiData.analysisTabs, 'type', currentTab.type);
                    if (!tabToReselect) {
                        $scope.guiData.currentTab = 0;
                        $state.go('netProperties');
                    }
                }
            }

            function clear() {
                $scope.analysisData = [];
                $scope.netProperties = [];
            }

            refreshAnalysisTabs();
        });
})();
