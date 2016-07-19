'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

module.exports = function (sender, handler) {
  var _request = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(payload) {
      var timeout = arguments.length <= 1 || arguments[1] === undefined ? 5000 : arguments[1];
      var record, promise;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:

              count++;

              record = {};

              record.id = count;
              record.timeout = setTimeout(function () {
                return record.reject(new Timeout());
              }, timeout);

              promise = new Promise(function (resolve, reject) {
                record.resolve = resolve;
                record.reject = reject;
              });


              records.set(record.id, record);

              _context.prev = 6;

              sender([record.id, 'q', payload]);
              _context.next = 10;
              return promise;

            case 10:
              return _context.abrupt('return', _context.sent);

            case 13:
              _context.prev = 13;
              _context.t0 = _context['catch'](6);
              throw _context.t0;

            case 16:
              _context.prev = 16;

              clearTimeout(record.timeout);
              records.delete(record.id);
              return _context.finish(16);

            case 20:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[6, 13, 16, 20]]);
    }));

    return function _request(_x, _x2) {
      return ref.apply(this, arguments);
    };
  }();

  var onRequest = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_ref) {
      var _ref2 = _slicedToArray(_ref, 3);

      var id = _ref2[0];
      var payload = _ref2[2];

      var response, _ref3, name, message;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              response = void 0;
              _context2.prev = 1;
              _context2.next = 4;
              return handler(payload);

            case 4:
              response = _context2.sent;
              _context2.next = 13;
              break;

            case 7:
              _context2.prev = 7;
              _context2.t0 = _context2['catch'](1);
              _ref3 = _context2.t0 || {};
              name = _ref3.name;
              message = _ref3.message;
              return _context2.abrupt('return', sender([id, 'e', [name || 'Error', message || 'An unknown error has ocured.']]));

            case 13:
              return _context2.abrupt('return', sender([id, 's', response]));

            case 14:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[1, 7]]);
    }));

    return function onRequest(_x4) {
      return ref.apply(this, arguments);
    };
  }();

  var _receive = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(_ref8) {
      var _ref9 = _slicedToArray(_ref8, 2);

      var type = _ref9[1];
      var _args3 = arguments;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (type === 'q') onRequest.apply(undefined, _args3);else if (type === 's') onResponse.apply(undefined, _args3);else if (type === 'e') onError.apply(undefined, _args3);

            case 1:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    return function _receive(_x5) {
      return ref.apply(this, arguments);
    };
  }();

  if (typeof sender !== 'function') throw new TypeError('Sender must be a function.');
  if (typeof handler !== 'function') throw new TypeError('Handler must be a function.');

  var count = 0;

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

  function onResponse(_ref4) {
    var _ref5 = _slicedToArray(_ref4, 3);

    var id = _ref5[0];
    var payload = _ref5[2];

    records.get(id).resolve(payload);
  }

  function onError(_ref6) {
    var _ref7 = _slicedToArray(_ref6, 3);

    var id = _ref7[0];

    var _ref7$ = _slicedToArray(_ref7[2], 2);

    var name = _ref7$[0];
    var message = _ref7$[1];

    records.get(id).reject(new CustomError(name, message));
  }

  return new (function () {
    function _class() {
      _classCallCheck(this, _class);
    }

    _createClass(_class, [{
      key: 'request',
      value: function request(payload, timeout) {
        return _request(payload, timeout);
      }
    }, {
      key: 'receive',
      value: function receive(message) {
        return _receive(message);
      }
    }, {
      key: 'Timeout',
      get: function get() {
        return Timeout;
      }
    }]);

    return _class;
  }())();
};
