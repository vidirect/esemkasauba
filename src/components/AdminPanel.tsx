import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  ArrowLeftRight,
  Plus, 
  Trash2, 
  Layout, 
  FileBox, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  X,
  ListRestart,
  PlusCircle,
  MinusCircle,
  ShieldCheck,
  Users,
  Search,
  UserPlus,
  Award,
  ExternalLink,
  Mail,
  Phone,
  MessageSquare,
  Pencil,
  Sparkles
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  addDoc, 
  writeBatch,
  updateDoc,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from './FirebaseProvider';
import { Project, ProjectKit, Student, AllowedUser, Certificate, WeeklyChallenge } from '../types';
import { PROJECT_KITS } from '../constants/kits';

interface AdminPanelProps {
  activeSubTab?: 'projects' | 'kits' | 'students' | 'acl' | 'challenges';
  setActiveSubTab?: (tab: 'projects' | 'kits' | 'students' | 'acl' | 'challenges') => void;
}

export default function AdminPanel({ activeSubTab: externalActiveSubTab, setActiveSubTab: externalSetActiveSubTab }: AdminPanelProps = {}) {
  const { student: currentUser, isAdmin, isTeacher } = useFirebase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [kits, setKits] = useState<ProjectKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [localActiveSubTab, setLocalActiveSubTab] = useState<'projects' | 'kits' | 'students' | 'acl' | 'challenges'>('projects');
  const activeSubTab = externalActiveSubTab || localActiveSubTab;
  const setActiveSubTab = (externalSetActiveSubTab as any) || setLocalActiveSubTab;
  const [roleFilter, setRoleFilter] = useState<'student' | 'teacher' | 'admin'>('student');
  const [adminClassFilter, setAdminClassFilter] = useState('All');
  const [students, setStudents] = useState<Student[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [showKitModal, setShowKitModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'project' | 'kit' | 'seed' | 'allowed' | 'student' | 'challenge' } | null>(null);

  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<WeeklyChallenge | null>(null);
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    type: 'networking' as WeeklyChallenge['type'],
    source: 'new' as WeeklyChallenge['source'],
    difficulty: 'Sedang' as WeeklyChallenge['difficulty'],
    status: 'active' as WeeklyChallenge['status']
  });

  const [showCertModal, setShowCertModal] = useState(false);
  const [certForm, setCertForm] = useState({ 
    recipientId: '', 
    recipientName: '',
    title: '', 
    skills: '', 
    url: '' 
  });

  const [newAllowed, setNewAllowed] = useState({ email: '', role: 'student' as const });

  // Move class modal state
  const [showMoveClassModal, setShowMoveClassModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [moveClassForm, setMoveClassForm] = useState({
    gradeLevel: 'X' as 'X' | 'XI' | 'XII',
    major: 'TJKT',
    customMajor: '',
    classNumber: '1'
  });

  // Edit teacher modal state
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Student | null>(null);
  const [editTeacherForm, setEditTeacherForm] = useState({
    teacherPosition: '',
    customTeacherPosition: '',
    teacherSubject: ''
  });

  const adminClasses = Array.from(new Set(students.filter(s => (s.role || 'student') === 'student' && s.className).map(s => s.className as string))).sort();

  // Form for new Kit
  const [newKit, setNewKit] = useState<ProjectKit>({
    title: '',
    description: '',
    workflow: [''],
    rubric: [''],
    examples: [],
    references: []
  });

  useEffect(() => {
    if (!isAdmin && !isTeacher) return;

    const unsubProjects = onSnapshot(query(collection(db, 'projects')), (snapshot) => {
      setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

    const unsubKits = onSnapshot(query(collection(db, 'kits')), (snapshot) => {
      setKits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectKit)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'kits'));

    const unsubStudents = onSnapshot(query(collection(db, 'students')), (snapshot) => {
      setStudents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'students'));

    const unsubAllowed = onSnapshot(query(collection(db, 'allowed_users')), (snapshot) => {
      setAllowedUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AllowedUser)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'allowed_users'));

    const unsubChallenges = onSnapshot(query(collection(db, 'weekly_challenges')), (snapshot) => {
      setChallenges(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyChallenge)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'weekly_challenges'));

    return () => {
      unsubProjects();
      unsubKits();
      unsubStudents();
      unsubAllowed();
      unsubChallenges();
    };
  }, [isAdmin, isTeacher]);

  const handleDeleteProject = async (id: string) => {
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, 'projects', id));
      setConfirmDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${id}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeForm.title || !challengeForm.description) return;

    setActionLoading('save_challenge');
    try {
      if (editingChallenge) {
        const docRef = doc(db, 'weekly_challenges', editingChallenge.id);
        await updateDoc(docRef, {
          title: challengeForm.title,
          description: challengeForm.description,
          type: challengeForm.type,
          source: challengeForm.source,
          difficulty: challengeForm.difficulty,
          status: challengeForm.status
        });
      } else {
        await addDoc(collection(db, 'weekly_challenges'), {
          title: challengeForm.title,
          description: challengeForm.description,
          type: challengeForm.type,
          source: challengeForm.source,
          difficulty: challengeForm.difficulty,
          status: challengeForm.status,
          creatorId: currentUser?.id || 'system-teacher',
          creatorName: currentUser?.name || 'Guru SMKN 1',
          createdAt: serverTimestamp()
        });
      }
      setShowChallengeModal(false);
      setEditingChallenge(null);
      setChallengeForm({
        title: '',
        description: '',
        type: 'networking',
        source: 'new',
        difficulty: 'Sedang',
        status: 'active'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'weekly_challenges');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, 'weekly_challenges', id));
      setConfirmDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `weekly_challenges/${id}`);
    } finally {
      setActionLoading(null);
    }
  };

  const seedDefaultChallenges = async () => {
    setActionLoading('seed_challenges');
    try {
      const defaults: Omit<WeeklyChallenge, 'id'>[] = [
        {
          title: 'Perancangan Topologi Jaringan Client-Server',
          description: 'Rancanglah diagram topologi star menggunakan 1 Router, 2 Switch, dan 4 PC pada Lembar Perencanaan kelompok Anda, lalu simulasikan pembagian IP Kelas C dinamis.',
          type: 'networking',
          source: 'new',
          difficulty: 'Sedang',
          status: 'active',
          creatorId: currentUser?.id || 'system',
          creatorName: currentUser?.name || 'Sistem Guru',
          createdAt: new Date()
        },
        {
          title: 'Routing Statis Multi-LAN MikroTik RouterOS',
          description: 'Konfigurasi IP rute statis agar jaringan PC kelompok A dapat berkomunikasi dengan lancar ke server kelompok B. Tulis dokumentasi rute jaringannya.',
          type: 'networking',
          source: 'completed_project',
          difficulty: 'Tantang',
          status: 'active',
          creatorId: currentUser?.id || 'system',
          creatorName: currentUser?.name || 'Sistem Guru',
          createdAt: new Date()
        },
        {
          title: 'Pemasangan & Pengurutan Kabel UTP RJ-45',
          description: 'Lakukan instalasi perkabelan fisik tipe cross-over untuk menghubungkan dua switch manageable di laboratorium komputer PjBL kelas Anda.',
          type: 'networking',
          source: 'new',
          difficulty: 'Mudah',
          status: 'active',
          creatorId: currentUser?.id || 'system',
          creatorName: currentUser?.name || 'Sistem Guru',
          createdAt: new Date()
        },
        {
          title: 'Layanan Virtual Directory & Akses Server FTP',
          description: 'Bangun hosting server FTP internal menggunakan Linux Server virtual untuk menyimpan portofolio proyek-proyek digital secara kelompok.',
          type: 'servers',
          source: 'completed_project',
          difficulty: 'Tantang',
          status: 'active',
          creatorId: currentUser?.id || 'system',
          creatorName: currentUser?.name || 'Sistem Guru',
          createdAt: new Date()
        },
        {
          title: 'Konfigurasi DHCP Server untuk IP Dinamis',
          description: 'Aktifkan service DHCP Server pada Router Cisco untuk memberikan konfigurasi otomatis IP, Gateway, dan DNS kepada klien di ruangan laboratorium TJKT.',
          type: 'servers',
          source: 'new',
          difficulty: 'Sedang',
          status: 'active',
          creatorId: currentUser?.id || 'system',
          creatorName: currentUser?.name || 'Sistem Guru',
          createdAt: new Date()
        }
      ];

      for (const d of defaults) {
        await addDoc(collection(db, 'weekly_challenges'), {
          ...d,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Error seeding challenges:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteKit = async (id: string) => {
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, 'kits', id));
      setConfirmDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `kits/${id}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSeedKits = async () => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      for (const kit of PROJECT_KITS) {
        if (!kits.find(k => k.title === kit.title)) {
          const newDocRef = doc(collection(db, 'kits'));
          const { id, ...kitData } = kit; // Remove local id if any
          batch.set(newDocRef, kitData);
        }
      }
      await batch.commit();
      setConfirmDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'kits');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateKit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create-kit');
    try {
      const { id, ...kitToSave } = {
        ...newKit,
        workflow: newKit.workflow.filter(w => w.trim() !== ''),
        rubric: newKit.rubric.filter(r => r.trim() !== ''),
      };
      if (id) {
        await updateDoc(doc(db, 'kits', id), kitToSave);
      } else {
        await addDoc(collection(db, 'kits'), kitToSave);
      }
      setShowKitModal(false);
      setNewKit({ title: '', description: '', workflow: [''], rubric: [''], examples: [], references: [] });
    } catch (err: any) {
      handleFirestoreError(err, newKit.id ? OperationType.UPDATE : OperationType.CREATE, newKit.id ? `kits/${newKit.id}` : 'kits');
    } finally {
      setActionLoading(null);
    }
  };

  const addField = (field: 'workflow' | 'rubric') => {
    setNewKit(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeField = (field: 'workflow' | 'rubric', index: number) => {
    setNewKit(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const updateField = (field: 'workflow' | 'rubric', index: number, value: string) => {
    const newList = [...newKit[field]];
    newList[index] = value;
    setNewKit(prev => ({ ...prev, [field]: newList }));
  };

  const handleAddAllowed = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('add-allowed');
    try {
      await addDoc(collection(db, 'allowed_users'), {
        ...newAllowed,
        addedAt: serverTimestamp()
      });
      setNewAllowed({ email: '', role: 'student' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'allowed_users');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAllowed = async (id: string) => {
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, 'allowed_users', id));
      setConfirmDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `allowed_users/${id}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: Student['role']) => {
    setActionLoading(userId);
    try {
      await updateDoc(doc(db, 'students', userId), { role: newRole });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${userId}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setActionLoading('moving-class');
    try {
      const finalMajor = moveClassForm.major === 'other' ? moveClassForm.customMajor : moveClassForm.major;
      if (!finalMajor || finalMajor.trim() === '') {
        throw new Error('Silakan isi nama jurusan.');
      }
      const newGradeLevel = moveClassForm.gradeLevel;
      const newMajor = finalMajor.toUpperCase().trim();
      const newClassNumber = moveClassForm.classNumber;
      const newClassName = `${newGradeLevel} ${newMajor} ${newClassNumber}`;

      await updateDoc(doc(db, 'students', selectedStudent.id), {
        gradeLevel: newGradeLevel,
        major: newMajor,
        classNumber: newClassNumber,
        className: newClassName
      });
      setShowMoveClassModal(false);
      setSelectedStudent(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${selectedStudent.id}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setActionLoading('edit-teacher');
    try {
      const finalPosition = editTeacherForm.teacherPosition === 'other' ? editTeacherForm.customTeacherPosition : editTeacherForm.teacherPosition;
      if (!finalPosition || finalPosition.trim() === '') {
        throw new Error('Silakan isi jabatan guru.');
      }
      await updateDoc(doc(db, 'students', selectedTeacher.id), {
        teacherPosition: finalPosition.trim(),
        teacherSubject: editTeacherForm.teacherSubject.trim() || 'Teknologi Informasi'
      });
      setShowEditTeacherModal(false);
      setSelectedTeacher(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${selectedTeacher.id}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, 'students', id));
      setConfirmDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setActionLoading('issuing-cert');
    try {
      const certData = {
        title: certForm.title,
        recipientId: certForm.recipientId,
        issuerId: currentUser.id,
        issuerName: currentUser.name,
        issuedAt: serverTimestamp(),
        skills: certForm.skills.split(',').map(s => s.trim()),
        url: certForm.url
      };

      const certRef = await addDoc(collection(db, 'certificates'), certData);
      
      // Update Student's certificate list
      await updateDoc(doc(db, 'students', certForm.recipientId), {
        certificates: arrayUnion({ id: certRef.id, ...certData, issuedAt: new Date() })
      });

      setShowCertModal(false);
      setCertForm({ recipientId: '', recipientName: '', title: '', skills: '', url: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'certificates');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin && !isTeacher) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 text-center max-w-md">
          This area is restricted to administrators and teachers only. Please contact your system administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
            {isAdmin ? 'Admin Center' : 'Teacher Console'}
          </h2>
          <p className="text-gray-500 mt-2 text-lg">
            {isAdmin ? 'Pusat kendali admin untuk pengelolaan sistem penuh.' : 'Panel pengawasan guru untuk bimbingan proyek dan penilaian.'}
          </p>
        </div>
        {(isAdmin || isTeacher) && (
          <div className="flex gap-4">
            {activeSubTab === 'challenges' && (
              <button 
                onClick={() => {
                  setEditingChallenge(null);
                  setChallengeForm({
                    title: '',
                    description: '',
                    type: 'networking',
                    source: 'new',
                    difficulty: 'Sedang',
                    status: 'active'
                  });
                  setShowChallengeModal(true);
                }}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 cursor-pointer"
              >
                <Plus size={20} />
                Buat Tantangan Baru
              </button>
            )}
            {isAdmin && activeSubTab !== 'challenges' && (
              <>
                <button 
                  onClick={() => setConfirmDelete({ id: 'seed', type: 'seed' })}
                  disabled={isSeeding}
                  className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <ListRestart size={20} />
                  {isSeeding ? 'Memuat...' : 'Muat Template Bawaan'}
                </button>
                <button 
                  onClick={() => setShowKitModal(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                >
                  <Plus size={20} />
                  Tambah Kit Baru
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <div className="flex gap-2 p-1 bg-gray-200/50 w-fit rounded-2xl">
        <button 
          onClick={() => setActiveSubTab('projects')}
          className={`px-8 py-3 rounded-xl font-bold transition-all ${activeSubTab === 'projects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Semua Proyek
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveSubTab('kits')}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${activeSubTab === 'kits' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Manajemen Kit
          </button>
        )}
        <button 
          onClick={() => setActiveSubTab('students')}
          className={`px-8 py-3 rounded-xl font-bold transition-all ${activeSubTab === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users size={18} className="inline mr-2" />
          Daftar Siswa
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveSubTab('acl')}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${activeSubTab === 'acl' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ShieldCheck size={18} className="inline mr-2" />
            Whitelist Email
          </button>
        )}
        <button 
          onClick={() => setActiveSubTab('challenges')}
          className={`px-8 py-3 rounded-xl font-bold transition-all ${activeSubTab === 'challenges' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Sparkles size={18} className="inline mr-2 text-amber-500 animate-pulse" />
          Tantangan Mingguan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeSubTab === 'acl' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  value={newAllowed.email}
                  onChange={e => setNewAllowed({...newAllowed, email: e.target.value.toLowerCase()})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-2 w-full md:w-48">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Role</label>
                <select 
                  value={newAllowed.role}
                  onChange={e => setNewAllowed({...newAllowed, role: e.target.value as any})}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button 
                onClick={handleAddAllowed}
                disabled={!newAllowed.email || actionLoading === 'add-allowed'}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                <UserPlus size={20} />
                Add to List
              </button>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">Pre-approved Users ({allowedUsers.length})</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {allowedUsers.map(acl => (
                  <div key={acl.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{acl.email}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                          acl.role === 'admin' ? 'bg-red-100 text-red-600' : 
                          acl.role === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {acl.role}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setConfirmDelete({ id: acl.id!, type: 'allowed' })}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                {allowedUsers.length === 0 && (
                  <div className="p-20 text-center text-gray-400">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={40} className="opacity-20" />
                    </div>
                    <p>No pre-approved users yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'students' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Direktori Pengguna Terdaftar</h3>
                  <p className="text-xs text-gray-500 mt-1">Daftar pengguna dengan otorisasi akses platform</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                  {roleFilter === 'student' && adminClasses.length > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Filter Kelas:</span>
                      <select
                        value={adminClassFilter}
                        onChange={e => setAdminClassFilter(e.target.value)}
                        className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 border-none rounded-xl text-xs font-bold outline-none cursor-pointer text-gray-700 w-full sm:w-36 focus:ring-2 focus:ring-indigo-500/10"
                      >
                        <option value="All">Semua Kelas</option>
                        {adminClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Filter Peran - Daftar Terpisah */}
                  <div className="w-full sm:w-auto md:min-w-[320px]">
                    <div className="grid grid-cols-3 bg-gray-200/60 p-0.5 sm:p-1 rounded-2xl border border-gray-200 gap-0.5 sm:gap-1">
                      {(['student', 'teacher', 'admin'] as const).map(role => (
                        <button
                          key={role}
                          onClick={() => {
                            setRoleFilter(role);
                            setAdminClassFilter('All'); // Reset class filter when changing roles
                          }}
                          className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all capitalize whitespace-nowrap truncate text-center cursor-pointer ${
                            roleFilter === role 
                              ? 'bg-white text-indigo-700 shadow-sm font-black' 
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {role === 'student' ? 'Siswa' : role === 'teacher' ? 'Guru' : 'Admin'} 
                          <span className="ml-0.5 text-[9px] opacity-75 font-semibold">
                            ({students.filter(x => (x.role || 'student') === role).length})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {students
                  .filter(s => (s.role || 'student') === roleFilter)
                  .filter(s => {
                    if (roleFilter !== 'student' || adminClassFilter === 'All') return true;
                    return s.className === adminClassFilter;
                  })
                  .map(s => {
                    const avgComp = Math.round(Object.values(s.competence || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) / 6);
                    return (
                      <div key={s.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between hover:bg-gray-50 transition-colors gap-6">
                    <div className="flex items-start gap-5 flex-1 min-w-0">
                      <img src={s.avatar} alt={s.name} className="w-12 h-12 rounded-2xl object-cover shrink-0" referrerPolicy="no-referrer" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 truncate text-base">{s.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest shrink-0 ${
                            s.role === 'admin' ? 'bg-red-100 text-red-600' : 
                            s.role === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {s.role || 'student'}
                          </span>
                          {(s.role === 'student' || !s.role) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 tracking-wide shrink-0 border border-indigo-100/50">
                              Kelas: {s.className || 'Belum Diatur'}
                            </span>
                          )}
                          {s.role === 'teacher' && (
                            <>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 tracking-wide shrink-0 border border-blue-100/50">
                                Jabatan: {s.teacherPosition || 'Guru Mata Pelajaran'}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 tracking-wide shrink-0 border border-emerald-100/50">
                                Mapel: {s.teacherSubject || 'Teknologi Informasi'}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{s.email}</p>
                        {s.bio && <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2 max-w-xl italic">"{s.bio}"</p>}
                        
                        {/* Kontak Pribadi & Media Sosial */}
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <a 
                            href={`mailto:${s.email}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors rounded-lg text-[11px] text-gray-500 font-medium"
                          >
                            <Mail size={12} />
                            Email
                          </a>
                          {s.whatsapp && (
                            <a 
                              href={`https://wa.me/${s.whatsapp}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors rounded-lg text-[11px] font-medium"
                            >
                              <Phone size={12} />
                              WhatsApp
                            </a>
                          )}
                          {s.instagram && (
                            <a 
                              href={`https://instagram.com/${s.instagram}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-600 transition-colors rounded-lg text-[11px] font-medium"
                            >
                              <span>@</span>
                              Instagram
                            </a>
                          )}
                          {s.phone && (
                            <a 
                              href={`tel:${s.phone}`} 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors rounded-lg text-[11px] font-medium"
                            >
                              <Phone size={12} />
                              Telepon
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8 justify-between lg:justify-end shrink-0">
                      {roleFilter === 'student' && (
                        <div className="flex items-center gap-8 hidden lg:flex">
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg. Comp</p>
                            <p className={`text-lg font-bold ${avgComp > 70 ? 'text-emerald-600' : 'text-indigo-600'}`}>{avgComp}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Projects</p>
                            <p className="text-lg font-bold text-gray-900">{s.projects?.length || 0}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <div className="flex bg-gray-100 p-1 rounded-xl">
                            {(['student', 'teacher', 'admin'] as const).map(r => (
                              <button
                                key={r}
                                disabled={actionLoading === s.id}
                                onClick={() => handleUpdateRole(s.id, r)}
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                                  s.role === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                {r === 'student' ? 'Siswa' : r === 'teacher' ? 'Guru' : 'Admin'}
                              </button>
                            ))}
                          </div>
                        )}
                        {roleFilter === 'student' && (
                          <button 
                            onClick={() => {
                              setCertForm({ ...certForm, recipientId: s.id, recipientName: s.name });
                              setShowCertModal(true);
                            }}
                            className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Award Certificate"
                          >
                            <Award size={18} />
                          </button>
                        )}
                        {(isAdmin || isTeacher) && (roleFilter === 'student' || s.role === 'student' || !s.role) && (
                          <button 
                            onClick={() => {
                              setSelectedStudent(s);
                              const currentGrade = s.gradeLevel || 'X';
                              const currentMajor = s.major || 'TJKT';
                              const currentClassNumber = s.classNumber || '1';
                              setMoveClassForm({
                                gradeLevel: currentGrade,
                                major: ['TJKT', 'RPL', 'DKV', 'AKL', 'MP', 'TITL', 'TP'].includes(currentMajor) ? currentMajor : 'other',
                                customMajor: ['TJKT', 'RPL', 'DKV', 'AKL', 'MP', 'TITL', 'TP'].includes(currentMajor) ? '' : currentMajor,
                                classNumber: currentClassNumber
                              });
                              setShowMoveClassModal(true);
                            }}
                            className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Pindahkan Kelas"
                          >
                            <ArrowLeftRight size={18} />
                          </button>
                        )}
                        {isAdmin && s.role === 'teacher' && (
                          <button 
                            onClick={() => {
                              setSelectedTeacher(s);
                              const pos = s.teacherPosition || 'Guru Mata Pelajaran';
                              const isPreset = ['Guru Mata Pelajaran', 'Guru Produktif TJKT / RPL / IT', 'Wali Kelas', 'Kepala Program Keahlian (Kaprog)', 'Wakil Kepala Sekolah (Waka)', 'Guru BK / Konselor', 'Kepala Sekolah'].includes(pos);
                              setEditTeacherForm({
                                teacherPosition: isPreset ? pos : 'other',
                                customTeacherPosition: isPreset ? '' : pos,
                                teacherSubject: s.teacherSubject || 'Teknologi Informasi'
                              });
                              setShowEditTeacherModal(true);
                            }}
                            className="p-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Atur Jabatan & Mapel Guru"
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={() => setConfirmDelete({ id: s.id, type: 'student' })}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {students.filter(s => (s.role || 'student') === roleFilter).length === 0 && (
                <div className="p-20 text-center text-gray-400">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={40} className="opacity-20 text-gray-400" />
                  </div>
                  <p>Tidak ada pengguna dengan peran ini.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'projects' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Total Projects ({projects.length})</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {projects.map(project => (
                <div key={project.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                      <Layout size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{project.title}</h4>
                      <p className="text-sm text-gray-500">Stage: {project.currentStage} • Status: {project.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Progress</p>
                      <p className="text-lg font-bold text-indigo-600">{project.progress}%</p>
                    </div>
                    <button 
                      onClick={() => setConfirmDelete({ id: project.id, type: 'project' })}
                      disabled={!!actionLoading}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                      title="Hapus Proyek"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="p-20 text-center text-gray-400">
                  <FileBox size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No projects found in the system.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'challenges' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-550/5 via-purple-550/5 to-pink-550/5 p-8 rounded-[40px] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles size={24} className="text-indigo-600 animate-bounce" />
                  Kolam Tantangan Guru ({challenges.length})
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Semua tugas mingguan dan tantangan diacak secara berkala untuk siswa Anda. Guru dapat membuat tugas baru maupun mengambil tugas berkualitas dari alumni proyek terdahulu!
                </p>
              </div>
              {challenges.length === 0 && (
                <button
                  type="button"
                  onClick={seedDefaultChallenges}
                  disabled={actionLoading === 'seed_challenges'}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 text-sm whitespace-nowrap cursor-pointer"
                >
                  <Sparkles size={18} />
                  Kocok & Muat 5 Contoh Tantangan
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {challenges.map(challenge => (
                <div key={challenge.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500" />
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${
                        challenge.source === 'completed_project' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {challenge.source === 'completed_project' ? 'Portofolio Proyek Selesai' : 'Tugas Baru Guru'}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${
                        challenge.difficulty === 'Tantang' 
                          ? 'bg-red-100 text-red-700' 
                          : challenge.difficulty === 'Sedang' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {challenge.difficulty || 'Sedang'}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                        {challenge.type}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                        {challenge.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {challenge.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {challenge.creatorName?.charAt(0).toUpperCase()}
                      </div>
                      <p>{challenge.creatorName}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChallenge(challenge);
                          setChallengeForm({
                            title: challenge.title,
                            description: challenge.description,
                            type: challenge.type,
                            source: challenge.source,
                            difficulty: challenge.difficulty || 'Sedang',
                            status: challenge.status
                          });
                          setShowChallengeModal(true);
                        }}
                        className="p-2 hover:bg-gray-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit Tantangan"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ id: challenge.id, type: 'challenge' })}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Tantangan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {challenges.length === 0 && (
                <div className="col-span-2 bg-white rounded-[40px] p-20 text-center text-gray-400 border border-gray-100">
                  <Sparkles size={48} className="mx-auto mb-4 opacity-20 text-indigo-500" />
                  <p className="text-base text-gray-500">Belum ada tantangan mingguan di kolam.</p>
                  <p className="text-xs text-gray-400 mt-1">Buat tantangan baru atau muat contoh template bawaan di atas!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'kits' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">System Kits ({kits.length})</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {kits.map(kit => (
                <div key={kit.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <FileBox size={24} />
                    </div>
                    <div className="max-w-xl">
                      <h4 className="font-bold text-gray-900">{kit.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-1">{kit.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => {
                        setNewKit({
                          id: kit.id,
                          title: kit.title,
                          description: kit.description,
                          workflow: kit.workflow && kit.workflow.length > 0 ? kit.workflow : [''],
                          rubric: kit.rubric && kit.rubric.length > 0 ? kit.rubric : [''],
                          examples: kit.examples || [],
                          references: kit.references || []
                        });
                        setShowKitModal(true);
                      }}
                      className="p-3 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors"
                      title="Ubah Kit Mata Pelajaran"
                    >
                      <Pencil size={20} />
                    </button>
                    <button 
                      onClick={() => setConfirmDelete({ id: kit.id!, type: 'kit' })}
                      disabled={!!actionLoading}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                      title="Hapus Kit"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {kits.length === 0 && (
                <div className="p-20 text-center text-gray-400">
                  <Database size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No project kits found. Use "Seed Default Kits" to populate.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCertModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Issue Certification Award</h3>
                <button onClick={() => setShowCertModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl text-xs text-emerald-700 leading-relaxed">
                <strong>Panduan:</strong> Masukkan file sertifikat (PDF/Gambar) ke <strong>Google Drive</strong> murid atau Drive sekolah, lalu tempel linknya di bawah ini agar murid dapat menyimpannya.
              </div>
              <p className="text-sm text-gray-500">Penerima: <span className="font-bold text-indigo-600">{certForm.recipientName}</span></p>
              
              <form onSubmit={handleIssueCertificate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Judul Sertifikat</label>
                  <input 
                    required
                    value={certForm.title}
                    onChange={e => setCertForm({...certForm, title: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none"
                    placeholder="Contoh: Juara 1 Inovasi Teknologi 2024"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Skill yang Diakui (Pisahkan koma)</label>
                  <input 
                    required
                    value={certForm.skills}
                    onChange={e => setCertForm({...certForm, skills: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none"
                    placeholder="Contoh: Coding, Problem Solving, Leadership"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Link File Sertifikat (Google Drive)</label>
                  <input 
                    type="url"
                    value={certForm.url}
                    onChange={e => setCertForm({...certForm, url: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none placeholder:text-gray-300"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <button 
                  disabled={actionLoading === 'issuing-cert'}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
                >
                  {actionLoading === 'issuing-cert' ? 'Mengirim...' : 'Berikan Sertifikat'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showMoveClassModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Pindahkan Kelas Siswa</h3>
                <button onClick={() => { setShowMoveClassModal(false); setSelectedStudent(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl text-xs text-indigo-700 leading-relaxed">
                <strong>Informasi:</strong> Pindahkan siswa ini dari kelas awal ke kelas tujuan untuk meningkatkan keakuratan rincian data pembelajaran berbasis proyek kelompok.
              </div>
              
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-1">
                <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Nama Siswa</p>
                <p className="text-sm font-bold text-gray-900">{selectedStudent.name}</p>
                <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-100 mt-2">
                  <span>Kelas Awal:</span>
                  <span className="font-bold text-pink-600">{selectedStudent.className || 'Belum Diatur'}</span>
                </div>
              </div>

              <form onSubmit={handleMoveClass} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Tingkatan Kelas</label>
                  <select 
                    required
                    value={moveClassForm.gradeLevel}
                    onChange={e => setMoveClassForm({...moveClassForm, gradeLevel: e.target.value as 'X' | 'XI' | 'XII'})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none text-sm font-semibold"
                  >
                    <option value="X">Kelas X (Sepuluh)</option>
                    <option value="XI">Kelas XI (Sebelas)</option>
                    <option value="XII">Kelas XII (Dua Belas)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Jurusan Kejuruan</label>
                  <select 
                    required
                    value={moveClassForm.major}
                    onChange={e => setMoveClassForm({...moveClassForm, major: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none text-sm font-semibold"
                  >
                    <option value="TJKT">TJKT - Teknik Jaringan Komputer & Telekomunikasi</option>
                    <option value="RPL">RPL - Rekayasa Perangkat Lunak</option>
                    <option value="DKV">DKV - Desain Komunikasi Visual</option>
                    <option value="AKL">AKL - Akuntansi & Keuangan Lembaga</option>
                    <option value="MP">MP - Manajemen Perkantoran</option>
                    <option value="TITL">TITL - Teknik Instalasi Tenaga Listrik</option>
                    <option value="TP">TP - Teknik Pemesinan</option>
                    <option value="other">Jurusan Lainnya (Ketik Manual)...</option>
                  </select>
                </div>

                {moveClassForm.major === 'other' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Nama Jurusan (Singkatan)</label>
                    <input 
                      required
                      value={moveClassForm.customMajor}
                      onChange={e => setMoveClassForm({...moveClassForm, customMajor: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none text-sm placeholder:text-gray-300 uppercase"
                      placeholder="Contoh: TO (Teknik Otomotif)"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Nomor Rombel Kelas</label>
                  <input 
                    required
                    value={moveClassForm.classNumber}
                    onChange={e => setMoveClassForm({...moveClassForm, classNumber: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none text-sm"
                    placeholder="Contoh: 1, 2, atau A, B"
                  />
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex justify-between items-center text-xs">
                  <span className="text-amber-800 font-medium font-sans">Pratinjau Kelas Baru:</span>
                  <span className="bg-amber-100 text-amber-950 font-black px-3 py-1 rounded-xl text-xs uppercase tracking-wide">
                    {moveClassForm.gradeLevel} {moveClassForm.major === 'other' ? (moveClassForm.customMajor || '?') : moveClassForm.major} {moveClassForm.classNumber}
                  </span>
                </div>

                <button 
                  disabled={actionLoading === 'moving-class'}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {actionLoading === 'moving-class' ? 'Menyimpan...' : 'Simpan Perubahan & Pindahkan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showEditTeacherModal && selectedTeacher && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Atur Jabatan & Mapel Guru</h3>
                <button onClick={() => { setShowEditTeacherModal(false); setSelectedTeacher(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl text-xs text-indigo-700 leading-relaxed">
                <strong>Informasi:</strong> Perubahan ini hanya akan mengubah data jabatan struktural dan spesialisasi pelajaran guru, bukan mengubah atau menghapus akun pengguna guru tersebut.
              </div>
              
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-1">
                <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Nama Guru</p>
                <p className="text-sm font-bold text-gray-900">{selectedTeacher.name}</p>
                <p className="text-xs text-gray-400 truncate">{selectedTeacher.email}</p>
              </div>

              <form onSubmit={handleEditTeacher} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Jabatan Guru</label>
                  <select 
                    required
                    value={editTeacherForm.teacherPosition}
                    onChange={e => setEditTeacherForm({...editTeacherForm, teacherPosition: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none text-sm font-semibold"
                  >
                    <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
                    <option value="Guru Produktif TJKT / RPL / IT">Guru Produktif TJKT / RPL / IT</option>
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Kepala Program Keahlian (Kaprog)">Kepala Program Keahlian (Kaprog)</option>
                    <option value="Wakil Kepala Sekolah (Waka)">Wakil Kepala Sekolah (Waka)</option>
                    <option value="Guru BK / Konselor">Guru BK / Konselor</option>
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                    <option value="other">Jabatan Lainnya (Ketik Manual)...</option>
                  </select>
                </div>

                {editTeacherForm.teacherPosition === 'other' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Tulis Jabatan Baru</label>
                    <input 
                      required
                      value={editTeacherForm.customTeacherPosition}
                      onChange={e => setEditTeacherForm({...editTeacherForm, customTeacherPosition: e.target.value})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none text-sm placeholder:text-gray-300"
                      placeholder="Contoh: Kepala Tata Usaha, Ketua Komite"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 tracking-widest uppercase">Mata Pelajaran Guru</label>
                  <input 
                    required
                    value={editTeacherForm.teacherSubject}
                    onChange={e => setEditTeacherForm({...editTeacherForm, teacherSubject: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none text-sm"
                    placeholder="Contoh: Bahasa Indonesia, Olahraga, Matematika"
                  />
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-1.5 text-xs text-emerald-800">
                  <div className="flex justify-between">
                    <span>Pratinjau Jabatan:</span>
                    <strong className="uppercase">{editTeacherForm.teacherPosition === 'other' ? editTeacherForm.customTeacherPosition : editTeacherForm.teacherPosition}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pratinjau Mapel:</span>
                    <strong className="uppercase">{editTeacherForm.teacherSubject || 'Belum Diisi'}</strong>
                  </div>
                </div>

                <button 
                  disabled={actionLoading === 'edit-teacher'}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {actionLoading === 'edit-teacher' ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {confirmDelete && (
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
                <h3 className="text-xl font-bold text-gray-900">Konfirmasi Tindakan</h3>
                <p className="text-gray-500 mt-2">
                  {confirmDelete.type === 'project' ? 'Yakin ingin menghapus proyek ini? Tindakan ini tidak dapat dibatalkan.' 
                    : confirmDelete.type === 'seed' ? 'Muat semua template bawaan sekarang?' 
                    : confirmDelete.type === 'allowed' ? 'Hapus email ini dari daftar pra-persetujuan?'
                    : confirmDelete.type === 'student' ? 'Hapus akun pengguna ini secara permanen?'
                    : confirmDelete.type === 'challenge' ? 'Yakin ingin menghapus tantangan ini dari kolam?'
                    : 'Hapus template kit ini?'}
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    if (confirmDelete.type === 'project') handleDeleteProject(confirmDelete.id);
                    else if (confirmDelete.type === 'kit') handleDeleteKit(confirmDelete.id);
                    else if (confirmDelete.type === 'seed') handleSeedKits();
                    else if (confirmDelete.type === 'allowed') handleDeleteAllowed(confirmDelete.id);
                    else if (confirmDelete.type === 'student') handleDeleteStudent(confirmDelete.id);
                    else if (confirmDelete.type === 'challenge') handleDeleteChallenge(confirmDelete.id);
                  }}
                  disabled={!!actionLoading || isSeeding}
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  {actionLoading || isSeeding ? 'Proses...' : 'Ya, Lanjut'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showChallengeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                <h3 className="text-xl font-bold">
                  {editingChallenge ? 'Edit Tantangan Mingguan' : 'Buat Tantangan Baru'}
                </h3>
                <button type="button" onClick={() => { setShowChallengeModal(false); setEditingChallenge(null); }} className="hover:bg-white/20 p-2 rounded-xl cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveChallenge} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Judul Tantangan</label>
                  <input 
                    required
                    value={challengeForm.title}
                    onChange={e => setChallengeForm({...challengeForm, title: e.target.value})}
                    placeholder="Contoh: Konfigurasi Subnetting Kelas C"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Deskripsi / Instruksi Detail</label>
                  <textarea 
                    required
                    rows={4}
                    value={challengeForm.description}
                    onChange={e => setChallengeForm({...challengeForm, description: e.target.value})}
                    placeholder="Tuliskan petunjuk langkah demi langkah pengerjaan tantangan secara mendalam..."
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 text-sm leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Kategori Pembahasan</label>
                    <select
                      value={challengeForm.type}
                      onChange={e => setChallengeForm({...challengeForm, type: e.target.value as any})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-semibold"
                    >
                      <option value="networking">Jaringan Komputer</option>
                      <option value="servers">Administrasi Server</option>
                      <option value="pjbl">Metodologi PjBL</option>
                      <option value="programming">Pemrograman Dasar</option>
                      <option value="other">Pembahasan Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Kesulitan</label>
                    <select
                      value={challengeForm.difficulty}
                      onChange={e => setChallengeForm({...challengeForm, difficulty: e.target.value as any})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-semibold"
                    >
                      <option value="Mudah">Mudah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Tantang">Tantang</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Asal Tantangan</label>
                    <select
                      value={challengeForm.source}
                      onChange={e => setChallengeForm({...challengeForm, source: e.target.value as any})}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-semibold"
                    >
                      <option value="new">Tugas Baru Guru</option>
                      <option value="completed_project">Tugas Alumni Proyek Selesai</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => { setShowChallengeModal(false); setEditingChallenge(null); }}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={actionLoading === 'save_challenge'}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading === 'save_challenge' ? 'Penyimpanan...' : editingChallenge ? 'Simpan' : 'Terbitkan Tantangan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}        {showKitModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                <h3 className="text-xl font-bold">{newKit.id ? 'Ubah Kit Mata Pelajaran' : 'Create Project Kit'}</h3>
                <button onClick={() => setShowKitModal(false)} className="hover:bg-white/20 p-2 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateKit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nama Mata Pelajaran / Judul Template</label>
                  <input 
                    required
                    type="text" 
                    value={newKit.title}
                    onChange={e => setNewKit({...newKit, title: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Contoh: Eksperimen IPA"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Deskripsi</label>
                  <textarea 
                    rows={2}
                    value={newKit.description}
                    onChange={e => setNewKit({...newKit, description: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    placeholder="Summary proyek..."
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tahapan (Workflow)</label>
                    <button type="button" onClick={() => addField('workflow')} className="text-indigo-600 text-xs font-bold">+ TAMBAH</button>
                  </div>
                  {newKit.workflow.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        value={item}
                        onChange={e => updateField('workflow', idx, e.target.value)}
                        className="flex-1 p-3 bg-gray-50 border-none rounded-xl text-sm outline-none"
                        placeholder={`Tahap ${idx + 1}`}
                      />
                      <button type="button" onClick={() => removeField('workflow', idx)} className="text-red-400"><MinusCircle size={18}/></button>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Rubrik Penilaian</label>
                    <button type="button" onClick={() => addField('rubric')} className="text-indigo-600 text-xs font-bold">+ TAMBAH</button>
                  </div>
                  {newKit.rubric.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        value={item}
                        onChange={e => updateField('rubric', idx, e.target.value)}
                        className="flex-1 p-3 bg-gray-50 border-none rounded-xl text-sm outline-none"
                        placeholder="Contoh: Kreativitas (25%)"
                      />
                      <button type="button" onClick={() => removeField('rubric', idx)} className="text-red-400"><MinusCircle size={18}/></button>
                    </div>
                  ))}
                </div>

                <button 
                  type="submit"
                  disabled={!!actionLoading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {actionLoading === 'create-kit' ? 'Menyimpan...' : newKit.id ? 'Simpan Perubahan' : 'Buat System Kit'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
