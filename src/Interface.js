'use strict';


class PromisedItem {

  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

}


class Request {

  constructor () {
    this.response = new PromisedItem();
    this.receipt = new PromisedItem();
  }

}



class Bridge {

  constructor (target, { timeout = 100, origin = '*', source = typeof window === 'undefined' ? null : window }) {

    if (!target || !target.addEventListener || !target.postMessage) throw new TypeError('Target must be a DOM window.');
    if (!source || !source.addEventListener || !source.postMessage) throw new TypeError('Source must be a DOM window.');
    if (!origin || typeof origin !== 'string') throw new TypeError('Origin must be a non empty string.');

    this._target = target;
    this._timeout = timeout;
    this._origin = origin;
    this._source = source;

    this._handlers = new Map();
    this._requests = new Map();

    this._target.addEventListener('message', event => this._onMessage(event), false);

  }

  async request (name, payload, transfer=[]) {

    // Generate promises for handshake and response.
    const id = Math.random();
    const request = new Request();

    // Store the request.
    this._requests.set(id, request);

    // Send the message across the interface.
    this._target.postMessage({ id: id, type: 'request', name: name, payload: payload }, this._origin, transfer);

    // Set timeouts for the requests.
    setTimeout(() => {
      this._onError({ id: id, message: 'Request timed out.' });
      this._requests.delete(id);
    }, this._timeout);

    // Wait for handshake and response.
    try {
      await request.handshake.promise;
      const response = await request.response.promise;
      delete this._requests.delete(id);
      return response;
    } catch (error) {
      delete this._requests.delete(id);
      throw new error;
    }
  }

  async respond (name, callback) {
    this._handlers.set(name,callback);
  }


  async _onRequest ({ id, name, payload}) {
    const handler = this._handlers.get(name);
    if (!handler || typeof handler !== 'function') {
      this._target.postMessage({ id: id, type: 'error', message: 'Request was unhandled.' }, this._origin);
      return;
    }
    this._target.postMessage({ id: id, type: 'receipt' });
    try {
      const response = (await handler(payload)) || {};
      this._target.postMessage({ id: id, type: 'response', payload: response.payload }, this._origin, response.transfer);
    } catch (error) {
      this._target.postMessage({ id: id, type: 'error', payload: String(error) }, this._origin);
    }
  }

  _onReceipt ({ id }) {
    if (this._requests.has(id)) this._requests.get(id).receipt.resolve();
  }

  _onResponse ({ id, payload }) {
    if (this._requests.has(id)) this._requests.get(id).response.resolve(payload);
  }

  _onError ({ id, message = 'An unknown error has occured.' }) {
    if (!this._requests.has(id)) return;
    this._requests.get(id).receipt.reject(new Error(message));
    this._requests.get(id).response.reject(new Error(message));
  }

  _onMessage ({ source, origin, data }) {
    if (source !== this._target || (this._origin !== '*' && origin !== this._origin)) {
      this._source.console.debug('Dropping message from unknown source or origin');
    } else if (!data || !data.type) {
      this._source.console.debug('Dropping non-conforming message.');
    } else if (data.type === 'request') {
      this._onRequest(data);
    } else if (data.type === 'receipt') {
      this._onReceipt(data);
    } else if (data.type === 'response') {
      this._onResponse(data);
    } else if (data.type === 'error') {
      this._onError(data);
    } else {
      this._source.console.debug('Dropping message with unknown type.');
    }
  }


}
