const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// JWT secret key (production'da environment variable kullanın)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Şifre hash'leme
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Şifre doğrulama
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// JWT token oluşturma
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// JWT token doğrulama middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token gerekli' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  authenticateToken
}; 