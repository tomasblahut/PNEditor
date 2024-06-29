'use strict';

(function () {
    angular.module('SSManipulationModules', [
        'BasicCanvasModules',
        'SSHighlights'
    ])
        .factory('SSHighlighter', function (Highlighter, MarkingHighlights, SSArcHighlights) {

            function SSHighlighter() {
                Highlighter.call(this);
            }

            var modulePrototype = createjs.extend(SSHighlighter, Highlighter);

            modulePrototype._identifyObjects = function (data) {
                var toHighlight = [];
                var identificationMethod = data.identificationMethod;

                switch (identificationMethod) {
                    default:
                    {
                        toHighlight = _.map(data.objects, function (dataObj) {
                            return {obj: dataObj};
                        });
                        break;
                    }
                }
                return toHighlight;
            };

            modulePrototype._getHighlightsData = function () {
                return _.union(MarkingHighlights, SSArcHighlights);
            };

            return SSHighlighter;
        });
}());