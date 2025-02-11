require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const logQuestion = require('./logQuestion');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    console.error("ERROR: MONGO_URI not found in environment variables.");
    process.exit(1);
}

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("MongoDB Connection Error:", err));

app.post('/api/chat', async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question field." });

    const response = await logQuestion(question);
    res.json(response);
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));