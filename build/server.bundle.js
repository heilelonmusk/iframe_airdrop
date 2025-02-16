/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./api/server.js":
/*!***********************!*\
  !*** ./api/server.js ***!
  \***********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("/* module decorator */ module = __webpack_require__.nmd(module);\n(__webpack_require__(/*! dotenv */ \"dotenv\").config)();\nconst express = __webpack_require__(/*! express */ \"express\");\nconst mongoose = __webpack_require__(/*! mongoose */ \"mongoose\");\nconst serverless = __webpack_require__(/*! serverless-http */ \"serverless-http\");\nconst rateLimit = __webpack_require__(/*! express-rate-limit */ \"express-rate-limit\");\nconst cors = __webpack_require__(/*! cors */ \"cors\");\nconst timeout = __webpack_require__(/*! connect-timeout */ \"connect-timeout\");\nconst { NlpManager } = __webpack_require__(/*! node-nlp */ \"node-nlp\");\nconst winston = __webpack_require__(/*! winston */ \"winston\");\nconst Redis = __webpack_require__(/*! ioredis */ \"ioredis\");\nconst fs = __webpack_require__(/*! fs */ \"fs\");\nconst path = __webpack_require__(/*! path */ \"path\");\nconst port = process.env.PORT || 8889;\n\nconst { getIntent } = __webpack_require__(/*! ../modules/intent/intentRecognizer */ \"./modules/intent/intentRecognizer.js\");\nconst { loadNLPModel, saveNLPModel } = __webpack_require__(/*! ../modules/nlp/nlpModel */ \"./modules/nlp/nlpModel.js\");\nconst { generateResponse } = __webpack_require__(/*! ../modules/nlp/transformer */ \"./modules/nlp/transformer.js\");\nconst { logConversation } = __webpack_require__(/*! ../modules/logging/logger */ \"./modules/logging/logger.js\");\n\nconst manager = new NlpManager({ languages: [\"en\"], autoSave: false, autoLoad: false });\n\n// Usa \"/tmp/logs\" in produzione, altrimenti \"../logs\"\nconst logDir =  true ? \"/tmp/logs\" : 0;\nif (!fs.existsSync(logDir)) {\n  fs.mkdirSync(logDir, { recursive: true });\n}\n\n// Configurazione del logger con Winston\nconst logger = winston.createLogger({\n  level: \"info\",\n  format: winston.format.combine(\n    winston.format.timestamp(),\n    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)\n  ),\n  transports: [\n    new winston.transports.Console(),\n    new winston.transports.File({ filename: path.join(logDir, \"server.log\") }),\n  ],\n});\n\nconst app = express();\nconst router = express.Router();\n\n// Middleware\napp.set(\"trust proxy\", true);\napp.use(cors({ origin: \"https://helon.space\", credentials: true }));\napp.use(express.json());\napp.use(timeout(\"10s\"));\n\n// Rate Limiting\napp.use(\n  rateLimit({\n    windowMs: 60 * 1000,\n    max: 10,\n    message: \"Too many requests. Please try again later.\",\n    keyGenerator: (req) => req.ip,\n  })\n);\n\n// ✅ Connessione a Redis\nconsole.log(\"🔹 REDIS_HOST:\", process.env.REDIS_HOST);\nconsole.log(\"🔹 REDIS_PORT:\", process.env.REDIS_PORT);\nconsole.log(\"🔹 REDIS_PASSWORD:\", process.env.REDIS_PASSWORD ? \"********\" : \"Not Set\");\nconst redis = new Redis({\n  host: process.env.REDIS_HOST,\n  port: process.env.REDIS_PORT,\n  password: process.env.REDIS_PASSWORD,\n  tls: {},\n  retryStrategy: (times) => (times > 5 ? null : Math.min(times * 500, 30000)),\n});\n\nredis.on(\"connect\", () => logger.info(\"✅ Connected to Redis successfully!\"));\nredis.on(\"error\", (err) => logger.error(`❌ Redis connection error: ${err.message}`));\nredis.on(\"end\", () => {\n  logger.warn(\"⚠️ Redis connection closed. Reconnecting...\");\n  setTimeout(() => redis.connect(), 5000);\n});\n\n// ✅ Connessione a MongoDB con gestione della riconnessione\nconst connectMongoDB = async () => {\n  console.log(\"🔹 MONGO_URI in Netlify:\", process.env.MONGO_URI);\n  mongoose.set('debug', true); // Logga le query su MongoDB\n  try {\n    await mongoose.connect(process.env.MONGO_URI, {\n      useNewUrlParser: true,\n      useUnifiedTopology: true,\n      serverSelectionTimeoutMS: 50000, // ⬆️ Timeout aumentato per selezione del server\n      socketTimeoutMS: 60000,\n      connectTimeoutMS: 60000\n    });\n    logger.info(\"📚 Connected to MongoDB\");\n  } catch (err) {\n    logger.error(`❌ MongoDB connection error: ${err.message}`);\n  \n\n    // 🛠 Riprova la connessione dopo 5 secondi invece di chiudere il processo\n    setTimeout(connectMongoDB, 5000);\n  }\n};\n\n// 🔄 Avvia la connessione iniziale\nconnectMongoDB();\n\n// ✅ Listener per gestione errori\nmongoose.connection.on(\"error\", (err) => {\n  logger.error(`❌ Mongoose connection error: ${err.message}`);\n});\n\n// ✅ Listener per gestione disconnessione e riconnessione\nmongoose.connection.on(\"disconnected\", async () => {\n  logger.warn(\"⚠️ MongoDB disconnected. Trying to reconnect in 5s...\");\n  setTimeout(connectMongoDB, 5000);  // ⏳ Aspetta prima di riconnettersi\n});\n\n// ✅ Health Check\nrouter.get(\"/health\", async (req, res) => {\n  try {\n    logger.info(\"🔹 Health check started...\");\n\n    const mongoStatus = mongoose.connection.readyState === 1 ? \"Connected\" : \"Disconnected\";\n    logger.info(`🔹 MongoDB Status: ${mongoStatus}`);  // <== AGGIUNTA LOG DI DEBUG\n\n    let redisStatus = \"Disconnected\";\n    if (redis.status === \"ready\") {\n      redisStatus = await redis.ping()\n        .then((res) => (res === \"PONG\" ? \"Connected\" : \"Disconnected\"))\n        .catch(() => \"Disconnected\");\n    }\n\n    res.json({ status: \"✅ Healthy\", mongo: mongoStatus, redis: redisStatus });\n  } catch (error) {\n    logger.error(`❌ Health check failed: ${error.message}`);\n    res.status(500).json({ error: \"Service is unhealthy\", details: error.message });\n  }\n});\n\napp.use(\"/.netlify/functions/server\", router);\n\n// Schema & Model per Knowledge Base\nconst questionSchema = new mongoose.Schema({\n  question: { type: String, required: true, unique: true },\n  answer: { type: mongoose.Schema.Types.Mixed, required: true },\n  source: { type: String, default: \"Ultron AI\" },\n  createdAt: { type: Date, default: Date.now },\n});\nconst Question = mongoose.models.Question || mongoose.model(\"Question\", questionSchema);\n\n// Schema per NLP Model\nconst NLPModelSchema = new mongoose.Schema({\n  modelData: { type: Object, required: true },\n});\nconst NLPModel = mongoose.models.NLPModel || mongoose.model(\"NLPModel\", NLPModelSchema);\n\n// Inizializza il modello NLP\n(async () => {\n  try {\n    const savedModel = await loadNLPModel();\n    if (savedModel) {\n      manager.import(savedModel);\n      logger.info(\"🧠 NLP Model Loaded from DB\");\n    } else {\n      await trainAndSaveNLP();\n    }\n  } catch (error) {\n    logger.error(\"❌ Error initializing NLP model:\", error);\n  }\n})();\n\n// Funzione per allenare e salvare il modello NLP\nasync function trainAndSaveNLP() {\n  manager.addDocument(\"en\", \"hello\", \"greeting\");\n  await manager.train();\n  await saveNLPModel(manager.export());\n  logger.info(\"✅ New NLP Model trained and saved!\");\n}\n\n// Endpoint per gestire le domande degli utenti\nrouter.post(\"/logQuestion\", async (req, res) => {\n  try {\n    const { question, userId } = req.body;\n    if (!question) return res.status(400).json({ error: \"Question is required\" });\n    const storedAnswer = await Question.findOne({ question });\n    if (storedAnswer) return res.json({ answer: storedAnswer.answer, source: storedAnswer.source });\n    const intentResult = await manager.process(\"en\", question);\n    const finalAnswer = intentResult.answer || \"I'm not sure how to answer that yet.\";\n    await new Question({ question, answer: finalAnswer, source: \"Ultron AI\" }).save();\n    res.json({ answer: finalAnswer, source: \"Ultron AI\" });\n  } catch (error) {\n    res.status(500).json({ error: \"Server error\" });\n  }\n});\n\n// ✅ Nuovi endpoint: /fetch, /store, /download\nrouter.get(\"/fetch\", async (req, res) => {\n  const { source, file, query } = req.query;\n  if (source === \"github\") {\n    return res.json({ data: `Simulated content from GitHub for ${file}` });\n  } else if (source === \"mongodb\") {\n    return res.json({ data: { key: query, value: \"Simulated MongoDB data\" } });\n  } else {\n    return res.status(400).json({ error: \"Unrecognized source\" });\n  }\n});\n\nif (__webpack_require__.c[__webpack_require__.s] === module) {\n  app.listen(8889, () => logger.info(\"Server running on port 8889\"));\n}\n\nmodule.exports = { app, handler: serverless(app) };\n\n\n//# sourceURL=webpack://iframe_airdrop/./api/server.js?");

/***/ }),

/***/ "./modules/intent/intentRecognizer.js":
/*!********************************************!*\
  !*** ./modules/intent/intentRecognizer.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("(__webpack_require__(/*! dotenv */ \"dotenv\").config)();\nconst { NlpManager } = __webpack_require__(/*! node-nlp */ \"node-nlp\");\nconst { saveNLPModel, loadNLPModel } = __webpack_require__(/*! ../nlp/nlpModel */ \"./modules/nlp/nlpModel.js\");\n\nconst manager = new NlpManager({ languages: ['en'], forceNER: true, autoSave: false });\n\n// ✅ **Predefined Intents & Responses**\nconst predefinedIntents = {\n  \"greeting\": \"Hello! How can I assist you today?\",\n  \"farewell\": \"Goodbye! Have a great day!\",\n  \"channels\": \"Here are the official channels:\\n- Twitter: https://x.com/heilelon_\\n- Instagram: https://instagram.com/heil.elonmusk\\n- Telegram: https://t.me/heil_elon\",\n  \"help\": \"I can help you with information about Helon, its ecosystem, and tokens. Just ask!\"\n};\n\n// ✅ **Train NLP Model**\nasync function trainNLP() {\n  console.log(\"🧠 Training NLP Model...\");\n\n  manager.addDocument('en', 'hello', 'greeting');\n  manager.addDocument('en', 'hi there', 'greeting');\n  manager.addDocument('en', 'goodbye', 'farewell');\n  manager.addDocument('en', 'bye', 'farewell');\n  manager.addDocument('en', 'where can I find official channels?', 'channels');\n  manager.addDocument('en', 'how can I contact Helon?', 'channels');\n  manager.addDocument('en', 'help', 'help');\n  manager.addDocument('en', 'what can you do?', 'help');\n\n  await manager.train();\n  console.log(\"✅ NLP Model Trained Successfully!\");\n\n  const exportedModel = manager.export();\n  await saveNLPModel(exportedModel);\n  console.log(\"✅ NLP Model saved in MongoDB\");\n}\n\n// ✅ **Intent Recognition Function**\nasync function getIntent(question) {\n  console.log(`🔍 Analyzing intent for: \"${question}\"`);\n\n  const result = await manager.process('en', question);\n  \n  if (result.intent && result.score > 0.7) {\n    console.log(`✅ Intent Detected: \"${result.intent}\" (Score: ${result.score})`);\n    \n    if (predefinedIntents[result.intent]) {\n      return { intent: result.intent, answer: predefinedIntents[result.intent], score: result.score };\n    }\n    \n    return { intent: result.intent, answer: null, score: result.score };\n  }\n\n  console.warn(\"⚠ Unrecognized Intent - Fallback Triggered.\");\n  return { intent: \"unknown\", answer: \"I'm not sure how to answer that yet. Try rephrasing?\", score: 0 };\n}\n\n// ✅ **Train Model on Startup**\nasync function initializeNLP() {\n  const savedModel = await loadNLPModel();\n  if (savedModel) {\n    manager.import(savedModel);\n    console.log(\"🧠 NLP Model Loaded from DB\");\n  } else {\n    console.log(\"🚀 Training new NLP Model...\");\n    await trainNLP();\n  }\n}\n\nmodule.exports = { getIntent, initializeNLP };\n\n//# sourceURL=webpack://iframe_airdrop/./modules/intent/intentRecognizer.js?");

/***/ }),

/***/ "./modules/logging/logger.js":
/*!***********************************!*\
  !*** ./modules/logging/logger.js ***!
  \***********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("(__webpack_require__(/*! dotenv */ \"dotenv\").config)();\nconst mongoose = __webpack_require__(/*! mongoose */ \"mongoose\");\n\nconst LOG_RETENTION_DAYS = 30; // Auto-delete logs older than this\nconst MONGO_URI = process.env.MONGO_URI;\n\nif (!MONGO_URI) {\n  console.error(\"❌ ERROR: MONGO_URI is missing! Logging is disabled.\");\n  process.exit(1);\n}\n\n// Connessione a MongoDB per il logging\nmongoose.connect(MONGO_URI, { \n  useNewUrlParser: true,\n  useUnifiedTopology: true\n})\n  .then(() => console.log(\"📜 Connected to MongoDB for logging\"))\n  .catch(err => {\n    console.error(\"❌ MongoDB connection error:\", err);\n    process.exit(1);\n  });\n\n// Schema per il logging delle conversazioni\nconst logSchema = new mongoose.Schema({\n  userId: { type: String, default: \"anonymous\" },\n  question: { type: String, required: true },\n  answer: { type: String, required: true }, // Salvato sempre come stringa (JSON)\n  detectedIntent: { type: String },\n  confidence: { type: Number },\n  timestamp: { type: Date, default: Date.now }\n});\n\n// Creazione del modello ConversationLog\nconst ConversationLog = mongoose.models.ConversationLog || mongoose.model('ConversationLog', logSchema);\n\n// Funzione per loggare una conversazione\nasync function logConversation({ userId, question, answer, detectedIntent, confidence }) {\n  try {\n    const logEntry = new ConversationLog({\n      userId,\n      question,\n      answer: typeof answer === \"string\" ? answer : JSON.stringify(answer),\n      detectedIntent,\n      confidence\n    });\n\n    await logEntry.save();\n    console.log(\"📝 Conversation logged successfully.\");\n  } catch (error) {\n    console.error(\"❌ Error logging conversation:\", error);\n  }\n}\n\n// Funzione per recuperare le domande più frequenti\nasync function getFrequentQuestions(limit = 5) {\n  try {\n    const results = await ConversationLog.aggregate([\n      { $group: { _id: \"$question\", count: { $sum: 1 } } },\n      { $sort: { count: -1 } },\n      { $limit: limit }\n    ]);\n\n    if (!Array.isArray(results)) {\n      console.error(\"❌ Expected aggregation results to be an array, got:\", results);\n      return [];\n    }\n    \n    return results.map(q => ({ question: q._id, count: q.count }));\n  } catch (error) {\n    console.error(\"❌ Error retrieving frequent questions:\", error);\n    return [];\n  }\n}\n\n// Funzione per eliminare automaticamente i log vecchi (Retention Policy)\nasync function cleanupOldLogs() {\n  try {\n    const cutoff = new Date();\n    cutoff.setDate(cutoff.getDate() - LOG_RETENTION_DAYS);\n    const result = await ConversationLog.deleteMany({ timestamp: { $lt: cutoff } });\n    console.log(`🗑 Deleted ${result.deletedCount} old log entries.`);\n  } catch (error) {\n    console.error(\"❌ Error deleting old logs:\", error);\n  }\n}\n\n// Pianifica la pulizia dei log ogni 24 ore\nsetInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);\n\nmodule.exports = { logConversation, getFrequentQuestions };\n\n//# sourceURL=webpack://iframe_airdrop/./modules/logging/logger.js?");

/***/ }),

/***/ "./modules/nlp/nlpModel.js":
/*!*********************************!*\
  !*** ./modules/nlp/nlpModel.js ***!
  \*********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const mongoose = __webpack_require__(/*! mongoose */ \"mongoose\");\n\n//\nconst NLPModelSchema = new mongoose.Schema({\n  modelData: { type: Object, required: true }\n});\n\nconst NLPModel = mongoose.models.NLPModel || mongoose.model('NLPModel', NLPModelSchema);\n\n// ✅ \nasync function loadNLPModel() {\n  try {\n    const savedModel = await NLPModel.findOne({});\n    if (savedModel && savedModel.modelData) {\n      console.log(\"✅ NLP Model loaded from MongoDB\");\n      return savedModel.modelData;\n    }\n    console.log(\"⚠️ No NLP Model found in database. Training required.\");\n    return null;\n  } catch (error) {\n    console.error(\"❌ Error loading NLP model from MongoDB:\", error);\n    return null;\n  }\n}\n\n// ✅\nasync function saveNLPModel(modelData) {\n  try {\n    await NLPModel.updateOne({}, { modelData }, { upsert: true });\n    console.log(\"✅ NLP Model saved in MongoDB\");\n  } catch (error) {\n    console.error(\"❌ Error saving NLP model:\", error);\n  }\n}\n\nmodule.exports = { loadNLPModel, saveNLPModel };\n\n\n//# sourceURL=webpack://iframe_airdrop/./modules/nlp/nlpModel.js?");

/***/ }),

/***/ "./modules/nlp/transformer.js":
/*!************************************!*\
  !*** ./modules/nlp/transformer.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("(__webpack_require__(/*! dotenv */ \"dotenv\").config)();\nconst OpenAI = __webpack_require__(/*! openai */ \"openai\");\nconst mongoose = __webpack_require__(/*! mongoose */ \"mongoose\");\n\n// ✅ Load OpenAI API key\nconst openai = new OpenAI({\n  apiKey: process.env.OPENAI_API_KEY,\n});\n\nconst MONGO_URI = process.env.MONGO_URI;\n\nif (!MONGO_URI) {\n  console.error(\"❌ ERROR: MONGO_URI is missing! Knowledge Base will not function.\");\n  process.exit(1);\n}\n\nmongoose.connect(MONGO_URI)\n  .then(() => console.log(\"📚 Connected to MongoDB for Knowledge Base\"))\n  .catch(err => console.error(\"❌ MongoDB connection error:\", err));\n\n// ✅ **Knowledge Base Schema**\nconst knowledgeSchema = new mongoose.Schema({\n  question: { type: String, required: true, unique: true },\n  answer: { type: String, required: true },\n  source: { type: String, default: \"Knowledge Base\" },\n  createdAt: { type: Date, default: Date.now }\n});\n\nconst Knowledge = mongoose.models.Knowledge || mongoose.model(\"Knowledge\", knowledgeSchema);\n\n// ✅ **Check Knowledge Base Before Calling GPT**\nasync function getAnswerFromKnowledgeBase(question) {\n  try {\n    const result = await Knowledge.findOne({ question: new RegExp(`^${question}$`, 'i') });\n    if (result) {\n      console.log(`📖 Answer found in Knowledge Base for: \"${question}\"`);\n      return { answer: result.answer, source: result.source };\n    }\n    return null;\n  } catch (error) {\n    console.error(\"❌ Error querying Knowledge Base:\", error);\n    return null;\n  }\n}\n\n// ✅ **Generate AI Response Using GPT (if needed)**\nasync function generateResponse(question) {\n  try {\n    // 🔹 Step 1: First check the Knowledge Base\n    const knowledgeResponse = await getAnswerFromKnowledgeBase(question);\n    if (knowledgeResponse) return knowledgeResponse;\n\n    // 🔹 Step 2: If not found, ask GPT-3.5\n    console.log(`🤖 Querying GPT-3.5 for: \"${question}\"`);\n    const response = await openai.chat.completions.create({\n      model: \"gpt-3.5-turbo\",  // Using cost-effective model\n      messages: [{ role: \"user\", content: question }],\n      max_tokens: 100,  // Limits response length to reduce token usage\n      temperature: 0.7,\n    });\n\n    const answer = response.choices[0]?.message?.content?.trim();\n    if (!answer) throw new Error(\"Empty response from GPT\");\n\n    // 🔹 Step 3: Store AI-generated response in Knowledge Base\n    const newEntry = new Knowledge({ question, answer, source: \"GPT-3.5\" });\n    await newEntry.save();\n    console.log(\"✅ Saved GPT response to Knowledge Base.\");\n\n    return { answer, source: \"GPT-3.5\" };\n  } catch (error) {\n    console.error(\"❌ OpenAI API Error:\", error.response ? error.response.data : error);\n    return { answer: \"Sorry, I'm having trouble processing your request.\", source: \"Ultron AI\" };\n  }\n}\n\nmodule.exports = { generateResponse };\n\n//# sourceURL=webpack://iframe_airdrop/./modules/nlp/transformer.js?");

/***/ }),

/***/ "connect-timeout":
/*!**********************************!*\
  !*** external "connect-timeout" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("connect-timeout");

/***/ }),

/***/ "cors":
/*!***********************!*\
  !*** external "cors" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("cors");

/***/ }),

/***/ "dotenv":
/*!*************************!*\
  !*** external "dotenv" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("dotenv");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("express");

/***/ }),

/***/ "express-rate-limit":
/*!*************************************!*\
  !*** external "express-rate-limit" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = require("express-rate-limit");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "ioredis":
/*!**************************!*\
  !*** external "ioredis" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("ioredis");

/***/ }),

/***/ "mongoose":
/*!***************************!*\
  !*** external "mongoose" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("mongoose");

/***/ }),

/***/ "node-nlp":
/*!***************************!*\
  !*** external "node-nlp" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("node-nlp");

/***/ }),

/***/ "openai":
/*!*************************!*\
  !*** external "openai" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("openai");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "serverless-http":
/*!**********************************!*\
  !*** external "serverless-http" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("serverless-http");

/***/ }),

/***/ "winston":
/*!**************************!*\
  !*** external "winston" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("winston");

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
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	var __webpack_exports__ = __webpack_require__(__webpack_require__.s = "./api/server.js");
/******/ 	
/******/ })()
;