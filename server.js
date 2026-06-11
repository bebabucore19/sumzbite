const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_SECRET = process.env.AUTH_SECRET || 'sumzbite-admin-secret';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'sumzbite_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function signToken(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [encodedPayload, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('base64url');

  const signatureBuffer = Buffer.from(signature || '');
  const expectedBuffer = Buffer.from(expected || '');
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ message: 'Akses admin ditolak. Silakan login terlebih dahulu.' });
  req.admin = payload;
  next();
}

function makeWhatsappUrl(order, product) {
  const phone = process.env.WHATSAPP_NUMBER || '62895365767416';
  const message = [
    'Halo Sumzbite, saya ingin memesan dimsum:',
    '',
    `Nama: ${order.customer_name}`,
    `No. HP: ${order.customer_phone}`,
    `Alamat: ${order.customer_address}`,
    `Produk: ${product.name}`,
    `Jumlah: ${order.quantity}`,
    `Harga satuan: ${formatRupiah(product.price)}`,
    `Total: ${formatRupiah(order.total_price)}`,
    `Catatan: ${order.note || '-'}`,
    '',
    'Terima kasih.'
  ].join('\n');

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function buildReportFilter(period, value) {
  const selectedPeriod = ['daily', 'monthly', 'yearly'].includes(period) ? period : 'daily';
  const selectedValue = value || new Date().toISOString().slice(0, 10);

  if (selectedPeriod === 'monthly') {
    const month = /^\d{4}-\d{2}$/.test(selectedValue) ? selectedValue : new Date().toISOString().slice(0, 7);
    return {
      period: selectedPeriod,
      value: month,
      title: `Laporan Pembelian Bulanan ${month}`,
      where: "DATE_FORMAT(orders.created_at, '%Y-%m') = ?",
      params: [month]
    };
  }

  if (selectedPeriod === 'yearly') {
    const year = /^\d{4}$/.test(String(selectedValue)) ? String(selectedValue) : String(new Date().getFullYear());
    return {
      period: selectedPeriod,
      value: year,
      title: `Laporan Pembelian Tahunan ${year}`,
      where: 'YEAR(orders.created_at) = ?',
      params: [year]
    };
  }

  const day = /^\d{4}-\d{2}-\d{2}$/.test(selectedValue) ? selectedValue : new Date().toISOString().slice(0, 10);
  return {
    period: selectedPeriod,
    value: day,
    title: `Laporan Pembelian Harian ${day}`,
    where: 'DATE(orders.created_at) = ?',
    params: [day]
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sumzbite API aktif' });
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [username]);
    if (!rows.length) return res.status(401).json({ message: 'Username atau password salah' });

    const admin = rows[0];
    if (hashPassword(password) !== admin.password_hash) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = signToken({
      id: admin.id,
      username: admin.username,
      exp: Date.now() + (1000 * 60 * 60 * 8)
    });

    res.json({
      message: 'Login berhasil',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal login admin', error: error.message });
  }
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data produk', error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil detail produk', error: error.message });
  }
});

app.post('/api/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, image_url, stock } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'Nama dan harga produk wajib diisi' });
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)',
      [name, description || '', price, image_url || '', stock || 0]
    );

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan produk', error: error.message });
  }
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, image_url, stock, is_active } = req.body;
    await pool.query(
      `UPDATE products
       SET name = ?, description = ?, price = ?, image_url = ?, stock = ?, is_active = ?
       WHERE id = ?`,
      [name, description || '', price, image_url || '', stock || 0, is_active ? 1 : 0, req.params.id]
    );

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui produk', error: error.message });
  }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus produk', error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_address, product_id, quantity, note } = req.body;
    const qty = Number(quantity || 1);

    if (!customer_name || !customer_phone || !customer_address || !product_id) {
      return res.status(400).json({ message: 'Nama, nomor HP, alamat, dan produk wajib diisi' });
    }

    if (qty < 1) {
      return res.status(400).json({ message: 'Jumlah pesanan minimal 1' });
    }

    const [products] = await pool.query('SELECT * FROM products WHERE id = ? AND is_active = 1', [product_id]);
    if (!products.length) return res.status(404).json({ message: 'Produk tidak ditemukan atau tidak aktif' });

    const product = products[0];
    const total_price = Number(product.price) * qty;

    const [result] = await pool.query(
      `INSERT INTO orders
       (customer_name, customer_phone, customer_address, product_id, quantity, total_price, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_name, customer_phone, customer_address, product_id, qty, total_price, note || '']
    );

    const order = {
      id: result.insertId,
      customer_name,
      customer_phone,
      customer_address,
      product_id,
      quantity: qty,
      total_price,
      note: note || ''
    };

    const whatsappUrl = makeWhatsappUrl(order, product);

    res.status(201).json({
      message: 'Pesanan berhasil disimpan',
      order,
      product,
      whatsappUrl
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat pesanan', error: error.message });
  }
});

app.get('/api/orders', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT orders.*, products.name AS product_name, products.price AS product_price
       FROM orders
       LEFT JOIN products ON products.id = orders.product_id
       ORDER BY orders.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pembelian', error: error.message });
  }
});

app.patch('/api/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'diproses', 'selesai', 'dibatalkan'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui status pesanan', error: error.message });
  }
});

app.get('/api/stats', requireAdmin, async (req, res) => {
  try {
    const [[productStats]] = await pool.query('SELECT COUNT(*) AS total_products FROM products');
    const [[orderStats]] = await pool.query('SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_price), 0) AS total_revenue FROM orders');
    const [[pendingStats]] = await pool.query("SELECT COUNT(*) AS pending_orders FROM orders WHERE status = 'pending'");
    const [[todayStats]] = await pool.query("SELECT COUNT(*) AS today_orders, COALESCE(SUM(total_price), 0) AS today_revenue FROM orders WHERE DATE(created_at) = CURDATE()");
    const [latestOrders] = await pool.query(
      `SELECT orders.*, products.name AS product_name
       FROM orders
       LEFT JOIN products ON products.id = orders.product_id
       ORDER BY orders.created_at DESC
       LIMIT 5`
    );

    res.json({
      total_products: productStats.total_products,
      total_orders: orderStats.total_orders,
      total_revenue: orderStats.total_revenue,
      pending_orders: pendingStats.pending_orders,
      today_orders: todayStats.today_orders,
      today_revenue: todayStats.today_revenue,
      latest_orders: latestOrders
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil statistik', error: error.message });
  }
});

app.get('/api/reports/orders', requireAdmin, async (req, res) => {
  try {
    const filter = buildReportFilter(req.query.period, req.query.value);
    const [rows] = await pool.query(
      `SELECT orders.*, products.name AS product_name, products.price AS product_price
       FROM orders
       LEFT JOIN products ON products.id = orders.product_id
       WHERE ${filter.where}
       ORDER BY orders.created_at DESC`,
      filter.params
    );

    const [[summary]] = await pool.query(
      `SELECT COUNT(*) AS total_orders,
              COALESCE(SUM(quantity), 0) AS total_items,
              COALESCE(SUM(total_price), 0) AS total_revenue
       FROM orders
       WHERE ${filter.where}`,
      filter.params
    );

    res.json({
      period: filter.period,
      value: filter.value,
      title: filter.title,
      summary,
      orders: rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil laporan pembelian', error: error.message });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ message: 'Nama dan pesan wajib diisi' });
    }

    const [result] = await pool.query(
      'INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [name, email || '', phone || '', message]
    );

    res.status(201).json({ message: 'Pesan berhasil disimpan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan pesan', error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server Sumzbite berjalan di http://localhost:${PORT}`);
});
