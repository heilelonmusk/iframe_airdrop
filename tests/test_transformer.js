const { generateResponse } = require("../modules/nlp/transformer"); // Usa '../' per risalire alla cartella giusta

(async () => {
  const response = await generateResponse("What is AI?");
  console.log("Ultron AI Response:", response);
})();