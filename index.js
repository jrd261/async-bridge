'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Unhandled = function Unhandled() {
  _classCallCheck(this, Unhandled);

  this.name = 'Unhandled';
  this.message = 'The request was unhandled';
  this.stack = new Error().stack;
};

var __UnhandledInternal__ = function __UnhandledInternal__() {
  _classCallCheck(this, __UnhandledInternal__);

  this.name = '__UnhandledInternal__';
  this.message = 'The request was unhandled';
  this.stack = new Error().stack;
};

var ReceiptTimeout = function ReceiptTimeout() {
  _classCallCheck(this, ReceiptTimeout);

  this.name = 'ReceiptTimeout';
  this.message = 'The request timed out waiting for a receipt.';
  this.stack = new Error().stack;
};

var RequestTimeout = function RequestTimeout() {
  _classCallCheck(this, RequestTimeout);

  this.name = 'RequestTimeout';
  this.message = 'The request timed out waiting for a response';
  this.stack = new Error().stack;
};

function Request(_ref) {
  var receiptTimeout = _ref.receiptTimeout;
  var requestTimeout = _ref.requestTimeout;


  var resolve = void 0,
      reject = void 0;
  var promise = new Promise(function (a, b) {
    resolve = a;reject = b;
  });

  var receiptTimeoutId = setTimeout(function () {
    return reject(new ReceiptTimeout());
  }, receiptTimeout);
  var requestTimeoutId = setTimeout(function () {
    return reject(new RequestTimeout());
  }, requestTimeout);

  function _receive(message) {
    var type = message.type;
    var payload = message.payload;

    if (type === 'receipt') {
      clearTimeout(receiptTimeoutId);
    } else if (type === 'response') {
      clearTimeout(requestTimeoutId);
      resolve(payload);
    } else if (type === 'error') {
      if (message.name === '__UnhandledInternal__') {
        reject(new Unhandled());
      } else {
        var error = new Error();
        error.name = message.name;
        error.message = message.message;
        reject(error);
      }
    }
  }

  return new (function () {
    function _class() {
      _classCallCheck(this, _class);
    }

    _createClass(_class, [{
      key: 'receive',
      value: function receive(message) {
        _receive(message);
      }
    }, {
      key: 'wait',
      value: function wait() {
        return promise;
      }
    }]);

    return _class;
  }())();
}

function Bridge(_ref2) {
  var _request = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(name, payload, _ref3) {
      var _ref3$receiptTimeout = _ref3.receiptTimeout;
      var receiptTimeout = _ref3$receiptTimeout === undefined ? defaultReceiptTimeout : _ref3$receiptTimeout;
      var _ref3$requestTimeout = _ref3.requestTimeout;
      var requestTimeout = _ref3$requestTimeout === undefined ? defaultRequestTimeout : _ref3$requestTimeout;
      var id, request;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              id = Math.random();
              request = new Request({ receiptTimeout: receiptTimeout, requestTimeout: requestTimeout });

              requests.set(id, request);
              send({ id: id, name: name, payload: payload, type: 'request' });
              _context.prev = 4;
              _context.next = 7;
              return request.wait();

            case 7:
              return _context.abrupt('return', _context.sent);

            case 10:
              _context.prev = 10;
              _context.t0 = _context['catch'](4);
              throw _context.t0;

            case 13:
              _context.prev = 13;

              requests.delete(id);
              return _context.finish(13);

            case 16:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[4, 10, 13, 16]]);
    }));

    return function _request(_x, _x2, _x3) {
      return ref.apply(this, arguments);
    };
  }();

  var onRequest = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_ref4) {
      var id = _ref4.id;
      var name = _ref4.name;
      var payload = _ref4.payload;
      var handler, response;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              handler = handlers.get(name) || function () {
                throw new __UnhandledInternal__();
              };

              response = void 0;

              send({ id: id, type: 'receipt' });
              _context2.prev = 3;
              _context2.next = 6;
              return handler(payload);

            case 6:
              response = _context2.sent;
              _context2.next = 13;
              break;

            case 9:
              _context2.prev = 9;
              _context2.t0 = _context2['catch'](3);

              send({ id: id, type: 'error', name: _context2.t0.name, message: _context2.t0.message });
              return _context2.abrupt('return');

            case 13:
              send({ id: id, type: 'response', payload: response });

            case 14:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[3, 9]]);
    }));

    return function onRequest(_x4) {
      return ref.apply(this, arguments);
    };
  }();

  var defaultReceiptTimeout = _ref2.defaultReceiptTimeout;
  var defaultRequestTimeout = _ref2.defaultRequestTimeout;
  var send = _ref2.send;


  var requests = new Map();
  var handlers = new Map();

  function receive(message) {
    if (!message) return;else if (message.type === 'request') return onRequest(message);else if (requests.has(message.id)) return requests.get(message.id).receive(message);
  }

  return new (function () {
    function _class2() {
      _classCallCheck(this, _class2);
    }

    _createClass(_class2, [{
      key: 'request',
      value: function request(name, payload) {
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        return _request(name, payload, options);
      }
    }, {
      key: 'respond',
      value: function respond(name, callback) {
        handlers.set(name, callback);
      }
    }, {
      key: 'receive',
      get: function get() {
        return receive;
      }
    }, {
      key: 'exceptions',
      get: function get() {
        return { Unhandled: Unhandled, ReceiptTimeout: ReceiptTimeout, RequestTimeout: RequestTimeout };
      }
    }]);

    return _class2;
  }())();
}

module.exports = function (_ref5) {
  var _ref5$defaultReceiptT = _ref5.defaultReceiptTimeout;
  var defaultReceiptTimeout = _ref5$defaultReceiptT === undefined ? 1000 : _ref5$defaultReceiptT;
  var _ref5$defaultRequestT = _ref5.defaultRequestTimeout;
  var defaultRequestTimeout = _ref5$defaultRequestT === undefined ? 60 * 1000 : _ref5$defaultRequestT;
  var _ref5$send = _ref5.send;
  var send = _ref5$send === undefined ? function () {} : _ref5$send;

  return new Bridge({ defaultReceiptTimeout: defaultReceiptTimeout, defaultRequestTimeout: defaultRequestTimeout, send: send });
};
