'use strict';

module.exports.create = ({ 

  requestTimeout = 500,
  connectionTimeout = 5000,
  source = typeof window === 'undefined' ? null : window 

}) => {

  let target;
  let origin;

  const requests = new Map();
  const handlers = new Map();

  function send({ id, name, type, payload, transfer=[] }) {
    target.postMessage({ id, name, type, payload }, origin, transfer);
  }

  // Request
  function Request () {
    this.promise = new Promise((a, b) => { this.resolve = a; this.reject = b; });
    this.timeout = setTimeout(() => this.reject('unhandled'), requestTimeout);
  }

  // Connection 
  const connection = (function () {

    let status, promise, resolve, reject, timeout;

    function reset () {
      status = false;
      if (reject) reject();
      promise = new Promise((a, b) => { resolve = a; reject = b; });
      timeout = setTimeout(reject, connectionTimeout);
    }

    function onPing () {
      status = true;
      clearTimeout(timeout);
      timeout = setTimeout(reset, connectionTimeout);
      resolve();
    }

    class Connection {
      get status () { return status; }
      get promise () { return promise; }
      reset () { reset(); }
      onPing () { onPing(); }
    }

    reset();
    setInterval(() => send({ type: 'ping' }), 1000);

    return new Connection();

  })();


  // Message Handling
  (function () {

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
      else if (message.data.type === 'ping') connection.onPing(message);
    }
    
    source.addEventListener('message', onMessage, false);

  });


  return new class {

    bind (target_, origin_) {
      connection.reset();
      target = target_;
      origin = origin_;
    }

    get handlers () {
      return handlers;
    }

    async request (name, payload, transfer) {
      await connection.promise;
      const id = Math.random();
      const request = new Request();
      requests.set(id, request);
      send({ id, type: 'request', name, payload, transfer });
      return await request.promise;
    }

  };

};
