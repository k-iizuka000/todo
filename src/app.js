import express from 'express';
import userRoutes from './routes/user-routes.js';
import taskRoutes from './routes/task-routes.js';
import { errorHandler } from './middleware/error-handler.js';
import connectDB from './utils/db.js';

const app = express();

// ミドルウェア
app.use(express.json());
app.use(express.static('public'));

// ルート
app.use('/', userRoutes);  // ユーザー関連のルートをマウント
app.use('/api/tasks', taskRoutes);  // タスク関連のルートをマウント

// エラーハンドリング
app.use(errorHandler);

// サーバー起動
const PORT = process.env.PORT || 3000;
const start = async () => {
  try {
    await connectDB();  // データベース接続
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start(); 