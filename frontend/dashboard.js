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
    // Modern toast notification sistemi
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Toast container'ı oluştur (yoksa)
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    
    // Animasyon için timeout
    setTimeout(() => toast.classList.add('show'), 100);
    
    // 4 saniye sonra kaldır
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
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
    const data = await apiRequest('/urls/my-urls?limit=1000');
    if (!data) return;

    // Basit istatistikler (gerçek uygulamada daha detaylı API'ler olur)
    document.getElementById('total-urls').textContent = data.pagination?.total || 0;
    document.getElementById('total-clicks').textContent = data.urls?.reduce((sum, url) => sum + url.click_count, 0) || 0;
    // Benzersiz ziyaretçi sayısını analytics'ten çek
const analytics = await apiRequest('/urls/analytics?days=7');
if (analytics && analytics.visitorsData && analytics.clicksData) {
    // Toplam benzersiz ziyaretçi (günlük toplamların toplamı)
    const totalUniqueVisitors = analytics.visitorsData.reduce((sum, item) => sum + item.visitors, 0);
    document.getElementById('unique-visitors').textContent = totalUniqueVisitors;

    const todayUTC = new Date();
    todayUTC.setUTCDate(todayUTC.getUTCDate() - 1); // 1 gün geri
    const yyyy = todayUTC.getUTCFullYear();
    const mm = String(todayUTC.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(todayUTC.getUTCDate()).padStart(2, '0');
    const todayDateStr = `${yyyy}-${mm}-${dd}`;

     console.log('clicksData:', analytics.clicksData);
    console.log('todayDateStr:', todayDateStr);

    // clicksData: [{date: '2025-07-28', clicks: 5}, ...]
    const todayClicks = analytics.clicksData
        .filter(item => item.date === todayDateStr)
        .reduce((sum, item) => sum + item.clicks, 0);
    document.getElementById('today-clicks').textContent = todayClicks;
} else {
    document.getElementById('unique-visitors').textContent = 'N/A';
    document.getElementById('today-clicks').textContent = 'N/A';
}
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
            
        })
    });

    if (data) {
        showMessage('URL başarıyla oluşturuldu!', 'success');
        document.getElementById('original-url').value = '';
        document.getElementById('custom-alias').value = '';
        document.getElementById('expires-at').value = '';
       
        
        // Dashboard'a geri dön
        showSection('dashboard');
    }
}

// Global değişken - düzenlenen URL ID'si
let currentEditingUrlId = null;

// URL düzenle
async function editUrl(urlId) {
    currentEditingUrlId = urlId;
    
    try {
        // URL bilgilerini API'den getir
        const data = await apiRequest(`/urls/${urlId}`);
        if (!data || !data.url) {
            showMessage('URL bilgileri alınamadı.', 'error');
            return;
        }

        const url = data.url;
        
        // Form alanlarını doldur
        document.getElementById('edit-original-url').value = url.original_url;
        document.getElementById('edit-short-id').value = url.short_id;
        document.getElementById('edit-custom-alias').value = url.custom_alias || '';
        
        // Tarih formatını düzenle (datetime-local için)
        if (url.expires_at) {
            const date = new Date(url.expires_at);
            const formattedDate = date.toISOString().slice(0, 16);
            document.getElementById('edit-expires-at').value = formattedDate;
        } else {
            document.getElementById('edit-expires-at').value = '';
        }
        
        document.getElementById('edit-is-active').checked = url.is_active;
        
        // İstatistikleri göster
        document.getElementById('edit-click-count').textContent = `${url.click_count} tıklama`;
        document.getElementById('edit-created-at').textContent =
            `Oluşturulma: ${new Date(url.created_at).toLocaleDateString('tr-TR')}`;
        
        // Modal'ı aç
        openModal();
        
    } catch (error) {
        console.error('URL düzenleme hatası:', error);
        showMessage('URL bilgileri yüklenirken hata oluştu.', 'error');
    }
}

// URL değişikliklerini kaydet
async function saveUrlChanges() {
    if (!currentEditingUrlId) {
        showMessage('Geçersiz URL ID.', 'error');
        return;
    }

    const customAlias = document.getElementById('edit-custom-alias').value.trim();
    const expiresAt = document.getElementById('edit-expires-at').value;
    const isActive = document.getElementById('edit-is-active').checked;

    // Basit validasyon
    if (customAlias && !/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
        showMessage('Özel isim sadece harf, rakam, tire ve alt çizgi içerebilir.', 'error');
        return;
    }

    try {
        const updateData = {
            custom_alias: customAlias || null,
            expires_at: expiresAt || null,
            is_active: isActive
        };

        const data = await apiRequest(`/urls/${currentEditingUrlId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        if (data && data.message) {
            showMessage(data.message, 'success');
            closeModal();
            
            // Listeleri yenile
            const currentSection = document.querySelector('.section.active').id;
            if (currentSection === 'dashboard-section') {
                loadRecentUrls();
            } else if (currentSection === 'urls-section') {
                loadUserUrls();
            }
        } else {
            showMessage('URL güncellenirken hata oluştu.', 'error');
        }
    } catch (error) {
        console.error('URL güncelleme hatası:', error);
        showMessage('URL güncellenirken hata oluştu.', 'error');
    }
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
async function loadAnalytics() {
    try {
        const data = await apiRequest('/urls/analytics?days=7');
        if (!data) {
            console.log('Analitik verisi alınamadı');
            return;
        }

        console.log('Analitik verisi:', data);

        // Tıklanma grafiği
        if (data.clicksData && data.clicksData.length > 0) {
            createClicksChart(data.clicksData);
        } else {
            console.log('Tıklama verisi bulunamadı');
            // Boş veri için placeholder göster
            createClicksChart([]);
        }
        
        // Ziyaretçi grafiği
        if (data.visitorsData && data.visitorsData.length > 0) {
            createVisitorsChart(data.visitorsData);
        } else {
            console.log('Ziyaretçi verisi bulunamadı');
            // Boş veri için placeholder göster
            createVisitorsChart([]);
        }
        
    } catch (error) {
        console.error('Analitik yükleme hatası:', error);
        showMessage('Analitik veriler yüklenirken hata oluştu.', 'error');
    }
}

// Tıklanma grafiği oluştur
function createClicksChart(clicksData) {
    const ctx = document.getElementById('clicks-chart');
    if (!ctx) return;

    // Mevcut grafiği temizle
    if (window.clicksChart) {
        window.clicksChart.destroy();
    }

    // Boş veri durumu için varsayılan değerler
    if (!clicksData || clicksData.length === 0) {
        clicksData = [];
        // Son 7 gün için boş veri oluştur
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            clicksData.push({
                date: date.toISOString().split('T')[0],
                clicks: 0
            });
        }
    }

    const labels = clicksData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('tr-TR', {
            month: 'short',
            day: 'numeric'
        });
    });

    const data = clicksData.map(item => item.clicks);

    window.clicksChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tıklanma Sayısı',
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3498db',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            family: 'Segoe UI'
                        },
                        color: '#2c3e50'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#7f8c8d',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#7f8c8d',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#2980b9'
                }
            }
        }
    });
}

// Ziyaretçi grafiği oluştur
function createVisitorsChart(visitorsData) {
    const ctx = document.getElementById('visitors-chart');
    if (!ctx) return;

    // Mevcut grafiği temizle
    if (window.visitorsChart) {
        window.visitorsChart.destroy();
    }

    const labels = visitorsData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('tr-TR', {
            month: 'short',
            day: 'numeric'
        });
    });

    const data = visitorsData.map(item => item.visitors);

    window.visitorsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Benzersiz Ziyaretçi',
                data: data,
                backgroundColor: 'rgba(46, 204, 113, 0.8)',
                borderColor: '#2ecc71',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            family: 'Segoe UI'
                        },
                        color: '#2c3e50'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#7f8c8d',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#7f8c8d',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
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
    
    // Form verilerini temizle
    currentEditingUrlId = null;
    document.getElementById('edit-original-url').value = '';
    document.getElementById('edit-short-id').value = '';
    document.getElementById('edit-custom-alias').value = '';
    document.getElementById('edit-expires-at').value = '';
    document.getElementById('edit-is-active').checked = true;
    document.getElementById('edit-click-count').textContent = '0 tıklama';
    document.getElementById('edit-created-at').textContent = '-';
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