'use strict';

(function () {
    angular.module('BasicCanvasObjects', [
        'CanvasObjects'
    ])
        .factory('GraphArc', function (CanvasObject) {

            function Arc(args) {
                CanvasObject.call(this, args);

                if (args.id) {
                    this.id = args.id;
                }
                this.src = args.src;
                this.dest = args.dest;
                this.quadrant = args.quadrant;

                if (this._cloningPoints) {
                    this.points = _.cloneDeep(args.points);
                }
                else {
                    this.points = args.points;
                }


                this.drawObject();
            }

            var arcPrototype = createjs.extend(Arc, CanvasObject);
            arcPrototype._gui = {
                line_width: 2,
                line_hit_width: 8,
                bodyColor: '#2E2E2E',
                label: {
                    font: 'Arial',
                    font_size: 16,
                    font_weight: 'normal',
                    color: '#2E2E2E'
                }
            };
            arcPrototype._usingHitBox = false;

            arcPrototype.applyChanges = function (srcObj, destObj, args) {
                this.src = srcObj;
                this.dest = destObj;
                this.points = args.points;
                this.labelPosition = args.labelPosition;
                this.quadrant = args.quadrant;
                this.drawObject();
            };
            arcPrototype._doDrawObject = function () {
                var srcEqualsDest = this.src && this.dest && this.src.id === this.dest.id;

                if (srcEqualsDest) {
                    this._drawSelfLoop();
                }
                else {
                    this._drawLine();
                }

                this._drawArrow();
            };

            arcPrototype._drawLine = function () {
                var gui = this._gui;
                var line = new createjs.Shape();
                line.graphics.setStrokeStyle(gui.line_width).beginStroke(this._getBodyColor());

                var hitbox;
                if (this._usingHitBox) {
                    hitbox = new createjs.Shape();
                    hitbox.graphics.setStrokeStyle(gui.line_hit_width).beginStroke('#FF0000');
                }

                var points = this.points;
                for (var index = 0; index < points.length; index++) {
                    var curPoint = points[index];

                    if (index === 0) {
                        line.graphics.moveTo(curPoint.x, curPoint.y);
                        if (hitbox) {
                            hitbox.graphics.moveTo(curPoint.x, curPoint.y);
                        }
                    }
                    else {
                        var nextPoint = points[index + 1];
                        if (nextPoint) {
                            var prevPoint = points[index - 1];
                            var vectorOne = CanvasUtils.vector(curPoint, prevPoint);
                            var vectorTwo = CanvasUtils.vector(curPoint, nextPoint);

                            var angle = CanvasUtils.vectorAngle(vectorOne, vectorTwo, true);
                            var minDist = Math.min(vectorOne.getLength(), vectorTwo.getLength());
                            var arcDist = angle / 180 * Math.min(minDist, 35);

                            var firstDistancePoint = CanvasUtils.pointAtDistance(curPoint, vectorOne, arcDist);
                            line.graphics.lineTo(firstDistancePoint.x, firstDistancePoint.y);
                            if (hitbox) {
                                hitbox.graphics.lineTo(firstDistancePoint.x, firstDistancePoint.y);
                            }

                            var secondDistancePoint = CanvasUtils.pointAtDistance(curPoint, vectorTwo, arcDist);
                            line.graphics.quadraticCurveTo(curPoint.x, curPoint.y, secondDistancePoint.x, secondDistancePoint.y);
                            if (hitbox) {
                                hitbox.graphics.quadraticCurveTo(curPoint.x, curPoint.y, secondDistancePoint.x, secondDistancePoint.y);
                            }
                        }
                        else {
                            line.graphics.lineTo(curPoint.x, curPoint.y);
                            if (hitbox) {
                                hitbox.graphics.lineTo(curPoint.x, curPoint.y);
                            }
                        }
                    }
                }

                line.graphics.endStroke();
                if (hitbox) {
                    hitbox.graphics.endStroke();
                }
                line.shadow = this._getShadow();
                line.hitArea = hitbox;

                var bounds = this._calculateBounds();
                line.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
                this.addChild(line);

                this._arrowPoints = points.slice(points.length - 2, points.length);

                if (this._getLabelText() && !this.labelPosition) {
                    var label = gui.label;
                    var first = this.points[0];
                    var second = this.points[1];
                    this.labelPosition = CanvasUtils.pointAtOrthogonalDistance(first, second, label.font_size);
                }
            };

            arcPrototype._drawSelfLoop = function () {
                var destPoint = this.src.getCenter();
                var angle = this._determineLoopAngle();

                var loopRadius = this.src.radius() * 0.75;
                var loopCenter = CanvasUtils.pointAtDistanceAngle(destPoint, angle, loopRadius + this.src.radius());
                var loop = {center: loopCenter, radius: loopRadius};

                var tgPoints = CanvasUtils.tangentPoints(loop, destPoint);

                var firstIntersect = CanvasUtils.circleCenterIntersect(this.src, tgPoints.first);
                var secondIntersect = CanvasUtils.circleCenterIntersect(this.src, tgPoints.second);

                var startLoopAngle = CanvasUtils.circlePointAngle(loop, tgPoints.first);
                var endLoopAngle = CanvasUtils.circlePointAngle(loop, tgPoints.second);

                var gui = this._gui;
                var line = new createjs.Shape();
                line.graphics.setStrokeStyle(gui.line_width).beginStroke(this._getBodyColor())
                    .moveTo(firstIntersect.x, firstIntersect.y)
                    .lineTo(tgPoints.first.x, tgPoints.first.y)
                    .arc(loopCenter.x, loopCenter.y, loopRadius, startLoopAngle, endLoopAngle, false)
                    .lineTo(secondIntersect.x, secondIntersect.y)
                    .endStroke();
                line.shadow = this._getShadow();
                this.addChild(line);

                this._arrowPoints = [tgPoints.second, secondIntersect];

                if (this._getLabelText() && !this.labelPosition) {
                    var label = gui.label;
                    var vector = CanvasUtils.vector(destPoint, loopCenter);
                    this.labelPosition = CanvasUtils.pointAtDistance(loopCenter, vector, loopRadius + label.font_size);
                }
            };
            arcPrototype._determineLoopAngle = function () {
                var angle = 135 - 45 * (this.quadrant || 0);
                if (angle > 0) {
                    angle -= 360;
                }
                return angle;
            };

            arcPrototype._drawArrow = function () {
                var lastPoint = this._arrowPoints[1];
                var prevLastPoint = this._arrowPoints[0];
                var vector = CanvasUtils.vector(lastPoint, prevLastPoint);

                var distancePoint = CanvasUtils.pointAtDistance(lastPoint, vector, 12);
                var stArrowEnd = CanvasUtils.rotate(lastPoint, distancePoint, 22);
                var ndArrowEnd = CanvasUtils.rotate(lastPoint, distancePoint, -22);

                var gui = this._gui;
                var arrow = new createjs.Shape();
                arrow.graphics.setStrokeStyle(gui.line_width).beginStroke(this._getBodyColor())
                    .moveTo(lastPoint.x, lastPoint.y).lineTo(stArrowEnd.x, stArrowEnd.y)
                    .moveTo(lastPoint.x, lastPoint.y).lineTo(ndArrowEnd.x, ndArrowEnd.y)
                    .endStroke();
                this.addChild(arrow);
            };

            arcPrototype._calculateBounds = function () {
                var minX, minY, maxX, maxY;
                _.forEach(this.points, function (point) {
                    if (typeof minX === 'undefined' || point.x < minX) {
                        minX = point.x;
                    }

                    if (typeof minY === 'undefined' || point.y < minY) {
                        minY = point.y;
                    }

                    if (typeof maxX === 'undefined' || point.x > maxX) {
                        maxX = point.x;
                    }

                    if (typeof maxY === 'undefined' || point.y > maxY) {
                        maxY = point.y;
                    }
                });

                return {
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY
                };
            };

            return Arc;
        });
})();