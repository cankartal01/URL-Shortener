require('dotenv').config();
const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');

const pool = new Pool();

pool
  .connect()
  .then(() => console.log('PostgreSQL bağlantısı başarılı!'))
  .catch((err) => console.error('Veritabanı bağlantı hatası:', err));

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('URL Kısaltıcı API Çalışıyor!');
});

// Rastgele kısa ID üreten fonksiyon
function generateShortId(length = 6) {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Uzun URL'yi kısaltan endpoint
app.post('/shorten', async (req, res) => {
  const { original_url } = req.body;
  if (!original_url) {
    return res.status(400).json({ error: 'original_url alanı zorunlu.' });
  }
  let short_id = generateShortId();
  // Aynı short_id oluşursa tekrar dene
  let exists = true;
  while (exists) {
    const check = await pool.query('SELECT 1 FROM urls WHERE short_id = $1', [
      short_id,
    ]);
    if (check.rowCount === 0) exists = false;
    else short_id = generateShortId();
  }
  try {
    await pool.query(
      'INSERT INTO urls (original_url, short_id) VALUES ($1, $2)',
      [original_url, short_id],
    );
    res.json({ short_url: `http://localhost:${PORT}/${short_id}` });
  } catch (err) {
    res.status(500).json({ error: 'Veritabanı hatası.' });
  }
});

// Kısaltılmış URL'ye tıklanınca yönlendirme ve tıklama sayısını artırma
app.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;
  try {
    const result = await pool.query(
      'SELECT original_url FROM urls WHERE short_id = $1',
      [shortId],
    );
    if (result.rowCount === 0) {
      return res.status(404).send('Kısaltılmış URL bulunamadı.');
    }
    // Tıklama sayısını artır
    await pool.query(
      'UPDATE urls SET click_count = click_count + 1 WHERE short_id = $1',
      [shortId],
    );
    // Orijinal URL'ye yönlendir
    res.redirect(result.rows[0].original_url);
  } catch (err) {
    res.status(500).send('Sunucu hatası.');
  }
});

// Kısaltılmış URL'nin istatistiklerini döndüren endpoint
app.get('/stats/:shortId', async (req, res) => {
  const { shortId } = req.params;
  try {
    const result = await pool.query(
      'SELECT original_url, short_id, click_count, created_at FROM urls WHERE short_id = $1',
      [shortId],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Kısaltılmış URL bulunamadı.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
