import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import User from '../models/user.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // トークンの取得
      token = req.headers.authorization.split(' ')[1];

      // トークンの検証
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ユーザー情報の取得（パスワードを除く）
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: '認証に失敗しました'
      });
    }
  }

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: '認証トークンが見つかりません'
    });
  }
};

export const authMiddleware = async (req, res, next) => {
  try {
    // Authorization headerからトークンを取得
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '認証トークンが必要です' })
    }

    const token = authHeader.split(' ')[1]

    // トークンの検証
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: '無効な認証トークンです' })
    }

    // ユーザー情報をリクエストに追加
    req.user = user
    next()
  } catch (error) {
    console.error('認証エラー:', error)
    res.status(500).json({ error: '認証処理中にエラーが発生しました' })
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next()
      return
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (!error && user) {
      req.user = user
    }
    next()
  } catch (error) {
    console.error('認証エラー:', error)
    next()
  }
}

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: '認証が必要です'
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.userId,
        email: decoded.email
      };
      next();
    } catch (error) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'トークンが無効です'
      });
    }
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '認証処理中にエラーが発生しました'
    });
  }
};

export const authenticateUser = (req, res, next) => {
  try {
    // ヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '認証が必要です' });
    }

    const token = authHeader.split(' ')[1];
    
    // トークンの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ユーザー情報をリクエストに追加
    req.user = { id: decoded.id };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '無効なトークンです' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'トークンの有効期限が切れています' });
    }
    next(error);
  }
};