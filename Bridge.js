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

class RequestTimeout {
  constructor () {
    this.name = 'RequestTimeout';
    this.message = 'The request timed out waiting for a response';
    this.stack = (new Error()).stack;
  }
}


function Request ({ receiptTimeout, requestTimeout }) {

  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });

  const receiptTimeoutId = setTimeout(() => reject(new ReceiptTimeout()), receiptTimeout);
  const requestTimeoutId = setTimeout(() => reject(new RequestTimeout()), requestTimeout);

  function receive (message) {
    const { type, payload } = message;
    if (type === 'receipt') {
      clearTimeout(receiptTimeoutId);
    } else if (type === 'response') {
      clearTimeout(requestTimeoutId);
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

function Bridge ({ defaultReceiptTimeout, defaultRequestTimeout, send }) {

  const requests = new Map();
  const handlers = new Map();

  async function request (name, payload, { receiptTimeout=defaultReceiptTimeout, requestTimeout=defaultRequestTimeout }) {
    const id = Math.random();
    const request = new Request({ receiptTimeout, requestTimeout });
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
    const handler = handlers.get(name) || (() => { throw new __UnhandledInternal__(); });
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
    request (name, payload, options={}) { return request(name, payload, options); }
    respond (name, callback) { handlers.set(name, callback); }
    get receive () { return receive; }
    get exceptions () { return { Unhandled, ReceiptTimeout, RequestTimeout }; }
  })();

}

module.exports = function ({
  defaultReceiptTimeout = 1000,
  defaultRequestTimeout = 60 * 1000,
  send = () => {}
}) {
  return new Bridge({ defaultReceiptTimeout, defaultRequestTimeout, send });
};
