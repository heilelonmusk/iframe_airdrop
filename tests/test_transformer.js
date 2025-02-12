const { generateResponse } = require("./modules/nlp/transformer");

(async () => {
  const response = await generateResponse("What is AI?");
  console.log("Ultron AI Response:", response);
})();