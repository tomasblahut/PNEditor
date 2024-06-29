'use strict';

(function () {
    angular.module('PNExport', [
        'PNExporterImpls'
    ])
        .service('PNExportManager', function (Notification, FileSaver, Blob, NativeExporter, PNMLExporter, TikZExporter) {

            var exporters = [
                {format: 'native', name: 'Native format', instance: new NativeExporter()},
                {format: 'pnml', name: 'PNML', instance: new PNMLExporter()},
                {format: 'tiky', name: 'TikZ', instance: new TikZExporter()}
            ];

            this.exportNet = function (petriNet, format) {
                try {
                    var exporter = _.find(exporters, 'format', format);
                    if (!exporter) {
                        throw new Error('Exporting to format ' + format + ' is not supported');
                    }

                    var netData = exporter.instance.prepareNetData(petriNet);
                    var data = new Blob([netData], {type: 'text/plain;charset=utf-8'});

                    var fileName = 'export-' + moment().format('DDMMYYYY-HHmm') + '.' + exporter.instance.getFileExtension();
                    FileSaver.saveAs(data, fileName);
                }
                catch (err) {
                    Notification.error({
                        title: 'Export error',
                        message: err.toString(),
                        positionY: 'bottom', positionX: 'left',
                        delay: 3000
                    });
                    console.error('Error while exporting Petri net: ' + err);
                }
            };

            this.getSupportedFormats = function () {
                return _.map(exporters, function (exporter) {
                    return {format: exporter.format, name: exporter.name};
                });
            };
        });
})();
