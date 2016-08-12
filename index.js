'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

module.exports = {};
module.exports.create = function () {
  /* Swallow */

  /* Request and Respond */

  var request = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(name, payload) {
      var timeout = arguments.length <= 2 || arguments[2] === undefined ? 5000 : arguments[2];
      var id, record, promise;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              id = Math.random().toString(36).slice(2);
              record = { name: name, payload: payload };
              promise = new Promise(function (resolve, reject) {
                record.resolve = resolve;
                record.reject = reject;
              });


              record.timeout = setTimeout(function () {
                record.reject(new Error('The request timed out.'));
              }, timeout);

              outgoing.set(id, record);

              emit(['q', id, record.name, record.payload]);

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

              outgoing.delete(id);
              return _context.finish(15);

            case 18:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[6, 12, 15, 18]]);
    }));

    return function request(_x, _x2, _x3) {
      return ref.apply(this, arguments);
    };
  }();

  /* Incoming Message Routing */

  var receiver = function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_ref) {
      var _ref2 = _slicedToArray(_ref, 4);

      var type = _ref2[0];
      var id = _ref2[1];
      var name = _ref2[2];
      var payload = _ref2[3];
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!(type === 'q')) {
                _context2.next = 22;
                break;
              }

              if (!incoming.has(id)) {
                _context2.next = 3;
                break;
              }

              return _context2.abrupt('return');

            case 3:
              _context2.prev = 3;

              incoming.add(id);

              if (responders.get(name)) {
                _context2.next = 7;
                break;
              }

              throw new Error('No handler was set to respond to this request.');

            case 7:
              _context2.t0 = id;
              _context2.next = 10;
              return responders.get(name)(payload);

            case 10:
              _context2.t1 = _context2.sent;
              _context2.t2 = ['s', _context2.t0, null, _context2.t1];
              emit(_context2.t2);

              incoming.delete(id);
              _context2.next = 20;
              break;

            case 16:
              _context2.prev = 16;
              _context2.t3 = _context2['catch'](3);

              if (_context2.t3 instanceof Error) emit(['e', id, null, { name: _context2.t3.name, message: _context2.t3.message }]);else emit(['e', id, null, _context2.t3]);
              incoming.delete(id);

            case 20:
              _context2.next = 23;
              break;

            case 22:
              if (type === 's') outgoing.get(id).resolve(payload);else if (type === 'e') outgoing.get(id).reject(payload);

            case 23:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[3, 16]]);
    }));

    return function receiver(_x5) {
      return ref.apply(this, arguments);
    };
  }();

  /* Syncronization */

  var bridge = void 0;

  var incoming = new Set();
  var outgoing = new Map();
  var responders = new Map();

  function emit(data) {
    try {
      bridge.emitter(data);
    } catch (error) {}
  }

  function respond(name, callback) {
    responders.set(name, callback);
  }function resend(ids) {
    ids = new Set(ids);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = outgoing.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _slicedToArray(_step.value, 2);

        var id = _step$value[0];
        var record = _step$value[1];

        if (!ids.has(id)) {
          emit(['q', id, record.name, record.payload]);
        }
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

  function onsync(ids) {
    resend(ids);
    return Array.from(incoming.keys());
  }

  function sync() {
    var timeout = arguments.length <= 0 || arguments[0] === undefined ? 1000 : arguments[0];

    return request('__sync__', Array.from(incoming.keys()), timeout).then(resend);
  }

  respond('__sync__', onsync);

  /* Exports */

  bridge = { sync: sync, request: request, receiver: receiver, respond: respond };

  return bridge;
};
