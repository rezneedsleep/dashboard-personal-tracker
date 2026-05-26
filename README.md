# 🌌 Personal Tracker Dashboard

Dashboard pribadi yang elegan, minimalis, dan premium untuk memantau pengeluaran keuangan, kebiasaan harian, dan metrik kesehatan berat badan dalam satu tempat. Didesain dengan tema monokrom skala abu-abu (*high-contrast grayscale*) yang premium, animasi *spring* yang halus, serta antarmuka responsif yang dioptimalkan untuk perangkat desktop maupun mobile.

---

## 🌟 Fitur Utama

### 💳 1. Pemantau Keuangan & Pengeluaran
- **Pencatatan Pendapatan & Pengeluaran**: Catat arus masuk dan keluar keuangan Anda secara praktis lengkap dengan kategori, catatan, dan tanggal transaksi.
- **Kalkulator Saldo Sisa Dinamis**: Menampilkan kalkulasi sisa saldo secara *real-time* (`Total Pendapatan - Total Pengeluaran`).
- **Alarm Anggaran per Kategori**: Atur batas anggaran bulanan (Rp) untuk setiap kategori (Makanan, Belanja, Transportasi, dll.). Menampilkan peringatan kuning saat mencapai 80% dan berkedip merah saat pengeluaran melebihi batas budget.
- **Filter Arsip Bulanan**: Navigasi mudah untuk memilih bulan guna melihat kembali *history* transaksi dan statistik pengeluaran dari bulan-bulan sebelumnya.
- **Ekspor laporan CSV**: Unduh ringkasan keuangan bulanan dan log transaksi lengkap sebagai berkas Excel/CSV hanya dengan satu klik.

### 🔥 2. Pelacak Kebiasaan & Sistem Streak
- **Gamifikasi Streak**: Perhitungan beruntun penyelesaian harian otomatis yang menampilkan indikator api (`🔥 X hari streak`) untuk menjaga konsistensi dan motivasi Anda tetap tinggi.
- **Penjadwalan Fleksibel**: Sesuaikan frekuensi kebiasaan (Setiap Hari, Hari Kerja saja, atau 3x Seminggu). Status *Rest Day* (Hari Istirahat) akan otomatis menyesuaikan progres harian Anda.
- **Rata-rata Mingguan**: Visualisasi linimasa progres 7 hari terakhir yang menampilkan persentase rata-rata keberhasilan pemenuhan kebiasaan Anda.

### ⚖️ 3. Pemantau Berat Badan & BMI (Indeks Massa Tubuh)
- **Grafik Tren Interaktif**: Grafik garis elegan yang memvisualisasikan fluktuasi progres berat badan Anda dari waktu ke waktu.
- **Klasifikasi BMI Otomatis**: Cukup masukkan tinggi badan Anda sekali di panel *Settings* untuk langsung menghitung status BMI (`Underweight`, `Normal`, `Overweight`, `Obese`) lengkap dengan lencana warna penanda kesehatan.
- **Kelola Rekomendasi Secara Mandiri**: Tambahkan, edit, atau hapus tips/insight kesehatan pribadi Anda secara dinamis.

### 📱 4. Desain Responsif & Minimalis Mobile
- **Pembungkusan Kolom (Stacking Breakpoint)**: Susunan kartu otomatis melipat menjadi satu kolom vertikal pada layar di bawah `1024px` (seperti tablet portrait dan HP) agar tampilan tidak terhimpit atau meluber keluar layar.
- **Form Input Fleksibel**: Kolom pengisian kebiasaan baru otomatis melipat ke bawah secara responsif saat ruang kartu menyempit untuk menghindari teks terpotong.

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 + Vite 8
- **Database / Backend**: Supabase (PostgreSQL client integration)
- **Styling**: Vanilla CSS3 (Sleek Monochrome Edition)
- **Data Visualizations**: ChartJS + React-Chartjs-2
- **Utility Libraries**: Day.js (Pemformatan tanggal & periodisasi mingguan)

---

## 🚀 Memulai Proyek

### 1. Prasyarat
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) di komputer Anda.

### 2. Konfigurasi Environment
Salin berkas template `.env.example` dan ubah namanya menjadi `.env` di direktori utama proyek:
```bash
cp .env.example .env
```
Isi parameter koneksi Supabase Anda:
```env
VITE_SUPABASE_URL=alamat_proyek_supabase_anda
VITE_SUPABASE_KEY=kunci_anon_supabase_anda
```

### 3. Instalasi
Instal seluruh dependensi proyek:
```bash
npm install
```

### 4. Jalankan Server Lokal
Mulai server pengembangan lokal:
```bash
npm run dev
```
Buka peramban (*browser*) Anda dan akses `http://localhost:5173`.

### 5. Kompilasi Produksi (Build)
Untuk mengompilasi dan mengoptimalkan berkas produksi:
```bash
npm run build
```

---

## 🔒 Keamanan
Semua kredensial database penting diamankan di dalam berkas environment lokal (`.env`) yang secara otomatis diabaikan oleh konfigurasi Git (`.gitignore`) untuk menghindari kebocoran data rahasia ke repositori publik.
