'use strict';

(function () {
    angular.module('PNHighlights')
        .service('PNHelperHighlights', function () {

            var connection = {
                body: '#F5461D'
            };


            return [
                {type: 'connection', objType: 'magnet', highlightObj: connection}
            ];
        });
}());