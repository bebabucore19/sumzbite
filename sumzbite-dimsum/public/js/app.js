const API_BASE = window.location.origin;

const fallbackProducts = [
  {
    id: 1,
    name: 'Dimsum Mix',
    description: 'Paket dimsum isi campuran dengan rasa gurih, lembut, dan cocok untuk camilan keluarga.',
    price: 25000,
    image_url: 'img/dimsum-mix.jpeg',
    stock: 50,
    is_active: 1
  },
  {
    id: 2,
    name: 'Dimsum Spicy Mayo',
    description: 'Dimsum lembut dengan saus spicy mayo creamy yang pedasnya pas dan bikin nagih.',
    price: 27000,
    image_url: 'img/dimsum-spicy-mayo.jpeg',
    stock: 45,
    is_active: 1
  },
  {
    id: 3,
    name: 'Dimsum Goreng',
    description: 'Dimsum goreng renyah di luar, juicy di dalam, cocok dimakan hangat-hangat.',
    price: 23000,
    image_url: 'img/dimsum-goreng.jpeg',
    stock: 40,
    is_active: 1
  }
];

let productsCache = [];

function rupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(number || 0));
}

function showAlert(element, message, type = 'success') {
  if (!element) return;
  element.textContent = message;
  element.className = `alert show ${type}`;
}

async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE}/api/products`);
    if (!response.ok) throw new Error('API tidak aktif');
    const data = await response.json();
    productsCache = data.length ? data : fallbackProducts;
  } catch (error) {
    productsCache = fallbackProducts;
  }
  return productsCache;
}

function productCard(product) {
  const image = product.image_url || fallbackProducts[0].image_url;
  return `
    <article class="product-card">
      <div class="image-wrap">
        <img src="${image}" alt="${product.name}" />
      </div>
      <div class="content">
        <div class="price-row">
          <h3>${product.name}</h3>
          <span class="stock">Stok ${product.stock ?? 0}</span>
        </div>
        <p>${product.description || 'Dimsum lezat dari Sumzbite.'}</p>
        <div class="price-row">
          <span class="price">${rupiah(product.price)}</span>
          <a class="btn primary" href="pembelian.html?product=${product.id}">Pesan</a>
        </div>
      </div>
    </article>
  `;
}

async function renderProducts() {
  const featured = document.getElementById('featuredProducts');
  const productList = document.getElementById('productList');
  if (!featured && !productList) return;

  const products = await fetchProducts();
  const html = products.filter(item => Number(item.is_active) !== 0).map(productCard).join('');

  if (featured) featured.innerHTML = html;
  if (productList) productList.innerHTML = html;
}

function getQueryProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('product');
}

async function setupOrderForm() {
  const form = document.getElementById('orderForm');
  const select = document.getElementById('product_id');
  const qtyInput = document.getElementById('quantity');
  const totalElement = document.getElementById('orderTotal');
  const alertBox = document.getElementById('orderAlert');
  if (!form || !select) return;

  const products = await fetchProducts();
  select.innerHTML = products
    .filter(item => Number(item.is_active) !== 0)
    .map(product => `<option value="${product.id}" data-price="${product.price}">${product.name} - ${rupiah(product.price)}</option>`)
    .join('');

  const selectedProductId = getQueryProductId();
  if (selectedProductId) select.value = selectedProductId;

  function updateTotal() {
    const option = select.options[select.selectedIndex];
    const price = Number(option?.dataset.price || 0);
    const quantity = Number(qtyInput.value || 1);
    totalElement.textContent = rupiah(price * quantity);
  }

  select.addEventListener('change', updateTotal);
  qtyInput.addEventListener('input', updateTotal);
  updateTotal();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      customer_name: document.getElementById('customer_name').value.trim(),
      customer_phone: document.getElementById('customer_phone').value.trim(),
      customer_address: document.getElementById('customer_address').value.trim(),
      product_id: Number(select.value),
      quantity: Number(qtyInput.value || 1),
      note: document.getElementById('note').value.trim()
    };

    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Pesanan gagal dibuat');

      showAlert(alertBox, 'Pesanan berhasil disimpan. Kamu akan diarahkan ke WhatsApp.', 'success');
      form.reset();
      updateTotal();
      window.open(data.whatsappUrl, '_blank');
    } catch (error) {
      showAlert(alertBox, `Gagal membuat pesanan: ${error.message}`, 'error');
    }
  });
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  const alertBox = document.getElementById('contactAlert');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    const whatsappNumber = '6281234567890';
    const text = `Halo Sumzbite, saya ${name}.%0AEmail: ${email || '-'}%0APesan: ${message}`;

    showAlert(alertBox, 'Pesan siap dikirim melalui WhatsApp.', 'success');
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
    form.reset();
  });
}

function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  renderProducts();
  setupOrderForm();
  setupContactForm();
});
