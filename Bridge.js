'use strict';

class Unhandled {
  constructor () {
    this.name = 'Unhandled';
    this.message = 'The request was unhandled';
    this.stack = (new Error()).stack;
  }
}

class __UnhandledInternal__ {
  constructor () {
    this.name = '__UnhandledInternal__';
    this.message = 'The request was unhandled';
    this.stack = (new Error()).stack;
  }
}


class ReceiptTimeout {
  constructor () {
    this.name = 'ReceiptTimeout';
    this.message = 'The request timed out waiting for a receipt.';
    this.stack = (new Error()).stack;
  }
}

class ResponseTimeout {
  constructor () {
    this.name = 'RequestTimeout';
    this.message = 'The request timed out waiting for a response';
    this.stack = (new Error()).stack;
  }
}

function parseTimeout(timeout, default_) {
  if (timeout === undefined) return default_;
  if (typeof timeout !== 'number' || isNaN(timeout) || !isFinite(timeout)) {
    throw new TypeError('Timeout must be a finite number.');
  } else if (timeout < 0) {
    throw new RangeError('Timeout must be a positive number.');
  }
  return timeout;
}


function Request ({ timeouts }) {

  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });

  const receiptTimeout = setTimeout(() => reject(new ReceiptTimeout()), timeouts.receipt);
  const responseTimeout = setTimeout(() => reject(new ResponseTimeout()), timeouts.response);

  function receive (message) {
    const { type, payload } = message;
    if (type === 'receipt') {
      clearTimeout(receiptTimeout);
    } else if (type === 'response') {
      clearTimeout(responseTimeout);
      resolve(payload);
    } else if (type === 'error') {
      if (message.name === '__UnhandledInternal__') {
        reject(new Unhandled());
      } else {
        const error = new Error();
        error.name = message.name;
        error.message = message.message;
        reject(error);
      }
    }
  }

  return new (class {
    receive (message) { receive(message); }
    wait () { return promise; }
  })();

}

function Bridge (send, options_) {

  const requests = new Map();
  const handlers = new Map();

  async function request (name, payload, options) {
    options = options || {};
    options.timeouts = options.timeouts || {};
    options.timeouts.receipt = parseTimeout(options.timeouts.receipt, options_.timeouts.receipt);
    options.timeouts.response = parseTimeout(options.timeouts.response, options_.timeouts.response);
    const id = Math.random();
    const request = new Request(options);
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
    let response;
    const handler = handlers.get(name) || (() => { throw new __UnhandledInternal__(); });
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
    request (name, payload, options) { return request(name, payload, options); }
    respond (name, callback) { handlers.set(name, callback); }
    get receive () { return receive; }
    get exceptions () { return { Unhandled, ReceiptTimeout, ResponseTimeout }; }
  })();

}

module.exports = function (send, options) {
  if (typeof send !== 'function') throw new TypeError('Send must be a function.');
  options = options || {};
  options.timeouts = options.timeouts || {};
  options.timeouts.receipt = parseTimeout(options.timeouts.receipt, 1000);
  options.timeouts.response = parseTimeout(options.timeouts.response, 60 * 1000);
  return new Bridge(send, options);
};
