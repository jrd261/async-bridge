'use strict';

module.exports = function ({ source, timeout }) {

  let target;
  let origin;

  const handlers = new Map();
  const requests = new Map();

  function Request () {
    this.promise = new Promise((a, b) => { this.resolve = a; this.reject = b; });
    this.timeout = setTimeout(() => this.reject('unhandled'), timeout);
  }

  function send({ id, name, type, payload, transfer=[] }) {
    target.postMessage({ id, name, type, payload }, origin, transfer);
  }

  function onReceipt ({ id }) {
    if (!requests.has(id)) return;
    clearTimeout(requests.get(id).timeout);
  }

  function onResponse ({ id, payload }) {
    if (!requests.has(id)) return;
    requests.get(id).resolve(payload);
    requests.delete(id);
  }

  function onError ({ id, payload }) {
    if (!requests.has(id)) return;
    requests.get(id).reject(new Error(payload));
    requests.delete(id);
  }

  async function onRequest ({ id, name, payload }) {
    if (!handlers.has(name)) return send({ id, type: 'error', payload: 'unhandled' });
    send({ id, type: 'receipt' });
    try {
      const response = (await handlers.get(name)(payload)) || {};
      send({ id, type: 'response', payload: response.payload, transfer: response.transfer });
    } catch (error) {
      send({ id, type: 'error', payload: String(error) });
    }
  }

  function onMessage (message) {
    if (message.source !== target || (message.origin !== origin && origin !== '*') || (!message.data || !message.data.type)) return;
    else if (message.data.type === 'receipt') onReceipt(message.data);
    else if (message.data.type === 'response') onResponse(message.data);
    else if (message.data.type === 'error') onError(message.data);
    else if (message.data.type === 'request') onRequest(message.data);
  }

  source.addEventListener('message', onMessage, false);

  return new class {

    bind (target_, origin_) {
      target = target_;
      origin = origin_;
    }

    get handlers () {
      return handlers;
    }

    async request (name, payload, transfer) {
      const id = Math.random();
      const request = new Request();
      requests.set(id, request);
      send({ id, type: 'request', name: name, payload, transfer });
      return await request.promise;
    }

  };

};
