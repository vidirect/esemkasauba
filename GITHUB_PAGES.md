# Panduan Mengatasi Layar Putih (Blank Screen) & Deploy ke GitHub Pages 🚀

Aplikasi Anda mengalami **layar putih (blank white screen)** karena saat ini GitHub Pages disetel untuk memuat kode mentah TypeScript (`.tsx`) langsung dari branch `main`. Browser internet tidak bisa menerjemahkan berkas `.tsx` secara langsung tanpa di-build ke JavaScript biasa.

Untuk mengatasinya, kami telah memperbarui sistem otomatis **GitHub Actions** pada repositori Anda. Sekarang, setiap kali Anda mengunggah atau melakukan push perubahan kode ke branch `main`, GitHub akan otomatis melakukan kompilasi (build) dan mengunggah hasilnya ke branch baru bernama **`gh-pages`**.

Berikut adalah 3 langkah mudah untuk mengaktifkannya di akun GitHub Anda:

---

## Langkah 1: Jalankan GitHub Action Terlebih Dahulu ⚙️

1. **Unduh berkas proyek terbaru** dari AI Studio ini (atau lakukan commit & push perubahan berkas `.github/workflows/deploy.yml` ini ke repositori Anda).
2. Sekali Anda mengunggah kode baru ini ke branch `main`, silakan buka tab **Actions** di repositori GitHub Anda.
3. Anda akan melihat aksi otomatis bernama **"Deploy to GitHub Pages"** sedang berjalan.
4. Tunggu sekitar 1-2 menit hingga proses selesai dan memunculkan tanda **centang hijau (Success)**.
5. Proses ini **akan otomatis membuat branch baru di repositori Anda bernama `gh-pages`**.

---

## Langkah 2: Atur Pilihan Branch di GitHub Pages Anda 🌐

Setelah proses pada Langkah 1 selesai (berwarna hijau):
1. Masuk ke halaman **Settings** (Pengaturan) repositori GitHub Anda.
2. Di bilah navigasi sebelah kiri, pilih menu **Pages**.
3. Di bagian **Build and deployment** (Pengaturan Sumber Build):
   * Pastikan **Source** tetap disetel ke **"Deploy from a branch"** (jangan diubah).
   * Pada pilihan **Branch**, klik dropdown yang sebelumnya bertuliskan `main`.
   * **Pilih branch `gh-pages`** 👈 *(Sekarang pilihan ini sudah muncul karena berhasil dibuat otomatis oleh Actions!)*
   * Pastikan foldernya diatur ke `/ (root)`.
4. Klik tombol **Save** (Simpan).
5. Selesai! Website Anda akan langsung segar dan tampil sempurna tanpa layar putih dalam hitungan detik.

---

## Langkah 3: Penanganan Gemini API Key yang Aman dan Privat 🔒

Agar fungsionalitas cerdas (AI Tutor atau bimbingan AI) tetap aktif di GitHub Pages tanpa membocorkan API Key sensitif Anda ke publik:
1. Buka situs yang sudah live (misalnya: `https://vidirect.github.io/esemkasauba/`).
2. Masuk ke halaman dengan akun Anda (Guru/Siswa).
3. Buka menu **Settings (Pengaturan)** di bilah navigasi sebelah kiri.
4. Di bagian **Gemini AI (GitHub Pages)**, tempelkan **Gemini API Key** pribadi Anda secara langsung.
5. Kunci ini disimpan dengan sangat aman di **LocalStorage** browser lokal Anda (tidak akan pernah diunggah atau dibocorkan ke server eksternal apa pun).

---

## Catatan Penting Mengenai Keamanan Firebase 🔐
* **Tentang Peringatan Secret Scanning GitHub (Google API Key):** 
  GitHub mendeteksi kode API Key Firebase di berkas `firebase-applet-config.json` Anda sebagai kebocoran rahasia publik.
  **Ini sangat aman untuk diabaikan.** Pada aplikasi web client-side (SPA), Firebase Config (termasuk API Key) secara teknis memang bersifat publik agar halaman web browser Anda dapat berkomunikasi dengan database Firestore. Keamanan data Anda sepenuhnya dilindungi oleh **Firestore Security Rules** yang membatasi hak akses, bukan dari kerahasiaan API Key Firebase tersebut. Anda dapat menutup/menandai peringatan tersebut di GitHub dengan aman.
