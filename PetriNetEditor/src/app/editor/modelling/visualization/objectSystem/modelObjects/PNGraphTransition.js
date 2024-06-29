'use strict';

(function () {
    angular.module('PNModelObjects')
        .factory('PNGraphTransition', function (CanvasObject) {

            function PNGraphTransition(pnTransition) {
                CanvasObject.call(this, pnTransition);

                this.id = pnTransition.id;
                this.name = pnTransition.name;
                this._objRotation = _.get(pnTransition, 'gui.rotation') || 0;

                this.drawObject();
            }

            var transitionPrototype = createjs.extend(PNGraphTransition, CanvasObject);
            transitionPrototype._gui = {
                width: 15,
                height: 40,
                bodyColor: '#2E2E2E',
                shadowColor: '#656565',
                border: {
                    width: 2.5,
                    color: '#2E2E2E'
                },
                label: {
                    font: 'Arial',
                    font_size: 20,
                    font_weight: 'normal',
                    color: '#2E2E2E'
                }
            };

            transitionPrototype.applyChanges = function (pnTransition) {
                this.x = pnTransition.position.x;
                this.y = pnTransition.position.y;
                this.labelPosition = pnTransition.labelPosition;

                var newRotation = _.get(pnTransition, 'gui.rotation') || 0;
                if (this._objRotation !== newRotation) {
                    this._objRotation = newRotation;
                    this.drawObject();
                }
            };
            transitionPrototype._doDrawObject = function () {
                var gui = this._gui;
                var border = gui.border;

                var startX = -(gui.width / 2);
                var startY = -(gui.height / 2);
                var background = new createjs.Shape();
                background.graphics
                    .beginFill(this._getBodyColor())
                    .drawRect(startX, startY, gui.width, gui.height)
                    .endFill();
                background.shadow = this._getShadow();
                background.rotation = this._objRotation;
                background.setBounds(-gui.width / 2, -gui.height / 2, gui.width, gui.height);
                this.addChild(background);

                var bgBorder = new createjs.Shape();
                bgBorder.graphics.setStrokeStyle(border.width)
                    .beginStroke(this._getBorderColor())
                    .drawRect(startX, startY, gui.width, gui.height)
                    .endStroke();
                bgBorder.rotation = this._objRotation;
                this.addChild(bgBorder);

                if (this._highlight && this._highlight.data) {
                    var highLightText = new createjs.Text(this._highlight.data, 'bold 15px Arial', this._getDataTextColor());
                    highLightText.textBaseline = 'middle';
                    highLightText.textAlign = 'center';
                    highLightText.x = 0;
                    highLightText.y = 0;
                    this.addChild(highLightText);
                }

                if (!this.labelPosition) {
                    this.labelPosition = new createjs.Point(0, gui.height / 2 + 15);
                }
            };

            transitionPrototype._getLabelText = function () {
                return this.name;
            };

            transitionPrototype.width = function () {
                return this._gui.width;
            };
            transitionPrototype.height = function () {
                return this._gui.height;
            };

            return PNGraphTransition;
        });
})();