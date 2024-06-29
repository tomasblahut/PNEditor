'use strict';

(function () {
    angular.module('PNProjects', [
        'Persistence',
        'PNExport',
        'MDImport'
    ])
        .service('ProjectManager', function ($mdDialog, Notification, ProjectPersister, PNExportManager) {
            this.loadUserNets = function () {
                return $mdDialog.show({
                    clickOutsideToClose: false,
                    templateUrl: 'editor/modelling/projects/userProjects.tmpl.html',
                    controller: function ($scope) {
                        $scope.refreshList = function () {
                            $scope.netList = [];
                            $scope.refreshing = true;
                            $scope.loadResult = {};

                            ProjectPersister.loadNetList().then(netListSuccess, null, netListProgress);

                            function netListSuccess(result) {
                                if (result) {
                                    $scope.loadResult = {
                                        success: result.success.join(', '),
                                        fail: result.fail.join(', ')
                                    };
                                }
                                $scope.refreshing = false;
                            }

                            function netListProgress(netEntries) {
                                $scope.netList = $scope.netList.concat(netEntries);
                            }
                        };

                        $scope.openNet = function (netEntry) {
                            ProjectPersister.loadNet(netEntry).then(netLoadSuccess, netLoadError);

                            function netLoadSuccess(netData) {
                                $mdDialog.hide(netData);
                            }

                            function netLoadError(err) {
                                Notification.error({
                                    title: 'Error while loading project',
                                    message: err ? err.toString() : 'unknown error',
                                    positionY: 'bottom', positionX: 'right',
                                    delay: 3000
                                });
                            }
                        };
                        $scope.deleteNet = function (netEntry, index) {
                            ProjectPersister.deleteNet(netEntry).then(netDeleteSuccess, netDeleteError);

                            function netDeleteSuccess() {
                                $scope.netList.splice(index, 1);
                            }

                            function netDeleteError(err) {
                                Notification.error({
                                    title: 'Error while deleting project',
                                    message: err ? err.toString() : 'unknown error',
                                    positionY: 'bottom', positionX: 'right',
                                    delay: 3000
                                });
                            }
                        };
                        $scope.importNet = function (petriNet) {
                            $mdDialog.hide(petriNet);
                        };

                        $scope.close = function () {
                            $mdDialog.cancel();
                        };

                        $scope.refreshList();
                    }
                });
            };

            this.saveUserNet = function (net) {
                $mdDialog.show({
                    clickOutsideToClose: false,
                    templateUrl: 'editor/modelling/projects/saveProject.tmpl.html',
                    locals: {net: net},
                    controller: function ($scope, net) {
                        var persistenceData = net.persistenceData;
                        $scope.newNet = typeof persistenceData === 'undefined' || typeof persistenceData.id === 'undefined';
                        $scope.persistenceOptions = ProjectPersister.getAvailableStorageTypes();

                        $scope.persistenceData = $scope.newNet ? {
                            id: StringUtils.uuid(),
                            name: 'New net',
                            storageType: $scope.persistenceOptions[0] ?
                                $scope.persistenceOptions[0].type : undefined
                        } : persistenceData;

                        $scope.save = function () {
                            $scope.saving = {
                                status: 'IN_PROGRESS',
                                msg: 'Saving project...'
                            };
                            net.persistenceData = $scope.persistenceData;

                            try {
                                ProjectPersister.saveNet(net).then(onSaveSuccess, onSaveFailed);
                            }
                            catch (err) {
                                onSaveFailed(err);
                            }

                            function onSaveSuccess() {
                                $scope.saving = {
                                    status: 'PASS',
                                    msg: 'Project saved'
                                };
                            }

                            function onSaveFailed(err) {
                                $scope.saving = {
                                    status: 'FAIL',
                                    msg: 'Error',
                                    error: err ? typeof err === 'string' ? err : err.message : 'Unknown error'
                                };

                                if ($scope.newNet) {
                                    delete net.persistenceData;
                                }
                            }
                        };

                        $scope.close = function () {
                            $mdDialog.cancel();
                        };

                        if (!$scope.newNet) {
                            $scope.save();
                        }
                    }
                });
            };

            this.exportNet = function (net) {
                $mdDialog.show({
                    clickOutsideToClose: false,
                    templateUrl: 'editor/modelling/projects/export/exportProject.tmpl.html',
                    locals: {net: net},
                    controller: function ($scope, net) {
                        $scope.exportOptions = {
                            formats: PNExportManager.getSupportedFormats()
                        };
                        $scope.exportOptions.selectedFormat = _.get($scope.exportOptions, 'formats[0]');

                        $scope.export = function () {
                            $scope.close();
                            var format = $scope.exportOptions.selectedFormat.format;
                            PNExportManager.exportNet(net, format);
                        };

                        $scope.close = function () {
                            $mdDialog.cancel();
                        };
                    }
                });
            };
        });
})();
