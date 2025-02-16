// server.js
const express = require('express');
const multer = require('multer');
const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

app.post('/uploadFile', upload.single('file'), (req, res) => {
  res.send('File received successfully');
});

app.listen(5000, () => console.log('Server running on port 5000'));
