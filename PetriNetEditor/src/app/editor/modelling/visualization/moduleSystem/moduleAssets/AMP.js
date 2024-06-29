'use strict';

(function () {
    angular.module('PNModuleAssets', [])
        .factory('AMP', function () {

            function AMP(args) {
                this.position = args.point;
                var arc = args.arc;

                var pointIndex = arc.points.indexOf(this.position);
                var firstItem = pointIndex === 0, lastItem = pointIndex === arc.points.length - 1;
                if (firstItem || lastItem) {
                    if (firstItem) {
                        this.magnetic = arc.srcMagnetic;
                        this.connectedObject = arc.src;
                        this.startOfArc = true;
                    }

                    if (lastItem) {
                        this.magnetic = arc.destMagnetic;
                        this.connectedObject = arc.dest;
                        this.startOfArc = false;
                    }
                }

                this.updateOriginData();
            }

            AMP.prototype.assignGuiComponent = function (guiAmp) {
                this._guiAmp = guiAmp;
            };

            AMP.prototype.moveTo = function (point) {
                this._updatePosition(point);

                var prevAMP = this.previous;
                if (prevAMP && prevAMP.connectedObject && !prevAMP.magnetic) {
                    var newPrevPos = CanvasUtils.shapeCenterIntersect(prevAMP.connectedObject, this.position);
                    prevAMP._updatePosition(newPrevPos);
                }

                var nextAMP = this.next;
                if (nextAMP && nextAMP.connectedObject && !nextAMP.magnetic) {
                    var newNextPos = CanvasUtils.shapeCenterIntersect(nextAMP.connectedObject, this.position);
                    nextAMP._updatePosition(newNextPos);
                }
            };
            AMP.prototype._updatePosition = function (point) {
                this.position.x = point.x;
                this.position.y = point.y;

                if (this._guiAmp) {
                    this._guiAmp.x = point.x;
                    this._guiAmp.y = point.y;
                }
            };

            AMP.prototype.applyChanges = function (arc) {
                if (!this.changesOccured()) {
                    return;
                }

                var amp = this;
                arc.connectionChanges = {
                    magnets: {
                        new: {
                            srcMagnetic: amp.startOfArc ? amp.magnetic : arc.srcMagnetic,
                            destMagnetic: amp.startOfArc ? arc.destMagnetic : amp.magnetic
                        },
                        old: {
                            srcMagnetic: arc.srcMagnetic,
                            destMagnetic: arc.destMagnetic
                        }
                    }
                };
                arc.srcMagnetic = arc.connectionChanges.magnets.new.srcMagnetic;
                arc.destMagnetic = arc.connectionChanges.magnets.new.destMagnetic;

                if (this._connectedObjChanged()) {
                    arc.connectionChanges.objects = {
                        new: {
                            srcObj: amp.startOfArc ? amp.connectedObject : arc.src,
                            destObj: amp.startOfArc ? arc.dest : amp.connectedObject
                        },
                        old: {
                            srcObj: arc.src,
                            destObj: arc.dest
                        }
                    };
                    arc.src = arc.connectionChanges.objects.new.srcObj;
                    arc.dest = arc.connectionChanges.objects.new.destObj;
                }
            };
            AMP.prototype.changesOccured = function () {
                var changeOccured = this.position.x !== this._originalPosition.x || this.position.y !== this._originalPosition.y;
                changeOccured = changeOccured || (this._originalMagnetic !== this.magnetic);
                changeOccured = changeOccured || this._connectedObjChanged();
                return changeOccured;
            };
            AMP.prototype._connectedObjChanged = function () {
                var changeOccured = false;

                if ((this._originalConObj && !this.connectedObject) || (!this._originalConObj && this.connectedObject)) {
                    changeOccured = true;
                }
                else if (this._originalConObj && this.connectedObject) {
                    changeOccured = this._originalConObj.id !== this.connectedObject.id;
                }

                return changeOccured;
            };

            AMP.prototype.resetToOrigin = function (arc) {
                this.magnetic = this._originalMagnetic;
                this.connectedObject = this._originalConObj;
                this.moveTo(this._originalPosition);

                if (arc && arc.connectionChanges) {
                    var magnets = arc.connectionChanges.magnets;
                    var objects = arc.connectionChanges.objects;

                    arc.srcMagnetic = magnets.old.srcMagnetic;
                    arc.destMagnetic = magnets.old.destMagnetic;
                    arc.src = objects.old.srcObj;
                    arc.dest = objects.old.destObj;
                }
            };
            AMP.prototype.adjustNeighborsAfterRemoval = function () {
                var prev = this.previous;
                var next = this.next;

                if (prev && next) {
                    prev.next = next;
                    next.previous = prev;

                    var borderAMP, neighborPosition;
                    if (prev.connectedObject && !prev.magnetic) {
                        borderAMP = prev;
                        neighborPosition = prev.next.getCalcPosition();
                    }
                    else if (next.connectedObject && !next.magnetic) {
                        borderAMP = next;
                        neighborPosition = next.previous.getCalcPosition();
                    }

                    if (borderAMP) {
                        var newPos = CanvasUtils.shapeCenterIntersect(borderAMP.connectedObject, neighborPosition);
                        borderAMP.moveTo(newPos);
                    }
                }
            };
            AMP.prototype.updateOriginData = function () {
                this._originalPosition = _.clone(this.position);

                var prevAMP = this.previous;
                if (prevAMP && prevAMP.connectedObject && !prevAMP.magnetic) {
                    prevAMP._originalPosition = _.clone(prevAMP.position);
                }

                var nextAMP = this.next;
                if (nextAMP && nextAMP.connectedObject && !nextAMP.magnetic) {
                    nextAMP._originalPosition = _.clone(nextAMP.position);
                }


                this._originalMagnetic = this.magnetic;
                this._originalConObj = this.connectedObject;
            };

            AMP.prototype.getCalcPosition = function () {
                var position = this.position;
                if (this.connectedObject && !this.magnetic) {
                    position = this.connectedObject.getCenter();
                }

                return position;
            };

            return AMP;
        });
}());