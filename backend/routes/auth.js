const express = require('express');
const { hashPassword, verifyPassword, generateToken, authenticateToken } = require('../auth');
const pool = require('../postgres');

const router = express.Router();

// Kullanıcı kaydı
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
  }

  try {
    // Kullanıcı var mı kontrol et
    const existingUserResult = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'Kullanıcı adı veya email zaten kullanımda' });
    }

    // Şifreyi hash'le
    const passwordHash = await hashPassword(password);

    // Yeni kullanıcı oluştur
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, passwordHash]
    );

    const user = { id: result.rows[0].id, username, email };
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: { id: user.id, username: user.username, email: user.email },
      token
    });
  } catch (err) {
    console.error('Kayıt hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Kullanıcı girişi
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur' });
  }

  try {
    // Kullanıcıyı bul
    const userResult = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const user = userResult.rows[0];

    // Şifreyi doğrula
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    // Token oluştur
    const token = generateToken(user.id);

    res.json({
      message: 'Giriş başarılı',
      user: { id: user.id, username: user.username, email: user.email },
      token
    });
  } catch (err) {
    console.error('Giriş hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Kullanıcı profili
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ user: userResult.rows[0] });
  } catch (err) {
    console.error('Profil hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router; 