'use strict';

(function () {
    angular.module('NetPersisterImpls', [
        'NetPersisters'
    ])
        .factory('LocalStoragePersister', function ($q, $timeout, NetPersister) {

            var netKeys = 'NET_KEYS';

            function LocalStoragePersister() {
                this.netEntries = _.indexBy(JSON.parse(localStorage.getItem(netKeys)) || {}, 'id');
            }

            var persisterPrototype = createjs.extend(LocalStoragePersister, NetPersister);

            persisterPrototype.loadNetList = function () {
                var defered = $q.defer();
                var persister = this;

                $timeout(function () {
                    try {
                        defered.resolve(_.values(persister.netEntries));
                    }
                    catch (err) {
                        defered.reject(err);
                    }
                });

                return defered.promise;
            };

            persisterPrototype.loadNet = function (netId) {
                var defered = $q.defer();

                try {
                    var netData = JSON.parse(localStorage.getItem(netId));
                    if (netData) {
                        netData.persistenceData = _.clone(this.netEntries[netId]);
                        defered.resolve(netData);
                    }
                    else {
                        throw new Error('Unable to load net ' + netId);
                    }
                }
                catch (err) {
                    defered.reject(err);
                }

                return defered.promise;
            };

            persisterPrototype.saveNet = function (net) {
                var defered = $q.defer();

                try {
                    var persistenceData = _.cloneDeep(net.persistenceData);
                    persistenceData.lastUpdate = moment().format('DD.MM.YYYY HH:MM');
                    delete persistenceData.storageType;

                    this.netEntries[persistenceData.id] = persistenceData;
                    localStorage.setItem(persistenceData.id, JSON.stringify(net));
                    localStorage.setItem(netKeys, JSON.stringify(_.values(this.netEntries)));
                    defered.resolve('Net saved');
                }
                catch (err) {
                    defered.reject(err);
                }

                return defered.promise;

            };

            persisterPrototype.deleteNet = function (netId) {
                var defered = $q.defer();

                try {
                    delete this.netEntries[netId];
                    localStorage.removeItem(netId);
                    localStorage.setItem(netKeys, JSON.stringify(this.netEntries));
                    defered.resolve('Net deleted');
                }
                catch (err) {
                    defered.reject(err);
                }

                return defered.promise;
            };

            return LocalStoragePersister;
        });
})();