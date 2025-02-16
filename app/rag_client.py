const readline = require("readline");
const axios = require("axios");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = async () => {
    rl.question("Enter your question: ", async (question) => {
        try {
            const response = await axios.post("http://localhost:8080/ask", { question });
            console.log("\nAI Answer:\n", response.data.answer);
        } catch (error) {
            console.error("Error:", error.response ? error.response.data : error.message);
        }
        rl.close();
    });
};

// Run the client
askQuestion();
