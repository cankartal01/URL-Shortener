-- PostgreSQL URL Shortener Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- URLs table
CREATE TABLE IF NOT EXISTS urls (
    id SERIAL PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_id VARCHAR(20) UNIQUE NOT NULL,
    custom_alias VARCHAR(50) UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    click_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- URL Categories junction table
CREATE TABLE IF NOT EXISTS url_categories (
    url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (url_id, category_id)
);

-- Click History table
CREATE TABLE IF NOT EXISTS click_history (
    id SERIAL PRIMARY KEY,
    url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_urls_short_id ON urls(short_id);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_custom_alias ON urls(custom_alias);
CREATE INDEX IF NOT EXISTS idx_click_history_url_id ON click_history(url_id);
CREATE INDEX IF NOT EXISTS idx_click_history_clicked_at ON click_history(clicked_at);

-- Updated trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_urls_updated_at BEFORE UPDATE ON urls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo data
INSERT INTO users (username, email, password_hash) VALUES 
('demo', 'demo@example.com', '$2b$10$demo.hash.here') 
ON CONFLICT (username) DO NOTHING;

INSERT INTO categories (name, description) VALUES 
('Genel', 'Genel kategorisi'),
('Sosyal Medya', 'Sosyal medya linkleri'),
('İş', 'İş ile ilgili linkler')
ON CONFLICT DO NOTHING; 