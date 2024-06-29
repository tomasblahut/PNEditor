'use strict';

(function () {
    angular.module('PNConstructionModules', [
        'CanvasModules',
        'PNModuleAssets',
        'PNSettings'
    ])
        .factory('ObjectConnector', function (CanvasModule, AMP, OCP) {

            function ObjectConnector() {
                CanvasModule.call(this);
            }

            var modulePrototype = createjs.extend(ObjectConnector, CanvasModule);
            modulePrototype._doInit = function () {
                this._magnets = [];
            };

            modulePrototype.initConnection = function () {
                if (this._listenerTokens) {
                    this._clearEvents();
                }

                var module = this;
                this._listenerTokens = [
                    this._eventManager.addListener('placeMouseover', function (pmovEvent) {
                        module._focusPTObj(pmovEvent.place);
                    }),
                    this._eventManager.addListener('placeMouseout', function (pmoEvent) {
                        module._blurPTObj(new createjs.Point(pmoEvent.x, pmoEvent.y), pmoEvent.place);
                    }),
                    this._eventManager.addListener('transitionMouseover', function (tmovEvent) {
                        module._focusPTObj(tmovEvent.transition);
                    }),
                    this._eventManager.addListener('transitionMouseout', function (tmoEvent) {
                        module._blurPTObj(new createjs.Point(tmoEvent.x, tmoEvent.y), tmoEvent.transition);
                    })
                ];
            };

            modulePrototype._focusPTObj = function (ptObj) {
                this._curOCP = new OCP({realObj: ptObj, conObj: ptObj, magnetic: false});

                if (this._magnets.length === 0) {
                    var positive = !this._srcOCP || this._srcOCP.getType() !== this._curOCP.getType();
                    if (positive) {
                        this._drawMagnets();
                    }

                    var highlighter = this._moduleBus.getModule('highlighter');
                    this._highlightToken = highlighter.highlightObjects({
                        identificationMethod: 'connection',
                        positive: positive,
                        objects: [ptObj]
                    });
                }
            };
            modulePrototype._blurPTObj = function (position, fromObj) {
                this._curOCP = undefined;
                var clear = false;

                if (fromObj.type === 'magnet') {
                    var attachedObj = fromObj.attachedTo;
                    var localPos = attachedObj.globalToLocal(position.x, position.y);
                    clear = !attachedObj.hitTest(localPos.x, localPos.y);
                }
                else {
                    var magnet = _.find(this._magnets, function (curMag) {
                        var localPos = curMag.globalToLocal(position.x, position.y);
                        return curMag.hitTest(localPos.x, localPos.y);
                    });
                    clear = typeof magnet === 'undefined';
                }

                if (clear) {
                    this._clearMagnets();
                    var highlighter = this._moduleBus.getModule('highlighter');
                    highlighter.removeHighlight(this._highlightToken);
                }
            };

            modulePrototype.connect = function () {
                if (!this._curOCP) {
                    throw new Error('Connection object not specified');
                }

                if (this._srcOCP) {
                    var srcObj = this._srcOCP.conObj;
                    var destObj = this._curOCP.conObj;

                    var pnConstructor = this._moduleBus.getModule('pnConstructor');
                    pnConstructor.addArc(srcObj, destObj, {id: this._dummyArc.id, points: this._dummyArc.points});

                    this._dummyArc.dest = destObj;
                    this._dummyArc.destMagnetic = this._curOCP.magnetic;

                    var amp = this._dummyArc.lastAmp;
                    amp.startOfArc = false;
                    this.alterArcConnection(amp);
                    this._dummyArc.drawObject();

                    var delegate = {
                        type: 'update',
                        objType: 'arc',
                        srcId: this._dummyArc.src.id,
                        destId: this._dummyArc.dest.id,
                        changes: {
                            points: this._dummyArc.points,
                            srcMagnetic: this._dummyArc.srcMagnetic,
                            destMagnetic: this._dummyArc.destMagnetic
                        }
                    };
                    pnConstructor.applyChanges(delegate);

                    this._dummyArc.mouseEnabled = true;
                    delete this._dummyArc.lastAmp;
                    this._dummyArc = undefined;

                    this.restoreState();
                }
                else {
                    this.setSource(this._curOCP, true);
                }
            };
            modulePrototype.setSource = function (srcOCP, createDummyArc) {
                this._srcOCP = srcOCP instanceof OCP ? srcOCP : new OCP(srcOCP);

                var type = this._srcOCP.getType();
                if (type !== 'place' && type !== 'transition') {
                    throw new Error('Connecting object type ' + type + ' is not supported');
                }

                var pnConstructor = this._moduleBus.getModule('pnConstructor');
                this._dimmedObjs = pnConstructor.findPTObjects(type);
                _.forEach(this._dimmedObjs, function (dimmedObj) {
                    dimmedObj.alpha = 0.3;
                });

                if (createDummyArc) {
                    this.createDummyArc();
                }
            };

            modulePrototype._drawMagnets = function () {
                var conObj = this._curOCP.conObj;
                var objType = conObj.type;
                var origin = conObj.getCenter();
                var points = [];

                if (objType === 'place') {
                    var magnetPoint = new createjs.Point(origin.x + conObj.radius(), origin.y);
                    var magnetCount = 8;
                    var angleIncrement = 360 / magnetCount;

                    for (var magIndex = 0; magIndex < magnetCount; magIndex++) {
                        points.push(CanvasUtils.rotate(origin, magnetPoint, magIndex * angleIncrement));
                    }
                }
                else if (objType === 'transition') {
                    var height = conObj.height();
                    var width = conObj.width();
                    var heightHalf = height / 2;
                    var widthHalf = width / 2;
                    var heightQuarter = height / 4;

                    points = [
                        {x: origin.x, y: origin.y - heightHalf},
                        {x: origin.x - widthHalf, y: origin.y - heightQuarter},
                        {x: origin.x - widthHalf, y: origin.y},
                        {x: origin.x - widthHalf, y: origin.y + heightQuarter},
                        {x: origin.x, y: origin.y + heightHalf},
                        {x: origin.x + widthHalf, y: origin.y + heightQuarter},
                        {x: origin.x + widthHalf, y: origin.y},
                        {x: origin.x + widthHalf, y: origin.y - heightQuarter}
                    ];
                }

                var enhancLayer = this._layerBus.getLayer('enhancement');
                for (var index = 0; index < points.length; index++) {
                    var curMagPoint = CanvasUtils.rotate(origin, points[index], conObj.getRotation());
                    var magnet = this._createMagnet(conObj, curMagPoint);
                    enhancLayer.addChild(magnet);
                }
            };
            modulePrototype._createMagnet = function (object, position) {
                var module = this;
                var highlighter = this._moduleBus.getModule('highlighter');

                var magnet = this._objectFactory.create('magnet', {attachedTo: object});
                magnet.x = position.x;
                magnet.y = position.y;
                magnet._listenerTokens = {
                    mouseover: magnet.on('mouseover', function () {
                        module._curOCP = new OCP({realObj: magnet, conObj: magnet.attachedTo, magnetic: true});
                        module._magnetHighlightToken = highlighter.highlightObjects({
                            highlightType: 'connection',
                            objects: [magnet]
                        });
                    }),
                    mouseout: magnet.on('mouseout', function (event) {
                        module._blurPTObj(new createjs.Point(event.stageX, event.stageY), magnet);
                        highlighter.removeHighlight(module._magnetHighlightToken);
                        module._magnetHighlightToken = undefined;
                    }),
                    click: magnet.on('click', function () {
                        module.connect();
                    })
                };
                this._magnets.push(magnet);

                return magnet;
            };
            modulePrototype._clearMagnets = function () {
                if (this._magnets.length > 0) {
                    var enhancLayer = this._layerBus.getLayer('enhancement');
                    _.forEach(this._magnets, function (magnet) {
                        _.forEach(magnet._listenerTokens, function (wrapper, type) {
                            magnet.off(type, wrapper);
                        });
                        enhancLayer.removeChild(magnet);
                    });

                    this._magnets = [];
                }
            };

            modulePrototype.alterArcConnection = function (amp) {
                if (!this._curOCP) {
                    throw new Error('No object selected to connection');
                }
                var destObj = this._curOCP.conObj;
                var magnetic = this._curOCP.magnetic;

                var neighborAmp = amp.startOfArc ? amp.next : amp.previous;
                var newAmpPos = magnetic ? this._curOCP.getConnectionPoint()
                    : CanvasUtils.shapeCenterIntersect(destObj, neighborAmp.getCalcPosition());

                amp.moveTo(newAmpPos);
                amp.connectedObject = destObj;
                amp.magnetic = magnetic;
            };

            modulePrototype.createDummyArc = function () {
                var arcPoint = this._srcOCP.getConnectionPoint();

                this._dummyArc = this._objectFactory.create('arc', {
                    id: StringUtils.uuid(),
                    points: [arcPoint, _.clone(arcPoint)]
                });
                this._dummyArc.src = this._srcOCP.conObj;
                this._dummyArc.srcMagnetic = this._srcOCP.magnetic;
                this._dummyArc.mouseEnabled = false;

                var firstPoint = this._dummyArc.points[0];
                var secondPoint = this._dummyArc.points[1];

                var lastAmp = new AMP({point: secondPoint, arc: this._dummyArc});
                lastAmp.previous = new AMP({point: firstPoint, arc: this._dummyArc});

                this._dummyArc.lastAmp = lastAmp;
                var netLayer = this._layerBus.getLayer('net');
                netLayer.addArc(this._dummyArc);
            };
            modulePrototype.moveArcEndpoint = function (position) {
                if (this._dummyArc) {
                    var amp = this._dummyArc.lastAmp;

                    var gridLocalPoint = this._navigator.moveAtGrid(position, amp.position, 'net', 2);
                    if (gridLocalPoint) {
                        amp.moveTo(gridLocalPoint);
                        this._dummyArc.drawObject();
                        this._stageHandler.updateStage();
                    }
                }
            };
            modulePrototype.addArcPoint = function () {
                if (this._dummyArc) {
                    var lastAmp = this._dummyArc.lastAmp;
                    var prevLastAmp = lastAmp.previous;

                    var newPoint = new createjs.Point(lastAmp.position.x, lastAmp.position.y);
                    this._dummyArc.points.splice(this._dummyArc.points.length - 1, 0, newPoint);

                    var newAmp = new AMP({point: newPoint, arc: this._dummyArc});
                    newAmp.previous = prevLastAmp;
                    newAmp.next = lastAmp;

                    lastAmp.previous = newAmp;
                    prevLastAmp.next = newAmp;
                }
            };

            modulePrototype._clearEvents = function () {
                var module = this;
                _.forEach(this._listenerTokens, function (token) {
                    module._eventManager.clearListener(token);
                });
                this._listenerTokens = undefined;
            };
            modulePrototype.restoreState = function (clearConnecting) {
                this._srcOCP = undefined;

                if (clearConnecting) {
                    this._clearEvents();
                    this._curOCP = undefined;

                    this._clearMagnets();
                    if (this._highlightToken) {
                        var highlighter = this._moduleBus.getModule('highlighter');
                        highlighter.removeHighlight(this._highlightToken);
                    }
                }

                _.forEach(this._dimmedObjs, function (dimmedObj) {
                    dimmedObj.alpha = 1.0;
                });
                this._dimmedObjs = [];

                if (this._dummyArc) {
                    var netLayer = this._layerBus.getLayer('net');
                    netLayer.removeArc(this._dummyArc);
                    this._dummyArc = undefined;
                }

                this._stageHandler.updateStage();
            };
            modulePrototype.dispose = function () {
                this.restoreState();
            };

            return ObjectConnector;
        });
}());