'use strict';

(function () {
    angular.module('Modelling', [
        'PNProjects',
        'PNVisualization',
        'PNSettings',
        'SharedEditorAssets',
        'PNGui'
    ]).config(function ($stateProvider) {
        $stateProvider.state('model', {
            parent: 'netEditor',
            url: '/model',
            views: {
                "modelView": {
                    templateUrl: 'editor/modelling/model.html',
                    controller: 'modelCtrl'
                },
                "analysisView": {
                    templateUrl: 'editor/analysis/analysis.html',
                    controller: 'analysisCtrl'
                }
            }
        });
    })
        .controller('modelCtrl', function ($rootScope, $scope, $state, $mdToast, $mdDialog, PNManager, CurrentNet, ProjectManager,
                                           PNSettingsManager) {
            var stage = new createjs.Stage("modelCanvas");
            $scope.pnManager = new PNManager(stage, 'modelling');
            $scope.pnManager.loadNet(CurrentNet.getCurrentNet());

            $scope.$on('highlight_pn_objects', function (event, args) {
                var highlightData = _.get(args, 'highlightData');
                $scope.pnManager.highlight(highlightData);
            });
            $scope.$on('destroy', function () {
                $scope.pnManager.dispose();
            });

            $scope.createNewNet = function () {
                notifyAnalysisInvalidated();
                $scope.pnManager.loadNet(CurrentNet.initNewNet());
            };
            $scope.storeNet = function () {
                ProjectManager.saveUserNet(CurrentNet.getCurrentNet());
            };
            $scope.loadNet = function () {
                ProjectManager.loadUserNets().then(function (selectedNet) {
                    if (selectedNet) {
                        notifyAnalysisInvalidated();
                        $scope.pnManager.loadNet(CurrentNet.setCurrentNet(selectedNet));
                    }
                });
            };
            $scope.refreshNet = function () {
                $scope.pnManager.refreshNet();
            };
            
            // deletes the current net, clears the canvas, creates new memento
            $scope.deleteNet = function () {
            	notifyAnalysisInvalidated();
                $scope.pnManager.loadNet(CurrentNet.initNewNet());
                $scope.pnManager.createMemento();
            };
            
            $scope.exportNet = function () {
                ProjectManager.exportNet(CurrentNet.getCurrentNet());
            };
            $scope.layoutNet = function (layoutType) {
                PNSettingsManager.setSelectedLayout(layoutType);
                $scope.pnManager.layoutNet();
            };
            $scope.terminate = function () {
                $scope.pnManager.interrupt();
            };
            $scope.updateMode = function (newMode) {
                var modeChanged = $scope.pnManager.switchToMode(newMode);
                if (modeChanged) {
                    $scope.gui.currentMode = newMode;
                }
            };
            $scope.showAnalysisPanel = function () {
                $scope.editor.settings.analysisEnabled = true;
                $state.go('netProperties');
            };
            $scope.hideAnalysisPanel = function () {
                $scope.editor.settings.analysisEnabled = false;
                $state.go('model');
            };
            
            // return true, if undo is possible, false otherwise
            $scope.canUndo = function () {
            	return $scope.pnManager.canUndo();
            };
            // return true, if redo is possible, false otherwise
            $scope.canRedo = function () {
            	return $scope.pnManager.canRedo();
            };
            // undo the changes, loads previous version of the net
            $scope.undo = function () {
                notifyAnalysisInvalidated();
            	var net = $scope.pnManager.undo();
            	$scope.pnManager.loadNet(net);
            	CurrentNet.setCurrentNet(net);
            };
            // redo the changes, loads next version of the net
            $scope.redo = function (event) {
                notifyAnalysisInvalidated();
            	var net = $scope.pnManager.redo();
            	$scope.pnManager.loadNet(net);
            	CurrentNet.setCurrentNet(net);
            };

            function initGuiSettings() {
                $scope.gui = {
                    layouts: $scope.pnManager.getLayouts(),
                    grids: $scope.pnManager.getGrids(),
                    showGrid: true,
                    snapToGrid: true,
                    modes: [
                        {type: 'modelling', name: 'Modelling', icon: 'fa-pencil'},
                        {type: 'simulation', name: 'Simulation', icon: 'fa-play'}
                    ]
                };

                PNSettingsManager.setSelectedLayout($scope.gui.layouts[0].type);
                $scope.gui.activeGrid = $scope.gui.grids[0].type;
                $scope.pnManager.setActiveGrid($scope.gui.activeGrid);

                $scope.gui.currentMode = $scope.gui.modes[0].type;
            }

            function notifyAnalysisInvalidated() {
                $rootScope.$broadcast('analysisInvalidated', {});
            }

            initGuiSettings();
        });
})();
