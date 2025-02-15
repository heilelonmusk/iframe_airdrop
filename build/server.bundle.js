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

eval("/* module decorator */ module = __webpack_require__.nmd(module);\n(__webpack_require__(/*! dotenv */ \"dotenv\").config)();\nconst express = __webpack_require__(/*! express */ \"express\");\nconst mongoose = __webpack_require__(/*! mongoose */ \"mongoose\");\nconst serverless = __webpack_require__(/*! serverless-http */ \"serverless-http\");\nconst rateLimit = __webpack_require__(/*! express-rate-limit */ \"express-rate-limit\");\nconst cors = __webpack_require__(/*! cors */ \"cors\");\nconst timeout = __webpack_require__(/*! connect-timeout */ \"connect-timeout\");\nconst { NlpManager } = __webpack_require__(/*! node-nlp */ \"node-nlp\");\nconst winston = __webpack_require__(/*! winston */ \"winston\");\nconst fs = __webpack_require__(/*! fs */ \"fs\");\nconst path = __webpack_require__(/*! path */ \"path\");\n\n// Usa \"/tmp/logs\" in produzione, altrimenti \"../logs\"\nconst logDir = ( false) ? 0 : path.join(__dirname, \"../logs\");\nif (!fs.existsSync(logDir)) {\n  fs.mkdirSync(logDir, { recursive: true });\n}\n\n// Configurazione del logger con Winston\nconst logger = winston.createLogger({\n  level: \"info\",\n  format: winston.format.combine(\n    winston.format.timestamp(),\n    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)\n  ),\n  transports: [\n    new winston.transports.Console(),\n    new winston.transports.File({ filename: path.join(logDir, \"server.log\") }),\n  ],\n});\n\nlogger.info(`NODE_ENV = ${\"development\"}`);\nlogger.info(`Log directory: ${logDir}`);\n\nconst { initializeNLP, getIntent } = __webpack_require__(/*! ../modules/intent/intentRecognizer */ \"./modules/intent/intentRecognizer.js\");\nconst { loadNLPModel, saveNLPModel } = __webpack_require__(/*! ../modules/nlp/nlpModel */ \"./modules/nlp/nlpModel.js\");\nconst { generateResponse } = __webpack_require__(/*! ../modules/nlp/transformer */ \"./modules/nlp/transformer.js\");\nconst { logConversation } = __webpack_require__(/*! ../modules/logging/logger */ \"./modules/logging/logger.js\");\n\nconst app = express();\nconst router = express.Router();\nconst manager = new NlpManager({ languages: [\"en\"], autoSave: false, autoLoad: false });\n\n// Middleware\napp.use(cors({ origin: \"https://helon.space\", credentials: true }));\napp.use(express.json());\napp.use(timeout(\"10s\"));\n\n// Rate Limiting\napp.set(\"trust proxy\", 1);\napp.use(\n  rateLimit({\n    windowMs: 60 * 1000, // 1 minuto\n    max: 10,\n    message: \"Too many requests. Please try again later.\",\n    keyGenerator: (req) => req.headers[\"x-forwarded-for\"]?.split(\",\")[0] || req.ip || \"unknown-ip\",\n  })\n);\n\n// ✅ MongoDB Connection\nconst MONGO_URI = process.env.MONGO_URI;\nif (!MONGO_URI) {\n  logger.error(\"❌ ERROR: MONGO_URI is missing! API will not function.\");\n  process.exit(1);\n}\n\n(async () => {\n  try {\n    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });\n    logger.info(\"📚 Connected to MongoDB\");\n    logger.info(`Mongoose readyState: ${mongoose.connection.readyState}`);\n  } catch (err) {\n    logger.error(\"❌ MongoDB connection error:\", err.message);\n    process.exit(1);\n  }\n})();\n\n// Ascolta eventuali errori nella connessione\nmongoose.connection.on(\"error\", (err) => {\n  logger.error(\"❌ Mongoose connection error:\", err.message);\n});\n\n// Schema & Model per Knowledge Base\nconst questionSchema = new mongoose.Schema({\n  question: { type: String, required: true, unique: true },\n  answer: { type: mongoose.Schema.Types.Mixed, required: true },\n  source: { type: String, default: \"Ultron AI\" },\n  createdAt: { type: Date, default: Date.now },\n});\nconst Question = mongoose.models.Question || mongoose.model(\"Question\", questionSchema);\n\n// Schema per NLP Model\nconst NLPModelSchema = new mongoose.Schema({\n  modelData: { type: Object, required: true },\n});\nconst NLPModel = mongoose.models.NLPModel || mongoose.model(\"NLPModel\", NLPModelSchema);\n\n// Inizializza il modello NLP\n(async () => {\n  try {\n    const savedModel = await loadNLPModel();\n    if (savedModel && Object.keys(savedModel).length > 0) {\n      manager.import(savedModel);\n      logger.info(\"🧠 NLP Model Loaded from DB\");\n    } else {\n      logger.info(\"🚀 Training new NLP Model...\");\n      await trainAndSaveNLP();\n    }\n  } catch (error) {\n    logger.error(\"❌ Error initializing NLP model:\", error);\n  }\n})();\n\n// Funzione per allenare e salvare il modello NLP\nasync function trainAndSaveNLP() {\n  manager.addDocument(\"en\", \"hello\", \"greeting\");\n  manager.addDocument(\"en\", \"hi there\", \"greeting\");\n  manager.addDocument(\"en\", \"goodbye\", \"farewell\");\n  manager.addDocument(\"en\", \"bye\", \"farewell\");\n  manager.addDocument(\"en\", \"where can I find official channels?\", \"channels\");\n  manager.addDocument(\"en\", \"how can I contact Helon?\", \"channels\");\n  manager.addDocument(\"en\", \"help\", \"help\");\n  manager.addDocument(\"en\", \"what can you do?\", \"help\");\n\n  await manager.train();\n  const exportedModel = manager.export();\n  await saveNLPModel(exportedModel);\n  logger.info(\"✅ New NLP Model trained and saved!\");\n}\n\n// Endpoint per gestire le domande degli utenti\nrouter.post(\"/logQuestion\", async (req, res) => {\n  try {\n    const { question, userId } = req.body;\n    if (!question) return res.status(400).json({ error: \"Question is required\" });\n\n    logger.info(`📩 Received question: \"${question}\"`);\n    const anonymousUser = userId || \"anonymous\";\n\n    // Cerca la risposta nel DB\n    let storedAnswer = await Question.findOne({ question });\n    if (storedAnswer) {\n      logger.info(`✅ Found answer in DB: ${JSON.stringify(storedAnswer.answer)}`);\n\n      let safeAnswer = storedAnswer.answer || \"No answer found.\";\n      let safeSource = storedAnswer.source || \"Ultron AI\";\n\n      if (typeof storedAnswer.answer === \"object\" && storedAnswer.answer !== null) {\n        safeAnswer = storedAnswer.answer.answer || JSON.stringify(storedAnswer.answer);\n        safeSource = storedAnswer.answer.source || storedAnswer.source || \"Ultron AI\";\n      }\n\n      return res.json({\n        answer: typeof safeAnswer === \"string\" ? safeAnswer : JSON.stringify(safeAnswer),\n        source: safeSource,\n      });\n    }\n\n    // Processa la richiesta con NLP\n    const intentResult = await manager.process(\"en\", question);\n    let finalAnswer =\n      intentResult.answer || (await generateResponse(question)) || \"I'm not sure how to answer that yet.\";\n\n    // Log della conversazione\n    await logConversation({\n      userId: anonymousUser,\n      question,\n      answer: typeof finalAnswer === \"string\" ? finalAnswer : JSON.stringify(finalAnswer),\n      detectedIntent: intentResult.intent,\n      confidence: intentResult.score,\n      timestamp: new Date(),\n    });\n\n    // Salva la nuova risposta nel DB\n    const newEntry = new Question({\n      question,\n      answer: typeof finalAnswer === \"string\" ? finalAnswer : { answer: finalAnswer, source: \"Ultron AI\" },\n      source: \"Ultron AI\",\n    });\n    await newEntry.save();\n\n    res.json({\n      answer: typeof finalAnswer === \"string\" ? finalAnswer : JSON.stringify(finalAnswer),\n      source: \"Ultron AI\",\n    });\n  } catch (error) {\n    logger.error(\"❌ Error processing question:\", error);\n    res.status(500).json({ error: \"Server error\" });\n  }\n});\n\n// Endpoint Health Check con attesa per la connessione MongoDB\nrouter.get(\"/health\", async (req, res) => {\n  try {\n    // Funzione per attendere che la connessione sia stabilita\n    const waitForConnection = async (retries = 5, delay = 1000) => {\n      for (let i = 0; i < retries; i++) {\n        if (mongoose.connection.readyState === 1) {\n          return true;\n        }\n        await new Promise((resolve) => setTimeout(resolve, delay));\n      }\n      return false;\n    };\n\n    const connected = await waitForConnection();\n    if (!connected) {\n      logger.error(`❌ Health check: MongoDB not connected (readyState: ${mongoose.connection.readyState})`);\n      return res.status(500).json({ error: \"Service is unhealthy\", mongoReadyState: mongoose.connection.readyState });\n    }\n\n    // Esegue un ping sul database\n    const admin = mongoose.connection.db.admin();\n    const pingResult = await admin.ping();\n    logger.info(\"Ping result: \" + JSON.stringify(pingResult));\n    res.json({ status: \"✅ Healthy\", mongo: \"Connected\" });\n  } catch (error) {\n    logger.error(\"❌ Health check failed:\", error.message);\n    res.status(500).json({ error: \"Service is unhealthy\" });\n  }\n});\n\n// Nuovi endpoint: /fetch, /store, /download\nrouter.get(\"/fetch\", async (req, res) => {\n  const { source, file, query } = req.query;\n  if (source === \"github\") {\n    try {\n      const fileContent = `Contenuto simulato da GitHub per il file ${file}`;\n      return res.json({ data: fileContent });\n    } catch (error) {\n      return res.status(500).json({ error: error.message });\n    }\n  } else if (source === \"mongodb\") {\n    try {\n      const result = { key: query, value: \"Dati simulati da MongoDB\" };\n      return res.json({ data: result });\n    } catch (error) {\n      return res.status(500).json({ error: error.message });\n    }\n  } else {\n    return res.status(400).json({ error: \"Source non riconosciuto\" });\n  }\n});\n\nrouter.post(\"/store\", async (req, res) => {\n  try {\n    const { key, value } = req.body;\n    return res.json({ message: \"Dati salvati correttamente\" });\n  } catch (error) {\n    return res.status(500).json({ error: error.message });\n  }\n});\n\nrouter.get(\"/download\", async (req, res) => {\n  const { source, file } = req.query;\n  if (source === \"github\") {\n    try {\n      const fileData = `Contenuto simulato del file ${file}`;\n      res.setHeader(\"Content-Disposition\", `attachment; filename=${file}`);\n      return res.send(fileData);\n    } catch (error) {\n      return res.status(500).json({ error: error.message });\n    }\n  } else {\n    return res.status(404).json({ error: \"File non trovato\" });\n  }\n});\n\napp.use(\"/.netlify/functions/server\", router);\n\n// In modalità sviluppo, avvia il server in locale\nif (__webpack_require__.c[__webpack_require__.s] === module) {\n  const port = process.env.PORT || 8888;\n  app.listen(port, () => {\n    logger.info(`Server is running on port ${port}`);\n  });\n}\n\nmodule.exports = { app, handler: serverless(app) };\n\n//# sourceURL=webpack://iframe_airdrop/./api/server.js?");

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