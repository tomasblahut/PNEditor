'use strict';

(function () {
    angular.module('PNExporterImpls', [
        'PNExporters'
    ])
        .factory('NativeExporter', function (PNExporter) {

            function NativeExporter() {
            }

            var exporterPrototype = createjs.extend(NativeExporter, PNExporter);
            exporterPrototype.prepareNetData = function (petriNet) {
                return JSON.stringify(petriNet);
            };
            exporterPrototype.getFileExtension = function () {
                return 'npn';
            };

            return NativeExporter;
        });
})();