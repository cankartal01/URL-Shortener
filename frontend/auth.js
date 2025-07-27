// API base URL
const API_BASE = 'http://localhost:3000/api';

// Token yönetimi
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Utility fonksiyonları
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function setLoading(button, loading = true) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner"></i> Yükleniyor...';
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

function saveToken(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

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

// Login form handler
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const loginButton = loginForm.querySelector('button[type="submit"]');
    
    // Orijinal buton metnini kaydet
    loginButton.dataset.originalText = loginButton.innerHTML;
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showMessage('Lütfen tüm alanları doldurun.', 'error');
            return;
        }
        
        setLoading(loginButton, true);
        
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                saveToken(data.token, data.user);
                showMessage('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
                
                // Dashboard'a yönlendir
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showMessage(data.error || 'Giriş başarısız.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Sunucuya bağlanılamadı.', 'error');
        } finally {
            setLoading(loginButton, false);
        }
    });
}

// Register form handler
if (document.getElementById('registerForm')) {
    const registerForm = document.getElementById('registerForm');
    const registerButton = registerForm.querySelector('button[type="submit"]');
    
    // Orijinal buton metnini kaydet
    registerButton.dataset.originalText = registerButton.innerHTML;
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!username || !email || !password || !confirmPassword) {
            showMessage('Lütfen tüm alanları doldurun.', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Şifreler eşleşmiyor.', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Şifre en az 6 karakter olmalıdır.', 'error');
            return;
        }
        
        setLoading(registerButton, true);
        
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                saveToken(data.token, data.user);
                showMessage('Kayıt başarılı! Yönlendiriliyorsunuz...', 'success');
                
                // Dashboard'a yönlendir
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showMessage(data.error || 'Kayıt başarısız.', 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            showMessage('Sunucuya bağlanılamadı.', 'error');
        } finally {
            setLoading(registerButton, false);
        }
    });
}

// Sayfa yüklendiğinde token kontrolü
document.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    const user = getUser();
    
    // Eğer kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
    if (token && user && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
    }
    
    if (token && user && window.location.pathname.includes('register.html')) {
        window.location.href = 'dashboard.html';
    }
}); 