require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../unifiedAccess"); // Assicurati che il percorso sia corretto

// ✅ Connessione a MongoDB per i test
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// ✅ Chiudi la connessione dopo i test
afterAll(async () => {
  await mongoose.connection.close();
});

// 📌 **Test MongoDB Connection**
test("✅ MongoDB Connection", async () => {
  expect(mongoose.connection.readyState).toBe(1);
});

// 📌 **Test API: Fetch File from GitHub**
test("✅ Fetch GitHub File", async () => {
  const response = await request(app)
    .get("/.netlify/functions/unifiedAccess/fetch")
    .query({ source: "github", file: "README.md" });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("file", "README.md");
  expect(response.body).toHaveProperty("content");
});

// 📌 **Test API: Fetch File from Netlify**
test("✅ Fetch Netlify Static File", async () => {
  const response = await request(app)
    .get("/.netlify/functions/unifiedAccess/fetch")
    .query({ source: "netlify", file: "config.json" });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("file", "config.json");
});

// 📌 **Test API: Fetch Data from MongoDB**
test("✅ Fetch MongoDB Record", async () => {
  const response = await request(app)
    .get("/.netlify/functions/unifiedAccess/fetch")
    .query({ source: "mongodb", query: "test_key" });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("key", "test_key");
  expect(response.body).toHaveProperty("value");
});

// 📌 **Test API: Store Data in MongoDB**
test("✅ Store Data in MongoDB", async () => {
  const testData = { key: "new_test_key", value: "Hello MongoDB!" };

  const response = await request(app)
    .post("/.netlify/functions/unifiedAccess/store")
    .send(testData);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "✅ Data stored successfully");
});

// 📌 **Test API: Download File from GitHub**
test("✅ Download GitHub File", async () => {
  const response = await request(app)
    .get("/.netlify/functions/unifiedAccess/download")
    .query({ source: "github", file: "README.md" });

  expect(response.status).toBe(200);
});

// 📌 **Test API: Download File from Netlify**
test("✅ Download Netlify File", async () => {
  const response = await request(app)
    .get("/.netlify/functions/unifiedAccess/download")
    .query({ source: "netlify", file: "config.json" });

  expect(response.status).toBe(200);
});