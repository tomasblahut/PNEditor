'use strict';

(function () {
    angular.module('SSHighlights')
        .service('SSArcHighlights', function () {

            var focus = {
                body: '#4F8FFF',
                text: '#4F8FFF'
            };
            var select = {
                body: '#005B35',
                text: '#005B35'
            };

            return [
                {type: 'focus', objType: 'arc', highlightObj: focus},
                {type: 'selection', objType: 'arc', highlightObj: select}
            ];
        });
}());