'use strict';

module.exports = function (handler) {

  let emitter;

  if (typeof handler !== 'function') throw new TypeError('Handler must be a function.');

  let count = 0;

  const records = new Map();

  // Workaround for instaceof Error.
  function ErrorBase () { Error.apply(this, arguments); }
  ErrorBase.prototype = Object.create(Error.prototype);
  Object.setPrototypeOf(ErrorBase, Error);

  class Timeout extends ErrorBase {
    constructor () {
      const message = 'The request timed out waiting for a response.';
      super(message);
      this.name = 'Timeout';
      this.message = message;
    }
  }

  class CustomError extends ErrorBase {
    constructor (name, message) {
      super(message);
      this.name = name || 'Error';
      this.message = message || 'An error has occured.';
    }
  }

  async function request (payload, timeout=5000) {

    count++;

    const record = {};
    record.id = count;
    record.timeout = setTimeout(() => record.reject(new Timeout()), timeout);

    const promise = new Promise((resolve, reject) => {
      record.resolve = resolve;
      record.reject = reject;
    });

    records.set(record.id, record);

    try {
      emitter([record.id, 'q', payload]);
      return await promise;
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(record.timeout);
      records.delete(record.id);
    }

  }

  async function onRequest ([id,,payload]) {
    let response;
    try {
      response = await handler(payload);
    } catch (error) {
      const { name, message } = (error || {});
      return emitter([id, 'e', [name || 'Error', message || 'An unknown error has ocured.']]);
    }
    return emitter([id, 's', response]);
  }

  function onResponse([id,,payload]) {
    records.get(id).resolve(payload);
  }

  function onError ([id,,[name, message]]) {
    records.get(id).reject(new CustomError(name, message));
  }

  async function receive ([,type]) {
    if (type === 'q') onRequest(...arguments);
    else if (type === 's') onResponse(...arguments);
    else if (type === 'e') onError(...arguments);
  }

  return new (class {
    request (payload, timeout) { return request (payload, timeout); }
    receive (message) { return receive(message); }
    set emitter (callback) { emitter = callback; }
    get Timeout () { return Timeout; }
  })();

};
