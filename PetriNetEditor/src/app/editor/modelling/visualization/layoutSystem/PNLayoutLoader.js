'use strict';

(function () {
    angular.module('PNLayoutSystem', [
        'CanvasLayoutSupport',
        'PNLayouts',
        'PNLayoutCheckers'
    ])
        .factory('PNLayoutLoader', function (CanvasLayoutLoader, PNDagreLayout, PNBlindLayout, MyPNChecker) {

            function PNLayoutLoader() {
                this._registeredLayouts = [
                    {type: 'dagre', name: 'Dagre', layoutConstructor: PNDagreLayout},
                    {type: 'blind', name: 'Blind', layoutConstructor: PNBlindLayout}
                ];

                this._registeredCheckers = [
                    {type: 'petriNet', checkerConstructor: MyPNChecker}
                ];
            }

            var loaderPrototype = createjs.extend(PNLayoutLoader, CanvasLayoutLoader);
            loaderPrototype._getRegisteredLayouts = function () {
                return this._registeredLayouts;
            };
            loaderPrototype._getRegisteredLayoutsCheckers = function () {
                return this._registeredCheckers;
            };

            return PNLayoutLoader;
        });
}());