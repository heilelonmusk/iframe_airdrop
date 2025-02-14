require('dotenv').config();
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const KnowledgeSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed
});
const Knowledge = mongoose.model('Knowledge', KnowledgeSchema);

app.use(cors());
app.use(express.json());

/**
 * 📌 Route: GET /api/fetch
 * Fetches a file or dataset from GitHub, Netlify, or MongoDB
 * Query Parameters:
 * - source: github | netlify | mongodb
 * - file: the file path (GitHub/Netlify)
 * - query: MongoDB key
 */
app.get('/api/fetch', async (req, res) => {
    const { source, file, query } = req.query;

    try {
        if (source === "github") {
            const response = await axios.get(`${process.env.GITHUB_REPO}/contents/${file}`, {
                headers: { Authorization: `token ${process.env.MY_GITHUB_TOKEN}` }
            });
            res.json(response.data);
        } else if (source === "netlify") {
            res.redirect(`${process.env.NETLYFY_URL}/${file}`);
        } else if (source === "mongodb") {
            const data = await Knowledge.findOne({ key: query });
            if (!data) return res.status(404).json({ error: "No data found" });
            res.json(data);
        } else {
            res.status(400).json({ error: "Invalid source parameter. Use 'github', 'netlify', or 'mongodb'." });
        }
    } catch (error) {
        console.error("❌ Fetch Error:", error.message);
        res.status(500).json({ error: "Error fetching data", details: error.message });
    }
});

/**
 * 📌 Route: POST /api/store
 * Stores new information into the MongoDB knowledge base
 * Request Body:
 * - key: The unique key for the knowledge entry
 * - value: The data to be stored
 */
app.post('/api/store', async (req, res) => {
    const { key, value } = req.body;

    try {
        let record = await Knowledge.findOne({ key });
        if (record) {
            record.value = value;
            await record.save();
        } else {
            record = new Knowledge({ key, value });
            await record.save();
        }
        res.json({ message: "✅ Data stored successfully", data: record });
    } catch (error) {
        console.error("❌ Storage Error:", error.message);
        res.status(500).json({ error: "Error storing data", details: error.message });
    }
});

/**
 * 📌 Route: GET /api/download
 * Allows downloading a file from GitHub or Netlify
 * Query Parameters:
 * - source: github | netlify
 * - file: the file path
 */
app.get('/api/download', async (req, res) => {
    const { source, file } = req.query;

    try {
        if (source === "github") {
            const response = await axios.get(`${process.env.GITHUB_REPO}/contents/${file}`, {
                headers: { Authorization: `token ${process.env.MY_GITHUB_TOKEN}` }
            });

            const filePath = path.join(__dirname, file);
            fs.writeFileSync(filePath, Buffer.from(response.data.content, 'base64'));
            res.download(filePath, () => fs.unlinkSync(filePath));
        } else if (source === "netlify") {
            res.redirect(`${process.env.NETLYFY_URL}/${file}`);
        } else {
            res.status(400).json({ error: "Invalid source for download" });
        }
    } catch (error) {
        console.error("❌ Download Error:", error.message);
        res.status(500).json({ error: "Error downloading file", details: error.message });
    }
});

// Start the API server
app.listen(PORT, () => console.log(`🚀 Unified API Gateway running on port ${PORT}`));