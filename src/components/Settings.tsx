import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Bell, Shield, Palette, Save, LogOut, Camera, Sparkles } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export default function Settings() {
  const { student, signOut, theme, setTheme } = useFirebase();
  const [isSaving, setIsSaving] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('user_gemini_api_key') || '');
  const [formData, setFormData] = useState({
    name: student?.name || '',
    email: student?.email || '',
    avatar: student?.avatar || '',
    phone: student?.phone || '',
    whatsapp: student?.whatsapp || '',
    instagram: student?.instagram || '',
    bio: student?.bio || '',
  });

  if (!student) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'students', student.id), {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        instagram: formData.instagram,
        bio: formData.bio,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${student.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 bg-gray-50 min-h-screen pb-24 md:pb-8">
      <header>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Settings</h2>
        <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-1">Manage your account preferences and profile settings.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
          <section className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <User size={18} />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Profile Information</h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 text-center sm:text-left border-b border-gray-50 pb-6">
                <div className="relative group">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gray-100 overflow-hidden border-4 border-white shadow-lg shrink-0">
                    <img 
                      src={formData.avatar || `https://picsum.photos/seed/${student.id}/96/96`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <button type="button" className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base sm:text-lg mt-1 sm:mt-0">{student.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Student ID: {student.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 sm:p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 sm:p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Avatar URL</label>
                <input 
                  type="url" 
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full p-3 sm:p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-xs sm:text-sm"
                  placeholder="https://..."
                />
              </div>

              {/* Hubungi & Informasi Kontak */}
              <div className="pt-4 border-t border-gray-100 space-y-4 sm:space-y-6">
                <h4 className="text-xs sm:text-sm font-bold text-gray-800">Uraian Profil & Informasi Kontak</h4>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Bio Singkat</label>
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full p-3 sm:p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-xs sm:text-sm h-24 resize-none"
                    placeholder="Contoh: Siswa Kelas X TJKT 1, bersemangat tentang simulasi jaringan dan Cisco Packet Tracer!"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">No. WhatsApp</label>
                    <input 
                      type="text" 
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full p-3 sm:p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-xs sm:text-sm"
                      placeholder="e.g. 6281234567890"
                    />
                    <span className="text-[9px] text-gray-400 block leading-tight">Gunakan format angka lengkap (contoh: 628XXXXXXXX)</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Instagram Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs sm:text-sm">@</span>
                      <input 
                        type="text" 
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        className="w-full p-3 pl-8 sm:p-4 sm:pl-8 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-xs sm:text-sm"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">No. Handphone</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 sm:p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-xs sm:text-sm"
                      placeholder="e.g. 081234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
                >
                  <Save size={16} />
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Bell size={18} />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Notifications</h3>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {[
                { id: 'n1', label: 'Project Updates', desc: 'Get notified when a team member updates a project stage.' },
                { id: 'n2', label: 'New Discussions', desc: 'Receive alerts for new posts in the collaboration hub.' },
                { id: 'n3', label: 'Competence Milestones', desc: 'Notifications when you reach a new competence level.' }
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3.5 hover:bg-gray-50 rounded-xl transition-colors gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">{item.label}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-tight">{item.desc}</p>
                  </div>
                  <div className="w-10 h-5 bg-indigo-600 rounded-full relative shrink-0 cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          <section className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <Shield size={18} />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Security</h3>
            </div>
            <button className="w-full text-left p-3.5 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer">
              <p className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-indigo-600">Change Password</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Update your account security credentials.</p>
            </button>
            <button className="w-full text-left p-3.5 hover:bg-gray-50 rounded-xl transition-colors group mt-2 cursor-pointer">
              <p className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-indigo-600">Two-Factor Auth</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Add an extra layer of protection.</p>
            </button>
          </section>

          <section className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <Sparkles size={18} className="text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Gemini AI (GitHub Pages)</h3>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Aplikasi ini dikonfigurasi untuk siap dipasang pada <strong>GitHub Pages</strong>. Agar Anda tetap bisa menggunakan fitur bimbingan AI secara aman dan privat (tanpa kebocoran API Key di server publik), silakan masukkan <strong>Gemini API Key</strong> Anda sendiri di sini:
              </p>
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest block">Gemini API Key Anda</label>
                <input 
                  type="password" 
                  value={geminiKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGeminiKey(val);
                    localStorage.setItem('user_gemini_api_key', val);
                  }}
                  className="w-full p-3 sm:p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-xs sm:text-sm font-mono text-gray-900 font-medium"
                  placeholder="AIzaSy..."
                />
                <span className="text-[9px] text-emerald-600 font-medium block leading-tight">Key disimpan dengan aman secara lokal di LocalStorage browser Anda.</span>
              </div>
            </div>
          </section>

          <section className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <Palette size={18} />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Appearance</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 sm:p-4 border-2 rounded-xl text-center cursor-pointer transition-all ${
                  theme === 'light' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-750 font-extrabold shadow-sm' 
                    : 'border-transparent bg-gray-50 text-gray-400 hover:border-gray-200 hover:text-gray-700'
                }`}
              >
                <p className="font-bold text-xs sm:text-sm">Terang (Light)</p>
              </button>
              <button 
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 sm:p-4 border-2 rounded-xl text-center cursor-pointer transition-all ${
                  theme === 'dark' 
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-extrabold shadow-sm' 
                    : 'border-transparent bg-gray-50 text-gray-400 hover:border-gray-200 hover:text-gray-700'
                }`}
              >
                <p className="font-bold text-xs sm:text-sm">Gelap (Dark)</p>
              </button>
            </div>
          </section>

          <button 
            onClick={signOut}
            className="w-full bg-red-50 text-red-650 p-4 sm:p-5 rounded-2xl font-bold hover:bg-red-150 transition-all flex items-center justify-center gap-2.5 text-xs sm:text-sm cursor-pointer mt-4"
          >
            <LogOut size={16} />
            Sign Out of Account
          </button>
        </div>
      </div>
    </div>
  );
}
