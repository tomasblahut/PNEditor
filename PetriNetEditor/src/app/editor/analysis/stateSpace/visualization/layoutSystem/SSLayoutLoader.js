'use strict';

(function () {
    angular.module('SSLayoutSystem', [
        'CanvasLayoutSupport',
        'SSLayouts'
    ])
        .factory('SSLayoutLoader', function (CanvasLayoutLoader, SSTreeLayout, SSDagreLayout, SSNativeLayout) {

            function SSLayoutLoader() {
                this._registeredLayouts = [
                    {type: 'ssTree', layoutConstructor: SSTreeLayout},
                    {type: 'ssDagre', layoutConstructor: SSDagreLayout},
                    {type: 'ssNative', layoutConstructor: SSNativeLayout}
                ];
            }

            var loaderPrototype = createjs.extend(SSLayoutLoader, CanvasLayoutLoader);
            loaderPrototype._getRegisteredLayouts = function () {
                return this._registeredLayouts;
            };
            loaderPrototype._getRegisteredLayoutsCheckers = function () {
                return [];
            };

            return SSLayoutLoader;
        });
}());