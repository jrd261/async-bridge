'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

module.exports = {};
module.exports.create = function () {

  // When connection sync message is received.

  var _request = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(name, payload, timeout) {
      var id, record;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              id = Math.random().toString(36).slice(2);
              record = {};

              record.name = name;
              record.payload = payload;
              record.receipt = Date.now();

              record.promise = new Promise(function (resolve, reject) {
                record.resolve = resolve;
                record.reject = reject;
              });

              record.timeout = setTimeout(function () {
                record.reject(new Error('The request timed out.'));
              }, timeout);

              outgoing.set(id, record);

              emit(['q', id, record.name, record.payload]);

              _context.prev = 9;
              _context.next = 12;
              return record.promise;

            case 12:
              return _context.abrupt('return', _context.sent);

            case 15:
              _context.prev = 15;
              _context.t0 = _context['catch'](9);
              throw _context.t0;

            case 18:
              _context.prev = 18;

              outgoing.delete(id);
              return _context.finish(18);

            case 21:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[9, 15, 18, 21]]);
    }));

    return function _request(_x, _x2, _x3) {
      return ref.apply(this, arguments);
    };
  }();

  var onrequest = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_ref) {
      var _ref2 = _slicedToArray(_ref, 4);

      var id = _ref2[1];
      var name = _ref2[2];
      var payload = _ref2[3];
      var responder, response;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!incoming.has(id)) {
                _context2.next = 2;
                break;
              }

              return _context2.abrupt('return');

            case 2:
              responder = responders.get(name);

              if (responder) {
                _context2.next = 5;
                break;
              }

              return _context2.abrupt('return', emit(['e', id, 'No handler was set to respond to this request.']));

            case 5:

              incoming.add(id);

              response = void 0;
              _context2.prev = 7;
              _context2.next = 10;
              return responder(payload);

            case 10:
              response = _context2.sent;

              emit(['p', id, response]);
              _context2.next = 17;
              break;

            case 14:
              _context2.prev = 14;
              _context2.t0 = _context2['catch'](7);

              emit(['e', id, String(_context2.t0)]);

            case 17:
              incoming.delete(id);

            case 18:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[7, 14]]);
    }));

    return function onrequest(_x4) {
      return ref.apply(this, arguments);
    };
  }();

  var _receive = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(_ref9) {
      var _ref10 = _slicedToArray(_ref9, 1);

      var type = _ref10[0];
      var _args3 = arguments;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              try {
                if (type === 'q') onrequest.apply(undefined, _args3);else if (type === 'p') onresponse.apply(undefined, _args3);else if (type === 'e') onerror.apply(undefined, _args3);else if (type === 's') onsync.apply(undefined, _args3);
              } catch (error) {
                // no worries
              }

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

  var incoming = new Set();
  var outgoing = new Map();
  var responders = new Map();

  var emitter = void 0;

  // Send other bridge list of known requests.
  function sync() {
    emit(['s', Array.from(incoming.keys())]);
    var now = Date.now();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = outgoing.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _slicedToArray(_step.value, 2);

        var id = _step$value[0];
        var record = _step$value[1];

        if (now - record.receipt < 1000) continue;
        console.warn('REEMITTED EVENT', record.name);
        emit(['q', id, record.name, record.payload]);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  function emit(data) {
    if (!emitter) return;
    try {
      emitter(data);
    } catch (error) {
      // Swallow errors.
    }
  }

  // Sycronization interval.
  setInterval(sync, 500);

  function onresponse(_ref3) {
    var _ref4 = _slicedToArray(_ref3, 3);

    var id = _ref4[1];
    var payload = _ref4[2];

    outgoing.get(id).resolve(payload);
  }

  function onerror(_ref5) {
    var _ref6 = _slicedToArray(_ref5, 3);

    var id = _ref6[1];
    var error = _ref6[2];

    outgoing.get(id).reject(error);
  }

  function onsync(_ref7) {
    var _ref8 = _slicedToArray(_ref7, 2);

    var ids = _ref8[1];

    var now = Date.now();
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = ids[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var id = _step2.value;

        if (!outgoing.has(id)) continue;
        outgoing.get(id).receipt = now;
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  }

  return function () {
    function _class() {
      _classCallCheck(this, _class);
    }

    _createClass(_class, null, [{
      key: 'request',
      value: function request(name, payload) {
        var timeout = arguments.length <= 2 || arguments[2] === undefined ? 60000 : arguments[2];
        return _request(name, payload, timeout);
      }
    }, {
      key: 'receive',
      value: function receive(data) {
        return _receive(data);
      }
    }, {
      key: 'respond',
      value: function respond(name, callback) {
        responders.set(name, callback);
      }
    }, {
      key: 'emitter',
      set: function set(callback) {
        emitter = callback;sync();
      }
    }]);

    return _class;
  }();
};
