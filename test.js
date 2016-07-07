'use strict';

const sinon = require('sinon');

const Bridge = require('./');

require('babel-polyfill');

let bridge0, bridge1, sendToBridge0, sendToBridge1, sendToBridge0Hook, sendToBridge1Hook;

beforeEach(() => {
  sendToBridge0 = sinon.spy(message => sendToBridge0Hook(message));
  sendToBridge1 = sinon.spy(message => sendToBridge1Hook(message));
  sendToBridge0Hook = message => bridge0.receive(message);
  sendToBridge1Hook = message => bridge1.receive(message);
  bridge0 = Bridge(sendToBridge1);
  bridge1 = Bridge(sendToBridge0);
});

describe('async bridge', () => {

  describe('when bridge 1 sets a responder that responds quickly to a request', () => {

    beforeEach(() => bridge1.respond('test', () => Promise.resolve(123)));

    describe('and bridge1 sends a request', () => {

      let response;

      beforeEach(() => bridge0.request('test', 321).then(response_ => response = response_));

      it('bridge 1 should get the the response payload', () => {
        if (response !== 123) throw new Error();
      });

      it('bridge 0 should get the request payload', () => {
        if (sendToBridge1.args[0][0].payload !== 321) throw new Error();
      });

    });

  });

  describe('when bridge 1 sets a responder that doesnt resolve', () => {

    beforeEach(() => bridge1.respond('test', () => new Promise(() => {})));

    describe('and the default response timeout is short', () => {

      let promise;
      beforeEach(() => bridge0 = Bridge(sendToBridge1, { timeouts: { response: 50 }}));

      describe('and bridge 0 sends a request', () => {

        beforeEach(() => { promise = bridge0.request('test', 123).then(() => { throw new Error(); }); });

        it('bridge 0 should receive a response timeout error', () => {
          return promise.catch(error => { if (!(error instanceof bridge1.exceptions.ResponseTimeout)) throw error; });
        });

      });

    });

    describe('and the default response timeout is long', () => {

      let promise;
      beforeEach(() => bridge0 = Bridge(sendToBridge1, { timeouts: { response: 15000 }}));

      describe('and bridge 0 sends a request with a short manual timeout', () => {

        beforeEach(() => { promise = bridge0.request('test', 123, { timeouts: { response: 50 }}).then(() => { throw new Error(); }); });

        it('bridge 0 should receive a request timeout error', () => {
          return promise.catch(error => { if (!(error instanceof bridge0.exceptions.ResponseTimeout)) throw error; });
        });

      });

    });

  });

  describe('when bridge 1 doesnt exist', () => {

    beforeEach(() => sendToBridge1Hook = () => {});

    describe('and bridge 0 sends a request', () => {

      let promise;
      beforeEach(() => { promise = bridge0.request('test').then(() => { throw new Error(); }); });

      it('bridge 0 should get a receipt timeout', () => {
        return promise.catch(error => { if (!(error instanceof bridge0.exceptions.ReceiptTimeout)) throw new Error(); });
      });

    });

  });

  describe('when bridge 1 doesnt handle a request', () => {

    describe('and bridge 0 sends a request', () => {

      let promise;
      beforeEach(() => { promise = bridge0.request('test').then(() => { throw new Error(); }); });

      it('bridge 0 should get an unhandled error', () => {
        return promise.catch(error => { if (!(error instanceof bridge0.exceptions.Unhandled)) throw error; });
      });

    });

  });

});
