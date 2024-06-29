'use strict';

(function () {
    angular.module('SSLayouts')
        .factory('SSNativeLayout', function (CanvasLayout) {

            function SSNativeLayout() {
            }

            var layoutPrototype = createjs.extend(SSNativeLayout, CanvasLayout);

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
                    leftMargin: 100,
                    topMargin: 100,
                    nodeSep: 100,
                    rankSep: 125
                };
            };

            layoutPrototype._initWorker = function () {
                this._disposeWorker();
                this._worker = new Worker('workers/layout/nativeSSGraphLayoutWorker.js');
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

            return SSNativeLayout;
        });
}());