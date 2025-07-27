// API base URL
const API_BASE = 'http://localhost:3000/api';

// Token yönetimi
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Utility fonksiyonları
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
}

function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function showMessage(message, type = 'info') {
    // Basit alert kullanıyoruz, daha gelişmiş bir sistem eklenebilir
    alert(`${type.toUpperCase()}: ${message}`);
}

// API istekleri için helper fonksiyon
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...defaultOptions,
            ...options
        });

        if (response.status === 401) {
            // Token geçersiz, login sayfasına yönlendir
            clearAuth();
            window.location.href = 'login.html';
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showMessage('Sunucuya bağlanılamadı.', 'error');
        return null;
    }
}

// Navigation
function showSection(sectionName) {
    // Tüm section'ları gizle
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Tüm nav item'ları pasif yap
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // İlgili section'ı göster
    document.getElementById(`${sectionName}-section`).classList.add('active');

    // İlgili nav item'ı aktif yap
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Section'a göre veri yükle
    switch(sectionName) {
        case 'dashboard':
            loadDashboardStats();
            loadRecentUrls();
            break;
        case 'urls':
            loadUserUrls();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'settings':
            loadUserProfile();
            break;
    }
}

// Dashboard istatistikleri
async function loadDashboardStats() {
    const data = await apiRequest('/urls/my-urls?limit=1');
    if (!data) return;

    // Basit istatistikler (gerçek uygulamada daha detaylı API'ler olur)
    document.getElementById('total-urls').textContent = data.pagination?.total || 0;
    document.getElementById('total-clicks').textContent = data.urls?.reduce((sum, url) => sum + url.click_count, 0) || 0;
    document.getElementById('unique-visitors').textContent = 'N/A'; // Gerçek uygulamada hesaplanır
    document.getElementById('today-clicks').textContent = 'N/A'; // Gerçek uygulamada hesaplanır
}

// Son URL'leri yükle
async function loadRecentUrls() {
    const data = await apiRequest('/urls/my-urls?limit=5');
    if (!data) return;

    const container = document.getElementById('recent-urls-list');
    container.innerHTML = '';

    data.urls.forEach(url => {
        const urlElement = document.createElement('div');
        urlElement.className = 'url-item';
        urlElement.innerHTML = `
            <div class="url-info">
                <h4>${url.custom_alias || url.short_id}</h4>
                <p>${url.original_url}</p>
                <div class="url-stats">
                    <span>${url.click_count} tıklama</span>
                    <span>${new Date(url.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="url-actions">
                <button class="btn-small btn-edit" onclick="editUrl(${url.id})">Düzenle</button>
                <button class="btn-small btn-delete" onclick="deleteUrl(${url.id})">Sil</button>
            </div>
        `;
        container.appendChild(urlElement);
    });
}

// Kullanıcının URL'lerini yükle
async function loadUserUrls(page = 1) {
    const searchTerm = document.getElementById('search-urls')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';
    
    let endpoint = `/urls/my-urls?page=${page}&limit=10`;
    if (searchTerm) endpoint += `&search=${searchTerm}`;

    const data = await apiRequest(endpoint);
    if (!data) return;

    const container = document.getElementById('urls-list');
    container.innerHTML = '';

    data.urls.forEach(url => {
        const urlElement = document.createElement('div');
        urlElement.className = 'url-item';
        urlElement.innerHTML = `
            <div class="url-info">
                <h4>${url.custom_alias || url.short_id}</h4>
                <p>${url.original_url}</p>
                <div class="url-stats">
                    <span>${url.click_count} tıklama</span>
                    <span>${new Date(url.created_at).toLocaleDateString()}</span>
                    <span>${url.is_active ? 'Aktif' : 'Pasif'}</span>
                </div>
            </div>
            <div class="url-actions">
                <button class="btn-small btn-edit" onclick="editUrl(${url.id})">Düzenle</button>
                <button class="btn-small btn-delete" onclick="deleteUrl(${url.id})">Sil</button>
            </div>
        `;
        container.appendChild(urlElement);
    });

    // Pagination
    renderPagination(data.pagination);
}

// Pagination render
function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container || !pagination) return;

    container.innerHTML = '';

    // Önceki sayfa
    if (pagination.page > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Önceki';
        prevBtn.onclick = () => loadUserUrls(pagination.page - 1);
        container.appendChild(prevBtn);
    }

    // Sayfa numaraları
    for (let i = 1; i <= pagination.pages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === pagination.page ? 'active' : '';
        pageBtn.onclick = () => loadUserUrls(i);
        container.appendChild(pageBtn);
    }

    // Sonraki sayfa
    if (pagination.page < pagination.pages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Sonraki';
        nextBtn.onclick = () => loadUserUrls(pagination.page + 1);
        container.appendChild(nextBtn);
    }
}

// URL oluştur
async function createUrl() {
    const originalUrl = document.getElementById('original-url').value;
    const customAlias = document.getElementById('custom-alias').value;
    const expiresAt = document.getElementById('expires-at').value;
    const category = document.getElementById('category').value;

    if (!originalUrl) {
        showMessage('Lütfen bir URL girin.', 'error');
        return;
    }

    const data = await apiRequest('/urls/shorten', {
        method: 'POST',
        body: JSON.stringify({
            original_url: originalUrl,
            custom_alias: customAlias || undefined,
            expires_at: expiresAt || undefined,
            category_id: category || undefined
        })
    });

    if (data) {
        showMessage('URL başarıyla oluşturuldu!', 'success');
        document.getElementById('original-url').value = '';
        document.getElementById('custom-alias').value = '';
        document.getElementById('expires-at').value = '';
        document.getElementById('category').value = '';
        
        // Dashboard'a geri dön
        showSection('dashboard');
    }
}

// URL düzenle
function editUrl(urlId) {
    // Modal aç ve URL bilgilerini yükle
    showMessage('Düzenleme özelliği yakında eklenecek.', 'info');
}

// URL sil
async function deleteUrl(urlId) {
    if (!confirm('Bu URL\'yi silmek istediğinizden emin misiniz?')) {
        return;
    }

    const data = await apiRequest(`/urls/${urlId}`, {
        method: 'DELETE'
    });

    if (data) {
        showMessage('URL başarıyla silindi.', 'success');
        loadUserUrls(); // Listeyi yenile
    }
}

// Analitik yükle
function loadAnalytics() {
    // Chart.js ile grafikler oluştur
    showMessage('Analitik özelliği yakında eklenecek.', 'info');
}

// Kullanıcı profili yükle
async function loadUserProfile() {
    const data = await apiRequest('/auth/profile');
    if (!data) return;

    const user = data.user;
    document.getElementById('profile-username').value = user.username;
    document.getElementById('profile-email').value = user.email;
    document.getElementById('profile-created').value = new Date(user.created_at).toLocaleDateString();
}

// Çıkış yap
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        clearAuth();
        window.location.href = 'login.html';
    }
}

// Modal işlemleri
function openModal() {
    document.getElementById('url-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('url-modal').style.display = 'none';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Token kontrolü
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    // Kullanıcı bilgilerini göster
    document.getElementById('username').textContent = user.username;

    // Navigation event listeners
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
        });
    });

    // Search ve filter event listeners
    const searchInput = document.getElementById('search-urls');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            loadUserUrls(1);
        }, 500));
    }

    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            loadUserUrls(1);
        });
    }

    // Modal close
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Modal dışına tıklayınca kapat
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('url-modal');
        if (e.target === modal) {
            closeModal();
        }
    });

    // İlk section'ı göster
    showSection('dashboard');
});

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 