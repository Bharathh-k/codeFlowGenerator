const express = require("express");
const multer = require("multer");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const port = 3000;

// MongoDB Connection URI (Replace with your MongoDB Atlas URI)
const MONGO_URI = "mongodb+srv://bharathkgit:C4ogm9z4wNnNdg4T@cluster0.4m5vg.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(MONGO_URI);

// Middleware to parse JSON request bodies
app.use(express.json({ limit: '10mb' }));  // Automatically parses incoming JSON

// Create HTTP server and bind it to Express
const server = http.createServer(app);

// Create WebSocket server that listens on ALL network interfaces
const wss = new WebSocket.Server({ server, host: "0.0.0.0" });

// Store connected clients
const clients = new Set();

// WebSocket Connection Handling
wss.on("connection", (ws, req) => {
    const clientIP = req.socket.remoteAddress; // Get client IP
    console.log(`🔗 New WebSocket client connected from ${clientIP}`);

    clients.add(ws);

    ws.on("close", () => {
        console.log("❌ WebSocket client disconnected");
        clients.delete(ws);
    });
});

// Multer Configuration for File Uploads
const upload = multer({ dest: "uploads/" });

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB Atlas");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
}

// Custom Middleware to Capture, Parse, and Broadcast JSON
app.use((req, res, next) => {
    try {
        // Ensure that request body is a JSON object
        if (typeof req.body !== "object") {
            console.error("❌ Invalid JSON format: Expected object");
            return res.status(400).json({ error: "Invalid JSON format: Expected object" });
        }

        // Extract a specific attribute (e.g., "method") and store it
        const current_function = req.body.method || "unknown_function";

        // Structure the data to send over WebSocket
        const wsPayload = {
            current_function: current_function,
            raw_json: req.body
        };

        // Broadcast data to all WebSocket clients
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(wsPayload));
            }
        });

        // Store data in request for next middleware
        req.current_function = current_function;
        req.parsedJson = req.body; // Already parsed JSON object

        // Continue to the next middleware
        next();
    } catch (err) {
        console.error("❌ Error processing JSON:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// API Endpoint to Receive JSON & Insert into MongoDB
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
            message: "✅ JSON inserted successfully!", 
            insertedId: result.insertedId, 
            current_function: current_function
        });

    } catch (err) {
        console.error("❌ Error Processing JSON:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start the HTTP & WebSocket Server
server.listen(port, async () => {
    await connectDB();
    console.log(`🚀 Server is running on http://0.0.0.0:${port}`);
});
