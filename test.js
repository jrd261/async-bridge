'use strict';

const Bridge = require('./');

require('babel-polyfill');

describe('async bridge', () => {

  let b0, b1;

  beforeEach(() => {
    b0 = Bridge.create();
    b1 = Bridge.create();
    b0.emitter = data => b1.receive(data);
    b1.emitter = data => b0.receive(data);
  });

  describe('when a bridge is responding to a name with a payload', () => {

    beforeEach(() => {
      b0.respond('eventName1', () => { return { a: 123 }; });
    });

    it('should get a respond from other bridge', () => {
      return b1.request('eventName1').then(value => {
        if (value.a !== 123) throw new Error();
      });
    });

  });

  describe('when a bridge is responding with an error', () => {

    beforeEach(() => {
      b0.respond('eventName1', () => { throw new Error('Oh no!'); });
    });

    it('should get a respond from other bridge', () => {
      return b1.request('eventName1').then(() => { throw new Error(); }).catch(error => {
        if (error !== 'Error: Oh no!') throw new Error();
      });
    });

  });

});
