'use strict';

const Bridge = require('./');

require('babel-polyfill');

let b0, b1;

describe('async bridge', () => {

  describe('when a bridge sends a request to another bridge', () => {

    describe('and the handler just syncronously returns the request payload', () => {

      beforeEach(() => {
        b0 = Bridge(x => b1.receive(x), x => x);
        b1 = Bridge(x => b0.receive(x), x => x);
      });

      it('the response payload should be the request payload', () => {
        return b0.request({ a: 1 }).then(response => { 
          if (response.a !== 1) { throw new Error(); }
        });
      });

    });

    describe('and the handler async returns the request payload', () => {

      beforeEach(() => {
        b0 = Bridge(x => b1.receive(x), () => {});
        b1 = Bridge(x => b0.receive(x), x => new Promise(r => setTimeout(() => r(x), 50)));
      });

      it('the response payload should be the request payload', () => {
        return b0.request(123).then(response => {
          if (response !== 123) { throw new Error('2'); }
        });
      });

      describe('and the timeout is short', () => {
        it('should reject with a timeout', () => {
          return b0.request(123, 0).then(() => { throw new Error(); }, error => {
            if (!(error instanceof b0.Timeout)) throw new Error();
          });
        });
      });
      
    });

    describe('and the handler throws a sync error', () => {

      beforeEach(() => {
        b0 = Bridge(x => b1.receive(x), () => {});
        b1 = Bridge(x => b0.receive(x), () => { throw new Error('test'); });
      });

      it('should reject with clone of error', () => {
        return b0.request().then(() => { throw new Error(''); }, error => {
          if (error.name !== 'Error' || error.message !== 'test') throw new Error();
        });
      });

    });

    describe('and the handler throws null', () => {

      beforeEach(() => {
        b0 = Bridge(x => b1.receive(x), () => {});
        b1 = Bridge(x => b0.receive(x), () => Promise.reject(null));
      });

      it('should reject', () => {
        return b0.request().then(() => { throw new Error(); }, () => {});
      });
      
    });


  });

});
