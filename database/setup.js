const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyası yolu
const dbPath = path.join(__dirname, 'url_shortener.db');

// Veritabanı bağlantısı
const db = new sqlite3.Database(dbPath);

console.log('🗄️  Veritabanı kurulumu başlıyor...');

// Tabloları oluştur
db.serialize(() => {
  // Kullanıcılar tablosu
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Kullanıcılar tablosu oluşturulamadı:', err.message);
    } else {
      console.log('✅ Kullanıcılar tablosu oluşturuldu');
    }
  });

  // URL'ler tablosu
  db.run(`CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL,
    short_id TEXT UNIQUE NOT NULL,
    custom_alias TEXT UNIQUE,
    user_id INTEGER,
    click_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ URL\'ler tablosu oluşturulamadı:', err.message);
    } else {
      console.log('✅ URL\'ler tablosu oluşturuldu');
    }
  });

  // Tıklama geçmişi tablosu
  db.run(`CREATE TABLE IF NOT EXISTS click_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    referer TEXT,
    clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (url_id) REFERENCES urls (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ Tıklama geçmişi tablosu oluşturulamadı:', err.message);
    } else {
      console.log('✅ Tıklama geçmişi tablosu oluşturuldu');
    }
  });

  // Kategoriler tablosu
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ Kategoriler tablosu oluşturulamadı:', err.message);
    } else {
      console.log('✅ Kategoriler tablosu oluşturuldu');
    }
  });

  // URL kategorileri ilişki tablosu
  db.run(`CREATE TABLE IF NOT EXISTS url_categories (
    url_id INTEGER,
    category_id INTEGER,
    PRIMARY KEY (url_id, category_id),
    FOREIGN KEY (url_id) REFERENCES urls (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ URL kategorileri tablosu oluşturulamadı:', err.message);
    } else {
      console.log('✅ URL kategorileri tablosu oluşturuldu');
    }
  });

  // İndeksler
  db.run(`CREATE INDEX IF NOT EXISTS idx_urls_short_id ON urls(short_id)`, (err) => {
    if (err) {
      console.error('❌ URL indeksi oluşturulamadı:', err.message);
    } else {
      console.log('✅ URL indeksi oluşturuldu');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id)`, (err) => {
    if (err) {
      console.error('❌ Kullanıcı indeksi oluşturulamadı:', err.message);
    } else {
      console.log('✅ Kullanıcı indeksi oluşturuldu');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_click_history_url_id ON click_history(url_id)`, (err) => {
    if (err) {
      console.error('❌ Tıklama geçmişi indeksi oluşturulamadı:', err.message);
    } else {
      console.log('✅ Tıklama geçmişi indeksi oluşturuldu');
    }
  });

  // Örnek veriler ekle
  db.run(`INSERT OR IGNORE INTO users (username, email, password_hash) VALUES 
    ('demo', 'demo@example.com', '$2b$10$demo.hash.for.testing')`, (err) => {
    if (err) {
      console.error('❌ Demo kullanıcı eklenemedi:', err.message);
    } else {
      console.log('✅ Demo kullanıcı eklendi');
    }
  });

  db.run(`INSERT OR IGNORE INTO urls (original_url, short_id, user_id) VALUES 
    ('https://example.com', 'demo123', 1)`, (err) => {
    if (err) {
      console.error('❌ Demo URL eklenemedi:', err.message);
    } else {
      console.log('✅ Demo URL eklendi');
    }
  });

  console.log('🎉 Veritabanı kurulumu tamamlandı!');
  console.log(`📁 Veritabanı dosyası: ${dbPath}`);
});

// Veritabanını kapat
db.close((err) => {
  if (err) {
    console.error('❌ Veritabanı kapatılamadı:', err.message);
  } else {
    console.log('🔒 Veritabanı bağlantısı kapatıldı');
  }
}); 