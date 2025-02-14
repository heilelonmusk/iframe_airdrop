require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');

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

            // Fetch actual file content from raw GitHub URL
            const fileResponse = await axios.get(response.data.download_url);
            res.json({ file, content: fileResponse.data });

        } else if (source === "netlify") {
            if (!file) return res.status(400).json({ error: "Missing file parameter for Netlify source." });
            res.redirect(`${process.env.NETLIFY_URL}/${file}`);

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

            // Download file content
            const fileResponse = await axios.get(response.data.download_url, { responseType: 'arraybuffer' });
            
            // ✅ Evitiamo di sovrascrivere se il contenuto è un errore JSON
            try {
                const jsonResponse = JSON.parse(fileResponse.data.toString('utf-8'));
                if (jsonResponse.error || jsonResponse.message) {
                    console.error(`🚨 Prevented overwriting file ${file} with error content:`, jsonResponse);
                    return res.status(500).json({ error: "GitHub returned an error instead of a file.", details: jsonResponse });
                }
            } catch (err) {
                // Il file non è JSON (quindi è un file valido), possiamo salvarlo
                const filePath = `./${file}`;
                fs.writeFileSync(filePath, fileResponse.data);
                res.download(filePath, () => fs.unlinkSync(filePath));
            }
        } else if (source === "netlify") {
            res.redirect(`${process.env.NETLIFY_URL}/${file}`);
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
