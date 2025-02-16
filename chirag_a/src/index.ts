import * as fs from 'fs';
import * as path from 'path';

// Define the path to the log file
const logFilePath = path.join(__dirname, '../logs/execution.log');
const txtFilePath = path.join(__dirname, './t.txt');
let data = '';
fs.readFile(txtFilePath, 'utf8', (err, data_read) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log('File data:', data_read);
    data = data_read;
});

export let logs = data;