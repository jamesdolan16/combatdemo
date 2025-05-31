export default class InitManager {
    constructor() {
        this._queue = new Set();
    }

    run(promise) {
        this._queue.add(promise);
        promise.finally(() => this._queue.delete(promise));
        return promise;
    }

    get pending() {
        return this._queue.size;
    }

    get isIdle() {
        return this._queue.size === 0;
    }

    async waitAll() {
        await Promise.all([...this._queue]);
    }
}
