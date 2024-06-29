'use strict';

(function () {
    angular.module('MementoModules')
        .factory('PNMemento', function (CanvasModule) {

            function PNMemento() {
                CanvasModule.call(this);
            }
            
            var modulePrototype = createjs.extend(PNMemento, CanvasModule);
            
            var stack = [];
            var cursor = -1;
            
            // Returns true, if the undo operation is possible, otherwise false.
            modulePrototype.canUndo = function () {
            	if (stack.length === 0) return false;
            	return !this.atTail();
            };
            // Returns true, if the redo operation is possible, otherwise false.
            modulePrototype.canRedo = function () {
            	if (stack.length === 0) return false;
            	return !this.atHead();
            };
            // Performs undo operation. Returns the previous state of the Petri net.
            modulePrototype.undo = function () {
            	return this.prev();
            };
            // Performs redo operation. Returns the next state of the Petri net.
            modulePrototype.redo = function () {
            	return this.next();
            };
            // Adds new memento object to the stack.
            modulePrototype.push = function (petriNet) {
            	this.put(petriNet);
            };
            
            // Returns true, if the cursor is at 0, otherwise false.
            modulePrototype.atTail = function () {
            	if (cursor > 0) {
            		return false;
            	}
            	return true;
            };
            // Returns true, if the cursor is pointing to the newest memento object, otherwise false.
            modulePrototype.atHead = function () {
            	if (cursor == stack.length - 1) {
            		return true;
            	}
            	return false;
            };
            // Lowers the cursor by 1 and returns the memento object at stack[cursor].
            modulePrototype.prev = function () {
            	if (!this.atTail()) {
            		cursor--;
            		return angular.copy(stack[cursor]);
            	}
            };
            // Increases the cursor by 1 and returns the memento object at stack[cursor].
            modulePrototype.next = function () {
            	if (!this.atHead()) {
            		cursor++;
            		return angular.copy(stack[cursor]);
            	}
            };
            // Adds new Petri net to the memento stack.
            modulePrototype.put = function (petriNet) {
            	if (cursor < stack.length - 1) {
            		stack = stack.slice(0, cursor + 1);
            	}
            	cursor++;
            	stack.push(angular.copy(petriNet));
            };

            return PNMemento;
        });
}());
