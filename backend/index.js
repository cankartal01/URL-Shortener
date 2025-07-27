require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// PostgreSQL bağlantısı
const pool = require('./postgres');

// Middleware
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // IP başına maksimum 100 istek
});
app.use(limiter);

const PORT = process.env.PORT || 3000;

// Routes
const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/urls');

app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);

// Ana sayfa
app.get('/', (req, res) => {
  res.json({ 
    message: 'URL Kısaltıcı API v2.0',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      urls: '/api/urls'
    }
  });
});

// Eski API uyumluluğu (v1)
app.post('/shorten', async (req, res) => {
  const { original_url } = req.body;
  if (!original_url) {
    return res.status(400).json({ error: 'original_url alanı zorunlu.' });
  }
  
  try {
    const shortId = generateShortId();
    await pool.query(
      'INSERT INTO urls (original_url, short_id) VALUES ($1, $2)',
      [original_url, shortId],
    );
    res.json({ short_url: `http://localhost:${PORT}/${shortId}` });
  } catch (err) {
    res.status(500).json({ error: 'Veritabanı hatası.' });
  }
});

// URL yönlendirme
app.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;
  try {
    const urlResult = await pool.query(
      'SELECT id, original_url, is_active, expires_at FROM urls WHERE short_id = $1 OR custom_alias = $1',
      [shortId],
    );
    
    if (urlResult.rows.length === 0) {
      return res.status(404).send('Kısaltılmış URL bulunamadı.');
    }
    
    const url = urlResult.rows[0];
    
    // URL aktif mi kontrol et
    if (!url.is_active) {
      return res.status(410).send('Bu URL artık aktif değil.');
    }

    // Süre dolmuş mu kontrol et
    if (url.expires_at && new Date() > new Date(url.expires_at)) {
      return res.status(410).send('Bu URL\'nin süresi dolmuş.');
    }

    // Tıklama sayısını artır
    await pool.query(
      'UPDATE urls SET click_count = click_count + 1 WHERE short_id = $1 OR custom_alias = $1',
      [shortId],
    );

    // Tıklama geçmişini kaydet
    await pool.query(
      'INSERT INTO click_history (url_id, ip_address, user_agent, referer) VALUES ($1, $2, $3, $4)',
      [url.id, req.ip, req.get('User-Agent'), req.get('Referer')]
    );

    res.redirect(url.original_url);
  } catch (err) {
    console.error('Yönlendirme hatası:', err);
    res.status(500).send('Sunucu hatası.');
  }
});

// Rastgele kısa ID üreten fonksiyon
function generateShortId(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Bir şeyler ters gitti!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

app.listen(PORT, () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
  console.log(`📊 API Dokümantasyonu: http://localhost:${PORT}/api`);
});
