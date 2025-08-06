const express = require("express");
const multer = require("multer");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const port = 3000;

const MONGO_URI = "mongodb+srv://bharathkgit:<password>@cluster0.4m5vg.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(MONGO_URI);

app.use(express.json({ limit: '10mb' })); 

const server = http.createServer(app);

const wss = new WebSocket.Server({ server, host: "0.0.0.0" });

const clients = new Set();

wss.on("connection", (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    console.log(`🔗 New WebSocket client connected from ${clientIP}`);

    clients.add(ws);

    ws.on("close", () => {
        console.log("❌ WebSocket client disconnected");
        clients.delete(ws);
    });
});

const upload = multer({ dest: "uploads/" });

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
    }
}

app.use((req, res, next) => {
    try {
        if (typeof req.body !== "object") {
            console.error("Invalid JSON format: Expected object");
            return res.status(400).json({ error: "Invalid JSON format: Expected object" });
        }

        const current_function = req.body.method || "unknown_function";

        const wsPayload = {
            current_function: current_function,
            raw_json: req.body
        };

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(wsPayload));
            }
        });

        req.current_function = current_function;
        req.parsedJson = req.body;
        
        next();
    } catch (err) {
        console.error("❌ Error processing JSON:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/upload-json", async (req, res) => {
    try {
        const jsonData = req.parsedJson;
        const current_function = req.current_function;

        if (!jsonData) {
            return res.status(400).json({ error: "Invalid JSON data" });
        }

        // Insert Data into MongoDB
        const db = client.db("API");
        const collection = db.collection("apiLogs");
        const result = await collection.insertOne(jsonData);

        res.json({ 
            message: "JSON inserted successfully!", 
            insertedId: result.insertedId, 
            current_function: current_function
        });

    } catch (err) {
        console.error("Error Processing JSON:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start the HTTP & WebSocket Server
server.listen(port, async () => {
    await connectDB();
    console.log(`🚀 Server is running on http://0.0.0.0:${port}`);
});
