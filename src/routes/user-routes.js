import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { login, register } from '../controllers/auth-controller.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TODO: 必要に応じてユーザー関連のルートを追加

// 登録ページの表示
router.get('/register', (req, res) => {
  res.sendFile(join(__dirname, '../../public/register.html'));
});

// ログインページの表示
router.get('/login', (req, res) => {
  res.sendFile(join(__dirname, '../../public/login.html'));
});

// 登録処理
router.post('/register', register);

// ログイン処理
router.post('/login', login);

export default router; 