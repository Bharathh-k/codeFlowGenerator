const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors()); // Allow frontend access
app.listen(PORT,"0.0.0.0", ()=>{
    console.log("server is listening");
})
// Route to handle questions
app.post("/ask", (req, res) => {
    const question = req.body.question;
    if (!question) {
        return res.status(400).json({ error: "Question is required" });
    }

    // Run the Python RAG model
    const pythonProcess = spawn("python", ["rag.py", question]);

    let responseData = "";
    pythonProcess.stdout.on("data", (data) => {
        responseData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
        console.error(`Error: ${data}`);
    });

    pythonProcess.on("close", (code) => {
        if (code === 0) {
            res.json({ answer: responseData.trim() });
        } else {
            res.status(500).json({ error: "Failed to process request" });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
