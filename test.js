'use strict';

const Bridge = require('./');

require('babel-polyfill');

describe('async bridge', () => {

  let b0, b1;

  beforeEach(() => {
    b0 = Bridge.create();
    b1 = Bridge.create();
    b0.emitter = b1.receiver;
    b1.emitter = b0.receiver;
  });

  it('should get a response from other bridge', () => {
    b0.respond('test', () => 'test');
    return b1.request('test').then(value => {
      if (value !== 'test') throw new Error();
    });
  });

  it('should reject on sync error', () => {
    b1.respond('test', () => { throw new Error('hello!'); });
    return b0.request('test').then(() => { throw new Error(); }, error => {
      if (error.name !== 'Error' || error.message !== 'hello!') throw new Error();
    });
  });

  it('should reject on async error', () => {
    b1.respond('test', () => Promise.reject('test'));
    return b0.request('test').then(() => { throw new Error(); }, error => {
      if (error !== 'test') throw new Error();
    });
  });

  it('should not throw error on request when emitter is broken', () => {
    b1.emitter = () => { throw new Error(); };
    b1.request('hi', 10000);
  });

  it('syncing after request sent before emitter attached works', () => {
    b1.respond('test2', () => 'test');
    b0.emitter = null;
    const promise = b0.request('test2', null, 5000);
    setTimeout(() => {
      b0.emitter = b1.receiver;
      b0.sync();
    }, 1000);
    return promise.then(response => {
      if (response !== 'test') throw new Error();
    });
  });

  it('timeouts cause an error', () => {
    b1.respond('hello', () => new Promise(() => {}));
    return b0.request('hello', null, 1000).then(() => { throw new Error(); }, () => {});
  });

  it('sync can timeout', () => {
    b0.emitter = null;
    return b0.sync(1000).then(() => { throw new Error(); }, () => {});
  });

  it('sync resolves', () => {
    return b0.sync();
  });

  it('unhandled requests cause an error', () => {
    return b0.request('hello').then(() => { throw new Error(); }, () => {});
  });


});
