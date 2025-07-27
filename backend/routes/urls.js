const express = require('express');
const { authenticateToken } = require('../auth');
const pool = require('../postgres');

const router = express.Router();

// Rastgele kısa ID üreten fonksiyon
function generateShortId(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// URL kısaltma (kullanıcı girişi ile)
router.post('/shorten', authenticateToken, async (req, res) => {
  const { original_url, custom_alias, expires_at, category_id } = req.body;
  const userId = req.user.userId;

  if (!original_url) {
    return res.status(400).json({ error: 'original_url alanı zorunlu' });
  }

  try {
    let shortId = custom_alias || generateShortId();
    
    // Custom alias kontrolü
    if (custom_alias) {
      const existingUrlResult = await pool.query(
        'SELECT id FROM urls WHERE custom_alias = $1',
        [custom_alias]
      );
      if (existingUrlResult.rows.length > 0) {
        return res.status(400).json({ error: 'Bu özel isim zaten kullanımda' });
      }
    } else {
      // Rastgele ID kontrolü
      let exists = true;
      while (exists) {
        const checkResult = await pool.query('SELECT 1 FROM urls WHERE short_id = $1', [shortId]);
        if (checkResult.rows.length === 0) exists = false;
        else shortId = generateShortId();
      }
    }

    // URL'yi kaydet
    const result = await pool.query(
      `INSERT INTO urls (original_url, short_id, custom_alias, user_id, expires_at) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [original_url, shortId, custom_alias, userId, expires_at]
    );

    const url = { id: result.rows[0].id, short_id: shortId, custom_alias };
    const shortUrl = `http://localhost:3000/${url.custom_alias || url.short_id}`;

    // Kategori ekleme
    if (category_id) {
      await pool.query(
        'INSERT INTO url_categories (url_id, category_id) VALUES ($1, $2)',
        [url.id, category_id]
      );
    }

    res.json({ 
      short_url: shortUrl,
      url_id: url.id,
      short_id: url.short_id,
      custom_alias: url.custom_alias
    });
  } catch (err) {
    console.error('URL kısaltma hatası:', err);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Kullanıcının URL'lerini listele
router.get('/my-urls', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 10, search } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT u.id, u.original_url, u.short_id, u.custom_alias, u.click_count, 
             u.created_at, u.expires_at, u.is_active,
             c.name as category_name
      FROM urls u
      LEFT JOIN url_categories uc ON u.id = uc.url_id
      LEFT JOIN categories c ON uc.category_id = c.id
      WHERE u.user_id = $1
    `;
    
    const params = [userId];

    if (search) {
      query += ` AND (u.original_url ILIKE $${params.length + 1} OR u.custom_alias ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Toplam sayı
    let countQuery = `SELECT COUNT(*) as count FROM urls WHERE user_id = $1`;
    const countParams = [userId];
    
    if (search) {
      countQuery += ` AND (original_url ILIKE $2 OR custom_alias ILIKE $3)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = countResult.rows[0] ? countResult.rows[0].count : 0;

    res.json({
      urls: result.rows || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (err) {
    console.error('URL listesi hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// URL istatistikleri
router.get('/stats/:urlId', authenticateToken, async (req, res) => {
  const { urlId } = req.params;
  const userId = req.user.userId;

  try {
    // URL'nin kullanıcıya ait olduğunu kontrol et
    const urlCheckResult = await pool.query(
      'SELECT id FROM urls WHERE id = $1 AND user_id = $2',
      [urlId, userId]
    );

    if (urlCheckResult.rows.length === 0) {
      return res.status(404).json({ error: 'URL bulunamadı' });
    }

    // Detaylı istatistikler
    const statsResult = await pool.query(`
      SELECT 
        u.original_url,
        u.short_id,
        u.custom_alias,
        u.click_count,
        u.created_at,
        u.expires_at,
        COUNT(ch.id) as total_clicks,
        COUNT(DISTINCT ch.ip_address) as unique_visitors,
        MAX(ch.clicked_at) as last_click
      FROM urls u
      LEFT JOIN click_history ch ON u.id = ch.url_id
      WHERE u.id = $1
      GROUP BY u.id, u.original_url, u.short_id, u.custom_alias, u.click_count, u.created_at, u.expires_at
    `, [urlId]);

    if (statsResult.rows.length === 0) {
      return res.status(404).json({ error: 'İstatistik bulunamadı' });
    }

    const stats = statsResult.rows[0];

    res.json(stats);
  } catch (err) {
    console.error('İstatistik hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// URL silme
router.delete('/:urlId', authenticateToken, async (req, res) => {
  const { urlId } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'DELETE FROM urls WHERE id = $1 AND user_id = $2',
      [urlId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'URL bulunamadı' });
    }

    res.json({ message: 'URL başarıyla silindi' });
  } catch (err) {
    console.error('URL silme hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// URL güncelleme
router.put('/:urlId', authenticateToken, async (req, res) => {
  const { urlId } = req.params;
  const { custom_alias, expires_at, is_active } = req.body;
  const userId = req.user.userId;

  try {
    // Custom alias kontrolü
    if (custom_alias) {
      const existingUrl = await dbGet(
        'SELECT id FROM urls WHERE custom_alias = ? AND id != ?',
        [custom_alias, urlId]
      );
      if (existingUrl) {
        return res.status(400).json({ error: 'Bu özel isim zaten kullanımda' });
      }
    }

    // SQLite'da COALESCE yerine CASE kullanıyoruz
    const result = await dbRun(
      `UPDATE urls 
       SET custom_alias = CASE WHEN ? IS NOT NULL THEN ? ELSE custom_alias END,
           expires_at = ?,
           is_active = CASE WHEN ? IS NOT NULL THEN ? ELSE is_active END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [custom_alias, custom_alias, expires_at, is_active, is_active, urlId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'URL bulunamadı' });
    }

    // Güncellenmiş URL'yi getir
    const updatedUrl = await dbGet(
      'SELECT id, short_id, custom_alias, expires_at, is_active FROM urls WHERE id = ?',
      [urlId]
    );

    res.json(updatedUrl);
  } catch (err) {
    console.error('URL güncelleme hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router; 