const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: String,
    timestamp: { type: Date, default: Date.now }
});

const Question = mongoose.model('Question', questionSchema);

async function logQuestion(question) {
    try {
        const newQuestion = new Question({ question });
        await newQuestion.save();
        return { answer: "Processing your question...", source: "Ultron AI" };
    } catch (error) {
        console.error("❌ Error logging question:", error);
        return { error: "Could not log the question." };
    }
}

module.exports = logQuestion;