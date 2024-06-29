'use strict';

(function () {
    angular.module('CanvasLayoutSupport', [])
        .factory('CanvasLayoutPerformer', function ($q, $timeout, Notification) {

            var MANUALLY_TERMINATED = 'manually terminated';

            function CanvasLayoutPerformer() {
            }

            CanvasLayoutPerformer.prototype.loadLayouts = function (layoutLoader) {
                if (!layoutLoader) {
                    throw new Error('Layout loader must be specified');
                }

                this._layouts = layoutLoader.loadLayouts();
                this._checkers = layoutLoader.loadCheckers();
            };

            CanvasLayoutPerformer.prototype.performLayout = function (graph, type, options) {
                var layout = _.find(this._layouts, 'type', type);
                if (!layout) {
                    throw new Error('Requested unknown layout type: ' + type);
                }

                var layoutInstance = layout.instance;
                var actOptions = _.defaultsDeep({}, options || {}, layoutInstance.getDefaultOptions());

                var performer = this;
                performer._defered = $q.defer();

                $timeout(function () {
                    layoutInstance.performLayout(graph, actOptions, performer._defered);
                });

                return performer._defered.promise
                    .catch(function (err) {
                        var message = _.get(err, 'message');
                        if (message !== MANUALLY_TERMINATED) {
                            console.error('Error while layouting graph: ' + message);
                            Notification.error({
                                title: 'Error while layouting graph',
                                message: message || 'unknown error',
                                positionY: 'bottom', positionX: 'right',
                                delay: 3000
                            });
                        }

                        return $q.reject();
                    })
                    .finally(function () {
                        delete performer._defered;
                    });
            };

            CanvasLayoutPerformer.prototype.getLayouts = function () {
                return _.map(this._layouts, function (layout) {
                    return {type: layout.type, name: layout.name};
                });
            };

            CanvasLayoutPerformer.prototype.checkLayoutValidity = function (graph, type) {
                var checkers = _.filter(this._checkers, function (checker) {
                    return checker.type === type;
                });

                var violations = [];
                _.forEach(checkers, function (checker) {
                    var checkerInstance = checker.instance;
                    try {
                        checkerInstance.performLayoutCheck(graph);
                    } catch (err) {
                        violations.push(err.toLocaleString());
                    }
                });

                return {valid: violations.length === 0, errors: violations};
            };

            CanvasLayoutPerformer.prototype.interrupt = function () {
                if (this._defered) {
                    this._defered.reject(new Error(MANUALLY_TERMINATED));
                }

                _.invoke(this._layouts, function () {
                    this.instance.interrupt();
                });
            };

            CanvasLayoutPerformer.prototype.dispose = function () {
                _.forEach(this._layouts, function (layout) {
                    layout.instance.dispose();
                });
            };

            return CanvasLayoutPerformer;
        });
}());