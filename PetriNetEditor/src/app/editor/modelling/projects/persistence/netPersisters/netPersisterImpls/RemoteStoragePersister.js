'use strict';

(function () {
    angular.module('NetPersisterImpls')
        .factory('RemoteStoragePersister', function ($q, $timeout, $http, StorageConfig, NetPersister) {

            function RemoteStoragePersister() {

            }

            var persisterPrototype = createjs.extend(RemoteStoragePersister, NetPersister);

            persisterPrototype.loadNetList = function () {
                var defered = $q.defer();

                var address = StorageConfig.serverAddress + StorageConfig.resourceURI + StorageConfig.resources.projectList;
                $http.get(address, {timeout: StorageConfig.timeout})
                    .then(listDownloadSuccess, listDownloadError);

                function listDownloadSuccess(response) {
                    var list = response.data;
                    var netEntries = _.map(list, function (netEntry) {
                        return {
                            id: netEntry.guid,
                            name: netEntry.name,
                            lastUpdate: netEntry.lastUpdate
                        };
                    });

                    defered.resolve(netEntries);
                }

                function listDownloadError(response) {
                    defered.reject(response.data);
                }

                return defered.promise;
            };

            persisterPrototype.loadNet = function (netId) {
                var defered = $q.defer();
                var params = {projectGUID: netId};

                var address = StorageConfig.serverAddress + StorageConfig.resourceURI + StorageConfig.resources.project;
                $http.get(address, {timeout: StorageConfig.timeout, params: params})
                    .then(netDownloadSuccess, netDownloadError);

                function netDownloadSuccess(response) {
                    var data = response.data;
                    var netData = JSON.parse(data.netData);
                    netData.persistenceData = {
                        id: data.guid,
                        name: data.name,
                        lastUpdate: data.lastUpdate
                    };
                    defered.resolve(netData);
                }

                function netDownloadError(response) {
                    defered.reject(response.data);
                }

                return defered.promise;
            };

            persisterPrototype.saveNet = function (net) {
                var defered = $q.defer();

                var persistenceData = _.clone(net.persistenceData);
                delete persistenceData.persistenceData;

                var data = {
                    guid: persistenceData.id,
                    name: persistenceData.name,
                    netData: JSON.stringify(net)
                };

                var address = StorageConfig.serverAddress + StorageConfig.resourceURI + StorageConfig.resources.save;
                $http.post(address, JSON.stringify(data), {timeout: StorageConfig.timeout})
                    .then(saveSuccess, saveError);

                function saveSuccess(response) {
                    defered.resolve('Net saved');
                }

                function saveError(response) {
                    defered.reject(response.data);
                }

                return defered.promise;
            };

            persisterPrototype.deleteNet = function (netId) {
                var defered = $q.defer();

                var address = StorageConfig.serverAddress + StorageConfig.resourceURI + StorageConfig.resources.delete;
                $http.post(address, netId, {timeout: StorageConfig.timeout})
                    .then(netDeleteSuccess, netDeleteError);

                function netDeleteSuccess(response) {
                    defered.resolve('Net deleted');
                }

                function netDeleteError(response) {
                    defered.reject(response.data);
                }

                return defered.promise;
            };

            return RemoteStoragePersister;
        });
})
();