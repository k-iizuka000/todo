const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// .envファイルを読み込む
dotenv.config();

const app = express();

// 静的ファイルの提供
app.use(express.static(__dirname));

// APIキーを提供するエンドポイント
app.get('/api/config', (req, res) => {
    res.json({
        apiKey: process.env.API_KEY
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 