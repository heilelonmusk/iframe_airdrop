const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

app.use(cors());
app.use(bodyParser.json());

// Import API routes
const logQuestion = require("./logQuestion");
app.use("/api/logQuestion", logQuestion);

app.get("/", (req, res) => {
  res.send("Ultron Chat API is running 🚀");
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));