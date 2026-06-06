import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Briefcase, ChevronRight, Sparkles, BookOpen, UserCheck, AlertCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Student } from '../types';

interface ProfileSetupProps {
  studentId: string;
  userEmail: string;
}

export default function ProfileSetup({ studentId, userEmail }: ProfileSetupProps) {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Teacher Form State
  const [teacherPosition, setTeacherPosition] = useState('Guru Mata Pelajaran');
  const [customTeacherPosition, setCustomTeacherPosition] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('Teknologi Informasi');

  // Student Form State
  const [gradeLevel, setGradeLevel] = useState<'X' | 'XI' | 'XII'>('X');
  const [major, setMajor] = useState('TJKT');
  const [customMajor, setCustomMajor] = useState('');
  const [classNumber, setClassNumber] = useState('1');

  const popularMajors = [
    { code: 'TJKT', name: 'Teknik Jaringan Komputer & Telekomunikasi' },
    { code: 'RPL', name: 'Rekayasa Perangkat Lunak' },
    { code: 'DKV', name: 'Desain Komunikasi Visual' },
    { code: 'AKL', name: 'Akuntansi & Keuangan Lembaga' },
    { code: 'MP', name: 'Manajemen Perkantoran / Perkantoran' },
    { code: 'TITL', name: 'Teknik Instalasi Tenaga Listrik' },
    { code: 'TP', name: 'Teknik Pemesinan' },
    { code: 'other', name: 'Jurusan Lainnya (Ketik Manual)...' },
  ];

  const teacherPositions = [
    'Guru Mata Pelajaran',
    'Guru Produktif TJKT / RPL / IT',
    'Wali Kelas',
    'Kepala Program Keahlian (Kaprog)',
    'Wakil Kepala Sekolah (Waka)',
    'Guru BK / Konselor',
    'Kepala Sekolah',
    'other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalRole = role;
      const updates: Partial<Student> = {
        role: finalRole,
        profileSetup: true,
      };

      if (finalRole === 'teacher') {
        const finalPosition = teacherPosition === 'other' ? customTeacherPosition : teacherPosition;
        if (!finalPosition || finalPosition.trim() === '') {
          throw new Error('Silakan isi jabatan Anda.');
        }
        updates.teacherPosition = finalPosition;
        updates.teacherSubject = teacherSubject.trim() || 'Teknologi Informasi';
      } else {
        const finalMajor = major === 'other' ? customMajor : major;
        if (!finalMajor || finalMajor.trim() === '') {
          throw new Error('Silakan isi jurusan Anda.');
        }
        
        updates.gradeLevel = gradeLevel;
        updates.major = finalMajor.toUpperCase().trim();
        updates.classNumber = classNumber;
        updates.className = `${gradeLevel} ${finalMajor.toUpperCase().trim()} ${classNumber}`;
      }

      await updateDoc(doc(db, 'students', studentId), updates);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12 select-none">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Deco Panel */}
        <div className="bg-indigo-600 p-8 md:p-12 text-white flex flex-col justify-between md:max-w-[240px] md:w-full shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-tight">SMK Negeri 1 Ujungbatu</h1>
              <p className="text-[10px] uppercase font-black tracking-widest text-indigo-200 mt-1">PjBL Classroom</p>
            </div>
          </div>

          <div className="text-xs text-indigo-100/80 leading-relaxed mt-12 md:mt-0">
            Platform pembelajaran digital berbasis proyek (PjBL) untuk kolaborasi tim yang lancar.
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 md:p-12 flex-1 space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 leading-tight">Lengkapi Profil Pendaftaran</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Halo <span className="font-semibold text-gray-700">{userEmail}</span>!, agar sistem dapat mengelompokkan Anda dengan benar, silakan isi data diri berikut.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 rounded-2xl flex items-start gap-3 border border-red-100"
            >
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold text-red-700 leading-relaxed">{error}</div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Role Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Saya Mendaftar Sebagai</label>
              <div className="grid grid-cols-2 gap-4">
                {/* Siswa Card */}
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 cursor-pointer relative transition-all overflow-hidden ${
                    role === 'student'
                      ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-600/10'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${role === 'student' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] text-gray-900">Siswa / Murid</h3>
                    <p className="text-[10px] text-gray-400 leading-none mt-1">Mengerjakan proyek PjBL</p>
                  </div>
                </button>

                {/* Guru Card */}
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 cursor-pointer relative transition-all overflow-hidden ${
                    role === 'teacher'
                      ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-600/10'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${role === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] text-gray-900">Guru / Pengajar</h3>
                    <p className="text-[10px] text-gray-400 leading-none mt-1">Mengelola & menilai tim</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Dynamic Inputs Based on Role Selection */}
            {role === 'teacher' ? (
              <motion.div
                key="teacher-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Jabatan Guru</label>
                  <select
                    value={teacherPosition}
                    onChange={(e) => setTeacherPosition(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-semibold cursor-pointer text-gray-800"
                  >
                    {teacherPositions.map((p) => (
                      <option key={p} value={p}>
                        {p === 'other' ? 'Lainnya (Tulis Manual)' : p}
                      </option>
                    ))}
                  </select>
                </div>

                {teacherPosition === 'other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Tulis Jabatan Anda</label>
                    <input
                      required
                      type="text"
                      value={customTeacherPosition}
                      onChange={(e) => setCustomTeacherPosition(e.target.value)}
                      placeholder="Contoh: Pembina OSIS, Kepala Laboratorium Komputer"
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium text-gray-800"
                    />
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Mata Pelajaran yang Diampu</label>
                  <input
                    required
                    type="text"
                    value={teacherSubject}
                    onChange={(e) => setTeacherSubject(e.target.value)}
                    placeholder="Contoh: Teknologi Informasi, Bahasa Indonesia, Olahraga"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium text-gray-800"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="student-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Tingkatan Kelas */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Tingkatan</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value as any)}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold cursor-pointer text-gray-800"
                    >
                      <option value="X">Kelas X (Sepuluh)</option>
                      <option value="XI">Kelas XI (Sebelas)</option>
                      <option value="XII">Kelas XII (Duabelas)</option>
                    </select>
                  </div>

                  {/* Urutan Kelas */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Nomor Kelas</label>
                    <select
                      value={classNumber}
                      onChange={(e) => setClassNumber(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold cursor-pointer text-gray-800"
                    >
                      <option value="1">Kelas 1</option>
                      <option value="2">Kelas 2</option>
                      <option value="3">Kelas 3</option>
                      <option value="4">Kelas 4</option>
                      <option value="5">Kelas 5</option>
                    </select>
                  </div>
                </div>

                {/* Jurusan */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Kompetensi Keahlian / Jurusan</label>
                  <select
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-semibold cursor-pointer text-gray-800"
                  >
                    {popularMajors.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {major === 'other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Ketik Nama Singkat Jurusan</label>
                    <input
                      required
                      type="text"
                      value={customMajor}
                      onChange={(e) => setCustomMajor(e.target.value)}
                      placeholder="Contoh: MPLB, TPM, dsb (Huruf Singkat)"
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium text-gray-800"
                    />
                  </motion.div>
                )}

                {/* Formatted Preview */}
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs text-indigo-700">
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} />
                    <span>Anda akan dimasukkan ke rombongan kelas:</span>
                  </div>
                  <strong className="text-sm bg-indigo-600 text-white px-2.5 py-0.5 rounded-lg">
                    {gradeLevel} {(major === 'other' ? customMajor : major).toUpperCase()} {classNumber}
                  </strong>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group disabled:opacity-75 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Simpan & Masuk Kelas</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
