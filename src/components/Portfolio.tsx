import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Plus, FileText, Image as ImageIcon, Video, Link as LinkIcon, Download, ExternalLink, Trash2, Upload, X, Award } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from './FirebaseProvider';
import { Artifact, Certificate } from '../types';
import { uploadToDrive } from '../services/driveService';

export default function Portfolio() {
  const { student } = useFirebase();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'artifacts' | 'certificates'>('artifacts');
  const [filter, setFilter] = useState<'all' | 'document' | 'image' | 'video' | 'link'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload form state
  const [newArtifact, setNewArtifact] = useState({
    title: '',
    type: 'document' as Artifact['type'],
    url: '',
    projectId: '',
    description: ''
  });

  useEffect(() => {
    if (!student) return;

    const q = query(collection(db, 'artifacts'), where('studentId', '==', student.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Artifact[];
      setArtifacts(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'artifacts');
    });

    const certQ = query(collection(db, 'certificates'), where('recipientId', '==', student.id));
    const certUnsub = onSnapshot(certQ, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Certificate[];
      setCertificates(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'certificates');
      setLoading(false);
    });

    return () => {
      unsubscribe();
      certUnsub();
    };
  }, [student]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsUploading(true);
    try {
      let finalUrl = newArtifact.url;
      let finalTitle = newArtifact.title;

      if (selectedFile) {
        const driveResult = await uploadToDrive(selectedFile);
        finalUrl = driveResult.webViewLink;
        finalTitle = finalTitle || selectedFile.name;
      }

      if (!finalUrl) {
        throw new Error("Link atau File wajib diisi.");
      }

      await addDoc(collection(db, 'artifacts'), {
        ...newArtifact,
        title: finalTitle,
        url: finalUrl,
        studentId: student.id,
        timestamp: serverTimestamp(),
        tags: [newArtifact.type]
      });
      setShowUploadModal(false);
      setNewArtifact({ title: '', type: 'document', url: '', projectId: '', description: '' });
      setSelectedFile(null);
    } catch (error: any) {
      if (error.message.includes('access token')) {
        alert("Sesi Google Drive telah berakhir. Silakan Logout dan Login kembali untuk menghubungkan Drive.");
        return;
      }
      handleFirestoreError(error, OperationType.CREATE, 'artifacts');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'artifacts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `artifacts/${id}`);
    }
  };

  const filteredArtifacts = artifacts.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getIcon = (type: Artifact['type']) => {
    switch (type) {
      case 'image': return <ImageIcon size={24} />;
      case 'video': return <Video size={24} />;
      case 'link': return <LinkIcon size={24} />;
      default: return <FileText size={24} />;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 bg-gray-50 min-h-screen pb-24 md:pb-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100/50 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Digital Portfolio</h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-1">Showcase your best digital artifacts and project certificates.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 sm:px-6 sm:py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group text-xs sm:text-sm"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" />
          Add Artifact
        </button>
      </header>

      <div className="flex gap-2 p-1 bg-gray-200/50 w-full sm:w-fit rounded-xl">
        <button 
          onClick={() => setActiveTab('artifacts')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'artifacts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          My Artifacts
        </button>
        <button 
          onClick={() => setActiveTab('certificates')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'certificates' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Award size={14} className="inline mr-1" />
          Certificates
        </button>
      </div>

      {activeTab === 'artifacts' && (
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-white p-3 sm:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search artifacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
            />
          </div>
          <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl overflow-x-auto w-full lg:w-auto whitespace-nowrap scrollbar-none">
            {(['all', 'document', 'image', 'video', 'link'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`py-1.5 px-3.5 rounded-lg text-[10px] sm:text-xs font-bold capitalize transition-all ${filter === t ? 'bg-white text-indigo-600 shadow-sm font-black' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {t === 'all' ? 'Semua' : t}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
          />
        </div>
      ) : activeTab === 'artifacts' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredArtifacts.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 group-hover:text-indigo-200 transition-colors">
                    {getIcon(item.type)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-xl text-gray-900 hover:bg-indigo-50 transition-colors">
                    <ExternalLink size={20} />
                  </a>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 bg-white rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{item.title}</h3>
                </div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{item.type} • {item.timestamp && typeof item.timestamp.toDate === 'function' ? item.timestamp.toDate().toLocaleDateString() : 'Just now'}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-full border border-gray-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certificates.map((cert) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 border-l-8 border-l-indigo-600 flex flex-col space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Award size={32} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Official Award</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{cert.title}</h3>
                <p className="text-gray-500 mt-2">Issued by: <span className="font-bold text-indigo-600">{cert.issuerName}</span></p>
              </div>
              <div className="flex flex-wrap gap-2">
                {cert.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                <p className="text-xs text-gray-400 font-medium">{cert.issuedAt && typeof cert.issuedAt.toDate === 'function' ? cert.issuedAt.toDate().toLocaleDateString() : 'Date Pending'}</p>
                {cert.url && (
                  <a href={cert.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
                    View Document <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
          {certificates.length === 0 && (
            <div className="col-span-full p-20 text-center bg-white rounded-[40px] border border-gray-50">
              <Award size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-500 font-bold">No certificates awarded yet.</p>
              <p className="text-gray-400 text-sm mt-1">Keep up the great work in your projects!</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Tambahkan Bukti ke Portofolio</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>
              <div className="bg-blue-50 mx-8 mt-6 p-4 rounded-2xl text-xs text-blue-700 leading-relaxed">
                <strong>Cara Kerja:</strong> Anda bisa mengunggah file langsung ke <strong>Google Drive</strong> Anda melalui tombol di bawah ini.
              </div>
              <form onSubmit={handleUpload} className="p-8 space-y-6">
                <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase block mb-2">Unggah File Langsung ke Drive</label>
                  {newArtifact.type === 'video' ? (
                    <div className="p-4 bg-amber-50 rounded-xl text-[11px] text-amber-700 flex items-start gap-3">
                      <Video size={16} className="mt-0.5 shrink-0" />
                      <p>Khusus untuk file video, silakan gunakan link dari YouTube atau layanan lain untuk menjaga performa aplikasi. Unggah file dinonaktifkan untuk tipe video.</p>
                    </div>
                  ) : (
                    <input 
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  )}
                </div>

                <div className="relative py-2 flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] font-black text-gray-300 uppercase letter-spacing-widest">Atau Manual</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Judul Karya</label>
                  <input 
                    type="text" 
                    value={newArtifact.title}
                    onChange={(e) => setNewArtifact({...newArtifact, title: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    placeholder="Contoh: Desain UI Aplikasi Pintar"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tipe</label>
                    <select 
                      value={newArtifact.type}
                      onChange={(e) => setNewArtifact({...newArtifact, type: e.target.value as Artifact['type']})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none appearance-none"
                    >
                      <option value="document">Dokumen</option>
                      <option value="image">Gambar</option>
                      <option value="video">Video</option>
                      <option value="link">Link Lainnya</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">ID Proyek (Opsional)</label>
                    <input 
                      type="text" 
                      value={newArtifact.projectId}
                      onChange={(e) => setNewArtifact({...newArtifact, projectId: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                      placeholder="e.g., proj_123"
                    />
                  </div>
                </div>
                {!selectedFile && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                      {newArtifact.type === 'video' ? 'Link Video (YouTube/Lainnya)' : 'Tautan Google Drive / Source'}
                    </label>
                    <input 
                      type="url" 
                      value={newArtifact.url}
                      onChange={(e) => setNewArtifact({...newArtifact, url: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                      placeholder={newArtifact.type === 'video' ? "https://www.youtube.com/watch?v=..." : "https://drive.google.com/..."}
                    />
                  </div>
                )}
                <button 
                  disabled={isUploading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    'Sedang memproses...'
                  ) : (
                    <>
                      <Upload size={20} />
                      Simpan ke Portofolio
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

