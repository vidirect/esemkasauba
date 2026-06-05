import React, { useEffect, useState } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  Settings, 
  Briefcase, 
  Plus, 
  Database, 
  UserCheck, 
  ChevronRight, 
  GraduationCap, 
  FolderLock,
  CheckCircle
} from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface DashboardProps {
  setActiveTab?: (tab: string) => void;
  setAdminSubTab?: (tab: 'projects' | 'kits' | 'students' | 'acl') => void;
}

export default function Dashboard({ setActiveTab, setAdminSubTab }: DashboardProps) {
  const { student, isAdmin, isTeacher } = useFirebase();
  const [projectCount, setProjectCount] = useState(0);

  // States for Admin Dashboard
  const [adminStats, setAdminStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalProjects: 0,
    totalKits: 0,
    totalAllowed: 0,
    loading: true,
  });

  // States for Teacher Dashboard
  const [teacherStats, setTeacherStats] = useState({
    totalStudents: 0,
    totalProjects: 0,
    completedProjects: 0,
    activeProjects: 0,
    classAverageCT: 0,
    classAverageICT: 0,
    classAveragePM: 0,
    classAverageCollab: 0,
    classAverageApp: 0,
    classAverageProg: 0,
    stageBreakdown: {
      Orientation: 0,
      Design: 0,
      Development: 0,
      Publication: 0
    },
    loading: true,
  });

  // Fetch student projects (original student path)
  useEffect(() => {
    if (isAdmin || isTeacher || !student) return;
    const fetchStats = async () => {
      try {
        const studentProjects: string[] = student.projects || [];
        setProjectCount(studentProjects.length);
      } catch (error) {
        console.error("Error setting project count:", error);
      }
    };
    fetchStats();
  }, [student, isAdmin, isTeacher]);

  // Fetch admin dashboard stats
  useEffect(() => {
    if (!isAdmin) return;
    const fetchAdminData = async () => {
      try {
        const [studentsSnap, projectsSnap, allowedSnap, kitsSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'projects')),
          getDocs(collection(db, 'allowed_users')),
          getDocs(collection(db, 'kits')),
        ]);

        const studentsList = studentsSnap.docs.map(d => d.data());
        const totalStudents = studentsList.filter((s: any) => s.role === 'student' || !s.role).length;
        const totalTeachers = studentsList.filter((s: any) => s.role === 'teacher').length;
        const totalAdmins = studentsList.filter((s: any) => s.role === 'admin').length;

        setAdminStats({
          totalStudents,
          totalTeachers,
          totalAdmins,
          totalProjects: projectsSnap.size,
          totalKits: kitsSnap.size,
          totalAllowed: allowedSnap.size,
          loading: false,
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        setAdminStats(prev => ({ ...prev, loading: false }));
      }
    };
    fetchAdminData();
  }, [isAdmin]);

  // Fetch teacher dashboard stats
  useEffect(() => {
    if (!isTeacher) return;
    const fetchTeacherData = async () => {
      try {
        const [studentsSnap, projectsSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'projects')),
        ]);

        const studentsList = studentsSnap.docs.map(d => d.data());
        const projectsList = projectsSnap.docs.map(d => d.data());

        const projectStudents = studentsList.filter((s: any) => s.role === 'student' || !s.role);
        const totalStudents = projectStudents.length;

        const totalProjects = projectsList.length;
        const completedProjects = projectsList.filter((p: any) => p.status === 'completed').length;
        const activeProjects = projectsList.filter((p: any) => p.status === 'active' || !p.status).length;

        // Calculate average competences
        let ctSum = 0, ictSum = 0, pmSum = 0, colSum = 0, appSum = 0, progSum = 0;
        projectStudents.forEach((s: any) => {
          const comp = s.competence || {};
          ctSum += comp.computationalThinking || 0;
          ictSum += comp.ictLiteracy || 0;
          pmSum += comp.projectManagement || 0;
          colSum += comp.collaboration || 0;
          appSum += comp.appUsage || 0;
          progSum += comp.programming || 0;
        });

        // Stage breakdown
        const stages = { Orientation: 0, Design: 0, Development: 0, Publication: 0 };
        projectsList.forEach((p: any) => {
          const stage = p.currentStage;
          if (stage && stage in stages) {
            stages[stage as 'Orientation' | 'Design' | 'Development' | 'Publication']++;
          }
        });

        setTeacherStats({
          totalStudents,
          totalProjects,
          completedProjects,
          activeProjects,
          classAverageCT: totalStudents > 0 ? Math.round(ctSum / totalStudents) : 0,
          classAverageICT: totalStudents > 0 ? Math.round(ictSum / totalStudents) : 0,
          classAveragePM: totalStudents > 0 ? Math.round(pmSum / totalStudents) : 0,
          classAverageCollab: totalStudents > 0 ? Math.round(colSum / totalStudents) : 0,
          classAverageApp: totalStudents > 0 ? Math.round(appSum / totalStudents) : 0,
          classAverageProg: totalStudents > 0 ? Math.round(progSum / totalStudents) : 0,
          stageBreakdown: stages,
          loading: false,
        });
      } catch (err) {
        console.error("Error fetching teacher stats:", err);
        setTeacherStats(prev => ({ ...prev, loading: false }));
      }
    };
    fetchTeacherData();
  }, [isTeacher]);

  // Bypass early-return if user is Administrator or Teacher so they are never locked out of dashboard!
  if (!student && !isAdmin && !isTeacher) return null;

  // Render Admin Dashboard
  if (isAdmin) {
    if (adminStats.loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
          />
        </div>
      );
    }

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b'];
    const pieData = [
      { name: 'Siswa', value: adminStats.totalStudents },
      { name: 'Guru', value: adminStats.totalTeachers },
      { name: 'Admin', value: adminStats.totalAdmins },
    ].filter(item => item.value > 0);

    const stats = [
      { label: 'Total Pengguna', value: (adminStats.totalStudents + adminStats.totalTeachers + adminStats.totalAdmins).toString(), icon: Users, color: 'bg-indigo-500', detail: `${adminStats.totalStudents} Siswa, ${adminStats.totalTeachers} Guru` },
      { label: 'Proyek PjBL', value: adminStats.totalProjects.toString(), icon: BookOpen, color: 'bg-blue-500', detail: 'Total ruang kolaborasi aktif' },
      { label: 'Pustaka Kit', value: adminStats.totalKits.toString(), icon: Briefcase, color: 'bg-amber-500', detail: 'Template proyek bawaan' },
      { label: 'Whitelist Email', value: adminStats.totalAllowed.toString(), icon: ShieldCheck, color: 'bg-emerald-500', detail: 'Akses masuk terverifikasi' },
    ];

    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 bg-gray-50 min-h-screen pb-24 md:pb-8">
        <header>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
              <Settings size={20} />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Selamat datang, Administrator. Pantau kesehatan sistem dan pengaturan umum PjBL Classroom.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`${stat.color} p-2.5 sm:p-3 rounded-xl text-white shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-400">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] sm:text-xs text-gray-500">
                  {stat.detail}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 lg:col-span-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              Distribusi Peran Pengguna
            </h3>
            {pieData.length > 0 ? (
              <div className="h-64 flex flex-col items-center justify-center">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Akun`, 'Jumlah']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-gray-500 font-medium">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Belum ada data distribusi akun.
              </div>
            )}
          </div>

          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Database size={18} className="text-indigo-600" />
              Pusat Tindakan & Kontrol Admin
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                className="p-5 border border-gray-100 rounded-2xl hover:bg-indigo-50/50 hover:border-indigo-100 transition-all group cursor-pointer"
                onClick={() => {
                  if (setAdminSubTab) setAdminSubTab('acl');
                  if (setActiveTab) setActiveTab('admin');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ShieldCheck size={20} />
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-bold text-gray-900 mt-4">Kelola Whitelist Email</h4>
                <p className="text-xs text-gray-500 mt-1">Tambahkan prapersetujuan untuk guru maupun siswa sebelum mereka login ke sistem.</p>
              </div>

              <div 
                className="p-5 border border-gray-100 rounded-2xl hover:bg-amber-50/50 hover:border-amber-100 transition-all group cursor-pointer"
                onClick={() => {
                  if (setAdminSubTab) setAdminSubTab('kits');
                  if (setActiveTab) setActiveTab('admin');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                    <Plus size={20} />
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-bold text-gray-900 mt-4">Tambah Kit Proyek Baru</h4>
                <p className="text-xs text-gray-500 mt-1">Perbarui atau buat template pembelajaran beralur PjBL untuk mata pelajaran baru.</p>
              </div>

              <div 
                className="p-5 border border-gray-100 rounded-2xl hover:bg-emerald-50/50 hover:border-emerald-100 transition-all group cursor-pointer"
                onClick={() => {
                  if (setAdminSubTab) setAdminSubTab('students');
                  if (setActiveTab) setActiveTab('admin');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <UserCheck size={20} />
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-bold text-gray-900 mt-4">Manajemen Peran Anggota</h4>
                <p className="text-xs text-gray-500 mt-1">Ubah peran guru menjadi admin, atau daftarkan peran siswa secara aman.</p>
              </div>

              <div 
                className="p-5 border border-gray-100 rounded-2xl hover:bg-blue-50/50 hover:border-blue-100 transition-all group cursor-pointer"
                onClick={() => {
                  if (setAdminSubTab) setAdminSubTab('projects');
                  if (setActiveTab) setActiveTab('admin');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <BookOpen size={20} />
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-bold text-gray-900 mt-4">Monitoring Proyek Siswa</h4>
                <p className="text-xs text-gray-500 mt-1">Mengawasi seluruh proyek kolaboratif, progres, nilai rubrik, dan kelayakan sistem.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Teacher Dashboard
  if (isTeacher) {
    if (teacherStats.loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
          />
        </div>
      );
    }

    const competenceData = [
      { name: 'Lit. Digital', Nilai: teacherStats.classAverageICT },
      { name: 'Comp. Thinking', Nilai: teacherStats.classAverageCT },
      { name: 'Aplikasi', Nilai: teacherStats.classAverageApp },
      { name: 'Pemrograman', Nilai: teacherStats.classAverageProg },
      { name: 'Kolaborasi', Nilai: teacherStats.classAverageCollab },
      { name: 'Manajemen', Nilai: teacherStats.classAveragePM },
    ];

    const stageData = [
      { name: 'Orientation', Proyek: teacherStats.stageBreakdown.Orientation },
      { name: 'Design', Proyek: teacherStats.stageBreakdown.Design },
      { name: 'Development', Proyek: teacherStats.stageBreakdown.Development },
      { name: 'Publication', Proyek: teacherStats.stageBreakdown.Publication },
    ];

    const stats = [
      { label: 'Siswa Dibimbing', value: teacherStats.totalStudents.toString(), icon: Users, color: 'bg-indigo-500', detail: 'Profil murid aktif terdaftar' },
      { label: 'Proyek Aktif', value: teacherStats.activeProjects.toString(), icon: Briefcase, color: 'bg-amber-500', detail: 'Kolaborasi PjBL sedang jalan' },
      { label: 'Proyek Selesai', value: teacherStats.completedProjects.toString(), icon: CheckCircle, color: 'bg-emerald-500', detail: 'Sudah disetujui instrukturnya' },
      { label: 'Rata-rata Kompetensi', value: `${Math.round((teacherStats.classAverageApp + teacherStats.classAverageCollab + teacherStats.classAverageCT + teacherStats.classAverageICT + teacherStats.classAveragePM + teacherStats.classAverageProg) / 6)}%`, icon: Award, color: 'bg-purple-500', detail: 'Rata-rata kumulatif se-kelas' },
    ];

    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 bg-gray-50 min-h-screen pb-24 md:pb-8">
        <header>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
              <GraduationCap size={20} />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard Guru</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Selamat datang, Pendidik. Pantau pencapaian belajar siswa, kelola bimbingan rubrik, dan kelayakan portofolio.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`${stat.color} p-2.5 sm:p-3 rounded-xl text-white shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-400">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] sm:text-xs text-gray-500">
                  {stat.detail}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Award size={18} className="text-indigo-600" />
              Rata-rata Kompetensi Siswa (%)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={competenceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.04)' }} formatter={(value) => [`${value}%`, 'Nilai Rata-rata']} />
                  <Bar dataKey="Nilai" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 lg:col-span-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              Progres Tahapan Proyek Tim
            </h3>
            <div className="h-80 select-none">
              {teacherStats.totalProjects > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip cursor={{ fill: 'rgba(245, 158, 11, 0.04)' }} formatter={(value) => [`${value} Tim`, 'Jumlah Tim']} />
                    <Bar dataKey="Proyek" fill="#f59e0b" radius={[0, 10, 10, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Belum ada tim proyek terdaftar.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <Settings size={18} className="text-indigo-600" />
            Tindakan Pintasan Guru
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div 
              onClick={() => {
                if (setAdminSubTab) setAdminSubTab('projects');
                if (setActiveTab) setActiveTab('teacher');
              }}
              className="p-6 border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all rounded-2xl group cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Tinjau & Beri Nilai Proyek</h4>
                <p className="text-xs text-gray-500 mt-2">Buka daftar proyek siswa untuk memberikan ulasan feedback per instrumen rubrik.</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 mt-4 inline-flex items-center gap-1">
                Akses Konsol Guru <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            <div 
              onClick={() => {
                if (setAdminSubTab) setAdminSubTab('students');
                if (setActiveTab) setActiveTab('teacher');
              }}
              className="p-6 border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all rounded-2xl group cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Daftar Siswa & Distribusi Sertifikat</h4>
                <p className="text-xs text-gray-500 mt-2">Lihat daftar murid, unggah portofolio bimbingan, dan terbitkan sertifikat apresiasi kompetensi.</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 mt-4 inline-flex items-center gap-1">
                Buka Konsol Siswa <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            <div 
              onClick={() => setActiveTab && setActiveTab('collaboration')}
              className="p-6 border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all rounded-2xl group cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Ruang Diskusi & Kerjasama Kelas</h4>
                <p className="text-xs text-gray-500 mt-2">Berinteraksi langsung di forum, posting topik diskusi baru, dan balas pertanyaan bimbingan proyek.</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 mt-4 inline-flex items-center gap-1">
                Masuk Ruang Kolaborasi <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Student Dashboard (Original Dashboard)
  const competenceData = [
    { subject: 'Literasi Digital', A: student.competence.ictLiteracy || 0, fullMark: 100 },
    { subject: 'Computational Thinking', A: student.competence.computationalThinking || 0, fullMark: 100 },
    { subject: 'Aplikasi Digital', A: student.competence.appUsage || 0, fullMark: 100 },
    { subject: 'Pemrograman', A: student.competence.programming || 0, fullMark: 100 },
    { subject: 'Kolaborasi', A: student.competence.collaboration || 0, fullMark: 100 },
    { subject: 'Manajemen Proyek', A: student.competence.projectManagement || 0, fullMark: 100 },
  ];

  const averageCompetence = Math.round(Object.values(student.competence).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) / 6);

  const getGrade = (score: number) => {
    if (score === 0) return '-';
    if (score >= 85) return `A (${score})`;
    if (score >= 70) return `B (${score})`;
    if (score >= 55) return `C (${score})`;
    return `D (${score})`;
  };

  const studentPortfolio: string[] = student.portfolio || [];
  const stats = [
    { label: 'Total Projects', value: projectCount.toString(), icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Competence Score', value: `${averageCompetence}%`, icon: Award, color: 'bg-indigo-500' },
    { label: 'Portfolio Items', value: studentPortfolio.length.toString(), icon: Users, color: 'bg-purple-500' },
    { label: 'Learning Velocity', value: projectCount > 0 ? '+5.2%' : '0%', icon: TrendingUp, color: 'bg-emerald-500' },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 bg-gray-50 min-h-screen pb-24 md:pb-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100/50 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Selamat Datang, {student.name.split(' ')[0]}!</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Berikut ringkasan capaian kompetensi PjBL kamu semester ini.</p>
        </div>
        <div className="text-left sm:text-right border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 w-full sm:w-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
          <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block">Nilai Saat Ini</span>
          <p className="text-lg sm:text-2xl font-bold text-indigo-600">{getGrade(averageCompetence)}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
            >
              <div className={`${stat.color} p-2.5 sm:p-3 rounded-xl text-white shrink-0`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        <div className="lg:col-span-1 bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6">Kompetensi Radar (Siswa)</h3>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competenceData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar
                   name={student.name}
                   dataKey="A"
                   stroke="#4f46e5"
                   fill="#4f46e5"
                   fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6">Aktivitas Pembelajaran</h3>
          <div className="flex items-center justify-center h-80 text-gray-400">
            <p>Data aktivitas kamu akan terus terisi seiring selesainya tahap-tahap proyek.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

