const { createClient } = require('@supabase/supabase-js');
const { AppError } = require('./error-handler');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get JWT token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AppError(401, '認証が必要です');
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError(401, '無効なトークンです');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  auth,
  supabase
};