export default class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    emit(event, data=null) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(data));
        }
    }
}