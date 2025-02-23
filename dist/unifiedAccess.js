"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
require("dotenv").config();
var express = require("express");
var serverless = require("serverless-http");
var axios = require("axios");
var mongoose = require("mongoose");
var _require = require("../config/redis"),
  redis = _require.redis,
  quitRedis = _require.quitRedis,
  cacheMiddleware = _require.cacheMiddleware;
var cors = require("cors");
var fs = require("fs");
var path = require("path");
var rateLimit = require("express-rate-limit");
var _require2 = require("../modules/logging/logger"),
  logger = _require2.logger,
  logConversation = _require2.logConversation,
  getFrequentQuestions = _require2.getFrequentQuestions;
var app = express();
var router = express.Router();

// === Configurazione Redis ===
//const REDIS_HOST = process.env.REDIS_HOST;
//const REDIS_PORT = process.env.REDIS_PORT;
//const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

//if (!REDIS_HOST || !REDIS_PORT || !REDIS_PASSWORD) {
//  console.error("❌ ERROR: Redis environment variables are missing!");
//  process.exit(1);
//}

//const redis = new Redis({
//  host: REDIS_HOST,
//  port: REDIS_PORT,
//  password: REDIS_PASSWORD,
//  tls: { rejectUnauthorized: false }, // Miglioramento per Upstash
//  enableOfflineQueue: false,
//  connectTimeout: 5000,
//  retryStrategy: (times) => Math.min(times * 100, 2000),
// });

//redis.on("connect", () => {
//  console.log("✅ Connected to Redis successfully!");
//});

//redis.on("error", (err) => {
//  console.error("❌ Redis connection error:", err.message);
//});

// === Logger e Directory dei Log ===
var logsDir = "/tmp/logs";
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, {
      recursive: true
    });
  } catch (err) {
    console.error("❌ Error creating logs directory:", err.message);
  }
}

//const logger = winston.createLogger({
//  level: "info",
//  format: winston.format.combine(
//    winston.format.timestamp(),
//    winston.format.printf(
//      ({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
//    )
//  ),
//  transports: [
//    new winston.transports.Console(),
//    new winston.transports.File({ filename: path.join(logsDir, "app.log") }),
//  ],
//});

// === Verifica delle Variabili d'Ambiente Richieste ===
var requiredEnvVars = ["MONGO_URI", "REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD", "MY_GITHUB_OWNER", "MY_GITHUB_REPO", "MY_GITHUB_TOKEN"];
requiredEnvVars.forEach(function (envVar) {
  if (!process.env[envVar]) {
    logger.error("\u274C Missing required environment variable: ".concat(envVar));
    process.exit(1);
  }
});

// === Middleware e Rate Limiting ===
app.set("trust proxy", 1); // Fidarsi del proxy di Netlify
var limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
  keyGenerator: function keyGenerator(req) {
    return req.ip || req.headers["x-forwarded-for"] || "unknown-ip";
  }
});
app.use(limiter);
app.use(cors());
app.use(express.json());

// === Connessione a MongoDB ===
// Funzione per connettersi a MongoDB con gestione forzata se rimane in stato "connecting"
var _ref = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            if (!(mongoose.connection.readyState === 1)) {
              _context.next = 3;
              break;
            }
            logger.info("🔄 MongoDB already connected, reusing existing connection.");
            return _context.abrupt("return", mongoose.connection);
          case 3:
            if (!(mongoose.connection.readyState === 2)) {
              _context.next = 16;
              break;
            }
            logger.warn("Mongoose connection is stuck in 'connecting' state. Forcing disconnect...");
            _context.prev = 5;
            _context.next = 8;
            return mongoose.disconnect();
          case 8:
            _context.next = 10;
            return new Promise(function (resolve, reject) {
              var start = Date.now();
              var _checkState = function checkState() {
                if (mongoose.connection.readyState === 0) {
                  resolve();
                } else if (Date.now() - start > 5000) {
                  reject(new Error("Timeout waiting for mongoose to disconnect."));
                } else {
                  setTimeout(_checkState, 500); // Ritardo aumentato a 500ms
                }
              };
              _checkState();
            });
          case 10:
            logger.info("Forced disconnect successful. ReadyState is now: " + mongoose.connection.readyState);
            _context.next = 16;
            break;
          case 13:
            _context.prev = 13;
            _context.t0 = _context["catch"](5);
            logger.error("Error during forced disconnect: " + _context.t0.message);
          case 16:
            _context.prev = 16;
            _context.next = 19;
            return mongoose.connect(process.env.MONGO_URI, {
              // Le opzioni deprecate possono essere omesse con il driver 4.x
            });
          case 19:
            logger.info("📚 Connected to MongoDB");

            // Aggiungi i listener di connessione
            mongoose.connection.on("error", function (err) {
              return logger.error("MongoDB error:", err);
            });
            mongoose.connection.on("disconnected", function () {
              return logger.warn("MongoDB disconnected.");
            });
            mongoose.connection.on("reconnected", function () {
              return logger.info("MongoDB reconnected!");
            });
            _context.next = 28;
            break;
          case 25:
            _context.prev = 25;
            _context.t1 = _context["catch"](16);
            logger.error("\u274C MongoDB connection error: ".concat(_context.t1.message));
          case 28:
            _context.next = 30;
            return new Promise(function (resolve) {
              return setTimeout(resolve, 1000);
            });
          case 30:
            logger.info("Final mongoose.connection.readyState: " + mongoose.connection.readyState);
            return _context.abrupt("return", mongoose.connection);
          case 32:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[5, 13], [16, 25]]);
    }));
    return function _ref() {
      return _ref2.apply(this, arguments);
    };
  }(),
  connectMongoDB = _ref.connectMongoDB;

// Endpoint /health aggiornato con log dettagliati (il resto rimane invariato)
router.get("/health", /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
    var currentState, mongoStatus, pingResult;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          logger.info("🔹 Health check started...");

          // Log dello stato iniziale della connessione
          currentState = mongoose.connection.readyState;
          logger.info("Current mongoose.connection.readyState: ".concat(currentState));

          // Se non è 1, tentiamo la riconnessione
          if (!(currentState !== 1)) {
            _context2.next = 10;
            break;
          }
          logger.warn("\u26A0\uFE0F MongoDB not connected (state ".concat(currentState, "), attempting to reconnect..."));
          _context2.next = 8;
          return connectMongoDB();
        case 8:
          currentState = mongoose.connection.readyState;
          logger.info("After reconnect attempt, mongoose.connection.readyState: ".concat(currentState));
        case 10:
          mongoStatus = "Disconnected";
          _context2.prev = 11;
          if (!(mongoose.connection.readyState === 1 && mongoose.connection.db)) {
            _context2.next = 21;
            break;
          }
          logger.info("Performing MongoDB ping command...");
          _context2.next = 16;
          return mongoose.connection.db.command({
            ping: 1
          });
        case 16:
          pingResult = _context2.sent;
          logger.info("MongoDB ping result: " + JSON.stringify(pingResult));
          if (pingResult && pingResult.ok === 1) {
            mongoStatus = "Connected";
          } else {
            logger.warn("MongoDB ping did not return an ok result");
          }
          _context2.next = 22;
          break;
        case 21:
          logger.warn("mongoose.connection.readyState is not 1 or mongoose.connection.db is not available");
        case 22:
          _context2.next = 28;
          break;
        case 24:
          _context2.prev = 24;
          _context2.t0 = _context2["catch"](11);
          logger.error("MongoDB ping error: " + _context2.t0.message);
          mongoStatus = "Disconnected";
        case 28:
          logger.info("\uD83D\uDD39 MongoDB Status: ".concat(mongoStatus));
          res.json({
            status: "✅ Healthy",
            mongo: mongoStatus,
            redis: redisStatus
          });
          _context2.next = 36;
          break;
        case 32:
          _context2.prev = 32;
          _context2.t1 = _context2["catch"](0);
          logger.error("\u274C Health check failed: ".concat(_context2.t1.message));
          res.status(500).json({
            error: "Service is unhealthy",
            details: _context2.t1.message
          });
        case 36:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 32], [11, 24]]);
  }));
  return function (_x, _x2) {
    return _ref3.apply(this, arguments);
  };
}());
app.use("/.netlify/functions/server", router);

// === Schema e Modello per la Knowledge Base ===
var KnowledgeSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: mongoose.Schema.Types.Mixed
});
var Knowledge = mongoose.models.Knowledge || mongoose.model("Knowledge", KnowledgeSchema);

// === Endpoint: Health Check ===
router.get("/health", /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
    var mongoStatus, _redisStatus;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          logger.info("🔹 Health check started...");
          mongoStatus = "Disconnected";
          if (!(mongoose.connection.readyState === 1)) {
            _context3.next = 7;
            break;
          }
          mongoStatus = "Connected";
          _context3.next = 8;
          break;
        case 7:
          throw new Error("MongoDB not connected");
        case 8:
          _redisStatus = "Disconnected";
          _context3.next = 11;
          return redis.ping().then(function () {
            _redisStatus = "Connected";
          })["catch"](function (err) {
            throw new Error("Redis not connected: " + err.message);
          });
        case 11:
          logger.info("\u2705 MongoDB: ".concat(mongoStatus, ", Redis: ").concat(_redisStatus));
          res.json({
            status: "✅ Healthy",
            mongo: mongoStatus,
            redis: _redisStatus
          });
          _context3.next = 19;
          break;
        case 15:
          _context3.prev = 15;
          _context3.t0 = _context3["catch"](0);
          logger.error("\u274C Health check failed: ".concat(_context3.t0.message));
          res.status(500).json({
            error: "Service is unhealthy",
            details: _context3.t0.message
          });
        case 19:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 15]]);
  }));
  return function (_x3, _x4) {
    return _ref4.apply(this, arguments);
  };
}());

// === Endpoint: Recupero Dati da GitHub o MongoDB ===
router.get("/fetch", cacheMiddleware, /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
    var _req$query, source, file, query, repoUrl, response, fileResponse, data;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _req$query = req.query, source = _req$query.source, file = _req$query.file, query = _req$query.query;
          _context4.prev = 1;
          if (source) {
            _context4.next = 4;
            break;
          }
          return _context4.abrupt("return", res.status(400).json({
            error: "Missing source parameter."
          }));
        case 4:
          if (!(source === "github")) {
            _context4.next = 29;
            break;
          }
          if (file) {
            _context4.next = 7;
            break;
          }
          return _context4.abrupt("return", res.status(400).json({
            error: "Missing file parameter."
          }));
        case 7:
          // Log per verificare il valore delle variabili d'ambiente
          logger.info("\uD83D\uDD39 GitHub Owner: \"".concat(process.env.MY_GITHUB_OWNER, "\""));
          logger.info("\uD83D\uDD39 GitHub Repo: \"".concat(process.env.MY_GITHUB_REPO, "\""));

          // Controlla se le variabili sono effettivamente valorizzate
          if (!(!process.env.MY_GITHUB_OWNER || !process.env.MY_GITHUB_REPO)) {
            _context4.next = 11;
            break;
          }
          return _context4.abrupt("return", res.status(500).json({
            error: "Missing GitHub environment variables"
          }));
        case 11:
          repoUrl = "https://api.github.com/repos/".concat(process.env.MY_GITHUB_OWNER.trim(), "/").concat(process.env.MY_GITHUB_REPO.trim(), "/contents/").concat(file);
          logger.info("\uD83D\uDD39 Fetching from GitHub: ".concat(repoUrl));
          _context4.prev = 13;
          _context4.next = 16;
          return axios.get(repoUrl, {
            headers: {
              Authorization: "token ".concat(process.env.MY_GITHUB_TOKEN)
            },
            timeout: 5000
          });
        case 16:
          response = _context4.sent;
          if (response.data.download_url) {
            _context4.next = 19;
            break;
          }
          return _context4.abrupt("return", res.status(404).json({
            error: "GitHub API Error: File not found."
          }));
        case 19:
          _context4.next = 21;
          return axios.get(response.data.download_url, {
            timeout: 5000
          });
        case 21:
          fileResponse = _context4.sent;
          return _context4.abrupt("return", res.json({
            file: file,
            content: fileResponse.data
          }));
        case 25:
          _context4.prev = 25;
          _context4.t0 = _context4["catch"](13);
          logger.error("❌ Fetch Error:", _context4.t0.message);
          return _context4.abrupt("return", res.status(500).json({
            error: "Unexpected error fetching data",
            details: _context4.t0.message
          }));
        case 29:
          if (!(source === "mongodb")) {
            _context4.next = 38;
            break;
          }
          if (query) {
            _context4.next = 32;
            break;
          }
          return _context4.abrupt("return", res.status(400).json({
            error: "Missing query parameter."
          }));
        case 32:
          _context4.next = 34;
          return Knowledge.findOne({
            key: query
          });
        case 34:
          data = _context4.sent;
          if (data) {
            _context4.next = 37;
            break;
          }
          return _context4.abrupt("return", res.status(404).json({
            error: "No data found in MongoDB"
          }));
        case 37:
          return _context4.abrupt("return", res.json(data));
        case 38:
          return _context4.abrupt("return", res.status(400).json({
            error: "Invalid source parameter."
          }));
        case 41:
          _context4.prev = 41;
          _context4.t1 = _context4["catch"](1);
          logger.error("❌ Fetch Error:", _context4.t1.message);
          res.status(500).json({
            error: "Unexpected error fetching data",
            details: _context4.t1.message
          });
        case 45:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[1, 41], [13, 25]]);
  }));
  return function (_x5, _x6) {
    return _ref5.apply(this, arguments);
  };
}());

// === Esposizione dell'Endpoint Unified Access ===
app.use("/.netlify/functions/unifiedAccess", router);

// Aggiungere gestione della chiusura per liberare la porta
process.on("SIGINT", function () {
  logger.warn("⚠️ SIGINT received (CTRL+C). Closing server...");
  server.close(function () {
    logger.info("✅ Server closed. Exiting process.");
    process.exit(0);
  });
});
process.on("SIGTERM", function () {
  logger.warn("⚠️ SIGTERM received. Closing server...");
  server.close(function () {
    logger.info("✅ Server closed. Exiting process.");
    process.exit(0);
  });
});
module.exports = {
  app: app,
  handler: serverless(app),
  redis: redis
};