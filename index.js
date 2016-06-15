'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Unhandled = function Unhandled() {
  _classCallCheck(this, Unhandled);

  this.name = 'Unhandled';
  this.message = 'The request was unhandled';
  this.stack = new Error().stack;
};

var Timeout = function Timeout() {
  _classCallCheck(this, Timeout);

  this.name = 'Timeout';
  this.message = 'The request timed out.';
  this.stack = new Error().stack;
};

function Request(_ref) {
  var timeout = _ref.timeout;
  var setTimeout = _ref.setTimeout;
  var clearTimeout = _ref.clearTimeout;


  var resolve = void 0,
      reject = void 0;
  var promise = new Promise(function (a, b) {
    resolve = a;reject = b;
  });
  var timeout_ = setTimeout(function () {
    return reject(new Timeout());
  }, timeout);

  function onReceipt() {
    clearTimeout(timeout_);
  }
  function onResponse(_ref2) {
    var payload = _ref2.payload;
    resolve(payload);
  }

  function onError(_ref3) {
    var name = _ref3.name;
    var message = _ref3.message;

    if (name === 'Unhandled') return reject(new Unhandled());
    var error = new Error();
    error.name = name;
    error.message = message;
    reject(error);
  }

  function _receive(message) {
    if (message.type === 'receipt') onReceipt(message);else if (message.type === 'response') onResponse(message);else if (message.type === 'error') onError(message);
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

function Bridge(_ref4) {
  var _request = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(name, payload) {
      var id, request;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              id = Math.random();
              request = new Request({ timeout: timeout, setTimeout: setTimeout, clearTimeout: clearTimeout });

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

    return function _request(_x, _x2) {
      return ref.apply(this, arguments);
    };
  }();

  var onRequest = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_ref5) {
      var id = _ref5.id;
      var name = _ref5.name;
      var payload = _ref5.payload;
      var handler, response;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              handler = handlers.get(name) || function () {
                throw new Unhandled();
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

    return function onRequest(_x3) {
      return ref.apply(this, arguments);
    };
  }();

  var timeout = _ref4.timeout;
  var send = _ref4.send;
  var setTimeout = _ref4.setTimeout;
  var clearTimeout = _ref4.clearTimeout;


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
        return _request(name, payload);
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
        return { Unhandled: Unhandled, Timeout: Timeout };
      }
    }]);

    return _class2;
  }())();
}

module.exports = function (_ref6) {
  var _ref6$timeout = _ref6.timeout;
  var timeout = _ref6$timeout === undefined ? 1000 : _ref6$timeout;
  var _ref6$send = _ref6.send;
  var send = _ref6$send === undefined ? function () {} : _ref6$send;
  var _ref6$setTimeout = _ref6.setTimeout;
  var setTimeout = _ref6$setTimeout === undefined ? typeof setTimeout === 'function' ? setTimeout : (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' ? window.setTimeout : global.setTimeout : _ref6$setTimeout;
  var _ref6$clearTimeout = _ref6.clearTimeout;
  var clearTimeout = _ref6$clearTimeout === undefined ? typeof clearTimeout === 'function' ? clearTimeout : (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' ? window.clearTimeout : global.clearTimeout : _ref6$clearTimeout;

  return new Bridge({ timeout: timeout, send: send, setTimeout: setTimeout, clearTimeout: clearTimeout });
};
