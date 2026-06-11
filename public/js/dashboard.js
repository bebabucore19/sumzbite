const API_BASE = window.location.origin;
const TOKEN_KEY = 'sumzbite_admin_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function requireLogin() {
  if (!getToken()) {
    window.location.href = 'login.html';
  }
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('sumzbite_admin_name');
  window.location.href = 'login.html';
}

function rupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(number || 0));
}

function formatDate(dateValue) {
  if (!dateValue) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateValue));
}

function formatPrintedDate() {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(new Date());
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function showAlert(element, message, type = 'success') {
  if (!element) return;
  element.textContent = message;
  element.className = `alert show ${type}`;
}

async function fetchJson(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${getToken()}`
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok) throw new Error(data.message || 'Terjadi kesalahan');
  return data;
}

async function loadStats() {
  try {
    const stats = await fetchJson(`${API_BASE}/api/stats`);
    if (!stats) return;
    document.getElementById('totalProducts').textContent = stats.total_products || 0;
    document.getElementById('totalOrders').textContent = stats.total_orders || 0;
    document.getElementById('pendingOrders').textContent = stats.pending_orders || 0;
    document.getElementById('totalRevenue').textContent = rupiah(stats.total_revenue || 0);
  } catch (error) {
    console.error(error);
  }
}

async function loadProducts() {
  const tbody = document.getElementById('dashboardProducts');
  if (!tbody) return;

  try {
    const products = await fetchJson(`${API_BASE}/api/products`);
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="4">Belum ada produk.</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(product => `
      <tr>
        <td><strong>${product.name}</strong><br><small>${product.description || '-'}</small></td>
        <td>${rupiah(product.price)}</td>
        <td>${product.stock ?? 0}</td>
        <td><span class="status ${Number(product.is_active) === 1 ? 'selesai' : 'dibatalkan'}">${Number(product.is_active) === 1 ? 'Aktif' : 'Nonaktif'}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4">Gagal mengambil produk: ${error.message}</td></tr>`;
  }
}

async function updateOrderStatus(orderId, status) {
  await fetchJson(`${API_BASE}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  await Promise.all([loadStats(), loadOrders(), loadReport()]);
}

async function loadOrders() {
  const tbody = document.getElementById('dashboardOrders');
  if (!tbody) return;

  try {
    const orders = await fetchJson(`${API_BASE}/api/orders`);
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="8">Belum ada pembelian.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(order => `
      <tr>
        <td>${formatDate(order.created_at)}</td>
        <td><strong>${order.customer_name}</strong><br><small>${order.customer_address || '-'}</small></td>
        <td>${order.customer_phone}</td>
        <td>${order.product_name || '-'}</td>
        <td>${order.quantity}</td>
        <td>${rupiah(order.total_price)}</td>
        <td>
          <select class="status-select" data-order-id="${order.id}">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>pending</option>
            <option value="diproses" ${order.status === 'diproses' ? 'selected' : ''}>diproses</option>
            <option value="selesai" ${order.status === 'selesai' ? 'selected' : ''}>selesai</option>
            <option value="dibatalkan" ${order.status === 'dibatalkan' ? 'selected' : ''}>dibatalkan</option>
          </select>
        </td>
        <td>${order.note || '-'}</td>
      </tr>
    `).join('');

    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async () => {
        try {
          await updateOrderStatus(select.dataset.orderId, select.value);
        } catch (error) {
          alert(`Gagal mengubah status: ${error.message}`);
        }
      });
    });
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="8">Gagal mengambil pembelian: ${error.message}</td></tr>`;
  }
}

function setupProductForm() {
  const form = document.getElementById('productForm');
  const alertBox = document.getElementById('productAlert');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      name: document.getElementById('productName').value.trim(),
      price: Number(document.getElementById('productPrice').value || 0),
      stock: Number(document.getElementById('productStock').value || 0),
      description: document.getElementById('productDesc').value.trim(),
      image_url: document.getElementById('productImage').value.trim() || 'img/dimsum-mix.jpeg'
    };

    try {
      await fetchJson(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      showAlert(alertBox, 'Produk berhasil ditambahkan.', 'success');
      form.reset();
      await Promise.all([loadStats(), loadProducts()]);
    } catch (error) {
      showAlert(alertBox, `Gagal menambahkan produk: ${error.message}`, 'error');
    }
  });
}

function setupReportFilter() {
  const period = document.getElementById('reportPeriod');
  const valueBox = document.getElementById('reportValueBox');
  const loadButton = document.getElementById('loadReportBtn');
  const printButton = document.getElementById('printReportBtn');
  const valueInput = document.getElementById('reportValue');

  if (!period || !valueBox || !valueInput) return;

  valueInput.value = todayInputValue();

  function updateValueInput() {
    const selected = period.value;
    const label = valueBox.querySelector('label');
    const oldValue = valueInput.value;

    if (selected === 'monthly') {
      label.textContent = 'Bulan';
      valueInput.type = 'month';
      valueInput.value = oldValue ? oldValue.slice(0, 7) : todayInputValue().slice(0, 7);
    } else if (selected === 'yearly') {
      label.textContent = 'Tahun';
      valueInput.type = 'number';
      valueInput.min = '2020';
      valueInput.max = '2100';
      valueInput.value = new Date().getFullYear();
    } else {
      label.textContent = 'Tanggal';
      valueInput.type = 'date';
      valueInput.removeAttribute('min');
      valueInput.removeAttribute('max');
      valueInput.value = /^\d{4}-\d{2}-\d{2}$/.test(oldValue) ? oldValue : todayInputValue();
    }
  }

  period.addEventListener('change', () => {
    updateValueInput();
    loadReport();
  });
  loadButton?.addEventListener('click', loadReport);
  printButton?.addEventListener('click', () => {
    document.getElementById('printedAt').textContent = formatPrintedDate();
    window.print();
  });
  updateValueInput();
}

async function loadReport() {
  const period = document.getElementById('reportPeriod')?.value || 'daily';
  const value = document.getElementById('reportValue')?.value || todayInputValue();
  const tbody = document.getElementById('reportOrders');
  if (!tbody) return;

  try {
    const params = new URLSearchParams({ period, value });
    const report = await fetchJson(`${API_BASE}/api/reports/orders?${params.toString()}`);
    if (!report) return;

    document.getElementById('reportTitle').textContent = report.title;
    document.getElementById('reportSubtitle').textContent = `Periode: ${report.value}. Data dicetak dari dashboard admin Sumzbite.`;
    document.getElementById('printedAt').textContent = formatPrintedDate();
    document.getElementById('reportTotalOrders').textContent = report.summary.total_orders || 0;
    document.getElementById('reportTotalItems').textContent = report.summary.total_items || 0;
    document.getElementById('reportTotalRevenue').textContent = rupiah(report.summary.total_revenue || 0);

    if (!report.orders.length) {
      tbody.innerHTML = '<tr><td colspan="8">Belum ada pembelian pada periode ini.</td></tr>';
      return;
    }

    tbody.innerHTML = report.orders.map((order, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${formatDate(order.created_at)}</td>
        <td>${order.customer_name}</td>
        <td>${order.customer_phone}</td>
        <td>${order.product_name || '-'}</td>
        <td>${order.quantity}</td>
        <td>${rupiah(order.total_price)}</td>
        <td><span class="status ${order.status}">${order.status}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="8">Gagal mengambil laporan: ${error.message}</td></tr>`;
  }
}

function setupButtons() {
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('refreshOrdersBtn')?.addEventListener('click', loadOrders);
}

document.addEventListener('DOMContentLoaded', async () => {
  requireLogin();
  setupButtons();
  setupProductForm();
  setupReportFilter();
  await Promise.all([loadStats(), loadProducts(), loadOrders(), loadReport()]);
});
