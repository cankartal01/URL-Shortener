const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'url_shortener',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  try {
    console.log('🔧 PostgreSQL veritabanı kuruluyor...');
    
    // Schema dosyasını oku
    const schemaPath = path.join(__dirname, 'postgres_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Schema'yı çalıştır
    await pool.query(schema);
    
    console.log('✅ PostgreSQL veritabanı başarıyla kuruldu!');
    console.log('📊 Veritabanı: url_shortener');
    console.log('👤 Demo kullanıcı: demo / demo123');
    
  } catch (err) {
    console.error('❌ Veritabanı kurulum hatası:', err.message);
    console.log('\n💡 Çözüm önerileri:');
    console.log('1. PostgreSQL servisinin çalıştığından emin olun');
    console.log('2. .env dosyasındaki veritabanı bilgilerini kontrol edin');
    console.log('3. Veritabanının oluşturulduğundan emin olun');
  } finally {
    await pool.end();
  }
}

setupDatabase(); 