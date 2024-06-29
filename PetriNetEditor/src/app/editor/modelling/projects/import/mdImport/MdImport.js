'use strict';

(function () {
    angular.module('MDImport', [
        'PNImport'
    ])
        .directive('mdImport', function (PNImportManager) {
            return {
                replace: true,
                restrict: 'E',
                scope: {
                    onNetImported: '&'
                },
                link: function (scope, element) {
                    var input = element[0].querySelector('#fileInput');
                    var button = element[0].querySelector('#uploadButton');

                    function abortReader() {
                        if (scope.reader) {
                            scope.reader.abort();
                            delete scope.reader;
                        }
                    }

                    function parsePetriNet(netData) {
                        scope.importing = true;
                        PNImportManager.importNet(netData).then(
                            function (petriNet) {
                                scope.importing = false;
                                scope.onNetImported({petriNet: petriNet});
                            },
                            function (err) {
                                scope.importing = false;
                                scope.errMsg = 'Import error' + (err && err.message ? ': ' + err.message : '');
                                console.error('Error while importing Petri net: ' + scope.errMsg);
                            }
                        );
                    }

                    function onSelectedFileChanged(changeEvent) {
                        try {
                            var files = changeEvent.target.files;
                            var file = files[0];

                            if (file) {
                                abortReader();

                                scope.reader = new FileReader();
                                scope.reader.onload = function (onLoadEvent) {
                                    var netData = onLoadEvent.target.result;
                                    parsePetriNet(netData);
                                };
                                scope.reader.onerror = function (onErrorEvent) {
                                    scope.errMsg = 'Error: ' + onErrorEvent.target.error.message;
                                };
                                scope.reader.readAsText(file);
                            }

                            input.val(null);
                        } catch (err) {
                            scope.errMsg = 'Import error' + (err && err.message ? ': ' + err.message : '');
                        }
                    }

                    if (input && button) {
                        button.onclick = function () {
                            input.click();
                        };
                        input.onchange = onSelectedFileChanged;
                    }

                    scope.importing = false;
                    scope.$on('$destroy', function () {
                        abortReader();
                    });
                },
                templateUrl: 'editor/modelling/projects/import/mdImport/mdImport.tmpl.html'
            };
        });
}());