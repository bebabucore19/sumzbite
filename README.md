# Sumzbite Dimsum

Website modern minimalis untuk toko dimsum **Sumzbite** dengan Node.js API, MySQL, checkout WhatsApp, login admin, hasil transaksi, dan laporan pembelian.

## Fitur

- Landing page toko dimsum
- Halaman produk
- Halaman pembelian/order
- Order tersimpan ke MySQL
- Setelah order, pelanggan diarahkan ke WhatsApp toko
- Login admin sebelum masuk dashboard
- Dashboard statistik produk, pembelian, pendapatan, dan pesanan pending
- Hasil transaksi lengkap dari database
- Ubah status transaksi: pending, diproses, selesai, dibatalkan
- Laporan pembelian harian, bulanan, dan tahunan
- Cetak laporan menjadi PDF melalui fitur Print browser
- Tombol kembali ke website dari halaman admin
- Halaman latar belakang dan contact us
- File HTML, CSS, dan JavaScript dipisah

## Struktur Folder

```text
sumzbite-dimsum/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── img/
│   │   ├── logo.png
│   │   ├── dimsum-mix.jpeg
│   │   ├── dimsum-spicy-mayo.jpeg
│   │   └── dimsum-goreng.jpeg
│   ├── js/
│   │   ├── app.js
│   │   ├── dashboard.js
│   │   └── login.js
│   ├── index.html
│   ├── product.html
│   ├── pembelian.html
│   ├── latar-belakang.html
│   ├── contact.html
│   ├── login.html
│   └── dashboard.html
├── database.sql
├── database_update_admin_laporan.sql
├── package.json
├── server.js
├── .env.example
└── README.md
```

## Cara Menjalankan

1. Install Node.js.
2. Import `database.sql` ke MySQL/phpMyAdmin.
3. Buka folder project di terminal.
4. Jalankan:

```bash
npm install
```

5. Copy `.env.example` menjadi `.env`, lalu ubah nomor WhatsApp dan database:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sumzbite_db
WHATSAPP_NUMBER=6281234567890
AUTH_SECRET=ganti-dengan-kalimat-rahasia-yang-panjang
```

6. Jalankan server:

```bash
npm run dev
```

atau:

```bash
npm start
```

7. Buka browser:

```text
http://localhost:3000
```

## Login Admin

Buka:

```text
http://localhost:3000/login.html
```

Akun default:

```text
Username: admin
Password: admin123
```

Setelah login, admin akan masuk ke `dashboard.html`. Kalau belum login, dashboard akan otomatis diarahkan ke halaman login.

## Laporan PDF

Di dashboard admin, buka bagian **Laporan Pembelian**.

1. Pilih jenis laporan: Harian, Bulanan, atau Tahunan.
2. Pilih tanggal/bulan/tahun.
3. Klik **Tampilkan Laporan**.
4. Klik **Cetak PDF**.
5. Pada jendela print browser, pilih **Save as PDF**.

## Update Database Lama

Kalau sebelumnya kamu sudah pernah import database lama dan tidak ingin menghapus data pesanan, jalankan file ini saja:

```text
database_update_admin_laporan.sql
```

File itu hanya menambahkan tabel admin default tanpa menghapus data transaksi lama.

## Catatan

- Nomor WhatsApp harus format internasional, contoh Indonesia: `6281234567890`.
- Produk bisa ditambah dari dashboard admin.
- Gambar produk bisa memakai path lokal seperti `img/dimsum-mix.jpeg` atau link online.
