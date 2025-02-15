const express = require("express");
const multer = require("multer");
const { MongoClient } = require("mongodb");
const fs = require("fs");

const app = express();
const port = 3000;

const MONGO_URI = "mongodb+srv://bharathkgit:<password>@cluster0.4m5vg.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(MONGO_URI);

app.use(express.json());

// Allow remote access by binding to 0.0.0.0
app.listen(port, "0.0.0.0", () =>{
    console.log("Server ready to recieve data")
});

const upload = multer({ dest: "uploads/" });

async function connectDB() {
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB Atlas");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
}

app.post("/upload-json", async (req, res) => {
    try {
        const jsonData = req.body;

        if (!jsonData) {
            return res.status(400).json({ error: "Invalid JSON data" });
        }

        const db = client.db("API");
        const collection = db.collection("apiLogs");
        const result = await collection.insertOne(jsonData);

        res.json({ message: "✅ JSON inserted successfully!", insertedId: result.insertedId });

    } catch (err) {
        console.error("❌ Error Processing JSON:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, async () => {
    await connectDB();
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
