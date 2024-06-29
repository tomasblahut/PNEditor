'use strict';

(function () {
    angular.module('CanvasObjects', [])
        .factory('CanvasObject', function () {

            function CanvasObject(args) {
                this.Super_constructor();

                this.labelPosition = _.get(args, 'labelPosition');
                this.usingTextBackground = false;
                this.usingCaching = false;

                this.cursor = 'pointer';
                this.mouseChildren = false;
            }

            var drawablePrototype = createjs.extend(CanvasObject, createjs.Container);

            drawablePrototype.drawObject = function () {
                this.removeAllChildren();
                this._doDrawObject();
                this._drawTextLabel();

                if (this.usingCaching) {
                    this.snapToPixel = true;
                    this._cacheThis();
                }
            };
            drawablePrototype._doDrawObject = function () {
                throw new Error('Method doDrawObject not implemented');
            };

            //-- Caching
            drawablePrototype._cacheThis = function () {
                var displayOffset = 5;
                if (this.cacheID) {
                    this.updateCache();
                }
                else {
                    var bounds = this.getBounds();
                    var boundsToCache = {
                        x: bounds.x - displayOffset,
                        y: bounds.y - displayOffset,
                        width: bounds.width + 2 * displayOffset,
                        height: bounds.height + 2 * displayOffset
                    };
                    this.cache(boundsToCache.x, boundsToCache.y, boundsToCache.width, boundsToCache.height, 2);
                }
            };

            //-- Highlighting
            drawablePrototype._getBodyColor = function () {
                var color = this._resolveBodyColor();
                var bodyHighlight = _.get(this, '_highlight.gui.body');
                if (bodyHighlight) {
                    color = bodyHighlight;
                }
                return color;
            };
            drawablePrototype._resolveBodyColor = function () {
                return _.get(this, '_gui.bodyColor');
            };

            drawablePrototype._getShadow = function () {
                var shadow = this._resolveShadow();
                var shadowHighlight = _.get(this, '_highlight.gui.shadow');
                if (shadowHighlight) {
                    shadow = new createjs.Shadow(shadowHighlight, 0, 0, 10);
                }
                return shadow;
            };
            drawablePrototype._resolveShadow = function () {
                var shadowColor = _.get(this, '_gui.shadowColor');
                if (shadowColor) {
                    return new createjs.Shadow(shadowColor, 1, 2, 5);
                }
            };

            drawablePrototype._getBorderColor = function () {
                var color = this._resolveBorderColor();
                var borderHighlight = _.get(this, '_highlight.gui.border');
                if (borderHighlight) {
                    color = borderHighlight;
                }
                return color;
            };
            drawablePrototype._resolveBorderColor = function () {
                return _.get(this, '_gui.border.color');
            };

            drawablePrototype._getTextColor = function () {
                var color = this._resolveTextColor();
                var textHighlight = _.get(this, '_highlight.gui.text');
                if (textHighlight) {
                    color = textHighlight;
                }
                return color;
            };
            drawablePrototype._resolveTextColor = function () {
                return _.get(this, '_gui.label.color');
            };

            drawablePrototype._getDataTextColor = function () {
                var color = this._resolveDataTextColor();
                var dataTextHighlight = _.get(this, '_highlight.gui.data');
                if (dataTextHighlight) {
                    color = dataTextHighlight;
                }
                return color;
            };
            drawablePrototype._resolveDataTextColor = function () {
                return _.get(this, '_gui.label.color');
            };

            drawablePrototype.setHighlight = function (highlight) {
                this._highlight = highlight;
                this.drawObject();
            };

            //-- Object label
            drawablePrototype._getLabelText = function () {
                return undefined;
            };
            drawablePrototype._drawTextLabel = function () {
                var labelText = this._getLabelText();
                if (!labelText) {
                    delete this._label;
                    delete this._textBackground;
                    return;
                }


                var labelSettings = this._gui.label;
                var textLabel = new createjs.Text(labelText, labelSettings.font_weight + ' ' +
                    labelSettings.font_size + 'px ' + labelSettings.font, this._getTextColor());
                textLabel.textBaseline = "middle";
                textLabel.textAlign = "center";
                textLabel.x = this.labelPosition.x;
                textLabel.y = this.labelPosition.y;

                var textWidth = textLabel.getMeasuredWidth();
                var textHeight = textLabel.getMeasuredHeight();
                var textBounds = {
                    x: (-textWidth / 2) - 2,
                    y: (-textHeight / 2) - 2,
                    width: textWidth + 2,
                    height: textHeight + 2
                };
                textLabel.setBounds(textBounds.x, textBounds.y, textBounds.width, textBounds.height);
                textLabel.cache(textBounds.x, textBounds.y, textBounds.width, textBounds.height, 2);

                var textBackground = new createjs.Shape();
                textBackground.graphics.beginFill('#FFFFFF')
                    .drawRect(textBounds.x, textBounds.y, textBounds.width, textBounds.height)
                    .endFill();
                textLabel.hitArea = textBackground;
                this._label = textLabel;

                this._textBackground = textBackground;
                if (this.usingTextBackground) {
                    textBackground.x = textLabel.x;
                    textBackground.y = textLabel.y;
                    this.addChild(textBackground);
                }
                this.addChild(textLabel);
            };
            drawablePrototype.moveLabel = function (position) {
                if (this._label) {
                    this.labelPosition = this.globalToLocal(position.x, position.y);
                    this._label.x = this.labelPosition.x;
                    this._label.y = this.labelPosition.y;
                    this._textBackground.x = this.labelPosition.x;
                    this._textBackground.y = this.labelPosition.y;
                }
            };
            drawablePrototype.getLabelGlobalPosition = function () {
                var position;
                if (this.labelPosition) {
                    position = this.localToGlobal(this.labelPosition.x, this.labelPosition.y);
                }
                return position;
            };

            //-- Object common attributes
            drawablePrototype.rotate = function (angle) {
                this._objRotation = angle;
                this.drawObject();
            };
            drawablePrototype.getRotation = function (clockwise) {
                var angle = 360 - (this._objRotation || 0);
                if (clockwise) {
                    angle = 360 - angle;
                }

                return angle;
            };
            drawablePrototype.getCenter = function () {
                return new createjs.Point(this.x, this.y);
            };
            drawablePrototype.getGlobalCenter = function () {
                return this.localToGlobal(0, 0);
            };

            return createjs.promote(CanvasObject, "Super");
        });
})();