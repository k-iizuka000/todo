import { StatusCodes } from 'http-status-codes';
import { supabase } from '../utils/supabase.js';

/**
 * 必須認証ミドルウェア
 * 認証が必要なルートで使用
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: '認証が必要です'
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: '無効なトークンです'
      });
    }

    // ユーザー情報をリクエストに追加
    req.user = user;
    next();
  } catch (error) {
    console.error('認証エラー:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '認証処理中にエラーが発生しました'
    });
  }
};

/**
 * オプショナル認証ミドルウェア
 * 認証がある場合はユーザー情報を設定し、ない場合もエラーにしない
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = user;
    }
    next();
  } catch (error) {
    console.error('認証エラー:', error);
    next();
  }
};
