const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'url_shortener',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function createDemoUser() {
  try {
    // demo123 şifresini hash'le
    const hashedPassword = await bcrypt.hash('demo123', 10);
    console.log('Hashed password:', hashedPassword);
    
    // Demo kullanıcısını ekle veya güncelle
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (username) 
       DO UPDATE SET password_hash = $3
       RETURNING id, username, email`,
      ['demo', 'demo@example.com', hashedPassword]
    );
    
    console.log('Demo kullanıcısı oluşturuldu/güncellendi:', result.rows[0]);
    
    // Test URL'leri ekle
    const userId = result.rows[0].id;
    await pool.query(
      `INSERT INTO urls (original_url, short_id, user_id) 
       VALUES 
       ($1, $2, $3),
       ($4, $5, $3),
       ($6, $7, $3)
       ON CONFLICT (short_id) DO NOTHING`,
      [
        'https://www.google.com', 'google1', userId,
        'https://www.github.com', 'github1', userId,
        'https://www.stackoverflow.com', 'stack1', userId
      ]
    );
    
    console.log('Test URL\'leri eklendi');
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await pool.end();
  }
}

createDemoUser();