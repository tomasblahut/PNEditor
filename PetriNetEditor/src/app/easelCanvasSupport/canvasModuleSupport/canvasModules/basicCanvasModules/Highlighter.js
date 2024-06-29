'use strict';

(function () {
    angular.module('BasicCanvasModules', [
        'CanvasModules'
    ])
        .factory('Highlighter', function (CanvasModule) {

            function Highlighter() {
                CanvasModule.call(this);
            }

            var modulePrototype = createjs.extend(Highlighter, CanvasModule);
            modulePrototype._doInit = function () {
                this._activeHighlights = [];
                this._highlighGuiData = new CollectionUtils.Table();

                var module = this;
                _.forEach(this._getHighlightsData(), function (highlighInfo) {
                    module._highlighGuiData.put(highlighInfo.type, highlighInfo.objType, highlighInfo.highlightObj);
                });
            };

            modulePrototype.highlightObjects = function (data, skipStageUpdate) {
                var toHighlight = this._identifyObjects(data);

                var uuid = StringUtils.uuid();
                var module = this;

                _.forEach(toHighlight, function (objToHighlight) {
                    var guiObj = objToHighlight.obj;
                    var highlightType = objToHighlight.highlightType || data.highlightType;

                    var highlighGui = module._highlighGuiData.get(highlightType, guiObj.type);
                    if (!highlighGui) {
                        throw new Error('Highlighting ' + guiObj.type + ' as ' + highlightType + ' is not supported');
                    }

                    var highglightData = {
                        uuid: uuid,
                        gui: highlighGui,
                        data: objToHighlight.data
                    };
                    guiObj.setHighlight(highglightData);

                    var activeHighlight = _.find(module._activeHighlights, function (activeHighlight) {
                        return activeHighlight.obj === guiObj;
                    });
                    if (!activeHighlight) {
                        activeHighlight = {obj: guiObj, highlights: []};
                        module._activeHighlights.push(activeHighlight);
                    }

                    activeHighlight.highlights.push(highglightData);
                });

                if (!skipStageUpdate) {
                    this._stageHandler.updateStage();
                }
                return uuid;
            };

            modulePrototype.removeHighlight = function (uuid, skipStageUpdate) {
                var module = this;
                var highlighsCopy = _.clone(this._activeHighlights);

                _.forEach(highlighsCopy, function (activeHighlight) {
                    var concHighlights = activeHighlight.highlights;
                    var uuidHighlight = _.find(concHighlights, function (curHighlight) {
                        return curHighlight.uuid === uuid;
                    });

                    if (uuidHighlight) {
                        var guiObj = activeHighlight.obj;
                        var index = concHighlights.indexOf(uuidHighlight);
                        concHighlights.splice(index, 1);

                        var newHighlight = concHighlights[concHighlights.length - 1];
                        guiObj.setHighlight(newHighlight);
                        if (!newHighlight) {
                            var actHIndex = module._activeHighlights.indexOf(activeHighlight);
                            module._activeHighlights.splice(actHIndex, 1);
                        }
                    }
                });

                if (!skipStageUpdate) {
                    this._stageHandler.updateStage();
                }
            };
            modulePrototype.clearHighlight = function () {
                _.forEach(this._activeHighlights, function (activeHighlight) {
                    var guiObj = activeHighlight.obj;
                    guiObj.setHighlight(undefined);
                });
                this._activeHighlights = [];
                this._stageHandler.updateStage();
            };

            modulePrototype._identifyObjects = function (type, objects) {
                throw  new Error('Method _doHighlightObjects not implemented');
            };

            modulePrototype._getHighlightsData = function () {
                throw new Error('Method getHighlightData not implemented');
            };

            return Highlighter;
        });
}());