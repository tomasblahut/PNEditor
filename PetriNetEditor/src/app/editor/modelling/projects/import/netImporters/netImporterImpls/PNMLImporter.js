'use strict';

(function () {
    angular.module('PNImporterImpls')
        .factory('PNMLImporter', function (PNImporter) {

            function PNMLImporter() {
            }

            var importerPrototype = createjs.extend(PNMLImporter, PNImporter);
            importerPrototype.canImportFile = function (netData) {
                try {
                    var parser = new DOMParser();
                    var xmlDoc = parser.parseFromString(netData, 'text/xml');

                    var pnmlNode = xmlDoc.getElementsByTagName('pnml')[0];
                    if (!pnmlNode) {
                        throw new Error('Missing PNML element');
                    }

                    var netNode = pnmlNode.getElementsByTagName('net')[0];
                    if (!netNode) {
                        throw new Error('Missing NET element');
                    }

                    return true;
                } catch (err) {
                    return false;
                }
            };
            importerPrototype.parsePetriNet = function (netData) {
                var net = new PNBusiness.PetriNet();

                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(netData, 'text/xml');

                parsePlaces(xmlDoc, net);
                parseTransition(xmlDoc, net);
                parseArcs(xmlDoc, net);

                return net;
            };

            function parsePlaces(xmlDoc, petriNet) {
                var xmlPlaces = getElements(xmlDoc, 'place');
                _.forEach(xmlPlaces, function (xmlPlace) {
                    var args = {
                        id: xmlPlace.getAttribute('id')
                    };
                    _.merge(args, getName(xmlPlace));

                    var markingXml = getElement(xmlPlace, 'initialMarking');
                    if (markingXml) {
                        var tokens = getText(markingXml);
                        args.tokens = tokens ? parseInt(tokens) : 0;
                    }
                    args.position = getPosition(xmlPlace, 'position');

                    petriNet.addPlace(args);
                });
            }

            function parseTransition(xmlDoc, petriNet) {
                var xmlTransitions = xmlDoc.getElementsByTagName('transition');
                _.forEach(xmlTransitions, function (xmlTrans) {
                    var args = {
                        id: xmlTrans.getAttribute('id')
                    };
                    _.merge(args, getName(xmlTrans));
                    args.position = getPosition(xmlTrans, 'position');

                    petriNet.addTransition(args);
                });
            }

            function parseArcs(xmlDoc, petriNet) {
                var xmlArcs = xmlDoc.getElementsByTagName('arc');
                _.forEach(xmlArcs, function (xmlArc) {
                    var args = {
                        id: xmlArc.getAttribute('id')
                    };

                    var inscriptionXml = getElement(xmlArc, 'inscription');
                    var inscriptionText = getText(inscriptionXml);
                    args.multiplicity = inscriptionText ? parseInt(inscriptionText) : 1;

                    var src = xmlArc.getAttribute('source');
                    var srcObj = petriNet.identifyPTObject(src);
                    var dest = xmlArc.getAttribute('target');
                    var destObj = petriNet.identifyPTObject(dest);

                    if (srcObj.position && destObj.position) {
                        args.points = prepareArcPoints(xmlArc, srcObj, destObj);
                    }

                    petriNet.addArc(src, dest, args);
                });
            }

            function prepareArcPoints(xmlArc, srcObj, destObj) {
                var xmlPoints = getPositions(xmlArc, 'position');
                xmlPoints.unshift(srcObj.position);
                xmlPoints.push(destObj.position);

                var arcPoints = [];
                for (var index = 0; index < xmlPoints.length; index++) {
                    var prevPoint = xmlPoints[index - 1];
                    var curPoint = xmlPoints[index];
                    var nextPoint = xmlPoints[index + 1];

                    if (index === 0) {
                        var srcHelper = prepareConnectedObj(srcObj);
                        arcPoints.push(CanvasUtils.shapeCenterIntersect(srcHelper, nextPoint));
                    }
                    else if (index === xmlPoints.length - 1) {
                        var destHelper = prepareConnectedObj(destObj);
                        arcPoints.push(CanvasUtils.shapeCenterIntersect(destHelper, prevPoint));
                    }
                    else {
                        arcPoints.push(curPoint);
                    }
                }
                return arcPoints;
            }

            function prepareConnectedObj(ptObj) {
                if (ptObj.type === 'place') {
                    return {center: ptObj.position, radius: 20, type: 'place'};
                }
                else {
                    return {center: ptObj.position, width: 15, height: 40, rotation: 0, type: 'transition'};
                }
            }

            function getElement(from, name, immediateChildren) {
                return from ? getElements(from, name, immediateChildren)[0] : undefined;
            }

            function getElements(from, name, immediateChildren) {
                var elements;
                if (from) {
                    elements = immediateChildren ? _.filter(from.childNodes, function (childNode) {
                        return childNode.tagName === name;
                    }) : from.getElementsByTagName(name);
                }
                return elements;
            }

            function getText(from) {
                if (from) {
                    var textXml = getElement(from, 'text');
                    if (textXml) {
                        return textXml.nodeValue || textXml.textContent;
                    }
                }
            }

            function getPosition(from, name) {
                return getPositions(from, name)[0];
            }

            function getPositions(from, name) {
                var points = [];
                if (from) {
                    var graphicsXml = getElement(from, 'graphics', true);
                    var positionsXml = getElements(graphicsXml, name);
                    if (positionsXml) {
                        points = _.map(positionsXml, function (positionXml) {
                            return {
                                x: parseInt(positionXml.getAttribute('x')),
                                y: parseInt(positionXml.getAttribute('y'))
                            };
                        });
                    }
                }
                return points;
            }

            function getName(from) {
                var data = {};
                if (from) {
                    var nameXml = getElement(from, 'name');
                    if (nameXml) {
                        data.name = getText(nameXml);
                        data.labelPosition = getPosition(nameXml, 'offset');
                    }
                }
                return data;
            }

            return PNMLImporter;
        });
})();