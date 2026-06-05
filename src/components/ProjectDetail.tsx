import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, CheckCircle2, Circle, ArrowRight, Upload, MessageSquare, FileText, Link as LinkIcon, Users, Settings, LayoutDashboard, FolderKanban, Briefcase, GraduationCap, LogOut, Sparkles, X, ExternalLink, Plus, Trash2, Award } from 'lucide-react';
import ProjectKit from './ProjectKit';
import { GoogleGenAI } from "@google/genai";
import { doc, onSnapshot, updateDoc, collection, query, orderBy, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from './FirebaseProvider';
import { Project, ProjectStage, Discussion, Artifact } from '../types';
import { uploadToDrive } from '../services/driveService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const stages: ProjectStage[] = ['Orientation', 'Design', 'Development', 'Publication'];

const stageLabels: { [key in ProjectStage]: string } = {
  Orientation: 'Orientasi',
  Design: 'Perencanaan',
  Development: 'Produksi',
  Publication: 'Publikasi',
};

const stageSubtitles: { [key in ProjectStage]: string } = {
  Orientation: 'Pemberian Skenario Masalah & Tantangan Dunia Nyata',
  Design: 'Perancangan Langkah-Langkah Penyelesaian & Pembagian Peran',
  Development: 'Pengerjaan Proyek & Pengunggahan Dokumentasi Teknis',
  Publication: 'Penyajian Hasil Karya & Apresiasi Ulasan Peer-Review',
};

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export default function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { student, isAdmin, isTeacher } = useFirebase();
  const [project, setProject] = useState<Project | null>(null);
  const [currentStage, setCurrentStage] = useState<ProjectStage>('Orientation');
  const [showKit, setShowKit] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  const [newArtifact, setNewArtifact] = useState({ title: '', url: '', description: '' });
  const [isSubmittingArtifact, setIsSubmittingArtifact] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showManageTeamModal, setShowManageTeamModal] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [tempRoles, setTempRoles] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [reflectionText, setReflectionText] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (project && project.stages[currentStage]) {
      setReflectionText(project.stages[currentStage].reflection || '');
    }
  }, [project, currentStage]);

  const handleSaveReflection = async () => {
    if (!project) return;
    setIsSavingReflection(true);
    setSaveSuccess(false);
    try {
      const updatedStages = { ...project.stages };
      updatedStages[currentStage] = {
        ...updatedStages[currentStage],
        reflection: reflectionText
      };
      await updateDoc(doc(db, 'projects', projectId), {
        stages: updatedStages
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving reflection:", error);
    } finally {
      setIsSavingReflection(false);
    }
  };

  const isLeader = student?.id === project?.leaderId;
  const canManageTeam = isLeader || isAdmin || isTeacher;

  useEffect(() => {
    // Fetch all students for member management
    const studentsUnsub = onSnapshot(collection(db, 'students'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllStudents(docs);
    });

    return () => studentsUnsub();
  }, []);

  useEffect(() => {
    const docRef = doc(db, 'projects', projectId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Project;
        setProject(data);
        setCurrentStage(data.currentStage);
        setTempRoles(data.memberRoles || {});
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `projects/${projectId}`);
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleAddArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !student) return;

    setIsSubmittingArtifact(true);
    setUploadProgress('idle');
    
    try {
      let finalUrl = newArtifact.url;
      let finalTitle = newArtifact.title;

      // If a file is selected, upload it first
      if (selectedFile) {
        setUploadProgress('uploading');
        const driveResult = await uploadToDrive(selectedFile);
        finalUrl = driveResult.webViewLink;
        finalTitle = finalTitle || selectedFile.name;
      }

      if (!finalUrl) {
        throw new Error("Link atau File wajib diisi.");
      }

      setUploadProgress('saving');

      // Create Artifact Document
      const artifactData = {
        studentId: student.id,
        projectId: projectId,
        title: finalTitle || 'Untitled Evidence',
        type: selectedFile ? 'document' : 'link',
        url: finalUrl,
        description: newArtifact.description,
        timestamp: serverTimestamp(),
        tags: [currentStage]
      };

      const artRef = await addDoc(collection(db, 'artifacts'), artifactData);
      
      // Update Project Stage Artifacts
      const updatedStages = { ...project.stages };
      const stageData = updatedStages[currentStage];
      stageData.artifacts = [...(stageData.artifacts || []), artRef.id];

      await updateDoc(doc(db, 'projects', projectId), {
        stages: updatedStages
      });

      setShowArtifactModal(false);
      setNewArtifact({ title: '', url: '', description: '' });
      setSelectedFile(null);
    } catch (error: any) {
      if (error.message.includes('access token')) {
        alert("Sesi Google Drive telah berakhir. Silakan Logout dan Login kembali untuk menghubungkan Drive.");
        return;
      }
      handleFirestoreError(error, OperationType.WRITE, 'artifacts');
    } finally {
      setIsSubmittingArtifact(false);
      setUploadProgress('idle');
    }
  };

  const handleUpdateRoles = async () => {
    if (!project) return;
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        memberRoles: tempRoles
      });
      setShowRolesModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newMemberEmail) return;

    setIsAddingMember(true);
    try {
      const targetStudent = allStudents.find(s => s.email.toLowerCase() === newMemberEmail.toLowerCase());
      if (!targetStudent) {
        alert("Siswa dengan email tersebut tidak ditemukan.");
        return;
      }

      if (project.team.includes(targetStudent.id)) {
        alert("Siswa sudah ada dalam tim.");
        return;
      }

      await updateDoc(doc(db, 'projects', projectId), {
        team: [...project.team, targetStudent.id]
      });
      setNewMemberEmail('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleChangeLeader = async (newLeaderId: string) => {
    if (!project || !canManageTeam) return;
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        leaderId: newLeaderId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!project) return;
    if (memberId === project.leaderId) {
      alert("Ketua tim tidak bisa dihapus dari tim. Ganti ketua terlebih dahulu jika diperlukan.");
      return;
    }

    try {
      await updateDoc(doc(db, 'projects', projectId), {
        team: project.team.filter(id => id !== memberId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const handleGetAiFeedback = async () => {
    setIsAnalyzing(true);
    try {
      const storedKey = localStorage.getItem('user_gemini_api_key');
      const apiKey = storedKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        setAiFeedback("API Key Gemini tidak ditemukan. Agar bimbingan AI aktif, buka Menu 'Settings' (Pengaturan) pada bilah navigasi Anda dan masukkan / simpan Gemini API Key Anda sendiri.");
        setIsAnalyzing(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analisis progres proyek siswa bernama "${project?.title}" pada tahap "${currentStage}". Tuliskan 3 tips taktis dan konkret untuk meningkatkan kompetensi TJKT (Teknik Jaringan Komputer dan Telekomunikasi) mereka. Tulis umpan balik dalam Bahasa Indonesia dengan nada bimbingan guru yang suportif dan profesional.`,
      });
      setAiFeedback(response.text);
    } catch (error: any) {
      console.error("AI Feedback Error:", error);
      setAiFeedback(`Gagal memuat bimbingan AI: ${error?.message || 'Pastikan API Key Anda aktif dan benar di Menu Settings.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitPhase = async () => {
    if (!project || !student) return;

    const currentIndex = stages.indexOf(currentStage);
    const nextStage = stages[currentIndex + 1];
    
    const updatedStages = { ...project.stages };
    updatedStages[currentStage] = {
      ...updatedStages[currentStage],
      status: 'completed'
    };

    const updateData: any = {
      stages: updatedStages,
      progress: Math.min(100, Math.round(((currentIndex + 1) / stages.length) * 100))
    };

    if (nextStage) {
      updateData.currentStage = nextStage;
    } else {
      updateData.status = 'completed';
    }

    try {
      await updateDoc(doc(db, 'projects', projectId), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  if (loading) {
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

  if (!project) return null;

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <AnimatePresence>
        {showKit && <ProjectKit kit={project.kit} onClose={() => setShowKit(false)} />}
      </AnimatePresence>

      <header className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="p-3 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{project.title}</h2>
          <p className="text-gray-500 mt-1">Project ID: {projectId} • Team: {project.team.length} members</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Project Stages</h3>
            <div className="space-y-4">
              {stages.map((stage, i) => {
                const isCompleted = project.stages[stage]?.status === 'completed';
                const isActive = currentStage === stage;
                return (
                  <button
                    key={stage}
                    onClick={() => setCurrentStage(stage)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200",
                      isActive 
                        ? "bg-indigo-50 border-2 border-indigo-200 shadow-sm" 
                        : "bg-gray-50 border-2 border-transparent hover:bg-white hover:border-gray-200"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"
                    )}>
                      {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-sm font-bold", isActive ? "text-indigo-700" : "text-gray-600")}>{stageLabels[stage] || stage}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Fase {i + 1} dari {stages.length}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-200 text-white">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-80">Project Kit</h3>
            <p className="text-sm mb-6 leading-relaxed">Access templates, rubrics, and guides for this project.</p>
            <button 
              onClick={() => setShowKit(true)}
              className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              Open Project Kit
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">AI Feedback</h3>
            {aiFeedback ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-2xl text-sm text-indigo-700 leading-relaxed">
                  {aiFeedback}
                </div>
                <button 
                  onClick={() => setAiFeedback(null)}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Clear Feedback
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGetAiFeedback}
                disabled={isAnalyzing}
                className="w-full bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:bg-white text-indigo-600 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={18} />
                {isAnalyzing ? "Analyzing..." : "Get AI Feedback"}
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 min-h-[600px] flex flex-col"
          >
            <div className="flex justify-between items-start mb-10">
              <div>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Aktivitas Utama</span>
                <h3 className="text-4xl font-bold text-gray-900 mt-4">Fase {stageLabels[currentStage] || currentStage}</h3>
                <p className="text-gray-500 mt-2 text-lg leading-relaxed">{stageSubtitles[currentStage]}</p>
              </div>
              <div className="flex gap-3">
                <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-indigo-600 transition-colors">
                  <MessageSquare size={24} />
                </button>
            {canManageTeam && (
              <button 
                onClick={() => setShowManageTeamModal(true)}
                className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 hover:bg-indigo-100 transition-colors"
                title="Kelola Tim"
              >
                <Users size={24} />
              </button>
            )}
              </div>
            </div>

            <div className="flex-1 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tasks & Deliverables</h4>
                  <div className="space-y-4">
                    {project.stages[currentStage]?.status === 'completed' ? (
                      <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-emerald-700 flex items-center gap-3">
                        <CheckCircle2 size={24} />
                        <p className="font-bold">Phase Completed Successfully</p>
                      </div>
                    ) : (
                      [1, 2, 3].map((t) => (
                        <div key={t} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all group">
                          <div className="w-6 h-6 rounded-lg border-2 border-gray-200 group-hover:border-indigo-400 transition-colors" />
                          <p className="text-gray-700 font-medium">Task item {t} for {currentStage}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Bukti Pekerjaan (Google Drive)</h4>
                  <div 
                    onClick={() => setShowArtifactModal(true)}
                    className="border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-indigo-300 transition-colors group cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-700 transition-all">
                      <ExternalLink size={32} />
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold">Sematiikan Link Google Drive</p>
                      <p className="text-gray-400 text-sm mt-1">Unggah file ke Drive Anda, lalu tempel tautannya di sini.</p>
                    </div>
                  </div>
                  
                  {project.stages[currentStage]?.artifacts?.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bukti Terkumpul ({project.stages[currentStage].artifacts.length})</p>
                      <div className="grid grid-cols-1 gap-2">
                        {project.stages[currentStage].artifacts.map((artId) => (
                           <div key={artId} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl text-sm border border-blue-100">
                             <div className="flex items-center gap-2">
                               <LinkIcon size={14} className="text-blue-600" />
                               <span className="font-medium text-gray-700 truncate max-w-[150px]">Link Drive {artId.slice(-4)}</span>
                             </div>
                              <a 
                               href="#" 
                               onClick={async (e) => {
                                 e.preventDefault();
                                 try {
                                   const docRef = doc(db, 'artifacts', artId);
                                   const artSnap = await getDoc(docRef);
                                   if (artSnap.exists()) {
                                     window.open((artSnap.data() as Artifact).url, '_blank');
                                   }
                                 } catch (err) {
                                   console.error("Error opening artifact:", err);
                                 }
                               }} 
                               className="text-blue-600 font-bold hover:underline"
                             >
                               Buka
                             </a>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Refleksi Mandiri Siswa */}
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    R
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Refleksi Mandiri & Evaluasi Diri</h4>
                    <p className="text-xs text-indigo-600 font-medium">Sintaks PjBL • SMK Negeri 1 Ujungbatu</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Dokumentasikan pengalaman belajar Anda pada fase <strong>{currentStage}</strong> ini. Jelaskan tantangan atau kendala teknis (misal pada simulator topologi jaringan) yang kelompok Anda hadapi, bagaimana solusi pemecahannya, serta kompetensi baru yang diperoleh.
                </p>
                <textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Tulis refleksi mandiri di sini..."
                  className="w-full h-28 p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder-gray-400 transition-all font-sans"
                />
                <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {project.stages[currentStage]?.reflection ? "✓ Refleksi sudah direkam pada database" : "Menunggu pengisian refleksi mandiri"}
                  </span>
                  <button
                    onClick={handleSaveReflection}
                    disabled={isSavingReflection}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl shadow shadow-indigo-100 transition-all flex items-center gap-1.5"
                  >
                    {isSavingReflection ? "Menyimpan..." : saveSuccess ? "Tersimpan! ✓" : "Simpan Refleksi"}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => setShowManageTeamModal(true)}
                  className="flex -space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {project.team.map((memberId, i) => (
                    <div key={memberId} className="relative group">
                      <div className={cn(
                        "w-10 h-10 rounded-full border-2 bg-gray-200 overflow-hidden",
                        memberId === project.leaderId ? "border-amber-400" : "border-white"
                      )}>
                        <img src={`https://picsum.photos/seed/${memberId}/40/40`} alt="Avatar" referrerPolicy="no-referrer" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {memberId === project.leaderId ? 'Ketua Tim' : (project.memberRoles?.[memberId] || 'Member')}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {project.team.length} Anggota • Ketua: Member {project.leaderId.slice(-4)}
                </p>
              </div>
              {project.currentStage === currentStage && (project.status as string) !== 'completed' && (
                <button 
                  onClick={handleSubmitPhase}
                  className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 group"
                >
                  Submit Phase
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {showArtifactModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Sematkan Bukti Google Drive</h3>
                <button onClick={() => setShowArtifactModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl text-xs text-amber-700 leading-relaxed">
                <strong>Cara Kerja:</strong> File akan diunggah otomatis ke <strong>Google Drive Anda</strong> dan tersimpan dalam folder root sebagai file publik (view only).
              </div>
              <form onSubmit={handleAddArtifact} className="space-y-4">
                <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase block mb-2">Unggah File Langsung</label>
                  <input 
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.type.startsWith('video/')) {
                        alert("Khusus untuk file video, silakan gunakan link dari YouTube atau layanan lain untuk menjaga performa aplikasi.");
                        e.target.value = ""; // reset input
                        setSelectedFile(null);
                        return;
                      }
                      setSelectedFile(file);
                    }}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFile && (
                    <p className="text-[10px] text-blue-600 font-bold mt-2">Terpilih: {selectedFile.name}</p>
                  )}
                </div>

                <div className="relative py-4 flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] font-black text-gray-300 uppercase letter-spacing-widest">Atau Tempel Link</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Nama Bukti</label>
                  <input 
                    value={newArtifact.title}
                    onChange={e => setNewArtifact({...newArtifact, title: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none"
                    placeholder="Contoh: Desain Prototype - Kelompok 1"
                  />
                </div>
                {!selectedFile && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Tautan Google Drive</label>
                    <div className="flex gap-2">
                      <input 
                        type="url"
                        value={newArtifact.url}
                        onChange={e => setNewArtifact({...newArtifact, url: e.target.value})}
                        className="flex-1 p-4 bg-gray-50 border-none rounded-2xl outline-none"
                        placeholder="https://drive.google.com/..."
                      />
                      <a 
                        href="https://drive.google.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-4 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-100 transition-all"
                        title="Buka Google Drive"
                      >
                        <Upload size={20} />
                      </a>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Notes (Optional)</label>
                  <textarea 
                    value={newArtifact.description}
                    onChange={e => setNewArtifact({...newArtifact, description: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none resize-none"
                    rows={2}
                    placeholder="Brief description..."
                  />
                </div>
                <button 
                  disabled={isSubmittingArtifact}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {uploadProgress === 'uploading' ? 'Mengunggah ke Drive...' : 
                   uploadProgress === 'saving' ? 'Menyimpan Data...' : 
                   isSubmittingArtifact ? 'Processing...' : 'Selesaikan Pekerjaan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showManageTeamModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                <div>
                  <h3 className="text-2xl font-bold">Kelola Anggota Tim</h3>
                  <p className="text-indigo-100 text-sm">Pilih teman untuk bergabung dalam proyek ini</p>
                </div>
                <button onClick={() => setShowManageTeamModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {canManageTeam && (
                  <form onSubmit={handleAddMember} className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tambah Anggota (Email)</label>
                    <div className="flex gap-3">
                      <input 
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="email@sekolah.sch.id"
                        className="flex-1 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                      />
                      <button 
                        type="submit"
                        disabled={isAddingMember}
                        className="px-6 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
                      >
                        <Plus size={20} />
                        Tambah
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daftar Anggota Saat Ini</h4>
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {project.team.map(memberId => {
                      const member = allStudents.find(s => s.id === memberId);
                      return (
                        <div key={memberId} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center p-0.5",
                              memberId === project.leaderId ? "bg-amber-100" : "bg-white border-2 border-gray-100"
                            )}>
                              <img src={`https://picsum.photos/seed/${memberId}/44/44`} className="w-full h-full rounded-[10px]" alt="Avatar" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 flex items-center gap-2">
                                {member?.name || `Member ${memberId.slice(-4)}`}
                                {memberId === project.leaderId && (
                                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Ketua</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">{member?.email || 'Student Email'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canManageTeam && memberId !== project.leaderId && (
                              <button 
                                onClick={() => handleChangeLeader(memberId)}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Jadikan Ketua"
                              >
                                <Award size={18} />
                              </button>
                            )}
                            {canManageTeam && (
                              <button 
                                onClick={() => {
                                  setTempRoles({...project.memberRoles, [memberId]: project.memberRoles?.[memberId] || ''});
                                  setShowRolesModal(true);
                                }}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit Role"
                              >
                                <Settings size={18} />
                              </button>
                            )}
                            {canManageTeam && memberId !== project.leaderId && (
                              <button 
                                onClick={() => handleRemoveMember(memberId)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Hapus dari Tim"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showRolesModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Assign Team Roles</h3>
                <button onClick={() => setShowRolesModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {project.team.map(memberId => (
                  <div key={memberId} className="flex flex-col space-y-2 p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <img src={`https://picsum.photos/seed/${memberId}/40/40`} className="w-8 h-8 rounded-lg" alt="Avatar" />
                      <p className="text-sm font-bold text-gray-700">Member {memberId.slice(-4)}</p>
                    </div>
                    <input 
                      value={tempRoles[memberId] || ''}
                      onChange={e => setTempRoles({...tempRoles, [memberId]: e.target.value})}
                      className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. Lead Designer, Frontend Dev..."
                    />
                  </div>
                ))}
              </div>
              <button 
                onClick={handleUpdateRoles}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
              >
                Save Roles
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}



