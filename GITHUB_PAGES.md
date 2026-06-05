# Panduan Deploy Aplikasi "Classroom" ke GitHub Pages 🚀

Aplikasi ini sudah dioptimalkan sepenuhnya agar siap dideploy ke **GitHub Pages** sebagai situs web statis (Single Page Application) gulan-gulan yang berkinerja tinggi, berkecepatan tinggi, dan aman.

Berikut adalah langkah-langkah mudah untuk melakukan deploy dari repositori GitHub Anda:

---

## 1. Penanganan Gemini API Key yang Aman dan Privat 🔒

Pada platform hosting statis seperti GitHub Pages, mengompilasi API Key sensitif ke dalam file JavaScript bawaan berisiko tinggi bocor ke publik. Sebagai solusinya, kami telah menambahkan fitur **Local & Secure API Key** pada aplikasi:
* **Tidak perlu memasukkan API Key di environment variable build.**
* Siswa atau Guru dapat membuka menu **Settings (Pengaturan)** di bilah sisi kiri pada aplikasi yang sudah live.
* Masukkan **Gemini API Key** Anda secara pribadi di form yang tersedia.
* Key tersebut akan disimpan dengan sangat aman di penyimpanan lokal (**LocalStorage**) pada browser perangkat pribadi masing-masing (tidak akan pernah dikirim ke server/database publik mana pun).

---

## 2. Cara Deploy Menggunakan GitHub Actions (Sangat Direkomendasikan) ⚙️

Metode terbaik untuk mengunggah aplikasi ke GitHub Pages secara otomatis setiap kali Anda melakukan push kode adalah dengan membuat workflow GitHub Actions:

1. Di dalam repositori GitHub Anda, buat folder baru `.github/workflows/` (jika belum ada).
2. Buat file bernama `deploy.yml` di dalam folder tersebut dan masukkan kode berikut:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main # Ganti dengan nama branch utama Anda (misal: master)

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-size: 18
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Application
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
```

3. Lakukan **Commit & Push** file ini ke repositori Anda.
4. Pergi ke tab **Settings** di repositori GitHub Anda -> **Pages** -> Ubah **Source** menjadi **Deploy from a branch**, lalu arahkan branch ke **gh-pages** dan folder ke `/ (root)`.
5. Selesai! Situs Anda akan langsung live dalam beberapa menit.

---

## 3. Cara Deploy Manual Melalui Perangkat Lokal 💻

Jika Anda ingin melakukan build dan push dari terminal komputer lokal Anda secara langsung:

1. Pastikan Anda menginstal package pembantu `gh-pages` sebagai devDependency di folder proyek Anda:
   ```bash
   npm install gh-pages --save-dev
   ```
2. Tambahkan script baru di dalam berkas `package.json` Anda (pada bagian `"scripts"`):
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Hubungkan folder lokal Anda dengan repositori GitHub Anda di komputer:
   ```bash
   git remote add origin https://github.com/username-anda/nama-repo-anda.git
   ```
4. Jalankan perintah deploy:
   ```bash
   npm run deploy
   ```
5. Protokol `gh-pages` akan mengompilasi folder `dist` secara otomatis dan mengunggahnya langsung ke branch `gh-pages` di repositori GitHub Anda.

---

## 4. Konfigurasi Lanjutan (Vite Base Path) 🛠️

* Berkas `vite.config.ts` Anda saat ini telah diatur ke `base: './'`.
* Ini adalah pengaturan optimal yang memungkinkan aplikasi Anda berjalan dengan sempurna baik di URL utama (seperti `https://domain-anda.com/`) maupun di sub-direktori folder GitHub Pages (seperti `https://username.github.io/nama-repositori/`). Anda tidak perlu mengubah berkas konfigurasi aset lagi!
