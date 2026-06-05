import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderKanban, ChevronRight, Clock, Users, CheckCircle2, X, Plus, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from './FirebaseProvider';
import { Project, ProjectStage, ProjectKit as KitType } from '../types';
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
  const { student, isAdmin } = useFirebase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [kits, setKits] = useState<KitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ 
    title: '', 
    description: '',
    kitId: ''
  });
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!student) return;

    // Fetch Projects
    const q = query(collection(db, 'projects'), where('team', 'array-contains', student.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    // Fetch Kits
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
  }, [student]);

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

      const projectData = {
        title: newProject.title,
        description: newProject.description,
        currentStage: 'Orientation',
        progress: 0,
        status: 'active',
        team: [student.id],
        leaderId: student.id,
        dueDate: serverTimestamp(),
        stages: defaultStages,
        kit: selectedKit
      };

      await addDoc(collection(db, 'projects'), projectData);
      setShowModal(false);
      setNewProject({ title: '', description: '', kitId: kits[0]?.id || PROJECT_KITS[0].id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">PjBL Projects</h2>
          <p className="text-gray-500 mt-1">Manage your digital projects and track your progress.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          <Plus size={20} />
          New Project
        </button>
      </header>

      <AnimatePresence>
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
                <h3 className="text-xl font-bold text-gray-900">Hapus Proyek?</h3>
                <p className="text-gray-500 mt-2">
                  Yakin ingin menghapus proyek ini? Seluruh data progres akan hilang.
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleDeleteProject(projectToDelete)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  {isDeleting ? 'Proses...' : 'Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                <h3 className="text-xl font-bold">Start New Project</h3>
                <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Subject Category (Project Kit)</label>
                  <select
                    value={newProject.kitId}
                    onChange={(e) => setNewProject({ ...newProject, kitId: e.target.value })}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer appearance-none"
                  >
                    {(kits.length > 0 ? kits : PROJECT_KITS).map(kit => (
                      <option key={kit.id} value={kit.id}>{kit.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Project Title</label>
                  <input
                    required
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Enter project name..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Description</label>
                  <textarea
                    rows={3}
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                    placeholder="What is this project about?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
          />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6">
            <FolderKanban size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No projects found</h3>
          <p className="text-gray-500 mt-2">You haven't been assigned to any projects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelectProject(project.id)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center text-white",
                    (project.status as string) === 'completed' ? "bg-emerald-500" : "bg-indigo-500"
                  )}>
                    <FolderKanban size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                      {(project.status as string) === 'completed' && (
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1 max-w-2xl">{project.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Stage</p>
                    <p className="text-sm font-bold text-indigo-600">{project.currentStage}</p>
                  </div>
                  <div className="w-48">
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress || 0}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={cn(
                          "h-full rounded-full",
                          (project.status as string) === 'completed' ? "bg-emerald-500" : "bg-indigo-500"
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Users size={18} />
                      {project.team.length}
                    </div>
                    {project.dueDate && (
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Clock size={18} />
                        {typeof project.dueDate.toDate === 'function' ? project.dueDate.toDate().toLocaleDateString() : 'No date'}
                      </div>
                    )}
                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project.id);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                        title="Delete Project"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

