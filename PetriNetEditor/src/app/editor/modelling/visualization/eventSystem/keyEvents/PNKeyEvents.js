'use strict';

(function () {
    angular.module('PNKeyEvents', [
        'CanvasEvents'
    ])
        .service('PNKeyEvents', function (KeyEvent) {
            return [
                {type: 'key_del', eventConstructor: KeyEvent}
            ];
        });
}());