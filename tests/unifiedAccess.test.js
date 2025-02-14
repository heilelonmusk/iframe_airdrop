const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../api/unifiedAccess"); // Assicurati che il percorso sia corretto

// ✅ Connessione a MongoDB per i test
beforeAll(async () => {
    jest.setTimeout(30000); // Evita timeout nei test
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log("✅ Test Database Connected");
});

// ✅ Test API /fetch (GitHub)
test("GET /fetch (GitHub) - should fetch a file from GitHub", async () => {
    const response = await request(app)
        .get("/.netlify/functions/unifiedAccess/fetch?source=github&file=README.md")
        .expect(200);
    expect(response.body).toHaveProperty("file");
    expect(response.body).toHaveProperty("content");
});

// ✅ Test API /fetch (MongoDB)
test("GET /fetch (MongoDB) - should fetch data from MongoDB", async () => {
    const response = await request(app)
        .get("/.netlify/functions/unifiedAccess/fetch?source=mongodb&query=test_key")
        .expect(200);
    expect(response.body).toHaveProperty("key", "test_key");
    expect(response.body).toHaveProperty("value");
});

// ✅ Test API /fetch (Netlify)
test("GET /fetch (Netlify) - should return 404 if file not found", async () => {
    const response = await request(app)
        .get("/.netlify/functions/unifiedAccess/fetch?source=netlify&file=nonexistent.json")
        .expect(404);
    expect(response.body).toHaveProperty("error", "File not found in Netlify deployment.");
});

// ✅ Test API /store (MongoDB)
test("POST /store - should store data in MongoDB", async () => {
    const response = await request(app)
        .post("/.netlify/functions/unifiedAccess/store")
        .send({ key: "test_key", value: "Hello MongoDB!" })
        .expect(200);
    expect(response.body).toHaveProperty("message", "✅ Data stored successfully");
});

// ✅ Test API /download (GitHub)
test("GET /download (GitHub) - should download a file", async () => {
    const response = await request(app)
        .get("/.netlify/functions/unifiedAccess/download?source=github&file=README.md")
        .expect(200);
    expect(response.headers["content-type"]).toMatch(/application\/octet-stream/);
});

// ✅ Test API /download (Netlify)
test("GET /download (Netlify) - should return 404 if file not found", async () => {
    const response = await request(app)
        .get("/.netlify/functions/unifiedAccess/download?source=netlify&file=nonexistent.json")
        .expect(404);
    expect(response.body).toHaveProperty("error", "File not found in Netlify deployment.");
});

// ✅ Chiudi connessione MongoDB dopo i test
afterAll(async () => {
    console.log("✅ Closing MongoDB connection...");
    await mongoose.connection.close();
});