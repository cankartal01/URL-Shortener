# URL Kısaltıcı

Modern ve kullanıcı dostu bir URL kısaltıcı uygulaması. Uzun URL'leri kısa, hatırlanabilir linklere dönüştürür ve tıklama istatistiklerini takip eder. Hem bireysel hem de kurumsal kullanıcılar için hızlı, güvenli ve kolay bir çözüm sunar.

## 🚀 Özellikler

- **URL Kısaltma**: Uzun URL'leri kısa, özel ve paylaşılabilir linklere dönüştürme
- **İstatistik Takibi**: Her kısaltılmış URL için tıklama sayısı, oluşturulma tarihi ve son erişim zamanı
- **Modern Arayüz**: Temiz, responsive ve kullanıcı dostu web arayüzü
- **Gerçek Zamanlı Yönlendirme**: Kısa URL'lere tıklandığında anında yönlendirme ve tıklama kaydı
- **PostgreSQL Veritabanı**: Güvenilir ve ölçeklenebilir veri saklama
- **Kullanıcı Yönetimi (isteğe bağlı)**: Kayıt, giriş ve kişisel URL yönetimi
- **API Desteği**: Dış sistemlerle kolay entegrasyon için RESTful API
- **Gelişmiş Güvenlik**: Rate limiting, input validation, SQL injection koruması ve CORS yapılandırması

## 🛠️ Kullanılan Teknolojiler

### Backend
- **Node.js** – JavaScript runtime ortamı
- **Express.js** – Hızlı ve esnek web framework
- **PostgreSQL** – Güçlü ilişkisel veritabanı
- **CORS** – Güvenli cross-origin istekleri
- **dotenv** – Ortam değişkenleri yönetimi
- **JWT** – Kimlik doğrulama (isteğe bağlı)
- **Helmet** – HTTP güvenlik başlıkları

### Frontend
- **HTML5** – Yapısal markup
- **CSS3** – Modern ve responsive tasarım
- **Vanilla JavaScript** – İstemci tarafı işlevsellik

## 📋 Gereksinimler

- Node.js (v14 veya üzeri)
- PostgreSQL veritabanı
- npm veya yarn

## 🚀 Kurulum

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd URL
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Veritabanını Kurun

PostgreSQL veritabanınızda aşağıdaki tabloyu oluşturun:

```sql
CREATE TABLE urls (
    id SERIAL PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_id VARCHAR(10) UNIQUE NOT NULL,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP
);
```

İsteğe bağlı olarak kullanıcı yönetimi için ek tablolar ekleyebilirsiniz.

### 4. Ortam Değişkenlerini Ayarlayın

Proje kök dizininde `.env` dosyası oluşturun:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
JWT_SECRET=your-secret-key
```

### 5. Uygulamayı Başlatın

```bash
# Backend'i başlatın
node backend/index.js

# Frontend'i açın
# frontend/index.html dosyasını tarayıcınızda açın
```

## 📖 Kullanım

1. Tarayıcınızda `frontend/index.html` dosyasını açın
2. Uzun URL'yi giriş kutusuna yapıştırın
3. "Kısalt" butonuna tıklayın
4. Oluşturulan kısa URL'yi kopyalayın ve paylaşın
5. İstatistikleri görüntülemek için sayfayı yenileyin

## 🔧 API Endpoints

### URL Kısaltma
```
POST /shorten
Content-Type: application/json

{
  "original_url": "https://example.com/very-long-url"
}
```

**Yanıt:**
```json
{
  "short_url": "http://localhost:3000/abc123"
}
```

### URL Yönlendirme
```
GET /:shortId
```
Kısa ID'ye sahip URL'ye tıklandığında orijinal URL'ye yönlendirir.

### İstatistikler
```
GET /stats/:shortId
```

**Yanıt:**
```json
{
  "original_url": "https://example.com/very-long-url",
  "short_id": "abc123",
  "click_count": 5,
  "created_at": "2024-01-15T10:30:00Z",
  "last_accessed": "2024-01-20T12:00:00Z"
}
```

### (İsteğe Bağlı) Kullanıcı İşlemleri
```
POST /register
POST /login
GET /my-urls
```

## 📁 Proje Yapısı

```
URL/
├── backend/
│   ├── index.js          # Express sunucu
│   ├── auth.js           # Kimlik doğrulama (isteğe bağlı)
│   └── db.js             # Veritabanı bağlantısı
├── frontend/
│   ├── index.html        # Ana sayfa
│   ├── style.css         # Stiller
│   └── app.js            # İstemci tarafı kod
├── package.json          # Bağımlılıklar
├── .env                  # Ortam değişkenleri
└── README.md             # Bu dosya
```

## 🔒 Güvenlik

- CORS yapılandırması ile güvenli cross-origin istekleri
- SQL injection koruması için parametreli sorgular
- Input validation ve sanitization
- Rate limiting ile kötüye kullanımı önleme
- JWT ile kimlik doğrulama (isteğe bağlı)

## 🚀 Geliştirme ve Katkı

### Yeni Özellikler Ekleme

1. Backend'de yeni endpoint'ler ekleyin (`backend/index.js`)
2. Frontend'de yeni UI bileşenleri ekleyin (`frontend/index.html`)
3. Stilleri güncelleyin (`frontend/style.css`)
4. Gerekirse veritabanı şemasını güncelleyin

### Veritabanı Değişiklikleri

Veritabanı şemasını değiştirdiğinizde, migration script'leri oluşturun ve test edin.

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Yeni bir feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun
