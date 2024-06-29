'use strict';

(function () {
    angular.module('PNNavigationModules', [
        'CanvasModules'
    ])
        .factory('ObjectSelector', function ($rootScope, CanvasModule) {

            var OBJECT_SELECTED_KEY = "objectSelected";
            var SELECTION_CLEARED_KEY = "selectionCleared";

            function ObjectSelector() {
                CanvasModule.call(this);
                this._decoratingModules = [];
            }

            var modulePrototype = createjs.extend(ObjectSelector, CanvasModule);

            modulePrototype.initMassSelection = function (originPoint) {
                this.clearSelection();

                this._selector = this._objectFactory.create('selector', {origin: originPoint});
                this._selector.x = originPoint.x;
                this._selector.y = originPoint.y;

                var enhancLayer = this._layerBus.getLayer('selection');
                enhancLayer.addChild(this._selector);
            };
            modulePrototype.updateMassSelection = function (curPoint) {
                if (this._selector) {
                    this._selector.updateEndpoint(curPoint);
                    var selectionRectangle = this._selector.getSelectionRect();

                    var pnConstructor = this._moduleBus.getModule('pnConstructor');
                    var objectSet = pnConstructor.findObjectsWithin(selectionRectangle);

                    if (!this._curSelection || !this._curSelection.containsIdenticalElements(objectSet)) {
                        var highlighter = this._moduleBus.getModule('highlighter');
                        if (this._highlightToken) {
                            highlighter.removeHighlight(this._highlightToken);
                        }

                        var objArray = objectSet.toArray();
                        if (objArray.length > 0) {
                            this._highlightToken = highlighter.highlightObjects({
                                highlightType: 'selection',
                                objects: objArray
                            });
                        }
                        this._curSelection = objectSet;
                    }
                    this._stageHandler.updateStage();
                }
            };
            modulePrototype.selectMultipleObjects = function (originPoint) {
                if (this._selector) {
                    var enhancLayer = this._layerBus.getLayer('selection');
                    enhancLayer.removeChild(this._selector);

                    var objects = this._curSelection && this._curSelection.toArray();
                    if (objects && objects.length > 0) {
                        if (objects.length === 1) {
                            var toSelect = objects[0];
                            this._curSelection = toSelect;
                            $rootScope.$broadcast(OBJECT_SELECTED_KEY, {object: _.cloneDeep(toSelect)});
                        }
                        this._decorateSelection(originPoint);
                    }

                    this._stageHandler.updateStage();
                }
                this._selector = undefined;
            };

            modulePrototype.selectSingleObject = function (canvasObject, pozition) {
                if (!this._checkShouldSelect(canvasObject)) {
                    return;
                }
                this.clearSelection();

                if (canvasObject) {
                    this._curSelection = canvasObject;
                    this._decorateSelection(pozition);

                    var highlighter = this._moduleBus.getModule('highlighter');
                    this._highlightToken = highlighter.highlightObjects({
                        highlightType: 'selection',
                        objects: [this._curSelection]
                    });

                    $rootScope.$broadcast(OBJECT_SELECTED_KEY, {object: _.cloneDeep(canvasObject)});
                }
                this._stageHandler.updateStage();
            };
            modulePrototype._checkShouldSelect = function (canvasObject) {
                var shouldSelect;
                if (this._curSelection && this._curSelection.type === 'pnObjectSet') {
                    var selectedObjects = this._curSelection.toArray();
                    shouldSelect = selectedObjects.indexOf(canvasObject) === -1;
                }
                else {
                    shouldSelect = this._curSelection !== canvasObject;
                }

                return shouldSelect;
            };

            modulePrototype._decorateSelection = function (initialPosition) {
                var tool = this;
                var module = this;

                var additionalArgs = initialPosition ? {initialPosition: initialPosition} : undefined;
                var decoratingModules = this._moduleBus.findAllCanDecorate(this._curSelection);
                _.forEach(decoratingModules, function (decoratingModule) {
                    decoratingModule.decorateObject(tool._curSelection, additionalArgs);
                    module._decoratingModules.push({id: decoratingModule.id, module: decoratingModule});
                });
            };

            modulePrototype.deleteObject = function (canvasObject) {
                var objectSelected = !_.isUndefined(this._curSelection);
                if (objectSelected) {
                    var setSelected = this._curSelection.type === 'pnObjectSet';
                    objectSelected = setSelected ? this._curSelection.containsElement(canvasObject)
                        : this._curSelection.id === canvasObject.id;
                }

                if (!objectSelected) {
                    this.clearSelection();
                    this._curSelection = canvasObject;
                }
                this.deleteSelection();
            };
            modulePrototype.deleteSelection = function () {
                if (this._curSelection) {
                    var deletingSet = this._curSelection.type === 'pnObjectSet';
                    var actObjects = deletingSet ? this._curSelection.toArray() : [this._curSelection];
                    var delegate = {
                        type: 'delete',
                        objects: actObjects
                    };

                    this.clearSelection();

                    var pnConstructor = this._moduleBus.getModule('pnConstructor');
                    pnConstructor.applyChanges(delegate);
                    this._stageHandler.updateStage();
                }
            };
            modulePrototype.clearSelection = function () {
                if (this._curSelection) {
                    var modules = this._moduleBus.findAllCanDecorate(this._curSelection);
                    _.forEach(modules, function (module) {
                        module.removeDecorations();
                    });

                    var highlighter = this._moduleBus.getModule('highlighter');
                    highlighter.removeHighlight(this._highlightToken);
                    this._highlightToken = undefined;

                    var guidelinesModule = this._moduleBus.getModule('guidelinesModule');
                    guidelinesModule.restoreState();

                    $rootScope.$broadcast(SELECTION_CLEARED_KEY, {});
                }
                this._curSelection = undefined;
                this._decoratingModules = [];
                this._decorationsSupressedBy = undefined;
            };

            modulePrototype.supressOtherDecorations = function (id) {
                if (this._decorationsSupressedBy) {
                    if (this._decorationsSupressedBy !== id) {
                        throw new Error('Decorations already supressed');
                    }
                    else {
                        return;
                    }
                }
                this._decorationsSupressedBy = id;

                var modulesToSupress = _.pluck(_.filter(this._decoratingModules, function (decModule) {
                    return decModule.id !== id;
                }), 'module');

                _.forEach(modulesToSupress, function (moduleToSupress) {
                    moduleToSupress.removeDecorations();
                });

                this._stageHandler.updateStage();
            };
            modulePrototype.cancelDecorationSuppression = function () {
                var selection = this._curSelection;
                var supressedBy = this._decorationsSupressedBy;

                if (supressedBy && selection) {
                    var supressedModules = _.pluck(_.filter(this._decoratingModules, function (decModule) {
                        return decModule.id !== supressedBy;
                    }), 'module');

                    _.forEach(supressedModules, function (supressedModule) {
                        supressedModule.decorateObject(selection);
                    });

                    this._stageHandler.updateStage();
                }

                this._decorationsSupressedBy = undefined;
            };

            modulePrototype.dispose = function () {
                this.clearSelection();
            };

            return ObjectSelector;
        });
}());