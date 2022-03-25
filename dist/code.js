/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/airtable.js":
/*!*************************!*\
  !*** ./src/airtable.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var require;require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c=undefined;if(!f&&c)return require(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u=undefined,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
  "use strict";
  // istanbul ignore file
  var AbortController;
  if (typeof window === 'undefined') {
      AbortController = require('abort-controller');
  }
  else if ('signal' in new Request('')) {
      AbortController = window.AbortController;
  }
  else {
      /* eslint-disable @typescript-eslint/no-var-requires */
      var polyfill = require('abortcontroller-polyfill/dist/cjs-ponyfill');
      /* eslint-enable @typescript-eslint/no-var-requires */
      AbortController = polyfill.AbortController;
  }
  module.exports = AbortController;
  
  },{"abort-controller":20,"abortcontroller-polyfill/dist/cjs-ponyfill":19}],2:[function(require,module,exports){
  "use strict";
  var AirtableError = /** @class */ (function () {
      function AirtableError(error, message, statusCode) {
          this.error = error;
          this.message = message;
          this.statusCode = statusCode;
      }
      AirtableError.prototype.toString = function () {
          return [
              this.message,
              '(',
              this.error,
              ')',
              this.statusCode ? "[Http code " + this.statusCode + "]" : '',
          ].join('');
      };
      return AirtableError;
  }());
  module.exports = AirtableError;
  
  },{}],3:[function(require,module,exports){
  "use strict";
  var __assign = (this && this.__assign) || function () {
      __assign = Object.assign || function(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                  t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };
  var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  var get_1 = __importDefault(require("lodash/get"));
  var isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
  var keys_1 = __importDefault(require("lodash/keys"));
  var fetch_1 = __importDefault(require("./fetch"));
  var abort_controller_1 = __importDefault(require("./abort-controller"));
  var object_to_query_param_string_1 = __importDefault(require("./object_to_query_param_string"));
  var airtable_error_1 = __importDefault(require("./airtable_error"));
  var table_1 = __importDefault(require("./table"));
  var http_headers_1 = __importDefault(require("./http_headers"));
  var run_action_1 = __importDefault(require("./run_action"));
  var package_version_1 = __importDefault(require("./package_version"));
  var exponential_backoff_with_jitter_1 = __importDefault(require("./exponential_backoff_with_jitter"));
  var userAgent = "Airtable.js/" + package_version_1.default;
  var Base = /** @class */ (function () {
      function Base(airtable, baseId) {
          this._airtable = airtable;
          this._id = baseId;
      }
      Base.prototype.table = function (tableName) {
          return new table_1.default(this, null, tableName);
      };
      Base.prototype.makeRequest = function (options) {
          var _this = this;
          var _a;
          if (options === void 0) { options = {}; }
          var method = get_1.default(options, 'method', 'GET').toUpperCase();
          var url = this._airtable._endpointUrl + "/v" + this._airtable._apiVersionMajor + "/" + this._id + get_1.default(options, 'path', '/') + "?" + object_to_query_param_string_1.default(get_1.default(options, 'qs', {}));
          var controller = new abort_controller_1.default();
          var headers = this._getRequestHeaders(Object.assign({}, this._airtable._customHeaders, (_a = options.headers) !== null && _a !== void 0 ? _a : {}));
          var requestOptions = {
              method: method,
              headers: headers,
              signal: controller.signal,
          };
          if ('body' in options && _canRequestMethodIncludeBody(method)) {
              requestOptions.body = JSON.stringify(options.body);
          }
          var timeout = setTimeout(function () {
              controller.abort();
          }, this._airtable._requestTimeout);
          return new Promise(function (resolve, reject) {
              fetch_1.default(url, requestOptions)
                  .then(function (resp) {
                  clearTimeout(timeout);
                  if (resp.status === 429 && !_this._airtable._noRetryIfRateLimited) {
                      var numAttempts_1 = get_1.default(options, '_numAttempts', 0);
                      var backoffDelayMs = exponential_backoff_with_jitter_1.default(numAttempts_1);
                      setTimeout(function () {
                          var newOptions = __assign(__assign({}, options), { _numAttempts: numAttempts_1 + 1 });
                          _this.makeRequest(newOptions)
                              .then(resolve)
                              .catch(reject);
                      }, backoffDelayMs);
                  }
                  else {
                      resp.json()
                          .then(function (body) {
                          var err = _this._checkStatusForError(resp.status, body) ||
                              _getErrorForNonObjectBody(resp.status, body);
                          if (err) {
                              reject(err);
                          }
                          else {
                              resolve({
                                  statusCode: resp.status,
                                  headers: resp.headers,
                                  body: body,
                              });
                          }
                      })
                          .catch(function () {
                          var err = _getErrorForNonObjectBody(resp.status);
                          reject(err);
                      });
                  }
              })
                  .catch(function (err) {
                  clearTimeout(timeout);
                  err = new airtable_error_1.default('CONNECTION_ERROR', err.message, null);
                  reject(err);
              });
          });
      };
      /**
       * @deprecated This method is deprecated.
       */
      Base.prototype.runAction = function (method, path, queryParams, bodyData, callback) {
          run_action_1.default(this, method, path, queryParams, bodyData, callback, 0);
      };
      Base.prototype._getRequestHeaders = function (headers) {
          var result = new http_headers_1.default();
          result.set('Authorization', "Bearer " + this._airtable._apiKey);
          result.set('User-Agent', userAgent);
          result.set('Content-Type', 'application/json');
          for (var _i = 0, _a = keys_1.default(headers); _i < _a.length; _i++) {
              var headerKey = _a[_i];
              result.set(headerKey, headers[headerKey]);
          }
          return result.toJSON();
      };
      Base.prototype._checkStatusForError = function (statusCode, body) {
          var _a = (body !== null && body !== void 0 ? body : { error: {} }).error, error = _a === void 0 ? {} : _a;
          var type = error.type, message = error.message;
          if (statusCode === 401) {
              return new airtable_error_1.default('AUTHENTICATION_REQUIRED', 'You should provide valid api key to perform this operation', statusCode);
          }
          else if (statusCode === 403) {
              return new airtable_error_1.default('NOT_AUTHORIZED', 'You are not authorized to perform this operation', statusCode);
          }
          else if (statusCode === 404) {
              return new airtable_error_1.default('NOT_FOUND', message !== null && message !== void 0 ? message : 'Could not find what you are looking for', statusCode);
          }
          else if (statusCode === 413) {
              return new airtable_error_1.default('REQUEST_TOO_LARGE', 'Request body is too large', statusCode);
          }
          else if (statusCode === 422) {
              return new airtable_error_1.default(type !== null && type !== void 0 ? type : 'UNPROCESSABLE_ENTITY', message !== null && message !== void 0 ? message : 'The operation cannot be processed', statusCode);
          }
          else if (statusCode === 429) {
              return new airtable_error_1.default('TOO_MANY_REQUESTS', 'You have made too many requests in a short period of time. Please retry your request later', statusCode);
          }
          else if (statusCode === 500) {
              return new airtable_error_1.default('SERVER_ERROR', 'Try again. If the problem persists, contact support.', statusCode);
          }
          else if (statusCode === 503) {
              return new airtable_error_1.default('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please retry shortly.', statusCode);
          }
          else if (statusCode >= 400) {
              return new airtable_error_1.default(type !== null && type !== void 0 ? type : 'UNEXPECTED_ERROR', message !== null && message !== void 0 ? message : 'An unexpected error occurred', statusCode);
          }
          else {
              return null;
          }
      };
      Base.prototype.doCall = function (tableName) {
          return this.table(tableName);
      };
      Base.prototype.getId = function () {
          return this._id;
      };
      Base.createFunctor = function (airtable, baseId) {
          var base = new Base(airtable, baseId);
          var baseFn = function (tableName) {
              return base.doCall(tableName);
          };
          baseFn._base = base;
          baseFn.table = base.table.bind(base);
          baseFn.makeRequest = base.makeRequest.bind(base);
          baseFn.runAction = base.runAction.bind(base);
          baseFn.getId = base.getId.bind(base);
          return baseFn;
      };
      return Base;
  }());
  function _canRequestMethodIncludeBody(method) {
      return method !== 'GET' && method !== 'DELETE';
  }
  function _getErrorForNonObjectBody(statusCode, body) {
      if (isPlainObject_1.default(body)) {
          return null;
      }
      else {
          return new airtable_error_1.default('UNEXPECTED_ERROR', 'The response from Airtable was invalid JSON. Please try again soon.', statusCode);
      }
  }
  module.exports = Base;
  
  },{"./abort-controller":1,"./airtable_error":2,"./exponential_backoff_with_jitter":6,"./fetch":7,"./http_headers":9,"./object_to_query_param_string":11,"./package_version":12,"./run_action":16,"./table":17,"lodash/get":77,"lodash/isPlainObject":88,"lodash/keys":92}],4:[function(require,module,exports){
  "use strict";
  /**
   * Given a function fn that takes a callback as its last argument, returns
   * a new version of the function that takes the callback optionally. If
   * the function is not called with a callback for the last argument, the
   * function will return a promise instead.
   */
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
  function callbackToPromise(fn, context, callbackArgIndex) {
      if (callbackArgIndex === void 0) { callbackArgIndex = void 0; }
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
      return function () {
          var callArgs = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              callArgs[_i] = arguments[_i];
          }
          var thisCallbackArgIndex;
          if (callbackArgIndex === void 0) {
              // istanbul ignore next
              thisCallbackArgIndex = callArgs.length > 0 ? callArgs.length - 1 : 0;
          }
          else {
              thisCallbackArgIndex = callbackArgIndex;
          }
          var callbackArg = callArgs[thisCallbackArgIndex];
          if (typeof callbackArg === 'function') {
              fn.apply(context, callArgs);
              return void 0;
          }
          else {
              var args_1 = [];
              // If an explicit callbackArgIndex is set, but the function is called
              // with too few arguments, we want to push undefined onto args so that
              // our constructed callback ends up at the right index.
              var argLen = Math.max(callArgs.length, thisCallbackArgIndex);
              for (var i = 0; i < argLen; i++) {
                  args_1.push(callArgs[i]);
              }
              return new Promise(function (resolve, reject) {
                  args_1.push(function (err, result) {
                      if (err) {
                          reject(err);
                      }
                      else {
                          resolve(result);
                      }
                  });
                  fn.apply(context, args_1);
              });
          }
      };
  }
  module.exports = callbackToPromise;
  
  },{}],5:[function(require,module,exports){
  "use strict";
  var didWarnForDeprecation = {};
  /**
   * Convenience function for marking a function as deprecated.
   *
   * Will emit a warning the first time that function is called.
   *
   * @param fn the function to mark as deprecated.
   * @param key a unique key identifying the function.
   * @param message the warning message.
   *
   * @return a wrapped function
   */
  function deprecate(fn, key, message) {
      return function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          if (!didWarnForDeprecation[key]) {
              didWarnForDeprecation[key] = true;
              console.warn(message);
          }
          fn.apply(this, args);
      };
  }
  module.exports = deprecate;
  
  },{}],6:[function(require,module,exports){
  "use strict";
  var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  var internal_config_json_1 = __importDefault(require("./internal_config.json"));
  // "Full Jitter" algorithm taken from https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
  function exponentialBackoffWithJitter(numberOfRetries) {
      var rawBackoffTimeMs = internal_config_json_1.default.INITIAL_RETRY_DELAY_IF_RATE_LIMITED * Math.pow(2, numberOfRetries);
      var clippedBackoffTimeMs = Math.min(internal_config_json_1.default.MAX_RETRY_DELAY_IF_RATE_LIMITED, rawBackoffTimeMs);
      var jitteredBackoffTimeMs = Math.random() * clippedBackoffTimeMs;
      return jitteredBackoffTimeMs;
  }
  module.exports = exponentialBackoffWithJitter;
  
  },{"./internal_config.json":10}],7:[function(require,module,exports){
  "use strict";
  var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  // istanbul ignore file
  var node_fetch_1 = __importDefault(require("node-fetch"));
  module.exports = typeof window === 'undefined' ? node_fetch_1.default : window.fetch.bind(window);
  
  },{"node-fetch":20}],8:[function(require,module,exports){
  "use strict";
  /* eslint-enable @typescript-eslint/no-explicit-any */
  function has(object, property) {
      return Object.prototype.hasOwnProperty.call(object, property);
  }
  module.exports = has;
  
  },{}],9:[function(require,module,exports){
  "use strict";
  var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  var keys_1 = __importDefault(require("lodash/keys"));
  var isBrowser = typeof window !== 'undefined';
  var HttpHeaders = /** @class */ (function () {
      function HttpHeaders() {
          this._headersByLowercasedKey = {};
      }
      HttpHeaders.prototype.set = function (headerKey, headerValue) {
          var lowercasedKey = headerKey.toLowerCase();
          if (lowercasedKey === 'x-airtable-user-agent') {
              lowercasedKey = 'user-agent';
              headerKey = 'User-Agent';
          }
          this._headersByLowercasedKey[lowercasedKey] = {
              headerKey: headerKey,
              headerValue: headerValue,
          };
      };
      HttpHeaders.prototype.toJSON = function () {
          var result = {};
          for (var _i = 0, _a = keys_1.default(this._headersByLowercasedKey); _i < _a.length; _i++) {
              var lowercasedKey = _a[_i];
              var headerDefinition = this._headersByLowercasedKey[lowercasedKey];
              var headerKey = void 0;
              /* istanbul ignore next */
              if (isBrowser && lowercasedKey === 'user-agent') {
                  // Some browsers do not allow overriding the user agent.
                  // https://github.com/Airtable/airtable.js/issues/52
                  headerKey = 'X-Airtable-User-Agent';
              }
              else {
                  headerKey = headerDefinition.headerKey;
              }
              result[headerKey] = headerDefinition.headerValue;
          }
          return result;
      };
      return HttpHeaders;
  }());
  module.exports = HttpHeaders;
  
  },{"lodash/keys":92}],10:[function(require,module,exports){
  module.exports={
      "INITIAL_RETRY_DELAY_IF_RATE_LIMITED": 5000,
      "MAX_RETRY_DELAY_IF_RATE_LIMITED": 600000
  }
  
  },{}],11:[function(require,module,exports){
  "use strict";
  var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  var isArray_1 = __importDefault(require("lodash/isArray"));
  var isNil_1 = __importDefault(require("lodash/isNil"));
  var keys_1 = __importDefault(require("lodash/keys"));
  /* eslint-enable @typescript-eslint/no-explicit-any */
  // Adapted from jQuery.param:
  // https://github.com/jquery/jquery/blob/2.2-stable/src/serialize.js
  function buildParams(prefix, obj, addFn) {
      if (isArray_1.default(obj)) {
          // Serialize array item.
          for (var index = 0; index < obj.length; index++) {
              var value = obj[index];
              if (/\[\]$/.test(prefix)) {
                  // Treat each array item as a scalar.
                  addFn(prefix, value);
              }
              else {
                  // Item is non-scalar (array or object), encode its numeric index.
                  buildParams(prefix + "[" + (typeof value === 'object' && value !== null ? index : '') + "]", value, addFn);
              }
          }
      }
      else if (typeof obj === 'object') {
          // Serialize object item.
          for (var _i = 0, _a = keys_1.default(obj); _i < _a.length; _i++) {
              var key = _a[_i];
              var value = obj[key];
              buildParams(prefix + "[" + key + "]", value, addFn);
          }
      }
      else {
          // Serialize scalar item.
          addFn(prefix, obj);
      }
  }
  function objectToQueryParamString(obj) {
      var parts = [];
      var addFn = function (key, value) {
          value = isNil_1.default(value) ? '' : value;
          parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
      };
      for (var _i = 0, _a = keys_1.default(obj); _i < _a.length; _i++) {
          var key = _a[_i];
          var value = obj[key];
          buildParams(key, value, addFn);
      }
      return parts.join('&').replace(/%20/g, '+');
  }
  module.exports = objectToQueryParamString;
  
  },{"lodash/isArray":79,"lodash/isNil":84,"lodash/keys":92}],12:[function(require,module,exports){
  "use strict";
  module.exports = "0.11.2";
  
  },{}],13:[function(require,module,exports){
  "use strict";
  var __assign = (this && this.__assign) || function () {
      __assign = Object.assign || function(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                  t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };
  var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  var isFunction_1 = __importDefault(require("lodash/isFunction"));
  var keys_1 = __importDefault(require("lodash/keys"));
  var record_1 = __importDefault(require("./record"));
  var callback_to_promise_1 = __importDefault(require("./callback_to_promise"));
  var has_1 = __importDefault(require("./has"));
  var query_params_1 = require("./query_params");
  /**
   * Builds a query object. Won't fetch until `firstPage` or
   * or `eachPage` is called.
   *
   * Params should be validated prior to being passed to Query
   * with `Query.validateParams`.
   */
  var Query = /** @class */ (function () {
      function Query(table, params) {
          this._table = table;
          this._params = params;
          this.firstPage = callback_to_promise_1.default(firstPage, this);
          this.eachPage = callback_to_promise_1.default(eachPage, this, 1);
          this.all = callback_to_promise_1.default(all, this);
      }
      /**
       * Validates the parameters for passing to the Query constructor.
       *
       * @params {object} params parameters to validate
       *
       * @return an object with two keys:
       *  validParams: the object that should be passed to the constructor.
       *  ignoredKeys: a list of keys that will be ignored.
       *  errors: a list of error messages.
       */
      Query.validateParams = function (params) {
          var validParams = {};
          var ignoredKeys = [];
          var errors = [];
          for (var _i = 0, _a = keys_1.default(params); _i < _a.length; _i++) {
              var key = _a[_i];
              var value = params[key];
              if (has_1.default(Query.paramValidators, key)) {
                  var validator = Query.paramValidators[key];
                  var validationResult = validator(value);
                  if (validationResult.pass) {
                      validParams[key] = value;
                  }
                  else {
                      errors.push(validationResult.error);
                  }
              }
              else {
                  ignoredKeys.push(key);
              }
          }
          return {
              validParams: validParams,
              ignoredKeys: ignoredKeys,
              errors: errors,
          };
      };
      Query.paramValidators = query_params_1.paramValidators;
      return Query;
  }());
  /**
   * Fetches the first page of results for the query asynchronously,
   * then calls `done(error, records)`.
   */
  function firstPage(done) {
      if (!isFunction_1.default(done)) {
          throw new Error('The first parameter to `firstPage` must be a function');
      }
      this.eachPage(function (records) {
          done(null, records);
      }, function (error) {
          done(error, null);
      });
  }
  /**
   * Fetches each page of results for the query asynchronously.
   *
   * Calls `pageCallback(records, fetchNextPage)` for each
   * page. You must call `fetchNextPage()` to fetch the next page of
   * results.
   *
   * After fetching all pages, or if there's an error, calls
   * `done(error)`.
   */
  function eachPage(pageCallback, done) {
      var _this = this;
      if (!isFunction_1.default(pageCallback)) {
          throw new Error('The first parameter to `eachPage` must be a function');
      }
      if (!isFunction_1.default(done) && done !== void 0) {
          throw new Error('The second parameter to `eachPage` must be a function or undefined');
      }
      var path = "/" + this._table._urlEncodedNameOrId();
      var params = __assign({}, this._params);
      var inner = function () {
          _this._table._base.runAction('get', path, params, null, function (err, response, result) {
              if (err) {
                  done(err, null);
              }
              else {
                  var next = void 0;
                  if (result.offset) {
                      params.offset = result.offset;
                      next = inner;
                  }
                  else {
                      next = function () {
                          done(null);
                      };
                  }
                  var records = result.records.map(function (recordJson) {
                      return new record_1.default(_this._table, null, recordJson);
                  });
                  pageCallback(records, next);
              }
          });
      };
      inner();
  }
  /**
   * Fetches all pages of results asynchronously. May take a long time.
   */
  function all(done) {
      if (!isFunction_1.default(done)) {
          throw new Error('The first parameter to `all` must be a function');
      }
      var allRecords = [];
      this.eachPage(function (pageRecords, fetchNextPage) {
          allRecords.push.apply(allRecords, pageRecords);
          fetchNextPage();
      }, function (err) {
          if (err) {
              done(err, null);
          }
          else {
              done(null, allRecords);
          }
      });
  }
  module.exports = Query;
  
  },{"./callback_to_promise":4,"./has":8,"./query_params":14,"./record":15,"lodash/isFunction":82,"lodash/keys":92}],14:[function(require,module,exports){
  "use strict";
  var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.paramValidators = void 0;
  var typecheck_1 = __importDefault(require("./typecheck"));
  var isString_1 = __importDefault(require("lodash/isString"));
  var isNumber_1 = __importDefault(require("lodash/isNumber"));
  var isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
  exports.paramValidators = {
      fields: typecheck_1.default(typecheck_1.default.isArrayOf(isString_1.default), 'the value for `fields` should be an array of strings'),
      filterByFormula: typecheck_1.default(isString_1.default, 'the value for `filterByFormula` should be a string'),
      maxRecords: typecheck_1.default(isNumber_1.default, 'the value for `maxRecords` should be a number'),
      pageSize: typecheck_1.default(isNumber_1.default, 'the value for `pageSize` should be a number'),
      offset: typecheck_1.default(isNumber_1.default, 'the value for `offset` should be a number'),
      sort: typecheck_1.default(typecheck_1.default.isArrayOf(function (obj) {
          return (isPlainObject_1.default(obj) &&
              isString_1.default(obj.field) &&
              (obj.direction === void 0 || ['asc', 'desc'].includes(obj.direction)));
      }), 'the value for `sort` should be an array of sort objects. ' +
          'Each sort object must have a string `field` value, and an optional ' +
          '`direction` value that is "asc" or "desc".'),
      view: typecheck_1.default(isString_1.default, 'the value for `view` should be a string'),
      cellFormat: typecheck_1.default(function (cellFormat) {
          return isString_1.default(cellFormat) && ['json', 'string'].includes(cellFormat);
      }, 'the value for `cellFormat` should be "json" or "string"'),
      timeZone: typecheck_1.default(isString_1.default, 'the value for `timeZone` should be a string'),
      userLocale: typecheck_1.default(isString_1.default, 'the value for `userLocale` should be a string'),
  };
  
  },{"./typecheck":18,"lodash/isNumber":85,"lodash/isPlainObject":88,"lodash/isString":89}],15:[function(require,module,exports){
  "use strict";
  var __assign = (this && this.__assign) || function () {
      __assign = Object.assign || function(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                  t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };
  var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  var callback_to_promise_1 = __importDefault(require("./callback_to_promise"));
  var Record = /** @class */ (function () {
      function Record(table, recordId, recordJson) {
          this._table = table;
          this.id = recordId || recordJson.id;
          this.setRawJson(recordJson);
          this.save = callback_to_promise_1.default(save, this);
          this.patchUpdate = callback_to_promise_1.default(patchUpdate, this);
          this.putUpdate = callback_to_promise_1.default(putUpdate, this);
          this.destroy = callback_to_promise_1.default(destroy, this);
          this.fetch = callback_to_promise_1.default(fetch, this);
          this.updateFields = this.patchUpdate;
          this.replaceFields = this.putUpdate;
      }
      Record.prototype.getId = function () {
          return this.id;
      };
      Record.prototype.get = function (columnName) {
          return this.fields[columnName];
      };
      Record.prototype.set = function (columnName, columnValue) {
          this.fields[columnName] = columnValue;
      };
      Record.prototype.setRawJson = function (rawJson) {
          this._rawJson = rawJson;
          this.fields = (this._rawJson && this._rawJson.fields) || {};
      };
      return Record;
  }());
  function save(done) {
      this.putUpdate(this.fields, done);
  }
  function patchUpdate(cellValuesByName, opts, done) {
      var _this = this;
      if (!done) {
          done = opts;
          opts = {};
      }
      var updateBody = __assign({ fields: cellValuesByName }, opts);
      this._table._base.runAction('patch', "/" + this._table._urlEncodedNameOrId() + "/" + this.id, {}, updateBody, function (err, response, results) {
          if (err) {
              done(err);
              return;
          }
          _this.setRawJson(results);
          done(null, _this);
      });
  }
  function putUpdate(cellValuesByName, opts, done) {
      var _this = this;
      if (!done) {
          done = opts;
          opts = {};
      }
      var updateBody = __assign({ fields: cellValuesByName }, opts);
      this._table._base.runAction('put', "/" + this._table._urlEncodedNameOrId() + "/" + this.id, {}, updateBody, function (err, response, results) {
          if (err) {
              done(err);
              return;
          }
          _this.setRawJson(results);
          done(null, _this);
      });
  }
  function destroy(done) {
      var _this = this;
      this._table._base.runAction('delete', "/" + this._table._urlEncodedNameOrId() + "/" + this.id, {}, null, function (err) {
          if (err) {
              done(err);
              return;
          }
          done(null, _this);
      });
  }
  function fetch(done) {
      var _this = this;
      this._table._base.runAction('get', "/" + this._table._urlEncodedNameOrId() + "/" + this.id, {}, null, function (err, response, results) {
          if (err) {
              done(err);
              return;
          }
          _this.setRawJson(results);
          done(null, _this);
      });
  }
  module.exports = Record;
  
  },{"./callback_to_promise":4}],16:[function(require,module,exports){
  "use strict";
  var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  var exponential_backoff_with_jitter_1 = __importDefault(require("./exponential_backoff_with_jitter"));
  var object_to_query_param_string_1 = __importDefault(require("./object_to_query_param_string"));
  var package_version_1 = __importDefault(require("./package_version"));
  var fetch_1 = __importDefault(require("./fetch"));
  var abort_controller_1 = __importDefault(require("./abort-controller"));
  var userAgent = "Airtable.js/" + package_version_1.default;
  function runAction(base, method, path, queryParams, bodyData, callback, numAttempts) {
      var url = base._airtable._endpointUrl + "/v" + base._airtable._apiVersionMajor + "/" + base._id + path + "?" + object_to_query_param_string_1.default(queryParams);
      var headers = {
          authorization: "Bearer " + base._airtable._apiKey,
          'x-api-version': base._airtable._apiVersion,
          'x-airtable-application-id': base.getId(),
          'content-type': 'application/json',
      };
      var isBrowser = typeof window !== 'undefined';
      // Some browsers do not allow overriding the user agent.
      // https://github.com/Airtable/airtable.js/issues/52
      if (isBrowser) {
          headers['x-airtable-user-agent'] = userAgent;
      }
      else {
          headers['User-Agent'] = userAgent;
      }
      var controller = new abort_controller_1.default();
      var normalizedMethod = method.toUpperCase();
      var options = {
          method: normalizedMethod,
          headers: headers,
          signal: controller.signal,
      };
      if (bodyData !== null) {
          if (normalizedMethod === 'GET' || normalizedMethod === 'HEAD') {
              console.warn('body argument to runAction are ignored with GET or HEAD requests');
          }
          else {
              options.body = JSON.stringify(bodyData);
          }
      }
      var timeout = setTimeout(function () {
          controller.abort();
      }, base._airtable._requestTimeout);
      fetch_1.default(url, options)
          .then(function (resp) {
          clearTimeout(timeout);
          if (resp.status === 429 && !base._airtable._noRetryIfRateLimited) {
              var backoffDelayMs = exponential_backoff_with_jitter_1.default(numAttempts);
              setTimeout(function () {
                  runAction(base, method, path, queryParams, bodyData, callback, numAttempts + 1);
              }, backoffDelayMs);
          }
          else {
              resp.json()
                  .then(function (body) {
                  var error = base._checkStatusForError(resp.status, body);
                  // Ensure Response interface matches interface from
                  // `request` Response object
                  var r = {};
                  Object.keys(resp).forEach(function (property) {
                      r[property] = resp[property];
                  });
                  r.body = body;
                  r.statusCode = resp.status;
                  callback(error, r, body);
              })
                  .catch(function () {
                  callback(base._checkStatusForError(resp.status));
              });
          }
      })
          .catch(function (error) {
          clearTimeout(timeout);
          callback(error);
      });
  }
  module.exports = runAction;
  
  },{"./abort-controller":1,"./exponential_backoff_with_jitter":6,"./fetch":7,"./object_to_query_param_string":11,"./package_version":12}],17:[function(require,module,exports){
  "use strict";
  var __assign = (this && this.__assign) || function () {
      __assign = Object.assign || function(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                  t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };
  var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  var isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
  var deprecate_1 = __importDefault(require("./deprecate"));
  var query_1 = __importDefault(require("./query"));
  var record_1 = __importDefault(require("./record"));
  var callback_to_promise_1 = __importDefault(require("./callback_to_promise"));
  var Table = /** @class */ (function () {
      function Table(base, tableId, tableName) {
          if (!tableId && !tableName) {
              throw new Error('Table name or table ID is required');
          }
          this._base = base;
          this.id = tableId;
          this.name = tableName;
          // Public API
          this.find = callback_to_promise_1.default(this._findRecordById, this);
          this.select = this._selectRecords.bind(this);
          this.create = callback_to_promise_1.default(this._createRecords, this);
          this.update = callback_to_promise_1.default(this._updateRecords.bind(this, false), this);
          this.replace = callback_to_promise_1.default(this._updateRecords.bind(this, true), this);
          this.destroy = callback_to_promise_1.default(this._destroyRecord, this);
          // Deprecated API
          this.list = deprecate_1.default(this._listRecords.bind(this), 'table.list', 'Airtable: `list()` is deprecated. Use `select()` instead.');
          this.forEach = deprecate_1.default(this._forEachRecord.bind(this), 'table.forEach', 'Airtable: `forEach()` is deprecated. Use `select()` instead.');
      }
      Table.prototype._findRecordById = function (recordId, done) {
          var record = new record_1.default(this, recordId);
          record.fetch(done);
      };
      Table.prototype._selectRecords = function (params) {
          if (params === void 0) {
              params = {};
          }
          if (arguments.length > 1) {
              console.warn("Airtable: `select` takes only one parameter, but it was given " + arguments.length + " parameters. Use `eachPage` or `firstPage` to fetch records.");
          }
          if (isPlainObject_1.default(params)) {
              var validationResults = query_1.default.validateParams(params);
              if (validationResults.errors.length) {
                  var formattedErrors = validationResults.errors.map(function (error) {
                      return "  * " + error;
                  });
                  throw new Error("Airtable: invalid parameters for `select`:\n" + formattedErrors.join('\n'));
              }
              if (validationResults.ignoredKeys.length) {
                  console.warn("Airtable: the following parameters to `select` will be ignored: " + validationResults.ignoredKeys.join(', '));
              }
              return new query_1.default(this, validationResults.validParams);
          }
          else {
              throw new Error('Airtable: the parameter for `select` should be a plain object or undefined.');
          }
      };
      Table.prototype._urlEncodedNameOrId = function () {
          return this.id || encodeURIComponent(this.name);
      };
      Table.prototype._createRecords = function (recordsData, optionalParameters, done) {
          var _this = this;
          var isCreatingMultipleRecords = Array.isArray(recordsData);
          if (!done) {
              done = optionalParameters;
              optionalParameters = {};
          }
          var requestData;
          if (isCreatingMultipleRecords) {
              requestData = __assign({ records: recordsData }, optionalParameters);
          }
          else {
              requestData = __assign({ fields: recordsData }, optionalParameters);
          }
          this._base.runAction('post', "/" + this._urlEncodedNameOrId() + "/", {}, requestData, function (err, resp, body) {
              if (err) {
                  done(err);
                  return;
              }
              var result;
              if (isCreatingMultipleRecords) {
                  result = body.records.map(function (record) {
                      return new record_1.default(_this, record.id, record);
                  });
              }
              else {
                  result = new record_1.default(_this, body.id, body);
              }
              done(null, result);
          });
      };
      Table.prototype._updateRecords = function (isDestructiveUpdate, recordsDataOrRecordId, recordDataOrOptsOrDone, optsOrDone, done) {
          var _this = this;
          var opts;
          if (Array.isArray(recordsDataOrRecordId)) {
              var recordsData = recordsDataOrRecordId;
              opts = isPlainObject_1.default(recordDataOrOptsOrDone) ? recordDataOrOptsOrDone : {};
              done = (optsOrDone || recordDataOrOptsOrDone);
              var method = isDestructiveUpdate ? 'put' : 'patch';
              var requestData = __assign({ records: recordsData }, opts);
              this._base.runAction(method, "/" + this._urlEncodedNameOrId() + "/", {}, requestData, function (err, resp, body) {
                  if (err) {
                      done(err);
                      return;
                  }
                  var result = body.records.map(function (record) {
                      return new record_1.default(_this, record.id, record);
                  });
                  done(null, result);
              });
          }
          else {
              var recordId = recordsDataOrRecordId;
              var recordData = recordDataOrOptsOrDone;
              opts = isPlainObject_1.default(optsOrDone) ? optsOrDone : {};
              done = (done || optsOrDone);
              var record = new record_1.default(this, recordId);
              if (isDestructiveUpdate) {
                  record.putUpdate(recordData, opts, done);
              }
              else {
                  record.patchUpdate(recordData, opts, done);
              }
          }
      };
      Table.prototype._destroyRecord = function (recordIdsOrId, done) {
          var _this = this;
          if (Array.isArray(recordIdsOrId)) {
              var queryParams = { records: recordIdsOrId };
              this._base.runAction('delete', "/" + this._urlEncodedNameOrId(), queryParams, null, function (err, response, results) {
                  if (err) {
                      done(err);
                      return;
                  }
                  var records = results.records.map(function (_a) {
                      var id = _a.id;
                      return new record_1.default(_this, id, null);
                  });
                  done(null, records);
              });
          }
          else {
              var record = new record_1.default(this, recordIdsOrId);
              record.destroy(done);
          }
      };
      Table.prototype._listRecords = function (limit, offset, opts, done) {
          var _this = this;
          if (!done) {
              done = opts;
              opts = {};
          }
          var listRecordsParameters = __assign({ limit: limit,
              offset: offset }, opts);
          this._base.runAction('get', "/" + this._urlEncodedNameOrId() + "/", listRecordsParameters, null, function (err, response, results) {
              if (err) {
                  done(err);
                  return;
              }
              var records = results.records.map(function (recordJson) {
                  return new record_1.default(_this, null, recordJson);
              });
              done(null, records, results.offset);
          });
      };
      Table.prototype._forEachRecord = function (opts, callback, done) {
          var _this = this;
          if (arguments.length === 2) {
              done = callback;
              callback = opts;
              opts = {};
          }
          var limit = Table.__recordsPerPageForIteration || 100;
          var offset = null;
          var nextPage = function () {
              _this._listRecords(limit, offset, opts, function (err, page, newOffset) {
                  if (err) {
                      done(err);
                      return;
                  }
                  for (var index = 0; index < page.length; index++) {
                      callback(page[index]);
                  }
                  if (newOffset) {
                      offset = newOffset;
                      nextPage();
                  }
                  else {
                      done();
                  }
              });
          };
          nextPage();
      };
      return Table;
  }());
  module.exports = Table;
  
  },{"./callback_to_promise":4,"./deprecate":5,"./query":13,"./record":15,"lodash/isPlainObject":88}],18:[function(require,module,exports){
  "use strict";
  /* eslint-enable @typescript-eslint/no-explicit-any */
  function check(fn, error) {
      return function (value) {
          if (fn(value)) {
              return { pass: true };
          }
          else {
              return { pass: false, error: error };
          }
      };
  }
  check.isOneOf = function isOneOf(options) {
      return options.includes.bind(options);
  };
  check.isArrayOf = function (itemValidator) {
      return function (value) {
          return Array.isArray(value) && value.every(itemValidator);
      };
  };
  module.exports = check;
  
  },{}],19:[function(require,module,exports){
  'use strict';
  
  Object.defineProperty(exports, '__esModule', { value: true });
  
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  
  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }
  
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }
  
  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }
  
  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
  
    return _setPrototypeOf(o, p);
  }
  
  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
  
    return self;
  }
  
  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }
  
    return _assertThisInitialized(self);
  }
  
  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }
  
    return object;
  }
  
  function _get(target, property, receiver) {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get;
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);
  
        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);
  
        if (desc.get) {
          return desc.get.call(receiver);
        }
  
        return desc.value;
      };
    }
  
    return _get(target, property, receiver || target);
  }
  
  var Emitter =
  /*#__PURE__*/
  function () {
    function Emitter() {
      _classCallCheck(this, Emitter);
  
      Object.defineProperty(this, 'listeners', {
        value: {},
        writable: true,
        configurable: true
      });
    }
  
    _createClass(Emitter, [{
      key: "addEventListener",
      value: function addEventListener(type, callback) {
        if (!(type in this.listeners)) {
          this.listeners[type] = [];
        }
  
        this.listeners[type].push(callback);
      }
    }, {
      key: "removeEventListener",
      value: function removeEventListener(type, callback) {
        if (!(type in this.listeners)) {
          return;
        }
  
        var stack = this.listeners[type];
  
        for (var i = 0, l = stack.length; i < l; i++) {
          if (stack[i] === callback) {
            stack.splice(i, 1);
            return;
          }
        }
      }
    }, {
      key: "dispatchEvent",
      value: function dispatchEvent(event) {
        var _this = this;
  
        if (!(event.type in this.listeners)) {
          return;
        }
  
        var debounce = function debounce(callback) {
          setTimeout(function () {
            return callback.call(_this, event);
          });
        };
  
        var stack = this.listeners[event.type];
  
        for (var i = 0, l = stack.length; i < l; i++) {
          debounce(stack[i]);
        }
  
        return !event.defaultPrevented;
      }
    }]);
  
    return Emitter;
  }();
  
  var AbortSignal =
  /*#__PURE__*/
  function (_Emitter) {
    _inherits(AbortSignal, _Emitter);
  
    function AbortSignal() {
      var _this2;
  
      _classCallCheck(this, AbortSignal);
  
      _this2 = _possibleConstructorReturn(this, _getPrototypeOf(AbortSignal).call(this)); // Some versions of babel does not transpile super() correctly for IE <= 10, if the parent
      // constructor has failed to run, then "this.listeners" will still be undefined and then we call
      // the parent constructor directly instead as a workaround. For general details, see babel bug:
      // https://github.com/babel/babel/issues/3041
      // This hack was added as a fix for the issue described here:
      // https://github.com/Financial-Times/polyfill-library/pull/59#issuecomment-477558042
  
      if (!_this2.listeners) {
        Emitter.call(_assertThisInitialized(_this2));
      } // Compared to assignment, Object.defineProperty makes properties non-enumerable by default and
      // we want Object.keys(new AbortController().signal) to be [] for compat with the native impl
  
  
      Object.defineProperty(_assertThisInitialized(_this2), 'aborted', {
        value: false,
        writable: true,
        configurable: true
      });
      Object.defineProperty(_assertThisInitialized(_this2), 'onabort', {
        value: null,
        writable: true,
        configurable: true
      });
      return _this2;
    }
  
    _createClass(AbortSignal, [{
      key: "toString",
      value: function toString() {
        return '[object AbortSignal]';
      }
    }, {
      key: "dispatchEvent",
      value: function dispatchEvent(event) {
        if (event.type === 'abort') {
          this.aborted = true;
  
          if (typeof this.onabort === 'function') {
            this.onabort.call(this, event);
          }
        }
  
        _get(_getPrototypeOf(AbortSignal.prototype), "dispatchEvent", this).call(this, event);
      }
    }]);
  
    return AbortSignal;
  }(Emitter);
  var AbortController =
  /*#__PURE__*/
  function () {
    function AbortController() {
      _classCallCheck(this, AbortController);
  
      // Compared to assignment, Object.defineProperty makes properties non-enumerable by default and
      // we want Object.keys(new AbortController()) to be [] for compat with the native impl
      Object.defineProperty(this, 'signal', {
        value: new AbortSignal(),
        writable: true,
        configurable: true
      });
    }
  
    _createClass(AbortController, [{
      key: "abort",
      value: function abort() {
        var event;
  
        try {
          event = new Event('abort');
        } catch (e) {
          if (typeof document !== 'undefined') {
            if (!document.createEvent) {
              // For Internet Explorer 8:
              event = document.createEventObject();
              event.type = 'abort';
            } else {
              // For Internet Explorer 11:
              event = document.createEvent('Event');
              event.initEvent('abort', false, false);
            }
          } else {
            // Fallback where document isn't available:
            event = {
              type: 'abort',
              bubbles: false,
              cancelable: false
            };
          }
        }
  
        this.signal.dispatchEvent(event);
      }
    }, {
      key: "toString",
      value: function toString() {
        return '[object AbortController]';
      }
    }]);
  
    return AbortController;
  }();
  
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    // These are necessary to make sure that we get correct output for:
    // Object.prototype.toString.call(new AbortController())
    AbortController.prototype[Symbol.toStringTag] = 'AbortController';
    AbortSignal.prototype[Symbol.toStringTag] = 'AbortSignal';
  }
  
  function polyfillNeeded(self) {
    if (self.__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL) {
      console.log('__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL=true is set, will force install polyfill');
      return true;
    } // Note that the "unfetch" minimal fetch polyfill defines fetch() without
    // defining window.Request, and this polyfill need to work on top of unfetch
    // so the below feature detection needs the !self.AbortController part.
    // The Request.prototype check is also needed because Safari versions 11.1.2
    // up to and including 12.1.x has a window.AbortController present but still
    // does NOT correctly implement abortable fetch:
    // https://bugs.webkit.org/show_bug.cgi?id=174980#c2
  
  
    return typeof self.Request === 'function' && !self.Request.prototype.hasOwnProperty('signal') || !self.AbortController;
  }
  
  /**
   * Note: the "fetch.Request" default value is available for fetch imported from
   * the "node-fetch" package and not in browsers. This is OK since browsers
   * will be importing umd-polyfill.js from that path "self" is passed the
   * decorator so the default value will not be used (because browsers that define
   * fetch also has Request). One quirky setup where self.fetch exists but
   * self.Request does not is when the "unfetch" minimal fetch polyfill is used
   * on top of IE11; for this case the browser will try to use the fetch.Request
   * default value which in turn will be undefined but then then "if (Request)"
   * will ensure that you get a patched fetch but still no Request (as expected).
   * @param {fetch, Request = fetch.Request}
   * @returns {fetch: abortableFetch, Request: AbortableRequest}
   */
  
  function abortableFetchDecorator(patchTargets) {
    if ('function' === typeof patchTargets) {
      patchTargets = {
        fetch: patchTargets
      };
    }
  
    var _patchTargets = patchTargets,
        fetch = _patchTargets.fetch,
        _patchTargets$Request = _patchTargets.Request,
        NativeRequest = _patchTargets$Request === void 0 ? fetch.Request : _patchTargets$Request,
        NativeAbortController = _patchTargets.AbortController,
        _patchTargets$__FORCE = _patchTargets.__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL,
        __FORCE_INSTALL_ABORTCONTROLLER_POLYFILL = _patchTargets$__FORCE === void 0 ? false : _patchTargets$__FORCE;
  
    if (!polyfillNeeded({
      fetch: fetch,
      Request: NativeRequest,
      AbortController: NativeAbortController,
      __FORCE_INSTALL_ABORTCONTROLLER_POLYFILL: __FORCE_INSTALL_ABORTCONTROLLER_POLYFILL
    })) {
      return {
        fetch: fetch,
        Request: Request
      };
    }
  
    var Request = NativeRequest; // Note that the "unfetch" minimal fetch polyfill defines fetch() without
    // defining window.Request, and this polyfill need to work on top of unfetch
    // hence we only patch it if it's available. Also we don't patch it if signal
    // is already available on the Request prototype because in this case support
    // is present and the patching below can cause a crash since it assigns to
    // request.signal which is technically a read-only property. This latter error
    // happens when you run the main5.js node-fetch example in the repo
    // "abortcontroller-polyfill-examples". The exact error is:
    //   request.signal = init.signal;
    //   ^
    // TypeError: Cannot set property signal of #<Request> which has only a getter
  
    if (Request && !Request.prototype.hasOwnProperty('signal') || __FORCE_INSTALL_ABORTCONTROLLER_POLYFILL) {
      Request = function Request(input, init) {
        var signal;
  
        if (init && init.signal) {
          signal = init.signal; // Never pass init.signal to the native Request implementation when the polyfill has
          // been installed because if we're running on top of a browser with a
          // working native AbortController (i.e. the polyfill was installed due to
          // __FORCE_INSTALL_ABORTCONTROLLER_POLYFILL being set), then passing our
          // fake AbortSignal to the native fetch will trigger:
          // TypeError: Failed to construct 'Request': member signal is not of type AbortSignal.
  
          delete init.signal;
        }
  
        var request = new NativeRequest(input, init);
  
        if (signal) {
          Object.defineProperty(request, 'signal', {
            writable: false,
            enumerable: false,
            configurable: true,
            value: signal
          });
        }
  
        return request;
      };
  
      Request.prototype = NativeRequest.prototype;
    }
  
    var realFetch = fetch;
  
    var abortableFetch = function abortableFetch(input, init) {
      var signal = Request && Request.prototype.isPrototypeOf(input) ? input.signal : init ? init.signal : undefined;
  
      if (signal) {
        var abortError;
  
        try {
          abortError = new DOMException('Aborted', 'AbortError');
        } catch (err) {
          // IE 11 does not support calling the DOMException constructor, use a
          // regular error object on it instead.
          abortError = new Error('Aborted');
          abortError.name = 'AbortError';
        } // Return early if already aborted, thus avoiding making an HTTP request
  
  
        if (signal.aborted) {
          return Promise.reject(abortError);
        } // Turn an event into a promise, reject it once `abort` is dispatched
  
  
        var cancellation = new Promise(function (_, reject) {
          signal.addEventListener('abort', function () {
            return reject(abortError);
          }, {
            once: true
          });
        });
  
        if (init && init.signal) {
          // Never pass .signal to the native implementation when the polyfill has
          // been installed because if we're running on top of a browser with a
          // working native AbortController (i.e. the polyfill was installed due to
          // __FORCE_INSTALL_ABORTCONTROLLER_POLYFILL being set), then passing our
          // fake AbortSignal to the native fetch will trigger:
          // TypeError: Failed to execute 'fetch' on 'Window': member signal is not of type AbortSignal.
          delete init.signal;
        } // Return the fastest promise (don't need to wait for request to finish)
  
  
        return Promise.race([cancellation, realFetch(input, init)]);
      }
  
      return realFetch(input, init);
    };
  
    return {
      fetch: abortableFetch,
      Request: Request
    };
  }
  
  exports.AbortController = AbortController;
  exports.AbortSignal = AbortSignal;
  exports.abortableFetch = abortableFetchDecorator;
  
  },{}],20:[function(require,module,exports){
  
  },{}],21:[function(require,module,exports){
  var hashClear = require('./_hashClear'),
      hashDelete = require('./_hashDelete'),
      hashGet = require('./_hashGet'),
      hashHas = require('./_hashHas'),
      hashSet = require('./_hashSet');
  
  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;
  
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  
  // Add methods to `Hash`.
  Hash.prototype.clear = hashClear;
  Hash.prototype['delete'] = hashDelete;
  Hash.prototype.get = hashGet;
  Hash.prototype.has = hashHas;
  Hash.prototype.set = hashSet;
  
  module.exports = Hash;
  
  },{"./_hashClear":46,"./_hashDelete":47,"./_hashGet":48,"./_hashHas":49,"./_hashSet":50}],22:[function(require,module,exports){
  var listCacheClear = require('./_listCacheClear'),
      listCacheDelete = require('./_listCacheDelete'),
      listCacheGet = require('./_listCacheGet'),
      listCacheHas = require('./_listCacheHas'),
      listCacheSet = require('./_listCacheSet');
  
  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;
  
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  
  // Add methods to `ListCache`.
  ListCache.prototype.clear = listCacheClear;
  ListCache.prototype['delete'] = listCacheDelete;
  ListCache.prototype.get = listCacheGet;
  ListCache.prototype.has = listCacheHas;
  ListCache.prototype.set = listCacheSet;
  
  module.exports = ListCache;
  
  },{"./_listCacheClear":56,"./_listCacheDelete":57,"./_listCacheGet":58,"./_listCacheHas":59,"./_listCacheSet":60}],23:[function(require,module,exports){
  var getNative = require('./_getNative'),
      root = require('./_root');
  
  /* Built-in method references that are verified to be native. */
  var Map = getNative(root, 'Map');
  
  module.exports = Map;
  
  },{"./_getNative":42,"./_root":72}],24:[function(require,module,exports){
  var mapCacheClear = require('./_mapCacheClear'),
      mapCacheDelete = require('./_mapCacheDelete'),
      mapCacheGet = require('./_mapCacheGet'),
      mapCacheHas = require('./_mapCacheHas'),
      mapCacheSet = require('./_mapCacheSet');
  
  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;
  
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  
  // Add methods to `MapCache`.
  MapCache.prototype.clear = mapCacheClear;
  MapCache.prototype['delete'] = mapCacheDelete;
  MapCache.prototype.get = mapCacheGet;
  MapCache.prototype.has = mapCacheHas;
  MapCache.prototype.set = mapCacheSet;
  
  module.exports = MapCache;
  
  },{"./_mapCacheClear":61,"./_mapCacheDelete":62,"./_mapCacheGet":63,"./_mapCacheHas":64,"./_mapCacheSet":65}],25:[function(require,module,exports){
  var root = require('./_root');
  
  /** Built-in value references. */
  var Symbol = root.Symbol;
  
  module.exports = Symbol;
  
  },{"./_root":72}],26:[function(require,module,exports){
  var baseTimes = require('./_baseTimes'),
      isArguments = require('./isArguments'),
      isArray = require('./isArray'),
      isBuffer = require('./isBuffer'),
      isIndex = require('./_isIndex'),
      isTypedArray = require('./isTypedArray');
  
  /** Used for built-in method references. */
  var objectProto = Object.prototype;
  
  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;
  
  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray(value),
        isArg = !isArr && isArguments(value),
        isBuff = !isArr && !isArg && isBuffer(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? baseTimes(value.length, String) : [],
        length = result.length;
  
    for (var key in value) {
      if ((inherited || hasOwnProperty.call(value, key)) &&
          !(skipIndexes && (
             // Safari 9 has enumerable `arguments.length` in strict mode.
             key == 'length' ||
             // Node.js 0.10 has enumerable non-index properties on buffers.
             (isBuff && (key == 'offset' || key == 'parent')) ||
             // PhantomJS 2 has enumerable non-index properties on typed arrays.
             (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
             // Skip index properties.
             isIndex(key, length)
          ))) {
        result.push(key);
      }
    }
    return result;
  }
  
  module.exports = arrayLikeKeys;
  
  },{"./_baseTimes":35,"./_isIndex":51,"./isArguments":78,"./isArray":79,"./isBuffer":81,"./isTypedArray":91}],27:[function(require,module,exports){
  /**
   * A specialized version of `_.map` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function arrayMap(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length,
        result = Array(length);
  
    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }
  
  module.exports = arrayMap;
  
  },{}],28:[function(require,module,exports){
  var eq = require('./eq');
  
  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }
  
  module.exports = assocIndexOf;
  
  },{"./eq":76}],29:[function(require,module,exports){
  var castPath = require('./_castPath'),
      toKey = require('./_toKey');
  
  /**
   * The base implementation of `_.get` without support for default values.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @returns {*} Returns the resolved value.
   */
  function baseGet(object, path) {
    path = castPath(path, object);
  
    var index = 0,
        length = path.length;
  
    while (object != null && index < length) {
      object = object[toKey(path[index++])];
    }
    return (index && index == length) ? object : undefined;
  }
  
  module.exports = baseGet;
  
  },{"./_castPath":38,"./_toKey":74}],30:[function(require,module,exports){
  var Symbol = require('./_Symbol'),
      getRawTag = require('./_getRawTag'),
      objectToString = require('./_objectToString');
  
  /** `Object#toString` result references. */
  var nullTag = '[object Null]',
      undefinedTag = '[object Undefined]';
  
  /** Built-in value references. */
  var symToStringTag = Symbol ? Symbol.toStringTag : undefined;
  
  /**
   * The base implementation of `getTag` without fallbacks for buggy environments.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    if (value == null) {
      return value === undefined ? undefinedTag : nullTag;
    }
    return (symToStringTag && symToStringTag in Object(value))
      ? getRawTag(value)
      : objectToString(value);
  }
  
  module.exports = baseGetTag;
  
  },{"./_Symbol":25,"./_getRawTag":44,"./_objectToString":70}],31:[function(require,module,exports){
  var baseGetTag = require('./_baseGetTag'),
      isObjectLike = require('./isObjectLike');
  
  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]';
  
  /**
   * The base implementation of `_.isArguments`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   */
  function baseIsArguments(value) {
    return isObjectLike(value) && baseGetTag(value) == argsTag;
  }
  
  module.exports = baseIsArguments;
  
  },{"./_baseGetTag":30,"./isObjectLike":87}],32:[function(require,module,exports){
  var isFunction = require('./isFunction'),
      isMasked = require('./_isMasked'),
      isObject = require('./isObject'),
      toSource = require('./_toSource');
  
  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
  
  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;
  
  /** Used for built-in method references. */
  var funcProto = Function.prototype,
      objectProto = Object.prototype;
  
  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;
  
  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;
  
  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' +
    funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
    .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
  );
  
  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }
  
  module.exports = baseIsNative;
  
  },{"./_isMasked":54,"./_toSource":75,"./isFunction":82,"./isObject":86}],33:[function(require,module,exports){
  var baseGetTag = require('./_baseGetTag'),
      isLength = require('./isLength'),
      isObjectLike = require('./isObjectLike');
  
  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';
  
  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';
  
  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
  typedArrayTags[errorTag] = typedArrayTags[funcTag] =
  typedArrayTags[mapTag] = typedArrayTags[numberTag] =
  typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
  typedArrayTags[setTag] = typedArrayTags[stringTag] =
  typedArrayTags[weakMapTag] = false;
  
  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return isObjectLike(value) &&
      isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
  }
  
  module.exports = baseIsTypedArray;
  
  },{"./_baseGetTag":30,"./isLength":83,"./isObjectLike":87}],34:[function(require,module,exports){
  var isPrototype = require('./_isPrototype'),
      nativeKeys = require('./_nativeKeys');
  
  /** Used for built-in method references. */
  var objectProto = Object.prototype;
  
  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;
  
  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty.call(object, key) && key != 'constructor') {
        result.push(key);
      }
    }
    return result;
  }
  
  module.exports = baseKeys;
  
  },{"./_isPrototype":55,"./_nativeKeys":68}],35:[function(require,module,exports){
  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);
  
    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }
  
  module.exports = baseTimes;
  
  },{}],36:[function(require,module,exports){
  var Symbol = require('./_Symbol'),
      arrayMap = require('./_arrayMap'),
      isArray = require('./isArray'),
      isSymbol = require('./isSymbol');
  
  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0;
  
  /** Used to convert symbols to primitives and strings. */
  var symbolProto = Symbol ? Symbol.prototype : undefined,
      symbolToString = symbolProto ? symbolProto.toString : undefined;
  
  /**
   * The base implementation of `_.toString` which doesn't convert nullish
   * values to empty strings.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
      return value;
    }
    if (isArray(value)) {
      // Recursively convert values (susceptible to call stack limits).
      return arrayMap(value, baseToString) + '';
    }
    if (isSymbol(value)) {
      return symbolToString ? symbolToString.call(value) : '';
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
  }
  
  module.exports = baseToString;
  
  },{"./_Symbol":25,"./_arrayMap":27,"./isArray":79,"./isSymbol":90}],37:[function(require,module,exports){
  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }
  
  module.exports = baseUnary;
  
  },{}],38:[function(require,module,exports){
  var isArray = require('./isArray'),
      isKey = require('./_isKey'),
      stringToPath = require('./_stringToPath'),
      toString = require('./toString');
  
  /**
   * Casts `value` to a path array if it's not one.
   *
   * @private
   * @param {*} value The value to inspect.
   * @param {Object} [object] The object to query keys on.
   * @returns {Array} Returns the cast property path array.
   */
  function castPath(value, object) {
    if (isArray(value)) {
      return value;
    }
    return isKey(value, object) ? [value] : stringToPath(toString(value));
  }
  
  module.exports = castPath;
  
  },{"./_isKey":52,"./_stringToPath":73,"./isArray":79,"./toString":95}],39:[function(require,module,exports){
  var root = require('./_root');
  
  /** Used to detect overreaching core-js shims. */
  var coreJsData = root['__core-js_shared__'];
  
  module.exports = coreJsData;
  
  },{"./_root":72}],40:[function(require,module,exports){
  (function (global){
  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;
  
  module.exports = freeGlobal;
  
  }).call(this,typeof __webpack_require__.g !== "undefined" ? __webpack_require__.g : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  },{}],41:[function(require,module,exports){
  var isKeyable = require('./_isKeyable');
  
  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return isKeyable(key)
      ? data[typeof key == 'string' ? 'string' : 'hash']
      : data.map;
  }
  
  module.exports = getMapData;
  
  },{"./_isKeyable":53}],42:[function(require,module,exports){
  var baseIsNative = require('./_baseIsNative'),
      getValue = require('./_getValue');
  
  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : undefined;
  }
  
  module.exports = getNative;
  
  },{"./_baseIsNative":32,"./_getValue":45}],43:[function(require,module,exports){
  var overArg = require('./_overArg');
  
  /** Built-in value references. */
  var getPrototype = overArg(Object.getPrototypeOf, Object);
  
  module.exports = getPrototype;
  
  },{"./_overArg":71}],44:[function(require,module,exports){
  var Symbol = require('./_Symbol');
  
  /** Used for built-in method references. */
  var objectProto = Object.prototype;
  
  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;
  
  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString = objectProto.toString;
  
  /** Built-in value references. */
  var symToStringTag = Symbol ? Symbol.toStringTag : undefined;
  
  /**
   * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the raw `toStringTag`.
   */
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag),
        tag = value[symToStringTag];
  
    try {
      value[symToStringTag] = undefined;
      var unmasked = true;
    } catch (e) {}
  
    var result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }
  
  module.exports = getRawTag;
  
  },{"./_Symbol":25}],45:[function(require,module,exports){
  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }
  
  module.exports = getValue;
  
  },{}],46:[function(require,module,exports){
  var nativeCreate = require('./_nativeCreate');
  
  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
    this.size = 0;
  }
  
  module.exports = hashClear;
  
  },{"./_nativeCreate":67}],47:[function(require,module,exports){
  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }
  
  module.exports = hashDelete;
  
  },{}],48:[function(require,module,exports){
  var nativeCreate = require('./_nativeCreate');
  
  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';
  
  /** Used for built-in method references. */
  var objectProto = Object.prototype;
  
  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;
  
  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty.call(data, key) ? data[key] : undefined;
  }
  
  module.exports = hashGet;
  
  },{"./_nativeCreate":67}],49:[function(require,module,exports){
  var nativeCreate = require('./_nativeCreate');
  
  /** Used for built-in method references. */
  var objectProto = Object.prototype;
  
  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;
  
  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
  }
  
  module.exports = hashHas;
  
  },{"./_nativeCreate":67}],50:[function(require,module,exports){
  var nativeCreate = require('./_nativeCreate');
  
  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';
  
  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
    return this;
  }
  
  module.exports = hashSet;
  
  },{"./_nativeCreate":67}],51:[function(require,module,exports){
  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;
  
  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;
  
  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    var type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER : length;
  
    return !!length &&
      (type == 'number' ||
        (type != 'symbol' && reIsUint.test(value))) &&
          (value > -1 && value % 1 == 0 && value < length);
  }
  
  module.exports = isIndex;
  
  },{}],52:[function(require,module,exports){
  var isArray = require('./isArray'),
      isSymbol = require('./isSymbol');
  
  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/;
  
  /**
   * Checks if `value` is a property name and not a property path.
   *
   * @private
   * @param {*} value The value to check.
   * @param {Object} [object] The object to query keys on.
   * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
   */
  function isKey(value, object) {
    if (isArray(value)) {
      return false;
    }
    var type = typeof value;
    if (type == 'number' || type == 'symbol' || type == 'boolean' ||
        value == null || isSymbol(value)) {
      return true;
    }
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
      (object != null && value in Object(object));
  }
  
  module.exports = isKey;
  
  },{"./isArray":79,"./isSymbol":90}],53:[function(require,module,exports){
  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value;
    return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
      ? (value !== '__proto__')
      : (value === null);
  }
  
  module.exports = isKeyable;
  
  },{}],54:[function(require,module,exports){
  var coreJsData = require('./_coreJsData');
  
  /** Used to detect methods masquerading as native. */
  var maskSrcKey = (function() {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
    return uid ? ('Symbol(src)_1.' + uid) : '';
  }());
  
  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && (maskSrcKey in func);
  }
  
  module.exports = isMasked;
  
  },{"./_coreJsData":39}],55:[function(require,module,exports){
  /** Used for built-in method references. */
  var objectProto = Object.prototype;
  
  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;
  
    return value === proto;
  }
  
  module.exports = isPrototype;
  
  },{}],56:[function(require,module,exports){
  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }
  
  module.exports = listCacheClear;
  
  },{}],57:[function(require,module,exports){
  var assocIndexOf = require('./_assocIndexOf');
  
  /** Used for built-in method references. */
  var arrayProto = Array.prototype;
  
  /** Built-in value references. */
  var splice = arrayProto.splice;
  
  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);
  
    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }
  
  module.exports = listCacheDelete;
  
  },{"./_assocIndexOf":28}],58:[function(require,module,exports){
  var assocIndexOf = require('./_assocIndexOf');
  
  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);
  
    return index < 0 ? undefined : data[index][1];
  }
  
  module.exports = listCacheGet;
  
  },{"./_assocIndexOf":28}],59:[function(require,module,exports){
  var assocIndexOf = require('./_assocIndexOf');
  
  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
  }
  
  module.exports = listCacheHas;
  
  },{"./_assocIndexOf":28}],60:[function(require,module,exports){
  var assocIndexOf = require('./_assocIndexOf');
  
  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
        index = assocIndexOf(data, key);
  
    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }
  
  module.exports = listCacheSet;
  
  },{"./_assocIndexOf":28}],61:[function(require,module,exports){
  var Hash = require('./_Hash'),
      ListCache = require('./_ListCache'),
      Map = require('./_Map');
  
  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      'hash': new Hash,
      'map': new (Map || ListCache),
      'string': new Hash
    };
  }
  
  module.exports = mapCacheClear;
  
  },{"./_Hash":21,"./_ListCache":22,"./_Map":23}],62:[function(require,module,exports){
  var getMapData = require('./_getMapData');
  
  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    var result = getMapData(this, key)['delete'](key);
    this.size -= result ? 1 : 0;
    return result;
  }
  
  module.exports = mapCacheDelete;
  
  },{"./_getMapData":41}],63:[function(require,module,exports){
  var getMapData = require('./_getMapData');
  
  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return getMapData(this, key).get(key);
  }
  
  module.exports = mapCacheGet;
  
  },{"./_getMapData":41}],64:[function(require,module,exports){
  var getMapData = require('./_getMapData');
  
  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return getMapData(this, key).has(key);
  }
  
  module.exports = mapCacheHas;
  
  },{"./_getMapData":41}],65:[function(require,module,exports){
  var getMapData = require('./_getMapData');
  
  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    var data = getMapData(this, key),
        size = data.size;
  
    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }
  
  module.exports = mapCacheSet;
  
  },{"./_getMapData":41}],66:[function(require,module,exports){
  var memoize = require('./memoize');
  
  /** Used as the maximum memoize cache size. */
  var MAX_MEMOIZE_SIZE = 500;
  
  /**
   * A specialized version of `_.memoize` which clears the memoized function's
   * cache when it exceeds `MAX_MEMOIZE_SIZE`.
   *
   * @private
   * @param {Function} func The function to have its output memoized.
   * @returns {Function} Returns the new memoized function.
   */
  function memoizeCapped(func) {
    var result = memoize(func, function(key) {
      if (cache.size === MAX_MEMOIZE_SIZE) {
        cache.clear();
      }
      return key;
    });
  
    var cache = result.cache;
    return result;
  }
  
  module.exports = memoizeCapped;
  
  },{"./memoize":93}],67:[function(require,module,exports){
  var getNative = require('./_getNative');
  
  /* Built-in method references that are verified to be native. */
  var nativeCreate = getNative(Object, 'create');
  
  module.exports = nativeCreate;
  
  },{"./_getNative":42}],68:[function(require,module,exports){
  var overArg = require('./_overArg');
  
  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeKeys = overArg(Object.keys, Object);
  
  module.exports = nativeKeys;
  
  },{"./_overArg":71}],69:[function(require,module,exports){
  var freeGlobal = require('./_freeGlobal');
  
  /** Detect free variable `exports`. */
  var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;
  
  /** Detect free variable `module`. */
  var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;
  
  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;
  
  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && freeGlobal.process;
  
  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      // Use `util.types` for Node.js 10+.
      var types = freeModule && freeModule.require && freeModule.require('util').types;
  
      if (types) {
        return types;
      }
  
      // Legacy `process.binding('util')` for Node.js < 10.
      return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
  }());
  
  module.exports = nodeUtil;
  
  },{"./_freeGlobal":40}],70:[function(require,module,exports){
  /** Used for built-in method references. */
  var objectProto = Object.prototype;
  
  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString = objectProto.toString;
  
  /**
   * Converts `value` to a string using `Object.prototype.toString`.
   *
   * @private
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   */
  function objectToString(value) {
    return nativeObjectToString.call(value);
  }
  
  module.exports = objectToString;
  
  },{}],71:[function(require,module,exports){
  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }
  
  module.exports = overArg;
  
  },{}],72:[function(require,module,exports){
  var freeGlobal = require('./_freeGlobal');
  
  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
  
  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function('return this')();
  
  module.exports = root;
  
  },{"./_freeGlobal":40}],73:[function(require,module,exports){
  var memoizeCapped = require('./_memoizeCapped');
  
  /** Used to match property names within property paths. */
  var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
  
  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;
  
  /**
   * Converts `string` to a property path array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the property path array.
   */
  var stringToPath = memoizeCapped(function(string) {
    var result = [];
    if (string.charCodeAt(0) === 46 /* . */) {
      result.push('');
    }
    string.replace(rePropName, function(match, number, quote, subString) {
      result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
    });
    return result;
  });
  
  module.exports = stringToPath;
  
  },{"./_memoizeCapped":66}],74:[function(require,module,exports){
  var isSymbol = require('./isSymbol');
  
  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0;
  
  /**
   * Converts `value` to a string key if it's not a string or symbol.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {string|symbol} Returns the key.
   */
  function toKey(value) {
    if (typeof value == 'string' || isSymbol(value)) {
      return value;
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
  }
  
  module.exports = toKey;
  
  },{"./isSymbol":90}],75:[function(require,module,exports){
  /** Used for built-in method references. */
  var funcProto = Function.prototype;
  
  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;
  
  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to convert.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {}
      try {
        return (func + '');
      } catch (e) {}
    }
    return '';
  }
  
  module.exports = toSource;
  
  },{}],76:[function(require,module,exports){
  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || (value !== value && other !== other);
  }
  
  module.exports = eq;
  
  },{}],77:[function(require,module,exports){
  var baseGet = require('./_baseGet');
  
  /**
   * Gets the value at `path` of `object`. If the resolved value is
   * `undefined`, the `defaultValue` is returned in its place.
   *
   * @static
   * @memberOf _
   * @since 3.7.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @param {*} [defaultValue] The value returned for `undefined` resolved values.
   * @returns {*} Returns the resolved value.
   * @example
   *
   * var object = { 'a': [{ 'b': { 'c': 3 } }] };
   *
   * _.get(object, 'a[0].b.c');
   * // => 3
   *
   * _.get(object, ['a', '0', 'b', 'c']);
   * // => 3
   *
   * _.get(object, 'a.b.c', 'default');
   * // => 'default'
   */
  function get(object, path, defaultValue) {
    var result = object == null ? undefined : baseGet(object, path);
    return result === undefined ? defaultValue : result;
  }
  
  module.exports = get;
  
  },{"./_baseGet":29}],78:[function(require,module,exports){
  var baseIsArguments = require('./_baseIsArguments'),
      isObjectLike = require('./isObjectLike');
  
  /** Used for built-in method references. */
  var objectProto = Object.prototype;
  
  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;
  
  /** Built-in value references. */
  var propertyIsEnumerable = objectProto.propertyIsEnumerable;
  
  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
    return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
      !propertyIsEnumerable.call(value, 'callee');
  };
  
  module.exports = isArguments;
  
  },{"./_baseIsArguments":31,"./isObjectLike":87}],79:[function(require,module,exports){
  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;
  
  module.exports = isArray;
  
  },{}],80:[function(require,module,exports){
  var isFunction = require('./isFunction'),
      isLength = require('./isLength');
  
  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }
  
  module.exports = isArrayLike;
  
  },{"./isFunction":82,"./isLength":83}],81:[function(require,module,exports){
  var root = require('./_root'),
      stubFalse = require('./stubFalse');
  
  /** Detect free variable `exports`. */
  var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;
  
  /** Detect free variable `module`. */
  var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;
  
  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;
  
  /** Built-in value references. */
  var Buffer = moduleExports ? root.Buffer : undefined;
  
  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;
  
  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse;
  
  module.exports = isBuffer;
  
  },{"./_root":72,"./stubFalse":94}],82:[function(require,module,exports){
  var baseGetTag = require('./_baseGetTag'),
      isObject = require('./isObject');
  
  /** `Object#toString` result references. */
  var asyncTag = '[object AsyncFunction]',
      funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      proxyTag = '[object Proxy]';
  
  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    if (!isObject(value)) {
      return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = baseGetTag(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  }
  
  module.exports = isFunction;
  
  },{"./_baseGetTag":30,"./isObject":86}],83:[function(require,module,exports){
  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;
  
  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return typeof value == 'number' &&
      value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }
  
  module.exports = isLength;
  
  },{}],84:[function(require,module,exports){
  /**
   * Checks if `value` is `null` or `undefined`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is nullish, else `false`.
   * @example
   *
   * _.isNil(null);
   * // => true
   *
   * _.isNil(void 0);
   * // => true
   *
   * _.isNil(NaN);
   * // => false
   */
  function isNil(value) {
    return value == null;
  }
  
  module.exports = isNil;
  
  },{}],85:[function(require,module,exports){
  var baseGetTag = require('./_baseGetTag'),
      isObjectLike = require('./isObjectLike');
  
  /** `Object#toString` result references. */
  var numberTag = '[object Number]';
  
  /**
   * Checks if `value` is classified as a `Number` primitive or object.
   *
   * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are
   * classified as numbers, use the `_.isFinite` method.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a number, else `false`.
   * @example
   *
   * _.isNumber(3);
   * // => true
   *
   * _.isNumber(Number.MIN_VALUE);
   * // => true
   *
   * _.isNumber(Infinity);
   * // => true
   *
   * _.isNumber('3');
   * // => false
   */
  function isNumber(value) {
    return typeof value == 'number' ||
      (isObjectLike(value) && baseGetTag(value) == numberTag);
  }
  
  module.exports = isNumber;
  
  },{"./_baseGetTag":30,"./isObjectLike":87}],86:[function(require,module,exports){
  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == 'object' || type == 'function');
  }
  
  module.exports = isObject;
  
  },{}],87:[function(require,module,exports){
  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return value != null && typeof value == 'object';
  }
  
  module.exports = isObjectLike;
  
  },{}],88:[function(require,module,exports){
  var baseGetTag = require('./_baseGetTag'),
      getPrototype = require('./_getPrototype'),
      isObjectLike = require('./isObjectLike');
  
  /** `Object#toString` result references. */
  var objectTag = '[object Object]';
  
  /** Used for built-in method references. */
  var funcProto = Function.prototype,
      objectProto = Object.prototype;
  
  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;
  
  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;
  
  /** Used to infer the `Object` constructor. */
  var objectCtorString = funcToString.call(Object);
  
  /**
   * Checks if `value` is a plain object, that is, an object created by the
   * `Object` constructor or one with a `[[Prototype]]` of `null`.
   *
   * @static
   * @memberOf _
   * @since 0.8.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   * }
   *
   * _.isPlainObject(new Foo);
   * // => false
   *
   * _.isPlainObject([1, 2, 3]);
   * // => false
   *
   * _.isPlainObject({ 'x': 0, 'y': 0 });
   * // => true
   *
   * _.isPlainObject(Object.create(null));
   * // => true
   */
  function isPlainObject(value) {
    if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
      return false;
    }
    var proto = getPrototype(value);
    if (proto === null) {
      return true;
    }
    var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor == 'function' && Ctor instanceof Ctor &&
      funcToString.call(Ctor) == objectCtorString;
  }
  
  module.exports = isPlainObject;
  
  },{"./_baseGetTag":30,"./_getPrototype":43,"./isObjectLike":87}],89:[function(require,module,exports){
  var baseGetTag = require('./_baseGetTag'),
      isArray = require('./isArray'),
      isObjectLike = require('./isObjectLike');
  
  /** `Object#toString` result references. */
  var stringTag = '[object String]';
  
  /**
   * Checks if `value` is classified as a `String` primitive or object.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a string, else `false`.
   * @example
   *
   * _.isString('abc');
   * // => true
   *
   * _.isString(1);
   * // => false
   */
  function isString(value) {
    return typeof value == 'string' ||
      (!isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag);
  }
  
  module.exports = isString;
  
  },{"./_baseGetTag":30,"./isArray":79,"./isObjectLike":87}],90:[function(require,module,exports){
  var baseGetTag = require('./_baseGetTag'),
      isObjectLike = require('./isObjectLike');
  
  /** `Object#toString` result references. */
  var symbolTag = '[object Symbol]';
  
  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol(value) {
    return typeof value == 'symbol' ||
      (isObjectLike(value) && baseGetTag(value) == symbolTag);
  }
  
  module.exports = isSymbol;
  
  },{"./_baseGetTag":30,"./isObjectLike":87}],91:[function(require,module,exports){
  var baseIsTypedArray = require('./_baseIsTypedArray'),
      baseUnary = require('./_baseUnary'),
      nodeUtil = require('./_nodeUtil');
  
  /* Node.js helper references. */
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
  
  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
  
  module.exports = isTypedArray;
  
  },{"./_baseIsTypedArray":33,"./_baseUnary":37,"./_nodeUtil":69}],92:[function(require,module,exports){
  var arrayLikeKeys = require('./_arrayLikeKeys'),
      baseKeys = require('./_baseKeys'),
      isArrayLike = require('./isArrayLike');
  
  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
  }
  
  module.exports = keys;
  
  },{"./_arrayLikeKeys":26,"./_baseKeys":34,"./isArrayLike":80}],93:[function(require,module,exports){
  var MapCache = require('./_MapCache');
  
  /** Error message constants. */
  var FUNC_ERROR_TEXT = 'Expected a function';
  
  /**
   * Creates a function that memoizes the result of `func`. If `resolver` is
   * provided, it determines the cache key for storing the result based on the
   * arguments provided to the memoized function. By default, the first argument
   * provided to the memoized function is used as the map cache key. The `func`
   * is invoked with the `this` binding of the memoized function.
   *
   * **Note:** The cache is exposed as the `cache` property on the memoized
   * function. Its creation may be customized by replacing the `_.memoize.Cache`
   * constructor with one whose instances implement the
   * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
   * method interface of `clear`, `delete`, `get`, `has`, and `set`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to have its output memoized.
   * @param {Function} [resolver] The function to resolve the cache key.
   * @returns {Function} Returns the new memoized function.
   * @example
   *
   * var object = { 'a': 1, 'b': 2 };
   * var other = { 'c': 3, 'd': 4 };
   *
   * var values = _.memoize(_.values);
   * values(object);
   * // => [1, 2]
   *
   * values(other);
   * // => [3, 4]
   *
   * object.a = 2;
   * values(object);
   * // => [1, 2]
   *
   * // Modify the result cache.
   * values.cache.set(object, ['a', 'b']);
   * values(object);
   * // => ['a', 'b']
   *
   * // Replace `_.memoize.Cache`.
   * _.memoize.Cache = WeakMap;
   */
  function memoize(func, resolver) {
    if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    var memoized = function() {
      var args = arguments,
          key = resolver ? resolver.apply(this, args) : args[0],
          cache = memoized.cache;
  
      if (cache.has(key)) {
        return cache.get(key);
      }
      var result = func.apply(this, args);
      memoized.cache = cache.set(key, result) || cache;
      return result;
    };
    memoized.cache = new (memoize.Cache || MapCache);
    return memoized;
  }
  
  // Expose `MapCache`.
  memoize.Cache = MapCache;
  
  module.exports = memoize;
  
  },{"./_MapCache":24}],94:[function(require,module,exports){
  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false;
  }
  
  module.exports = stubFalse;
  
  },{}],95:[function(require,module,exports){
  var baseToString = require('./_baseToString');
  
  /**
   * Converts `value` to a string. An empty string is returned for `null`
   * and `undefined` values. The sign of `-0` is preserved.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   * @example
   *
   * _.toString(null);
   * // => ''
   *
   * _.toString(-0);
   * // => '-0'
   *
   * _.toString([1, 2, 3]);
   * // => '1,2,3'
   */
  function toString(value) {
    return value == null ? '' : baseToString(value);
  }
  
  module.exports = toString;
  
  },{"./_baseToString":36}],"airtable":[function(require,module,exports){
  "use strict";
  var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  var base_1 = __importDefault(require("./base"));
  var record_1 = __importDefault(require("./record"));
  var table_1 = __importDefault(require("./table"));
  var airtable_error_1 = __importDefault(require("./airtable_error"));
  var Airtable = /** @class */ (function () {
      function Airtable(opts) {
          if (opts === void 0) { opts = {}; }
          var defaultConfig = Airtable.default_config();
          var apiVersion = opts.apiVersion || Airtable.apiVersion || defaultConfig.apiVersion;
          Object.defineProperties(this, {
              _apiKey: {
                  value: opts.apiKey || Airtable.apiKey || defaultConfig.apiKey,
              },
              _apiVersion: {
                  value: apiVersion,
              },
              _apiVersionMajor: {
                  value: apiVersion.split('.')[0],
              },
              _customHeaders: {
                  value: opts.customHeaders || {},
              },
              _endpointUrl: {
                  value: opts.endpointUrl || Airtable.endpointUrl || defaultConfig.endpointUrl,
              },
              _noRetryIfRateLimited: {
                  value: opts.noRetryIfRateLimited ||
                      Airtable.noRetryIfRateLimited ||
                      defaultConfig.noRetryIfRateLimited,
              },
              _requestTimeout: {
                  value: opts.requestTimeout || Airtable.requestTimeout || defaultConfig.requestTimeout,
              },
          });
          if (!this._apiKey) {
              throw new Error('An API key is required to connect to Airtable');
          }
      }
      Airtable.prototype.base = function (baseId) {
          return base_1.default.createFunctor(this, baseId);
      };
      Airtable.default_config = function () {
          return {
              endpointUrl:  false || 'https://api.airtable.com',
              apiVersion: '0.1.0',
              apiKey: undefined,
              noRetryIfRateLimited: false,
              requestTimeout: 300 * 1000,
          };
      };
      Airtable.configure = function (_a) {
          var apiKey = _a.apiKey, endpointUrl = _a.endpointUrl, apiVersion = _a.apiVersion, noRetryIfRateLimited = _a.noRetryIfRateLimited, requestTimeout = _a.requestTimeout;
          Airtable.apiKey = apiKey;
          Airtable.endpointUrl = endpointUrl;
          Airtable.apiVersion = apiVersion;
          Airtable.noRetryIfRateLimited = noRetryIfRateLimited;
          Airtable.requestTimeout = requestTimeout;
      };
      Airtable.base = function (baseId) {
          return new Airtable().base(baseId);
      };
      Airtable.Base = base_1.default;
      Airtable.Record = record_1.default;
      Airtable.Table = table_1.default;
      Airtable.Error = airtable_error_1.default;
      return Airtable;
  }());
  module.exports = Airtable;
  
  },{"./airtable_error":2,"./base":3,"./record":15,"./table":17}]},{},["airtable"]);
  

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/code.ts ***!
  \*********************/
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).
function hexToRGB(hex) {
    const r = (parseInt(hex.slice(1, 3), 16) / 255);
    const g = (parseInt(hex.slice(3, 5), 16) / 255);
    const b = (parseInt(hex.slice(5, 7), 16) / 255);
    const result = {
        r: r,
        g: g,
        b: b
    };
    return result;
}
// Get data from Airtable
var Airtable = __webpack_require__(/*! ./airtable */ "./src/airtable.js");
var base = new Airtable({ apiKey: 'keybFJbuq3xnPLGX9' }).base('appblz15LnTqipptS');
base('Unify').select({
    view: "Grid view"
}).firstPage(function (err, records) {
    if (err) {
        console.error(err);
        return;
    }
    if (records) {
        const newStyles = [];
        console.log('records', records);
        records.forEach((record) => {
            const style = figma.createPaintStyle();
            style.name = record.get("Name");
            const colorRGB = hexToRGB(record.get("Value"));
            const paint = {
                type: 'SOLID',
                visible: true,
                opacity: 1,
                blendMode: "NORMAL",
                color: colorRGB
            };
            newStyles.push(paint);
            style.paints = newStyles;
        });
        console.log(newStyles);
    }
});
// const nodes: SceneNode[] = [];
// for (let i = 0; i < numberOfRectangles; i++) {
//   const rect = figma.createRectangle();
//   rect.x = i * 150;
//   rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
//   figma.currentPage.appendChild(rect);
//   nodes.push(rect);
// }
// figma.currentPage.selection = nodes;
// figma.viewport.scrollAndZoomIntoView(nodes);
// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
figma.closePlugin();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEMsT0FBTztBQUNqRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVc7QUFDWDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBDQUEwQyxPQUFPO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEZBQTBGO0FBQzFGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBLGFBQWE7QUFDYixlQUFlO0FBQ2Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7QUFDQSxXQUFXO0FBQ1gsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFD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QUN4SSxHQUFHLEdBQUc7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLFFBQVE7QUFDckIsYUFBYSxRQUFRO0FBQ3JCLGVBQWUsR0FBRztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUcsRUFBRSxrQkFBa0I7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLFFBQVE7QUFDckIsYUFBYSxRQUFRO0FBQ3JCLGVBQWUsR0FBRztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRyxFQUFFLHNDQUFzQztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUcsRUFBRSxnQkFBZ0I7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLEdBQUc7QUFDaEIsZUFBZSxRQUFRO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRyxFQUFFLGVBQWU7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLFFBQVE7QUFDckIsYUFBYSxRQUFRO0FBQ3JCLGVBQWUsR0FBRztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUcsR0FBRztBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRyxFQUFFLHFCQUFxQjtBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLFFBQVE7QUFDckIsYUFBYSxRQUFRO0FBQ3JCLGVBQWUsU0FBUztBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHLEdBQUc7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYSxRQUFRO0FBQ3JCLGVBQWUsR0FBRztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHLEVBQUUscUJBQXFCO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLFFBQVE7QUFDckIsZUFBZSxTQUFTO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHLEVBQUUscUJBQXFCO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLFFBQVE7QUFDckIsYUFBYSxHQUFHO0FBQ2hCLGVBQWUsUUFBUTtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUcsRUFBRSxxQkFBcUI7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLEdBQUc7QUFDaEIsYUFBYSxRQUFRO0FBQ3JCLGVBQWUsU0FBUztBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUcsR0FBRztBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFh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Q0E7QUFDQTtBQUNBO0FBQ0EsR0FBRyxHQUFHO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLEdBQUc7QUFDaEIsZUFBZSxTQUFTO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUcsRUFBRSx1Q0FBdUM7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYSxHQUFHO0FBQ2hCLGVBQWUsU0FBUztBQUN4QjtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUcsR0FBRztBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLEdBQUc7QUFDaEIsZUFBZSxTQUFTO0FBQ3hCO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUcsR0FBRztBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYSxHQUFHO0FBQ2hCLGVBQWUsU0FBUztBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QW9CO0FBQy9EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9BaXJ0YWJsZS8uL3NyYy9haXJ0YWJsZS5qcyIsIndlYnBhY2s6Ly9BaXJ0YWJsZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9BaXJ0YWJsZS93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL0FpcnRhYmxlLy4vc3JjL2NvZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsicmVxdWlyZT0oZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpKHsxOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIC8vIGlzdGFuYnVsIGlnbm9yZSBmaWxlXG4gIHZhciBBYm9ydENvbnRyb2xsZXI7XG4gIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgQWJvcnRDb250cm9sbGVyID0gcmVxdWlyZSgnYWJvcnQtY29udHJvbGxlcicpO1xuICB9XG4gIGVsc2UgaWYgKCdzaWduYWwnIGluIG5ldyBSZXF1ZXN0KCcnKSkge1xuICAgICAgQWJvcnRDb250cm9sbGVyID0gd2luZG93LkFib3J0Q29udHJvbGxlcjtcbiAgfVxuICBlbHNlIHtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXMgKi9cbiAgICAgIHZhciBwb2x5ZmlsbCA9IHJlcXVpcmUoJ2Fib3J0Y29udHJvbGxlci1wb2x5ZmlsbC9kaXN0L2Nqcy1wb255ZmlsbCcpO1xuICAgICAgLyogZXNsaW50LWVuYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdmFyLXJlcXVpcmVzICovXG4gICAgICBBYm9ydENvbnRyb2xsZXIgPSBwb2x5ZmlsbC5BYm9ydENvbnRyb2xsZXI7XG4gIH1cbiAgbW9kdWxlLmV4cG9ydHMgPSBBYm9ydENvbnRyb2xsZXI7XG4gIFxuICB9LHtcImFib3J0LWNvbnRyb2xsZXJcIjoyMCxcImFib3J0Y29udHJvbGxlci1wb2x5ZmlsbC9kaXN0L2Nqcy1wb255ZmlsbFwiOjE5fV0sMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgQWlydGFibGVFcnJvciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAgIGZ1bmN0aW9uIEFpcnRhYmxlRXJyb3IoZXJyb3IsIG1lc3NhZ2UsIHN0YXR1c0NvZGUpIHtcbiAgICAgICAgICB0aGlzLmVycm9yID0gZXJyb3I7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICB0aGlzLnN0YXR1c0NvZGUgPSBzdGF0dXNDb2RlO1xuICAgICAgfVxuICAgICAgQWlydGFibGVFcnJvci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlLFxuICAgICAgICAgICAgICAnKCcsXG4gICAgICAgICAgICAgIHRoaXMuZXJyb3IsXG4gICAgICAgICAgICAgICcpJyxcbiAgICAgICAgICAgICAgdGhpcy5zdGF0dXNDb2RlID8gXCJbSHR0cCBjb2RlIFwiICsgdGhpcy5zdGF0dXNDb2RlICsgXCJdXCIgOiAnJyxcbiAgICAgICAgICBdLmpvaW4oJycpO1xuICAgICAgfTtcbiAgICAgIHJldHVybiBBaXJ0YWJsZUVycm9yO1xuICB9KCkpO1xuICBtb2R1bGUuZXhwb3J0cyA9IEFpcnRhYmxlRXJyb3I7XG4gIFxuICB9LHt9XSwzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdDtcbiAgICAgIH07XG4gICAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcbiAgdmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbiAgfTtcbiAgdmFyIGdldF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJsb2Rhc2gvZ2V0XCIpKTtcbiAgdmFyIGlzUGxhaW5PYmplY3RfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwibG9kYXNoL2lzUGxhaW5PYmplY3RcIikpO1xuICB2YXIga2V5c18xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJsb2Rhc2gva2V5c1wiKSk7XG4gIHZhciBmZXRjaF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL2ZldGNoXCIpKTtcbiAgdmFyIGFib3J0X2NvbnRyb2xsZXJfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9hYm9ydC1jb250cm9sbGVyXCIpKTtcbiAgdmFyIG9iamVjdF90b19xdWVyeV9wYXJhbV9zdHJpbmdfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9vYmplY3RfdG9fcXVlcnlfcGFyYW1fc3RyaW5nXCIpKTtcbiAgdmFyIGFpcnRhYmxlX2Vycm9yXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vYWlydGFibGVfZXJyb3JcIikpO1xuICB2YXIgdGFibGVfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi90YWJsZVwiKSk7XG4gIHZhciBodHRwX2hlYWRlcnNfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9odHRwX2hlYWRlcnNcIikpO1xuICB2YXIgcnVuX2FjdGlvbl8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL3J1bl9hY3Rpb25cIikpO1xuICB2YXIgcGFja2FnZV92ZXJzaW9uXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vcGFja2FnZV92ZXJzaW9uXCIpKTtcbiAgdmFyIGV4cG9uZW50aWFsX2JhY2tvZmZfd2l0aF9qaXR0ZXJfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9leHBvbmVudGlhbF9iYWNrb2ZmX3dpdGhfaml0dGVyXCIpKTtcbiAgdmFyIHVzZXJBZ2VudCA9IFwiQWlydGFibGUuanMvXCIgKyBwYWNrYWdlX3ZlcnNpb25fMS5kZWZhdWx0O1xuICB2YXIgQmFzZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAgIGZ1bmN0aW9uIEJhc2UoYWlydGFibGUsIGJhc2VJZCkge1xuICAgICAgICAgIHRoaXMuX2FpcnRhYmxlID0gYWlydGFibGU7XG4gICAgICAgICAgdGhpcy5faWQgPSBiYXNlSWQ7XG4gICAgICB9XG4gICAgICBCYXNlLnByb3RvdHlwZS50YWJsZSA9IGZ1bmN0aW9uICh0YWJsZU5hbWUpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IHRhYmxlXzEuZGVmYXVsdCh0aGlzLCBudWxsLCB0YWJsZU5hbWUpO1xuICAgICAgfTtcbiAgICAgIEJhc2UucHJvdG90eXBlLm1ha2VSZXF1ZXN0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgIHZhciBfYTtcbiAgICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICAgIHZhciBtZXRob2QgPSBnZXRfMS5kZWZhdWx0KG9wdGlvbnMsICdtZXRob2QnLCAnR0VUJykudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICB2YXIgdXJsID0gdGhpcy5fYWlydGFibGUuX2VuZHBvaW50VXJsICsgXCIvdlwiICsgdGhpcy5fYWlydGFibGUuX2FwaVZlcnNpb25NYWpvciArIFwiL1wiICsgdGhpcy5faWQgKyBnZXRfMS5kZWZhdWx0KG9wdGlvbnMsICdwYXRoJywgJy8nKSArIFwiP1wiICsgb2JqZWN0X3RvX3F1ZXJ5X3BhcmFtX3N0cmluZ18xLmRlZmF1bHQoZ2V0XzEuZGVmYXVsdChvcHRpb25zLCAncXMnLCB7fSkpO1xuICAgICAgICAgIHZhciBjb250cm9sbGVyID0gbmV3IGFib3J0X2NvbnRyb2xsZXJfMS5kZWZhdWx0KCk7XG4gICAgICAgICAgdmFyIGhlYWRlcnMgPSB0aGlzLl9nZXRSZXF1ZXN0SGVhZGVycyhPYmplY3QuYXNzaWduKHt9LCB0aGlzLl9haXJ0YWJsZS5fY3VzdG9tSGVhZGVycywgKF9hID0gb3B0aW9ucy5oZWFkZXJzKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiB7fSkpO1xuICAgICAgICAgIHZhciByZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZiAoJ2JvZHknIGluIG9wdGlvbnMgJiYgX2NhblJlcXVlc3RNZXRob2RJbmNsdWRlQm9keShtZXRob2QpKSB7XG4gICAgICAgICAgICAgIHJlcXVlc3RPcHRpb25zLmJvZHkgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLmJvZHkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBjb250cm9sbGVyLmFib3J0KCk7XG4gICAgICAgICAgfSwgdGhpcy5fYWlydGFibGUuX3JlcXVlc3RUaW1lb3V0KTtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICBmZXRjaF8xLmRlZmF1bHQodXJsLCByZXF1ZXN0T3B0aW9ucylcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgPT09IDQyOSAmJiAhX3RoaXMuX2FpcnRhYmxlLl9ub1JldHJ5SWZSYXRlTGltaXRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHZhciBudW1BdHRlbXB0c18xID0gZ2V0XzEuZGVmYXVsdChvcHRpb25zLCAnX251bUF0dGVtcHRzJywgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgdmFyIGJhY2tvZmZEZWxheU1zID0gZXhwb25lbnRpYWxfYmFja29mZl93aXRoX2ppdHRlcl8xLmRlZmF1bHQobnVtQXR0ZW1wdHNfMSk7XG4gICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdPcHRpb25zID0gX19hc3NpZ24oX19hc3NpZ24oe30sIG9wdGlvbnMpLCB7IF9udW1BdHRlbXB0czogbnVtQXR0ZW1wdHNfMSArIDEgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLm1ha2VSZXF1ZXN0KG5ld09wdGlvbnMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihyZXNvbHZlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgfSwgYmFja29mZkRlbGF5TXMpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmVzcC5qc29uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVyciA9IF90aGlzLl9jaGVja1N0YXR1c0ZvckVycm9yKHJlc3Auc3RhdHVzLCBib2R5KSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2dldEVycm9yRm9yTm9uT2JqZWN0Qm9keShyZXNwLnN0YXR1cywgYm9keSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogcmVzcC5zdGF0dXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogcmVzcC5oZWFkZXJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvZHk6IGJvZHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlcnIgPSBfZ2V0RXJyb3JGb3JOb25PYmplY3RCb2R5KHJlc3Auc3RhdHVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgZXJyID0gbmV3IGFpcnRhYmxlX2Vycm9yXzEuZGVmYXVsdCgnQ09OTkVDVElPTl9FUlJPUicsIGVyci5tZXNzYWdlLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICAvKipcbiAgICAgICAqIEBkZXByZWNhdGVkIFRoaXMgbWV0aG9kIGlzIGRlcHJlY2F0ZWQuXG4gICAgICAgKi9cbiAgICAgIEJhc2UucHJvdG90eXBlLnJ1bkFjdGlvbiA9IGZ1bmN0aW9uIChtZXRob2QsIHBhdGgsIHF1ZXJ5UGFyYW1zLCBib2R5RGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICBydW5fYWN0aW9uXzEuZGVmYXVsdCh0aGlzLCBtZXRob2QsIHBhdGgsIHF1ZXJ5UGFyYW1zLCBib2R5RGF0YSwgY2FsbGJhY2ssIDApO1xuICAgICAgfTtcbiAgICAgIEJhc2UucHJvdG90eXBlLl9nZXRSZXF1ZXN0SGVhZGVycyA9IGZ1bmN0aW9uIChoZWFkZXJzKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBodHRwX2hlYWRlcnNfMS5kZWZhdWx0KCk7XG4gICAgICAgICAgcmVzdWx0LnNldCgnQXV0aG9yaXphdGlvbicsIFwiQmVhcmVyIFwiICsgdGhpcy5fYWlydGFibGUuX2FwaUtleSk7XG4gICAgICAgICAgcmVzdWx0LnNldCgnVXNlci1BZ2VudCcsIHVzZXJBZ2VudCk7XG4gICAgICAgICAgcmVzdWx0LnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0ga2V5c18xLmRlZmF1bHQoaGVhZGVycyk7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgIHZhciBoZWFkZXJLZXkgPSBfYVtfaV07XG4gICAgICAgICAgICAgIHJlc3VsdC5zZXQoaGVhZGVyS2V5LCBoZWFkZXJzW2hlYWRlcktleV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0LnRvSlNPTigpO1xuICAgICAgfTtcbiAgICAgIEJhc2UucHJvdG90eXBlLl9jaGVja1N0YXR1c0ZvckVycm9yID0gZnVuY3Rpb24gKHN0YXR1c0NvZGUsIGJvZHkpIHtcbiAgICAgICAgICB2YXIgX2EgPSAoYm9keSAhPT0gbnVsbCAmJiBib2R5ICE9PSB2b2lkIDAgPyBib2R5IDogeyBlcnJvcjoge30gfSkuZXJyb3IsIGVycm9yID0gX2EgPT09IHZvaWQgMCA/IHt9IDogX2E7XG4gICAgICAgICAgdmFyIHR5cGUgPSBlcnJvci50eXBlLCBtZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICBpZiAoc3RhdHVzQ29kZSA9PT0gNDAxKSB7XG4gICAgICAgICAgICAgIHJldHVybiBuZXcgYWlydGFibGVfZXJyb3JfMS5kZWZhdWx0KCdBVVRIRU5USUNBVElPTl9SRVFVSVJFRCcsICdZb3Ugc2hvdWxkIHByb3ZpZGUgdmFsaWQgYXBpIGtleSB0byBwZXJmb3JtIHRoaXMgb3BlcmF0aW9uJywgc3RhdHVzQ29kZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKHN0YXR1c0NvZGUgPT09IDQwMykge1xuICAgICAgICAgICAgICByZXR1cm4gbmV3IGFpcnRhYmxlX2Vycm9yXzEuZGVmYXVsdCgnTk9UX0FVVEhPUklaRUQnLCAnWW91IGFyZSBub3QgYXV0aG9yaXplZCB0byBwZXJmb3JtIHRoaXMgb3BlcmF0aW9uJywgc3RhdHVzQ29kZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKHN0YXR1c0NvZGUgPT09IDQwNCkge1xuICAgICAgICAgICAgICByZXR1cm4gbmV3IGFpcnRhYmxlX2Vycm9yXzEuZGVmYXVsdCgnTk9UX0ZPVU5EJywgbWVzc2FnZSAhPT0gbnVsbCAmJiBtZXNzYWdlICE9PSB2b2lkIDAgPyBtZXNzYWdlIDogJ0NvdWxkIG5vdCBmaW5kIHdoYXQgeW91IGFyZSBsb29raW5nIGZvcicsIHN0YXR1c0NvZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChzdGF0dXNDb2RlID09PSA0MTMpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5ldyBhaXJ0YWJsZV9lcnJvcl8xLmRlZmF1bHQoJ1JFUVVFU1RfVE9PX0xBUkdFJywgJ1JlcXVlc3QgYm9keSBpcyB0b28gbGFyZ2UnLCBzdGF0dXNDb2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoc3RhdHVzQ29kZSA9PT0gNDIyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBuZXcgYWlydGFibGVfZXJyb3JfMS5kZWZhdWx0KHR5cGUgIT09IG51bGwgJiYgdHlwZSAhPT0gdm9pZCAwID8gdHlwZSA6ICdVTlBST0NFU1NBQkxFX0VOVElUWScsIG1lc3NhZ2UgIT09IG51bGwgJiYgbWVzc2FnZSAhPT0gdm9pZCAwID8gbWVzc2FnZSA6ICdUaGUgb3BlcmF0aW9uIGNhbm5vdCBiZSBwcm9jZXNzZWQnLCBzdGF0dXNDb2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoc3RhdHVzQ29kZSA9PT0gNDI5KSB7XG4gICAgICAgICAgICAgIHJldHVybiBuZXcgYWlydGFibGVfZXJyb3JfMS5kZWZhdWx0KCdUT09fTUFOWV9SRVFVRVNUUycsICdZb3UgaGF2ZSBtYWRlIHRvbyBtYW55IHJlcXVlc3RzIGluIGEgc2hvcnQgcGVyaW9kIG9mIHRpbWUuIFBsZWFzZSByZXRyeSB5b3VyIHJlcXVlc3QgbGF0ZXInLCBzdGF0dXNDb2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoc3RhdHVzQ29kZSA9PT0gNTAwKSB7XG4gICAgICAgICAgICAgIHJldHVybiBuZXcgYWlydGFibGVfZXJyb3JfMS5kZWZhdWx0KCdTRVJWRVJfRVJST1InLCAnVHJ5IGFnYWluLiBJZiB0aGUgcHJvYmxlbSBwZXJzaXN0cywgY29udGFjdCBzdXBwb3J0LicsIHN0YXR1c0NvZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChzdGF0dXNDb2RlID09PSA1MDMpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5ldyBhaXJ0YWJsZV9lcnJvcl8xLmRlZmF1bHQoJ1NFUlZJQ0VfVU5BVkFJTEFCTEUnLCAnVGhlIHNlcnZpY2UgaXMgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUuIFBsZWFzZSByZXRyeSBzaG9ydGx5LicsIHN0YXR1c0NvZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChzdGF0dXNDb2RlID49IDQwMCkge1xuICAgICAgICAgICAgICByZXR1cm4gbmV3IGFpcnRhYmxlX2Vycm9yXzEuZGVmYXVsdCh0eXBlICE9PSBudWxsICYmIHR5cGUgIT09IHZvaWQgMCA/IHR5cGUgOiAnVU5FWFBFQ1RFRF9FUlJPUicsIG1lc3NhZ2UgIT09IG51bGwgJiYgbWVzc2FnZSAhPT0gdm9pZCAwID8gbWVzc2FnZSA6ICdBbiB1bmV4cGVjdGVkIGVycm9yIG9jY3VycmVkJywgc3RhdHVzQ29kZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICB9O1xuICAgICAgQmFzZS5wcm90b3R5cGUuZG9DYWxsID0gZnVuY3Rpb24gKHRhYmxlTmFtZSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnRhYmxlKHRhYmxlTmFtZSk7XG4gICAgICB9O1xuICAgICAgQmFzZS5wcm90b3R5cGUuZ2V0SWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2lkO1xuICAgICAgfTtcbiAgICAgIEJhc2UuY3JlYXRlRnVuY3RvciA9IGZ1bmN0aW9uIChhaXJ0YWJsZSwgYmFzZUlkKSB7XG4gICAgICAgICAgdmFyIGJhc2UgPSBuZXcgQmFzZShhaXJ0YWJsZSwgYmFzZUlkKTtcbiAgICAgICAgICB2YXIgYmFzZUZuID0gZnVuY3Rpb24gKHRhYmxlTmFtZSkge1xuICAgICAgICAgICAgICByZXR1cm4gYmFzZS5kb0NhbGwodGFibGVOYW1lKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIGJhc2VGbi5fYmFzZSA9IGJhc2U7XG4gICAgICAgICAgYmFzZUZuLnRhYmxlID0gYmFzZS50YWJsZS5iaW5kKGJhc2UpO1xuICAgICAgICAgIGJhc2VGbi5tYWtlUmVxdWVzdCA9IGJhc2UubWFrZVJlcXVlc3QuYmluZChiYXNlKTtcbiAgICAgICAgICBiYXNlRm4ucnVuQWN0aW9uID0gYmFzZS5ydW5BY3Rpb24uYmluZChiYXNlKTtcbiAgICAgICAgICBiYXNlRm4uZ2V0SWQgPSBiYXNlLmdldElkLmJpbmQoYmFzZSk7XG4gICAgICAgICAgcmV0dXJuIGJhc2VGbjtcbiAgICAgIH07XG4gICAgICByZXR1cm4gQmFzZTtcbiAgfSgpKTtcbiAgZnVuY3Rpb24gX2NhblJlcXVlc3RNZXRob2RJbmNsdWRlQm9keShtZXRob2QpIHtcbiAgICAgIHJldHVybiBtZXRob2QgIT09ICdHRVQnICYmIG1ldGhvZCAhPT0gJ0RFTEVURSc7XG4gIH1cbiAgZnVuY3Rpb24gX2dldEVycm9yRm9yTm9uT2JqZWN0Qm9keShzdGF0dXNDb2RlLCBib2R5KSB7XG4gICAgICBpZiAoaXNQbGFpbk9iamVjdF8xLmRlZmF1bHQoYm9keSkpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBuZXcgYWlydGFibGVfZXJyb3JfMS5kZWZhdWx0KCdVTkVYUEVDVEVEX0VSUk9SJywgJ1RoZSByZXNwb25zZSBmcm9tIEFpcnRhYmxlIHdhcyBpbnZhbGlkIEpTT04uIFBsZWFzZSB0cnkgYWdhaW4gc29vbi4nLCBzdGF0dXNDb2RlKTtcbiAgICAgIH1cbiAgfVxuICBtb2R1bGUuZXhwb3J0cyA9IEJhc2U7XG4gIFxuICB9LHtcIi4vYWJvcnQtY29udHJvbGxlclwiOjEsXCIuL2FpcnRhYmxlX2Vycm9yXCI6MixcIi4vZXhwb25lbnRpYWxfYmFja29mZl93aXRoX2ppdHRlclwiOjYsXCIuL2ZldGNoXCI6NyxcIi4vaHR0cF9oZWFkZXJzXCI6OSxcIi4vb2JqZWN0X3RvX3F1ZXJ5X3BhcmFtX3N0cmluZ1wiOjExLFwiLi9wYWNrYWdlX3ZlcnNpb25cIjoxMixcIi4vcnVuX2FjdGlvblwiOjE2LFwiLi90YWJsZVwiOjE3LFwibG9kYXNoL2dldFwiOjc3LFwibG9kYXNoL2lzUGxhaW5PYmplY3RcIjo4OCxcImxvZGFzaC9rZXlzXCI6OTJ9XSw0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIC8qKlxuICAgKiBHaXZlbiBhIGZ1bmN0aW9uIGZuIHRoYXQgdGFrZXMgYSBjYWxsYmFjayBhcyBpdHMgbGFzdCBhcmd1bWVudCwgcmV0dXJuc1xuICAgKiBhIG5ldyB2ZXJzaW9uIG9mIHRoZSBmdW5jdGlvbiB0aGF0IHRha2VzIHRoZSBjYWxsYmFjayBvcHRpb25hbGx5LiBJZlxuICAgKiB0aGUgZnVuY3Rpb24gaXMgbm90IGNhbGxlZCB3aXRoIGEgY2FsbGJhY2sgZm9yIHRoZSBsYXN0IGFyZ3VtZW50LCB0aGVcbiAgICogZnVuY3Rpb24gd2lsbCByZXR1cm4gYSBwcm9taXNlIGluc3RlYWQuXG4gICAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55LCBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbW9kdWxlLWJvdW5kYXJ5LXR5cGVzICovXG4gIGZ1bmN0aW9uIGNhbGxiYWNrVG9Qcm9taXNlKGZuLCBjb250ZXh0LCBjYWxsYmFja0FyZ0luZGV4KSB7XG4gICAgICBpZiAoY2FsbGJhY2tBcmdJbmRleCA9PT0gdm9pZCAwKSB7IGNhbGxiYWNrQXJnSW5kZXggPSB2b2lkIDA7IH1cbiAgICAgIC8qIGVzbGludC1lbmFibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSwgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1vZHVsZS1ib3VuZGFyeS10eXBlcyAqL1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgY2FsbEFyZ3MgPSBbXTtcbiAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICBjYWxsQXJnc1tfaV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgdGhpc0NhbGxiYWNrQXJnSW5kZXg7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrQXJnSW5kZXggPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgICAgICAgICAgICB0aGlzQ2FsbGJhY2tBcmdJbmRleCA9IGNhbGxBcmdzLmxlbmd0aCA+IDAgPyBjYWxsQXJncy5sZW5ndGggLSAxIDogMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXNDYWxsYmFja0FyZ0luZGV4ID0gY2FsbGJhY2tBcmdJbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGNhbGxiYWNrQXJnID0gY2FsbEFyZ3NbdGhpc0NhbGxiYWNrQXJnSW5kZXhdO1xuICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2tBcmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgZm4uYXBwbHkoY29udGV4dCwgY2FsbEFyZ3MpO1xuICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgdmFyIGFyZ3NfMSA9IFtdO1xuICAgICAgICAgICAgICAvLyBJZiBhbiBleHBsaWNpdCBjYWxsYmFja0FyZ0luZGV4IGlzIHNldCwgYnV0IHRoZSBmdW5jdGlvbiBpcyBjYWxsZWRcbiAgICAgICAgICAgICAgLy8gd2l0aCB0b28gZmV3IGFyZ3VtZW50cywgd2Ugd2FudCB0byBwdXNoIHVuZGVmaW5lZCBvbnRvIGFyZ3Mgc28gdGhhdFxuICAgICAgICAgICAgICAvLyBvdXIgY29uc3RydWN0ZWQgY2FsbGJhY2sgZW5kcyB1cCBhdCB0aGUgcmlnaHQgaW5kZXguXG4gICAgICAgICAgICAgIHZhciBhcmdMZW4gPSBNYXRoLm1heChjYWxsQXJncy5sZW5ndGgsIHRoaXNDYWxsYmFja0FyZ0luZGV4KTtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdMZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgYXJnc18xLnB1c2goY2FsbEFyZ3NbaV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICBhcmdzXzEucHVzaChmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgZm4uYXBwbHkoY29udGV4dCwgYXJnc18xKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgfTtcbiAgfVxuICBtb2R1bGUuZXhwb3J0cyA9IGNhbGxiYWNrVG9Qcm9taXNlO1xuICBcbiAgfSx7fV0sNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgZGlkV2FybkZvckRlcHJlY2F0aW9uID0ge307XG4gIC8qKlxuICAgKiBDb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgbWFya2luZyBhIGZ1bmN0aW9uIGFzIGRlcHJlY2F0ZWQuXG4gICAqXG4gICAqIFdpbGwgZW1pdCBhIHdhcm5pbmcgdGhlIGZpcnN0IHRpbWUgdGhhdCBmdW5jdGlvbiBpcyBjYWxsZWQuXG4gICAqXG4gICAqIEBwYXJhbSBmbiB0aGUgZnVuY3Rpb24gdG8gbWFyayBhcyBkZXByZWNhdGVkLlxuICAgKiBAcGFyYW0ga2V5IGEgdW5pcXVlIGtleSBpZGVudGlmeWluZyB0aGUgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSBtZXNzYWdlIHRoZSB3YXJuaW5nIG1lc3NhZ2UuXG4gICAqXG4gICAqIEByZXR1cm4gYSB3cmFwcGVkIGZ1bmN0aW9uXG4gICAqL1xuICBmdW5jdGlvbiBkZXByZWNhdGUoZm4sIGtleSwgbWVzc2FnZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFkaWRXYXJuRm9yRGVwcmVjYXRpb25ba2V5XSkge1xuICAgICAgICAgICAgICBkaWRXYXJuRm9yRGVwcmVjYXRpb25ba2V5XSA9IHRydWU7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICB9O1xuICB9XG4gIG1vZHVsZS5leHBvcnRzID0gZGVwcmVjYXRlO1xuICBcbiAgfSx7fV0sNjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xuICB9O1xuICB2YXIgaW50ZXJuYWxfY29uZmlnX2pzb25fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9pbnRlcm5hbF9jb25maWcuanNvblwiKSk7XG4gIC8vIFwiRnVsbCBKaXR0ZXJcIiBhbGdvcml0aG0gdGFrZW4gZnJvbSBodHRwczovL2F3cy5hbWF6b24uY29tL2Jsb2dzL2FyY2hpdGVjdHVyZS9leHBvbmVudGlhbC1iYWNrb2ZmLWFuZC1qaXR0ZXIvXG4gIGZ1bmN0aW9uIGV4cG9uZW50aWFsQmFja29mZldpdGhKaXR0ZXIobnVtYmVyT2ZSZXRyaWVzKSB7XG4gICAgICB2YXIgcmF3QmFja29mZlRpbWVNcyA9IGludGVybmFsX2NvbmZpZ19qc29uXzEuZGVmYXVsdC5JTklUSUFMX1JFVFJZX0RFTEFZX0lGX1JBVEVfTElNSVRFRCAqIE1hdGgucG93KDIsIG51bWJlck9mUmV0cmllcyk7XG4gICAgICB2YXIgY2xpcHBlZEJhY2tvZmZUaW1lTXMgPSBNYXRoLm1pbihpbnRlcm5hbF9jb25maWdfanNvbl8xLmRlZmF1bHQuTUFYX1JFVFJZX0RFTEFZX0lGX1JBVEVfTElNSVRFRCwgcmF3QmFja29mZlRpbWVNcyk7XG4gICAgICB2YXIgaml0dGVyZWRCYWNrb2ZmVGltZU1zID0gTWF0aC5yYW5kb20oKSAqIGNsaXBwZWRCYWNrb2ZmVGltZU1zO1xuICAgICAgcmV0dXJuIGppdHRlcmVkQmFja29mZlRpbWVNcztcbiAgfVxuICBtb2R1bGUuZXhwb3J0cyA9IGV4cG9uZW50aWFsQmFja29mZldpdGhKaXR0ZXI7XG4gIFxuICB9LHtcIi4vaW50ZXJuYWxfY29uZmlnLmpzb25cIjoxMH1dLDc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbiAgfTtcbiAgLy8gaXN0YW5idWwgaWdub3JlIGZpbGVcbiAgdmFyIG5vZGVfZmV0Y2hfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwibm9kZS1mZXRjaFwiKSk7XG4gIG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgPyBub2RlX2ZldGNoXzEuZGVmYXVsdCA6IHdpbmRvdy5mZXRjaC5iaW5kKHdpbmRvdyk7XG4gIFxuICB9LHtcIm5vZGUtZmV0Y2hcIjoyMH1dLDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICBcInVzZSBzdHJpY3RcIjtcbiAgLyogZXNsaW50LWVuYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55ICovXG4gIGZ1bmN0aW9uIGhhcyhvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpO1xuICB9XG4gIG1vZHVsZS5leHBvcnRzID0gaGFzO1xuICBcbiAgfSx7fV0sOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xuICB9O1xuICB2YXIga2V5c18xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJsb2Rhc2gva2V5c1wiKSk7XG4gIHZhciBpc0Jyb3dzZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbiAgdmFyIEh0dHBIZWFkZXJzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgICAgZnVuY3Rpb24gSHR0cEhlYWRlcnMoKSB7XG4gICAgICAgICAgdGhpcy5faGVhZGVyc0J5TG93ZXJjYXNlZEtleSA9IHt9O1xuICAgICAgfVxuICAgICAgSHR0cEhlYWRlcnMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChoZWFkZXJLZXksIGhlYWRlclZhbHVlKSB7XG4gICAgICAgICAgdmFyIGxvd2VyY2FzZWRLZXkgPSBoZWFkZXJLZXkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBpZiAobG93ZXJjYXNlZEtleSA9PT0gJ3gtYWlydGFibGUtdXNlci1hZ2VudCcpIHtcbiAgICAgICAgICAgICAgbG93ZXJjYXNlZEtleSA9ICd1c2VyLWFnZW50JztcbiAgICAgICAgICAgICAgaGVhZGVyS2V5ID0gJ1VzZXItQWdlbnQnO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9oZWFkZXJzQnlMb3dlcmNhc2VkS2V5W2xvd2VyY2FzZWRLZXldID0ge1xuICAgICAgICAgICAgICBoZWFkZXJLZXk6IGhlYWRlcktleSxcbiAgICAgICAgICAgICAgaGVhZGVyVmFsdWU6IGhlYWRlclZhbHVlLFxuICAgICAgICAgIH07XG4gICAgICB9O1xuICAgICAgSHR0cEhlYWRlcnMucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IGtleXNfMS5kZWZhdWx0KHRoaXMuX2hlYWRlcnNCeUxvd2VyY2FzZWRLZXkpOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICB2YXIgbG93ZXJjYXNlZEtleSA9IF9hW19pXTtcbiAgICAgICAgICAgICAgdmFyIGhlYWRlckRlZmluaXRpb24gPSB0aGlzLl9oZWFkZXJzQnlMb3dlcmNhc2VkS2V5W2xvd2VyY2FzZWRLZXldO1xuICAgICAgICAgICAgICB2YXIgaGVhZGVyS2V5ID0gdm9pZCAwO1xuICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgICBpZiAoaXNCcm93c2VyICYmIGxvd2VyY2FzZWRLZXkgPT09ICd1c2VyLWFnZW50Jykge1xuICAgICAgICAgICAgICAgICAgLy8gU29tZSBicm93c2VycyBkbyBub3QgYWxsb3cgb3ZlcnJpZGluZyB0aGUgdXNlciBhZ2VudC5cbiAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9BaXJ0YWJsZS9haXJ0YWJsZS5qcy9pc3N1ZXMvNTJcbiAgICAgICAgICAgICAgICAgIGhlYWRlcktleSA9ICdYLUFpcnRhYmxlLVVzZXItQWdlbnQnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgaGVhZGVyS2V5ID0gaGVhZGVyRGVmaW5pdGlvbi5oZWFkZXJLZXk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVzdWx0W2hlYWRlcktleV0gPSBoZWFkZXJEZWZpbml0aW9uLmhlYWRlclZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICAgIHJldHVybiBIdHRwSGVhZGVycztcbiAgfSgpKTtcbiAgbW9kdWxlLmV4cG9ydHMgPSBIdHRwSGVhZGVycztcbiAgXG4gIH0se1wibG9kYXNoL2tleXNcIjo5Mn1dLDEwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgbW9kdWxlLmV4cG9ydHM9e1xuICAgICAgXCJJTklUSUFMX1JFVFJZX0RFTEFZX0lGX1JBVEVfTElNSVRFRFwiOiA1MDAwLFxuICAgICAgXCJNQVhfUkVUUllfREVMQVlfSUZfUkFURV9MSU1JVEVEXCI6IDYwMDAwMFxuICB9XG4gIFxuICB9LHt9XSwxMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xuICB9O1xuICB2YXIgaXNBcnJheV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJsb2Rhc2gvaXNBcnJheVwiKSk7XG4gIHZhciBpc05pbF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJsb2Rhc2gvaXNOaWxcIikpO1xuICB2YXIga2V5c18xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJsb2Rhc2gva2V5c1wiKSk7XG4gIC8qIGVzbGludC1lbmFibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xuICAvLyBBZGFwdGVkIGZyb20galF1ZXJ5LnBhcmFtOlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vanF1ZXJ5L2pxdWVyeS9ibG9iLzIuMi1zdGFibGUvc3JjL3NlcmlhbGl6ZS5qc1xuICBmdW5jdGlvbiBidWlsZFBhcmFtcyhwcmVmaXgsIG9iaiwgYWRkRm4pIHtcbiAgICAgIGlmIChpc0FycmF5XzEuZGVmYXVsdChvYmopKSB7XG4gICAgICAgICAgLy8gU2VyaWFsaXplIGFycmF5IGl0ZW0uXG4gICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IG9iai5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgdmFyIHZhbHVlID0gb2JqW2luZGV4XTtcbiAgICAgICAgICAgICAgaWYgKC9cXFtcXF0kLy50ZXN0KHByZWZpeCkpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyZWF0IGVhY2ggYXJyYXkgaXRlbSBhcyBhIHNjYWxhci5cbiAgICAgICAgICAgICAgICAgIGFkZEZuKHByZWZpeCwgdmFsdWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gSXRlbSBpcyBub24tc2NhbGFyIChhcnJheSBvciBvYmplY3QpLCBlbmNvZGUgaXRzIG51bWVyaWMgaW5kZXguXG4gICAgICAgICAgICAgICAgICBidWlsZFBhcmFtcyhwcmVmaXggKyBcIltcIiArICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsID8gaW5kZXggOiAnJykgKyBcIl1cIiwgdmFsdWUsIGFkZEZuKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgLy8gU2VyaWFsaXplIG9iamVjdCBpdGVtLlxuICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBrZXlzXzEuZGVmYXVsdChvYmopOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICB2YXIga2V5ID0gX2FbX2ldO1xuICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgICAgICAgYnVpbGRQYXJhbXMocHJlZml4ICsgXCJbXCIgKyBrZXkgKyBcIl1cIiwgdmFsdWUsIGFkZEZuKTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgICAvLyBTZXJpYWxpemUgc2NhbGFyIGl0ZW0uXG4gICAgICAgICAgYWRkRm4ocHJlZml4LCBvYmopO1xuICAgICAgfVxuICB9XG4gIGZ1bmN0aW9uIG9iamVjdFRvUXVlcnlQYXJhbVN0cmluZyhvYmopIHtcbiAgICAgIHZhciBwYXJ0cyA9IFtdO1xuICAgICAgdmFyIGFkZEZuID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICB2YWx1ZSA9IGlzTmlsXzEuZGVmYXVsdCh2YWx1ZSkgPyAnJyA6IHZhbHVlO1xuICAgICAgICAgIHBhcnRzLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpO1xuICAgICAgfTtcbiAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBrZXlzXzEuZGVmYXVsdChvYmopOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgIHZhciBrZXkgPSBfYVtfaV07XG4gICAgICAgICAgdmFyIHZhbHVlID0gb2JqW2tleV07XG4gICAgICAgICAgYnVpbGRQYXJhbXMoa2V5LCB2YWx1ZSwgYWRkRm4pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oJyYnKS5yZXBsYWNlKC8lMjAvZywgJysnKTtcbiAgfVxuICBtb2R1bGUuZXhwb3J0cyA9IG9iamVjdFRvUXVlcnlQYXJhbVN0cmluZztcbiAgXG4gIH0se1wibG9kYXNoL2lzQXJyYXlcIjo3OSxcImxvZGFzaC9pc05pbFwiOjg0LFwibG9kYXNoL2tleXNcIjo5Mn1dLDEyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIG1vZHVsZS5leHBvcnRzID0gXCIwLjExLjJcIjtcbiAgXG4gIH0se31dLDEzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdDtcbiAgICAgIH07XG4gICAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcbiAgdmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbiAgfTtcbiAgdmFyIGlzRnVuY3Rpb25fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwibG9kYXNoL2lzRnVuY3Rpb25cIikpO1xuICB2YXIga2V5c18xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJsb2Rhc2gva2V5c1wiKSk7XG4gIHZhciByZWNvcmRfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9yZWNvcmRcIikpO1xuICB2YXIgY2FsbGJhY2tfdG9fcHJvbWlzZV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL2NhbGxiYWNrX3RvX3Byb21pc2VcIikpO1xuICB2YXIgaGFzXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vaGFzXCIpKTtcbiAgdmFyIHF1ZXJ5X3BhcmFtc18xID0gcmVxdWlyZShcIi4vcXVlcnlfcGFyYW1zXCIpO1xuICAvKipcbiAgICogQnVpbGRzIGEgcXVlcnkgb2JqZWN0LiBXb24ndCBmZXRjaCB1bnRpbCBgZmlyc3RQYWdlYCBvclxuICAgKiBvciBgZWFjaFBhZ2VgIGlzIGNhbGxlZC5cbiAgICpcbiAgICogUGFyYW1zIHNob3VsZCBiZSB2YWxpZGF0ZWQgcHJpb3IgdG8gYmVpbmcgcGFzc2VkIHRvIFF1ZXJ5XG4gICAqIHdpdGggYFF1ZXJ5LnZhbGlkYXRlUGFyYW1zYC5cbiAgICovXG4gIHZhciBRdWVyeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAgIGZ1bmN0aW9uIFF1ZXJ5KHRhYmxlLCBwYXJhbXMpIHtcbiAgICAgICAgICB0aGlzLl90YWJsZSA9IHRhYmxlO1xuICAgICAgICAgIHRoaXMuX3BhcmFtcyA9IHBhcmFtcztcbiAgICAgICAgICB0aGlzLmZpcnN0UGFnZSA9IGNhbGxiYWNrX3RvX3Byb21pc2VfMS5kZWZhdWx0KGZpcnN0UGFnZSwgdGhpcyk7XG4gICAgICAgICAgdGhpcy5lYWNoUGFnZSA9IGNhbGxiYWNrX3RvX3Byb21pc2VfMS5kZWZhdWx0KGVhY2hQYWdlLCB0aGlzLCAxKTtcbiAgICAgICAgICB0aGlzLmFsbCA9IGNhbGxiYWNrX3RvX3Byb21pc2VfMS5kZWZhdWx0KGFsbCwgdGhpcyk7XG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAqIFZhbGlkYXRlcyB0aGUgcGFyYW1ldGVycyBmb3IgcGFzc2luZyB0byB0aGUgUXVlcnkgY29uc3RydWN0b3IuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtcyB7b2JqZWN0fSBwYXJhbXMgcGFyYW1ldGVycyB0byB2YWxpZGF0ZVxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm4gYW4gb2JqZWN0IHdpdGggdHdvIGtleXM6XG4gICAgICAgKiAgdmFsaWRQYXJhbXM6IHRoZSBvYmplY3QgdGhhdCBzaG91bGQgYmUgcGFzc2VkIHRvIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgICAqICBpZ25vcmVkS2V5czogYSBsaXN0IG9mIGtleXMgdGhhdCB3aWxsIGJlIGlnbm9yZWQuXG4gICAgICAgKiAgZXJyb3JzOiBhIGxpc3Qgb2YgZXJyb3IgbWVzc2FnZXMuXG4gICAgICAgKi9cbiAgICAgIFF1ZXJ5LnZhbGlkYXRlUGFyYW1zID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICAgIHZhciB2YWxpZFBhcmFtcyA9IHt9O1xuICAgICAgICAgIHZhciBpZ25vcmVkS2V5cyA9IFtdO1xuICAgICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0ga2V5c18xLmRlZmF1bHQocGFyYW1zKTsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgdmFyIGtleSA9IF9hW19pXTtcbiAgICAgICAgICAgICAgdmFyIHZhbHVlID0gcGFyYW1zW2tleV07XG4gICAgICAgICAgICAgIGlmIChoYXNfMS5kZWZhdWx0KFF1ZXJ5LnBhcmFtVmFsaWRhdG9ycywga2V5KSkge1xuICAgICAgICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9IFF1ZXJ5LnBhcmFtVmFsaWRhdG9yc1trZXldO1xuICAgICAgICAgICAgICAgICAgdmFyIHZhbGlkYXRpb25SZXN1bHQgPSB2YWxpZGF0b3IodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgaWYgKHZhbGlkYXRpb25SZXN1bHQucGFzcykge1xuICAgICAgICAgICAgICAgICAgICAgIHZhbGlkUGFyYW1zW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKHZhbGlkYXRpb25SZXN1bHQuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgaWdub3JlZEtleXMucHVzaChrZXkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHZhbGlkUGFyYW1zOiB2YWxpZFBhcmFtcyxcbiAgICAgICAgICAgICAgaWdub3JlZEtleXM6IGlnbm9yZWRLZXlzLFxuICAgICAgICAgICAgICBlcnJvcnM6IGVycm9ycyxcbiAgICAgICAgICB9O1xuICAgICAgfTtcbiAgICAgIFF1ZXJ5LnBhcmFtVmFsaWRhdG9ycyA9IHF1ZXJ5X3BhcmFtc18xLnBhcmFtVmFsaWRhdG9ycztcbiAgICAgIHJldHVybiBRdWVyeTtcbiAgfSgpKTtcbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIGZpcnN0IHBhZ2Ugb2YgcmVzdWx0cyBmb3IgdGhlIHF1ZXJ5IGFzeW5jaHJvbm91c2x5LFxuICAgKiB0aGVuIGNhbGxzIGBkb25lKGVycm9yLCByZWNvcmRzKWAuXG4gICAqL1xuICBmdW5jdGlvbiBmaXJzdFBhZ2UoZG9uZSkge1xuICAgICAgaWYgKCFpc0Z1bmN0aW9uXzEuZGVmYXVsdChkb25lKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGZpcnN0IHBhcmFtZXRlciB0byBgZmlyc3RQYWdlYCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWFjaFBhZ2UoZnVuY3Rpb24gKHJlY29yZHMpIHtcbiAgICAgICAgICBkb25lKG51bGwsIHJlY29yZHMpO1xuICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgZG9uZShlcnJvciwgbnVsbCk7XG4gICAgICB9KTtcbiAgfVxuICAvKipcbiAgICogRmV0Y2hlcyBlYWNoIHBhZ2Ugb2YgcmVzdWx0cyBmb3IgdGhlIHF1ZXJ5IGFzeW5jaHJvbm91c2x5LlxuICAgKlxuICAgKiBDYWxscyBgcGFnZUNhbGxiYWNrKHJlY29yZHMsIGZldGNoTmV4dFBhZ2UpYCBmb3IgZWFjaFxuICAgKiBwYWdlLiBZb3UgbXVzdCBjYWxsIGBmZXRjaE5leHRQYWdlKClgIHRvIGZldGNoIHRoZSBuZXh0IHBhZ2Ugb2ZcbiAgICogcmVzdWx0cy5cbiAgICpcbiAgICogQWZ0ZXIgZmV0Y2hpbmcgYWxsIHBhZ2VzLCBvciBpZiB0aGVyZSdzIGFuIGVycm9yLCBjYWxsc1xuICAgKiBgZG9uZShlcnJvcilgLlxuICAgKi9cbiAgZnVuY3Rpb24gZWFjaFBhZ2UocGFnZUNhbGxiYWNrLCBkb25lKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgaWYgKCFpc0Z1bmN0aW9uXzEuZGVmYXVsdChwYWdlQ2FsbGJhY2spKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgZmlyc3QgcGFyYW1ldGVyIHRvIGBlYWNoUGFnZWAgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgICB9XG4gICAgICBpZiAoIWlzRnVuY3Rpb25fMS5kZWZhdWx0KGRvbmUpICYmIGRvbmUgIT09IHZvaWQgMCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHNlY29uZCBwYXJhbWV0ZXIgdG8gYGVhY2hQYWdlYCBtdXN0IGJlIGEgZnVuY3Rpb24gb3IgdW5kZWZpbmVkJyk7XG4gICAgICB9XG4gICAgICB2YXIgcGF0aCA9IFwiL1wiICsgdGhpcy5fdGFibGUuX3VybEVuY29kZWROYW1lT3JJZCgpO1xuICAgICAgdmFyIHBhcmFtcyA9IF9fYXNzaWduKHt9LCB0aGlzLl9wYXJhbXMpO1xuICAgICAgdmFyIGlubmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIF90aGlzLl90YWJsZS5fYmFzZS5ydW5BY3Rpb24oJ2dldCcsIHBhdGgsIHBhcmFtcywgbnVsbCwgZnVuY3Rpb24gKGVyciwgcmVzcG9uc2UsIHJlc3VsdCkge1xuICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICBkb25lKGVyciwgbnVsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICB2YXIgbmV4dCA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQub2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgcGFyYW1zLm9mZnNldCA9IHJlc3VsdC5vZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgbmV4dCA9IGlubmVyO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgbmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdmFyIHJlY29yZHMgPSByZXN1bHQucmVjb3Jkcy5tYXAoZnVuY3Rpb24gKHJlY29yZEpzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHJlY29yZF8xLmRlZmF1bHQoX3RoaXMuX3RhYmxlLCBudWxsLCByZWNvcmRKc29uKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgcGFnZUNhbGxiYWNrKHJlY29yZHMsIG5leHQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgaW5uZXIoKTtcbiAgfVxuICAvKipcbiAgICogRmV0Y2hlcyBhbGwgcGFnZXMgb2YgcmVzdWx0cyBhc3luY2hyb25vdXNseS4gTWF5IHRha2UgYSBsb25nIHRpbWUuXG4gICAqL1xuICBmdW5jdGlvbiBhbGwoZG9uZSkge1xuICAgICAgaWYgKCFpc0Z1bmN0aW9uXzEuZGVmYXVsdChkb25lKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGZpcnN0IHBhcmFtZXRlciB0byBgYWxsYCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgIH1cbiAgICAgIHZhciBhbGxSZWNvcmRzID0gW107XG4gICAgICB0aGlzLmVhY2hQYWdlKGZ1bmN0aW9uIChwYWdlUmVjb3JkcywgZmV0Y2hOZXh0UGFnZSkge1xuICAgICAgICAgIGFsbFJlY29yZHMucHVzaC5hcHBseShhbGxSZWNvcmRzLCBwYWdlUmVjb3Jkcyk7XG4gICAgICAgICAgZmV0Y2hOZXh0UGFnZSgpO1xuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgZG9uZShlcnIsIG51bGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZG9uZShudWxsLCBhbGxSZWNvcmRzKTtcbiAgICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuICBtb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5O1xuICBcbiAgfSx7XCIuL2NhbGxiYWNrX3RvX3Byb21pc2VcIjo0LFwiLi9oYXNcIjo4LFwiLi9xdWVyeV9wYXJhbXNcIjoxNCxcIi4vcmVjb3JkXCI6MTUsXCJsb2Rhc2gvaXNGdW5jdGlvblwiOjgyLFwibG9kYXNoL2tleXNcIjo5Mn1dLDE0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG4gIH07XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbiAgZXhwb3J0cy5wYXJhbVZhbGlkYXRvcnMgPSB2b2lkIDA7XG4gIHZhciB0eXBlY2hlY2tfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi90eXBlY2hlY2tcIikpO1xuICB2YXIgaXNTdHJpbmdfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwibG9kYXNoL2lzU3RyaW5nXCIpKTtcbiAgdmFyIGlzTnVtYmVyXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcImxvZGFzaC9pc051bWJlclwiKSk7XG4gIHZhciBpc1BsYWluT2JqZWN0XzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcImxvZGFzaC9pc1BsYWluT2JqZWN0XCIpKTtcbiAgZXhwb3J0cy5wYXJhbVZhbGlkYXRvcnMgPSB7XG4gICAgICBmaWVsZHM6IHR5cGVjaGVja18xLmRlZmF1bHQodHlwZWNoZWNrXzEuZGVmYXVsdC5pc0FycmF5T2YoaXNTdHJpbmdfMS5kZWZhdWx0KSwgJ3RoZSB2YWx1ZSBmb3IgYGZpZWxkc2Agc2hvdWxkIGJlIGFuIGFycmF5IG9mIHN0cmluZ3MnKSxcbiAgICAgIGZpbHRlckJ5Rm9ybXVsYTogdHlwZWNoZWNrXzEuZGVmYXVsdChpc1N0cmluZ18xLmRlZmF1bHQsICd0aGUgdmFsdWUgZm9yIGBmaWx0ZXJCeUZvcm11bGFgIHNob3VsZCBiZSBhIHN0cmluZycpLFxuICAgICAgbWF4UmVjb3JkczogdHlwZWNoZWNrXzEuZGVmYXVsdChpc051bWJlcl8xLmRlZmF1bHQsICd0aGUgdmFsdWUgZm9yIGBtYXhSZWNvcmRzYCBzaG91bGQgYmUgYSBudW1iZXInKSxcbiAgICAgIHBhZ2VTaXplOiB0eXBlY2hlY2tfMS5kZWZhdWx0KGlzTnVtYmVyXzEuZGVmYXVsdCwgJ3RoZSB2YWx1ZSBmb3IgYHBhZ2VTaXplYCBzaG91bGQgYmUgYSBudW1iZXInKSxcbiAgICAgIG9mZnNldDogdHlwZWNoZWNrXzEuZGVmYXVsdChpc051bWJlcl8xLmRlZmF1bHQsICd0aGUgdmFsdWUgZm9yIGBvZmZzZXRgIHNob3VsZCBiZSBhIG51bWJlcicpLFxuICAgICAgc29ydDogdHlwZWNoZWNrXzEuZGVmYXVsdCh0eXBlY2hlY2tfMS5kZWZhdWx0LmlzQXJyYXlPZihmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgcmV0dXJuIChpc1BsYWluT2JqZWN0XzEuZGVmYXVsdChvYmopICYmXG4gICAgICAgICAgICAgIGlzU3RyaW5nXzEuZGVmYXVsdChvYmouZmllbGQpICYmXG4gICAgICAgICAgICAgIChvYmouZGlyZWN0aW9uID09PSB2b2lkIDAgfHwgWydhc2MnLCAnZGVzYyddLmluY2x1ZGVzKG9iai5kaXJlY3Rpb24pKSk7XG4gICAgICB9KSwgJ3RoZSB2YWx1ZSBmb3IgYHNvcnRgIHNob3VsZCBiZSBhbiBhcnJheSBvZiBzb3J0IG9iamVjdHMuICcgK1xuICAgICAgICAgICdFYWNoIHNvcnQgb2JqZWN0IG11c3QgaGF2ZSBhIHN0cmluZyBgZmllbGRgIHZhbHVlLCBhbmQgYW4gb3B0aW9uYWwgJyArXG4gICAgICAgICAgJ2BkaXJlY3Rpb25gIHZhbHVlIHRoYXQgaXMgXCJhc2NcIiBvciBcImRlc2NcIi4nKSxcbiAgICAgIHZpZXc6IHR5cGVjaGVja18xLmRlZmF1bHQoaXNTdHJpbmdfMS5kZWZhdWx0LCAndGhlIHZhbHVlIGZvciBgdmlld2Agc2hvdWxkIGJlIGEgc3RyaW5nJyksXG4gICAgICBjZWxsRm9ybWF0OiB0eXBlY2hlY2tfMS5kZWZhdWx0KGZ1bmN0aW9uIChjZWxsRm9ybWF0KSB7XG4gICAgICAgICAgcmV0dXJuIGlzU3RyaW5nXzEuZGVmYXVsdChjZWxsRm9ybWF0KSAmJiBbJ2pzb24nLCAnc3RyaW5nJ10uaW5jbHVkZXMoY2VsbEZvcm1hdCk7XG4gICAgICB9LCAndGhlIHZhbHVlIGZvciBgY2VsbEZvcm1hdGAgc2hvdWxkIGJlIFwianNvblwiIG9yIFwic3RyaW5nXCInKSxcbiAgICAgIHRpbWVab25lOiB0eXBlY2hlY2tfMS5kZWZhdWx0KGlzU3RyaW5nXzEuZGVmYXVsdCwgJ3RoZSB2YWx1ZSBmb3IgYHRpbWVab25lYCBzaG91bGQgYmUgYSBzdHJpbmcnKSxcbiAgICAgIHVzZXJMb2NhbGU6IHR5cGVjaGVja18xLmRlZmF1bHQoaXNTdHJpbmdfMS5kZWZhdWx0LCAndGhlIHZhbHVlIGZvciBgdXNlckxvY2FsZWAgc2hvdWxkIGJlIGEgc3RyaW5nJyksXG4gIH07XG4gIFxuICB9LHtcIi4vdHlwZWNoZWNrXCI6MTgsXCJsb2Rhc2gvaXNOdW1iZXJcIjo4NSxcImxvZGFzaC9pc1BsYWluT2JqZWN0XCI6ODgsXCJsb2Rhc2gvaXNTdHJpbmdcIjo4OX1dLDE1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdDtcbiAgICAgIH07XG4gICAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcbiAgdmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbiAgfTtcbiAgdmFyIGNhbGxiYWNrX3RvX3Byb21pc2VfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9jYWxsYmFja190b19wcm9taXNlXCIpKTtcbiAgdmFyIFJlY29yZCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAgIGZ1bmN0aW9uIFJlY29yZCh0YWJsZSwgcmVjb3JkSWQsIHJlY29yZEpzb24pIHtcbiAgICAgICAgICB0aGlzLl90YWJsZSA9IHRhYmxlO1xuICAgICAgICAgIHRoaXMuaWQgPSByZWNvcmRJZCB8fCByZWNvcmRKc29uLmlkO1xuICAgICAgICAgIHRoaXMuc2V0UmF3SnNvbihyZWNvcmRKc29uKTtcbiAgICAgICAgICB0aGlzLnNhdmUgPSBjYWxsYmFja190b19wcm9taXNlXzEuZGVmYXVsdChzYXZlLCB0aGlzKTtcbiAgICAgICAgICB0aGlzLnBhdGNoVXBkYXRlID0gY2FsbGJhY2tfdG9fcHJvbWlzZV8xLmRlZmF1bHQocGF0Y2hVcGRhdGUsIHRoaXMpO1xuICAgICAgICAgIHRoaXMucHV0VXBkYXRlID0gY2FsbGJhY2tfdG9fcHJvbWlzZV8xLmRlZmF1bHQocHV0VXBkYXRlLCB0aGlzKTtcbiAgICAgICAgICB0aGlzLmRlc3Ryb3kgPSBjYWxsYmFja190b19wcm9taXNlXzEuZGVmYXVsdChkZXN0cm95LCB0aGlzKTtcbiAgICAgICAgICB0aGlzLmZldGNoID0gY2FsbGJhY2tfdG9fcHJvbWlzZV8xLmRlZmF1bHQoZmV0Y2gsIHRoaXMpO1xuICAgICAgICAgIHRoaXMudXBkYXRlRmllbGRzID0gdGhpcy5wYXRjaFVwZGF0ZTtcbiAgICAgICAgICB0aGlzLnJlcGxhY2VGaWVsZHMgPSB0aGlzLnB1dFVwZGF0ZTtcbiAgICAgIH1cbiAgICAgIFJlY29yZC5wcm90b3R5cGUuZ2V0SWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgICB9O1xuICAgICAgUmVjb3JkLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoY29sdW1uTmFtZSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmZpZWxkc1tjb2x1bW5OYW1lXTtcbiAgICAgIH07XG4gICAgICBSZWNvcmQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChjb2x1bW5OYW1lLCBjb2x1bW5WYWx1ZSkge1xuICAgICAgICAgIHRoaXMuZmllbGRzW2NvbHVtbk5hbWVdID0gY29sdW1uVmFsdWU7XG4gICAgICB9O1xuICAgICAgUmVjb3JkLnByb3RvdHlwZS5zZXRSYXdKc29uID0gZnVuY3Rpb24gKHJhd0pzb24pIHtcbiAgICAgICAgICB0aGlzLl9yYXdKc29uID0gcmF3SnNvbjtcbiAgICAgICAgICB0aGlzLmZpZWxkcyA9ICh0aGlzLl9yYXdKc29uICYmIHRoaXMuX3Jhd0pzb24uZmllbGRzKSB8fCB7fTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gUmVjb3JkO1xuICB9KCkpO1xuICBmdW5jdGlvbiBzYXZlKGRvbmUpIHtcbiAgICAgIHRoaXMucHV0VXBkYXRlKHRoaXMuZmllbGRzLCBkb25lKTtcbiAgfVxuICBmdW5jdGlvbiBwYXRjaFVwZGF0ZShjZWxsVmFsdWVzQnlOYW1lLCBvcHRzLCBkb25lKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgaWYgKCFkb25lKSB7XG4gICAgICAgICAgZG9uZSA9IG9wdHM7XG4gICAgICAgICAgb3B0cyA9IHt9O1xuICAgICAgfVxuICAgICAgdmFyIHVwZGF0ZUJvZHkgPSBfX2Fzc2lnbih7IGZpZWxkczogY2VsbFZhbHVlc0J5TmFtZSB9LCBvcHRzKTtcbiAgICAgIHRoaXMuX3RhYmxlLl9iYXNlLnJ1bkFjdGlvbigncGF0Y2gnLCBcIi9cIiArIHRoaXMuX3RhYmxlLl91cmxFbmNvZGVkTmFtZU9ySWQoKSArIFwiL1wiICsgdGhpcy5pZCwge30sIHVwZGF0ZUJvZHksIGZ1bmN0aW9uIChlcnIsIHJlc3BvbnNlLCByZXN1bHRzKSB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgX3RoaXMuc2V0UmF3SnNvbihyZXN1bHRzKTtcbiAgICAgICAgICBkb25lKG51bGwsIF90aGlzKTtcbiAgICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIHB1dFVwZGF0ZShjZWxsVmFsdWVzQnlOYW1lLCBvcHRzLCBkb25lKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgaWYgKCFkb25lKSB7XG4gICAgICAgICAgZG9uZSA9IG9wdHM7XG4gICAgICAgICAgb3B0cyA9IHt9O1xuICAgICAgfVxuICAgICAgdmFyIHVwZGF0ZUJvZHkgPSBfX2Fzc2lnbih7IGZpZWxkczogY2VsbFZhbHVlc0J5TmFtZSB9LCBvcHRzKTtcbiAgICAgIHRoaXMuX3RhYmxlLl9iYXNlLnJ1bkFjdGlvbigncHV0JywgXCIvXCIgKyB0aGlzLl90YWJsZS5fdXJsRW5jb2RlZE5hbWVPcklkKCkgKyBcIi9cIiArIHRoaXMuaWQsIHt9LCB1cGRhdGVCb2R5LCBmdW5jdGlvbiAoZXJyLCByZXNwb25zZSwgcmVzdWx0cykge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIF90aGlzLnNldFJhd0pzb24ocmVzdWx0cyk7XG4gICAgICAgICAgZG9uZShudWxsLCBfdGhpcyk7XG4gICAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBkZXN0cm95KGRvbmUpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICB0aGlzLl90YWJsZS5fYmFzZS5ydW5BY3Rpb24oJ2RlbGV0ZScsIFwiL1wiICsgdGhpcy5fdGFibGUuX3VybEVuY29kZWROYW1lT3JJZCgpICsgXCIvXCIgKyB0aGlzLmlkLCB7fSwgbnVsbCwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGRvbmUobnVsbCwgX3RoaXMpO1xuICAgICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gZmV0Y2goZG9uZSkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIHRoaXMuX3RhYmxlLl9iYXNlLnJ1bkFjdGlvbignZ2V0JywgXCIvXCIgKyB0aGlzLl90YWJsZS5fdXJsRW5jb2RlZE5hbWVPcklkKCkgKyBcIi9cIiArIHRoaXMuaWQsIHt9LCBudWxsLCBmdW5jdGlvbiAoZXJyLCByZXNwb25zZSwgcmVzdWx0cykge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIF90aGlzLnNldFJhd0pzb24ocmVzdWx0cyk7XG4gICAgICAgICAgZG9uZShudWxsLCBfdGhpcyk7XG4gICAgICB9KTtcbiAgfVxuICBtb2R1bGUuZXhwb3J0cyA9IFJlY29yZDtcbiAgXG4gIH0se1wiLi9jYWxsYmFja190b19wcm9taXNlXCI6NH1dLDE2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG4gIH07XG4gIHZhciBleHBvbmVudGlhbF9iYWNrb2ZmX3dpdGhfaml0dGVyXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vZXhwb25lbnRpYWxfYmFja29mZl93aXRoX2ppdHRlclwiKSk7XG4gIHZhciBvYmplY3RfdG9fcXVlcnlfcGFyYW1fc3RyaW5nXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vb2JqZWN0X3RvX3F1ZXJ5X3BhcmFtX3N0cmluZ1wiKSk7XG4gIHZhciBwYWNrYWdlX3ZlcnNpb25fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9wYWNrYWdlX3ZlcnNpb25cIikpO1xuICB2YXIgZmV0Y2hfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9mZXRjaFwiKSk7XG4gIHZhciBhYm9ydF9jb250cm9sbGVyXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vYWJvcnQtY29udHJvbGxlclwiKSk7XG4gIHZhciB1c2VyQWdlbnQgPSBcIkFpcnRhYmxlLmpzL1wiICsgcGFja2FnZV92ZXJzaW9uXzEuZGVmYXVsdDtcbiAgZnVuY3Rpb24gcnVuQWN0aW9uKGJhc2UsIG1ldGhvZCwgcGF0aCwgcXVlcnlQYXJhbXMsIGJvZHlEYXRhLCBjYWxsYmFjaywgbnVtQXR0ZW1wdHMpIHtcbiAgICAgIHZhciB1cmwgPSBiYXNlLl9haXJ0YWJsZS5fZW5kcG9pbnRVcmwgKyBcIi92XCIgKyBiYXNlLl9haXJ0YWJsZS5fYXBpVmVyc2lvbk1ham9yICsgXCIvXCIgKyBiYXNlLl9pZCArIHBhdGggKyBcIj9cIiArIG9iamVjdF90b19xdWVyeV9wYXJhbV9zdHJpbmdfMS5kZWZhdWx0KHF1ZXJ5UGFyYW1zKTtcbiAgICAgIHZhciBoZWFkZXJzID0ge1xuICAgICAgICAgIGF1dGhvcml6YXRpb246IFwiQmVhcmVyIFwiICsgYmFzZS5fYWlydGFibGUuX2FwaUtleSxcbiAgICAgICAgICAneC1hcGktdmVyc2lvbic6IGJhc2UuX2FpcnRhYmxlLl9hcGlWZXJzaW9uLFxuICAgICAgICAgICd4LWFpcnRhYmxlLWFwcGxpY2F0aW9uLWlkJzogYmFzZS5nZXRJZCgpLFxuICAgICAgICAgICdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICB9O1xuICAgICAgdmFyIGlzQnJvd3NlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xuICAgICAgLy8gU29tZSBicm93c2VycyBkbyBub3QgYWxsb3cgb3ZlcnJpZGluZyB0aGUgdXNlciBhZ2VudC5cbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9BaXJ0YWJsZS9haXJ0YWJsZS5qcy9pc3N1ZXMvNTJcbiAgICAgIGlmIChpc0Jyb3dzZXIpIHtcbiAgICAgICAgICBoZWFkZXJzWyd4LWFpcnRhYmxlLXVzZXItYWdlbnQnXSA9IHVzZXJBZ2VudDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAgIGhlYWRlcnNbJ1VzZXItQWdlbnQnXSA9IHVzZXJBZ2VudDtcbiAgICAgIH1cbiAgICAgIHZhciBjb250cm9sbGVyID0gbmV3IGFib3J0X2NvbnRyb2xsZXJfMS5kZWZhdWx0KCk7XG4gICAgICB2YXIgbm9ybWFsaXplZE1ldGhvZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpO1xuICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgbWV0aG9kOiBub3JtYWxpemVkTWV0aG9kLFxuICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICAgIH07XG4gICAgICBpZiAoYm9keURhdGEgIT09IG51bGwpIHtcbiAgICAgICAgICBpZiAobm9ybWFsaXplZE1ldGhvZCA9PT0gJ0dFVCcgfHwgbm9ybWFsaXplZE1ldGhvZCA9PT0gJ0hFQUQnKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybignYm9keSBhcmd1bWVudCB0byBydW5BY3Rpb24gYXJlIGlnbm9yZWQgd2l0aCBHRVQgb3IgSEVBRCByZXF1ZXN0cycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgb3B0aW9ucy5ib2R5ID0gSlNPTi5zdHJpbmdpZnkoYm9keURhdGEpO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29udHJvbGxlci5hYm9ydCgpO1xuICAgICAgfSwgYmFzZS5fYWlydGFibGUuX3JlcXVlc3RUaW1lb3V0KTtcbiAgICAgIGZldGNoXzEuZGVmYXVsdCh1cmwsIG9wdGlvbnMpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgaWYgKHJlc3Auc3RhdHVzID09PSA0MjkgJiYgIWJhc2UuX2FpcnRhYmxlLl9ub1JldHJ5SWZSYXRlTGltaXRlZCkge1xuICAgICAgICAgICAgICB2YXIgYmFja29mZkRlbGF5TXMgPSBleHBvbmVudGlhbF9iYWNrb2ZmX3dpdGhfaml0dGVyXzEuZGVmYXVsdChudW1BdHRlbXB0cyk7XG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgcnVuQWN0aW9uKGJhc2UsIG1ldGhvZCwgcGF0aCwgcXVlcnlQYXJhbXMsIGJvZHlEYXRhLCBjYWxsYmFjaywgbnVtQXR0ZW1wdHMgKyAxKTtcbiAgICAgICAgICAgICAgfSwgYmFja29mZkRlbGF5TXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzcC5qc29uKClcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChib2R5KSB7XG4gICAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSBiYXNlLl9jaGVja1N0YXR1c0ZvckVycm9yKHJlc3Auc3RhdHVzLCBib2R5KTtcbiAgICAgICAgICAgICAgICAgIC8vIEVuc3VyZSBSZXNwb25zZSBpbnRlcmZhY2UgbWF0Y2hlcyBpbnRlcmZhY2UgZnJvbVxuICAgICAgICAgICAgICAgICAgLy8gYHJlcXVlc3RgIFJlc3BvbnNlIG9iamVjdFxuICAgICAgICAgICAgICAgICAgdmFyIHIgPSB7fTtcbiAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHJlc3ApLmZvckVhY2goZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgcltwcm9wZXJ0eV0gPSByZXNwW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgci5ib2R5ID0gYm9keTtcbiAgICAgICAgICAgICAgICAgIHIuc3RhdHVzQ29kZSA9IHJlc3Auc3RhdHVzO1xuICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIHIsIGJvZHkpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGJhc2UuX2NoZWNrU3RhdHVzRm9yRXJyb3IocmVzcC5zdGF0dXMpKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgIH0pO1xuICB9XG4gIG1vZHVsZS5leHBvcnRzID0gcnVuQWN0aW9uO1xuICBcbiAgfSx7XCIuL2Fib3J0LWNvbnRyb2xsZXJcIjoxLFwiLi9leHBvbmVudGlhbF9iYWNrb2ZmX3dpdGhfaml0dGVyXCI6NixcIi4vZmV0Y2hcIjo3LFwiLi9vYmplY3RfdG9fcXVlcnlfcGFyYW1fc3RyaW5nXCI6MTEsXCIuL3BhY2thZ2VfdmVyc2lvblwiOjEyfV0sMTc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0O1xuICAgICAgfTtcbiAgICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuICB2YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xuICB9O1xuICB2YXIgaXNQbGFpbk9iamVjdF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJsb2Rhc2gvaXNQbGFpbk9iamVjdFwiKSk7XG4gIHZhciBkZXByZWNhdGVfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9kZXByZWNhdGVcIikpO1xuICB2YXIgcXVlcnlfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9xdWVyeVwiKSk7XG4gIHZhciByZWNvcmRfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9yZWNvcmRcIikpO1xuICB2YXIgY2FsbGJhY2tfdG9fcHJvbWlzZV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL2NhbGxiYWNrX3RvX3Byb21pc2VcIikpO1xuICB2YXIgVGFibGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgICBmdW5jdGlvbiBUYWJsZShiYXNlLCB0YWJsZUlkLCB0YWJsZU5hbWUpIHtcbiAgICAgICAgICBpZiAoIXRhYmxlSWQgJiYgIXRhYmxlTmFtZSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RhYmxlIG5hbWUgb3IgdGFibGUgSUQgaXMgcmVxdWlyZWQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fYmFzZSA9IGJhc2U7XG4gICAgICAgICAgdGhpcy5pZCA9IHRhYmxlSWQ7XG4gICAgICAgICAgdGhpcy5uYW1lID0gdGFibGVOYW1lO1xuICAgICAgICAgIC8vIFB1YmxpYyBBUElcbiAgICAgICAgICB0aGlzLmZpbmQgPSBjYWxsYmFja190b19wcm9taXNlXzEuZGVmYXVsdCh0aGlzLl9maW5kUmVjb3JkQnlJZCwgdGhpcyk7XG4gICAgICAgICAgdGhpcy5zZWxlY3QgPSB0aGlzLl9zZWxlY3RSZWNvcmRzLmJpbmQodGhpcyk7XG4gICAgICAgICAgdGhpcy5jcmVhdGUgPSBjYWxsYmFja190b19wcm9taXNlXzEuZGVmYXVsdCh0aGlzLl9jcmVhdGVSZWNvcmRzLCB0aGlzKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZSA9IGNhbGxiYWNrX3RvX3Byb21pc2VfMS5kZWZhdWx0KHRoaXMuX3VwZGF0ZVJlY29yZHMuYmluZCh0aGlzLCBmYWxzZSksIHRoaXMpO1xuICAgICAgICAgIHRoaXMucmVwbGFjZSA9IGNhbGxiYWNrX3RvX3Byb21pc2VfMS5kZWZhdWx0KHRoaXMuX3VwZGF0ZVJlY29yZHMuYmluZCh0aGlzLCB0cnVlKSwgdGhpcyk7XG4gICAgICAgICAgdGhpcy5kZXN0cm95ID0gY2FsbGJhY2tfdG9fcHJvbWlzZV8xLmRlZmF1bHQodGhpcy5fZGVzdHJveVJlY29yZCwgdGhpcyk7XG4gICAgICAgICAgLy8gRGVwcmVjYXRlZCBBUElcbiAgICAgICAgICB0aGlzLmxpc3QgPSBkZXByZWNhdGVfMS5kZWZhdWx0KHRoaXMuX2xpc3RSZWNvcmRzLmJpbmQodGhpcyksICd0YWJsZS5saXN0JywgJ0FpcnRhYmxlOiBgbGlzdCgpYCBpcyBkZXByZWNhdGVkLiBVc2UgYHNlbGVjdCgpYCBpbnN0ZWFkLicpO1xuICAgICAgICAgIHRoaXMuZm9yRWFjaCA9IGRlcHJlY2F0ZV8xLmRlZmF1bHQodGhpcy5fZm9yRWFjaFJlY29yZC5iaW5kKHRoaXMpLCAndGFibGUuZm9yRWFjaCcsICdBaXJ0YWJsZTogYGZvckVhY2goKWAgaXMgZGVwcmVjYXRlZC4gVXNlIGBzZWxlY3QoKWAgaW5zdGVhZC4nKTtcbiAgICAgIH1cbiAgICAgIFRhYmxlLnByb3RvdHlwZS5fZmluZFJlY29yZEJ5SWQgPSBmdW5jdGlvbiAocmVjb3JkSWQsIGRvbmUpIHtcbiAgICAgICAgICB2YXIgcmVjb3JkID0gbmV3IHJlY29yZF8xLmRlZmF1bHQodGhpcywgcmVjb3JkSWQpO1xuICAgICAgICAgIHJlY29yZC5mZXRjaChkb25lKTtcbiAgICAgIH07XG4gICAgICBUYWJsZS5wcm90b3R5cGUuX3NlbGVjdFJlY29yZHMgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgICAgaWYgKHBhcmFtcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgIHBhcmFtcyA9IHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQWlydGFibGU6IGBzZWxlY3RgIHRha2VzIG9ubHkgb25lIHBhcmFtZXRlciwgYnV0IGl0IHdhcyBnaXZlbiBcIiArIGFyZ3VtZW50cy5sZW5ndGggKyBcIiBwYXJhbWV0ZXJzLiBVc2UgYGVhY2hQYWdlYCBvciBgZmlyc3RQYWdlYCB0byBmZXRjaCByZWNvcmRzLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzUGxhaW5PYmplY3RfMS5kZWZhdWx0KHBhcmFtcykpIHtcbiAgICAgICAgICAgICAgdmFyIHZhbGlkYXRpb25SZXN1bHRzID0gcXVlcnlfMS5kZWZhdWx0LnZhbGlkYXRlUGFyYW1zKHBhcmFtcyk7XG4gICAgICAgICAgICAgIGlmICh2YWxpZGF0aW9uUmVzdWx0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgZm9ybWF0dGVkRXJyb3JzID0gdmFsaWRhdGlvblJlc3VsdHMuZXJyb3JzLm1hcChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCIgICogXCIgKyBlcnJvcjtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQWlydGFibGU6IGludmFsaWQgcGFyYW1ldGVycyBmb3IgYHNlbGVjdGA6XFxuXCIgKyBmb3JtYXR0ZWRFcnJvcnMuam9pbignXFxuJykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICh2YWxpZGF0aW9uUmVzdWx0cy5pZ25vcmVkS2V5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkFpcnRhYmxlOiB0aGUgZm9sbG93aW5nIHBhcmFtZXRlcnMgdG8gYHNlbGVjdGAgd2lsbCBiZSBpZ25vcmVkOiBcIiArIHZhbGlkYXRpb25SZXN1bHRzLmlnbm9yZWRLZXlzLmpvaW4oJywgJykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBuZXcgcXVlcnlfMS5kZWZhdWx0KHRoaXMsIHZhbGlkYXRpb25SZXN1bHRzLnZhbGlkUGFyYW1zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQWlydGFibGU6IHRoZSBwYXJhbWV0ZXIgZm9yIGBzZWxlY3RgIHNob3VsZCBiZSBhIHBsYWluIG9iamVjdCBvciB1bmRlZmluZWQuJyk7XG4gICAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIFRhYmxlLnByb3RvdHlwZS5fdXJsRW5jb2RlZE5hbWVPcklkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmlkIHx8IGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLm5hbWUpO1xuICAgICAgfTtcbiAgICAgIFRhYmxlLnByb3RvdHlwZS5fY3JlYXRlUmVjb3JkcyA9IGZ1bmN0aW9uIChyZWNvcmRzRGF0YSwgb3B0aW9uYWxQYXJhbWV0ZXJzLCBkb25lKSB7XG4gICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICB2YXIgaXNDcmVhdGluZ011bHRpcGxlUmVjb3JkcyA9IEFycmF5LmlzQXJyYXkocmVjb3Jkc0RhdGEpO1xuICAgICAgICAgIGlmICghZG9uZSkge1xuICAgICAgICAgICAgICBkb25lID0gb3B0aW9uYWxQYXJhbWV0ZXJzO1xuICAgICAgICAgICAgICBvcHRpb25hbFBhcmFtZXRlcnMgPSB7fTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJlcXVlc3REYXRhO1xuICAgICAgICAgIGlmIChpc0NyZWF0aW5nTXVsdGlwbGVSZWNvcmRzKSB7XG4gICAgICAgICAgICAgIHJlcXVlc3REYXRhID0gX19hc3NpZ24oeyByZWNvcmRzOiByZWNvcmRzRGF0YSB9LCBvcHRpb25hbFBhcmFtZXRlcnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSBfX2Fzc2lnbih7IGZpZWxkczogcmVjb3Jkc0RhdGEgfSwgb3B0aW9uYWxQYXJhbWV0ZXJzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fYmFzZS5ydW5BY3Rpb24oJ3Bvc3QnLCBcIi9cIiArIHRoaXMuX3VybEVuY29kZWROYW1lT3JJZCgpICsgXCIvXCIsIHt9LCByZXF1ZXN0RGF0YSwgZnVuY3Rpb24gKGVyciwgcmVzcCwgYm9keSkge1xuICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgICAgaWYgKGlzQ3JlYXRpbmdNdWx0aXBsZVJlY29yZHMpIHtcbiAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGJvZHkucmVjb3Jkcy5tYXAoZnVuY3Rpb24gKHJlY29yZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgcmVjb3JkXzEuZGVmYXVsdChfdGhpcywgcmVjb3JkLmlkLCByZWNvcmQpO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgcmVjb3JkXzEuZGVmYXVsdChfdGhpcywgYm9keS5pZCwgYm9keSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZG9uZShudWxsLCByZXN1bHQpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIFRhYmxlLnByb3RvdHlwZS5fdXBkYXRlUmVjb3JkcyA9IGZ1bmN0aW9uIChpc0Rlc3RydWN0aXZlVXBkYXRlLCByZWNvcmRzRGF0YU9yUmVjb3JkSWQsIHJlY29yZERhdGFPck9wdHNPckRvbmUsIG9wdHNPckRvbmUsIGRvbmUpIHtcbiAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgIHZhciBvcHRzO1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlY29yZHNEYXRhT3JSZWNvcmRJZCkpIHtcbiAgICAgICAgICAgICAgdmFyIHJlY29yZHNEYXRhID0gcmVjb3Jkc0RhdGFPclJlY29yZElkO1xuICAgICAgICAgICAgICBvcHRzID0gaXNQbGFpbk9iamVjdF8xLmRlZmF1bHQocmVjb3JkRGF0YU9yT3B0c09yRG9uZSkgPyByZWNvcmREYXRhT3JPcHRzT3JEb25lIDoge307XG4gICAgICAgICAgICAgIGRvbmUgPSAob3B0c09yRG9uZSB8fCByZWNvcmREYXRhT3JPcHRzT3JEb25lKTtcbiAgICAgICAgICAgICAgdmFyIG1ldGhvZCA9IGlzRGVzdHJ1Y3RpdmVVcGRhdGUgPyAncHV0JyA6ICdwYXRjaCc7XG4gICAgICAgICAgICAgIHZhciByZXF1ZXN0RGF0YSA9IF9fYXNzaWduKHsgcmVjb3JkczogcmVjb3Jkc0RhdGEgfSwgb3B0cyk7XG4gICAgICAgICAgICAgIHRoaXMuX2Jhc2UucnVuQWN0aW9uKG1ldGhvZCwgXCIvXCIgKyB0aGlzLl91cmxFbmNvZGVkTmFtZU9ySWQoKSArIFwiL1wiLCB7fSwgcmVxdWVzdERhdGEsIGZ1bmN0aW9uIChlcnIsIHJlc3AsIGJvZHkpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGJvZHkucmVjb3Jkcy5tYXAoZnVuY3Rpb24gKHJlY29yZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgcmVjb3JkXzEuZGVmYXVsdChfdGhpcywgcmVjb3JkLmlkLCByZWNvcmQpO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICBkb25lKG51bGwsIHJlc3VsdCk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgdmFyIHJlY29yZElkID0gcmVjb3Jkc0RhdGFPclJlY29yZElkO1xuICAgICAgICAgICAgICB2YXIgcmVjb3JkRGF0YSA9IHJlY29yZERhdGFPck9wdHNPckRvbmU7XG4gICAgICAgICAgICAgIG9wdHMgPSBpc1BsYWluT2JqZWN0XzEuZGVmYXVsdChvcHRzT3JEb25lKSA/IG9wdHNPckRvbmUgOiB7fTtcbiAgICAgICAgICAgICAgZG9uZSA9IChkb25lIHx8IG9wdHNPckRvbmUpO1xuICAgICAgICAgICAgICB2YXIgcmVjb3JkID0gbmV3IHJlY29yZF8xLmRlZmF1bHQodGhpcywgcmVjb3JkSWQpO1xuICAgICAgICAgICAgICBpZiAoaXNEZXN0cnVjdGl2ZVVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgcmVjb3JkLnB1dFVwZGF0ZShyZWNvcmREYXRhLCBvcHRzLCBkb25lKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJlY29yZC5wYXRjaFVwZGF0ZShyZWNvcmREYXRhLCBvcHRzLCBkb25lKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH07XG4gICAgICBUYWJsZS5wcm90b3R5cGUuX2Rlc3Ryb3lSZWNvcmQgPSBmdW5jdGlvbiAocmVjb3JkSWRzT3JJZCwgZG9uZSkge1xuICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVjb3JkSWRzT3JJZCkpIHtcbiAgICAgICAgICAgICAgdmFyIHF1ZXJ5UGFyYW1zID0geyByZWNvcmRzOiByZWNvcmRJZHNPcklkIH07XG4gICAgICAgICAgICAgIHRoaXMuX2Jhc2UucnVuQWN0aW9uKCdkZWxldGUnLCBcIi9cIiArIHRoaXMuX3VybEVuY29kZWROYW1lT3JJZCgpLCBxdWVyeVBhcmFtcywgbnVsbCwgZnVuY3Rpb24gKGVyciwgcmVzcG9uc2UsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdmFyIHJlY29yZHMgPSByZXN1bHRzLnJlY29yZHMubWFwKGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgICAgICAgICAgIHZhciBpZCA9IF9hLmlkO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgcmVjb3JkXzEuZGVmYXVsdChfdGhpcywgaWQsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICBkb25lKG51bGwsIHJlY29yZHMpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIHZhciByZWNvcmQgPSBuZXcgcmVjb3JkXzEuZGVmYXVsdCh0aGlzLCByZWNvcmRJZHNPcklkKTtcbiAgICAgICAgICAgICAgcmVjb3JkLmRlc3Ryb3koZG9uZSk7XG4gICAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIFRhYmxlLnByb3RvdHlwZS5fbGlzdFJlY29yZHMgPSBmdW5jdGlvbiAobGltaXQsIG9mZnNldCwgb3B0cywgZG9uZSkge1xuICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgaWYgKCFkb25lKSB7XG4gICAgICAgICAgICAgIGRvbmUgPSBvcHRzO1xuICAgICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBsaXN0UmVjb3Jkc1BhcmFtZXRlcnMgPSBfX2Fzc2lnbih7IGxpbWl0OiBsaW1pdCxcbiAgICAgICAgICAgICAgb2Zmc2V0OiBvZmZzZXQgfSwgb3B0cyk7XG4gICAgICAgICAgdGhpcy5fYmFzZS5ydW5BY3Rpb24oJ2dldCcsIFwiL1wiICsgdGhpcy5fdXJsRW5jb2RlZE5hbWVPcklkKCkgKyBcIi9cIiwgbGlzdFJlY29yZHNQYXJhbWV0ZXJzLCBudWxsLCBmdW5jdGlvbiAoZXJyLCByZXNwb25zZSwgcmVzdWx0cykge1xuICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIHJlY29yZHMgPSByZXN1bHRzLnJlY29yZHMubWFwKGZ1bmN0aW9uIChyZWNvcmRKc29uKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHJlY29yZF8xLmRlZmF1bHQoX3RoaXMsIG51bGwsIHJlY29yZEpzb24pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgZG9uZShudWxsLCByZWNvcmRzLCByZXN1bHRzLm9mZnNldCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgVGFibGUucHJvdG90eXBlLl9mb3JFYWNoUmVjb3JkID0gZnVuY3Rpb24gKG9wdHMsIGNhbGxiYWNrLCBkb25lKSB7XG4gICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICBkb25lID0gY2FsbGJhY2s7XG4gICAgICAgICAgICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICAgICAgICAgICAgb3B0cyA9IHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgbGltaXQgPSBUYWJsZS5fX3JlY29yZHNQZXJQYWdlRm9ySXRlcmF0aW9uIHx8IDEwMDtcbiAgICAgICAgICB2YXIgb2Zmc2V0ID0gbnVsbDtcbiAgICAgICAgICB2YXIgbmV4dFBhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIF90aGlzLl9saXN0UmVjb3JkcyhsaW1pdCwgb2Zmc2V0LCBvcHRzLCBmdW5jdGlvbiAoZXJyLCBwYWdlLCBuZXdPZmZzZXQpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHBhZ2UubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2socGFnZVtpbmRleF0pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKG5ld09mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IG5ld09mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgICBuZXh0UGFnZSgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIG5leHRQYWdlKCk7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIFRhYmxlO1xuICB9KCkpO1xuICBtb2R1bGUuZXhwb3J0cyA9IFRhYmxlO1xuICBcbiAgfSx7XCIuL2NhbGxiYWNrX3RvX3Byb21pc2VcIjo0LFwiLi9kZXByZWNhdGVcIjo1LFwiLi9xdWVyeVwiOjEzLFwiLi9yZWNvcmRcIjoxNSxcImxvZGFzaC9pc1BsYWluT2JqZWN0XCI6ODh9XSwxODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIFwidXNlIHN0cmljdFwiO1xuICAvKiBlc2xpbnQtZW5hYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnkgKi9cbiAgZnVuY3Rpb24gY2hlY2soZm4sIGVycm9yKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKGZuKHZhbHVlKSkge1xuICAgICAgICAgICAgICByZXR1cm4geyBwYXNzOiB0cnVlIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4geyBwYXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yIH07XG4gICAgICAgICAgfVxuICAgICAgfTtcbiAgfVxuICBjaGVjay5pc09uZU9mID0gZnVuY3Rpb24gaXNPbmVPZihvcHRpb25zKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5pbmNsdWRlcy5iaW5kKG9wdGlvbnMpO1xuICB9O1xuICBjaGVjay5pc0FycmF5T2YgPSBmdW5jdGlvbiAoaXRlbVZhbGlkYXRvcikge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5ldmVyeShpdGVtVmFsaWRhdG9yKTtcbiAgICAgIH07XG4gIH07XG4gIG1vZHVsZS5leHBvcnRzID0gY2hlY2s7XG4gIFxuICB9LHt9XSwxOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gICd1c2Ugc3RyaWN0JztcbiAgXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gIFxuICBmdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7XG4gICAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtcbiAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7XG4gICAgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpO1xuICAgIHJldHVybiBDb25zdHJ1Y3RvcjtcbiAgfVxuICBcbiAgZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7XG4gICAgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgXG4gICAgc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogc3ViQ2xhc3MsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoc3VwZXJDbGFzcykgX3NldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHtcbiAgICBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2Yobykge1xuICAgICAgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTtcbiAgICB9O1xuICAgIHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7XG4gICAgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7XG4gICAgICBvLl9fcHJvdG9fXyA9IHA7XG4gICAgICByZXR1cm4gbztcbiAgICB9O1xuICBcbiAgICByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApO1xuICB9XG4gIFxuICBmdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHtcbiAgICBpZiAoc2VsZiA9PT0gdm9pZCAwKSB7XG4gICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7XG4gICAgfVxuICBcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuICBcbiAgZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkge1xuICAgIGlmIChjYWxsICYmICh0eXBlb2YgY2FsbCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkge1xuICAgICAgcmV0dXJuIGNhbGw7XG4gICAgfVxuICBcbiAgICByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gX3N1cGVyUHJvcEJhc2Uob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIHdoaWxlICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7XG4gICAgICBvYmplY3QgPSBfZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTtcbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGJyZWFrO1xuICAgIH1cbiAgXG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuICBcbiAgZnVuY3Rpb24gX2dldCh0YXJnZXQsIHByb3BlcnR5LCByZWNlaXZlcikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBSZWZsZWN0LmdldCkge1xuICAgICAgX2dldCA9IFJlZmxlY3QuZ2V0O1xuICAgIH0gZWxzZSB7XG4gICAgICBfZ2V0ID0gZnVuY3Rpb24gX2dldCh0YXJnZXQsIHByb3BlcnR5LCByZWNlaXZlcikge1xuICAgICAgICB2YXIgYmFzZSA9IF9zdXBlclByb3BCYXNlKHRhcmdldCwgcHJvcGVydHkpO1xuICBcbiAgICAgICAgaWYgKCFiYXNlKSByZXR1cm47XG4gICAgICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihiYXNlLCBwcm9wZXJ0eSk7XG4gIFxuICAgICAgICBpZiAoZGVzYy5nZXQpIHtcbiAgICAgICAgICByZXR1cm4gZGVzYy5nZXQuY2FsbChyZWNlaXZlcik7XG4gICAgICAgIH1cbiAgXG4gICAgICAgIHJldHVybiBkZXNjLnZhbHVlO1xuICAgICAgfTtcbiAgICB9XG4gIFxuICAgIHJldHVybiBfZ2V0KHRhcmdldCwgcHJvcGVydHksIHJlY2VpdmVyIHx8IHRhcmdldCk7XG4gIH1cbiAgXG4gIHZhciBFbWl0dGVyID1cbiAgLyojX19QVVJFX18qL1xuICBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRW1pdHRlcigpIHtcbiAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFbWl0dGVyKTtcbiAgXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2xpc3RlbmVycycsIHtcbiAgICAgICAgdmFsdWU6IHt9LFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gIFxuICAgIF9jcmVhdGVDbGFzcyhFbWl0dGVyLCBbe1xuICAgICAga2V5OiBcImFkZEV2ZW50TGlzdGVuZXJcIixcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghKHR5cGUgaW4gdGhpcy5saXN0ZW5lcnMpKSB7XG4gICAgICAgICAgdGhpcy5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICAgICAgfVxuICBcbiAgICAgICAgdGhpcy5saXN0ZW5lcnNbdHlwZV0ucHVzaChjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiBcInJlbW92ZUV2ZW50TGlzdGVuZXJcIixcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghKHR5cGUgaW4gdGhpcy5saXN0ZW5lcnMpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gIFxuICAgICAgICB2YXIgc3RhY2sgPSB0aGlzLmxpc3RlbmVyc1t0eXBlXTtcbiAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gc3RhY2subGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHN0YWNrW2ldID09PSBjYWxsYmFjaykge1xuICAgICAgICAgICAgc3RhY2suc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogXCJkaXNwYXRjaEV2ZW50XCIsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gZGlzcGF0Y2hFdmVudChldmVudCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICBcbiAgICAgICAgaWYgKCEoZXZlbnQudHlwZSBpbiB0aGlzLmxpc3RlbmVycykpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgXG4gICAgICAgIHZhciBkZWJvdW5jZSA9IGZ1bmN0aW9uIGRlYm91bmNlKGNhbGxiYWNrKSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suY2FsbChfdGhpcywgZXZlbnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICBcbiAgICAgICAgdmFyIHN0YWNrID0gdGhpcy5saXN0ZW5lcnNbZXZlbnQudHlwZV07XG4gIFxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHN0YWNrLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIGRlYm91bmNlKHN0YWNrW2ldKTtcbiAgICAgICAgfVxuICBcbiAgICAgICAgcmV0dXJuICFldmVudC5kZWZhdWx0UHJldmVudGVkO1xuICAgICAgfVxuICAgIH1dKTtcbiAgXG4gICAgcmV0dXJuIEVtaXR0ZXI7XG4gIH0oKTtcbiAgXG4gIHZhciBBYm9ydFNpZ25hbCA9XG4gIC8qI19fUFVSRV9fKi9cbiAgZnVuY3Rpb24gKF9FbWl0dGVyKSB7XG4gICAgX2luaGVyaXRzKEFib3J0U2lnbmFsLCBfRW1pdHRlcik7XG4gIFxuICAgIGZ1bmN0aW9uIEFib3J0U2lnbmFsKCkge1xuICAgICAgdmFyIF90aGlzMjtcbiAgXG4gICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQWJvcnRTaWduYWwpO1xuICBcbiAgICAgIF90aGlzMiA9IF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIF9nZXRQcm90b3R5cGVPZihBYm9ydFNpZ25hbCkuY2FsbCh0aGlzKSk7IC8vIFNvbWUgdmVyc2lvbnMgb2YgYmFiZWwgZG9lcyBub3QgdHJhbnNwaWxlIHN1cGVyKCkgY29ycmVjdGx5IGZvciBJRSA8PSAxMCwgaWYgdGhlIHBhcmVudFxuICAgICAgLy8gY29uc3RydWN0b3IgaGFzIGZhaWxlZCB0byBydW4sIHRoZW4gXCJ0aGlzLmxpc3RlbmVyc1wiIHdpbGwgc3RpbGwgYmUgdW5kZWZpbmVkIGFuZCB0aGVuIHdlIGNhbGxcbiAgICAgIC8vIHRoZSBwYXJlbnQgY29uc3RydWN0b3IgZGlyZWN0bHkgaW5zdGVhZCBhcyBhIHdvcmthcm91bmQuIEZvciBnZW5lcmFsIGRldGFpbHMsIHNlZSBiYWJlbCBidWc6XG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYmFiZWwvYmFiZWwvaXNzdWVzLzMwNDFcbiAgICAgIC8vIFRoaXMgaGFjayB3YXMgYWRkZWQgYXMgYSBmaXggZm9yIHRoZSBpc3N1ZSBkZXNjcmliZWQgaGVyZTpcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9GaW5hbmNpYWwtVGltZXMvcG9seWZpbGwtbGlicmFyeS9wdWxsLzU5I2lzc3VlY29tbWVudC00Nzc1NTgwNDJcbiAgXG4gICAgICBpZiAoIV90aGlzMi5saXN0ZW5lcnMpIHtcbiAgICAgICAgRW1pdHRlci5jYWxsKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMyKSk7XG4gICAgICB9IC8vIENvbXBhcmVkIHRvIGFzc2lnbm1lbnQsIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBtYWtlcyBwcm9wZXJ0aWVzIG5vbi1lbnVtZXJhYmxlIGJ5IGRlZmF1bHQgYW5kXG4gICAgICAvLyB3ZSB3YW50IE9iamVjdC5rZXlzKG5ldyBBYm9ydENvbnRyb2xsZXIoKS5zaWduYWwpIHRvIGJlIFtdIGZvciBjb21wYXQgd2l0aCB0aGUgbmF0aXZlIGltcGxcbiAgXG4gIFxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMyKSwgJ2Fib3J0ZWQnLCB7XG4gICAgICAgIHZhbHVlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpczIpLCAnb25hYm9ydCcsIHtcbiAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIF90aGlzMjtcbiAgICB9XG4gIFxuICAgIF9jcmVhdGVDbGFzcyhBYm9ydFNpZ25hbCwgW3tcbiAgICAgIGtleTogXCJ0b1N0cmluZ1wiLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gJ1tvYmplY3QgQWJvcnRTaWduYWxdJztcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6IFwiZGlzcGF0Y2hFdmVudFwiLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICdhYm9ydCcpIHtcbiAgICAgICAgICB0aGlzLmFib3J0ZWQgPSB0cnVlO1xuICBcbiAgICAgICAgICBpZiAodHlwZW9mIHRoaXMub25hYm9ydCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy5vbmFib3J0LmNhbGwodGhpcywgZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICBcbiAgICAgICAgX2dldChfZ2V0UHJvdG90eXBlT2YoQWJvcnRTaWduYWwucHJvdG90eXBlKSwgXCJkaXNwYXRjaEV2ZW50XCIsIHRoaXMpLmNhbGwodGhpcywgZXZlbnQpO1xuICAgICAgfVxuICAgIH1dKTtcbiAgXG4gICAgcmV0dXJuIEFib3J0U2lnbmFsO1xuICB9KEVtaXR0ZXIpO1xuICB2YXIgQWJvcnRDb250cm9sbGVyID1cbiAgLyojX19QVVJFX18qL1xuICBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWJvcnRDb250cm9sbGVyKCkge1xuICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEFib3J0Q29udHJvbGxlcik7XG4gIFxuICAgICAgLy8gQ29tcGFyZWQgdG8gYXNzaWdubWVudCwgT2JqZWN0LmRlZmluZVByb3BlcnR5IG1ha2VzIHByb3BlcnRpZXMgbm9uLWVudW1lcmFibGUgYnkgZGVmYXVsdCBhbmRcbiAgICAgIC8vIHdlIHdhbnQgT2JqZWN0LmtleXMobmV3IEFib3J0Q29udHJvbGxlcigpKSB0byBiZSBbXSBmb3IgY29tcGF0IHdpdGggdGhlIG5hdGl2ZSBpbXBsXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3NpZ25hbCcsIHtcbiAgICAgICAgdmFsdWU6IG5ldyBBYm9ydFNpZ25hbCgpLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gIFxuICAgIF9jcmVhdGVDbGFzcyhBYm9ydENvbnRyb2xsZXIsIFt7XG4gICAgICBrZXk6IFwiYWJvcnRcIixcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBhYm9ydCgpIHtcbiAgICAgICAgdmFyIGV2ZW50O1xuICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBldmVudCA9IG5ldyBFdmVudCgnYWJvcnQnKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAoIWRvY3VtZW50LmNyZWF0ZUV2ZW50KSB7XG4gICAgICAgICAgICAgIC8vIEZvciBJbnRlcm5ldCBFeHBsb3JlciA4OlxuICAgICAgICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgICAgICAgICAgIGV2ZW50LnR5cGUgPSAnYWJvcnQnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gRm9yIEludGVybmV0IEV4cGxvcmVyIDExOlxuICAgICAgICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgICAgICAgICAgICBldmVudC5pbml0RXZlbnQoJ2Fib3J0JywgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRmFsbGJhY2sgd2hlcmUgZG9jdW1lbnQgaXNuJ3QgYXZhaWxhYmxlOlxuICAgICAgICAgICAgZXZlbnQgPSB7XG4gICAgICAgICAgICAgIHR5cGU6ICdhYm9ydCcsXG4gICAgICAgICAgICAgIGJ1YmJsZXM6IGZhbHNlLFxuICAgICAgICAgICAgICBjYW5jZWxhYmxlOiBmYWxzZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgXG4gICAgICAgIHRoaXMuc2lnbmFsLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogXCJ0b1N0cmluZ1wiLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gJ1tvYmplY3QgQWJvcnRDb250cm9sbGVyXSc7XG4gICAgICB9XG4gICAgfV0pO1xuICBcbiAgICByZXR1cm4gQWJvcnRDb250cm9sbGVyO1xuICB9KCk7XG4gIFxuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gICAgLy8gVGhlc2UgYXJlIG5lY2Vzc2FyeSB0byBtYWtlIHN1cmUgdGhhdCB3ZSBnZXQgY29ycmVjdCBvdXRwdXQgZm9yOlxuICAgIC8vIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChuZXcgQWJvcnRDb250cm9sbGVyKCkpXG4gICAgQWJvcnRDb250cm9sbGVyLnByb3RvdHlwZVtTeW1ib2wudG9TdHJpbmdUYWddID0gJ0Fib3J0Q29udHJvbGxlcic7XG4gICAgQWJvcnRTaWduYWwucHJvdG90eXBlW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnQWJvcnRTaWduYWwnO1xuICB9XG4gIFxuICBmdW5jdGlvbiBwb2x5ZmlsbE5lZWRlZChzZWxmKSB7XG4gICAgaWYgKHNlbGYuX19GT1JDRV9JTlNUQUxMX0FCT1JUQ09OVFJPTExFUl9QT0xZRklMTCkge1xuICAgICAgY29uc29sZS5sb2coJ19fRk9SQ0VfSU5TVEFMTF9BQk9SVENPTlRST0xMRVJfUE9MWUZJTEw9dHJ1ZSBpcyBzZXQsIHdpbGwgZm9yY2UgaW5zdGFsbCBwb2x5ZmlsbCcpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSAvLyBOb3RlIHRoYXQgdGhlIFwidW5mZXRjaFwiIG1pbmltYWwgZmV0Y2ggcG9seWZpbGwgZGVmaW5lcyBmZXRjaCgpIHdpdGhvdXRcbiAgICAvLyBkZWZpbmluZyB3aW5kb3cuUmVxdWVzdCwgYW5kIHRoaXMgcG9seWZpbGwgbmVlZCB0byB3b3JrIG9uIHRvcCBvZiB1bmZldGNoXG4gICAgLy8gc28gdGhlIGJlbG93IGZlYXR1cmUgZGV0ZWN0aW9uIG5lZWRzIHRoZSAhc2VsZi5BYm9ydENvbnRyb2xsZXIgcGFydC5cbiAgICAvLyBUaGUgUmVxdWVzdC5wcm90b3R5cGUgY2hlY2sgaXMgYWxzbyBuZWVkZWQgYmVjYXVzZSBTYWZhcmkgdmVyc2lvbnMgMTEuMS4yXG4gICAgLy8gdXAgdG8gYW5kIGluY2x1ZGluZyAxMi4xLnggaGFzIGEgd2luZG93LkFib3J0Q29udHJvbGxlciBwcmVzZW50IGJ1dCBzdGlsbFxuICAgIC8vIGRvZXMgTk9UIGNvcnJlY3RseSBpbXBsZW1lbnQgYWJvcnRhYmxlIGZldGNoOlxuICAgIC8vIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNzQ5ODAjYzJcbiAgXG4gIFxuICAgIHJldHVybiB0eXBlb2Ygc2VsZi5SZXF1ZXN0ID09PSAnZnVuY3Rpb24nICYmICFzZWxmLlJlcXVlc3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KCdzaWduYWwnKSB8fCAhc2VsZi5BYm9ydENvbnRyb2xsZXI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBOb3RlOiB0aGUgXCJmZXRjaC5SZXF1ZXN0XCIgZGVmYXVsdCB2YWx1ZSBpcyBhdmFpbGFibGUgZm9yIGZldGNoIGltcG9ydGVkIGZyb21cbiAgICogdGhlIFwibm9kZS1mZXRjaFwiIHBhY2thZ2UgYW5kIG5vdCBpbiBicm93c2Vycy4gVGhpcyBpcyBPSyBzaW5jZSBicm93c2Vyc1xuICAgKiB3aWxsIGJlIGltcG9ydGluZyB1bWQtcG9seWZpbGwuanMgZnJvbSB0aGF0IHBhdGggXCJzZWxmXCIgaXMgcGFzc2VkIHRoZVxuICAgKiBkZWNvcmF0b3Igc28gdGhlIGRlZmF1bHQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZCAoYmVjYXVzZSBicm93c2VycyB0aGF0IGRlZmluZVxuICAgKiBmZXRjaCBhbHNvIGhhcyBSZXF1ZXN0KS4gT25lIHF1aXJreSBzZXR1cCB3aGVyZSBzZWxmLmZldGNoIGV4aXN0cyBidXRcbiAgICogc2VsZi5SZXF1ZXN0IGRvZXMgbm90IGlzIHdoZW4gdGhlIFwidW5mZXRjaFwiIG1pbmltYWwgZmV0Y2ggcG9seWZpbGwgaXMgdXNlZFxuICAgKiBvbiB0b3Agb2YgSUUxMTsgZm9yIHRoaXMgY2FzZSB0aGUgYnJvd3NlciB3aWxsIHRyeSB0byB1c2UgdGhlIGZldGNoLlJlcXVlc3RcbiAgICogZGVmYXVsdCB2YWx1ZSB3aGljaCBpbiB0dXJuIHdpbGwgYmUgdW5kZWZpbmVkIGJ1dCB0aGVuIHRoZW4gXCJpZiAoUmVxdWVzdClcIlxuICAgKiB3aWxsIGVuc3VyZSB0aGF0IHlvdSBnZXQgYSBwYXRjaGVkIGZldGNoIGJ1dCBzdGlsbCBubyBSZXF1ZXN0IChhcyBleHBlY3RlZCkuXG4gICAqIEBwYXJhbSB7ZmV0Y2gsIFJlcXVlc3QgPSBmZXRjaC5SZXF1ZXN0fVxuICAgKiBAcmV0dXJucyB7ZmV0Y2g6IGFib3J0YWJsZUZldGNoLCBSZXF1ZXN0OiBBYm9ydGFibGVSZXF1ZXN0fVxuICAgKi9cbiAgXG4gIGZ1bmN0aW9uIGFib3J0YWJsZUZldGNoRGVjb3JhdG9yKHBhdGNoVGFyZ2V0cykge1xuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgcGF0Y2hUYXJnZXRzKSB7XG4gICAgICBwYXRjaFRhcmdldHMgPSB7XG4gICAgICAgIGZldGNoOiBwYXRjaFRhcmdldHNcbiAgICAgIH07XG4gICAgfVxuICBcbiAgICB2YXIgX3BhdGNoVGFyZ2V0cyA9IHBhdGNoVGFyZ2V0cyxcbiAgICAgICAgZmV0Y2ggPSBfcGF0Y2hUYXJnZXRzLmZldGNoLFxuICAgICAgICBfcGF0Y2hUYXJnZXRzJFJlcXVlc3QgPSBfcGF0Y2hUYXJnZXRzLlJlcXVlc3QsXG4gICAgICAgIE5hdGl2ZVJlcXVlc3QgPSBfcGF0Y2hUYXJnZXRzJFJlcXVlc3QgPT09IHZvaWQgMCA/IGZldGNoLlJlcXVlc3QgOiBfcGF0Y2hUYXJnZXRzJFJlcXVlc3QsXG4gICAgICAgIE5hdGl2ZUFib3J0Q29udHJvbGxlciA9IF9wYXRjaFRhcmdldHMuQWJvcnRDb250cm9sbGVyLFxuICAgICAgICBfcGF0Y2hUYXJnZXRzJF9fRk9SQ0UgPSBfcGF0Y2hUYXJnZXRzLl9fRk9SQ0VfSU5TVEFMTF9BQk9SVENPTlRST0xMRVJfUE9MWUZJTEwsXG4gICAgICAgIF9fRk9SQ0VfSU5TVEFMTF9BQk9SVENPTlRST0xMRVJfUE9MWUZJTEwgPSBfcGF0Y2hUYXJnZXRzJF9fRk9SQ0UgPT09IHZvaWQgMCA/IGZhbHNlIDogX3BhdGNoVGFyZ2V0cyRfX0ZPUkNFO1xuICBcbiAgICBpZiAoIXBvbHlmaWxsTmVlZGVkKHtcbiAgICAgIGZldGNoOiBmZXRjaCxcbiAgICAgIFJlcXVlc3Q6IE5hdGl2ZVJlcXVlc3QsXG4gICAgICBBYm9ydENvbnRyb2xsZXI6IE5hdGl2ZUFib3J0Q29udHJvbGxlcixcbiAgICAgIF9fRk9SQ0VfSU5TVEFMTF9BQk9SVENPTlRST0xMRVJfUE9MWUZJTEw6IF9fRk9SQ0VfSU5TVEFMTF9BQk9SVENPTlRST0xMRVJfUE9MWUZJTExcbiAgICB9KSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZmV0Y2g6IGZldGNoLFxuICAgICAgICBSZXF1ZXN0OiBSZXF1ZXN0XG4gICAgICB9O1xuICAgIH1cbiAgXG4gICAgdmFyIFJlcXVlc3QgPSBOYXRpdmVSZXF1ZXN0OyAvLyBOb3RlIHRoYXQgdGhlIFwidW5mZXRjaFwiIG1pbmltYWwgZmV0Y2ggcG9seWZpbGwgZGVmaW5lcyBmZXRjaCgpIHdpdGhvdXRcbiAgICAvLyBkZWZpbmluZyB3aW5kb3cuUmVxdWVzdCwgYW5kIHRoaXMgcG9seWZpbGwgbmVlZCB0byB3b3JrIG9uIHRvcCBvZiB1bmZldGNoXG4gICAgLy8gaGVuY2Ugd2Ugb25seSBwYXRjaCBpdCBpZiBpdCdzIGF2YWlsYWJsZS4gQWxzbyB3ZSBkb24ndCBwYXRjaCBpdCBpZiBzaWduYWxcbiAgICAvLyBpcyBhbHJlYWR5IGF2YWlsYWJsZSBvbiB0aGUgUmVxdWVzdCBwcm90b3R5cGUgYmVjYXVzZSBpbiB0aGlzIGNhc2Ugc3VwcG9ydFxuICAgIC8vIGlzIHByZXNlbnQgYW5kIHRoZSBwYXRjaGluZyBiZWxvdyBjYW4gY2F1c2UgYSBjcmFzaCBzaW5jZSBpdCBhc3NpZ25zIHRvXG4gICAgLy8gcmVxdWVzdC5zaWduYWwgd2hpY2ggaXMgdGVjaG5pY2FsbHkgYSByZWFkLW9ubHkgcHJvcGVydHkuIFRoaXMgbGF0dGVyIGVycm9yXG4gICAgLy8gaGFwcGVucyB3aGVuIHlvdSBydW4gdGhlIG1haW41LmpzIG5vZGUtZmV0Y2ggZXhhbXBsZSBpbiB0aGUgcmVwb1xuICAgIC8vIFwiYWJvcnRjb250cm9sbGVyLXBvbHlmaWxsLWV4YW1wbGVzXCIuIFRoZSBleGFjdCBlcnJvciBpczpcbiAgICAvLyAgIHJlcXVlc3Quc2lnbmFsID0gaW5pdC5zaWduYWw7XG4gICAgLy8gICBeXG4gICAgLy8gVHlwZUVycm9yOiBDYW5ub3Qgc2V0IHByb3BlcnR5IHNpZ25hbCBvZiAjPFJlcXVlc3Q+IHdoaWNoIGhhcyBvbmx5IGEgZ2V0dGVyXG4gIFxuICAgIGlmIChSZXF1ZXN0ICYmICFSZXF1ZXN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSgnc2lnbmFsJykgfHwgX19GT1JDRV9JTlNUQUxMX0FCT1JUQ09OVFJPTExFUl9QT0xZRklMTCkge1xuICAgICAgUmVxdWVzdCA9IGZ1bmN0aW9uIFJlcXVlc3QoaW5wdXQsIGluaXQpIHtcbiAgICAgICAgdmFyIHNpZ25hbDtcbiAgXG4gICAgICAgIGlmIChpbml0ICYmIGluaXQuc2lnbmFsKSB7XG4gICAgICAgICAgc2lnbmFsID0gaW5pdC5zaWduYWw7IC8vIE5ldmVyIHBhc3MgaW5pdC5zaWduYWwgdG8gdGhlIG5hdGl2ZSBSZXF1ZXN0IGltcGxlbWVudGF0aW9uIHdoZW4gdGhlIHBvbHlmaWxsIGhhc1xuICAgICAgICAgIC8vIGJlZW4gaW5zdGFsbGVkIGJlY2F1c2UgaWYgd2UncmUgcnVubmluZyBvbiB0b3Agb2YgYSBicm93c2VyIHdpdGggYVxuICAgICAgICAgIC8vIHdvcmtpbmcgbmF0aXZlIEFib3J0Q29udHJvbGxlciAoaS5lLiB0aGUgcG9seWZpbGwgd2FzIGluc3RhbGxlZCBkdWUgdG9cbiAgICAgICAgICAvLyBfX0ZPUkNFX0lOU1RBTExfQUJPUlRDT05UUk9MTEVSX1BPTFlGSUxMIGJlaW5nIHNldCksIHRoZW4gcGFzc2luZyBvdXJcbiAgICAgICAgICAvLyBmYWtlIEFib3J0U2lnbmFsIHRvIHRoZSBuYXRpdmUgZmV0Y2ggd2lsbCB0cmlnZ2VyOlxuICAgICAgICAgIC8vIFR5cGVFcnJvcjogRmFpbGVkIHRvIGNvbnN0cnVjdCAnUmVxdWVzdCc6IG1lbWJlciBzaWduYWwgaXMgbm90IG9mIHR5cGUgQWJvcnRTaWduYWwuXG4gIFxuICAgICAgICAgIGRlbGV0ZSBpbml0LnNpZ25hbDtcbiAgICAgICAgfVxuICBcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgTmF0aXZlUmVxdWVzdChpbnB1dCwgaW5pdCk7XG4gIFxuICAgICAgICBpZiAoc2lnbmFsKSB7XG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHJlcXVlc3QsICdzaWduYWwnLCB7XG4gICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIHZhbHVlOiBzaWduYWxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICBcbiAgICAgICAgcmV0dXJuIHJlcXVlc3Q7XG4gICAgICB9O1xuICBcbiAgICAgIFJlcXVlc3QucHJvdG90eXBlID0gTmF0aXZlUmVxdWVzdC5wcm90b3R5cGU7XG4gICAgfVxuICBcbiAgICB2YXIgcmVhbEZldGNoID0gZmV0Y2g7XG4gIFxuICAgIHZhciBhYm9ydGFibGVGZXRjaCA9IGZ1bmN0aW9uIGFib3J0YWJsZUZldGNoKGlucHV0LCBpbml0KSB7XG4gICAgICB2YXIgc2lnbmFsID0gUmVxdWVzdCAmJiBSZXF1ZXN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGlucHV0KSA/IGlucHV0LnNpZ25hbCA6IGluaXQgPyBpbml0LnNpZ25hbCA6IHVuZGVmaW5lZDtcbiAgXG4gICAgICBpZiAoc2lnbmFsKSB7XG4gICAgICAgIHZhciBhYm9ydEVycm9yO1xuICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhYm9ydEVycm9yID0gbmV3IERPTUV4Y2VwdGlvbignQWJvcnRlZCcsICdBYm9ydEVycm9yJyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIC8vIElFIDExIGRvZXMgbm90IHN1cHBvcnQgY2FsbGluZyB0aGUgRE9NRXhjZXB0aW9uIGNvbnN0cnVjdG9yLCB1c2UgYVxuICAgICAgICAgIC8vIHJlZ3VsYXIgZXJyb3Igb2JqZWN0IG9uIGl0IGluc3RlYWQuXG4gICAgICAgICAgYWJvcnRFcnJvciA9IG5ldyBFcnJvcignQWJvcnRlZCcpO1xuICAgICAgICAgIGFib3J0RXJyb3IubmFtZSA9ICdBYm9ydEVycm9yJztcbiAgICAgICAgfSAvLyBSZXR1cm4gZWFybHkgaWYgYWxyZWFkeSBhYm9ydGVkLCB0aHVzIGF2b2lkaW5nIG1ha2luZyBhbiBIVFRQIHJlcXVlc3RcbiAgXG4gIFxuICAgICAgICBpZiAoc2lnbmFsLmFib3J0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYWJvcnRFcnJvcik7XG4gICAgICAgIH0gLy8gVHVybiBhbiBldmVudCBpbnRvIGEgcHJvbWlzZSwgcmVqZWN0IGl0IG9uY2UgYGFib3J0YCBpcyBkaXNwYXRjaGVkXG4gIFxuICBcbiAgICAgICAgdmFyIGNhbmNlbGxhdGlvbiA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChfLCByZWplY3QpIHtcbiAgICAgICAgICBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KGFib3J0RXJyb3IpO1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIG9uY2U6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gIFxuICAgICAgICBpZiAoaW5pdCAmJiBpbml0LnNpZ25hbCkge1xuICAgICAgICAgIC8vIE5ldmVyIHBhc3MgLnNpZ25hbCB0byB0aGUgbmF0aXZlIGltcGxlbWVudGF0aW9uIHdoZW4gdGhlIHBvbHlmaWxsIGhhc1xuICAgICAgICAgIC8vIGJlZW4gaW5zdGFsbGVkIGJlY2F1c2UgaWYgd2UncmUgcnVubmluZyBvbiB0b3Agb2YgYSBicm93c2VyIHdpdGggYVxuICAgICAgICAgIC8vIHdvcmtpbmcgbmF0aXZlIEFib3J0Q29udHJvbGxlciAoaS5lLiB0aGUgcG9seWZpbGwgd2FzIGluc3RhbGxlZCBkdWUgdG9cbiAgICAgICAgICAvLyBfX0ZPUkNFX0lOU1RBTExfQUJPUlRDT05UUk9MTEVSX1BPTFlGSUxMIGJlaW5nIHNldCksIHRoZW4gcGFzc2luZyBvdXJcbiAgICAgICAgICAvLyBmYWtlIEFib3J0U2lnbmFsIHRvIHRoZSBuYXRpdmUgZmV0Y2ggd2lsbCB0cmlnZ2VyOlxuICAgICAgICAgIC8vIFR5cGVFcnJvcjogRmFpbGVkIHRvIGV4ZWN1dGUgJ2ZldGNoJyBvbiAnV2luZG93JzogbWVtYmVyIHNpZ25hbCBpcyBub3Qgb2YgdHlwZSBBYm9ydFNpZ25hbC5cbiAgICAgICAgICBkZWxldGUgaW5pdC5zaWduYWw7XG4gICAgICAgIH0gLy8gUmV0dXJuIHRoZSBmYXN0ZXN0IHByb21pc2UgKGRvbid0IG5lZWQgdG8gd2FpdCBmb3IgcmVxdWVzdCB0byBmaW5pc2gpXG4gIFxuICBcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmFjZShbY2FuY2VsbGF0aW9uLCByZWFsRmV0Y2goaW5wdXQsIGluaXQpXSk7XG4gICAgICB9XG4gIFxuICAgICAgcmV0dXJuIHJlYWxGZXRjaChpbnB1dCwgaW5pdCk7XG4gICAgfTtcbiAgXG4gICAgcmV0dXJuIHtcbiAgICAgIGZldGNoOiBhYm9ydGFibGVGZXRjaCxcbiAgICAgIFJlcXVlc3Q6IFJlcXVlc3RcbiAgICB9O1xuICB9XG4gIFxuICBleHBvcnRzLkFib3J0Q29udHJvbGxlciA9IEFib3J0Q29udHJvbGxlcjtcbiAgZXhwb3J0cy5BYm9ydFNpZ25hbCA9IEFib3J0U2lnbmFsO1xuICBleHBvcnRzLmFib3J0YWJsZUZldGNoID0gYWJvcnRhYmxlRmV0Y2hEZWNvcmF0b3I7XG4gIFxuICB9LHt9XSwyMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIFxuICB9LHt9XSwyMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBoYXNoQ2xlYXIgPSByZXF1aXJlKCcuL19oYXNoQ2xlYXInKSxcbiAgICAgIGhhc2hEZWxldGUgPSByZXF1aXJlKCcuL19oYXNoRGVsZXRlJyksXG4gICAgICBoYXNoR2V0ID0gcmVxdWlyZSgnLi9faGFzaEdldCcpLFxuICAgICAgaGFzaEhhcyA9IHJlcXVpcmUoJy4vX2hhc2hIYXMnKSxcbiAgICAgIGhhc2hTZXQgPSByZXF1aXJlKCcuL19oYXNoU2V0Jyk7XG4gIFxuICAvKipcbiAgICogQ3JlYXRlcyBhIGhhc2ggb2JqZWN0LlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtBcnJheX0gW2VudHJpZXNdIFRoZSBrZXktdmFsdWUgcGFpcnMgdG8gY2FjaGUuXG4gICAqL1xuICBmdW5jdGlvbiBIYXNoKGVudHJpZXMpIHtcbiAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gZW50cmllcyA9PSBudWxsID8gMCA6IGVudHJpZXMubGVuZ3RoO1xuICBcbiAgICB0aGlzLmNsZWFyKCk7XG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaW5kZXhdO1xuICAgICAgdGhpcy5zZXQoZW50cnlbMF0sIGVudHJ5WzFdKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIEFkZCBtZXRob2RzIHRvIGBIYXNoYC5cbiAgSGFzaC5wcm90b3R5cGUuY2xlYXIgPSBoYXNoQ2xlYXI7XG4gIEhhc2gucHJvdG90eXBlWydkZWxldGUnXSA9IGhhc2hEZWxldGU7XG4gIEhhc2gucHJvdG90eXBlLmdldCA9IGhhc2hHZXQ7XG4gIEhhc2gucHJvdG90eXBlLmhhcyA9IGhhc2hIYXM7XG4gIEhhc2gucHJvdG90eXBlLnNldCA9IGhhc2hTZXQ7XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IEhhc2g7XG4gIFxuICB9LHtcIi4vX2hhc2hDbGVhclwiOjQ2LFwiLi9faGFzaERlbGV0ZVwiOjQ3LFwiLi9faGFzaEdldFwiOjQ4LFwiLi9faGFzaEhhc1wiOjQ5LFwiLi9faGFzaFNldFwiOjUwfV0sMjI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgbGlzdENhY2hlQ2xlYXIgPSByZXF1aXJlKCcuL19saXN0Q2FjaGVDbGVhcicpLFxuICAgICAgbGlzdENhY2hlRGVsZXRlID0gcmVxdWlyZSgnLi9fbGlzdENhY2hlRGVsZXRlJyksXG4gICAgICBsaXN0Q2FjaGVHZXQgPSByZXF1aXJlKCcuL19saXN0Q2FjaGVHZXQnKSxcbiAgICAgIGxpc3RDYWNoZUhhcyA9IHJlcXVpcmUoJy4vX2xpc3RDYWNoZUhhcycpLFxuICAgICAgbGlzdENhY2hlU2V0ID0gcmVxdWlyZSgnLi9fbGlzdENhY2hlU2V0Jyk7XG4gIFxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBsaXN0IGNhY2hlIG9iamVjdC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7QXJyYXl9IFtlbnRyaWVzXSBUaGUga2V5LXZhbHVlIHBhaXJzIHRvIGNhY2hlLlxuICAgKi9cbiAgZnVuY3Rpb24gTGlzdENhY2hlKGVudHJpZXMpIHtcbiAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gZW50cmllcyA9PSBudWxsID8gMCA6IGVudHJpZXMubGVuZ3RoO1xuICBcbiAgICB0aGlzLmNsZWFyKCk7XG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaW5kZXhdO1xuICAgICAgdGhpcy5zZXQoZW50cnlbMF0sIGVudHJ5WzFdKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIEFkZCBtZXRob2RzIHRvIGBMaXN0Q2FjaGVgLlxuICBMaXN0Q2FjaGUucHJvdG90eXBlLmNsZWFyID0gbGlzdENhY2hlQ2xlYXI7XG4gIExpc3RDYWNoZS5wcm90b3R5cGVbJ2RlbGV0ZSddID0gbGlzdENhY2hlRGVsZXRlO1xuICBMaXN0Q2FjaGUucHJvdG90eXBlLmdldCA9IGxpc3RDYWNoZUdldDtcbiAgTGlzdENhY2hlLnByb3RvdHlwZS5oYXMgPSBsaXN0Q2FjaGVIYXM7XG4gIExpc3RDYWNoZS5wcm90b3R5cGUuc2V0ID0gbGlzdENhY2hlU2V0O1xuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBMaXN0Q2FjaGU7XG4gIFxuICB9LHtcIi4vX2xpc3RDYWNoZUNsZWFyXCI6NTYsXCIuL19saXN0Q2FjaGVEZWxldGVcIjo1NyxcIi4vX2xpc3RDYWNoZUdldFwiOjU4LFwiLi9fbGlzdENhY2hlSGFzXCI6NTksXCIuL19saXN0Q2FjaGVTZXRcIjo2MH1dLDIzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGdldE5hdGl2ZSA9IHJlcXVpcmUoJy4vX2dldE5hdGl2ZScpLFxuICAgICAgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcbiAgXG4gIC8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHRoYXQgYXJlIHZlcmlmaWVkIHRvIGJlIG5hdGl2ZS4gKi9cbiAgdmFyIE1hcCA9IGdldE5hdGl2ZShyb290LCAnTWFwJyk7XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IE1hcDtcbiAgXG4gIH0se1wiLi9fZ2V0TmF0aXZlXCI6NDIsXCIuL19yb290XCI6NzJ9XSwyNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBtYXBDYWNoZUNsZWFyID0gcmVxdWlyZSgnLi9fbWFwQ2FjaGVDbGVhcicpLFxuICAgICAgbWFwQ2FjaGVEZWxldGUgPSByZXF1aXJlKCcuL19tYXBDYWNoZURlbGV0ZScpLFxuICAgICAgbWFwQ2FjaGVHZXQgPSByZXF1aXJlKCcuL19tYXBDYWNoZUdldCcpLFxuICAgICAgbWFwQ2FjaGVIYXMgPSByZXF1aXJlKCcuL19tYXBDYWNoZUhhcycpLFxuICAgICAgbWFwQ2FjaGVTZXQgPSByZXF1aXJlKCcuL19tYXBDYWNoZVNldCcpO1xuICBcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBtYXAgY2FjaGUgb2JqZWN0IHRvIHN0b3JlIGtleS12YWx1ZSBwYWlycy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7QXJyYXl9IFtlbnRyaWVzXSBUaGUga2V5LXZhbHVlIHBhaXJzIHRvIGNhY2hlLlxuICAgKi9cbiAgZnVuY3Rpb24gTWFwQ2FjaGUoZW50cmllcykge1xuICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICBsZW5ndGggPSBlbnRyaWVzID09IG51bGwgPyAwIDogZW50cmllcy5sZW5ndGg7XG4gIFxuICAgIHRoaXMuY2xlYXIoKTtcbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgdmFyIGVudHJ5ID0gZW50cmllc1tpbmRleF07XG4gICAgICB0aGlzLnNldChlbnRyeVswXSwgZW50cnlbMV0pO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gQWRkIG1ldGhvZHMgdG8gYE1hcENhY2hlYC5cbiAgTWFwQ2FjaGUucHJvdG90eXBlLmNsZWFyID0gbWFwQ2FjaGVDbGVhcjtcbiAgTWFwQ2FjaGUucHJvdG90eXBlWydkZWxldGUnXSA9IG1hcENhY2hlRGVsZXRlO1xuICBNYXBDYWNoZS5wcm90b3R5cGUuZ2V0ID0gbWFwQ2FjaGVHZXQ7XG4gIE1hcENhY2hlLnByb3RvdHlwZS5oYXMgPSBtYXBDYWNoZUhhcztcbiAgTWFwQ2FjaGUucHJvdG90eXBlLnNldCA9IG1hcENhY2hlU2V0O1xuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBNYXBDYWNoZTtcbiAgXG4gIH0se1wiLi9fbWFwQ2FjaGVDbGVhclwiOjYxLFwiLi9fbWFwQ2FjaGVEZWxldGVcIjo2MixcIi4vX21hcENhY2hlR2V0XCI6NjMsXCIuL19tYXBDYWNoZUhhc1wiOjY0LFwiLi9fbWFwQ2FjaGVTZXRcIjo2NX1dLDI1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIHJvb3QgPSByZXF1aXJlKCcuL19yb290Jyk7XG4gIFxuICAvKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIFN5bWJvbCA9IHJvb3QuU3ltYm9sO1xuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBTeW1ib2w7XG4gIFxuICB9LHtcIi4vX3Jvb3RcIjo3Mn1dLDI2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGJhc2VUaW1lcyA9IHJlcXVpcmUoJy4vX2Jhc2VUaW1lcycpLFxuICAgICAgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuL2lzQXJndW1lbnRzJyksXG4gICAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi9pc0FycmF5JyksXG4gICAgICBpc0J1ZmZlciA9IHJlcXVpcmUoJy4vaXNCdWZmZXInKSxcbiAgICAgIGlzSW5kZXggPSByZXF1aXJlKCcuL19pc0luZGV4JyksXG4gICAgICBpc1R5cGVkQXJyYXkgPSByZXF1aXJlKCcuL2lzVHlwZWRBcnJheScpO1xuICBcbiAgLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xuICB2YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuICBcbiAgLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuICBcbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdGhlIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgdGhlIGFycmF5LWxpa2UgYHZhbHVlYC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcXVlcnkuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaW5oZXJpdGVkIFNwZWNpZnkgcmV0dXJuaW5nIGluaGVyaXRlZCBwcm9wZXJ0eSBuYW1lcy5cbiAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAgICovXG4gIGZ1bmN0aW9uIGFycmF5TGlrZUtleXModmFsdWUsIGluaGVyaXRlZCkge1xuICAgIHZhciBpc0FyciA9IGlzQXJyYXkodmFsdWUpLFxuICAgICAgICBpc0FyZyA9ICFpc0FyciAmJiBpc0FyZ3VtZW50cyh2YWx1ZSksXG4gICAgICAgIGlzQnVmZiA9ICFpc0FyciAmJiAhaXNBcmcgJiYgaXNCdWZmZXIodmFsdWUpLFxuICAgICAgICBpc1R5cGUgPSAhaXNBcnIgJiYgIWlzQXJnICYmICFpc0J1ZmYgJiYgaXNUeXBlZEFycmF5KHZhbHVlKSxcbiAgICAgICAgc2tpcEluZGV4ZXMgPSBpc0FyciB8fCBpc0FyZyB8fCBpc0J1ZmYgfHwgaXNUeXBlLFxuICAgICAgICByZXN1bHQgPSBza2lwSW5kZXhlcyA/IGJhc2VUaW1lcyh2YWx1ZS5sZW5ndGgsIFN0cmluZykgOiBbXSxcbiAgICAgICAgbGVuZ3RoID0gcmVzdWx0Lmxlbmd0aDtcbiAgXG4gICAgZm9yICh2YXIga2V5IGluIHZhbHVlKSB7XG4gICAgICBpZiAoKGluaGVyaXRlZCB8fCBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBrZXkpKSAmJlxuICAgICAgICAgICEoc2tpcEluZGV4ZXMgJiYgKFxuICAgICAgICAgICAgIC8vIFNhZmFyaSA5IGhhcyBlbnVtZXJhYmxlIGBhcmd1bWVudHMubGVuZ3RoYCBpbiBzdHJpY3QgbW9kZS5cbiAgICAgICAgICAgICBrZXkgPT0gJ2xlbmd0aCcgfHxcbiAgICAgICAgICAgICAvLyBOb2RlLmpzIDAuMTAgaGFzIGVudW1lcmFibGUgbm9uLWluZGV4IHByb3BlcnRpZXMgb24gYnVmZmVycy5cbiAgICAgICAgICAgICAoaXNCdWZmICYmIChrZXkgPT0gJ29mZnNldCcgfHwga2V5ID09ICdwYXJlbnQnKSkgfHxcbiAgICAgICAgICAgICAvLyBQaGFudG9tSlMgMiBoYXMgZW51bWVyYWJsZSBub24taW5kZXggcHJvcGVydGllcyBvbiB0eXBlZCBhcnJheXMuXG4gICAgICAgICAgICAgKGlzVHlwZSAmJiAoa2V5ID09ICdidWZmZXInIHx8IGtleSA9PSAnYnl0ZUxlbmd0aCcgfHwga2V5ID09ICdieXRlT2Zmc2V0JykpIHx8XG4gICAgICAgICAgICAgLy8gU2tpcCBpbmRleCBwcm9wZXJ0aWVzLlxuICAgICAgICAgICAgIGlzSW5kZXgoa2V5LCBsZW5ndGgpXG4gICAgICAgICAgKSkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBhcnJheUxpa2VLZXlzO1xuICBcbiAgfSx7XCIuL19iYXNlVGltZXNcIjozNSxcIi4vX2lzSW5kZXhcIjo1MSxcIi4vaXNBcmd1bWVudHNcIjo3OCxcIi4vaXNBcnJheVwiOjc5LFwiLi9pc0J1ZmZlclwiOjgxLFwiLi9pc1R5cGVkQXJyYXlcIjo5MX1dLDI3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgLyoqXG4gICAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5tYXBgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvciBpdGVyYXRlZVxuICAgKiBzaG9ydGhhbmRzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0FycmF5fSBbYXJyYXldIFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IG1hcHBlZCBhcnJheS5cbiAgICovXG4gIGZ1bmN0aW9uIGFycmF5TWFwKGFycmF5LCBpdGVyYXRlZSkge1xuICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICBsZW5ndGggPSBhcnJheSA9PSBudWxsID8gMCA6IGFycmF5Lmxlbmd0aCxcbiAgICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcbiAgXG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHJlc3VsdFtpbmRleF0gPSBpdGVyYXRlZShhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gYXJyYXlNYXA7XG4gIFxuICB9LHt9XSwyODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBlcSA9IHJlcXVpcmUoJy4vZXEnKTtcbiAgXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgYGtleWAgaXMgZm91bmQgaW4gYGFycmF5YCBvZiBrZXktdmFsdWUgcGFpcnMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpbnNwZWN0LlxuICAgKiBAcGFyYW0geyp9IGtleSBUaGUga2V5IHRvIHNlYXJjaCBmb3IuXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBtYXRjaGVkIHZhbHVlLCBlbHNlIGAtMWAuXG4gICAqL1xuICBmdW5jdGlvbiBhc3NvY0luZGV4T2YoYXJyYXksIGtleSkge1xuICAgIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICBpZiAoZXEoYXJyYXlbbGVuZ3RoXVswXSwga2V5KSkge1xuICAgICAgICByZXR1cm4gbGVuZ3RoO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gYXNzb2NJbmRleE9mO1xuICBcbiAgfSx7XCIuL2VxXCI6NzZ9XSwyOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBjYXN0UGF0aCA9IHJlcXVpcmUoJy4vX2Nhc3RQYXRoJyksXG4gICAgICB0b0tleSA9IHJlcXVpcmUoJy4vX3RvS2V5Jyk7XG4gIFxuICAvKipcbiAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZ2V0YCB3aXRob3V0IHN1cHBvcnQgZm9yIGRlZmF1bHQgdmFsdWVzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gICAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBwYXRoIFRoZSBwYXRoIG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSByZXNvbHZlZCB2YWx1ZS5cbiAgICovXG4gIGZ1bmN0aW9uIGJhc2VHZXQob2JqZWN0LCBwYXRoKSB7XG4gICAgcGF0aCA9IGNhc3RQYXRoKHBhdGgsIG9iamVjdCk7XG4gIFxuICAgIHZhciBpbmRleCA9IDAsXG4gICAgICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoO1xuICBcbiAgICB3aGlsZSAob2JqZWN0ICE9IG51bGwgJiYgaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIG9iamVjdCA9IG9iamVjdFt0b0tleShwYXRoW2luZGV4KytdKV07XG4gICAgfVxuICAgIHJldHVybiAoaW5kZXggJiYgaW5kZXggPT0gbGVuZ3RoKSA/IG9iamVjdCA6IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBiYXNlR2V0O1xuICBcbiAgfSx7XCIuL19jYXN0UGF0aFwiOjM4LFwiLi9fdG9LZXlcIjo3NH1dLDMwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIFN5bWJvbCA9IHJlcXVpcmUoJy4vX1N5bWJvbCcpLFxuICAgICAgZ2V0UmF3VGFnID0gcmVxdWlyZSgnLi9fZ2V0UmF3VGFnJyksXG4gICAgICBvYmplY3RUb1N0cmluZyA9IHJlcXVpcmUoJy4vX29iamVjdFRvU3RyaW5nJyk7XG4gIFxuICAvKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG4gIHZhciBudWxsVGFnID0gJ1tvYmplY3QgTnVsbF0nLFxuICAgICAgdW5kZWZpbmVkVGFnID0gJ1tvYmplY3QgVW5kZWZpbmVkXSc7XG4gIFxuICAvKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIHN5bVRvU3RyaW5nVGFnID0gU3ltYm9sID8gU3ltYm9sLnRvU3RyaW5nVGFnIDogdW5kZWZpbmVkO1xuICBcbiAgLyoqXG4gICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBnZXRUYWdgIHdpdGhvdXQgZmFsbGJhY2tzIGZvciBidWdneSBlbnZpcm9ubWVudHMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHF1ZXJ5LlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBgdG9TdHJpbmdUYWdgLlxuICAgKi9cbiAgZnVuY3Rpb24gYmFzZUdldFRhZyh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZFRhZyA6IG51bGxUYWc7XG4gICAgfVxuICAgIHJldHVybiAoc3ltVG9TdHJpbmdUYWcgJiYgc3ltVG9TdHJpbmdUYWcgaW4gT2JqZWN0KHZhbHVlKSlcbiAgICAgID8gZ2V0UmF3VGFnKHZhbHVlKVxuICAgICAgOiBvYmplY3RUb1N0cmluZyh2YWx1ZSk7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gYmFzZUdldFRhZztcbiAgXG4gIH0se1wiLi9fU3ltYm9sXCI6MjUsXCIuL19nZXRSYXdUYWdcIjo0NCxcIi4vX29iamVjdFRvU3RyaW5nXCI6NzB9XSwzMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBiYXNlR2V0VGFnID0gcmVxdWlyZSgnLi9fYmFzZUdldFRhZycpLFxuICAgICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcbiAgXG4gIC8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIGFyZ3NUYWcgPSAnW29iamVjdCBBcmd1bWVudHNdJztcbiAgXG4gIC8qKlxuICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pc0FyZ3VtZW50c2AuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBgYXJndW1lbnRzYCBvYmplY3QsXG4gICAqL1xuICBmdW5jdGlvbiBiYXNlSXNBcmd1bWVudHModmFsdWUpIHtcbiAgICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBiYXNlR2V0VGFnKHZhbHVlKSA9PSBhcmdzVGFnO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGJhc2VJc0FyZ3VtZW50cztcbiAgXG4gIH0se1wiLi9fYmFzZUdldFRhZ1wiOjMwLFwiLi9pc09iamVjdExpa2VcIjo4N31dLDMyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGlzRnVuY3Rpb24gPSByZXF1aXJlKCcuL2lzRnVuY3Rpb24nKSxcbiAgICAgIGlzTWFza2VkID0gcmVxdWlyZSgnLi9faXNNYXNrZWQnKSxcbiAgICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpLFxuICAgICAgdG9Tb3VyY2UgPSByZXF1aXJlKCcuL190b1NvdXJjZScpO1xuICBcbiAgLyoqXG4gICAqIFVzZWQgdG8gbWF0Y2ggYFJlZ0V4cGBcbiAgICogW3N5bnRheCBjaGFyYWN0ZXJzXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1wYXR0ZXJucykuXG4gICAqL1xuICB2YXIgcmVSZWdFeHBDaGFyID0gL1tcXFxcXiQuKis/KClbXFxde318XS9nO1xuICBcbiAgLyoqIFVzZWQgdG8gZGV0ZWN0IGhvc3QgY29uc3RydWN0b3JzIChTYWZhcmkpLiAqL1xuICB2YXIgcmVJc0hvc3RDdG9yID0gL15cXFtvYmplY3QgLis/Q29uc3RydWN0b3JcXF0kLztcbiAgXG4gIC8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIGZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZSxcbiAgICAgIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcbiAgXG4gIC8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGRlY29tcGlsZWQgc291cmNlIG9mIGZ1bmN0aW9ucy4gKi9cbiAgdmFyIGZ1bmNUb1N0cmluZyA9IGZ1bmNQcm90by50b1N0cmluZztcbiAgXG4gIC8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xuICB2YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcbiAgXG4gIC8qKiBVc2VkIHRvIGRldGVjdCBpZiBhIG1ldGhvZCBpcyBuYXRpdmUuICovXG4gIHZhciByZUlzTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gICAgZnVuY1RvU3RyaW5nLmNhbGwoaGFzT3duUHJvcGVydHkpLnJlcGxhY2UocmVSZWdFeHBDaGFyLCAnXFxcXCQmJylcbiAgICAucmVwbGFjZSgvaGFzT3duUHJvcGVydHl8KGZ1bmN0aW9uKS4qPyg/PVxcXFxcXCgpfCBmb3IgLis/KD89XFxcXFxcXSkvZywgJyQxLio/JykgKyAnJCdcbiAgKTtcbiAgXG4gIC8qKlxuICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pc05hdGl2ZWAgd2l0aG91dCBiYWQgc2hpbSBjaGVja3MuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbixcbiAgICogIGVsc2UgYGZhbHNlYC5cbiAgICovXG4gIGZ1bmN0aW9uIGJhc2VJc05hdGl2ZSh2YWx1ZSkge1xuICAgIGlmICghaXNPYmplY3QodmFsdWUpIHx8IGlzTWFza2VkKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgcGF0dGVybiA9IGlzRnVuY3Rpb24odmFsdWUpID8gcmVJc05hdGl2ZSA6IHJlSXNIb3N0Q3RvcjtcbiAgICByZXR1cm4gcGF0dGVybi50ZXN0KHRvU291cmNlKHZhbHVlKSk7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gYmFzZUlzTmF0aXZlO1xuICBcbiAgfSx7XCIuL19pc01hc2tlZFwiOjU0LFwiLi9fdG9Tb3VyY2VcIjo3NSxcIi4vaXNGdW5jdGlvblwiOjgyLFwiLi9pc09iamVjdFwiOjg2fV0sMzM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgYmFzZUdldFRhZyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRUYWcnKSxcbiAgICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi9pc0xlbmd0aCcpLFxuICAgICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcbiAgXG4gIC8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIGFyZ3NUYWcgPSAnW29iamVjdCBBcmd1bWVudHNdJyxcbiAgICAgIGFycmF5VGFnID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICAgIGJvb2xUYWcgPSAnW29iamVjdCBCb29sZWFuXScsXG4gICAgICBkYXRlVGFnID0gJ1tvYmplY3QgRGF0ZV0nLFxuICAgICAgZXJyb3JUYWcgPSAnW29iamVjdCBFcnJvcl0nLFxuICAgICAgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgICBtYXBUYWcgPSAnW29iamVjdCBNYXBdJyxcbiAgICAgIG51bWJlclRhZyA9ICdbb2JqZWN0IE51bWJlcl0nLFxuICAgICAgb2JqZWN0VGFnID0gJ1tvYmplY3QgT2JqZWN0XScsXG4gICAgICByZWdleHBUYWcgPSAnW29iamVjdCBSZWdFeHBdJyxcbiAgICAgIHNldFRhZyA9ICdbb2JqZWN0IFNldF0nLFxuICAgICAgc3RyaW5nVGFnID0gJ1tvYmplY3QgU3RyaW5nXScsXG4gICAgICB3ZWFrTWFwVGFnID0gJ1tvYmplY3QgV2Vha01hcF0nO1xuICBcbiAgdmFyIGFycmF5QnVmZmVyVGFnID0gJ1tvYmplY3QgQXJyYXlCdWZmZXJdJyxcbiAgICAgIGRhdGFWaWV3VGFnID0gJ1tvYmplY3QgRGF0YVZpZXddJyxcbiAgICAgIGZsb2F0MzJUYWcgPSAnW29iamVjdCBGbG9hdDMyQXJyYXldJyxcbiAgICAgIGZsb2F0NjRUYWcgPSAnW29iamVjdCBGbG9hdDY0QXJyYXldJyxcbiAgICAgIGludDhUYWcgPSAnW29iamVjdCBJbnQ4QXJyYXldJyxcbiAgICAgIGludDE2VGFnID0gJ1tvYmplY3QgSW50MTZBcnJheV0nLFxuICAgICAgaW50MzJUYWcgPSAnW29iamVjdCBJbnQzMkFycmF5XScsXG4gICAgICB1aW50OFRhZyA9ICdbb2JqZWN0IFVpbnQ4QXJyYXldJyxcbiAgICAgIHVpbnQ4Q2xhbXBlZFRhZyA9ICdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XScsXG4gICAgICB1aW50MTZUYWcgPSAnW29iamVjdCBVaW50MTZBcnJheV0nLFxuICAgICAgdWludDMyVGFnID0gJ1tvYmplY3QgVWludDMyQXJyYXldJztcbiAgXG4gIC8qKiBVc2VkIHRvIGlkZW50aWZ5IGB0b1N0cmluZ1RhZ2AgdmFsdWVzIG9mIHR5cGVkIGFycmF5cy4gKi9cbiAgdmFyIHR5cGVkQXJyYXlUYWdzID0ge307XG4gIHR5cGVkQXJyYXlUYWdzW2Zsb2F0MzJUYWddID0gdHlwZWRBcnJheVRhZ3NbZmxvYXQ2NFRhZ10gPVxuICB0eXBlZEFycmF5VGFnc1tpbnQ4VGFnXSA9IHR5cGVkQXJyYXlUYWdzW2ludDE2VGFnXSA9XG4gIHR5cGVkQXJyYXlUYWdzW2ludDMyVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3VpbnQ4VGFnXSA9XG4gIHR5cGVkQXJyYXlUYWdzW3VpbnQ4Q2xhbXBlZFRhZ10gPSB0eXBlZEFycmF5VGFnc1t1aW50MTZUYWddID1cbiAgdHlwZWRBcnJheVRhZ3NbdWludDMyVGFnXSA9IHRydWU7XG4gIHR5cGVkQXJyYXlUYWdzW2FyZ3NUYWddID0gdHlwZWRBcnJheVRhZ3NbYXJyYXlUYWddID1cbiAgdHlwZWRBcnJheVRhZ3NbYXJyYXlCdWZmZXJUYWddID0gdHlwZWRBcnJheVRhZ3NbYm9vbFRhZ10gPVxuICB0eXBlZEFycmF5VGFnc1tkYXRhVmlld1RhZ10gPSB0eXBlZEFycmF5VGFnc1tkYXRlVGFnXSA9XG4gIHR5cGVkQXJyYXlUYWdzW2Vycm9yVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2Z1bmNUYWddID1cbiAgdHlwZWRBcnJheVRhZ3NbbWFwVGFnXSA9IHR5cGVkQXJyYXlUYWdzW251bWJlclRhZ10gPVxuICB0eXBlZEFycmF5VGFnc1tvYmplY3RUYWddID0gdHlwZWRBcnJheVRhZ3NbcmVnZXhwVGFnXSA9XG4gIHR5cGVkQXJyYXlUYWdzW3NldFRhZ10gPSB0eXBlZEFycmF5VGFnc1tzdHJpbmdUYWddID1cbiAgdHlwZWRBcnJheVRhZ3Nbd2Vha01hcFRhZ10gPSBmYWxzZTtcbiAgXG4gIC8qKlxuICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pc1R5cGVkQXJyYXlgIHdpdGhvdXQgTm9kZS5qcyBvcHRpbWl6YXRpb25zLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB0eXBlZCBhcnJheSwgZWxzZSBgZmFsc2VgLlxuICAgKi9cbiAgZnVuY3Rpb24gYmFzZUlzVHlwZWRBcnJheSh2YWx1ZSkge1xuICAgIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmXG4gICAgICBpc0xlbmd0aCh2YWx1ZS5sZW5ndGgpICYmICEhdHlwZWRBcnJheVRhZ3NbYmFzZUdldFRhZyh2YWx1ZSldO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGJhc2VJc1R5cGVkQXJyYXk7XG4gIFxuICB9LHtcIi4vX2Jhc2VHZXRUYWdcIjozMCxcIi4vaXNMZW5ndGhcIjo4MyxcIi4vaXNPYmplY3RMaWtlXCI6ODd9XSwzNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBpc1Byb3RvdHlwZSA9IHJlcXVpcmUoJy4vX2lzUHJvdG90eXBlJyksXG4gICAgICBuYXRpdmVLZXlzID0gcmVxdWlyZSgnLi9fbmF0aXZlS2V5cycpO1xuICBcbiAgLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xuICB2YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuICBcbiAgLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuICBcbiAgLyoqXG4gICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmtleXNgIHdoaWNoIGRvZXNuJ3QgdHJlYXQgc3BhcnNlIGFycmF5cyBhcyBkZW5zZS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICAgKi9cbiAgZnVuY3Rpb24gYmFzZUtleXMob2JqZWN0KSB7XG4gICAgaWYgKCFpc1Byb3RvdHlwZShvYmplY3QpKSB7XG4gICAgICByZXR1cm4gbmF0aXZlS2V5cyhvYmplY3QpO1xuICAgIH1cbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIE9iamVjdChvYmplY3QpKSB7XG4gICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkgJiYga2V5ICE9ICdjb25zdHJ1Y3RvcicpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBiYXNlS2V5cztcbiAgXG4gIH0se1wiLi9faXNQcm90b3R5cGVcIjo1NSxcIi4vX25hdGl2ZUtleXNcIjo2OH1dLDM1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgLyoqXG4gICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnRpbWVzYCB3aXRob3V0IHN1cHBvcnQgZm9yIGl0ZXJhdGVlIHNob3J0aGFuZHNcbiAgICogb3IgbWF4IGFycmF5IGxlbmd0aCBjaGVja3MuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBuIFRoZSBudW1iZXIgb2YgdGltZXMgdG8gaW52b2tlIGBpdGVyYXRlZWAuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcmVzdWx0cy5cbiAgICovXG4gIGZ1bmN0aW9uIGJhc2VUaW1lcyhuLCBpdGVyYXRlZSkge1xuICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICByZXN1bHQgPSBBcnJheShuKTtcbiAgXG4gICAgd2hpbGUgKCsraW5kZXggPCBuKSB7XG4gICAgICByZXN1bHRbaW5kZXhdID0gaXRlcmF0ZWUoaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGJhc2VUaW1lcztcbiAgXG4gIH0se31dLDM2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIFN5bWJvbCA9IHJlcXVpcmUoJy4vX1N5bWJvbCcpLFxuICAgICAgYXJyYXlNYXAgPSByZXF1aXJlKCcuL19hcnJheU1hcCcpLFxuICAgICAgaXNBcnJheSA9IHJlcXVpcmUoJy4vaXNBcnJheScpLFxuICAgICAgaXNTeW1ib2wgPSByZXF1aXJlKCcuL2lzU3ltYm9sJyk7XG4gIFxuICAvKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbiAgdmFyIElORklOSVRZID0gMSAvIDA7XG4gIFxuICAvKiogVXNlZCB0byBjb252ZXJ0IHN5bWJvbHMgdG8gcHJpbWl0aXZlcyBhbmQgc3RyaW5ncy4gKi9cbiAgdmFyIHN5bWJvbFByb3RvID0gU3ltYm9sID8gU3ltYm9sLnByb3RvdHlwZSA6IHVuZGVmaW5lZCxcbiAgICAgIHN5bWJvbFRvU3RyaW5nID0gc3ltYm9sUHJvdG8gPyBzeW1ib2xQcm90by50b1N0cmluZyA6IHVuZGVmaW5lZDtcbiAgXG4gIC8qKlxuICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy50b1N0cmluZ2Agd2hpY2ggZG9lc24ndCBjb252ZXJ0IG51bGxpc2hcbiAgICogdmFsdWVzIHRvIGVtcHR5IHN0cmluZ3MuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHN0cmluZy5cbiAgICovXG4gIGZ1bmN0aW9uIGJhc2VUb1N0cmluZyh2YWx1ZSkge1xuICAgIC8vIEV4aXQgZWFybHkgZm9yIHN0cmluZ3MgdG8gYXZvaWQgYSBwZXJmb3JtYW5jZSBoaXQgaW4gc29tZSBlbnZpcm9ubWVudHMuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbnZlcnQgdmFsdWVzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgICByZXR1cm4gYXJyYXlNYXAodmFsdWUsIGJhc2VUb1N0cmluZykgKyAnJztcbiAgICB9XG4gICAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHN5bWJvbFRvU3RyaW5nID8gc3ltYm9sVG9TdHJpbmcuY2FsbCh2YWx1ZSkgOiAnJztcbiAgICB9XG4gICAgdmFyIHJlc3VsdCA9ICh2YWx1ZSArICcnKTtcbiAgICByZXR1cm4gKHJlc3VsdCA9PSAnMCcgJiYgKDEgLyB2YWx1ZSkgPT0gLUlORklOSVRZKSA/ICctMCcgOiByZXN1bHQ7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gYmFzZVRvU3RyaW5nO1xuICBcbiAgfSx7XCIuL19TeW1ib2xcIjoyNSxcIi4vX2FycmF5TWFwXCI6MjcsXCIuL2lzQXJyYXlcIjo3OSxcIi4vaXNTeW1ib2xcIjo5MH1dLDM3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgLyoqXG4gICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnVuYXJ5YCB3aXRob3V0IHN1cHBvcnQgZm9yIHN0b3JpbmcgbWV0YWRhdGEuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhcCBhcmd1bWVudHMgZm9yLlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBjYXBwZWQgZnVuY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBiYXNlVW5hcnkoZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZ1bmModmFsdWUpO1xuICAgIH07XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gYmFzZVVuYXJ5O1xuICBcbiAgfSx7fV0sMzg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgaXNBcnJheSA9IHJlcXVpcmUoJy4vaXNBcnJheScpLFxuICAgICAgaXNLZXkgPSByZXF1aXJlKCcuL19pc0tleScpLFxuICAgICAgc3RyaW5nVG9QYXRoID0gcmVxdWlyZSgnLi9fc3RyaW5nVG9QYXRoJyksXG4gICAgICB0b1N0cmluZyA9IHJlcXVpcmUoJy4vdG9TdHJpbmcnKTtcbiAgXG4gIC8qKlxuICAgKiBDYXN0cyBgdmFsdWVgIHRvIGEgcGF0aCBhcnJheSBpZiBpdCdzIG5vdCBvbmUuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGluc3BlY3QuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb2JqZWN0XSBUaGUgb2JqZWN0IHRvIHF1ZXJ5IGtleXMgb24uXG4gICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY2FzdCBwcm9wZXJ0eSBwYXRoIGFycmF5LlxuICAgKi9cbiAgZnVuY3Rpb24gY2FzdFBhdGgodmFsdWUsIG9iamVjdCkge1xuICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gaXNLZXkodmFsdWUsIG9iamVjdCkgPyBbdmFsdWVdIDogc3RyaW5nVG9QYXRoKHRvU3RyaW5nKHZhbHVlKSk7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gY2FzdFBhdGg7XG4gIFxuICB9LHtcIi4vX2lzS2V5XCI6NTIsXCIuL19zdHJpbmdUb1BhdGhcIjo3MyxcIi4vaXNBcnJheVwiOjc5LFwiLi90b1N0cmluZ1wiOjk1fV0sMzk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcbiAgXG4gIC8qKiBVc2VkIHRvIGRldGVjdCBvdmVycmVhY2hpbmcgY29yZS1qcyBzaGltcy4gKi9cbiAgdmFyIGNvcmVKc0RhdGEgPSByb290WydfX2NvcmUtanNfc2hhcmVkX18nXTtcbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gY29yZUpzRGF0YTtcbiAgXG4gIH0se1wiLi9fcm9vdFwiOjcyfV0sNDA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICAoZnVuY3Rpb24gKGdsb2JhbCl7XG4gIC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZ2xvYmFsYCBmcm9tIE5vZGUuanMuICovXG4gIHZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gZnJlZUdsb2JhbDtcbiAgXG4gIH0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuICB9LHt9XSw0MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBpc0tleWFibGUgPSByZXF1aXJlKCcuL19pc0tleWFibGUnKTtcbiAgXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkYXRhIGZvciBgbWFwYC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG1hcCBUaGUgbWFwIHRvIHF1ZXJ5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSByZWZlcmVuY2Uga2V5LlxuICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgbWFwIGRhdGEuXG4gICAqL1xuICBmdW5jdGlvbiBnZXRNYXBEYXRhKG1hcCwga2V5KSB7XG4gICAgdmFyIGRhdGEgPSBtYXAuX19kYXRhX187XG4gICAgcmV0dXJuIGlzS2V5YWJsZShrZXkpXG4gICAgICA/IGRhdGFbdHlwZW9mIGtleSA9PSAnc3RyaW5nJyA/ICdzdHJpbmcnIDogJ2hhc2gnXVxuICAgICAgOiBkYXRhLm1hcDtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBnZXRNYXBEYXRhO1xuICBcbiAgfSx7XCIuL19pc0tleWFibGVcIjo1M31dLDQyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGJhc2VJc05hdGl2ZSA9IHJlcXVpcmUoJy4vX2Jhc2VJc05hdGl2ZScpLFxuICAgICAgZ2V0VmFsdWUgPSByZXF1aXJlKCcuL19nZXRWYWx1ZScpO1xuICBcbiAgLyoqXG4gICAqIEdldHMgdGhlIG5hdGl2ZSBmdW5jdGlvbiBhdCBga2V5YCBvZiBgb2JqZWN0YC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIG1ldGhvZCB0byBnZXQuXG4gICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBmdW5jdGlvbiBpZiBpdCdzIG5hdGl2ZSwgZWxzZSBgdW5kZWZpbmVkYC5cbiAgICovXG4gIGZ1bmN0aW9uIGdldE5hdGl2ZShvYmplY3QsIGtleSkge1xuICAgIHZhciB2YWx1ZSA9IGdldFZhbHVlKG9iamVjdCwga2V5KTtcbiAgICByZXR1cm4gYmFzZUlzTmF0aXZlKHZhbHVlKSA/IHZhbHVlIDogdW5kZWZpbmVkO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGdldE5hdGl2ZTtcbiAgXG4gIH0se1wiLi9fYmFzZUlzTmF0aXZlXCI6MzIsXCIuL19nZXRWYWx1ZVwiOjQ1fV0sNDM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgb3ZlckFyZyA9IHJlcXVpcmUoJy4vX292ZXJBcmcnKTtcbiAgXG4gIC8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xuICB2YXIgZ2V0UHJvdG90eXBlID0gb3ZlckFyZyhPYmplY3QuZ2V0UHJvdG90eXBlT2YsIE9iamVjdCk7XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGdldFByb3RvdHlwZTtcbiAgXG4gIH0se1wiLi9fb3ZlckFyZ1wiOjcxfV0sNDQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgU3ltYm9sID0gcmVxdWlyZSgnLi9fU3ltYm9sJyk7XG4gIFxuICAvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG4gIHZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG4gIFxuICAvKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbiAgdmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG4gIFxuICAvKipcbiAgICogVXNlZCB0byByZXNvbHZlIHRoZVxuICAgKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAgICogb2YgdmFsdWVzLlxuICAgKi9cbiAgdmFyIG5hdGl2ZU9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG4gIFxuICAvKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIHN5bVRvU3RyaW5nVGFnID0gU3ltYm9sID8gU3ltYm9sLnRvU3RyaW5nVGFnIDogdW5kZWZpbmVkO1xuICBcbiAgLyoqXG4gICAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUdldFRhZ2Agd2hpY2ggaWdub3JlcyBgU3ltYm9sLnRvU3RyaW5nVGFnYCB2YWx1ZXMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHF1ZXJ5LlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSByYXcgYHRvU3RyaW5nVGFnYC5cbiAgICovXG4gIGZ1bmN0aW9uIGdldFJhd1RhZyh2YWx1ZSkge1xuICAgIHZhciBpc093biA9IGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIHN5bVRvU3RyaW5nVGFnKSxcbiAgICAgICAgdGFnID0gdmFsdWVbc3ltVG9TdHJpbmdUYWddO1xuICBcbiAgICB0cnkge1xuICAgICAgdmFsdWVbc3ltVG9TdHJpbmdUYWddID0gdW5kZWZpbmVkO1xuICAgICAgdmFyIHVubWFza2VkID0gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICBcbiAgICB2YXIgcmVzdWx0ID0gbmF0aXZlT2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gICAgaWYgKHVubWFza2VkKSB7XG4gICAgICBpZiAoaXNPd24pIHtcbiAgICAgICAgdmFsdWVbc3ltVG9TdHJpbmdUYWddID0gdGFnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsZXRlIHZhbHVlW3N5bVRvU3RyaW5nVGFnXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBnZXRSYXdUYWc7XG4gIFxuICB9LHtcIi4vX1N5bWJvbFwiOjI1fV0sNDU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICAvKipcbiAgICogR2V0cyB0aGUgdmFsdWUgYXQgYGtleWAgb2YgYG9iamVjdGAuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb2JqZWN0XSBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHByb3BlcnR5IHZhbHVlLlxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0VmFsdWUob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBnZXRWYWx1ZTtcbiAgXG4gIH0se31dLDQ2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIG5hdGl2ZUNyZWF0ZSA9IHJlcXVpcmUoJy4vX25hdGl2ZUNyZWF0ZScpO1xuICBcbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGtleS12YWx1ZSBlbnRyaWVzIGZyb20gdGhlIGhhc2guXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBuYW1lIGNsZWFyXG4gICAqIEBtZW1iZXJPZiBIYXNoXG4gICAqL1xuICBmdW5jdGlvbiBoYXNoQ2xlYXIoKSB7XG4gICAgdGhpcy5fX2RhdGFfXyA9IG5hdGl2ZUNyZWF0ZSA/IG5hdGl2ZUNyZWF0ZShudWxsKSA6IHt9O1xuICAgIHRoaXMuc2l6ZSA9IDA7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gaGFzaENsZWFyO1xuICBcbiAgfSx7XCIuL19uYXRpdmVDcmVhdGVcIjo2N31dLDQ3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgLyoqXG4gICAqIFJlbW92ZXMgYGtleWAgYW5kIGl0cyB2YWx1ZSBmcm9tIHRoZSBoYXNoLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbmFtZSBkZWxldGVcbiAgICogQG1lbWJlck9mIEhhc2hcbiAgICogQHBhcmFtIHtPYmplY3R9IGhhc2ggVGhlIGhhc2ggdG8gbW9kaWZ5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHJlbW92ZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBlbnRyeSB3YXMgcmVtb3ZlZCwgZWxzZSBgZmFsc2VgLlxuICAgKi9cbiAgZnVuY3Rpb24gaGFzaERlbGV0ZShrZXkpIHtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5oYXMoa2V5KSAmJiBkZWxldGUgdGhpcy5fX2RhdGFfX1trZXldO1xuICAgIHRoaXMuc2l6ZSAtPSByZXN1bHQgPyAxIDogMDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGhhc2hEZWxldGU7XG4gIFxuICB9LHt9XSw0ODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBuYXRpdmVDcmVhdGUgPSByZXF1aXJlKCcuL19uYXRpdmVDcmVhdGUnKTtcbiAgXG4gIC8qKiBVc2VkIHRvIHN0YW5kLWluIGZvciBgdW5kZWZpbmVkYCBoYXNoIHZhbHVlcy4gKi9cbiAgdmFyIEhBU0hfVU5ERUZJTkVEID0gJ19fbG9kYXNoX2hhc2hfdW5kZWZpbmVkX18nO1xuICBcbiAgLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xuICB2YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuICBcbiAgLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuICBcbiAgLyoqXG4gICAqIEdldHMgdGhlIGhhc2ggdmFsdWUgZm9yIGBrZXlgLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbmFtZSBnZXRcbiAgICogQG1lbWJlck9mIEhhc2hcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBnZXQuXG4gICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBlbnRyeSB2YWx1ZS5cbiAgICovXG4gIGZ1bmN0aW9uIGhhc2hHZXQoa2V5KSB7XG4gICAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICAgIGlmIChuYXRpdmVDcmVhdGUpIHtcbiAgICAgIHZhciByZXN1bHQgPSBkYXRhW2tleV07XG4gICAgICByZXR1cm4gcmVzdWx0ID09PSBIQVNIX1VOREVGSU5FRCA/IHVuZGVmaW5lZCA6IHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwoZGF0YSwga2V5KSA/IGRhdGFba2V5XSA6IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBoYXNoR2V0O1xuICBcbiAgfSx7XCIuL19uYXRpdmVDcmVhdGVcIjo2N31dLDQ5OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIG5hdGl2ZUNyZWF0ZSA9IHJlcXVpcmUoJy4vX25hdGl2ZUNyZWF0ZScpO1xuICBcbiAgLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xuICB2YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuICBcbiAgLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuICBcbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGhhc2ggdmFsdWUgZm9yIGBrZXlgIGV4aXN0cy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQG5hbWUgaGFzXG4gICAqIEBtZW1iZXJPZiBIYXNoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgZW50cnkgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gICAqL1xuICBmdW5jdGlvbiBoYXNoSGFzKGtleSkge1xuICAgIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXztcbiAgICByZXR1cm4gbmF0aXZlQ3JlYXRlID8gKGRhdGFba2V5XSAhPT0gdW5kZWZpbmVkKSA6IGhhc093blByb3BlcnR5LmNhbGwoZGF0YSwga2V5KTtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBoYXNoSGFzO1xuICBcbiAgfSx7XCIuL19uYXRpdmVDcmVhdGVcIjo2N31dLDUwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIG5hdGl2ZUNyZWF0ZSA9IHJlcXVpcmUoJy4vX25hdGl2ZUNyZWF0ZScpO1xuICBcbiAgLyoqIFVzZWQgdG8gc3RhbmQtaW4gZm9yIGB1bmRlZmluZWRgIGhhc2ggdmFsdWVzLiAqL1xuICB2YXIgSEFTSF9VTkRFRklORUQgPSAnX19sb2Rhc2hfaGFzaF91bmRlZmluZWRfXyc7XG4gIFxuICAvKipcbiAgICogU2V0cyB0aGUgaGFzaCBga2V5YCB0byBgdmFsdWVgLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbmFtZSBzZXRcbiAgICogQG1lbWJlck9mIEhhc2hcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgaGFzaCBpbnN0YW5jZS5cbiAgICovXG4gIGZ1bmN0aW9uIGhhc2hTZXQoa2V5LCB2YWx1ZSkge1xuICAgIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXztcbiAgICB0aGlzLnNpemUgKz0gdGhpcy5oYXMoa2V5KSA/IDAgOiAxO1xuICAgIGRhdGFba2V5XSA9IChuYXRpdmVDcmVhdGUgJiYgdmFsdWUgPT09IHVuZGVmaW5lZCkgPyBIQVNIX1VOREVGSU5FRCA6IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGhhc2hTZXQ7XG4gIFxuICB9LHtcIi4vX25hdGl2ZUNyZWF0ZVwiOjY3fV0sNTE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICAvKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbiAgdmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuICBcbiAgLyoqIFVzZWQgdG8gZGV0ZWN0IHVuc2lnbmVkIGludGVnZXIgdmFsdWVzLiAqL1xuICB2YXIgcmVJc1VpbnQgPSAvXig/OjB8WzEtOV1cXGQqKSQvO1xuICBcbiAgLyoqXG4gICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBpbmRleC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbGVuZ3RoPU1BWF9TQUZFX0lOVEVHRVJdIFRoZSB1cHBlciBib3VuZHMgb2YgYSB2YWxpZCBpbmRleC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBpbmRleCwgZWxzZSBgZmFsc2VgLlxuICAgKi9cbiAgZnVuY3Rpb24gaXNJbmRleCh2YWx1ZSwgbGVuZ3RoKSB7XG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gICAgbGVuZ3RoID0gbGVuZ3RoID09IG51bGwgPyBNQVhfU0FGRV9JTlRFR0VSIDogbGVuZ3RoO1xuICBcbiAgICByZXR1cm4gISFsZW5ndGggJiZcbiAgICAgICh0eXBlID09ICdudW1iZXInIHx8XG4gICAgICAgICh0eXBlICE9ICdzeW1ib2wnICYmIHJlSXNVaW50LnRlc3QodmFsdWUpKSkgJiZcbiAgICAgICAgICAodmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8IGxlbmd0aCk7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gaXNJbmRleDtcbiAgXG4gIH0se31dLDUyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGlzQXJyYXkgPSByZXF1aXJlKCcuL2lzQXJyYXknKSxcbiAgICAgIGlzU3ltYm9sID0gcmVxdWlyZSgnLi9pc1N5bWJvbCcpO1xuICBcbiAgLyoqIFVzZWQgdG8gbWF0Y2ggcHJvcGVydHkgbmFtZXMgd2l0aGluIHByb3BlcnR5IHBhdGhzLiAqL1xuICB2YXIgcmVJc0RlZXBQcm9wID0gL1xcLnxcXFsoPzpbXltcXF1dKnwoW1wiJ10pKD86KD8hXFwxKVteXFxcXF18XFxcXC4pKj9cXDEpXFxdLyxcbiAgICAgIHJlSXNQbGFpblByb3AgPSAvXlxcdyokLztcbiAgXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHByb3BlcnR5IG5hbWUgYW5kIG5vdCBhIHByb3BlcnR5IHBhdGguXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29iamVjdF0gVGhlIG9iamVjdCB0byBxdWVyeSBrZXlzIG9uLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHByb3BlcnR5IG5hbWUsIGVsc2UgYGZhbHNlYC5cbiAgICovXG4gIGZ1bmN0aW9uIGlzS2V5KHZhbHVlLCBvYmplY3QpIHtcbiAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gICAgaWYgKHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAnc3ltYm9sJyB8fCB0eXBlID09ICdib29sZWFuJyB8fFxuICAgICAgICB2YWx1ZSA9PSBudWxsIHx8IGlzU3ltYm9sKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZUlzUGxhaW5Qcm9wLnRlc3QodmFsdWUpIHx8ICFyZUlzRGVlcFByb3AudGVzdCh2YWx1ZSkgfHxcbiAgICAgIChvYmplY3QgIT0gbnVsbCAmJiB2YWx1ZSBpbiBPYmplY3Qob2JqZWN0KSk7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gaXNLZXk7XG4gIFxuICB9LHtcIi4vaXNBcnJheVwiOjc5LFwiLi9pc1N5bWJvbFwiOjkwfV0sNTM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgc3VpdGFibGUgZm9yIHVzZSBhcyB1bmlxdWUgb2JqZWN0IGtleS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIHN1aXRhYmxlLCBlbHNlIGBmYWxzZWAuXG4gICAqL1xuICBmdW5jdGlvbiBpc0tleWFibGUodmFsdWUpIHtcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgICByZXR1cm4gKHR5cGUgPT0gJ3N0cmluZycgfHwgdHlwZSA9PSAnbnVtYmVyJyB8fCB0eXBlID09ICdzeW1ib2wnIHx8IHR5cGUgPT0gJ2Jvb2xlYW4nKVxuICAgICAgPyAodmFsdWUgIT09ICdfX3Byb3RvX18nKVxuICAgICAgOiAodmFsdWUgPT09IG51bGwpO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGlzS2V5YWJsZTtcbiAgXG4gIH0se31dLDU0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGNvcmVKc0RhdGEgPSByZXF1aXJlKCcuL19jb3JlSnNEYXRhJyk7XG4gIFxuICAvKiogVXNlZCB0byBkZXRlY3QgbWV0aG9kcyBtYXNxdWVyYWRpbmcgYXMgbmF0aXZlLiAqL1xuICB2YXIgbWFza1NyY0tleSA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgdWlkID0gL1teLl0rJC8uZXhlYyhjb3JlSnNEYXRhICYmIGNvcmVKc0RhdGEua2V5cyAmJiBjb3JlSnNEYXRhLmtleXMuSUVfUFJPVE8gfHwgJycpO1xuICAgIHJldHVybiB1aWQgPyAoJ1N5bWJvbChzcmMpXzEuJyArIHVpZCkgOiAnJztcbiAgfSgpKTtcbiAgXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYGZ1bmNgIGhhcyBpdHMgc291cmNlIG1hc2tlZC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgZnVuY2AgaXMgbWFza2VkLCBlbHNlIGBmYWxzZWAuXG4gICAqL1xuICBmdW5jdGlvbiBpc01hc2tlZChmdW5jKSB7XG4gICAgcmV0dXJuICEhbWFza1NyY0tleSAmJiAobWFza1NyY0tleSBpbiBmdW5jKTtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBpc01hc2tlZDtcbiAgXG4gIH0se1wiLi9fY29yZUpzRGF0YVwiOjM5fV0sNTU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICAvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG4gIHZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG4gIFxuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgbGlrZWx5IGEgcHJvdG90eXBlIG9iamVjdC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgcHJvdG90eXBlLCBlbHNlIGBmYWxzZWAuXG4gICAqL1xuICBmdW5jdGlvbiBpc1Byb3RvdHlwZSh2YWx1ZSkge1xuICAgIHZhciBDdG9yID0gdmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IsXG4gICAgICAgIHByb3RvID0gKHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiYgQ3Rvci5wcm90b3R5cGUpIHx8IG9iamVjdFByb3RvO1xuICBcbiAgICByZXR1cm4gdmFsdWUgPT09IHByb3RvO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGlzUHJvdG90eXBlO1xuICBcbiAgfSx7fV0sNTY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICAvKipcbiAgICogUmVtb3ZlcyBhbGwga2V5LXZhbHVlIGVudHJpZXMgZnJvbSB0aGUgbGlzdCBjYWNoZS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQG5hbWUgY2xlYXJcbiAgICogQG1lbWJlck9mIExpc3RDYWNoZVxuICAgKi9cbiAgZnVuY3Rpb24gbGlzdENhY2hlQ2xlYXIoKSB7XG4gICAgdGhpcy5fX2RhdGFfXyA9IFtdO1xuICAgIHRoaXMuc2l6ZSA9IDA7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gbGlzdENhY2hlQ2xlYXI7XG4gIFxuICB9LHt9XSw1NzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBhc3NvY0luZGV4T2YgPSByZXF1aXJlKCcuL19hc3NvY0luZGV4T2YnKTtcbiAgXG4gIC8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIGFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGU7XG4gIFxuICAvKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIHNwbGljZSA9IGFycmF5UHJvdG8uc3BsaWNlO1xuICBcbiAgLyoqXG4gICAqIFJlbW92ZXMgYGtleWAgYW5kIGl0cyB2YWx1ZSBmcm9tIHRoZSBsaXN0IGNhY2hlLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbmFtZSBkZWxldGVcbiAgICogQG1lbWJlck9mIExpc3RDYWNoZVxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHJlbW92ZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBlbnRyeSB3YXMgcmVtb3ZlZCwgZWxzZSBgZmFsc2VgLlxuICAgKi9cbiAgZnVuY3Rpb24gbGlzdENhY2hlRGVsZXRlKGtleSkge1xuICAgIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXyxcbiAgICAgICAgaW5kZXggPSBhc3NvY0luZGV4T2YoZGF0YSwga2V5KTtcbiAgXG4gICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgbGFzdEluZGV4ID0gZGF0YS5sZW5ndGggLSAxO1xuICAgIGlmIChpbmRleCA9PSBsYXN0SW5kZXgpIHtcbiAgICAgIGRhdGEucG9wKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNwbGljZS5jYWxsKGRhdGEsIGluZGV4LCAxKTtcbiAgICB9XG4gICAgLS10aGlzLnNpemU7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gbGlzdENhY2hlRGVsZXRlO1xuICBcbiAgfSx7XCIuL19hc3NvY0luZGV4T2ZcIjoyOH1dLDU4OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGFzc29jSW5kZXhPZiA9IHJlcXVpcmUoJy4vX2Fzc29jSW5kZXhPZicpO1xuICBcbiAgLyoqXG4gICAqIEdldHMgdGhlIGxpc3QgY2FjaGUgdmFsdWUgZm9yIGBrZXlgLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbmFtZSBnZXRcbiAgICogQG1lbWJlck9mIExpc3RDYWNoZVxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIGdldC5cbiAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGVudHJ5IHZhbHVlLlxuICAgKi9cbiAgZnVuY3Rpb24gbGlzdENhY2hlR2V0KGtleSkge1xuICAgIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXyxcbiAgICAgICAgaW5kZXggPSBhc3NvY0luZGV4T2YoZGF0YSwga2V5KTtcbiAgXG4gICAgcmV0dXJuIGluZGV4IDwgMCA/IHVuZGVmaW5lZCA6IGRhdGFbaW5kZXhdWzFdO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGxpc3RDYWNoZUdldDtcbiAgXG4gIH0se1wiLi9fYXNzb2NJbmRleE9mXCI6Mjh9XSw1OTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBhc3NvY0luZGV4T2YgPSByZXF1aXJlKCcuL19hc3NvY0luZGV4T2YnKTtcbiAgXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBsaXN0IGNhY2hlIHZhbHVlIGZvciBga2V5YCBleGlzdHMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBuYW1lIGhhc1xuICAgKiBAbWVtYmVyT2YgTGlzdENhY2hlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgZW50cnkgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gICAqL1xuICBmdW5jdGlvbiBsaXN0Q2FjaGVIYXMoa2V5KSB7XG4gICAgcmV0dXJuIGFzc29jSW5kZXhPZih0aGlzLl9fZGF0YV9fLCBrZXkpID4gLTE7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gbGlzdENhY2hlSGFzO1xuICBcbiAgfSx7XCIuL19hc3NvY0luZGV4T2ZcIjoyOH1dLDYwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGFzc29jSW5kZXhPZiA9IHJlcXVpcmUoJy4vX2Fzc29jSW5kZXhPZicpO1xuICBcbiAgLyoqXG4gICAqIFNldHMgdGhlIGxpc3QgY2FjaGUgYGtleWAgdG8gYHZhbHVlYC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQG5hbWUgc2V0XG4gICAqIEBtZW1iZXJPZiBMaXN0Q2FjaGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbGlzdCBjYWNoZSBpbnN0YW5jZS5cbiAgICovXG4gIGZ1bmN0aW9uIGxpc3RDYWNoZVNldChrZXksIHZhbHVlKSB7XG4gICAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fLFxuICAgICAgICBpbmRleCA9IGFzc29jSW5kZXhPZihkYXRhLCBrZXkpO1xuICBcbiAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICArK3RoaXMuc2l6ZTtcbiAgICAgIGRhdGEucHVzaChba2V5LCB2YWx1ZV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBkYXRhW2luZGV4XVsxXSA9IHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBsaXN0Q2FjaGVTZXQ7XG4gIFxuICB9LHtcIi4vX2Fzc29jSW5kZXhPZlwiOjI4fV0sNjE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgSGFzaCA9IHJlcXVpcmUoJy4vX0hhc2gnKSxcbiAgICAgIExpc3RDYWNoZSA9IHJlcXVpcmUoJy4vX0xpc3RDYWNoZScpLFxuICAgICAgTWFwID0gcmVxdWlyZSgnLi9fTWFwJyk7XG4gIFxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwga2V5LXZhbHVlIGVudHJpZXMgZnJvbSB0aGUgbWFwLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbmFtZSBjbGVhclxuICAgKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAgICovXG4gIGZ1bmN0aW9uIG1hcENhY2hlQ2xlYXIoKSB7XG4gICAgdGhpcy5zaXplID0gMDtcbiAgICB0aGlzLl9fZGF0YV9fID0ge1xuICAgICAgJ2hhc2gnOiBuZXcgSGFzaCxcbiAgICAgICdtYXAnOiBuZXcgKE1hcCB8fCBMaXN0Q2FjaGUpLFxuICAgICAgJ3N0cmluZyc6IG5ldyBIYXNoXG4gICAgfTtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBtYXBDYWNoZUNsZWFyO1xuICBcbiAgfSx7XCIuL19IYXNoXCI6MjEsXCIuL19MaXN0Q2FjaGVcIjoyMixcIi4vX01hcFwiOjIzfV0sNjI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgZ2V0TWFwRGF0YSA9IHJlcXVpcmUoJy4vX2dldE1hcERhdGEnKTtcbiAgXG4gIC8qKlxuICAgKiBSZW1vdmVzIGBrZXlgIGFuZCBpdHMgdmFsdWUgZnJvbSB0aGUgbWFwLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbmFtZSBkZWxldGVcbiAgICogQG1lbWJlck9mIE1hcENhY2hlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGVudHJ5IHdhcyByZW1vdmVkLCBlbHNlIGBmYWxzZWAuXG4gICAqL1xuICBmdW5jdGlvbiBtYXBDYWNoZURlbGV0ZShrZXkpIHtcbiAgICB2YXIgcmVzdWx0ID0gZ2V0TWFwRGF0YSh0aGlzLCBrZXkpWydkZWxldGUnXShrZXkpO1xuICAgIHRoaXMuc2l6ZSAtPSByZXN1bHQgPyAxIDogMDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IG1hcENhY2hlRGVsZXRlO1xuICBcbiAgfSx7XCIuL19nZXRNYXBEYXRhXCI6NDF9XSw2MzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBnZXRNYXBEYXRhID0gcmVxdWlyZSgnLi9fZ2V0TWFwRGF0YScpO1xuICBcbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hcCB2YWx1ZSBmb3IgYGtleWAuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBuYW1lIGdldFxuICAgKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBnZXQuXG4gICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBlbnRyeSB2YWx1ZS5cbiAgICovXG4gIGZ1bmN0aW9uIG1hcENhY2hlR2V0KGtleSkge1xuICAgIHJldHVybiBnZXRNYXBEYXRhKHRoaXMsIGtleSkuZ2V0KGtleSk7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gbWFwQ2FjaGVHZXQ7XG4gIFxuICB9LHtcIi4vX2dldE1hcERhdGFcIjo0MX1dLDY0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGdldE1hcERhdGEgPSByZXF1aXJlKCcuL19nZXRNYXBEYXRhJyk7XG4gIFxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgbWFwIHZhbHVlIGZvciBga2V5YCBleGlzdHMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBuYW1lIGhhc1xuICAgKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbnRyeSB0byBjaGVjay5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGFuIGVudHJ5IGZvciBga2V5YCBleGlzdHMsIGVsc2UgYGZhbHNlYC5cbiAgICovXG4gIGZ1bmN0aW9uIG1hcENhY2hlSGFzKGtleSkge1xuICAgIHJldHVybiBnZXRNYXBEYXRhKHRoaXMsIGtleSkuaGFzKGtleSk7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gbWFwQ2FjaGVIYXM7XG4gIFxuICB9LHtcIi4vX2dldE1hcERhdGFcIjo0MX1dLDY1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGdldE1hcERhdGEgPSByZXF1aXJlKCcuL19nZXRNYXBEYXRhJyk7XG4gIFxuICAvKipcbiAgICogU2V0cyB0aGUgbWFwIGBrZXlgIHRvIGB2YWx1ZWAuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBuYW1lIHNldFxuICAgKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbWFwIGNhY2hlIGluc3RhbmNlLlxuICAgKi9cbiAgZnVuY3Rpb24gbWFwQ2FjaGVTZXQoa2V5LCB2YWx1ZSkge1xuICAgIHZhciBkYXRhID0gZ2V0TWFwRGF0YSh0aGlzLCBrZXkpLFxuICAgICAgICBzaXplID0gZGF0YS5zaXplO1xuICBcbiAgICBkYXRhLnNldChrZXksIHZhbHVlKTtcbiAgICB0aGlzLnNpemUgKz0gZGF0YS5zaXplID09IHNpemUgPyAwIDogMTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBtYXBDYWNoZVNldDtcbiAgXG4gIH0se1wiLi9fZ2V0TWFwRGF0YVwiOjQxfV0sNjY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgbWVtb2l6ZSA9IHJlcXVpcmUoJy4vbWVtb2l6ZScpO1xuICBcbiAgLyoqIFVzZWQgYXMgdGhlIG1heGltdW0gbWVtb2l6ZSBjYWNoZSBzaXplLiAqL1xuICB2YXIgTUFYX01FTU9JWkVfU0laRSA9IDUwMDtcbiAgXG4gIC8qKlxuICAgKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8ubWVtb2l6ZWAgd2hpY2ggY2xlYXJzIHRoZSBtZW1vaXplZCBmdW5jdGlvbidzXG4gICAqIGNhY2hlIHdoZW4gaXQgZXhjZWVkcyBgTUFYX01FTU9JWkVfU0laRWAuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGhhdmUgaXRzIG91dHB1dCBtZW1vaXplZC5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgbWVtb2l6ZWQgZnVuY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBtZW1vaXplQ2FwcGVkKGZ1bmMpIHtcbiAgICB2YXIgcmVzdWx0ID0gbWVtb2l6ZShmdW5jLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChjYWNoZS5zaXplID09PSBNQVhfTUVNT0laRV9TSVpFKSB7XG4gICAgICAgIGNhY2hlLmNsZWFyKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4ga2V5O1xuICAgIH0pO1xuICBcbiAgICB2YXIgY2FjaGUgPSByZXN1bHQuY2FjaGU7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBtZW1vaXplQ2FwcGVkO1xuICBcbiAgfSx7XCIuL21lbW9pemVcIjo5M31dLDY3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGdldE5hdGl2ZSA9IHJlcXVpcmUoJy4vX2dldE5hdGl2ZScpO1xuICBcbiAgLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgdGhhdCBhcmUgdmVyaWZpZWQgdG8gYmUgbmF0aXZlLiAqL1xuICB2YXIgbmF0aXZlQ3JlYXRlID0gZ2V0TmF0aXZlKE9iamVjdCwgJ2NyZWF0ZScpO1xuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBuYXRpdmVDcmVhdGU7XG4gIFxuICB9LHtcIi4vX2dldE5hdGl2ZVwiOjQyfV0sNjg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgb3ZlckFyZyA9IHJlcXVpcmUoJy4vX292ZXJBcmcnKTtcbiAgXG4gIC8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbiAgdmFyIG5hdGl2ZUtleXMgPSBvdmVyQXJnKE9iamVjdC5rZXlzLCBPYmplY3QpO1xuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBuYXRpdmVLZXlzO1xuICBcbiAgfSx7XCIuL19vdmVyQXJnXCI6NzF9XSw2OTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBmcmVlR2xvYmFsID0gcmVxdWlyZSgnLi9fZnJlZUdsb2JhbCcpO1xuICBcbiAgLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBleHBvcnRzYC4gKi9cbiAgdmFyIGZyZWVFeHBvcnRzID0gdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgJiYgZXhwb3J0cyAmJiAhZXhwb3J0cy5ub2RlVHlwZSAmJiBleHBvcnRzO1xuICBcbiAgLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgLiAqL1xuICB2YXIgZnJlZU1vZHVsZSA9IGZyZWVFeHBvcnRzICYmIHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgbW9kdWxlICYmICFtb2R1bGUubm9kZVR5cGUgJiYgbW9kdWxlO1xuICBcbiAgLyoqIERldGVjdCB0aGUgcG9wdWxhciBDb21tb25KUyBleHRlbnNpb24gYG1vZHVsZS5leHBvcnRzYC4gKi9cbiAgdmFyIG1vZHVsZUV4cG9ydHMgPSBmcmVlTW9kdWxlICYmIGZyZWVNb2R1bGUuZXhwb3J0cyA9PT0gZnJlZUV4cG9ydHM7XG4gIFxuICAvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYHByb2Nlc3NgIGZyb20gTm9kZS5qcy4gKi9cbiAgdmFyIGZyZWVQcm9jZXNzID0gbW9kdWxlRXhwb3J0cyAmJiBmcmVlR2xvYmFsLnByb2Nlc3M7XG4gIFxuICAvKiogVXNlZCB0byBhY2Nlc3MgZmFzdGVyIE5vZGUuanMgaGVscGVycy4gKi9cbiAgdmFyIG5vZGVVdGlsID0gKGZ1bmN0aW9uKCkge1xuICAgIHRyeSB7XG4gICAgICAvLyBVc2UgYHV0aWwudHlwZXNgIGZvciBOb2RlLmpzIDEwKy5cbiAgICAgIHZhciB0eXBlcyA9IGZyZWVNb2R1bGUgJiYgZnJlZU1vZHVsZS5yZXF1aXJlICYmIGZyZWVNb2R1bGUucmVxdWlyZSgndXRpbCcpLnR5cGVzO1xuICBcbiAgICAgIGlmICh0eXBlcykge1xuICAgICAgICByZXR1cm4gdHlwZXM7XG4gICAgICB9XG4gIFxuICAgICAgLy8gTGVnYWN5IGBwcm9jZXNzLmJpbmRpbmcoJ3V0aWwnKWAgZm9yIE5vZGUuanMgPCAxMC5cbiAgICAgIHJldHVybiBmcmVlUHJvY2VzcyAmJiBmcmVlUHJvY2Vzcy5iaW5kaW5nICYmIGZyZWVQcm9jZXNzLmJpbmRpbmcoJ3V0aWwnKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICB9KCkpO1xuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBub2RlVXRpbDtcbiAgXG4gIH0se1wiLi9fZnJlZUdsb2JhbFwiOjQwfV0sNzA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICAvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG4gIHZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG4gIFxuICAvKipcbiAgICogVXNlZCB0byByZXNvbHZlIHRoZVxuICAgKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAgICogb2YgdmFsdWVzLlxuICAgKi9cbiAgdmFyIG5hdGl2ZU9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG4gIFxuICAvKipcbiAgICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZyB1c2luZyBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ2AuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGNvbnZlcnRlZCBzdHJpbmcuXG4gICAqL1xuICBmdW5jdGlvbiBvYmplY3RUb1N0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiBuYXRpdmVPYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBvYmplY3RUb1N0cmluZztcbiAgXG4gIH0se31dLDcxOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB1bmFyeSBmdW5jdGlvbiB0aGF0IGludm9rZXMgYGZ1bmNgIHdpdGggaXRzIGFyZ3VtZW50IHRyYW5zZm9ybWVkLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSB0cmFuc2Zvcm0gVGhlIGFyZ3VtZW50IHRyYW5zZm9ybS5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBvdmVyQXJnKGZ1bmMsIHRyYW5zZm9ybSkge1xuICAgIHJldHVybiBmdW5jdGlvbihhcmcpIHtcbiAgICAgIHJldHVybiBmdW5jKHRyYW5zZm9ybShhcmcpKTtcbiAgICB9O1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IG92ZXJBcmc7XG4gIFxuICB9LHt9XSw3MjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBmcmVlR2xvYmFsID0gcmVxdWlyZSgnLi9fZnJlZUdsb2JhbCcpO1xuICBcbiAgLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbiAgdmFyIGZyZWVTZWxmID0gdHlwZW9mIHNlbGYgPT0gJ29iamVjdCcgJiYgc2VsZiAmJiBzZWxmLk9iamVjdCA9PT0gT2JqZWN0ICYmIHNlbGY7XG4gIFxuICAvKiogVXNlZCBhcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdC4gKi9cbiAgdmFyIHJvb3QgPSBmcmVlR2xvYmFsIHx8IGZyZWVTZWxmIHx8IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IHJvb3Q7XG4gIFxuICB9LHtcIi4vX2ZyZWVHbG9iYWxcIjo0MH1dLDczOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIG1lbW9pemVDYXBwZWQgPSByZXF1aXJlKCcuL19tZW1vaXplQ2FwcGVkJyk7XG4gIFxuICAvKiogVXNlZCB0byBtYXRjaCBwcm9wZXJ0eSBuYW1lcyB3aXRoaW4gcHJvcGVydHkgcGF0aHMuICovXG4gIHZhciByZVByb3BOYW1lID0gL1teLltcXF1dK3xcXFsoPzooLT9cXGQrKD86XFwuXFxkKyk/KXwoW1wiJ10pKCg/Oig/IVxcMilbXlxcXFxdfFxcXFwuKSo/KVxcMilcXF18KD89KD86XFwufFxcW1xcXSkoPzpcXC58XFxbXFxdfCQpKS9nO1xuICBcbiAgLyoqIFVzZWQgdG8gbWF0Y2ggYmFja3NsYXNoZXMgaW4gcHJvcGVydHkgcGF0aHMuICovXG4gIHZhciByZUVzY2FwZUNoYXIgPSAvXFxcXChcXFxcKT8vZztcbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBgc3RyaW5nYCB0byBhIHByb3BlcnR5IHBhdGggYXJyYXkuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGhlIHN0cmluZyB0byBjb252ZXJ0LlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIHByb3BlcnR5IHBhdGggYXJyYXkuXG4gICAqL1xuICB2YXIgc3RyaW5nVG9QYXRoID0gbWVtb2l6ZUNhcHBlZChmdW5jdGlvbihzdHJpbmcpIHtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgaWYgKHN0cmluZy5jaGFyQ29kZUF0KDApID09PSA0NiAvKiAuICovKSB7XG4gICAgICByZXN1bHQucHVzaCgnJyk7XG4gICAgfVxuICAgIHN0cmluZy5yZXBsYWNlKHJlUHJvcE5hbWUsIGZ1bmN0aW9uKG1hdGNoLCBudW1iZXIsIHF1b3RlLCBzdWJTdHJpbmcpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHF1b3RlID8gc3ViU3RyaW5nLnJlcGxhY2UocmVFc2NhcGVDaGFyLCAnJDEnKSA6IChudW1iZXIgfHwgbWF0Y2gpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9KTtcbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gc3RyaW5nVG9QYXRoO1xuICBcbiAgfSx7XCIuL19tZW1vaXplQ2FwcGVkXCI6NjZ9XSw3NDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBpc1N5bWJvbCA9IHJlcXVpcmUoJy4vaXNTeW1ib2wnKTtcbiAgXG4gIC8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xuICB2YXIgSU5GSU5JVFkgPSAxIC8gMDtcbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgc3RyaW5nIGtleSBpZiBpdCdzIG5vdCBhIHN0cmluZyBvciBzeW1ib2wuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGluc3BlY3QuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd8c3ltYm9sfSBSZXR1cm5zIHRoZSBrZXkuXG4gICAqL1xuICBmdW5jdGlvbiB0b0tleSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycgfHwgaXNTeW1ib2wodmFsdWUpKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSAodmFsdWUgKyAnJyk7XG4gICAgcmV0dXJuIChyZXN1bHQgPT0gJzAnICYmICgxIC8gdmFsdWUpID09IC1JTkZJTklUWSkgPyAnLTAnIDogcmVzdWx0O1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IHRvS2V5O1xuICBcbiAgfSx7XCIuL2lzU3ltYm9sXCI6OTB9XSw3NTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIC8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIGZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcbiAgXG4gIC8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGRlY29tcGlsZWQgc291cmNlIG9mIGZ1bmN0aW9ucy4gKi9cbiAgdmFyIGZ1bmNUb1N0cmluZyA9IGZ1bmNQcm90by50b1N0cmluZztcbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBgZnVuY2AgdG8gaXRzIHNvdXJjZSBjb2RlLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjb252ZXJ0LlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzb3VyY2UgY29kZS5cbiAgICovXG4gIGZ1bmN0aW9uIHRvU291cmNlKGZ1bmMpIHtcbiAgICBpZiAoZnVuYyAhPSBudWxsKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gZnVuY1RvU3RyaW5nLmNhbGwoZnVuYyk7XG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIChmdW5jICsgJycpO1xuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IHRvU291cmNlO1xuICBcbiAgfSx7fV0sNzY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICAvKipcbiAgICogUGVyZm9ybXMgYVxuICAgKiBbYFNhbWVWYWx1ZVplcm9gXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1zYW1ldmFsdWV6ZXJvKVxuICAgKiBjb21wYXJpc29uIGJldHdlZW4gdHdvIHZhbHVlcyB0byBkZXRlcm1pbmUgaWYgdGhleSBhcmUgZXF1aXZhbGVudC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAc2luY2UgNC4wLjBcbiAgICogQGNhdGVnb3J5IExhbmdcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAgICogQHBhcmFtIHsqfSBvdGhlciBUaGUgb3RoZXIgdmFsdWUgdG8gY29tcGFyZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogdmFyIG9iamVjdCA9IHsgJ2EnOiAxIH07XG4gICAqIHZhciBvdGhlciA9IHsgJ2EnOiAxIH07XG4gICAqXG4gICAqIF8uZXEob2JqZWN0LCBvYmplY3QpO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uZXEob2JqZWN0LCBvdGhlcik7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqXG4gICAqIF8uZXEoJ2EnLCAnYScpO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uZXEoJ2EnLCBPYmplY3QoJ2EnKSk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqXG4gICAqIF8uZXEoTmFOLCBOYU4pO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqL1xuICBmdW5jdGlvbiBlcSh2YWx1ZSwgb3RoZXIpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IG90aGVyIHx8ICh2YWx1ZSAhPT0gdmFsdWUgJiYgb3RoZXIgIT09IG90aGVyKTtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBlcTtcbiAgXG4gIH0se31dLDc3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGJhc2VHZXQgPSByZXF1aXJlKCcuL19iYXNlR2V0Jyk7XG4gIFxuICAvKipcbiAgICogR2V0cyB0aGUgdmFsdWUgYXQgYHBhdGhgIG9mIGBvYmplY3RgLiBJZiB0aGUgcmVzb2x2ZWQgdmFsdWUgaXNcbiAgICogYHVuZGVmaW5lZGAsIHRoZSBgZGVmYXVsdFZhbHVlYCBpcyByZXR1cm5lZCBpbiBpdHMgcGxhY2UuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQHNpbmNlIDMuNy4wXG4gICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgKiBAcGFyYW0ge0FycmF5fHN0cmluZ30gcGF0aCBUaGUgcGF0aCBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICAgKiBAcGFyYW0geyp9IFtkZWZhdWx0VmFsdWVdIFRoZSB2YWx1ZSByZXR1cm5lZCBmb3IgYHVuZGVmaW5lZGAgcmVzb2x2ZWQgdmFsdWVzLlxuICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgcmVzb2x2ZWQgdmFsdWUuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciBvYmplY3QgPSB7ICdhJzogW3sgJ2InOiB7ICdjJzogMyB9IH1dIH07XG4gICAqXG4gICAqIF8uZ2V0KG9iamVjdCwgJ2FbMF0uYi5jJyk7XG4gICAqIC8vID0+IDNcbiAgICpcbiAgICogXy5nZXQob2JqZWN0LCBbJ2EnLCAnMCcsICdiJywgJ2MnXSk7XG4gICAqIC8vID0+IDNcbiAgICpcbiAgICogXy5nZXQob2JqZWN0LCAnYS5iLmMnLCAnZGVmYXVsdCcpO1xuICAgKiAvLyA9PiAnZGVmYXVsdCdcbiAgICovXG4gIGZ1bmN0aW9uIGdldChvYmplY3QsIHBhdGgsIGRlZmF1bHRWYWx1ZSkge1xuICAgIHZhciByZXN1bHQgPSBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IGJhc2VHZXQob2JqZWN0LCBwYXRoKTtcbiAgICByZXR1cm4gcmVzdWx0ID09PSB1bmRlZmluZWQgPyBkZWZhdWx0VmFsdWUgOiByZXN1bHQ7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gZ2V0O1xuICBcbiAgfSx7XCIuL19iYXNlR2V0XCI6Mjl9XSw3ODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBiYXNlSXNBcmd1bWVudHMgPSByZXF1aXJlKCcuL19iYXNlSXNBcmd1bWVudHMnKSxcbiAgICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG4gIFxuICAvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG4gIHZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG4gIFxuICAvKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbiAgdmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG4gIFxuICAvKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIHByb3BlcnR5SXNFbnVtZXJhYmxlID0gb2JqZWN0UHJvdG8ucHJvcGVydHlJc0VudW1lcmFibGU7XG4gIFxuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgbGlrZWx5IGFuIGBhcmd1bWVudHNgIG9iamVjdC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAc2luY2UgMC4xLjBcbiAgICogQGNhdGVnb3J5IExhbmdcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIGBhcmd1bWVudHNgIG9iamVjdCxcbiAgICogIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5pc0FyZ3VtZW50cyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKlxuICAgKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqL1xuICB2YXIgaXNBcmd1bWVudHMgPSBiYXNlSXNBcmd1bWVudHMoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSkgPyBiYXNlSXNBcmd1bWVudHMgOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsICdjYWxsZWUnKSAmJlxuICAgICAgIXByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwodmFsdWUsICdjYWxsZWUnKTtcbiAgfTtcbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gaXNBcmd1bWVudHM7XG4gIFxuICB9LHtcIi4vX2Jhc2VJc0FyZ3VtZW50c1wiOjMxLFwiLi9pc09iamVjdExpa2VcIjo4N31dLDc5OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgLyoqXG4gICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYEFycmF5YCBvYmplY3QuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQHNpbmNlIDAuMS4wXG4gICAqIEBjYXRlZ29yeSBMYW5nXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBhcnJheSwgZWxzZSBgZmFsc2VgLlxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKlxuICAgKiBfLmlzQXJyYXkoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqXG4gICAqIF8uaXNBcnJheSgnYWJjJyk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqXG4gICAqIF8uaXNBcnJheShfLm5vb3ApO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKi9cbiAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5O1xuICBcbiAgfSx7fV0sODA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJy4vaXNGdW5jdGlvbicpLFxuICAgICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyk7XG4gIFxuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZS4gQSB2YWx1ZSBpcyBjb25zaWRlcmVkIGFycmF5LWxpa2UgaWYgaXQnc1xuICAgKiBub3QgYSBmdW5jdGlvbiBhbmQgaGFzIGEgYHZhbHVlLmxlbmd0aGAgdGhhdCdzIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIG9yXG4gICAqIGVxdWFsIHRvIGAwYCBhbmQgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQHNpbmNlIDQuMC4wXG4gICAqIEBjYXRlZ29yeSBMYW5nXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLCBlbHNlIGBmYWxzZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIF8uaXNBcnJheUxpa2UoWzEsIDIsIDNdKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKlxuICAgKiBfLmlzQXJyYXlMaWtlKGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uaXNBcnJheUxpa2UoJ2FiYycpO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uaXNBcnJheUxpa2UoXy5ub29wKTtcbiAgICogLy8gPT4gZmFsc2VcbiAgICovXG4gIGZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgaXNMZW5ndGgodmFsdWUubGVuZ3RoKSAmJiAhaXNGdW5jdGlvbih2YWx1ZSk7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gaXNBcnJheUxpa2U7XG4gIFxuICB9LHtcIi4vaXNGdW5jdGlvblwiOjgyLFwiLi9pc0xlbmd0aFwiOjgzfV0sODE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKSxcbiAgICAgIHN0dWJGYWxzZSA9IHJlcXVpcmUoJy4vc3R1YkZhbHNlJyk7XG4gIFxuICAvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGV4cG9ydHNgLiAqL1xuICB2YXIgZnJlZUV4cG9ydHMgPSB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlICYmIGV4cG9ydHM7XG4gIFxuICAvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYG1vZHVsZWAuICovXG4gIHZhciBmcmVlTW9kdWxlID0gZnJlZUV4cG9ydHMgJiYgdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiYgIW1vZHVsZS5ub2RlVHlwZSAmJiBtb2R1bGU7XG4gIFxuICAvKiogRGV0ZWN0IHRoZSBwb3B1bGFyIENvbW1vbkpTIGV4dGVuc2lvbiBgbW9kdWxlLmV4cG9ydHNgLiAqL1xuICB2YXIgbW9kdWxlRXhwb3J0cyA9IGZyZWVNb2R1bGUgJiYgZnJlZU1vZHVsZS5leHBvcnRzID09PSBmcmVlRXhwb3J0cztcbiAgXG4gIC8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xuICB2YXIgQnVmZmVyID0gbW9kdWxlRXhwb3J0cyA/IHJvb3QuQnVmZmVyIDogdW5kZWZpbmVkO1xuICBcbiAgLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xuICB2YXIgbmF0aXZlSXNCdWZmZXIgPSBCdWZmZXIgPyBCdWZmZXIuaXNCdWZmZXIgOiB1bmRlZmluZWQ7XG4gIFxuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBidWZmZXIuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQHNpbmNlIDQuMy4wXG4gICAqIEBjYXRlZ29yeSBMYW5nXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGJ1ZmZlciwgZWxzZSBgZmFsc2VgLlxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiBfLmlzQnVmZmVyKG5ldyBCdWZmZXIoMikpO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uaXNCdWZmZXIobmV3IFVpbnQ4QXJyYXkoMikpO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKi9cbiAgdmFyIGlzQnVmZmVyID0gbmF0aXZlSXNCdWZmZXIgfHwgc3R1YkZhbHNlO1xuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBpc0J1ZmZlcjtcbiAgXG4gIH0se1wiLi9fcm9vdFwiOjcyLFwiLi9zdHViRmFsc2VcIjo5NH1dLDgyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGJhc2VHZXRUYWcgPSByZXF1aXJlKCcuL19iYXNlR2V0VGFnJyksXG4gICAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKTtcbiAgXG4gIC8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIGFzeW5jVGFnID0gJ1tvYmplY3QgQXN5bmNGdW5jdGlvbl0nLFxuICAgICAgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgICBnZW5UYWcgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nLFxuICAgICAgcHJveHlUYWcgPSAnW29iamVjdCBQcm94eV0nO1xuICBcbiAgLyoqXG4gICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAc2luY2UgMC4xLjBcbiAgICogQGNhdGVnb3J5IExhbmdcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5pc0Z1bmN0aW9uKF8pO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqL1xuICBmdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKCFpc09iamVjdCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gVGhlIHVzZSBvZiBgT2JqZWN0I3RvU3RyaW5nYCBhdm9pZHMgaXNzdWVzIHdpdGggdGhlIGB0eXBlb2ZgIG9wZXJhdG9yXG4gICAgLy8gaW4gU2FmYXJpIDkgd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXlzIGFuZCBvdGhlciBjb25zdHJ1Y3RvcnMuXG4gICAgdmFyIHRhZyA9IGJhc2VHZXRUYWcodmFsdWUpO1xuICAgIHJldHVybiB0YWcgPT0gZnVuY1RhZyB8fCB0YWcgPT0gZ2VuVGFnIHx8IHRhZyA9PSBhc3luY1RhZyB8fCB0YWcgPT0gcHJveHlUYWc7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvbjtcbiAgXG4gIH0se1wiLi9fYmFzZUdldFRhZ1wiOjMwLFwiLi9pc09iamVjdFwiOjg2fV0sODM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICAvKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbiAgdmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuICBcbiAgLyoqXG4gICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBsZW5ndGguXG4gICAqXG4gICAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBpcyBsb29zZWx5IGJhc2VkIG9uXG4gICAqIFtgVG9MZW5ndGhgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy10b2xlbmd0aCkuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQHNpbmNlIDQuMC4wXG4gICAqIEBjYXRlZ29yeSBMYW5nXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGxlbmd0aCwgZWxzZSBgZmFsc2VgLlxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiBfLmlzTGVuZ3RoKDMpO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uaXNMZW5ndGgoTnVtYmVyLk1JTl9WQUxVRSk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqXG4gICAqIF8uaXNMZW5ndGgoSW5maW5pdHkpO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKlxuICAgKiBfLmlzTGVuZ3RoKCczJyk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqL1xuICBmdW5jdGlvbiBpc0xlbmd0aCh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiZcbiAgICAgIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPD0gTUFYX1NBRkVfSU5URUdFUjtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBpc0xlbmd0aDtcbiAgXG4gIH0se31dLDg0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgLyoqXG4gICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAc2luY2UgNC4wLjBcbiAgICogQGNhdGVnb3J5IExhbmdcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG51bGxpc2gsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5pc05pbChudWxsKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKlxuICAgKiBfLmlzTmlsKHZvaWQgMCk7XG4gICAqIC8vID0+IHRydWVcbiAgICpcbiAgICogXy5pc05pbChOYU4pO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKi9cbiAgZnVuY3Rpb24gaXNOaWwodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbDtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBpc05pbDtcbiAgXG4gIH0se31dLDg1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGJhc2VHZXRUYWcgPSByZXF1aXJlKCcuL19iYXNlR2V0VGFnJyksXG4gICAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpO1xuICBcbiAgLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xuICB2YXIgbnVtYmVyVGFnID0gJ1tvYmplY3QgTnVtYmVyXSc7XG4gIFxuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBOdW1iZXJgIHByaW1pdGl2ZSBvciBvYmplY3QuXG4gICAqXG4gICAqICoqTm90ZToqKiBUbyBleGNsdWRlIGBJbmZpbml0eWAsIGAtSW5maW5pdHlgLCBhbmQgYE5hTmAsIHdoaWNoIGFyZVxuICAgKiBjbGFzc2lmaWVkIGFzIG51bWJlcnMsIHVzZSB0aGUgYF8uaXNGaW5pdGVgIG1ldGhvZC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAc2luY2UgMC4xLjBcbiAgICogQGNhdGVnb3J5IExhbmdcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgbnVtYmVyLCBlbHNlIGBmYWxzZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIF8uaXNOdW1iZXIoMyk7XG4gICAqIC8vID0+IHRydWVcbiAgICpcbiAgICogXy5pc051bWJlcihOdW1iZXIuTUlOX1ZBTFVFKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKlxuICAgKiBfLmlzTnVtYmVyKEluZmluaXR5KTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKlxuICAgKiBfLmlzTnVtYmVyKCczJyk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqL1xuICBmdW5jdGlvbiBpc051bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgfHxcbiAgICAgIChpc09iamVjdExpa2UodmFsdWUpICYmIGJhc2VHZXRUYWcodmFsdWUpID09IG51bWJlclRhZyk7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gaXNOdW1iZXI7XG4gIFxuICB9LHtcIi4vX2Jhc2VHZXRUYWdcIjozMCxcIi4vaXNPYmplY3RMaWtlXCI6ODd9XSw4NjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGVcbiAgICogW2xhbmd1YWdlIHR5cGVdKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzKVxuICAgKiBvZiBgT2JqZWN0YC4gKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQHNpbmNlIDAuMS4wXG4gICAqIEBjYXRlZ29yeSBMYW5nXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5pc09iamVjdCh7fSk7XG4gICAqIC8vID0+IHRydWVcbiAgICpcbiAgICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKlxuICAgKiBfLmlzT2JqZWN0KG51bGwpO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKi9cbiAgZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuICBcbiAgfSx7fV0sODc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gICAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAc2luY2UgNC4wLjBcbiAgICogQGNhdGVnb3J5IExhbmdcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIF8uaXNPYmplY3RMaWtlKHt9KTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKlxuICAgKiBfLmlzT2JqZWN0TGlrZShbMSwgMiwgM10pO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uaXNPYmplY3RMaWtlKF8ubm9vcCk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqXG4gICAqIF8uaXNPYmplY3RMaWtlKG51bGwpO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKi9cbiAgZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0TGlrZTtcbiAgXG4gIH0se31dLDg4OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGJhc2VHZXRUYWcgPSByZXF1aXJlKCcuL19iYXNlR2V0VGFnJyksXG4gICAgICBnZXRQcm90b3R5cGUgPSByZXF1aXJlKCcuL19nZXRQcm90b3R5cGUnKSxcbiAgICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG4gIFxuICAvKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG4gIHZhciBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJztcbiAgXG4gIC8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIGZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZSxcbiAgICAgIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcbiAgXG4gIC8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGRlY29tcGlsZWQgc291cmNlIG9mIGZ1bmN0aW9ucy4gKi9cbiAgdmFyIGZ1bmNUb1N0cmluZyA9IGZ1bmNQcm90by50b1N0cmluZztcbiAgXG4gIC8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xuICB2YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcbiAgXG4gIC8qKiBVc2VkIHRvIGluZmVyIHRoZSBgT2JqZWN0YCBjb25zdHJ1Y3Rvci4gKi9cbiAgdmFyIG9iamVjdEN0b3JTdHJpbmcgPSBmdW5jVG9TdHJpbmcuY2FsbChPYmplY3QpO1xuICBcbiAgLyoqXG4gICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgcGxhaW4gb2JqZWN0LCB0aGF0IGlzLCBhbiBvYmplY3QgY3JlYXRlZCBieSB0aGVcbiAgICogYE9iamVjdGAgY29uc3RydWN0b3Igb3Igb25lIHdpdGggYSBgW1tQcm90b3R5cGVdXWAgb2YgYG51bGxgLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBzaW5jZSAwLjguMFxuICAgKiBAY2F0ZWdvcnkgTGFuZ1xuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogZnVuY3Rpb24gRm9vKCkge1xuICAgKiAgIHRoaXMuYSA9IDE7XG4gICAqIH1cbiAgICpcbiAgICogXy5pc1BsYWluT2JqZWN0KG5ldyBGb28pO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKlxuICAgKiBfLmlzUGxhaW5PYmplY3QoWzEsIDIsIDNdKTtcbiAgICogLy8gPT4gZmFsc2VcbiAgICpcbiAgICogXy5pc1BsYWluT2JqZWN0KHsgJ3gnOiAwLCAneSc6IDAgfSk7XG4gICAqIC8vID0+IHRydWVcbiAgICpcbiAgICogXy5pc1BsYWluT2JqZWN0KE9iamVjdC5jcmVhdGUobnVsbCkpO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqL1xuICBmdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gICAgaWYgKCFpc09iamVjdExpa2UodmFsdWUpIHx8IGJhc2VHZXRUYWcodmFsdWUpICE9IG9iamVjdFRhZykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgcHJvdG8gPSBnZXRQcm90b3R5cGUodmFsdWUpO1xuICAgIGlmIChwcm90byA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHZhciBDdG9yID0gaGFzT3duUHJvcGVydHkuY2FsbChwcm90bywgJ2NvbnN0cnVjdG9yJykgJiYgcHJvdG8uY29uc3RydWN0b3I7XG4gICAgcmV0dXJuIHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiYgQ3RvciBpbnN0YW5jZW9mIEN0b3IgJiZcbiAgICAgIGZ1bmNUb1N0cmluZy5jYWxsKEN0b3IpID09IG9iamVjdEN0b3JTdHJpbmc7XG4gIH1cbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gaXNQbGFpbk9iamVjdDtcbiAgXG4gIH0se1wiLi9fYmFzZUdldFRhZ1wiOjMwLFwiLi9fZ2V0UHJvdG90eXBlXCI6NDMsXCIuL2lzT2JqZWN0TGlrZVwiOjg3fV0sODk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgYmFzZUdldFRhZyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRUYWcnKSxcbiAgICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuL2lzQXJyYXknKSxcbiAgICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG4gIFxuICAvKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG4gIHZhciBzdHJpbmdUYWcgPSAnW29iamVjdCBTdHJpbmddJztcbiAgXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYFN0cmluZ2AgcHJpbWl0aXZlIG9yIG9iamVjdC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAc2luY2UgMC4xLjBcbiAgICogQG1lbWJlck9mIF9cbiAgICogQGNhdGVnb3J5IExhbmdcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgc3RyaW5nLCBlbHNlIGBmYWxzZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIF8uaXNTdHJpbmcoJ2FiYycpO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uaXNTdHJpbmcoMSk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqL1xuICBmdW5jdGlvbiBpc1N0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycgfHxcbiAgICAgICghaXNBcnJheSh2YWx1ZSkgJiYgaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBiYXNlR2V0VGFnKHZhbHVlKSA9PSBzdHJpbmdUYWcpO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGlzU3RyaW5nO1xuICBcbiAgfSx7XCIuL19iYXNlR2V0VGFnXCI6MzAsXCIuL2lzQXJyYXlcIjo3OSxcIi4vaXNPYmplY3RMaWtlXCI6ODd9XSw5MDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBiYXNlR2V0VGFnID0gcmVxdWlyZSgnLi9fYmFzZUdldFRhZycpLFxuICAgICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcbiAgXG4gIC8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuICBcbiAgLyoqXG4gICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgU3ltYm9sYCBwcmltaXRpdmUgb3Igb2JqZWN0LlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBzaW5jZSA0LjAuMFxuICAgKiBAY2F0ZWdvcnkgTGFuZ1xuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBzeW1ib2wsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5pc1N5bWJvbChTeW1ib2wuaXRlcmF0b3IpO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uaXNTeW1ib2woJ2FiYycpO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKi9cbiAgZnVuY3Rpb24gaXNTeW1ib2wodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdzeW1ib2wnIHx8XG4gICAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBiYXNlR2V0VGFnKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IGlzU3ltYm9sO1xuICBcbiAgfSx7XCIuL19iYXNlR2V0VGFnXCI6MzAsXCIuL2lzT2JqZWN0TGlrZVwiOjg3fV0sOTE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgYmFzZUlzVHlwZWRBcnJheSA9IHJlcXVpcmUoJy4vX2Jhc2VJc1R5cGVkQXJyYXknKSxcbiAgICAgIGJhc2VVbmFyeSA9IHJlcXVpcmUoJy4vX2Jhc2VVbmFyeScpLFxuICAgICAgbm9kZVV0aWwgPSByZXF1aXJlKCcuL19ub2RlVXRpbCcpO1xuICBcbiAgLyogTm9kZS5qcyBoZWxwZXIgcmVmZXJlbmNlcy4gKi9cbiAgdmFyIG5vZGVJc1R5cGVkQXJyYXkgPSBub2RlVXRpbCAmJiBub2RlVXRpbC5pc1R5cGVkQXJyYXk7XG4gIFxuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIHR5cGVkIGFycmF5LlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBzaW5jZSAzLjAuMFxuICAgKiBAY2F0ZWdvcnkgTGFuZ1xuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB0eXBlZCBhcnJheSwgZWxzZSBgZmFsc2VgLlxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiBfLmlzVHlwZWRBcnJheShuZXcgVWludDhBcnJheSk7XG4gICAqIC8vID0+IHRydWVcbiAgICpcbiAgICogXy5pc1R5cGVkQXJyYXkoW10pO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKi9cbiAgdmFyIGlzVHlwZWRBcnJheSA9IG5vZGVJc1R5cGVkQXJyYXkgPyBiYXNlVW5hcnkobm9kZUlzVHlwZWRBcnJheSkgOiBiYXNlSXNUeXBlZEFycmF5O1xuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBpc1R5cGVkQXJyYXk7XG4gIFxuICB9LHtcIi4vX2Jhc2VJc1R5cGVkQXJyYXlcIjozMyxcIi4vX2Jhc2VVbmFyeVwiOjM3LFwiLi9fbm9kZVV0aWxcIjo2OX1dLDkyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgdmFyIGFycmF5TGlrZUtleXMgPSByZXF1aXJlKCcuL19hcnJheUxpa2VLZXlzJyksXG4gICAgICBiYXNlS2V5cyA9IHJlcXVpcmUoJy4vX2Jhc2VLZXlzJyksXG4gICAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4vaXNBcnJheUxpa2UnKTtcbiAgXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFycmF5IG9mIHRoZSBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBgb2JqZWN0YC5cbiAgICpcbiAgICogKipOb3RlOioqIE5vbi1vYmplY3QgdmFsdWVzIGFyZSBjb2VyY2VkIHRvIG9iamVjdHMuIFNlZSB0aGVcbiAgICogW0VTIHNwZWNdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLW9iamVjdC5rZXlzKVxuICAgKiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBzaW5jZSAwLjEuMFxuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogZnVuY3Rpb24gRm9vKCkge1xuICAgKiAgIHRoaXMuYSA9IDE7XG4gICAqICAgdGhpcy5iID0gMjtcbiAgICogfVxuICAgKlxuICAgKiBGb28ucHJvdG90eXBlLmMgPSAzO1xuICAgKlxuICAgKiBfLmtleXMobmV3IEZvbyk7XG4gICAqIC8vID0+IFsnYScsICdiJ10gKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAgICpcbiAgICogXy5rZXlzKCdoaScpO1xuICAgKiAvLyA9PiBbJzAnLCAnMSddXG4gICAqL1xuICBmdW5jdGlvbiBrZXlzKG9iamVjdCkge1xuICAgIHJldHVybiBpc0FycmF5TGlrZShvYmplY3QpID8gYXJyYXlMaWtlS2V5cyhvYmplY3QpIDogYmFzZUtleXMob2JqZWN0KTtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBrZXlzO1xuICBcbiAgfSx7XCIuL19hcnJheUxpa2VLZXlzXCI6MjYsXCIuL19iYXNlS2V5c1wiOjM0LFwiLi9pc0FycmF5TGlrZVwiOjgwfV0sOTM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuICB2YXIgTWFwQ2FjaGUgPSByZXF1aXJlKCcuL19NYXBDYWNoZScpO1xuICBcbiAgLyoqIEVycm9yIG1lc3NhZ2UgY29uc3RhbnRzLiAqL1xuICB2YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuICBcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IG1lbW9pemVzIHRoZSByZXN1bHQgb2YgYGZ1bmNgLiBJZiBgcmVzb2x2ZXJgIGlzXG4gICAqIHByb3ZpZGVkLCBpdCBkZXRlcm1pbmVzIHRoZSBjYWNoZSBrZXkgZm9yIHN0b3JpbmcgdGhlIHJlc3VsdCBiYXNlZCBvbiB0aGVcbiAgICogYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZSBtZW1vaXplZCBmdW5jdGlvbi4gQnkgZGVmYXVsdCwgdGhlIGZpcnN0IGFyZ3VtZW50XG4gICAqIHByb3ZpZGVkIHRvIHRoZSBtZW1vaXplZCBmdW5jdGlvbiBpcyB1c2VkIGFzIHRoZSBtYXAgY2FjaGUga2V5LiBUaGUgYGZ1bmNgXG4gICAqIGlzIGludm9rZWQgd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlIG1lbW9pemVkIGZ1bmN0aW9uLlxuICAgKlxuICAgKiAqKk5vdGU6KiogVGhlIGNhY2hlIGlzIGV4cG9zZWQgYXMgdGhlIGBjYWNoZWAgcHJvcGVydHkgb24gdGhlIG1lbW9pemVkXG4gICAqIGZ1bmN0aW9uLiBJdHMgY3JlYXRpb24gbWF5IGJlIGN1c3RvbWl6ZWQgYnkgcmVwbGFjaW5nIHRoZSBgXy5tZW1vaXplLkNhY2hlYFxuICAgKiBjb25zdHJ1Y3RvciB3aXRoIG9uZSB3aG9zZSBpbnN0YW5jZXMgaW1wbGVtZW50IHRoZVxuICAgKiBbYE1hcGBdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXByb3BlcnRpZXMtb2YtdGhlLW1hcC1wcm90b3R5cGUtb2JqZWN0KVxuICAgKiBtZXRob2QgaW50ZXJmYWNlIG9mIGBjbGVhcmAsIGBkZWxldGVgLCBgZ2V0YCwgYGhhc2AsIGFuZCBgc2V0YC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAc2luY2UgMC4xLjBcbiAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGhhdmUgaXRzIG91dHB1dCBtZW1vaXplZC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW3Jlc29sdmVyXSBUaGUgZnVuY3Rpb24gdG8gcmVzb2x2ZSB0aGUgY2FjaGUga2V5LlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBtZW1vaXplZCBmdW5jdGlvbi5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogdmFyIG9iamVjdCA9IHsgJ2EnOiAxLCAnYic6IDIgfTtcbiAgICogdmFyIG90aGVyID0geyAnYyc6IDMsICdkJzogNCB9O1xuICAgKlxuICAgKiB2YXIgdmFsdWVzID0gXy5tZW1vaXplKF8udmFsdWVzKTtcbiAgICogdmFsdWVzKG9iamVjdCk7XG4gICAqIC8vID0+IFsxLCAyXVxuICAgKlxuICAgKiB2YWx1ZXMob3RoZXIpO1xuICAgKiAvLyA9PiBbMywgNF1cbiAgICpcbiAgICogb2JqZWN0LmEgPSAyO1xuICAgKiB2YWx1ZXMob2JqZWN0KTtcbiAgICogLy8gPT4gWzEsIDJdXG4gICAqXG4gICAqIC8vIE1vZGlmeSB0aGUgcmVzdWx0IGNhY2hlLlxuICAgKiB2YWx1ZXMuY2FjaGUuc2V0KG9iamVjdCwgWydhJywgJ2InXSk7XG4gICAqIHZhbHVlcyhvYmplY3QpO1xuICAgKiAvLyA9PiBbJ2EnLCAnYiddXG4gICAqXG4gICAqIC8vIFJlcGxhY2UgYF8ubWVtb2l6ZS5DYWNoZWAuXG4gICAqIF8ubWVtb2l6ZS5DYWNoZSA9IFdlYWtNYXA7XG4gICAqL1xuICBmdW5jdGlvbiBtZW1vaXplKGZ1bmMsIHJlc29sdmVyKSB7XG4gICAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicgfHwgKHJlc29sdmVyICE9IG51bGwgJiYgdHlwZW9mIHJlc29sdmVyICE9ICdmdW5jdGlvbicpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gICAgfVxuICAgIHZhciBtZW1vaXplZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgICAga2V5ID0gcmVzb2x2ZXIgPyByZXNvbHZlci5hcHBseSh0aGlzLCBhcmdzKSA6IGFyZ3NbMF0sXG4gICAgICAgICAgY2FjaGUgPSBtZW1vaXplZC5jYWNoZTtcbiAgXG4gICAgICBpZiAoY2FjaGUuaGFzKGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChrZXkpO1xuICAgICAgfVxuICAgICAgdmFyIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICBtZW1vaXplZC5jYWNoZSA9IGNhY2hlLnNldChrZXksIHJlc3VsdCkgfHwgY2FjaGU7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgbWVtb2l6ZWQuY2FjaGUgPSBuZXcgKG1lbW9pemUuQ2FjaGUgfHwgTWFwQ2FjaGUpO1xuICAgIHJldHVybiBtZW1vaXplZDtcbiAgfVxuICBcbiAgLy8gRXhwb3NlIGBNYXBDYWNoZWAuXG4gIG1lbW9pemUuQ2FjaGUgPSBNYXBDYWNoZTtcbiAgXG4gIG1vZHVsZS5leHBvcnRzID0gbWVtb2l6ZTtcbiAgXG4gIH0se1wiLi9fTWFwQ2FjaGVcIjoyNH1dLDk0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIHJldHVybnMgYGZhbHNlYC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAc2luY2UgNC4xMy4wXG4gICAqIEBjYXRlZ29yeSBVdGlsXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGBmYWxzZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIF8udGltZXMoMiwgXy5zdHViRmFsc2UpO1xuICAgKiAvLyA9PiBbZmFsc2UsIGZhbHNlXVxuICAgKi9cbiAgZnVuY3Rpb24gc3R1YkZhbHNlKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgbW9kdWxlLmV4cG9ydHMgPSBzdHViRmFsc2U7XG4gIFxuICB9LHt9XSw5NTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIHZhciBiYXNlVG9TdHJpbmcgPSByZXF1aXJlKCcuL19iYXNlVG9TdHJpbmcnKTtcbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgc3RyaW5nLiBBbiBlbXB0eSBzdHJpbmcgaXMgcmV0dXJuZWQgZm9yIGBudWxsYFxuICAgKiBhbmQgYHVuZGVmaW5lZGAgdmFsdWVzLiBUaGUgc2lnbiBvZiBgLTBgIGlzIHByZXNlcnZlZC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAc2luY2UgNC4wLjBcbiAgICogQGNhdGVnb3J5IExhbmdcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29udmVydC5cbiAgICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgY29udmVydGVkIHN0cmluZy5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy50b1N0cmluZyhudWxsKTtcbiAgICogLy8gPT4gJydcbiAgICpcbiAgICogXy50b1N0cmluZygtMCk7XG4gICAqIC8vID0+ICctMCdcbiAgICpcbiAgICogXy50b1N0cmluZyhbMSwgMiwgM10pO1xuICAgKiAvLyA9PiAnMSwyLDMnXG4gICAqL1xuICBmdW5jdGlvbiB0b1N0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PSBudWxsID8gJycgOiBiYXNlVG9TdHJpbmcodmFsdWUpO1xuICB9XG4gIFxuICBtb2R1bGUuZXhwb3J0cyA9IHRvU3RyaW5nO1xuICBcbiAgfSx7XCIuL19iYXNlVG9TdHJpbmdcIjozNn1dLFwiYWlydGFibGVcIjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xuICB9O1xuICB2YXIgYmFzZV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL2Jhc2VcIikpO1xuICB2YXIgcmVjb3JkXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vcmVjb3JkXCIpKTtcbiAgdmFyIHRhYmxlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vdGFibGVcIikpO1xuICB2YXIgYWlydGFibGVfZXJyb3JfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9haXJ0YWJsZV9lcnJvclwiKSk7XG4gIHZhciBBaXJ0YWJsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAgIGZ1bmN0aW9uIEFpcnRhYmxlKG9wdHMpIHtcbiAgICAgICAgICBpZiAob3B0cyA9PT0gdm9pZCAwKSB7IG9wdHMgPSB7fTsgfVxuICAgICAgICAgIHZhciBkZWZhdWx0Q29uZmlnID0gQWlydGFibGUuZGVmYXVsdF9jb25maWcoKTtcbiAgICAgICAgICB2YXIgYXBpVmVyc2lvbiA9IG9wdHMuYXBpVmVyc2lvbiB8fCBBaXJ0YWJsZS5hcGlWZXJzaW9uIHx8IGRlZmF1bHRDb25maWcuYXBpVmVyc2lvbjtcbiAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAgICAgICAgIF9hcGlLZXk6IHtcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiBvcHRzLmFwaUtleSB8fCBBaXJ0YWJsZS5hcGlLZXkgfHwgZGVmYXVsdENvbmZpZy5hcGlLZXksXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF9hcGlWZXJzaW9uOiB7XG4gICAgICAgICAgICAgICAgICB2YWx1ZTogYXBpVmVyc2lvbixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgX2FwaVZlcnNpb25NYWpvcjoge1xuICAgICAgICAgICAgICAgICAgdmFsdWU6IGFwaVZlcnNpb24uc3BsaXQoJy4nKVswXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgX2N1c3RvbUhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiBvcHRzLmN1c3RvbUhlYWRlcnMgfHwge30sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF9lbmRwb2ludFVybDoge1xuICAgICAgICAgICAgICAgICAgdmFsdWU6IG9wdHMuZW5kcG9pbnRVcmwgfHwgQWlydGFibGUuZW5kcG9pbnRVcmwgfHwgZGVmYXVsdENvbmZpZy5lbmRwb2ludFVybCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgX25vUmV0cnlJZlJhdGVMaW1pdGVkOiB7XG4gICAgICAgICAgICAgICAgICB2YWx1ZTogb3B0cy5ub1JldHJ5SWZSYXRlTGltaXRlZCB8fFxuICAgICAgICAgICAgICAgICAgICAgIEFpcnRhYmxlLm5vUmV0cnlJZlJhdGVMaW1pdGVkIHx8XG4gICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdENvbmZpZy5ub1JldHJ5SWZSYXRlTGltaXRlZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgX3JlcXVlc3RUaW1lb3V0OiB7XG4gICAgICAgICAgICAgICAgICB2YWx1ZTogb3B0cy5yZXF1ZXN0VGltZW91dCB8fCBBaXJ0YWJsZS5yZXF1ZXN0VGltZW91dCB8fCBkZWZhdWx0Q29uZmlnLnJlcXVlc3RUaW1lb3V0LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmICghdGhpcy5fYXBpS2V5KSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQW4gQVBJIGtleSBpcyByZXF1aXJlZCB0byBjb25uZWN0IHRvIEFpcnRhYmxlJyk7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgICAgQWlydGFibGUucHJvdG90eXBlLmJhc2UgPSBmdW5jdGlvbiAoYmFzZUlkKSB7XG4gICAgICAgICAgcmV0dXJuIGJhc2VfMS5kZWZhdWx0LmNyZWF0ZUZ1bmN0b3IodGhpcywgYmFzZUlkKTtcbiAgICAgIH07XG4gICAgICBBaXJ0YWJsZS5kZWZhdWx0X2NvbmZpZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBlbmRwb2ludFVybDogdW5kZWZpbmVkIHx8ICdodHRwczovL2FwaS5haXJ0YWJsZS5jb20nLFxuICAgICAgICAgICAgICBhcGlWZXJzaW9uOiAnMC4xLjAnLFxuICAgICAgICAgICAgICBhcGlLZXk6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgbm9SZXRyeUlmUmF0ZUxpbWl0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICByZXF1ZXN0VGltZW91dDogMzAwICogMTAwMCxcbiAgICAgICAgICB9O1xuICAgICAgfTtcbiAgICAgIEFpcnRhYmxlLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgIHZhciBhcGlLZXkgPSBfYS5hcGlLZXksIGVuZHBvaW50VXJsID0gX2EuZW5kcG9pbnRVcmwsIGFwaVZlcnNpb24gPSBfYS5hcGlWZXJzaW9uLCBub1JldHJ5SWZSYXRlTGltaXRlZCA9IF9hLm5vUmV0cnlJZlJhdGVMaW1pdGVkLCByZXF1ZXN0VGltZW91dCA9IF9hLnJlcXVlc3RUaW1lb3V0O1xuICAgICAgICAgIEFpcnRhYmxlLmFwaUtleSA9IGFwaUtleTtcbiAgICAgICAgICBBaXJ0YWJsZS5lbmRwb2ludFVybCA9IGVuZHBvaW50VXJsO1xuICAgICAgICAgIEFpcnRhYmxlLmFwaVZlcnNpb24gPSBhcGlWZXJzaW9uO1xuICAgICAgICAgIEFpcnRhYmxlLm5vUmV0cnlJZlJhdGVMaW1pdGVkID0gbm9SZXRyeUlmUmF0ZUxpbWl0ZWQ7XG4gICAgICAgICAgQWlydGFibGUucmVxdWVzdFRpbWVvdXQgPSByZXF1ZXN0VGltZW91dDtcbiAgICAgIH07XG4gICAgICBBaXJ0YWJsZS5iYXNlID0gZnVuY3Rpb24gKGJhc2VJZCkge1xuICAgICAgICAgIHJldHVybiBuZXcgQWlydGFibGUoKS5iYXNlKGJhc2VJZCk7XG4gICAgICB9O1xuICAgICAgQWlydGFibGUuQmFzZSA9IGJhc2VfMS5kZWZhdWx0O1xuICAgICAgQWlydGFibGUuUmVjb3JkID0gcmVjb3JkXzEuZGVmYXVsdDtcbiAgICAgIEFpcnRhYmxlLlRhYmxlID0gdGFibGVfMS5kZWZhdWx0O1xuICAgICAgQWlydGFibGUuRXJyb3IgPSBhaXJ0YWJsZV9lcnJvcl8xLmRlZmF1bHQ7XG4gICAgICByZXR1cm4gQWlydGFibGU7XG4gIH0oKSk7XG4gIG1vZHVsZS5leHBvcnRzID0gQWlydGFibGU7XG4gIFxuICB9LHtcIi4vYWlydGFibGVfZXJyb3JcIjoyLFwiLi9iYXNlXCI6MyxcIi4vcmVjb3JkXCI6MTUsXCIuL3RhYmxlXCI6MTd9XX0se30sW1wiYWlydGFibGVcIl0pO1xuICAiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCIvLyBUaGlzIGZpbGUgaG9sZHMgdGhlIG1haW4gY29kZSBmb3IgdGhlIHBsdWdpbnMuIEl0IGhhcyBhY2Nlc3MgdG8gdGhlICpkb2N1bWVudCouXG4vLyBZb3UgY2FuIGFjY2VzcyBicm93c2VyIEFQSXMgc3VjaCBhcyB0aGUgbmV0d29yayBieSBjcmVhdGluZyBhIFVJIHdoaWNoIGNvbnRhaW5zXG4vLyBhIGZ1bGwgYnJvd3NlciBlbnZpcm9ubWVudCAoc2VlIGRvY3VtZW50YXRpb24pLlxuZnVuY3Rpb24gaGV4VG9SR0IoaGV4KSB7XG4gICAgY29uc3QgciA9IChwYXJzZUludChoZXguc2xpY2UoMSwgMyksIDE2KSAvIDI1NSk7XG4gICAgY29uc3QgZyA9IChwYXJzZUludChoZXguc2xpY2UoMywgNSksIDE2KSAvIDI1NSk7XG4gICAgY29uc3QgYiA9IChwYXJzZUludChoZXguc2xpY2UoNSwgNyksIDE2KSAvIDI1NSk7XG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICByOiByLFxuICAgICAgICBnOiBnLFxuICAgICAgICBiOiBiXG4gICAgfTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuLy8gR2V0IGRhdGEgZnJvbSBBaXJ0YWJsZVxudmFyIEFpcnRhYmxlID0gcmVxdWlyZSgnLi9haXJ0YWJsZScpO1xudmFyIGJhc2UgPSBuZXcgQWlydGFibGUoeyBhcGlLZXk6ICdrZXliRkpidXEzeG5QTEdYOScgfSkuYmFzZSgnYXBwYmx6MTVMblRxaXBwdFMnKTtcbmJhc2UoJ1VuaWZ5Jykuc2VsZWN0KHtcbiAgICB2aWV3OiBcIkdyaWQgdmlld1wiXG59KS5maXJzdFBhZ2UoZnVuY3Rpb24gKGVyciwgcmVjb3Jkcykge1xuICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyZWNvcmRzKSB7XG4gICAgICAgIGNvbnN0IG5ld1N0eWxlcyA9IFtdO1xuICAgICAgICBjb25zb2xlLmxvZygncmVjb3JkcycsIHJlY29yZHMpO1xuICAgICAgICByZWNvcmRzLmZvckVhY2goKHJlY29yZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGUgPSBmaWdtYS5jcmVhdGVQYWludFN0eWxlKCk7XG4gICAgICAgICAgICBzdHlsZS5uYW1lID0gcmVjb3JkLmdldChcIk5hbWVcIik7XG4gICAgICAgICAgICBjb25zdCBjb2xvclJHQiA9IGhleFRvUkdCKHJlY29yZC5nZXQoXCJWYWx1ZVwiKSk7XG4gICAgICAgICAgICBjb25zdCBwYWludCA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnU09MSUQnLFxuICAgICAgICAgICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICBibGVuZE1vZGU6IFwiTk9STUFMXCIsXG4gICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yUkdCXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbmV3U3R5bGVzLnB1c2gocGFpbnQpO1xuICAgICAgICAgICAgc3R5bGUucGFpbnRzID0gbmV3U3R5bGVzO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2cobmV3U3R5bGVzKTtcbiAgICB9XG59KTtcbi8vIGNvbnN0IG5vZGVzOiBTY2VuZU5vZGVbXSA9IFtdO1xuLy8gZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZlJlY3RhbmdsZXM7IGkrKykge1xuLy8gICBjb25zdCByZWN0ID0gZmlnbWEuY3JlYXRlUmVjdGFuZ2xlKCk7XG4vLyAgIHJlY3QueCA9IGkgKiAxNTA7XG4vLyAgIHJlY3QuZmlsbHMgPSBbe3R5cGU6ICdTT0xJRCcsIGNvbG9yOiB7cjogMSwgZzogMC41LCBiOiAwfX1dO1xuLy8gICBmaWdtYS5jdXJyZW50UGFnZS5hcHBlbmRDaGlsZChyZWN0KTtcbi8vICAgbm9kZXMucHVzaChyZWN0KTtcbi8vIH1cbi8vIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IG5vZGVzO1xuLy8gZmlnbWEudmlld3BvcnQuc2Nyb2xsQW5kWm9vbUludG9WaWV3KG5vZGVzKTtcbi8vIE1ha2Ugc3VyZSB0byBjbG9zZSB0aGUgcGx1Z2luIHdoZW4geW91J3JlIGRvbmUuIE90aGVyd2lzZSB0aGUgcGx1Z2luIHdpbGxcbi8vIGtlZXAgcnVubmluZywgd2hpY2ggc2hvd3MgdGhlIGNhbmNlbCBidXR0b24gYXQgdGhlIGJvdHRvbSBvZiB0aGUgc2NyZWVuLlxuZmlnbWEuY2xvc2VQbHVnaW4oKTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==