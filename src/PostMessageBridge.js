'use strict';

class Request {

  constructor (timeout) {
    this.response = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.timeout = setTimeout(() => this.reject(new Error('The request timed out.')), timeout);
  }

}


module.exports = class {

  constructor ({ source = typeof window === 'undefined' ? null : window, origin = '*',  timeout = 100 }) {

    // Validate options.
    if (!source || !source.addEventListener || !source.postMessage) throw new TypeError('Source must be a DOM window.');
    if (!origin || typeof origin !== 'string') throw new TypeError('Origin must be a non empty string.');
    if (isNaN(parseFloat(timeout)) || !isFinite(timeout) || timeout < 0) throw new TypeError('Timeout must be a number greater than 0.');

    // Assign options.
    this._source = source;
    this._origin = origin;
    this._timeout = timeout;

    // Initialize.
    this._target = null;
    this._handlers = new Map();
    this._requests = new Map();
    this._listener = event => this._onMessage(event);

  }

  connect (target) {
    this.disconnect();
    if (!target || !target.addEventListener || !target.postMessage) throw new TypeError('Target must be a DOM window.');
    this._target = target;
    this._target.addEventListener('message', this._listener, false);
  }

  disconnect () {
    if (this._target) this._target.removeEventListener('message', this._listener);
  }

  register (name, handler) {
    this._handlers.set(name, handler);
  }

  unregister (name) {
    this._handlers.delete(name);
  }

  async request (name, payload, transfer=[]) {

    // Ensure the interface is connected.
    if (!this._target) throw new Error('Interface is not connected.');

    // Generate promises for handshake and response.
    const id = Math.random();
    const request = new Request();

    // Store the request.
    this._requests.set(id, request);

    // Send the message across the interface.
    this._send({ id, type: 'request', name, payload, transfer });

    // Wait for the response.
    return await request.response;

  }


  async _onRequest ({ id, name, payload }) {
    if (!this._handlers.has(name)) return this._send({ id, type: 'error', payload: 'Request was unhandled' });
    this._send({ id, type: 'receipt' });
    try {
      const response = (await this._handlers.get(name)(payload)) || {};
      this._send({ id, type: 'response', payload: response.payload, transfer: response.transfer });
    } catch (error) {
      this._send({ id, type: 'error', payload: String(error) });
    }
  }

  _send({ id, type, payload, transfer }) {
    if (this._target) this._target.postMessage({ id, type, payload }, this._origin, transfer);
  }


  _onReceipt ({ id }) {
    if (!this._requests.has(id)) return;
    clearTimeout(this._requests.get(id).timeout);
  }

  _onResponse ({ id, payload }) {
    if (!this._requests.has(id)) return;
    this._requests.get(id).response.resolve(payload);
    this._requests.delete(id);
  }

  _onError ({ id, message = 'An unknown error has occured.' }) {
    if (!this._requests.has(id)) return;
    this._requests.get(id).reject(new Error(message));
    this._requests.delete(id);
  }

  _onMessage ({ source, origin, data }) {
    if (!this._target || source !== this._target || (this._origin !== '*' && origin !== this._origin)) {
      return this._source.console.debug('Dropping message from unknown source or origin');
    } else if (!data || !data.type) {
      return this._source.console.debug('Dropping non-conforming message.');
    }

    if (data.type === 'request') return this._onRequest(data);
    else if (data.type === 'receipt') return this._onReceipt(data);
    else if (data.type === 'response') return this._onResponse(data);
    else if (data.type === 'error') return this._onError(data);
    else this._source.console.debug('Dropping message with unknown type.');
  }


};
