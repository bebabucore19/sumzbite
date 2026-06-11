const API_BASE = window.location.origin;
const loginForm = document.getElementById('loginForm');
const loginAlert = document.getElementById('loginAlert');

function showAlert(message, type = 'success') {
  loginAlert.textContent = message;
  loginAlert.className = `alert show ${type}`;
}

if (localStorage.getItem('sumzbite_admin_token')) {
  window.location.href = 'dashboard.html';
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    username: document.getElementById('username').value.trim(),
    password: document.getElementById('password').value
  };

  try {
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login gagal');

    localStorage.setItem('sumzbite_admin_token', data.token);
    localStorage.setItem('sumzbite_admin_name', data.admin.full_name || data.admin.username);
    showAlert('Login berhasil. Mengalihkan ke dashboard...', 'success');
    window.location.href = 'dashboard.html';
  } catch (error) {
    showAlert(error.message, 'error');
  }
});
