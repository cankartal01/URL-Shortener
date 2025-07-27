const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyası yolu
const dbPath = path.join(__dirname, '..', 'database', 'url_shortener.db');

// Veritabanı bağlantısı
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err.message);
  } else {
    console.log('✅ SQLite veritabanına bağlandı');
  }
});

// Promise wrapper'ları
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll
}; 