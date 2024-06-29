'use strict';

(function () {
    angular.module('Persistence', [
        'NetPersisterImpls'
    ])
        .service('ProjectPersister', function ($q, LocalStoragePersister, RemoteStoragePersister) {

            var persisters = [
                {type: 'LocalStorage', guiName: 'Web browser', instance: new LocalStoragePersister()},
                {type: 'RemoteStorage', guiName: 'Server storage', instance: new RemoteStoragePersister()}
            ];

            this.loadNetList = function () {
                var defered = $q.defer();

                var failedPersisters = [];
                var successPersisters = [];
                var promises = [];

                _.forEach(persisters, function (persister) {
                    var promise = persister.instance.loadNetList();
                    promises.push(promise);
                    promise.then(
                        function (netEntries) {
                            netEntries = _.map(netEntries, function (netEntry) {
                                netEntry.storageTypeGui = persister.guiName;
                                netEntry.storageType = persister.type;
                                return netEntry;
                            });
                            defered.notify(netEntries);
                            successPersisters.push(persister.guiName);
                        },
                        function (err) {
                            failedPersisters.push(persister.guiName);
                        }
                    );
                });

                $q.all(promises).finally(function () {
                    defered.resolve({success: successPersisters, fail: failedPersisters});
                });

                return defered.promise;
            };

            this.loadNet = function (netEntry) {
                var actPersister = _.find(persisters, function (persister) {
                    return persister.type === netEntry.storageType;
                });

                if (actPersister) {
                    var defered = $q.defer();
                    actPersister.instance.loadNet(netEntry.id).then(loadSuccess, loadError);
                    return defered.promise;
                }
                else {
                    throw new Error('No persister found for type ' + netEntry.storageType);
                }

                function loadSuccess(netData) {
                    var persistenceData = netData.persistenceData;
                    persistenceData.storageType = actPersister.type;
                    defered.resolve(netData);
                }

                function loadError(err) {
                    defered.reject(err);
                }
            };

            this.saveNet = function (net) {
                var actPersister = _.find(persisters, function (persister) {
                    return persister.type === net.persistenceData.storageType;
                });

                if (actPersister) {
                    return actPersister.instance.saveNet(net);
                }
                else {
                    throw new Error('No persister found for type ' + net.persistenceData.storageType);
                }
            };

            this.deleteNet = function (netEntry) {
                var actPersister = _.find(persisters, function (persister) {
                    return persister.type === netEntry.storageType;
                });

                if (actPersister) {
                    return actPersister.instance.deleteNet(netEntry.id);
                }
                else {
                    throw new Error('No persister found for type ' + netEntry.storageType);
                }
            };

            this.getAvailableStorageTypes = function () {
                return _.map(persisters, function (persister) {
                    return {type: persister.type, guiName: persister.guiName};
                });
            };
        });
})();
