const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing or invalid token format'
      });
    }

    const token = authHeader.split(' ')[1];

    let decodedToken;
    let isSupabaseToken = false;

    try {
      const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
      if (secret) {
        decodedToken = jwt.verify(token, secret);
      } else {
        throw new Error('No local JWT secret configured');
      }
    } catch (err) {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid token'
        });
      }
      decodedToken = user;
      isSupabaseToken = true;
    }

    const userId = decodedToken.id || decodedToken.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token does not contain user ID'
      });
    }

    req.user = {
      ...decodedToken,
      id: userId
    };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profileError && profile) {
      req.user.role = profile.role;
    } else {
      const fallbackRole =
        decodedToken.role ||
        (decodedToken.user_metadata && decodedToken.user_metadata.role) ||
        (decodedToken.app_metadata && decodedToken.app_metadata.role);

      if (fallbackRole) {
        req.user.role = fallbackRole;
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during authentication'
    });
  }
};

module.exports = { authenticateUser };
