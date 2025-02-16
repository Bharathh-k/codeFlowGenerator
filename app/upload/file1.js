// file1.js
const {processData} = require("./file2");

function startProcess(input) {
    console.log("file1.js - startProcess received:", input);
    const result = processData(input);
    a()
    console.log("file1.js - Final result:", result);
}

module.exports = {startProcess};

startProcess("Initial Data");

