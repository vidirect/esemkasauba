import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderKanban, ChevronRight, Clock, Users, CheckCircle2, X, Plus, Trash2, Search, Filter, Award, BookOpen, UserCheck, HelpCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from './FirebaseProvider';
import { Project, ProjectStage, ProjectKit as KitType, Student } from '../types';
import { PROJECT_KITS } from '../constants/kits';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProjectListProps {
  onSelectProject: (projectId: string) => void;
}

export default function ProjectList({ onSelectProject }: ProjectListProps) {
  const { student, isTeacher, isAdmin } = useFirebase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [kits, setKits] = useState<KitType[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & Search states for workspace overview
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [projectSearch, setProjectSearch] = useState('');

  // Form states
  const [newProject, setNewProject] = useState({ 
    title: '', 
    description: '',
    kitId: '',
    targetClass: '',
    team: [] as string[],
    leaderId: ''
  });

  // Checklist filtration in creation modal
  const [modalClassFilter, setModalClassFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (!student) return;

    // Fetch projects based on role
    // Teachers & Admins see all projects. Students only see projects where they are team members.
    let q;
    if (isTeacher || isAdmin) {
      q = query(collection(db, 'projects'));
    } else {
      q = query(collection(db, 'projects'), where('team', 'array-contains', student.id));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    // Fetch school kits
    const kitsUnsub = onSnapshot(collection(db, 'kits'), (snapshot) => {
      const kitsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as KitType));
      const availableKits = kitsData.length > 0 ? kitsData : PROJECT_KITS;
      setKits(availableKits);
      
      setNewProject(prev => {
        if (!prev.kitId || !availableKits.find(k => k.id === prev.kitId)) {
          return { ...prev, kitId: availableKits[0].id || '' };
        }
        return prev;
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'kits');
    });

    return () => {
      unsubscribe();
      kitsUnsub();
    };
  }, [student, isTeacher, isAdmin]);

  // Load registered students for Teacher Project Builder assignments
  useEffect(() => {
    if (!student || (!isTeacher && !isAdmin)) return;

    const unsubscribeSt = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentData = snapshot.docs.map(doc => {
        const data = doc.data() as Student;
        return { ...data, id: doc.id };
      });
      setAllStudents(studentData);
    }, (error) => {
      console.error("Error loading students list in ProjectList:", error);
    });

    return () => unsubscribeSt();
  }, [student, isTeacher, isAdmin]);

  const handleDeleteProject = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'projects', id));
      setProjectToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStudentInTeam = (studentId: string) => {
    setNewProject(prev => {
      const isAlreadyIn = prev.team.includes(studentId);
      const updatedTeam = isAlreadyIn
        ? prev.team.filter(id => id !== studentId)
        : [...prev.team, studentId];

      let updatedLeader = prev.leaderId;
      if (isAlreadyIn && prev.leaderId === studentId) {
        updatedLeader = updatedTeam[0] || '';
      } else if (!prev.leaderId && updatedTeam.length > 0) {
        updatedLeader = updatedTeam[0];
      }

      return {
        ...prev,
        team: updatedTeam,
        leaderId: updatedLeader
      };
    });
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !newProject.title) return;

    setIsCreating(true);
    try {
      const availableKits = kits.length > 0 ? kits : PROJECT_KITS;
      const selectedKit = availableKits.find(k => k.id === newProject.kitId) || availableKits[0];

      const defaultStages: Record<ProjectStage, any> = {
        'Orientation': { status: 'active', tasks: [], artifacts: [] },
        'Design': { status: 'pending', tasks: [], artifacts: [] },
        'Development': { status: 'pending', tasks: [], artifacts: [] },
        'Publication': { status: 'pending', tasks: [], artifacts: [] }
      };

      let finalTeam = [student.id];
      let finalLeader = student.id;
      let finalTargetClass = student.className || '';

      if (isTeacher || isAdmin) {
        if (newProject.team.length === 0) {
          throw new Error("Silakan pilih minimal 1 siswa untuk kelompok proyek.");
        }
        if (!newProject.leaderId) {
          throw new Error("Silakan pilih salah satu siswa sebagai Ketua Tim.");
        }
        finalTeam = newProject.team;
        finalLeader = newProject.leaderId;
        
        // Find leader's class as default target class
        const leaderObj = allStudents.find(s => s.id === finalLeader);
        finalTargetClass = newProject.targetClass || leaderObj?.className || '';
      }

      const projectData = {
        title: newProject.title,
        description: newProject.description,
        currentStage: 'Orientation',
        progress: 0,
        status: 'active',
        team: finalTeam,
        leaderId: finalLeader,
        dueDate: serverTimestamp(),
        stages: defaultStages,
        kit: selectedKit,
        targetClass: finalTargetClass,
        memberRoles: {}
      };

      await addDoc(collection(db, 'projects'), projectData);
      
      // Reset state
      setShowModal(false);
      setNewProject({ 
        title: '', 
        description: '', 
        kitId: kits[0]?.id || PROJECT_KITS[0].id,
        targetClass: '',
        team: [],
        leaderId: ''
      });
      setModalClassFilter('All');
      setStudentSearch('');
    } catch (error: any) {
      alert(error.message || "Gagal membuat proyek.");
    } finally {
      setIsCreating(false);
    }
  };

  // Derive unique classes from registered student database
  const studentClasses = Array.from(new Set(allStudents.filter(s => s.role === 'student' && s.className).map(s => s.className as string))).sort();

  // Filter projects shown on screen
  const filteredProjects = projects.filter(p => {
    // 1. Class filter for Teacher Console
    if ((isTeacher || isAdmin) && selectedClassFilter !== 'All') {
      if (p.targetClass !== selectedClassFilter) return false;
    }
    // 2. Search query filter
    if (projectSearch) {
      const q = projectSearch.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Filter students showing up in the Project Creation assignment list
  const filteredStudentsForChecklist = allStudents.filter(s => {
    if (s.role !== 'student') return false;
    if (modalClassFilter !== 'All' && s.className !== modalClassFilter) return false;
    if (studentSearch) {
      const q = studentSearch.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Katalog Proyek PjBL</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            {isTeacher || isAdmin 
              ? 'Kelola, bimbing, dan pantau seluruh kelompok proyek siswa SMK.' 
              : 'Daftar proyek e-learning Anda. Klik proyek untuk mengunggah bukti dan berdiskusi.'}
          </p>
        </div>
        <button 
          onClick={() => {
            // Pre-fill target class for student
            setNewProject(prev => ({
              ...prev,
              targetClass: student?.className || '',
              team: (isTeacher || isAdmin) ? [] : [student?.id || ''],
              leaderId: (isTeacher || isAdmin) ? '' : [student?.id || ''][0]
            }));
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus size={20} />
          {isTeacher || isAdmin ? 'Buat Kelompok Proyek' : 'Mulai Proyek Baru'}
        </button>
      </header>

      {/* Control Panel: Search & Class filters for Teachers */}
      {(isTeacher || isAdmin) && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Class Filter Horizontal List */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2 flex items-center gap-1.5 shrink-0">
              <Filter size={14} />
              Filter Rombel:
            </span>
            <button
              onClick={() => setSelectedClassFilter('All')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedClassFilter === 'All'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-150 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Semua Kelas ({projects.length})
            </button>
            {studentClasses.map(clsName => {
              const count = projects.filter(p => p.targetClass === clsName).length;
              return (
                <button
                  key={clsName}
                  onClick={() => setSelectedClassFilter(clsName)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedClassFilter === clsName
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-150 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {clsName} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              placeholder="Cari judul proyek..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-550/20 text-gray-800"
            />
          </div>
        </div>
      )}

      {/* Project Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
          />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] text-center border border-gray-100 shadow-sm max-w-4xl mx-auto space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto">
            <FolderKanban size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Belum Ada Proyek</h3>
          <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto">
            {isTeacher || isAdmin
              ? 'Tidak ditemukan kelompok proyek pada filter pencarian tersebut.'
              : 'Anda belum terdaftar dalam proyek apa pun. Klik "Mulai Proyek Baru" di atas atau minta Guru Anda mendaftarkan Anda ke tim proyek!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredProjects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectProject(project.id)}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-start md:items-center gap-6 flex-1 min-w-0">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm",
                    (project.status as string) === 'completed' ? "bg-emerald-500" : "bg-indigo-500"
                  )}>
                    <FolderKanban size={26} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{project.title}</h3>
                      {project.targetClass && (
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide">
                          {project.targetClass}
                        </span>
                      )}
                      {(project.status as string) === 'completed' && (
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide">
                          <CheckCircle2 size={10} />
                          SELESAI
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 max-w-3xl">{project.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between xl:justify-end gap-6 sm:gap-10 border-t xl:border-none pt-4 xl:pt-0">
                  <div className="text-left xl:text-right min-w-[100px]">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Tahapan Saat Ini</p>
                    <p className="text-xs sm:text-sm font-black text-indigo-600">
                      {project.currentStage === 'Orientation' ? 'Orientasi' : 
                       project.currentStage === 'Design' ? 'Perencanaan' : 
                       project.currentStage === 'Development' ? 'Produksi' : 
                       project.currentStage === 'Publication' ? 'Publikasi' : project.currentStage}
                    </p>
                  </div>
                  
                  <div className="w-full sm:w-44 shrink-0">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      <span>Progres</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress || 0}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={cn(
                          "h-full rounded-full",
                          (project.status as string) === 'completed' ? "bg-emerald-500" : "bg-indigo-500"
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-1 bg-gray-100 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500">
                      <Users size={14} />
                      <span>{project.team?.length || 0} Siswa</span>
                    </div>
                    <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform text-indigo-500 hidden sm:block" />
                    
                    {/* Only Teachers or Admins can delete projects */}
                    {(isTeacher || isAdmin) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project.id);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Hapus kelompok proyek"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals Section */}
      <AnimatePresence>
        {/* Delete Confirmation Modal */}
        {projectToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Hapus Kelompok Proyek?</h3>
                <p className="text-gray-500 text-sm mt-2">
                  Tindakan ini permanen. Seluruh file dokumentasi, percakapan, dan progres pengerjaan tim akan dihapus sepenuhnya.
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleDeleteProject(projectToDelete)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Project Creation Modal */}
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-650 text-white shrink-0">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black">Inisiasi Proyek PjBL</h3>
                  <p className="text-indigo-100 text-xs sm:text-sm mt-0.5">Bentuk tim kerja dan tentukan tantangan mata pelajaran</p>
                </div>
                <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-2 rounded-xl cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Core Fields */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Skenario Pembelajaran (Project Kit)</label>
                      <select
                        value={newProject.kitId}
                        onChange={(e) => setNewProject({ ...newProject, kitId: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer text-sm font-semibold text-gray-800"
                      >
                        {(kits.length > 0 ? kits : PROJECT_KITS).map(kit => (
                          <option key={kit.id} value={kit.id}>{kit.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Judul Kelompok Proyek</label>
                      <input
                        required
                        type="text"
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                        placeholder="Contoh: DHCP Server Lab Jaringan - Tim A"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Tujuan & Deskripsi Skenario</label>
                      <textarea
                        required
                        rows={4}
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none text-sm leading-relaxed"
                        placeholder="Deskripsikan dengan detail tugas dan ekspektasi hasil dari tim kelompok ini..."
                      />
                    </div>

                    {(isTeacher || isAdmin) && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Rombongan Kelas Penerima</label>
                        <select
                          value={newProject.targetClass}
                          required
                          onChange={(e) => {
                            setNewProject({ ...newProject, targetClass: e.target.value });
                            setModalClassFilter(e.target.value);
                          }}
                          className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold cursor-pointer text-gray-800"
                        >
                          <option value="">-- Pilih Kelas --</option>
                          {studentClasses.map(clsName => (
                            <option key={clsName} value={clsName}>{clsName}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Team Builders (for Teachers & Admins) */}
                  <div className="flex flex-col h-full min-h-[300px]">
                    {!(isTeacher || isAdmin) ? (
                      <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex flex-col justify-between h-full space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-bold text-indigo-900 flex items-center gap-1.5">
                            <BookOpen size={18} />
                            Inisiasi Mandiri Siswa
                          </h4>
                          <p className="text-xs text-indigo-700 leading-relaxed">
                            Sebagai murid, Anda mendirikan proyek ini sebagai Ketua Tim. Setelah proyek terbit, Anda dapat menambahkan anggota kelompok lain secara langsung pada halaman detail proyek!
                          </p>
                        </div>
                        <div className="p-4 bg-white/60 rounded-2xl text-xs font-semibold text-indigo-800">
                          Kelas Terdaftar: <strong className="text-sm text-indigo-950 block">{student?.className || 'Belum diisi'}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col flex-1 border border-gray-150 rounded-3xl overflow-hidden h-full">
                        {/* Selector Filter Block */}
                        <div className="p-4 bg-gray-50 border-b border-gray-150 space-y-3 shrink-0">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Users size={12} />
                            Pilih Anggota Tim ({newProject.team.length} dipilih)
                          </p>
                          
                          <div className="flex gap-2">
                            {/* Class filtration inside checklist */}
                            <select
                              value={modalClassFilter}
                              onChange={(e) => setModalClassFilter(e.target.value)}
                              className="w-32 p-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="All">Semua Siswa</option>
                              {studentClasses.map(clsName => (
                                <option key={clsName} value={clsName}>{clsName}</option>
                              ))}
                            </select>

                            {/* Search checklist */}
                            <div className="relative flex-1">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                              <input
                                type="text"
                                value={studentSearch}
                                onChange={e => setStudentSearch(e.target.value)}
                                placeholder="Cari nama siswa..."
                                className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Checklist Container */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[220px]">
                          {filteredStudentsForChecklist.map(st => {
                            const isChecked = newProject.team.includes(st.id);
                            return (
                              <button
                                type="button"
                                key={st.id}
                                onClick={() => toggleStudentInTeam(st.id)}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                  isChecked 
                                    ? 'border-indigo-500 bg-indigo-50/10' 
                                    : 'border-transparent hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img 
                                    src={st.avatar || `https://picsum.photos/seed/${st.id}/40/40`} 
                                    className="w-8 h-8 rounded-lg object-cover shrink-0" 
                                    alt="Avatar" 
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-extrabold text-gray-800 truncate">{st.name}</p>
                                    <p className="text-[10px] text-gray-450 truncate">{st.email} • {st.className || 'Tanpa Kelas'}</p>
                                  </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 bg-white'
                                }`}>
                                  {isChecked && <UserCheck size={11} />}
                                </div>
                              </button>
                            );
                          })}
                          {filteredStudentsForChecklist.length === 0 && (
                            <div className="text-center py-6 text-gray-400">
                              <p className="text-xs">Siswa tidak ditemukan.</p>
                            </div>
                          )}
                        </div>

                        {/* Choose Leader Block */}
                        {newProject.team.length > 0 && (
                          <div className="p-4 bg-amber-50/50 border-t border-gray-150 space-y-1.5 shrink-0">
                            <label className="text-[10px] font-black text-amber-800 uppercase tracking-widest block flex items-center gap-1">
                              <Award size={12} />
                              Pilih Ketua Tim / Ketua Proyek
                            </label>
                            <select
                              value={newProject.leaderId}
                              required
                              onChange={(e) => setNewProject({ ...newProject, leaderId: e.target.value })}
                              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="">-- Pilih Ketua --</option>
                              {newProject.team.map(memberId => {
                                const matched = allStudents.find(st => st.id === memberId);
                                return (
                                  <option key={memberId} value={memberId}>
                                    {matched?.name || `Siswa ${memberId.slice(-4)}`}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-gray-150 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-150 disabled:opacity-50 cursor-pointer"
                  >
                    {isCreating ? 'Inisiasi...' : 'Terbitkan Kelompok Proyek'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
