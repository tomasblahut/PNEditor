'use strict';

(function () {
    angular.module('SSHighlights', [])
        .service('MarkingHighlights', function () {

            var focus = {
                body: '#4F8FFF',
                border: '#00215A',
                text: '#FFFFFF'
            };
            var select = {
                body: '#77FFC7',
                border: '#005B35',
                text: '#131313'
            };

            return [
                {type: 'focus', objType: 'marking', highlightObj: focus},
                {type: 'selection', objType: 'marking', highlightObj: select}
            ];
        });
}());