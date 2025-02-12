// modules/intent/intentRecognizer.js
const { NlpManager } = require('node-nlp'); // Ensure node-nlp is installed
const manager = new NlpManager({ languages: ['en'], forceNER: true });

// Train the model with basic intents
async function trainModel() {
  // Greetings intents
  manager.addDocument('en', 'Hello', 'greeting.hello');
  manager.addDocument('en', 'Hi', 'greeting.hello');
  manager.addDocument('en', 'Good morning', 'greeting.hello');

  // Information requests
  manager.addDocument('en', 'I need information', 'info.request');
  manager.addDocument('en', 'Tell me something', 'info.request');

  // Add static answers for specific intents
  manager.addAnswer('en', 'greeting.hello', 'Hello, how can I help you today?');
  manager.addAnswer('en', 'info.request', 'Please let me know what information you need.');

  await manager.train();
  manager.save();
}

// Process the text and return the intent result
async function getIntent(text) {
  const result = await manager.process('en', text);
  return result;
}

module.exports = { trainModel, getIntent };