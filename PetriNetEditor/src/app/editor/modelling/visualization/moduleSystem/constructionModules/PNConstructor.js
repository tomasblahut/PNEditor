'use strict';

(function () {
    angular.module('PNConstructionModules')
        .factory('PNConstructor', function ($q, $timeout, Notification, spinnerService, CanvasModule, 
        		PNSettingsManager, PNObjectSet, NetState) {

            var MANUALLY_TERMINATED = 'manually terminated';

            function PNConstructor() {
                CanvasModule.call(this);
            }

            var modulePrototype = createjs.extend(PNConstructor, CanvasModule);

            modulePrototype.loadNet = function (petriNet) {
                this._petriNet = petriNet;
                this.clearNet();

                if (this._petriNet && !this._petriNet.isEmpty()) {
                    if (!this._checkLayout()) {
                        return this.applyLayout();
                    }
                    else {
                        return this._redrawNet();
                    }
                }
                else {
                    return $q.resolve();
                }
            };
            modulePrototype.refreshNet = function () {
                return this.loadNet(this._petriNet);
            };
            modulePrototype._redrawNet = function () {
                var module = this;
                module._initModal();
                module._interrupted = false;

                return this._redrawPlaces()
                    .then(function (canvasObjects) {
                        return module._redrawTransitions(canvasObjects);
                    })
                    .then(function (canvasObjects) {
                        return module._redrawArcs(canvasObjects);
                    })
                    .catch(function (err) {
                        var message = _.get(err, 'message');
                        if (message !== MANUALLY_TERMINATED) {
                            console.error('Error while redrawing Petri net: ' + err);
                            Notification.error({
                                title: 'Error while redrawing Petri net',
                                message: err ? err.toString() : 'unknown error',
                                positionY: 'bottom', positionX: 'left',
                                delay: 3000
                            });
                        }
                        return $q.reject();
                    })
                    .finally(function () {
                        module._stageHandler.updateStage();
                        module._disposeModal();
                    });
            };
            modulePrototype.clearNet = function () {
                var netLayer = this._layerBus.getLayer('net');
                netLayer.clearContent();
            };
            modulePrototype.interrupt = function () {
                this._interrupted = true;
                this.clearNet();
                this._stageHandler.updateStage();

                this._disposeModal();
            };

            modulePrototype._redrawPlaces = function () {
                var defered = $q.defer();

                var placeCount = this._petriNet.places().length;
                var indexFrom = 0;
                var batchSteps = 100;
                var canvasObjects = {};
                var module = this;

                startPlacesIteration(100);

                function startPlacesIteration(delay) {
                    $timeout(placeIterationLogic, delay || 0, false).then(placeIterationFinished, placeIterationError);
                }

                function placeIterationLogic() {
                    if (module._interrupted) {
                        throw new Error(MANUALLY_TERMINATED);
                    }

                    var indexTo = indexFrom + batchSteps >= placeCount ? indexFrom + (placeCount - indexFrom) : indexFrom + batchSteps;
                    var placeIdMap = module._drawPlacePortion(indexFrom, indexTo);
                    canvasObjects = _.merge(canvasObjects, placeIdMap);
                    indexFrom = indexTo;
                    return indexTo === placeCount;
                }

                function placeIterationFinished(done) {
                    if (done) {
                        defered.resolve(canvasObjects);
                    }
                    else {
                        startPlacesIteration();
                    }
                }

                function placeIterationError(err) {
                    defered.reject(err);
                }

                return defered.promise;
            };
            modulePrototype._drawPlacePortion = function (indexFrom, indexTo) {
                var netLayer = this._layerBus.getLayer('net');
                var places = this._petriNet.places();
                var placeIdMap = {};

                for (var index = indexFrom; index < indexTo; index++) {
                    var pnPlace = places[index];

                    var canvasPlace = netLayer.findPTObject(pnPlace, 'place');
                    if (!canvasPlace) {
                        canvasPlace = this._createCanvasPlace(pnPlace);
                        netLayer.addPlace(canvasPlace);
                    }
                    placeIdMap[canvasPlace.id] = canvasPlace;
                    canvasPlace.applyChanges(pnPlace);
                }

                return placeIdMap;
            };
            modulePrototype._createCanvasPlace = function (pnPlace) {
                var canvasPlace = this._objectFactory.create('place', pnPlace);
                canvasPlace.x = pnPlace.position.x;
                canvasPlace.y = pnPlace.position.y;
                return canvasPlace;
            };

            modulePrototype._redrawTransitions = function (canvasObjects) {
                var defered = $q.defer();

                var transCount = this._petriNet.transitions().length;
                var indexFrom = 0;
                var batchSteps = 100;
                var module = this;

                startTransitionIteration(100);

                function startTransitionIteration(delay) {
                    $timeout(transitionIterationLogic, delay || 0, false).then(transitionIterationFinished, transitionIterationError);
                }

                function transitionIterationLogic() {
                    if (module._interrupted) {
                        throw new Error(MANUALLY_TERMINATED);
                    }

                    var indexTo = indexFrom + batchSteps >= transCount ? indexFrom + (transCount - indexFrom) : indexFrom + batchSteps;
                    var transIdMap = module._drawTransitionPortion(indexFrom, indexTo);
                    canvasObjects = _.merge(canvasObjects, transIdMap);
                    indexFrom = indexTo;
                    return indexTo === transCount;
                }

                function transitionIterationFinished(done) {
                    if (done) {
                        defered.resolve(canvasObjects);
                    }
                    else {
                        startTransitionIteration();
                    }
                }

                function transitionIterationError(err) {
                    defered.reject(err);
                }

                return defered.promise;
            };
            modulePrototype._drawTransitionPortion = function (indexFrom, indexTo) {
                var netLayer = this._layerBus.getLayer('net');
                var transitions = this._petriNet.transitions();
                var transIdMap = {};

                for (var index = indexFrom; index < indexTo; index++) {
                    var pnTransition = transitions[index];

                    var canvasTransition = netLayer.findPTObject(pnTransition, 'transition');
                    if (!canvasTransition) {
                        canvasTransition = this._createCanvasTransition(pnTransition);
                        netLayer.addTransition(canvasTransition);
                    }
                    else {
                        canvasTransition.applyChanges(pnTransition);
                    }
                    transIdMap[canvasTransition.id] = canvasTransition;
                }

                return transIdMap;
            };
            modulePrototype._createCanvasTransition = function (pnTransition) {
                var canvasTransition = this._objectFactory.create('transition', pnTransition);
                canvasTransition.x = pnTransition.position.x;
                canvasTransition.y = pnTransition.position.y;
                return canvasTransition;
            };

            modulePrototype._redrawArcs = function (canvasObjects) {
                var defered = $q.defer();

                var arcsCount = this._petriNet.arcs().length;
                var indexFrom = 0;
                var batchSteps = 100;
                var module = this;

                startArcsInteration(100);

                function startArcsInteration(delay) {
                    $timeout(arcsInterationLogic, delay || 0, false).then(arcsIterationFinished, arcsIterationError);
                }

                function arcsInterationLogic() {
                    if (module._interrupted) {
                        throw new Error(MANUALLY_TERMINATED);
                    }

                    var indexTo = indexFrom + batchSteps >= arcsCount ? indexFrom + (arcsCount - indexFrom) : indexFrom + batchSteps;
                    module._drawArcsPortion(indexFrom, indexTo, canvasObjects);
                    indexFrom = indexTo;
                    return indexTo === arcsCount;
                }

                function arcsIterationFinished(done) {
                    if (done) {
                        defered.resolve();
                    }
                    else {
                        startArcsInteration();
                    }
                }

                function arcsIterationError(err) {
                    defered.reject(err);
                }

                return defered.promise;
            };
            modulePrototype._drawArcsPortion = function (indexFrom, indexTo, canvasObjects) {
                var netLayer = this._layerBus.getLayer('net');
                var arcs = this._petriNet.arcs();

                for (var index = indexFrom; index < indexTo; index++) {
                    var cell = arcs[index];

                    var pnArc = cell.value;
                    var srcMarking = canvasObjects[cell.rowKey];
                    var destMarking = canvasObjects[cell.colKey];

                    var canvasArc = netLayer.findPTObject(pnArc, 'arc');
                    if (!canvasArc) {
                        canvasArc = this._createCanvasArc(srcMarking, destMarking, pnArc);
                        netLayer.addArc(canvasArc);
                    }
                    else {
                        canvasArc.applyChanges(srcMarking, destMarking, pnArc);
                    }
                }
            };
            modulePrototype._createCanvasArc = function (source, destination, pnArc) {
                var arcData = _.assign({}, pnArc, {src: source, dest: destination});
                var canvasArc = this._objectFactory.create('arc', arcData);
                return canvasArc;
            };

            modulePrototype.addPlace = function (data) {
                var pnPlace = this._petriNet.addPlace(data);
                var canvasPlace = this._createCanvasPlace(pnPlace);
                
                this.createMemento();

                var netLayer = this._layerBus.getLayer('net');
                return netLayer.addPlace(canvasPlace);
            };
            modulePrototype.removePlace = function (place) {
                this._petriNet.removePlace(place);
                var netLayer = this._layerBus.getLayer('net');
                netLayer.removePlace(place);
            };

            modulePrototype.addTransition = function (data) {
                var pnTransition = this._petriNet.addTransition(data);
                var canvasTransition = this._createCanvasTransition(pnTransition);

				this.createMemento();

                var netLayer = this._layerBus.getLayer('net');
                return netLayer.addTransition(canvasTransition);
            };
            modulePrototype.removeTransition = function (transition) {
                this._petriNet.removeTransition(transition);
                var netLayer = this._layerBus.getLayer('net');
                netLayer.removeTransition(transition);
            };

            modulePrototype.addArc = function (source, destination, args) {
                this._checkConnectionValidity(source, destination);
                this._petriNet.addArc(source, destination, args);
            };
            modulePrototype._checkConnectionValidity = function (source, destination) {
                if (source.type === destination.type) {
                    throw new Error('Cannot connect objects of the same type');
                }

                var arc = this._petriNet.findArc(source, destination);
                if (arc) {
                    throw new Error('There is already a connection from ' + source + ' to ' + destination);
                }
            };
            modulePrototype.removeArc = function (arc, guiOnly) {
                if (!guiOnly) {
                    this._petriNet.removeArc(arc.src, arc.dest);
                }

                var netLayer = this._layerBus.getLayer('net');
                netLayer.removeArc(arc);
            };

            modulePrototype.addTokens = function (place, tokens) {
                if (place.tokens > 0 || tokens > 0) {
                    place.tokens += tokens;
                    place.drawObject();

                    var updateDelegate = {
                        objType: 'place',
                        objId: place.id,
                        changes: {
                            tokens: place.tokens
                        }
                    };
                    this._applyUpdate(updateDelegate);
                    this._stageHandler.updateStage();
                }
                
                this.createMemento();
            };
            modulePrototype.adjustArcMultiplicity = function (arc, multiplicity) {
                if (arc.multiplicity > 1 || multiplicity > 0) {
                    arc.multiplicity += multiplicity;
                    arc.drawObject();

                    var updateDelegate = {
                        objType: 'arc',
                        srcId: arc.src,
                        destId: arc.dest,
                        changes: {
                            multiplicity: arc.multiplicity
                        }
                    };
                    this._applyUpdate(updateDelegate);
                    this._stageHandler.updateStage();
                }
            };

            modulePrototype._applyUpdate = function (delegate) {
                var objType = delegate.objType;

                var toUpdate;
                if (objType === 'place') {
                    toUpdate = this._petriNet.findPlace(delegate.objId);
                }
                else if (objType === 'transition') {
                    toUpdate = this._petriNet.findTransition(delegate.objId);
                }
                else if (objType === 'arc') {
                    if (delegate.changes.connection) {
                        var newConn = delegate.changes.connection.new;
                        var oldConn = delegate.changes.connection.old;

                        this._checkConnectionValidity(newConn.srcObj, newConn.destObj);
                        var oldArc = this._petriNet.findArc(oldConn.srcObj, oldConn.destObj);
                        this._petriNet.addArc(newConn.srcObj, newConn.destObj, oldArc);
                        this._petriNet.removeArc(oldConn.srcObj, oldConn.destObj);

                        delete delegate.changes.connection;
                    }


                    toUpdate = this._petriNet.findArc(delegate.srcId, delegate.destId);
                }

                var updatedGui = false;
                if (toUpdate) {
                    _.merge(toUpdate, delegate.changes, function (toUpdate, updatingWith) {
                        if (_.isArray(toUpdate)) {
                            return _.clone(updatingWith);
                        }
                    });

                    updatedGui = delegate.updateGui;
                    if (updatedGui) {
                        var netLayer = this._layerBus.getLayer('net');
                        var guiObj = netLayer.findPTObject(toUpdate.id, objType);
                        if (guiObj) {
                            _.merge(guiObj, delegate.changes);
                            guiObj.drawObject();
                        }
                    }
                }
                return updatedGui;
            };
            modulePrototype._applyDelete = function (delegate) {
                var objects = _.sortBy(delegate.objects, function (object) {
                    return object.type === 'arc' ? 0 : 1;
                });

                var module = this;
                _.forEach(objects, function (toDel) {
                    if (toDel.type === 'arc') {
                        module.removeArc(toDel);
                    }
                    else if (toDel.type === 'place' || toDel.type === 'transition') {
                        var connectedArcs = module.findConnectedArcs(toDel);
                        _.forEach(connectedArcs, function (connectedArc) {
                            module.removeArc(connectedArc, true);
                        });

                        if (toDel.type === 'place') {
                            module.removePlace(toDel);
                        }
                        else {
                            module.removeTransition(toDel);
                        }
                    }
                });
            };
            modulePrototype.applyChanges = function (delegates) {
                var module = this;
                var actDelegates = [].concat(delegates);

                var updateStage = false;
                _.forEach(actDelegates, function (delegate) {
                    if (delegate.type === 'update') {
                        updateStage = updateStage || module._applyUpdate(delegate);
                    }
                    else if (delegate.type === 'delete') {
                        module._applyDelete(delegate);
                    }
                });

                if (updateStage) {
                    this._stageHandler.updateStage();
                }
                
                this.createMemento();
            };

            modulePrototype.findPTObject = function (ptObject, type) {
                var id = ptObject ? typeof ptObject === 'string' ? ptObject : ptObject.id : undefined;
                if (!id) {
                    throw new Error('Cannot find PTObject without id. Received ' + ptObject);
                }
                return this._layerBus.getLayer('net').findPTObject(id, type);
            };
            modulePrototype.findPTObjects = function (type) {
                return this._layerBus.getLayer('net').findPTObjects(type);
            };
            modulePrototype.findConnectedArcs = function (ptObject) {
                var id = ptObject ? typeof ptObject === 'string' ? ptObject : ptObject.id : undefined;
                if (!id) {
                    throw new Error('Cannot find connected arcs of PTObject without id. Received ' + ptObject);
                }
                return this._layerBus.getLayer('net').findConnectedArcs(id);
            };

            modulePrototype.findBusinessPTObjects = function (type) {
                var result = [];
                if (this._petriNet) {
                    switch (type) {
                        case 'place':
                        {
                            result = this._petriNet.places();
                            break;
                        }
                        case 'transition':
                        {
                            result = this._petriNet.transitions();
                            break;
                        }
                        case 'arc':
                        {
                            result = this._petriNet.arcs();
                            break;
                        }
                    }
                }
                return result;
            };
            modulePrototype.findInputArcs = function (ptObject) {
                var result = [];
                if (this._petriNet) {
                    result = this._petriNet.findInputArcs(ptObject);
                }
                return result;
            };
            modulePrototype.findOutputArcs = function (ptObject) {
                var result = [];
                if (this._petriNet) {
                    result = this._petriNet.findOutputArcs(ptObject);
                }
                return result;
            };

            modulePrototype.findArc = function (src, dest) {
                var srcId = src ? typeof src === 'string' ? src : src.id : undefined;
                var destId = dest ? typeof dest === 'string' ? dest : dest.id : undefined;
                if (!srcId || !destId) {
                    throw new Error('Cannot find arc without source and destination objects. Receiver src ' + src + ' dest ' + dest);
                }
                return this._layerBus.getLayer('net').findArc(srcId, destId);
            };
            modulePrototype.findObjectsWithin = function (rectangle) {
                var objects = this._layerBus.getLayer('net').findObjectsWithin(rectangle);
                return new PNObjectSet(objects);
            };

            modulePrototype.getNetState = function () {
                var netState = new NetState();
                if (this._petriNet) {
                    netState.loadFromNet(this._petriNet);
                }
                return netState;
            };

            modulePrototype._checkLayout = function () {
                var layoutValid = true;

                var persistenceData = this._petriNet.persistenceData;
                if (persistenceData && persistenceData.imported) {
                    var validityResult = this._layoutPerformer.checkLayoutValidity(this._petriNet, 'petriNet');
                    layoutValid = validityResult.valid;
                }

                return layoutValid;
            };
            modulePrototype._layoutNet = function () {
                var layout = PNSettingsManager.getSelectedLayout();
                var result = this._layoutPerformer.performLayout(this._petriNet, layout.type);
                return result;
            };
            modulePrototype.applyLayout = function () {
                if (!this._petriNet) {
                    return;
                }

                var module = this;
                module._initModal();

                return this._layoutNet().then(function () {
                    return module._redrawNet();
                }).then(function () {
                	module.createMemento();
                });
            };

            modulePrototype._initModal = function () {
                spinnerService.show('modellingSpinner');
            };
            modulePrototype._disposeModal = function () {
                $timeout(function () {
                    spinnerService.hide('modellingSpinner');
                });
            };

            modulePrototype.dispose = function () {
                this._disposeModal();
            };
            
            // Creates new memento object in Memento module.
            modulePrototype.createMemento = function () {
                var memento = this._moduleBus.getModule('pnMemento');
				memento.push(this._petriNet);
            };

            return PNConstructor;
        });
}());