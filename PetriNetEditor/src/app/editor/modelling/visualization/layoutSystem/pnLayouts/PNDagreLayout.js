'use strict';

(function () {
    angular.module('PNLayouts', [
        'CanvasLayouts'
    ])
        .factory('PNDagreLayout', function (CanvasLayout) {

            function PNDagreLayout() {
            }

            var layoutPrototype = createjs.extend(PNDagreLayout, CanvasLayout);

            layoutPrototype.performLayout = function (petriNet, options, defered) {
                this._initWorker();

                var layout = this;
                layout._worker.onmessage = function (event) {
                    var pnData = event.data;
                    petriNet.loadData(pnData);

                    defered.resolve();
                    layout._disposeWorker();
                };
                layout._worker.onerror = function (error) {
                    defered.reject(error.message);
                };
                layout._worker.postMessage([petriNet.getData(), options]);
            };

            layoutPrototype.getDefaultOptions = function () {
                return {
                    nodeSep: 100,
                    rankSep: 125,
                    leftMargin: 125,
                    topMargin: 125,
                };
            };

            layoutPrototype._initWorker = function () {
                if (!this._worker) {
                    this._worker = new Worker('workers/layout/pnDagreLayoutWorker.js');
                }
            };

            layoutPrototype._disposeWorker = function () {
                if (this._worker) {
                    this._worker.terminate();
                    this._worker = undefined;
                }
            };

            layoutPrototype.interrupt = function () {
                this._disposeWorker();
            };
            layoutPrototype.dispose = function () {
                this._disposeWorker();
            };

            return PNDagreLayout;
        });
})();