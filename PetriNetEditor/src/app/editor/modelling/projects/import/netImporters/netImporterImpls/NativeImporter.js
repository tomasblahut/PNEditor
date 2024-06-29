'use strict';

(function () {
    angular.module('PNImporterImpls', [
        'PNImporters'
    ])
        .factory('NativeImporter', function (PNImporter) {

            function NativeImporter() {
            }

            var importerPrototype = createjs.extend(NativeImporter, PNImporter);
            importerPrototype.canImportFile = function (netData) {
                try {
                    var jsonData = JSON.parse(netData);

                    var places = jsonData.places;
                    if (!places) {
                        throw new Error('Unable to find places');
                    }

                    var transitions = jsonData.transitions;
                    if (!transitions) {
                        throw new Error('Unable to find transitions');
                    }

                    var arcs = jsonData.arcs;
                    if (!arcs) {
                        throw new Error('Unable to find arcs');
                    }

                    return true;
                } catch (err) {
                    return false;
                }
            };
            importerPrototype.parsePetriNet = function (netData) {
                var jsonData = JSON.parse(netData);
                return new PNBusiness.PetriNet(jsonData);
            };

            return NativeImporter;
        });
})();