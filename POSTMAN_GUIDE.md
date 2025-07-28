# URL Shortener API - Postman Test Guide

Bu rehber, URL kısaltıcı API'nizi Postman ile nasıl test edeceğinizi gösterir.

## 🚀 Başlangıç

### 1. Sunucuyu Başlatın
```bash
cd backend
npm start
```
Sunucu `http://localhost:3000` adresinde çalışacak.

### 2. Postman'i Açın
- Postman uygulamasını açın
- Yeni bir Collection oluşturun: "URL Shortener API"

## 📋 API Endpoints

### 🔐 Authentication Endpoints

#### 1. Kullanıcı Kaydı (Register)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/auth/register`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "123456"
  }
  ```
- **Beklenen Yanıt:**
  ```json
  {
    "message": "Kullanıcı başarıyla oluşturuldu",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### 2. Kullanıcı Girişi (Login)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/auth/login`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "username": "testuser",
    "password": "123456"
  }
  ```
- **Beklenen Yanıt:**
  ```json
  {
    "message": "Giriş başarılı",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### 3. Kullanıcı Profili (Profile)
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/auth/profile`
- **Headers:**
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  ```

### 🔗 URL Management Endpoints

> **Not:** Aşağıdaki tüm URL endpoint'leri için Authorization header'ı gereklidir!

#### 4. URL Kısaltma (Shorten URL)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/urls/shorten`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_TOKEN_HERE
  ```
- **Body (raw JSON):**
  ```json
  {
    "original_url": "https://www.google.com",
    "custom_alias": "google",
    "expires_at": "2024-12-31T23:59:59.000Z"
  }
  ```
- **Beklenen Yanıt:**
  ```json
  {
    "short_url": "http://localhost:3000/google",
    "url_id": 1,
    "short_id": "abc123",
    "custom_alias": "google"
  }
  ```

#### 5. Kullanıcının URL'lerini Listele
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/urls/my-urls`
- **Headers:**
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  ```
- **Query Parameters (opsiyonel):**
  - `page`: Sayfa numarası (varsayılan: 1)
  - `limit`: Sayfa başına kayıt (varsayılan: 10)
  - `search`: Arama terimi

#### 6. URL İstatistikleri
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/urls/stats/1`
- **Headers:**
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  ```
- **URL'deki `1`:** URL ID'si

#### 7. Analitik Veriler
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/urls/analytics`
- **Headers:**
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  ```
- **Query Parameters (opsiyonel):**
  - `days`: Kaç günlük veri (varsayılan: 7)

#### 8. URL Güncelleme
- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/urls/1`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_TOKEN_HERE
  ```
- **Body (raw JSON):**
  ```json
  {
    "custom_alias": "new-alias",
    "is_active": true,
    "expires_at": "2024-12-31T23:59:59.000Z"
  }
  ```

#### 9. URL Silme
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/api/urls/1`
- **Headers:**
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  ```

#### 10. Tek URL Bilgisi
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/urls/1`
- **Headers:**
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  ```

### 🌐 Public Endpoints

#### 11. URL Yönlendirme (Redirect)
- **Method:** `GET`
- **URL:** `http://localhost:3000/google` (veya kısa URL)
- **Not:** Bu endpoint browser'da test edilmelidir, Postman redirect'i takip eder.

#### 12. Eski API Uyumluluğu
- **Method:** `POST`
- **URL:** `http://localhost:3000/shorten`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "original_url": "https://www.example.com"
  }
  ```

#### 13. API Bilgisi
- **Method:** `GET`
- **URL:** `http://localhost:3000/`

## 🔧 Postman Collection Kurulumu

### Adım 1: Environment Oluşturun
1. Postman'de "Environments" sekmesine gidin
2. "Add" butonuna tıklayın
3. Environment adı: "URL Shortener Local"
4. Variables ekleyin:
   - `base_url`: `http://localhost:3000`
   - `token`: (boş bırakın, login sonrası dolduracaksınız)

### Adım 2: Collection Oluşturun
1. "Collections" sekmesinde "New Collection" tıklayın
2. Adı: "URL Shortener API"
3. Yukarıdaki endpoint'leri tek tek ekleyin

### Adım 3: Token Yönetimi
1. Login endpoint'ini çalıştırın
2. Response'dan token'ı kopyalayın
3. Environment'taki `token` değişkenine yapıştırın
4. Diğer endpoint'lerde Authorization header'ında `Bearer {{token}}` kullanın

## 🧪 Test Senaryoları

### Senaryo 1: Temel Kullanım
1. Kullanıcı kaydı yap
2. Login ol ve token'ı al
3. URL kısalt
4. Kısaltılmış URL'yi browser'da test et
5. İstatistikleri kontrol et

### Senaryo 2: Özel Alias
1. Login ol
2. Özel alias ile URL kısalt
3. Aynı alias ile tekrar dene (hata almalısın)
4. URL'yi güncelle

### Senaryo 3: Analitik
1. Birkaç URL kısalt
2. Browser'da bu URL'leri ziyaret et
3. Analytics endpoint'ini çağır
4. Verilerin doğru geldiğini kontrol et

## ❌ Hata Durumları

### 401 Unauthorized
- Token eksik veya geçersiz
- Authorization header'ını kontrol edin

### 400 Bad Request
- Gerekli alanlar eksik
- Request body'yi kontrol edin

### 404 Not Found
- URL bulunamadı
- URL ID'sini kontrol edin

### 500 Internal Server Error
- Sunucu hatası
- Console loglarını kontrol edin

## 💡 İpuçları

1. **Token Yönetimi:** Login sonrası token'ı environment variable olarak kaydedin
2. **Base URL:** Environment'ta base URL tanımlayın, endpoint'lerde `{{base_url}}` kullanın
3. **Test Scripts:** Postman'de test scriptleri yazarak otomatik doğrulama yapın
4. **Collection Runner:** Tüm testleri sırayla çalıştırmak için Collection Runner kullanın

## 📊 Örnek Test Script

Login endpoint'i için Postman test script'i:

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.token).to.exist;
    pm.environment.set("token", jsonData.token);
});
```

Bu rehberi takip ederek API'nizi kapsamlı bir şekilde test edebilirsiniz!