require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection - Ensure proper error handling
mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, 
    socketTimeoutMS: 45000 
})
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch(err => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
});

const KnowledgeSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed
});
const Knowledge = mongoose.models.Knowledge || mongoose.model('Knowledge', KnowledgeSchema);

// ✅ Local cache for MongoDB responses to improve performance
const memoryCache = new Map();

/**
 * 📌 Route: GET /.netlify/functions/unifiedAccess/static/:file
 * Serves any static file from the deployment
 */
router.get('/static/:file', async (req, res) => {
    const { file } = req.params;
    
    try {
        if (!file) return res.status(400).json({ error: "Missing file parameter." });

        const filePath = path.join(process.cwd(), "public", file);
        if (fs.existsSync(filePath)) {
            console.log("🔹 Serving Static File:", filePath);
            return res.sendFile(filePath);
        } else {
            return res.status(404).json({ error: `File ${file} not found.` });
        }
    } catch (error) {
        console.error("❌ File Serving Error:", error.message);
        res.status(500).json({ error: "Error serving file", details: error.message });
    }
});

/**
 * 📌 Route: GET /.netlify/functions/unifiedAccess/fetch
 * Fetch a file or dataset from GitHub, MongoDB, or Netlify
 */
router.get('/fetch', async (req, res) => {
    const { source, file, query } = req.query;
    try {
        if (!source) return res.status(400).json({ error: "Missing source parameter." });

        if (source === "github") {
            if (!file) return res.status(400).json({ error: "Missing file parameter for GitHub source." });

            const repoUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${file}`;
            console.log("Fetching from GitHub URL:", repoUrl);

            try {
                const response = await axios.get(repoUrl, {
                    headers: { Authorization: `token ${process.env.MY_GITHUB_TOKEN}` }
                });

                if (!response.data.download_url) {
                    return res.status(404).json({ error: "GitHub API Error: File not found or permission denied." });
                }

                const fileResponse = await axios.get(response.data.download_url);
                res.json({ file, content: fileResponse.data });

            } catch (error) {
                console.error("❌ GitHub Fetch Error:", error.message);
                return res.status(error.response?.status || 500).json({ error: "Error fetching file from GitHub", details: error.message });
            }

        } else if (source === "mongodb") {
            if (!query) return res.status(400).json({ error: "Missing query parameter for MongoDB source." });

            if (memoryCache.has(query)) {
                console.log("🔹 Returning cached MongoDB response for:", query);
                return res.json(memoryCache.get(query));
            }

            try {
                const data = await Knowledge.findOne({ key: query });
                if (!data) return res.status(404).json({ error: "No data found in MongoDB" });

                memoryCache.set(query, data);
                res.json(data);

            } catch (error) {
                console.error("❌ MongoDB Fetch Error:", error.message);
                res.status(500).json({ error: "Error fetching data from MongoDB", details: error.message });
            }
        } else {
            res.status(400).json({ error: "Invalid source parameter. Use 'github' or 'mongodb'." });
        }
    } catch (error) {
        console.error("❌ Fetch Error:", error.message);
        res.status(500).json({ error: "Unexpected error fetching data", details: error.message });
    }
});

/**
 * 📌 Route: POST /.netlify/functions/unifiedAccess/store
 * Stores new information into the MongoDB knowledge base
 */
router.post('/store', async (req, res) => {
    const { key, value } = req.body;
    if (!key || !value) {
        return res.status(400).json({ error: "Missing key or value in request body." });
    }

    try {
        let record = await Knowledge.findOne({ key });
        if (record) {
            record.value = value;
            await record.save();
        } else {
            record = new Knowledge({ key, value });
            await record.save();
        }
        memoryCache.set(key, record);
        res.json({ message: "✅ Data stored successfully", data: record });

    } catch (error) {
        console.error("❌ Storage Error:", error.message);
        res.status(500).json({ error: "Error storing data", details: error.message });
    }
});

// ✅ Attach Router to App
app.use('/.netlify/functions/unifiedAccess', router);

// ✅ Export for Netlify
module.exports.handler = serverless(app);