'use strict';

(function () {
    angular.module('PNExporterImpls')
        .factory('PNMLExporter', function (PNExporter) {

            function PNMLExporter() {
            }

            var exporterPrototype = createjs.extend(PNMLExporter, PNExporter);
            exporterPrototype.prepareNetData = function (petriNet) {
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString('<pnml></pnml>', 'text/xml');

                var pnmlXml = xmlDoc.getElementsByTagName('pnml')[0];
                pnmlXml.setAttribute('xmlns', 'http://www.pnml.org/version-2009/grammar/pnml');

                var netXml = xmlDoc.createElement('net');
                netXml.setAttribute('id', _.get(petriNet, 'persistenceData.id') || StringUtils.uuid());
                netXml.setAttribute('type', 'http://www.pnml.org/version-2009/grammar/ptnet');
                var netNameXml = serializeName(xmlDoc, petriNet.persistenceData || {name: 'PetriNetExported'});
                netXml.appendChild(netNameXml);
                pnmlXml.appendChild(netXml);

                var pageXml = xmlDoc.createElement('page');
                pageXml.setAttribute('id', StringUtils.uuid());
                netXml.appendChild(pageXml);

                serializePlaces(xmlDoc, pageXml, petriNet);
                serializeTransitions(xmlDoc, pageXml, petriNet);
                serializeArcs(xmlDoc, pageXml, petriNet);

                var serializer = new XMLSerializer();
                return serializer.serializeToString(xmlDoc);
            };
            exporterPrototype.getFileExtension = function () {
                return 'pnml';
            };

            function serializePlaces(xmlDoc, xmlNet, petriNet) {
                _.forEach(petriNet.places(), function (place) {
                    var placeXml = xmlDoc.createElement('place');
                    placeXml.setAttribute('id', place.id);

                    var nameXml = serializePTName(xmlDoc, place);
                    placeXml.appendChild(nameXml);

                    var positionXml = serializePositions(xmlDoc, [place.position], 'position');
                    placeXml.appendChild(positionXml);

                    if (place.tokens) {
                        var initialMarkingXml = xmlDoc.createElement('initialMarking');
                        var textXml = serializeText(xmlDoc, place.tokens);
                        initialMarkingXml.appendChild(textXml);
                        placeXml.appendChild(initialMarkingXml);
                    }
                    xmlNet.appendChild(placeXml);
                });
            }

            function serializeTransitions(xmlDoc, xmlNet, petriNet) {
                _.forEach(petriNet.transitions(), function (transition) {
                    var transitionXml = xmlDoc.createElement('transition');
                    transitionXml.setAttribute('id', transition.id);

                    var nameXml = serializePTName(xmlDoc, transition);
                    transitionXml.appendChild(nameXml);

                    var positionXml = serializePositions(xmlDoc, [transition.position], 'position');
                    transitionXml.appendChild(positionXml);

                    xmlNet.appendChild(transitionXml);
                });
            }

            function serializeArcs(xmlDoc, xmlNet, petriNet) {
                _.forEach(petriNet.arcs(), function (cell) {
                    var xmlArc = xmlDoc.createElement('arc');
                    var arcData = cell.value;
                    xmlArc.setAttribute('id', arcData.id);
                    xmlArc.setAttribute('source', cell.rowKey);
                    xmlArc.setAttribute('target', cell.colKey);

                    if (arcData.multiplicity > 1) {
                        var inscriptionXml = xmlDoc.createElement('inscription');
                        var textXml = serializeText(xmlDoc, arcData.multiplicity);
                        inscriptionXml.appendChild(textXml);
                        xmlArc.appendChild(inscriptionXml);
                    }

                    var realPoints = _.filter(arcData.points, function (point, index) {
                        return index > 0 && index < arcData.points.length - 1;
                    });
                    if (realPoints.length) {
                        xmlArc.appendChild(serializePositions(xmlDoc, realPoints, 'position'));
                    }

                    xmlNet.appendChild(xmlArc);
                });
            }

            function serializeText(xmlDoc, text) {
                var textXml = xmlDoc.createElement('text');
                var valueXml = xmlDoc.createTextNode(text);
                textXml.appendChild(valueXml);
                return textXml;
            }

            function serializeName(xmlDoc, namedObject) {
                var nameXml = xmlDoc.createElement('name');
                var textXml = serializeText(xmlDoc, namedObject.name);
                nameXml.appendChild(textXml);
                return nameXml;
            }

            function serializePTName(xmlDoc, ptObject) {
                var nameXml = serializeName(xmlDoc, ptObject);
                if (ptObject.labelPosition) {
                    var graphicsXml = serializePositions(xmlDoc, [ptObject.labelPosition], 'offset');
                    nameXml.appendChild(graphicsXml);
                }
                return nameXml;
            }

            function serializePositions(xmlDoc, points, name) {
                var graphicsXml = xmlDoc.createElement('graphics');
                _.forEach(points, function (point) {
                    var pointXml = xmlDoc.createElement(name);
                    pointXml.setAttribute('x', point.x);
                    pointXml.setAttribute('y', point.y);
                    graphicsXml.appendChild(pointXml);
                });
                return graphicsXml;
            }

            return PNMLExporter;
        });
})();