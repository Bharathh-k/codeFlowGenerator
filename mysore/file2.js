// file2.js
const {finalizeData} = require("./file3");

function processData(data) {
    console.log("file2.js - processData received:", data);
    // Modify the data (e.g., transform the input)
    const transformedData = data + " -> transformed by file2";
    const finalResult = finalizeData(transformedData);
    return finalResult;
}

module.exports = {processData};
