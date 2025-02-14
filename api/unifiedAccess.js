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
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const KnowledgeSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed
});
const Knowledge = mongoose.models.Knowledge || mongoose.model('Knowledge', KnowledgeSchema);

/**
 * 📌 Route: GET /.netlify/functions/unifiedAccess/fetch
 * Fetch a file or dataset from GitHub, Netlify, or MongoDB
 */
router.get('/fetch', async (req, res) => {
    const { source, file, query } = req.query;
    try {
        if (!source) return res.status(400).json({ error: "Missing source parameter." });

        if (source === "github") {
            if (!file) return res.status(400).json({ error: "Missing file parameter for GitHub source." });

            const repoUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${file}`;
            console.log("Fetching from GitHub URL:", repoUrl);

            const response = await axios.get(repoUrl, {
                headers: { Authorization: `token ${process.env.MY_GITHUB_TOKEN}` }
            });

            if (!response.data.download_url) {
                return res.status(404).json({ error: "GitHub API Error: File not found or permission denied." });
            }

            const fileResponse = await axios.get(response.data.download_url);
            res.json({ file, content: fileResponse.data });

        } else if (source === "netlify") {
            if (!file) return res.status(400).json({ error: "Missing file parameter for Netlify source." });

            // ✅ Evita il redirect, servendo direttamente il file locale
            const filePath = path.join(__dirname, "..", file); // Cerca il file nella root del deploy
            if (fs.existsSync(filePath)) {
                console.log("🔹 Serving local Netlify file:", filePath);
                return res.sendFile(filePath);
            } else {
                return res.status(404).json({ error: "File not found in Netlify deployment." });
            }

        } else if (source === "mongodb") {
            if (!query) return res.status(400).json({ error: "Missing query parameter for MongoDB source." });
            const data = await Knowledge.findOne({ key: query });
            if (!data) return res.status(404).json({ error: "No data found in MongoDB" });
            res.json(data);

        } else {
            res.status(400).json({ error: "Invalid source parameter. Use 'github', 'netlify', or 'mongodb'." });
        }
    } catch (error) {
        console.error("❌ Fetch Error:", error.response?.status, error.response?.data || error.message);
        res.status(500).json({ error: "Error fetching data", details: error.response?.data || error.message });
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
        res.json({ message: "✅ Data stored successfully", data: record });

    } catch (error) {
        console.error("❌ Storage Error:", error.message);
        res.status(500).json({ error: "Error storing data", details: error.message });
    }
});

/**
 * 📌 Route: GET /.netlify/functions/unifiedAccess/download
 * Allows downloading a file from GitHub or Netlify
 */
router.get('/download', async (req, res) => {
    const { source, file } = req.query;
    if (!source || !file) {
        return res.status(400).json({ error: "Missing source or file parameter." });
    }

    try {
        if (source === "github") {
            const repoUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${file}`;

            const response = await axios.get(repoUrl, {
                headers: { Authorization: `token ${process.env.MY_GITHUB_TOKEN}` }
            });

            if (!response.data.download_url) {
                return res.status(404).json({ error: "GitHub API Error: File not found or permission denied." });
            }

            const fileResponse = await axios.get(response.data.download_url, { responseType: 'arraybuffer' });

            try {
                const jsonResponse = JSON.parse(fileResponse.data.toString('utf-8'));
                if (jsonResponse.error || jsonResponse.message) {
                    console.error(`🚨 Prevented overwriting file ${file} with error content:`, jsonResponse);
                    return res.status(500).json({ error: "GitHub returned an error instead of a file.", details: jsonResponse });
                }
            } catch (err) {
                // Il file non è JSON, possiamo procedere con il download
                const filePath = path.join(__dirname, file);
                fs.writeFileSync(filePath, fileResponse.data);
                res.download(filePath, () => fs.unlinkSync(filePath));
            }
        } else if (source === "netlify") {
            // ✅ Serve direttamente il file locale
            const filePath = path.join(__dirname, "..", file);
            if (fs.existsSync(filePath)) {
                console.log("🔹 Serving Netlify file for download:", filePath);
                res.download(filePath);
            } else {
                res.status(404).json({ error: "File not found in Netlify deployment." });
            }
        } else {
            res.status(400).json({ error: "Invalid source for download" });
        }
    } catch (error) {
        console.error("❌ Download Error:", error.response?.status, error.response?.data || error.message);
        res.status(500).json({ error: "Error downloading file", details: error.response?.data || error.message });
    }
});

// ✅ Attach Router to App
app.use('/.netlify/functions/unifiedAccess', router);

// ✅ Export for Netlify
module.exports.handler = serverless(app);