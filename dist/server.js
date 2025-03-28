"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
require("dotenv").config();
var express = require("express");
var mongoose = require("mongoose");
var serverless = require("serverless-http");
var rateLimit = require("express-rate-limit");
var cors = require("cors");
var timeout = require("connect-timeout");
var _require = require('node-nlp'),
  NlpManager = _require.NlpManager;
var manager = new NlpManager({
  languages: ['en'],
  forceNER: true,
  autoSave: false
});
var _require2 = require("../modules/nlp/nlpModel"),
  trainAndSaveNLP = _require2.trainAndSaveNLP,
  loadNLPModel = _require2.loadNLPModel,
  saveNLPModel = _require2.saveNLPModel,
  NLPModel = _require2.NLPModel,
  nlprocessText = _require2.nlprocessText;
//const winston = require("winston");
var _require3 = require("../config/redis"),
  redis = _require3.redis,
  quitRedis = _require3.quitRedis,
  cacheMiddleware = _require3.cacheMiddleware;
var fs = require("fs");
var path = require("path");
var _require4 = require("../modules/logging/logger"),
  logger = _require4.logger;
//logger.error("This is an error message");
logger.info("🔍 Using MONGO_URI:", process.env.MONGO_URI);
// Import dei moduli
//const { getIntent } = require("../modules/intent/intentRecognizer");
//const { generateResponse } = require("../modules/nlp/transformer");
//const { logConversation } = require("../modules/logging/logger");
//if (!process.env.NETLIFY) console.log(`🚀 Server running on port ${port}`);

// Inizializza il manager NLP
//const manager = new NlpManager({ languages: ["en"], autoSave: false, autoLoad: false });

// Configurazione del logger con Winston
//const logDir = process.env.NODE_ENV === "development" ? "/tmp/logs" : path.join(__dirname, "../logs");
//if (!fs.existsSync(logDir)) {
//  fs.mkdirSync(logDir, { recursive: true });
//}
//const logger = winston.createLogger({
//  level: "info",
//  format: winston.format.combine(
//    winston.format.timestamp(),
//    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
//  ),
//  transports: [
//    new winston.transports.Console(),
//    new winston.transports.File({
//      filename: path.join(logDir, "server.log"),
//      maxsize: 1024 * 1024 * 5, // Max 5MB
//      maxFiles: 3,
//      tailable: true
//    }),
//  ],
// });

// Crea l'app Express e il router

var app = express();
var router = express.Router();

// Middleware
app.set("trust proxy", true);
app.use(cors({
  origin: "https://helon.space",
  credentials: true
}));
app.use(express.json());
app.use(timeout("10s"));

// Rate Limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests. Please try again later.",
  keyGenerator: function keyGenerator(req) {
    return req.ip;
  }
}));

// ✅ Connessione a Redis
//console.log("🔹 REDIS_HOST:", process.env.REDIS_HOST);
//console.log("🔹 REDIS_PORT:", process.env.REDIS_PORT);
//console.log("🔹 REDIS_PASSWORD:", process.env.REDIS_PASSWORD ? "********" : "Not Set");
//const redis = new Redis({
//  host: process.env.REDIS_HOST,
//  port: process.env.REDIS_PORT,
//  password: process.env.REDIS_PASSWORD,
//  tls: {},
//  retryStrategy: (times) => {
//    if (times > 10) {
//      logger.error("❌ Too many Redis reconnection attempts. Stopping...");
//      return null;
//    }
//   return Math.min(times * 1000, 30000);
//  }
// });

//redis.on("connect", () => logger.info("✅ Connected to Redis successfully!"));
//redis.on("error", (err) => logger.error(`❌ Redis connection error: ${err.message}`));
//redis.on("end", () => {
//  logger.warn("⚠️ Redis connection closed. Reconnecting...");
//  setTimeout(() => redis.connect(), 5000);
//});

var mongoURI = process.env.MONGO_URI;
if (!mongoURI || !mongoURI.startsWith("mongodb")) {
  logger.error("❌ MONGO_URI non valido o non definito. Controlla le variabili d'ambiente.");
  process.exit(1); // Interrompe l'app se MONGO_URI è errato
}

// Avvia il server solo se non è in ambiente serverless
if (!process.env.NETLIFY) {
  var _server = app.listen(port, function () {
    logger.info("\uD83D\uDE80 Server running on port ".concat(_server.address().port));
  });

  // Connessione MongoDB con retry
  var _ref = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
        var attempts;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              attempts = 0;
            case 1:
              if (!(attempts < MAX_RETRIES)) {
                _context.next = 21;
                break;
              }
              if (!(mongoose.connection.readyState === 1)) {
                _context.next = 5;
                break;
              }
              logger.info("🔄 MongoDB already connected.");
              return _context.abrupt("return");
            case 5:
              _context.prev = 5;
              _context.next = 8;
              return mongoose.connect(mongoURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
              });
            case 8:
              logger.info("📚 Connected to MongoDB successfully!");
              return _context.abrupt("return");
            case 12:
              _context.prev = 12;
              _context.t0 = _context["catch"](5);
              logger.error("\u274C MongoDB connection error: ".concat(_context.t0.message));
            case 15:
              attempts++;
              logger.warn("\uD83D\uDD01 Retrying in ".concat(RETRY_DELAY / 1000, " seconds..."));
              _context.next = 19;
              return new Promise(function (resolve) {
                return setTimeout(resolve, RETRY_DELAY);
              });
            case 19:
              _context.next = 1;
              break;
            case 21:
              logger.error("🚨 Max retries reached. MongoDB connection failed.");
              throw new Error("MongoDB connection failed.");
            case 23:
            case "end":
              return _context.stop();
          }
        }, _callee, null, [[5, 12]]);
      }));
      return function _ref() {
        return _ref2.apply(this, arguments);
      };
    }(),
    _connectMongoDB = _ref.connectMongoDB;
  app.use(/*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res, next) {
      var modelData, _manager;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            if (!(mongoose.connection.readyState !== 1)) {
              _context2.next = 5;
              break;
            }
            logger.warn("⚠️ MongoDB not connected, attempting to reconnect...");
            _context2.next = 5;
            return _connectMongoDB();
          case 5:
            if (global.nlpModelCache) {
              _context2.next = 23;
              break;
            }
            logger.info("🔄 Loading NLP Model from database...");
            _context2.next = 9;
            return loadNLPModel();
          case 9:
            modelData = _context2.sent;
            if (!modelData) {
              _context2.next = 17;
              break;
            }
            _manager = new NlpManager({
              languages: ['en'],
              forceNER: true,
              autoSave: false
            });
            _manager["import"](modelData); // Importa i dati del modello
            global.nlpModelCache = _manager;
            logger.info("✅ NLP Model loaded into global cache.");
            _context2.next = 23;
            break;
          case 17:
            logger.warn("⚠️ No NLP Model found in database, training a new one...");
            _context2.next = 20;
            return trainAndSaveNLP();
          case 20:
            _context2.next = 22;
            return loadNLPModel();
          case 22:
            global.nlpModelCache = _context2.sent;
          case 23:
            if (global.nlpModelCache) {
              _context2.next = 26;
              break;
            }
            logger.error("❌ No NLP Model found in database. Train the model first.");
            return _context2.abrupt("return", res.status(500).json({
              error: "❌ No NLP Model found in database. Train the model first."
            }));
          case 26:
            req.nlpInstance = global.nlpModelCache;
            next();
            _context2.next = 34;
            break;
          case 30:
            _context2.prev = 30;
            _context2.t0 = _context2["catch"](0);
            logger.error("❌ Error loading NLP Model:", _context2.t0.message);
            return _context2.abrupt("return", res.status(500).json({
              error: "Internal Server Error",
              details: _context2.t0.message
            }));
          case 34:
          case "end":
            return _context2.stop();
        }
      }, _callee2, null, [[0, 30]]);
    }));
    return function (_x, _x2, _x3) {
      return _ref3.apply(this, arguments);
    };
  }());

  // Endpoint /health aggiornato con log dettagliati (il resto rimane invariato)
  router.get("/health", /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
      var mongoStatus;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
            _context3.prev = 1;
            if (!(mongoose.connection.readyState !== 1)) {
              _context3.next = 6;
              break;
            }
            _context3.next = 5;
            return _connectMongoDB();
          case 5:
            mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
          case 6:
            _context3.next = 11;
            break;
          case 8:
            _context3.prev = 8;
            _context3.t0 = _context3["catch"](1);
            logger.error("MongoDB health check failed:", _context3.t0.message);
          case 11:
            res.json({
              status: "✅ Healthy",
              mongo: mongoStatus
            });
          case 12:
          case "end":
            return _context3.stop();
        }
      }, _callee3, null, [[1, 8]]);
    }));
    return function (_x4, _x5) {
      return _ref4.apply(this, arguments);
    };
  }());
  app.use("/.netlify/functions/server", router);
  var port = process.env.PORT || 3000; // Imposta un valore di default
  console.log("\uD83D\uDE80 Server running on port ".concat(port));
  if (!process.env.NETLIFY) {
    var _server2 = app.listen(port, function () {
      logger.info("\uD83D\uDE80 Server running on port ".concat(_server2.address().port));
    });

    // Gestione della chiusura
    process.on("SIGTERM", function () {
      logger.warn("⚠️ SIGTERM received. Closing server...");
      _server2.close(function () {
        logger.info("✅ Server closed.");
        process.exit(0);
      });
    });
    process.on("SIGINT", function () {
      logger.warn("⚠️ SIGINT received. Closing server...");
      _server2.close(function () {
        logger.info("✅ Server closed.");
        process.exit(0);
      });
    });
  }

  // Gestione della chiusura per evitare porte bloccate
  process.on("SIGTERM", function () {
    logger.warn("⚠️ SIGTERM received. Closing server...");
    _server.close(function () {
      logger.info("✅ Server closed. Exiting process.");
      process.exit(0);
    });
  });
  process.on("SIGINT", function () {
    logger.warn("⚠️ SIGINT received (CTRL+C). Closing server...");
    _server.close(function () {
      logger.info("✅ Server closed. Exiting process.");
      process.exit(0);
    });
  });
}

// Schema & Model per Knowledge Base
var questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    unique: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  source: {
    type: String,
    "default": "Ultron AI"
  },
  createdAt: {
    type: Date,
    "default": Date.now
  }
});
var Question = mongoose.models.Question || mongoose.model("Question", questionSchema);

// Schema per NLP Model
//const NLPModelSchema = new mongoose.Schema({
//  modelData: { type: Object, required: true },
//});
//const NLPModel = mongoose.models.NLPModel || mongoose.model("NLPModel", NLPModelSchema);

// Funzione per allenare e salvare il modello NLP
//async function trainAndSaveNLP() {
//  manager.addDocument("en", "hello", "greeting");
//  await manager.train();
//  await saveNLPModel(manager.export());
//  logger.info("✅ New NLP Model trained and saved!");
//}

// Inizializza il modello NLP
_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
  var savedModel;
  return _regeneratorRuntime().wrap(function _callee4$(_context4) {
    while (1) switch (_context4.prev = _context4.next) {
      case 0:
        _context4.prev = 0;
        _context4.next = 3;
        return connectMongoDB();
      case 3:
        _context4.next = 5;
        return loadNLPModel();
      case 5:
        savedModel = _context4.sent;
        if (!savedModel) {
          _context4.next = 11;
          break;
        }
        manager["import"](savedModel);
        logger.info("🧠 NLP Model Loaded from DB");
        _context4.next = 13;
        break;
      case 11:
        _context4.next = 13;
        return trainAndSaveNLP();
      case 13:
        _context4.next = 18;
        break;
      case 15:
        _context4.prev = 15;
        _context4.t0 = _context4["catch"](0);
        logger.error("❌ Error initializing NLP model:", _context4.t0);
      case 18:
      case "end":
        return _context4.stop();
    }
  }, _callee4, null, [[0, 15]]);
}))();

// Endpoint per gestire le domande degli utenti
router.post("/logQuestion", /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
    var question, storedAnswer, intentResult, finalAnswer;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          question = req.body.question;
          if (question) {
            _context5.next = 4;
            break;
          }
          return _context5.abrupt("return", res.status(400).json({
            error: "Question is required"
          }));
        case 4:
          _context5.next = 6;
          return Question.findOne({
            question: question
          });
        case 6:
          storedAnswer = _context5.sent;
          if (!storedAnswer) {
            _context5.next = 9;
            break;
          }
          return _context5.abrupt("return", res.json({
            answer: storedAnswer.answer,
            source: storedAnswer.source
          }));
        case 9:
          _context5.next = 11;
          return manager.process("en", question);
        case 11:
          intentResult = _context5.sent;
          if (intentResult.answer) {
            _context5.next = 14;
            break;
          }
          return _context5.abrupt("return", res.status(404).json({
            error: "No answer available for this question."
          }));
        case 14:
          finalAnswer = intentResult.answer;
          _context5.next = 17;
          return new Question({
            question: question,
            answer: finalAnswer,
            source: "Ultron AI"
          }).save();
        case 17:
          res.json({
            answer: finalAnswer,
            source: "Ultron AI"
          });
          _context5.next = 24;
          break;
        case 20:
          _context5.prev = 20;
          _context5.t0 = _context5["catch"](0);
          logger.error("\u274C Error processing question: ".concat(_context5.t0.message));
          res.status(500).json({
            error: "Server error",
            details: _context5.t0.message
          });
        case 24:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 20]]);
  }));
  return function (_x6, _x7) {
    return _ref6.apply(this, arguments);
  };
}());

// Endpoint per NLP
router.post("/api/nlp", /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
    var question;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          question = req.body.question;
          if (question) {
            _context6.next = 4;
            break;
          }
          return _context6.abrupt("return", res.status(400).json({
            error: "Question is required"
          }));
        case 4:
          return _context6.abrupt("return", res.json({
            answer: response
          }));
        case 7:
          _context6.prev = 7;
          _context6.t0 = _context6["catch"](0);
          logger.error("\u274C Error processing NLP request: ".concat(_context6.t0.message));
          return _context6.abrupt("return", res.status(500).json({
            error: "Server error",
            details: _context6.t0.message
          }));
        case 11:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 7]]);
  }));
  return function (_x8, _x9) {
    return _ref7.apply(this, arguments);
  };
}());

// ✅ Nuovi endpoint: /fetch, /store, /download
router.get("/fetch", /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
    var _req$query, source, file, query;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _req$query = req.query, source = _req$query.source, file = _req$query.file, query = _req$query.query;
          if (!(source === "github")) {
            _context7.next = 5;
            break;
          }
          return _context7.abrupt("return", res.json({
            data: "Simulated content from GitHub for ".concat(file)
          }));
        case 5:
          if (!(source === "mongodb")) {
            _context7.next = 9;
            break;
          }
          return _context7.abrupt("return", res.json({
            data: {
              key: query,
              value: "Simulated MongoDB data"
            }
          }));
        case 9:
          return _context7.abrupt("return", res.status(400).json({
            error: "Unrecognized source"
          }));
        case 10:
        case "end":
          return _context7.stop();
      }
    }, _callee7);
  }));
  return function (_x10, _x11) {
    return _ref8.apply(this, arguments);
  };
}());

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
  redis: redis,
  connectMongoDB: connectMongoDB
};