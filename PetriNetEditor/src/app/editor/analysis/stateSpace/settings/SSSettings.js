'use strict';

(function () {
    angular.module('SSSettings', [])
        .service('SSSettingsManager', function ($mdDialog) {
            var service = this;

            this.getSettings = function () {
                return this._settings;
            };

            this.getExpandingSettings = function () {
                return this._settings.manualExpanding;
            };

            this.getLayoutSettings = function () {
                return this._settings.layout;
            };

            this.showSettingsDialog = function () {
                return $mdDialog.show({
                    clickOutsideToClose: false,
                    templateUrl: 'editor/analysis/stateSpace/settings/ssSettingsDialog.tmpl.html',
                    controller: function ($scope) {
                        $scope.settings = _.cloneDeep(service._settings);
                        $scope.layouts = service._availableLayouts[$scope.settings.graphType];

                        $scope.save = function () {
                            var changes = $scope._processChanges();
                            service._settings = $scope.settings;
                            $mdDialog.hide(changes);
                        };

                        $scope._processChanges = function () {
                            var changes = {};
                            if ($scope.settings.graphType !== service._settings.graphType) {
                                changes.typeChanged = true;
                            }
                            if ($scope.settings.layout.type !== service._settings.layout.type) {
                                changes.layoutChanged = true;
                            }
                            return changes;
                        };

                        $scope.updateLayoutSettings = function () {
                            $scope.layouts = service._availableLayouts[$scope.settings.graphType];
                            $scope.settings.layout.type = $scope.layouts[0].type;
                        };

                        $scope.close = function () {
                            $mdDialog.cancel();
                        };
                    }
                });
            };

            function initSettings() {
                service._settings = {
                    graphType: 'tree',
                    layout: {
                        type: 'ssTree',
                        options: {
                            nodeSep: 100,
                            rankSep: 125,
                            leftMargin: 125,
                            topMargin: 125,
                        }
                    },
                    manualExpanding: {
                        expandAll: true,
                        expandLevels: 1
                    }
                };

                service._availableLayouts = {
                    tree: [{name: 'Reingold Tilford', type: 'ssTree'}],
                    graph: [{name: 'Native hierarchical', type: 'ssNative'}, {name: 'Dagre', type: 'ssDagre'}]
                };
            }

            initSettings();
        });
}());