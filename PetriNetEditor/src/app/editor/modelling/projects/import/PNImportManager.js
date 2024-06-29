'use strict';

(function () {
    angular.module('PNImport', [
        'PNImporterImpls'
    ])
        .service('PNImportManager', function ($q, $timeout, NativeImporter, PNMLImporter) {

            var importers = [
                {type: 'native', instance: new NativeImporter()},
                {type: 'pnml', instance: new PNMLImporter()}
            ];

            this.importNet = function (netData) {
                var deferred = $q.defer();

                $timeout(function () {
                    try {
                        var actImporter;
                        _.forEach(importers, function (importer) {
                            var importerInstance = importer.instance;
                            if (importerInstance.canImportFile(netData)) {
                                actImporter = importer;
                                return false;
                            }
                        });

                        if (actImporter) {
                            var petriNet = actImporter.instance.parsePetriNet(netData);
                            petriNet.persistenceData = {imported: true};
                            deferred.resolve(petriNet);
                        } else {
                            throw new Error('No adequate importer found');
                        }
                    } catch (err) {
                        deferred.reject(err);
                    }
                });
                return deferred.promise;
            };
        });
})();
