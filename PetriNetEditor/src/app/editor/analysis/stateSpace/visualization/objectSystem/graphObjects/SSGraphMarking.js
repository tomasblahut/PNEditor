'use strict';

(function () {
    angular.module('SSGraphObjects', [
        'CanvasObjects'
    ])
        .factory('SSGraphMarking', function (CanvasObject) {

            function SSGraphMarking(ssMarking) {
                CanvasObject.call(this, ssMarking);

                this.id = _.get(ssMarking, 'id');
                this.name = _.get(ssMarking, 'name');
                this.fullyConnected = _.get(ssMarking, 'fullyConnected');
                this.deadlock = _.get(ssMarking, 'deadlock');
                this.expanded = _.get(ssMarking, 'expanded');
                this.duplicity = _.get(ssMarking, 'duplicity');

                this.snapToPixel = true;
                this.usingCaching = true;
                this.drawObject();
            }

            var markingPrototype = createjs.extend(SSGraphMarking, CanvasObject);
            markingPrototype._gui = {
                radius: 20,
                bodyColor: {normal: '#E6E6E6', deadlock: '#C13B38', notExpanded: '#74BAC0', notConnected: '#FFCF66'},
                border: {
                    width: 2.5,
                    color: {normal: '#575757', deadlock: '#600200', notExpanded: '#479198', notConnected: '#845A00'}
                },
                label: {
                    font: 'Arial',
                    font_size: 16,
                    font_weight: 'normal',
                    color: {normal: '#2E2E2E', deadlock: '#FFFFFF', notExpanded: '#FFFFFF', notConnected: '#323234'}
                }
            };

            markingPrototype.applyChanges = function (ssMarking) {
                this.x = ssMarking.position.x;
                this.y = ssMarking.position.y;

                if (this.expanded !== ssMarking.expanded) {
                    this.expanded = ssMarking.expanded;
                    this.drawObject();
                }
            };
            markingPrototype._doDrawObject = function () {
                var gui = this._gui;

                var background = new createjs.Shape();
                background.graphics
                    .beginFill(this._getBodyColor())
                    .drawCircle(0, 0, gui.radius)
                    .endFill();
                background.setBounds(-gui.radius, -gui.radius, gui.radius * 2, gui.radius * 2);
                this.addChild(background);

                var bgBorder = new createjs.Shape();
                bgBorder.graphics.setStrokeStyle(gui.border.width)
                    .beginStroke(this._getBorderColor())
                    .drawCircle(0, 0, gui.radius)
                    .endStroke();
                this.addChild(bgBorder);

                if (!this.labelPosition) {
                    this.labelPosition = new createjs.Point(0, 0);
                }
            };

            markingPrototype._resolveBodyColor = function () {
                var state = this._resolveState();
                return this._gui.bodyColor[state];
            };
            markingPrototype._resolveBorderColor = function () {
                var state = this._resolveState();
                return this._gui.border.color[state];
            };
            markingPrototype._resolveTextColor = function () {
                var state = this._resolveState();
                return this._gui.label.color[state];
            };
            markingPrototype._resolveState = function () {
                var state = 'normal';
                if (this.deadlock) {
                    state = 'deadlock';
                }
                else if (!this.expanded) {
                    state = 'notExpanded';
                }
                else if (!this.fullyConnected) {
                    state = 'notConnected';
                }
                return state;
            };

            markingPrototype._getLabelText = function () {
                return this.name;
            };
            markingPrototype.radius = function () {
                return this._gui.radius;
            };

            return SSGraphMarking;
        });
})();