'use strict';

class Unhandled {
  constructor () {
    this.name = 'Unhandled';
    this.message = 'The request was unhandled';
    this.stack = (new Error()).stack;
  }
}

class Timeout {
  constructor () {
    this.name = 'Timeout';
    this.message = 'The request timed out.';
    this.stack = (new Error()).stack;
  }
}

function Request ({ timeout, setTimeout, clearTimeout }) {

  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  const timeout_ = setTimeout(() => reject(new Timeout()), timeout);

  function onReceipt () { clearTimeout(timeout_); }
  function onResponse ({ payload }) { resolve(payload); }

  function onError ({ name, message }) {
    if (name === 'Unhandled') return reject(new Unhandled());
    const error = new Error();
    error.name = name;
    error.message = message;
    reject(error);
  }

  function receive (message) {
    if (message.type === 'receipt') onReceipt(message);
    else if (message.type === 'response') onResponse(message);
    else if (message.type === 'error') onError(message);
  }

  return new (class {
    receive (message) { receive(message); }
    wait () { return promise; }
  })();

}

function Bridge ({ timeout, send, setTimeout, clearTimeout }) {

  const requests = new Map();
  const handlers = new Map();

  async function request (name, payload) {
    const id = Math.random();
    const request = new Request({ timeout, setTimeout, clearTimeout });
    requests.set(id, request);
    send({ id, name, payload, type: 'request' });
    try {
      return await request.wait();
    } catch (error) {
      throw error;
    } finally {
      requests.delete(id);
    }
  }

  async function onRequest ({ id, name, payload }) {
    const handler = handlers.get(name) || (() => { throw new Unhandled(); });
    let response;
    send({ id, type: 'receipt' });
    try { response = await handler(payload); }
    catch (error) {
      send({ id, type: 'error', name: error.name, message: error.message });
      return;
    }
    send({ id, type: 'response', payload: response });
  }

  function receive (message) {
    if (!message) return;
    else if (message.type === 'request') return onRequest(message);
    else if (requests.has(message.id)) return requests.get(message.id).receive(message);
  }

  return new (class {
    request (name, payload) { return request(name, payload); }
    respond (name, callback) { handlers.set(name, callback); }
    get receive () { return receive; }
    get exceptions () { return { Unhandled, Timeout }; }
  })();

}

module.exports = function ({
  timeout = 1000,
  send = () => {},
  setTimeout = typeof setTimeout === 'function' ? setTimeout : (typeof window === 'object' ? window.setTimeout : global.setTimeout),
  clearTimeout = typeof clearTimeout === 'function' ? clearTimeout : (typeof window === 'object' ? window.clearTimeout : global.clearTimeout)
}) {
  return new Bridge({ timeout, send, setTimeout, clearTimeout });
};
