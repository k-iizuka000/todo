require('dotenv').config();
const express = require('express');
const path = require('path');
const subtaskRoutes = require('./src/routes/subtask-routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// APIルート
app.use('/api/subtasks', subtaskRoutes);

// API Key取得エンドポイント
app.get('/api/config', (req, res) => {
    res.json({ apiKey: process.env.GEMINI_API_KEY });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 