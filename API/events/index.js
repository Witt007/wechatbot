"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyEmitter = void 0;
const node_events_1 = require("node:events");
const evEmitter = new node_events_1.EventEmitter();
exports.default = evEmitter;
var eventName;
(function (eventName) {
    eventName[eventName["ons"] = 0] = "ons";
})(eventName || (eventName = {}));
class MyEmitter {
    constructor() {
        this.events = {};
        this.ev = new node_events_1.EventEmitter();
    }
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }
    emit(event, ...args) {
        const listeners = this.events[event];
        if (listeners) {
            listeners.forEach((listener) => {
                listener(...args);
            });
        }
    }
    removeListener(event, listenerToRemove) {
        const listeners = this.events[event];
        if (listeners) {
            this.events[event] = listeners.filter((listener) => {
                return listener !== listenerToRemove;
            });
        }
    }
}
exports.MyEmitter = MyEmitter;
