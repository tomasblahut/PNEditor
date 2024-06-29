'use strict';

(function () {
    angular.module('SSLayouts')
        .factory('SSDagreLayout', function (CanvasLayout) {

            function SSDagreLayout() {
            }

            var layoutPrototype = createjs.extend(SSDagreLayout, CanvasLayout);

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
                    defered.reject(error);
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
                    this._worker = new Worker('workers/layout/ssDagreLayoutWorker.js');
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

            return SSDagreLayout;
        });
})();