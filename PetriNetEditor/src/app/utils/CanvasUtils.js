'use strict';

var CanvasUtils = {};

(function () {

    CanvasUtils.RIGHT_NORMAL_VECTOR = new Vector(1, 0);
    CanvasUtils.ZERO_VECTOR = new Vector(0, 0);

    CanvasUtils.vector = function (src, dest) {
        return new Vector(dest.x - src.x, dest.y - src.y);
    };
    CanvasUtils.orthogonalVector = function (vector) {
        return new Vector(vector.y * -1, vector.x);
    };
    CanvasUtils.oppositeVector = function (vector) {
        return new Vector(vector.x * -1, vector.y * -1);
    };
    CanvasUtils.normalizeVector = function (vector) {
        var lenght = this.distance({x: 0, y: 0}, vector);
        return new Vector(vector.x / lenght, vector.y / lenght);
    };
    CanvasUtils.radians = function (degrees) {
        return degrees * Math.PI / 180;
    };
    CanvasUtils.degrees = function (radians) {
        return radians * 180 / Math.PI;
    };
    CanvasUtils.distance = function (from, to) {
        return Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    };
    CanvasUtils.midpoint = function (from, to) {
        return {x: (from.x + to.x) / 2, y: (from.y + to.y) / 2};
    };
    CanvasUtils.pointAlongVector = function (vector, point) {
        return {x: point.x + vector.x, y: point.y + vector.y};
    };
    CanvasUtils.moveAlongVector = function (vector, points) {
        var arcPoints = [].concat(points);
        for (var index = 0; index < arcPoints.length; index++) {
            var point = arcPoints[index];
            var newPoint = CanvasUtils.pointAlongVector(vector, point);
            point.x = newPoint.x;
            point.y = newPoint.y;
        }
    };
    CanvasUtils.pointAtDistance = function (point, vector, distance) {
        var normalizedVector = this.normalizeVector(vector);
        var distanceVector = {x: normalizedVector.x * distance, y: normalizedVector.y * distance};
        return {x: point.x + distanceVector.x, y: point.y + distanceVector.y};
    };
    CanvasUtils.pointAtDistanceAngle = function (point, angle, distance) {
        var distancePoint = this.pointAtDistance(point, CanvasUtils.RIGHT_NORMAL_VECTOR, distance);
        return this.rotate(point, distancePoint, angle);
    };
    CanvasUtils.pointAtOrthogonalDistance = function (from, to, distance, pointPosition) {
        var length = this.distance(from, to);
        var intersectPoint = this.pointAtDistance(to, this.vector(to, from), length * (pointPosition || 0.5));
        var vector = this.vector(from, to);
        vector = this.orthogonalVector(vector);

        return this.pointAtDistance(intersectPoint, vector, distance);
    };
    CanvasUtils.rotate = function (rotCenter, srcPoint, angle) {
        //transform coordinates of rotating point
        var tSrcX = srcPoint.x - rotCenter.x;
        var tSrcY = (srcPoint.y - rotCenter.y) * -1;

        //calculate rotated point
        var radAngle = this.radians(angle || 0);

        var rotX = (tSrcX * Math.cos(radAngle)) - (tSrcY * Math.sin(radAngle));
        var rotY = (tSrcX * Math.sin(radAngle)) + (tSrcY * Math.cos(radAngle));

        //transform it back to original place
        return {x: rotX + rotCenter.x, y: (rotY * -1) + rotCenter.y};
    };
    CanvasUtils.shapeCenterIntersect = function (shape, destPoint) {
        var intersect;
        if (shape.type === 'place') {
            intersect = this.circleCenterIntersect(shape, destPoint);
        }
        else if (shape.type === 'transition') {
            intersect = this.rectCenterIntersect(shape, destPoint);
        }

        if (!intersect) {
            intersect = {};
        }

        var interX = intersect.x;
        if (interX === null || isNaN(interX)) {
            intersect.x = destPoint.x;
        }
        var interY = intersect.y;
        if (interY === null || isNaN(interY)) {
            intersect.y = destPoint.y;
        }

        return intersect;
    };
    CanvasUtils.rectCenterIntersect = function (rect, destPoint) {
        var center = typeof rect.getCenter === 'function' ? rect.getCenter() : rect.center;
        var width = typeof rect.width === 'function' ? rect.width() : rect.width;
        var height = typeof rect.height === 'function' ? rect.height() : rect.height;

        var rotation = typeof rect.getRotation === 'function' ? rect.getRotation() : rect.rotation;
        var tr = this.rotate(center, {x: center.x + width / 2, y: center.y - height / 2}, rotation);
        var tl = this.rotate(center, {x: center.x - width / 2, y: center.y - height / 2}, rotation);
        var bl = this.rotate(center, {x: center.x - width / 2, y: center.y + height / 2}, rotation);
        var br = this.rotate(center, {x: center.x + width / 2, y: center.y + height / 2}, rotation);

        var midToDestLine = {start: center, end: destPoint};
        var perimeter = [{start: tr, end: tl}, {start: tl, end: bl},
            {start: bl, end: br}, {start: br, end: tr}];

        var intersect = null;
        for (var index = 0; index < perimeter.length; index++) {
            var line = perimeter[index];

            var touchPoint = CanvasUtils.intersect(line, midToDestLine, true);
            if (touchPoint) {
                intersect = touchPoint;
                break;
            }
        }

        return intersect;
    };
    CanvasUtils.circleCenterIntersect = function (circle, destPoint) {
        var circleCenter = typeof circle.getCenter === 'function' ? circle.getCenter() : circle.center;
        var radius = typeof circle.radius === 'function' ? circle.radius() : circle.radius;
        if (this.distance(circleCenter, destPoint) < radius) {
            return null;
        }

        var angle = Math.atan2(circleCenter.y - destPoint.y, destPoint.x - circleCenter.x) - Math.atan2(0, 1);
        if (angle < 0) {
            angle += 2 * Math.PI;
        }
        angle = this.degrees(angle);

        return this.rotate(circleCenter, {
            x: circleCenter.x + radius,
            y: circleCenter.y
        }, angle);
    };
    CanvasUtils.intersect = function (lineOne, lineTwo, segmentsOnly) {
        var xs1 = lineOne.start.x, ys1 = lineOne.start.y, xe1 = lineOne.end.x, ye1 = lineOne.end.y,
            xs2 = lineTwo.start.x, ys2 = lineTwo.start.y, xe2 = lineTwo.end.x, ye2 = lineTwo.end.y;

        var intersection = null;
        var denominator = ((ye2 - ys2) * (xe1 - xs1)) - ((xe2 - xs2) * (ye1 - ys1));

        if (denominator !== 0) {
            var a = ys1 - ys2,
                b = xs1 - xs2,
                numerator1 = ((xe2 - xs2) * a) - ((ye2 - ys2) * b),
                numerator2 = ((xe1 - xs1) * a) - ((ye1 - ys1) * b);

            a = numerator1 / denominator;
            b = numerator2 / denominator;
            var point = {x: xs1 + (a * (xe1 - xs1)), y: ys1 + (a * (ye1 - ys1))};

            var onSegments = a >= 0 && a <= 1 && b >= 0 && b <= 1;
            if (!segmentsOnly || onSegments) {
                intersection = point;
            }
        }

        return intersection;
    };
    CanvasUtils.tangentPoints = function (circle, destPoint) {
        var radius = typeof circle.radius === 'function' ? circle.radius() : circle.radius;
        var circleCenter = typeof circle.getCenter === 'function' ? circle.getCenter() : circle.center;

        var dx = circleCenter.x - destPoint.x;
        var dy = circleCenter.y - destPoint.y;
        var dDistance = Math.sqrt(dx * dx + dy * dy);

        var a = Math.asin(radius / dDistance);
        var b = Math.atan2(dy, dx);

        var t = b - a;
        var tangentA = {x: circleCenter.x + (radius * Math.sin(t)), y: circleCenter.y + (radius * -Math.cos(t))};

        t = b + a;
        var tangentB = {x: circleCenter.x + (radius * -Math.sin(t)), y: circleCenter.y + (radius * Math.cos(t))};

        return {first: tangentA, second: tangentB};
    };
    CanvasUtils.circlePointAngle = function (circle, point, degrees) {
        var circleCenter = typeof circle.getCenter === 'function' ? circle.getCenter() : circle.center;
        var angle = Math.atan2(point.y - circleCenter.y, point.x - circleCenter.x);
        if (angle < 0) {
            angle += 2 * Math.PI;
        }

        return degrees ? this.degrees(angle) : angle;
    };
    CanvasUtils.vectorAngle = function (vectorOne, vectorTwo, degrees) {
        var lengthOne = vectorOne.getLength();
        var lengthTwo = vectorTwo.getLength();

        var cos = (vectorOne.x * vectorTwo.x + vectorOne.y * vectorTwo.y) / (lengthOne * lengthTwo);
        var angle = Math.acos(cos);
        if (angle < 0) {
            angle += 2 * Math.PI;
        }

        return degrees ? this.degrees(angle) : angle;
    };
    CanvasUtils.liesOnSegment = function (segStart, segEnd, point) {
        var segLenght = Math.floor(this.distance(segStart, segEnd));
        var toStartDist = this.distance(segStart, point);
        var toEndDist = this.distance(segEnd, point);

        return segLenght === Math.floor(toStartDist + toEndDist);
    };
    CanvasUtils.liesOnLine = function (pointOne, pointTwo, point) {
        var stVector = this.vector(pointOne, point);
        var ndVector = this.vector(pointOne, pointTwo);
        var cross = stVector.x * ndVector.y - stVector.y * ndVector.x;
        return cross === 0;
    };

    //=========================
    //-- Vector
    //=========================

    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }

    Vector.prototype.isZero = function () {
        return this.x === 0 && this.y === 0;
    };
    Vector.prototype.getLength = function () {
        var length = Math.pow(this.x, 2) + Math.pow(this.y, 2);
        return Math.sqrt(length);
    };
    Vector.prototype.clone = function () {
        return new Vector(this.x, this.y);
    };

    CanvasUtils.Vector = Vector;
}());