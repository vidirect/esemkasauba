import { ProjectKit } from '../types';

export const PROJECT_KITS: ProjectKit[] = [
  {
    id: 'network-troubleshooting',
    title: 'TJKT: Simulasi Troubleshooting Jaringan',
    description: 'Mengidentifikasi dan memperbaiki masalah konektivitas pada topologi jaringan kompleks.',
    workflow: [
      'Orientasi: Analisis skenario masalah jaringan (no internet, slow response).',
      'Desain: Merancang skema perbaikan pada simulator jaringan.',
      'Pengembangan: Konfigurasi ulang perangkat (Router, Switch, IP Address).',
      'Publikasi: Laporan teknis perbaikan dan verifikasi konektivitas.'
    ],
    rubric: [
      'Ketepatan identifikasi masalah (30%)',
      'Efektivitas langkah perbaikan (30%)',
      'Dokumentasi teknis (25%)',
      'Kecepatan penyelesaian (15%)'
    ],
    examples: [
      'Topologi Jaringan Kantor 3 Lantai',
      'Log Troubleshooting Koneksi VLAN'
    ],
    references: [
      'Panduan Dasar Jaringan (CCNA Level)',
      'Tutorial Cisco Packet Tracer'
    ]
  },
  {
    id: 'programming-basic',
    title: 'Informatika: Website Portofolio Digital',
    description: 'Membangun website portofolio pribadi menggunakan HTML, CSS, dan JavaScript dasar.',
    workflow: [
      'Orientasi: Menentukan struktur dan konten portofolio.',
      'Desain: Membuat wireframe dan skema warna.',
      'Pengembangan: Coding website responsif.',
      'Publikasi: Deployment ke web hosting dan presentasi.'
    ],
    rubric: [
      'Kualitas kode dan struktur (35%)',
      'Desain Visual (30%)',
      'Kelengkapan Konten (20%)',
      'Responsivitas Mobile (15%)'
    ],
    examples: [
      'Website Portofolio Siswa TKJ',
      'Kode GitHub Repository'
    ],
    references: [
      'MDN Web Docs',
      'W3Schools HTML/CSS'
    ]
  },
  {
    id: 'math-stats',
    title: 'Matematika: Analisis Statistik Lingkungan',
    description: 'Proyek penelitian statistik untuk menganalisis data lingkungan di sekitar sekolah.',
    workflow: [
      'Orientasi: Pengenalan konsep statistika dan pengumpulan data.',
      'Desain: Perancangan instrumen survei dan metode sampling.',
      'Pengembangan: Pengumpulan data lapangan dan pengolahan data.',
      'Publikasi: Presentasi hasil analisis data dan kesimpulan.'
    ],
    rubric: [
      'Ketepatan metode sampling (25%)',
      'Akurasi pengolahan data (30%)',
      'Visualisasi data (25%)',
      'Kualitas presentasi (20%)'
    ],
    examples: [
      'Laporan Survei Sampah Sekitar Sekolah',
      'Analisis Konsumsi Air Siswa'
    ],
    references: [
      'Buku Panduan Statistik Dasar',
      'Tutorial Excel/Spreadsheet untuk Statistika'
    ]
  },
  {
    id: 'science-eco',
    title: 'IPA: Ekosistem Mini (Akuaponik)',
    description: 'Membangun sistem akuaponik skala kecil untuk mempelajari siklus nitrogen dan simbiosis.',
    workflow: [
      'Orientasi: Memahami prinsip akuaponik dan kebutuhan makhluk hidup.',
      'Desain: Merancang skema sistem aliran air dan wadah.',
      'Pengembangan: Perakitan sistem dan pemantauan parameter air (pH, Amonia).',
      'Publikasi: Laporan pertumbuhan tanaman dan ikan.'
    ],
    rubric: [
      'Keberhasilan ekosistem (30%)',
      'Dokumentasi observasi berkala (30%)',
      'Pemahaman konsep biologi (25%)',
      'Kreativitas desain (15%)'
    ],
    examples: [
      'Vlog Perkembangan Akuaponik 4 Minggu',
      'Jurnal Pengamatan pH Air'
    ],
    references: [
      'Dasar-dasar Hidroponik dan Akuaponik',
      'Panduan Pemeliharaan Ikan Air Tawar'
    ]
  },
  {
    id: 'history-vlog',
    title: 'Sejarah: Dokumenter Tokoh Lokal',
    description: 'Membuat video dokumenter pendek tentang sejarah atau tokoh di daerah setempat.',
    workflow: [
      'Orientasi: Riset awal tokoh atau peristiwa sejarah lokal.',
      'Desain: Pembuatan storyboard dan jadwal wawancara.',
      'Pengembangan: Pengambilan gambar dan wawancara narasumber.',
      'Publikasi: Screening video dan diskusi panel.'
    ],
    rubric: [
      'Kedalaman konten sejarah (40%)',
      'Kualitas teknis video (25%)',
      'Kekuatan narasi/cerita (20%)',
      'Kerja sama tim (15%)'
    ],
    examples: [
      'Video: Jejak Sejarah Jembatan Merah',
      'Wawancara dengan Veteran Pejuang Lokal'
    ],
    references: [
      'Metode Penelitian Sejarah Lisan',
      'Tips Teknik Dasar Videografi'
    ]
  },
  {
    id: 'ind-drama',
    title: 'Bahasa Indonesia: Adaptasi Cerpen ke Drama',
    description: 'Mengubah karya sastra cerpen menjadi naskah drama dan mementaskannya.',
    workflow: [
      'Orientasi: Memilih dan menganalisis unsur intrinsik cerpen.',
      'Desain: Penulisan naskah drama (scriptwriting).',
      'Pengembangan: Latihan peran dan penataan panggung.',
      'Publikasi: Pementasan drama di depan kelas/sekolah.'
    ],
    rubric: [
      'Kesesuaian adaptasi naskah (30%)',
      'Akting dan penjiwaan karakter (30%)',
      'Tata artistik panggung (20%)',
      'Pelafalan dan intonasi (20%)'
    ],
    examples: [
      'Naskah Drama: Robohnya Surau Kami',
      'Rekaman Gladi Resik'
    ],
    references: [
      'Teknik Menulis Skenario',
      'Panduan Dasar Olah Tubuh dan Vokal'
    ]
  },
  {
    id: 'eng-podcast',
    title: 'English: Global Issues Podcast',
    description: 'Creating an English-language podcast series discussing global issues.',
    workflow: [
      'Orientation: Researching a global issue (climate change, technology, etc.).',
      'Design: Creating a podcast outline and questions.',
      'Development: Recording and editing the audio.',
      'Publication: Uplodaing to a hosting platform and sharing.'
    ],
    rubric: [
      'Pronunciation and Fluency (35%)',
      'Vocabulary and Grammar usage (25%)',
      'Content Depth (25%)',
      'Technical Audio Quality (15%)'
    ],
    examples: [
      'Podcast Episode: The Future of AI',
      'Script for "Climate Action Now"'
    ],
    references: [
      'BBC Learning English',
      'Simple Audio Editing with Audacity'
    ]
  },
  {
    id: 'arts-mural',
    title: 'Seni Budaya: Mural Kreatif Sekolah',
    description: 'Merancang dan membuat mural di dinding sekolah yang menyampaikan pesan positif.',
    workflow: [
      'Orientasi: Brainstorming tema dan pesan moral.',
      'Desain: Pembuatan sketsa warna di kertas/digital.',
      'Pengembangan: Eksekusi melukis di media dinding.',
      'Publikasi: Peresmian mural dan penjelasan karya.'
    ],
    rubric: [
      'Kreativitas dan Orisinalitas (30%)',
      'Teknik pewarnaan dan komposisi (30%)',
      'Kesesuaian dengan tema (25%)',
      'Kebersihan dan kerapian (15%)'
    ],
    examples: [
      'Desain Sketsa: Pendidikan untuk Semua',
      'Foto Proses Pengerjaan Mural'
    ],
    references: [
      'Teori Warna Dasar',
      'Panduan Penggunaan Cat Mural'
    ]
  },
  {
    id: 'ict-app',
    title: 'Informatika: App Prototype (No-Code)',
    description: 'Membangun prototipe aplikasi mobile untuk menyelesaikan masalah di sekolah.',
    workflow: [
      'Orientasi: Identifikasi masalah menggunakan metode Design Thinking.',
      'Desain: Membuat wireframe dan UI desain (Figma).',
      'Pengembangan: Membangun prototipe menggunakan alat no-code.',
      'Publikasi: Demo aplikasi dan pengujian pengguna.'
    ],
    rubric: [
      'User Experience (UX) (30%)',
      'Fungsionalitas prototipe (30%)',
      'Inovasi solusi (25%)',
      'Visual Interface (UI) (15%)'
    ],
    examples: [
      'Prototype: Kantin Pintar App',
      'User Journey Map'
    ],
    references: [
      'Introduction to Figma',
      'No-Code Development Platforms'
    ]
  },
  {
    id: 'pe-fitness',
    title: 'PJOK: Program Kebugaran Mandiri',
    description: 'Merancang dan menjalankan program latihan kebugaran selama 4 minggu.',
    workflow: [
      'Orientasi: Pengukuran data awal kebugaran (VO2 Max, BMI).',
      'Desain: Penyusunan jadwal latihan harian.',
      'Pengembangan: Pelaksanaan latihan dan pencatatan log harian.',
      'Publikasi: Laporan progres fisik dan refleksi.'
    ],
    rubric: [
      'Kedisiplinan pelaksanaan (40%)',
      'Ketepatan pemilihan latihan (25%)',
      'Analisis data kemajuan fisik (20%)',
      'Kualitas dokumentasi (15%)'
    ],
    examples: [
      'Log Latihan 30 Hari',
      'Video Tutorial Gerakan CORE'
    ],
    references: [
      'Panduan Intensitas Latihan (Heart Rate)',
      'Nutrisi Dasar untuk Olahragawan'
    ]
  },
  {
    id: 'physic-hydraulic',
    title: 'Fisika: Jembatan Hidrolik Sederhana',
    description: 'Menerapkan Hukum Pascal untuk membangun model jembatan angkat bertenaga cairan.',
    workflow: [
      'Orientasi: Memahami prinsip tekanan zat cair dan Hukum Pascal.',
      'Desain: Sketsa jembatan dan perhitungan beban.',
      'Pengembangan: Perakitan struktur jembatan dan sistem hidrolik suntikan.',
      'Publikasi: Demonstrasi pengangkatan beban dan laporan gaya.'
    ],
    rubric: [
      'Kemampuan mengangkat beban (35%)',
      'Ketepatan prinsip fisika (30%)',
      'Kerapian konstruksi (20%)',
      'Dokumentasi proses (15%)'
    ],
    examples: [
      'Video Uji Coba Beban 0.5kg',
      'Skema Aliran Hidrolik'
    ],
    references: [
      'Konsep Dasar Fluida Statis',
      'Tutorial DIY Hydraulic Bridge'
    ]
  },
  {
    id: 'chem-soap',
    title: 'Kimia: Pembuatan Sabun Alami (Saponifikasi)',
    description: 'Mempelajari reaksi kimia lemak dan basa dalam pembuatan sabun mandi ramah lingkungan.',
    workflow: [
      'Orientasi: Teori reaksi saponifikasi dan keamanan bahan kimia.',
      'Desain: Penentuan formulasi minyak dan aroma.',
      'Pengembangan: Proses pencampuran, curing (pematangan) selama 4 minggu.',
      'Publikasi: Pengujian pH dan display produk akhir.'
    ],
    rubric: [
      'Hasil akhir sabun (tekstur/busa) (30%)',
      'Akurasi perhitungan bahan (30%)',
      'Pemahaman reaksi kimia (25%)',
      'Kreativitas pengemasan (15%)'
    ],
    examples: [
      'Foto Sabun Herbal Aloe Vera',
      'Tabel Perhitungan Rasio NaOH'
    ],
    references: [
      'Buku Panduan Saponifikasi Dingin',
      'Safety Data Sheet (SDS) Sodium Hydroxide'
    ]
  },
  {
    id: 'econ-business',
    title: 'Ekonomi: Rencana Bisnis Kreatif UMKM',
    description: 'Menyusun rencana bisnis lengkap untuk produk kreatif bernilai ekonomi tinggi.',
    workflow: [
      'Orientasi: Analisis peluang pasar dan ide produk.',
      'Desain: Pembuatan Business Model Canvas (BMC).',
      'Pengembangan: Perhitungan HPP, strategi pemasaran, dan prototipe produk.',
      'Publikasi: Pitching bisnis di depan investor (guru/teman).'
    ],
    rubric: [
      'Kelayakan rencana bisnis (35%)',
      'Strategi pemasaran (25%)',
      'Akurasi analisis finansial (25%)',
      'Kemampuan presentasi/pitching (15%)'
    ],
    examples: [
      'BMC Kedai Kopi Literasi',
      'Brosur Pemasaran Digital'
    ],
    references: [
      'Business Model Generation (Osterwalder)',
      'Dasar-dasar Pemasaran Digital'
    ]
  },
  {
    id: 'geo-disaster',
    title: 'Geografi: Peta Mitigasi Bencana Lokal',
    description: 'Memetakan jalur evakuasi dan titik rawan bencana di sekitar tempat tinggal.',
    workflow: [
      'Orientasi: Identifikasi potensi bencana di wilayah sekitar.',
      'Desain: Pembuatan draf pemetaan dan penentuan rute aman.',
      'Pengembangan: Survei lapangan dan pembuatan peta digital/manual.',
      'Publikasi: Sosialisasi peta ke warga atau keluarga.'
    ],
    rubric: [
      'Akurasi data spasial (35%)',
      'Kemudahan pembacaan peta (30%)',
      'Kualitas analisis risiko (20%)',
      'Kekuatan pesan mitigasi (15%)'
    ],
    examples: [
      'Peta Jalur Evakuasi Banjir RW 05',
      'Infografis Tas Siaga Bencana'
    ],
    references: [
      'Prinsip Kartografi Dasar',
      'Data Bencana Daerah (BNPB)'
    ]
  },
  {
    id: 'soc-media',
    title: 'Sosiologi: Dampak Medsos pada Komunikasi',
    description: 'Penelitian mini tentang perubahan pola interaksi sosial akibat penggunaan media sosial.',
    workflow: [
      'Orientasi: Menentukan pertanyaan penelitian dan hipotesis.',
      'Desain: Menyusun kuesioner atau panduan wawancara.',
      'Pengembangan: Pengumpulan data dan analisis kualitatif/kuantitatif.',
      'Publikasi: Artikel ilmiah populer atau infografis hasil.'
    ],
    rubric: [
      'Kedalaman analisis sosiologis (40%)',
      'Validitas instrumen penelitian (25%)',
      'Objektivitas penarikan kesimpulan (20%)',
      'Kualitas laporan akhir (15%)'
    ],
    examples: [
      'Hasil Survei Durasi Layar vs Sosialisasi',
      'Transkrip Wawancara Mendalam'
    ],
    references: [
      'Metodologi Penelitian Sosial Dasar',
      'Teori Interaksionisme Simbolik'
    ]
  },
  {
    id: 'pai-philanthropy',
    title: 'PAI: Manajemen Filantropi Remaja',
    description: 'Mengelola program pengumpulan dan penyaluran bantuan untuk masyarakat membutuhkan.',
    workflow: [
      'Orientasi: Kajian fikih tentang zakat, infak, sedekah.',
      'Desain: Penentuan target penerima dan metode penggalangan.',
      'Pengembangan: Sosialisasi, pengumpulan dana/barang, dan dokumentasi.',
      'Publikasi: Laporan transparansi dan video kegiatan penyaluran.'
    ],
    rubric: [
      'Akuntabilitas dan Transparansi (40%)',
      'Dampak manfaat program (30%)',
      'Kerja sama tim dan etika (20%)',
      'Kreativitas kampanye (10%)'
    ],
    examples: [
      'Laporan Keuangan Donasi Bencana',
      'Video "Daily Life of Volunteer"'
    ],
    references: [
      'Buku Panduan Ziswaf Modern',
      'Etika Komunikasi Publik'
    ]
  },
  {
    id: 'civics-campaign',
    title: 'PPKn: Kampanye Kesadaran Hukum',
    description: 'Membuat kampanye kreatif untuk meningkatkan ketaatan pada aturan hukum/sekolah.',
    workflow: [
      'Orientasi: Analisis pelanggaran hukum/aturan yang sering terjadi.',
      'Desain: Pembuatan konsep pesan dan media kampanye.',
      'Pengembangan: Produksi konten (poster, video pendek, artikel).',
      'Publikasi: Pelaksanaan kampanye di lingkungan sekolah.'
    ],
    rubric: [
      'Ketepatan substansi hukum (35%)',
      'Daya tarik media kampanye (30%)',
      'Jangkauan audiens (20%)',
      'Relvansi dengan isu terkini (15%)'
    ],
    examples: [
      'Poster Digital: Anti Bullying di Sekolah',
      'Video Pendek: Taat Lalu Lintas'
    ],
    references: [
      'UUD 1945 dan Perangkat Hukum Terkait',
      'Strategi Komunikasi Massa'
    ]
  }
];
