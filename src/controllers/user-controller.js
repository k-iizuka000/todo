const { supabase } = require('../middleware/auth');
const { AppError } = require('../middleware/error-handler');

// ユーザープロフィールの取得
const getProfile = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw new AppError(404, 'ユーザープロフィールが見つかりません');

    res.status(200).json({
      status: 'success',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// ユーザープロフィールの更新
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar_url } = req.body;
    const { data: profile, error } = await supabase
      .from('users')
      .update({
        name,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .single();

    if (error) throw new AppError(400, 'プロフィールの更新に失敗しました');

    res.status(200).json({
      status: 'success',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile
};