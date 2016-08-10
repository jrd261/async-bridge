'use strict';

module.exports = {};
module.exports.create = function (config) {

  config = config || {};
  config.interval = 2000;

  const incoming = new Map();
  const outgoing = new Map();
  const handlers = new Map();

  let emitter;

  let status = false;
  let resolve;
  let promise = new Promise(resolve_ => resolve = resolve_);
  let timeout;

  function sync () {
    emitter(['s', Array.from(incoming.keys())]);
  }

  // Sycronization interval.
  setInterval(sync, config.interval);

  // When connection times-out.
  function ontimeout () {
    status = false;
    promise = new Promise(resolve_ => resolve = resolve_);
    for (let [id, record] of outgoing.entries()) {
      outgoing.delete(id);
      record.reject(new Error('Bridge connection was lost.'));
    }
  }

  // When connection sync message is received.
  async function request (name, payload, timeout) {
    
    const id = Math.random();
    const record = {};
    
    outgoing.set(id, record);

    const recordPromise = new Promise((resolve, reject) => { 
      record.resolve = resolve;
      record.reject = reject; 
    });

    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => reject('The request timed out.'), timeout);
    });

    const promise = Promise.race([recordPromise, timeoutPromise]);

    try {
      emitter(['q', id, name, payload]);
      return await promise;
    } catch (error) {
      throw error;
    } finally {
      outgoing.delete(id);
    }

  }

  async function onrequest ([ , id, name, payload]) {
    const handler = handlers.get(name);
    if (!handler) return emitter(['e', id, 'No handler was set to respond to this request.']);

    incoming.set(id, true);

    let response;
    try {
      response = await handler(payload);
    } catch (error_) {
      const error = String(error_);
      return emitter(['e', id, error]);
    } finally {
      setTimeout(() => incoming.delete(id), 2 * config.interval);
    }
    return emitter(['p', id, response]);
  }

  function onresponse([, id, payload]) {
    outgoing.get(id).resolve(payload);
  }

  function onerror ([, id, error]) {
    outgoing.get(id).reject(error);
  }

  function onsync ([, ids]) {
    status = true;
    const remote = new Set(ids);
    const local = new Set(outgoing.keys());
    for (let id of local) {
      if (remote.has(id)) {
        outgoing.get(id).reject(new Error('Bridge was reset. Request was lost.'));
        outgoing.delete(id);
      }
    }
    resolve();
    clearTimeout(timeout);
    setTimeout(ontimeout, config.interval * 2);
  }

  async function receive ([type]) {
    try {
      if (type === 'q') onrequest(...arguments);
      else if (type === 'p') onresponse(...arguments);
      else if (type === 'e') onerror(...arguments);
      else if (type === 's') onsync(...arguments);
    } catch (error) {
      // no worries
    }
  }

  return class {
    static request (name, payload, timeout=60000) { return request(name, payload, timeout); }
    static receive (data) { return receive(data); }
    static respond (name, callback) { handlers.set(name, callback); }
    static set emitter (callback) { emitter = callback; sync(); }
    static get status () { return status; }
    static wait () { return promise; }
  };

};
