'use strict';

(function () {
    angular.module('SSLayouts', [
        'CanvasLayouts',
        'BasicCanvasLayouts'
    ])
        .factory('SSTreeLayout', function (CanvasLayout) {

            function SSTreeLayout() {
            }

            var layoutPrototype = createjs.extend(SSTreeLayout, CanvasLayout);

            layoutPrototype.performLayout = function (graph, options, defered) {
                this._initWorker();

                var layout = this;
                layout._worker.onmessage = function (event) {
                    var graphData = event.data;
                    graph.loadData(graphData);

                    defered.resolve();
                    layout._disposeWorker();
                };
                layout._worker.onerror = function (error) {
                    defered.reject(error.message);
                };
                layout._worker.postMessage([graph, options]);
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
                    this._worker = new Worker('workers/layout/ssTreeLayoutWorker.js');
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

            return SSTreeLayout;
        });
})();