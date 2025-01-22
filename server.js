require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./src/middleware/error-handler');
const taskRoutes = require('./src/routes/task-routes');
const subtaskRoutes = require('./src/routes/subtask-routes');
const userRoutes = require('./src/routes/user-routes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイルの提供
app.use(express.static(path.join(__dirname)));

// API routes
app.use('/api/tasks', taskRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/users', userRoutes);

// API Key取得エンドポイント
app.get('/api/config', (req, res) => {
    res.json({ apiKey: process.env.GEMINI_API_KEY });
});

// Global error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'リクエストされたリソースが見つかりません'
  });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});