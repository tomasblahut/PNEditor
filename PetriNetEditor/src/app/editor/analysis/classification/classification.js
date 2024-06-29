'use strict';

(function () {
    angular.module('Classification', [
        'SharedEditorAssets',
        'ClassificationDirectives'
    ])
        .config(function ($stateProvider) {
            $stateProvider.state('classification', {
                parent: 'model',
                url: '/classification',
                templateUrl: 'editor/analysis/classification/classification.html',
                controller: 'classificationCtrl'
            });
        })
        .controller('classificationCtrl', function ($scope, $rootScope, CurrentNet) {
            $scope.$watch('analysisData', function () {
                refreshClassification();
            });

            function refreshClassification() {
                var classificationData = _.cloneDeep(_.find($scope.analysisData, 'method', 'Classification'));

                $scope.classificationErrors = _.get(classificationData, 'errors');
                var subclasses = _.get(classificationData, 'subclassResults') || [];

                enhanceAdditionalData(subclasses);
                $scope.subclasses = subclasses;
            }

            function enhanceAdditionalData(subclassResults) {
                _.forEach(subclassResults, function (subclass) {
                    var additionalData = _.get(subclass, 'additionalData');
                    var hasAdditionalData = additionalData && !_.isEmpty(additionalData);

                    if (hasAdditionalData) {
                        switch (subclass.type) {
                            case 'Ordinary':
                            {
                                additionalData.arcViolations = enhanceArcs(additionalData.arcViolations);
                                break;
                            }
                            case 'State machine':
                            case 'Free choice':
                            {
                                additionalData.transitionViolations = enhanceTransitions(additionalData.transitionViolations);
                                break;
                            }
                            case 'Marked graph':
                            {
                                additionalData.placeViolations = enhancePlaces(additionalData.placeViolations);
                                break;
                            }
                        }
                    }
                });
            }

            function enhanceArcs(arcViolations) {
                var petriNet = CurrentNet.getCurrentNet();
                return _.map(arcViolations, function (arcViolation) {
                    var srcObject = petriNet.identifyPTObject(arcViolation.srcId);
                    var destObject = petriNet.identifyPTObject(arcViolation.destId);
                    var arc = petriNet.findArc(arcViolation.srcId, arcViolation.destId);

                    return {
                        id: arc.id,
                        srcName: _.get(srcObject, 'name'),
                        destName: _.get(destObject, 'name')
                    };
                });
            }

            function enhanceTransitions(transitionViolations) {
                var petriNet = CurrentNet.getCurrentNet();
                return _.map(transitionViolations, function (transId) {
                    var transition = petriNet.findTransition(transId);
                    return {id: transId, name: transition.name};
                });
            }

            function enhancePlaces(placeViolations) {
                var petriNet = CurrentNet.getCurrentNet();
                return _.map(placeViolations, function (placeId) {
                    var place = petriNet.findPlace(placeId);
                    return {id: placeId, name: place.name};
                });
            }
        });
})();