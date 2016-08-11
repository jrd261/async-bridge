'use strict';

module.exports = {};
module.exports.create = function () {

  const incoming = new Set();
  const outgoing = new Map();
  const responders = new Map();

  let emitter;

  // Send other bridge list of known requests.
  function sync () {
    emit(['s', Array.from(incoming.keys())]);
    const now = Date.now();
    for (let [id, record] of outgoing.entries()) {
      if (now - record.receipt < 1000) continue;
      console.warn('REEMITTED EVENT', record.name);
      emit(['q', id, record.name, record.payload]);
    }
  }

  function emit (data) {
    if (!emitter) return;
    try {
      emitter(data);
    } catch (error) {
      // Swallow errors.
    }
  }

  // Sycronization interval.
  setInterval(sync, 500);

  // When connection sync message is received.
  async function request (name, payload, timeout) {

    const id = Math.random().toString(36).slice(2);

    const record = {};
    record.name = name;
    record.payload = payload;
    record.receipt = Date.now();

    record.promise = new Promise((resolve, reject) => {
      record.resolve = resolve;
      record.reject = reject;
    });

    record.timeout = setTimeout(() => {
      record.reject(new Error('The request timed out.'));
    }, timeout);

    outgoing.set(id, record);

    emit(['q', id, record.name, record.payload]);

    try {
      return await record.promise;
    } catch (error) {
      throw error;
    } finally {
      outgoing.delete(id);
    }

  }

  async function onrequest ([ , id, name, payload]) {

    if (incoming.has(id)) return;

    const responder = responders.get(name);

    if (!responder) return emit(['e', id, 'No handler was set to respond to this request.']);

    incoming.add(id);

    let response;
    try {
      response = await responder(payload);
      emit(['p', id, response]);
    } catch (error_) {
      emit(['e', id, String(error_)]);
    }
    incoming.delete(id);

  }

  function onresponse([, id, payload]) {
    outgoing.get(id).resolve(payload);
  }

  function onerror ([, id, error]) {
    outgoing.get(id).reject(error);
  }

  function onsync ([, ids]) {
    const now = Date.now();
    for (let id of ids) {
      if (!outgoing.has(id)) continue;
      outgoing.get(id).receipt = now;
    }
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
    static respond (name, callback) { responders.set(name, callback); }
    static set emitter (callback) { emitter = callback; sync(); }
  };

};
