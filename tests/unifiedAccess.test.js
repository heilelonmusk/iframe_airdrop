const request = require("supertest");
const mongoose = require("mongoose");

// 🚀 Importa Express direttamente senza `serverless(app)`
const { app } = require("../api/unifiedAccess");

jest.setTimeout(30000); // ✅ Timeout aumentato a 30 secondi

// ✅ Connessione MongoDB per i test
beforeAll(async () => {
    console.log("✅ Connecting to Test Database...");
    await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
    });
});

afterAll(async () => {
    console.log("✅ Closing MongoDB connection...");
    await mongoose.connection.close();
});

// ✅ Test API
test("GET /fetch (GitHub) - should fetch a file from GitHub", async () => {
    const response = await request(app)
        .get("/.netlify/functions/unifiedAccess/fetch?source=github&file=README.md")
        .expect(200);
    expect(response.body).toHaveProperty("file");
    expect(response.body).toHaveProperty("content");
});

test("GET /fetch (MongoDB) - should fetch data from MongoDB", async () => {
    const response = await request(app)
        .get("/.netlify/functions/unifiedAccess/fetch?source=mongodb&query=test_key")
        .expect(200);
    expect(response.body).toHaveProperty("key", "test_key");
    expect(response.body).toHaveProperty("value");
});

test("GET /fetch (Netlify) - should return 404 if file not found", async () => {
    const response = await request(app)
        .get("/.netlify/functions/unifiedAccess/fetch?source=netlify&file=nonexistent.json")
        .expect(404);
    expect(response.body).toHaveProperty("error", "File not found in Netlify deployment.");
});

test("POST /store - should store data in MongoDB", async () => {
    const response = await request(app)
        .post("/.netlify/functions/unifiedAccess/store")
        .send({ key: "test_key", value: "Hello MongoDB!" })
        .expect(200);
    expect(response.body).toHaveProperty("message", "✅ Data stored successfully");
});

test("GET /download (GitHub) - should download a file", async () => {
    const response = await request(app)
        .get("/.netlify/functions/unifiedAccess/download?source=github&file=README.md")
        .expect(200);
    expect(response.headers["content-type"]).toMatch(/application\/octet-stream/);
});

test("GET /download (Netlify) - should return 404 if file not found", async () => {
    const response = await request(app)
        .get("/.netlify/functions/unifiedAccess/download?source=netlify&file=nonexistent.json")
        .expect(404);
    expect(response.body).toHaveProperty("error", "File not found in Netlify deployment.");
});