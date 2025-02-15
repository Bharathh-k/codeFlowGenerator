// file3.js
function finalizeData(data) {
    console.log("file3.js - finalizeData received:", data);
    // Finalize the data (e.g., append final text)
    const finalizedData = data + " -> finalized by file3";
    return finalizedData;
}

module.exports = {finalizeData};

const result = finalizeData("Test Data");
console.log("file3.js - Final result:", result);

