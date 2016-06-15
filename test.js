'use strict';

const sinon = require('sinon');

const Bridge = require('./');

require('babel-polyfill');

let bridge0, bridge1, sendToBridge0, sendToBridge1;

beforeEach(() => {
  sendToBridge0 = sinon.spy(message => bridge0.receive(message));
  sendToBridge1 = sinon.spy(message => bridge1.receive(message));
  bridge0 = Bridge({ send: sendToBridge1, timeout: 10 });
  bridge1 = Bridge({ send: sendToBridge0, timeout: 10 });
});

describe('async bridge', () => {
  describe('when bridge0 sets a responder to a request', () => {
    beforeEach(() => bridge0.respond('test', () => 123));
    describe('and bridge1 sends a request', () => {
      it('bridge1 should get the response payload', () => {
        return bridge1.request('test').then(response => {
          if (response !== 123) throw new Error();
        });
      });
      it('bridge0 should get the request payload', () => {
        return bridge1.request('test', 321).then(() => {
          if (sendToBridge0.args[0][0].payload !== 321) throw new Error();
        });
      });
    });
  });
  describe('when bridge0 responder doesnt resolve', () => {
    beforeEach(() => bridge0.respond('test', () => new Promise(() => {})));
    it('bridge1 should not resolve and timeout should be cleared', done => {
      bridge1.request('test').then(() => done(new Error()), () => done(new Error()));
      setTimeout(done, 100);
    });
  });
  describe('when bridge0 doesnt have a responder', () => {
    it('bridge1 should get an unhandled error', () => {
      return bridge1.request('hello').then(() => { throw new Error(); }, error => {
        if (!(error instanceof bridge1.exceptions.Unhandled)) throw new Error();
      });
    });
  });
  describe('when there is no bridge on the other side', () => {
    const bridge = Bridge({ timeout: 10 });
    it('should get a timeout error', () => {
      return bridge.request('hello').then(() => { throw new Error(); }, error => {
        if (!(error instanceof bridge.exceptions.Timeout)) throw new Error();
      });
    });
  });

  describe('when timeout is huge', () => {
    const bridge = Bridge({ timeout: 86400 * 1000 });
    it('should not get a timeout error within a few seconds', done => {
      bridge.request('hello').catch(() => {}).then(() => done(new Error()));
      setTimeout(done, 1000);
    });
  });
});
