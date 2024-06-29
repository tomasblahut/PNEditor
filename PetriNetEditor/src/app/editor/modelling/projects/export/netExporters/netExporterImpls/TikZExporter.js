'use strict';

(function () {
    angular.module('PNExporterImpls')
        .factory('TikZExporter', function (PNExporter, TikzNet) {

            var tikzLibrary = "\\usetikzlibrary{petri, arrows.meta}\n";
            var tikzSet = "\\tikzset {\n" +
                "\tarc/.style={\n" +
                "\t\tarrows={-Stealth[scale=1.25]},\n" +
                "\t\tthick,\n" +
                "\t\trounded corners=.5cm\n" +
                "\t},\n" +
                "\tplace/.style={\n" +
                "\t\tcircle,\n" +
                "\t\tvery thick,\n" +
                "\t\tdraw=black,fill=black!5,\n" +
                "\t\tminimum size=10mm\n" +
                "\t},\n" +
                "\ttransition/.style={\n" +
                "\trectangle,\n" +
                "\tthick,\n" +
                "\tdraw=black, fill=black!75,\n" +
                "\tminimum width=4mm,\n" +
                "\tminimum height=10mm\n" +
                "\t}\n" +
                "}";

            function TikZExporter() {
            }

            var exporterPrototype = createjs.extend(TikZExporter, PNExporter);
            exporterPrototype.prepareNetData = function (petriNet) {
                var tikzNetStr = tikzLibrary + tikzSet + '\n\\begin{tikzpicture}\n';
                var nodeIdNameMap = {};

                var tikzNet = new TikzNet(petriNet);
                _.forEach(tikzNet.places(), function (place) {
                    tikzNetStr += createPlaceNode(place, nodeIdNameMap);
                });

                _.forEach(tikzNet.transitions(), function (transition) {
                    tikzNetStr += createTransitionNode(transition, nodeIdNameMap);
                });

                _.forEach(tikzNet.arcs(), function (arc) {
                    tikzNetStr += createArcDrawing(arc, nodeIdNameMap);
                });

                tikzNetStr += '\\end{tikzpicture}';
                return tikzNetStr;
            };
            exporterPrototype.getFileExtension = function () {
                return 'tikz';
            };

            function createPlaceNode(place, nodeIdNameMap) {
                var tikzPlace = '\\node[place';

                var tokens = place.tokens;
                if (tokens > 0) {
                    tikzPlace += ', tokens=' + tokens;
                }

                var position = place.position;
                tikzPlace += ', ' + createLabel(place.name, place.labelSector) + ']';
                tikzPlace += ' at(' + position.x + ',' + position.y + ')';

                var placeName = place.name.toLowerCase();
                nodeIdNameMap[place.id] = placeName;
                tikzPlace += ' (' + placeName + ') {};\n';

                return tikzPlace;
            }

            function createTransitionNode(transition, nodeIdNameMap) {
                var tikzTransition = '\\node[transition';

                var position = transition.position;
                tikzTransition += ', ' + createLabel(transition.name, transition.labelSector) + ']';
                tikzTransition += ' at(' + position.x + ',' + position.y + ')';

                var transName = transition.name.toLowerCase();
                nodeIdNameMap[transition.id] = transName;
                tikzTransition += ' (' + transName + ') {};\n';

                return tikzTransition;
            }

            function createLabel(name, sector) {
                var labelPos;
                switch (sector) {
                    case 0:
                    {
                        labelPos = 'above';
                        break;
                    }
                    case 1:
                    {
                        labelPos = 'above right';
                        break;
                    }
                    case 2:
                    {
                        labelPos = 'right';
                        break;
                    }
                    case 3:
                    {
                        labelPos = 'below right';
                        break;
                    }
                    case 4:
                    {
                        labelPos = 'below';
                        break;
                    }
                    case 5:
                    {
                        labelPos = 'below left';
                        break;
                    }
                    case 6:
                    {
                        labelPos = 'left';
                        break;
                    }
                    case 7:
                    {
                        labelPos = 'above left';
                        break;
                    }
                }

                return 'label=' + labelPos + ':' + escapeLabel(name);
            }

            function escapeLabel(name) {
                return '$' + name.replace(/([_])/g, "\\$1") + '$';
            }

            function createArcDrawing(arc, nodeIdNameMap) {
                var tikzArc = '\\draw[arc]';

                var srcNode = nodeIdNameMap[arc.rowKey];
                var destNode = nodeIdNameMap[arc.colKey];
                var arcData = arc.value;

                tikzArc += '(' + srcNode + ') to ';

                var multiplicity = arc.multiplicity;
                if (multiplicity > 1) {
                    tikzArc += 'node[midway] {' + multiplicity + '}';
                }

                for (var index = 0; index < arcData.points.length; index++) {
                    var point = arcData.points[index];
                    tikzArc += ' (' + point.x + ',' + point.y + ') to';
                }
                tikzArc += ' (' + destNode + ');\n';

                return tikzArc;
            }

            return TikZExporter;
        })
        .factory("TikzNet", function () {

            function TikzNet(petriNet) {
                var dimenAdj = calculateDimensionAdjustments(petriNet);

                this._tikzPlaces = _.map(petriNet.places(), function (pnPlace) {
                    var tikzPlace = {
                        id: pnPlace.id,
                        name: pnPlace.name,
                        labelSector: identifyLabelSector(pnPlace.labelPosition, pnPlace.position),
                        tokens: pnPlace.tokens,
                        position: finalizePosition(pnPlace.position, dimenAdj)
                    };

                    return tikzPlace;
                });

                this._tikzTransitions = _.map(petriNet.transitions(), function (pnTrans) {
                    var tikzTrans = {
                        id: pnTrans.id,
                        name: pnTrans.name,
                        labelSector: identifyLabelSector(pnTrans.labelPosition, pnTrans.position),
                        position: finalizePosition(pnTrans.position, dimenAdj)
                    };

                    return tikzTrans;
                });

                this._tikzArcs = _.map(petriNet.arcs(), function (arcCell) {
                    var tikzArcCell = {
                        rowKey: arcCell.rowKey,
                        colKey: arcCell.colKey
                    };

                    var arc = arcCell.value;
                    var tikzArc = {
                        multiplicity: arc.multiplicity,
                        labelPosition: arc.labelPosition ? finalizePosition(arc.labelPosition, dimenAdj) : undefined,
                        points: []
                    };

                    for (var index = 1; index < arc.points.length - 1; index++) {
                        tikzArc.points[index - 1] = finalizePosition(arc.points[index], dimenAdj);
                    }

                    tikzArcCell.value = tikzArc;
                    return tikzArcCell;
                });
            }

            TikzNet.prototype.places = function () {
                return this._tikzPlaces;
            };
            TikzNet.prototype.transitions = function () {
                return this._tikzTransitions;
            };
            TikzNet.prototype.arcs = function () {
                return this._tikzArcs;
            };

            function calculateDimensionAdjustments(petriNet) {
                var boundaries = {
                    minX: undefined,
                    maxX: undefined,
                    minY: undefined,
                    maxY: undefined
                };

                _.forEach(_.union(petriNet.places(), petriNet.transitions()), function (pnObj) {
                    checkAgainstBoundaries(pnObj.position, boundaries);
                    checkAgainstBoundaries(pnObj.labelPosition, boundaries);
                });

                _.forEach(petriNet.arcs(), function (arc) {
                    _.forEach(arc.value.points, function (point) {
                        checkAgainstBoundaries(point, boundaries);
                    });
                });

                return {
                    shiftX: boundaries.minX,
                    shiftY: boundaries.maxY,
                    scaleX: 10 / (boundaries.maxX - boundaries.minX),
                    scaleY: 10 / (boundaries.maxY - boundaries.minY)
                };
            }

            function checkAgainstBoundaries(point, boudaries) {
                if (!point) {
                    return;
                }

                if (!boudaries.minX || boudaries.minX > point.x) {
                    boudaries.minX = point.x;
                }

                if (!boudaries.maxX || boudaries.maxX < point.x) {
                    boudaries.maxX = point.x;
                }

                if (!boudaries.minY || boudaries.minY > point.y) {
                    boudaries.minY = point.y;
                }

                if (!boudaries.maxY || boudaries.maxY < point.y) {
                    boudaries.maxY = point.y;
                }
            }

            function finalizePosition(point, dimenAdj) {
                var shiftedX = point.x - dimenAdj.shiftX;
                var shiftedY = -point.y + dimenAdj.shiftY;
                var actX = Math.round(shiftedX * dimenAdj.scaleX * 100) / 100;
                var actY = Math.round(shiftedY * dimenAdj.scaleY * 100) / 100;
                return new createjs.Point(actX, actY);
            }

            function translateToObjectGlobal(point, objectPoint) {
                return new createjs.Point(objectPoint.x + point.x, objectPoint.y + point.y);
            }

            function identifyLabelSector(labelPos, objPos) {
                var sector, boundary = 5;

                var minX = objPos.x - boundary;
                var maxX = objPos.x + boundary;
                var minY = objPos.y - boundary;
                var maxY = objPos.y + boundary;

                if (labelPos) {
                    labelPos = translateToObjectGlobal(labelPos, objPos);
                    if (labelPos.x <= minX) {
                        if (labelPos.y <= minY) {
                            sector = 7;
                        }
                        else if (labelPos.y >= maxY) {
                            sector = 5;
                        }
                        else {
                            sector = 6;
                        }
                    }
                    else if (labelPos.x > maxX) {
                        if (labelPos.y <= minY) {
                            sector = 1;
                        }
                        else if (labelPos.y >= maxY) {
                            sector = 3;
                        }
                        else {
                            sector = 2;
                        }
                    }
                    else {
                        if (labelPos.y <= objPos.y) {
                            sector = 0;
                        }
                        else {
                            sector = 4;
                        }
                    }
                }
                else {
                    sector = 4;
                }

                return sector;
            }

            return TikzNet;
        });
})();