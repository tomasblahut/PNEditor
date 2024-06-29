'use strict';

(function () {
    angular.module('PNImporters', [])
        .factory('PNImporter', function () {

            function PNImporter() {
            }

            PNImporter.prototype.canImportFile = function (netData) {
                throw new Error('Method canImportFile not implemented');
            };

            PNImporter.prototype.parsePetriNet = function (netData) {
                throw new Error('Method parsePetriNet not implemented');
            };

            return PNImporter;
        });
})();