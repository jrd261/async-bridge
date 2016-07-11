'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

module.exports = function (sender, handler) {
  var request = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(payload) {
      var timeout = arguments.length <= 1 || arguments[1] === undefined ? 5000 : arguments[1];
      var id, record, promise;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              id = Math.random();
              record = {};

              record.timeout = setTimeout(function () {
                return record.reject(new Timeout());
              }, timeout);
              records.set(id, record);

              promise = new Promise(function (resolve, reject) {
                record.resolve = resolve;record.reject = reject;
              });


              sender({ id: id, payload: payload, type: 'request' });

              _context.prev = 6;
              _context.next = 9;
              return promise;

            case 9:
              return _context.abrupt('return', _context.sent);

            case 12:
              _context.prev = 12;
              _context.t0 = _context['catch'](6);
              throw _context.t0;

            case 15:
              _context.prev = 15;

              clearTimeout(record.timeout);
              records.delete(id);
              return _context.finish(15);

            case 19:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[6, 12, 15, 19]]);
    }));

    return function request(_x, _x2) {
      return ref.apply(this, arguments);
    };
  }();

  var receive = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(message) {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!(!message || !message.id)) {
                _context2.next = 4;
                break;
              }

              return _context2.abrupt('return');

            case 4:
              if (!(message.type === 'request')) {
                _context2.next = 20;
                break;
              }

              sender({ id: message.id, type: 'receipt' });
              _context2.prev = 6;
              _context2.t0 = message.id;
              _context2.next = 10;
              return handler(message.payload);

            case 10:
              _context2.t1 = _context2.sent;
              _context2.t2 = {
                id: _context2.t0,
                type: 'response',
                payload: _context2.t1
              };
              sender(_context2.t2);
              _context2.next = 18;
              break;

            case 15:
              _context2.prev = 15;
              _context2.t3 = _context2['catch'](6);

              try {
                sender({ id: message.id, type: 'error', error: { name: _context2.t3.name, message: _context2.t3.message } });
              } catch (error) {
                sender({ id: message.id, type: 'error', error: { name: 'Error', message: 'An unknown error has occured' } });
              }

            case 18:
              _context2.next = 21;
              break;

            case 20:
              if (message.type === 'receipt') {
                clearTimeout(records.get(message.id).timeouts.receipt);
              } else if (message.type === 'response') {
                records.get(message.id).resolve(message.payload);
              } else if (message.type === 'error') {
                records.get(message.id).reject(new CustomError(message.error.name, message.error.message));
              }

            case 21:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[6, 15]]);
    }));

    return function receive(_x4) {
      return ref.apply(this, arguments);
    };
  }();

  if (typeof sender !== 'function') throw new TypeError('Sender must be a function.');
  if (typeof handler !== 'function') throw new TypeError('Handler must be a function.');

  var records = new Map();

  // Workaround for instaceof Error.
  function ErrorBase() {
    Error.apply(this, arguments);
  }
  ErrorBase.prototype = Object.create(Error.prototype);
  Object.setPrototypeOf(ErrorBase, Error);

  var Timeout = function (_ErrorBase) {
    _inherits(Timeout, _ErrorBase);

    function Timeout() {
      _classCallCheck(this, Timeout);

      var message = 'The request timed out waiting for a response.';

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Timeout).call(this, message));

      _this.name = 'Timeout';
      _this.message = message;
      return _this;
    }

    return Timeout;
  }(ErrorBase);

  var CustomError = function (_ErrorBase2) {
    _inherits(CustomError, _ErrorBase2);

    function CustomError(name, message) {
      _classCallCheck(this, CustomError);

      var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(CustomError).call(this, message));

      _this2.name = name || 'Error';
      _this2.message = message || 'An error has occured.';
      return _this2;
    }

    return CustomError;
  }(ErrorBase);

  return { request: request, receive: receive, Timeout: Timeout };
};
