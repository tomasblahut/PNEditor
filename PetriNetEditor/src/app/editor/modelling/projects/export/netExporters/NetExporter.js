'use strict';

(function () {
    angular.module('PNExporters', [])
        .factory('PNExporter', function () {

            function PNExporter() {
            }

            PNExporter.prototype.prepareNetData = function (petriNet) {
                throw new Error('Method prepareNetData not implemented');
            };

            PNExporter.prototype.getFileExtension = function () {
                throw new Error('Method getFileExtension not implemented');
            };

            return PNExporter;
        });
})();