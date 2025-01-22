import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

// ユーザー登録
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // メールアドレスの重複チェック
    const userExists = await User.findByEmail(email);
    if (userExists) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'このメールアドレスは既に登録されています'
      });
    }

    // ユーザーの作成
    const user = await User.create({
      email,
      password
    });

    // JWTトークンの生成
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '登録中にエラーが発生しました',
      error: error.message
    });
  }
};

// ログイン
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ユーザーの検索
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    // パスワードの検証
    const isMatch = await User.matchPassword(password, user.password);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    // JWTトークンの生成
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'ログイン中にエラーが発生しました',
      error: error.message
    });
  }
}; 