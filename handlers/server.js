
const path = require('path');
const express = require("express");
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
    const imagePath = path.join(__dirname, 'index.html');
    res.sendFile(imagePath);
});

app.listen(port, '0.0.0.0', () => {
    const serverUrl = process.env.RENDER ? `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` : `http://localhost:${port}`;
    console.log(`🔗 Listening to Phucx : ${serverUrl}`);
});

