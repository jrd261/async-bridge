'use strict';

module.exports = function (sender, handler) {

  if (typeof sender !== 'function') throw new TypeError('Sender must be a function.');
  if (typeof handler !== 'function') throw new TypeError('Handler must be a function.');

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

    const id = Math.random();
    const record = {};
    record.timeout = setTimeout(() => record.reject(new Timeout()), timeout);    
    records.set(id, record);

    const promise = new Promise((resolve, reject) => { record.resolve = resolve; record.reject = reject; });

    sender({ id, payload, type: 'request' });
                                          
    try {
      return await promise;
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(record.timeout);
      records.delete(id);
    }

  }

  async function receive (message) {
    if (!message || !message.id) return;
    else if (message.type === 'request') {
      sender({ id: message.id, type: 'receipt' });
      try { 
        sender({ id: message.id, type: 'response', payload: await handler(message.payload) });
      } catch (error) {
        try { 
          sender({ id: message.id, type: 'error', error: { name: error.name, message: error.message }});
        } catch (error) {
          sender({ id: message.id, type: 'error', error: { name: 'Error', message: 'An unknown error has occured' }});
        }
      }
    } else if (message.type === 'receipt') {
      clearTimeout(records.get(message.id).timeouts.receipt);
    } else if (message.type === 'response') {
      records.get(message.id).resolve(message.payload); 
    } else if (message.type === 'error') {
      records.get(message.id).reject(new CustomError(message.error.name, message.error.message));
    }
  }

  return { request, receive, Timeout };

};
