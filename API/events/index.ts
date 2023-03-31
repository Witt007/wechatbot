import {EventEmitter} from 'node:events'
const evEmitter=new EventEmitter()
export default evEmitter 

enum eventName {
ons
}

export class MyEmitter {
   ev:EventEmitter
    events:{[index:string]:Function[]}
    constructor() {
      this.events = {};
      this.ev=new EventEmitter()
    }
  
    on<T>(event:eventName, listener:()=>T) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(listener);
    }
  
    emit(event:eventName, ...args:[]) {
      const listeners = this.events[event];
      if (listeners) {
        listeners.forEach((listener) => {
          listener(...args);
        });
      }
    }
  
    removeListener(event:eventName, listenerToRemove:Function) {
      const listeners = this.events[event];
      if (listeners) {
        this.events[event] = listeners.filter((listener) => {
          return listener !== listenerToRemove;
        });
      }
    }
  }