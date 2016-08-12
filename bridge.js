'use strict';

module.exports = {};
module.exports.create = function () {

  let bridge;

  const incoming = new Set();
  const outgoing = new Map();
  const responders = new Map();

  function emit (data) {
    try { bridge.emitter(data); }
    catch (error) { /* Swallow */ }
  }

  /* Request and Respond */

  async function request (name, payload, timeout=5000) {

    const id = Math.random().toString(36).slice(2);

    const record = { name, payload };
    const promise = new Promise((resolve, reject) => {
      record.resolve = resolve;
      record.reject = reject;
    });

    record.timeout = setTimeout(() => {
      record.reject(new Error('The request timed out.'));
    }, timeout);

    outgoing.set(id, record);

    emit(['q', id, record.name, record.payload]);

    try {
      return await promise;
    } catch (error) {
      throw error;
    } finally {
      outgoing.delete(id);
    }

  }

  function respond (name, callback) {
    responders.set(name, callback);
  }


  /* Incoming Message Routing */

  async function receiver ([type, id, name, payload]) {
    if (type === 'q') {
      if (incoming.has(id)) return;
      try {
        incoming.add(id);
        if (!responders.get(name)) throw new Error('No handler was set to respond to this request.');
        emit(['s', id, null, await responders.get(name)(payload)]);
        incoming.delete(id);
      } catch (error) {
        if (error instanceof Error) emit(['e', id, null, { name: error.name, message: error.message }]);
        else emit(['e', id, null, error]);
        incoming.delete(id);
      }
    }
    else if (type === 's') outgoing.get(id).resolve(payload);
    else if (type === 'e') outgoing.get(id).reject(payload);
  }

  /* Syncronization */

  function resend (ids) {
    ids = new Set(ids);
    for (let [id, record] of outgoing.entries()) {
      if (!ids.has(id)) {
        emit(['q', id, record.name, record.payload]);
      }
    }
  }

  function onsync (ids) {
    resend(ids);
    return Array.from(incoming.keys());
  }

  function sync (timeout=1000) {
    return request('__sync__', Array.from(incoming.keys()), timeout).then(resend);
  }

  respond('__sync__', onsync);


  /* Exports */

  bridge = { sync, request, receiver, respond };

  return bridge;

};
