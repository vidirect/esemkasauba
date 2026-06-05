import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Users, 
  Send, 
  ThumbsUp, 
  Reply, 
  Sparkles, 
  Filter, 
  Search, 
  Phone, 
  Mail, 
  Instagram, 
  Paperclip, 
  Image, 
  Video, 
  Volume2, 
  X, 
  ExternalLink, 
  Compass, 
  CheckCircle2, 
  User, 
  CornerDownRight, 
  Globe,
  Download,
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  Pencil
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const downloadBase64File = (base64Data: string, filename: string) => {
  try {
    const link = document.createElement('a');
    link.href = base64Data;
    
    // Clean up filename
    let cleanName = filename || 'file_tugas';
    if (cleanName.toLowerCase().startsWith('file lokal - ')) {
      cleanName = cleanName.substring(13);
    }
    
    // Determine extension from mime if filename has no extension
    if (!cleanName.includes('.')) {
      let extension = 'bin';
      const mimeMatch = base64Data.match(/^data:([^;]+);/);
      if (mimeMatch && mimeMatch[1]) {
        const mime = mimeMatch[1];
        if (mime === 'application/pdf') extension = 'pdf';
        else if (mime === 'text/plain') extension = 'txt';
        else if (mime === 'application/zip') extension = 'zip';
        else if (mime.startsWith('image/')) {
          const ext = mime.split('/')[1];
          extension = ext === 'jpeg' ? 'jpg' : ext || 'png';
        }
        else if (mime.startsWith('video/')) extension = mime.split('/')[1] || 'mp4';
        else if (mime.startsWith('audio/')) extension = mime.split('/')[1] || 'mp3';
      }
      cleanName = `${cleanName}.${extension}`;
    }
    
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Gagal mengunduh file:", error);
  }
};
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  where,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from './FirebaseProvider';
import { Discussion, Student, DirectMessage, WeeklyChallenge } from '../types';

export default function Collaboration() {
  const { student, user } = useFirebase();
  const [collabTab, setCollabTab] = useState<'forum' | 'dm'>('forum');
  
  // Weekly Challenge state & persistence hooks
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<WeeklyChallenge | null>(null);

  // Live subscription to weekly challenges
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'weekly_challenges')), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyChallenge));
      setChallenges(list);
    }, (err) => {
      console.error("Gagal mengambil info tantangan:", err);
    });
    return () => unsub();
  }, []);

  // Select active challenge
  useEffect(() => {
    if (challenges.length === 0) {
      setCurrentChallenge(null);
      return;
    }
    const storedId = localStorage.getItem('tjkt_active_challenge_id');
    const matched = challenges.find(c => c.id === storedId);
    if (matched) {
      setCurrentChallenge(matched);
    } else {
      const idx = Math.floor(Math.random() * challenges.length);
      const chosen = challenges[idx];
      setCurrentChallenge(chosen);
      localStorage.setItem('tjkt_active_challenge_id', chosen.id);
    }
  }, [challenges]);

  const handleRandomizeChallenge = () => {
    if (challenges.length <= 1) return;
    const candidates = currentChallenge 
      ? challenges.filter(c => c.id !== currentChallenge.id)
      : challenges;
    const idx = Math.floor(Math.random() * candidates.length);
    const chosen = candidates[idx];
    setCurrentChallenge(chosen);
    localStorage.setItem('tjkt_active_challenge_id', chosen.id);
  };

  // States for Forum tab
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loadingForum, setNewLoadingForum] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  // New States for Forum Interactive Features & Custom Tagging
  const [activeFilterTags, setActiveFilterTags] = useState<string[]>([]); // empty list corresponds to "Semua" (All)
  const [selectedTags, setSelectedTags] = useState<string[]>(['General']);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [isReplying, setIsReplying] = useState<boolean>(false);

  // Dynamic tags aggregation from discussions + default academic topics list
  const dynamicTags = useMemo(() => {
    const defaultList = [
      'General', 
      'TanyaJaringan', 
      'PjBL', 
      'SMKN1Ujungbatu', 
      'Cisco', 
      'Mikrotik', 
      'VLAN', 
      'Routing', 
      'FiberOptic', 
      'AdministrasiSistem', 
      'KeamananJaringan', 
      'ServerDebian'
    ];
    const tagSet = new Set<string>(defaultList);
    discussions.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(t => {
          if (t && typeof t === 'string' && t.trim()) {
            // Keep original casing but trim whitespace and clean hash sign
            tagSet.add(t.trim().replace(/#/g, ''));
          }
        });
      }
    });
    return Array.from(tagSet);
  }, [discussions]);

  const handleAddCustomTag = () => {
    const cleanTag = customTagInput.trim().replace(/#/g, '').replace(/\s+/g, '');
    if (cleanTag && !selectedTags.includes(cleanTag)) {
      setSelectedTags([...selectedTags, cleanTag]);
      setCustomTagInput('');
    }
  };

  const removeSelectedTag = (tag: string) => {
    if (selectedTags.length > 1) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    }
  };

  // Small helper to safely toggle or set loadingForum state to ensure no lint issue with variable rename
  const setLoadingForum = (val: boolean) => {
    setNewLoadingForum(val);
  };

  const parseReply = (replyStr: string) => {
    try {
      return JSON.parse(replyStr);
    } catch (e) {
      return {
        authorId: '',
        authorName: 'Rekan Kelas',
        authorAvatar: '',
        content: replyStr,
        timestamp: new Date().toISOString()
      };
    }
  };

  const handleLikePost = async (postId: string, currentLikes: number) => {
    try {
      const docRef = doc(db, 'discussions', postId);
      await updateDoc(docRef, {
        likes: (currentLikes || 0) + 1
      });
    } catch (error) {
      console.error("Gagal menyukai postingan:", error);
    }
  };

  const handleReplyPost = async (postId: string, currentReplies: string[]) => {
    if (!replyText.trim() || !student || isReplying) return;
    setIsReplying(true);
    try {
      const newReply = JSON.stringify({
        authorId: student.id,
        authorName: student.name,
        authorAvatar: student.avatar || '',
        content: replyText.trim(),
        timestamp: new Date().toISOString()
      });
      const docRef = doc(db, 'discussions', postId);
      await updateDoc(docRef, {
        replies: [...(currentReplies || []), newReply]
      });
      setReplyText('');
    } catch (error) {
      console.error("Gagal membalas postingan:", error);
    } finally {
      setIsReplying(false);
    }
  };

  const toggleTagSelection = (tag: string) => {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter(t => t !== tag));
      }
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // States for DM & Directory tab
  const [allUsers, setAllUsers] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'student' | 'teacher' | 'admin'>('student');
  const [selectedUser, setSelectedUser] = useState<Student | null>(null);
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isSendingDm, setIsSendingDm] = useState(false);
  const [loadingDm, setLoadingDm] = useState(false);

  // Attachment modal state
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [collabProjectSearch, setCollabProjectSearch] = useState('');
  const [mediaInput, setMediaInput] = useState({
    url: '',
    type: 'image' as 'image' | 'video' | 'audio' | 'link',
    label: ''
  });

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Load Forum discussions
  useEffect(() => {
    if (collabTab !== 'forum') return;
    const q = query(collection(db, 'discussions'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Discussion[];
      setDiscussions(docs);
      setLoadingForum(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'discussions');
    });

    return () => unsubscribe();
  }, [collabTab]);

  // Load all users for the Directory
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Student);
      setAllUsers(usersList);
    }, (error) => {
      console.error("Error loading directories:", error);
    });

    return () => unsubscribe();
  }, []);

  // Load active Direct Message thread
  useEffect(() => {
    if (!student || !selectedUser || collabTab !== 'dm') {
      setDmMessages([]);
      return;
    }

    setLoadingDm(true);
    const chatKey = [student.id, selectedUser.id].sort().join('_');
    
    // Using a simple equality query with client-side sorting 
    // to strictly preserve cost and prevent missing-index firestore crashes!
    const q = query(
      collection(db, 'direct_messages'), 
      where('chatKey', '==', chatKey)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DirectMessage[];

      // Sort messages chronologically by timestamp (client side)
      const sortedMessages = messagesList.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeA - timeB;
      });

      setDmMessages(sortedMessages);
      setLoadingDm(false);

      // Auto scroll to latest message
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'direct_messages');
      setLoadingDm(false);
    });

    return () => unsubscribe();
  }, [student, selectedUser, collabTab]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !student || !user || isPosting) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, 'discussions'), {
        authorId: student.id,
        authorName: student.name,
        content: newPost.trim(),
        timestamp: serverTimestamp(),
        likes: 0,
        replies: [],
        tags: selectedTags
      });
      setNewPost('');
      setSelectedTags(['General']); // Reset tags selection after posting
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'discussions');
    } finally {
      setIsPosting(false);
    }
  };

  const handleSendDm = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!typedMessage.trim() && !mediaInput.url) || !student || !selectedUser || isSendingDm) return;

    setIsSendingDm(true);
    const chatKey = [student.id, selectedUser.id].sort().join('_');

    const messageData: Partial<DirectMessage> = {
      senderId: student.id,
      senderName: student.name,
      senderAvatar: student.avatar || '',
      receiverId: selectedUser.id,
      receiverName: selectedUser.name,
      message: typedMessage.trim(),
      chatKey,
      timestamp: serverTimestamp()
    } as any;

    // Attach rich media if selected
    if (mediaInput.url) {
      messageData.mediaUrl = mediaInput.url;
      messageData.mediaType = mediaInput.type;
      
      // If message body was empty, set description of the attachment
      if (!messageData.message) {
        messageData.message = mediaInput.label || `Mengirim ${mediaInput.type}`;
      }
    }

    try {
      await addDoc(collection(db, 'direct_messages'), messageData);
      setTypedMessage('');
      setMediaInput({ url: '', type: 'image', label: '' }); // Reset attachments
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'direct_messages');
    } finally {
      setIsSendingDm(false);
    }
  };

  // Predefined Safe Educational Media Samples (Zero cost storage, extremely useful)
  const SAMPLE_MEDIA = [
    {
      label: 'Topologi Jaringan LAN & Server SMKN 1 Ujungbatu',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800'
    },
    {
      label: 'Simulasi Keamanan Jaringan & Firewall Debian Server',
      type: 'link' as const,
      url: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&q=80&w=800'
    },
    {
      label: 'Desain Diagram Pemancar Wi-Fi & Hotspot Sekolah',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&q=80&w=800'
    },
    {
      label: 'Video Panduan Pengantar Cisco Packet Tracer',
      type: 'video' as const,
      url: 'https://www.w3schools.com/html/mov_bbb.mp4' // Light utility video sample
    },
    {
      label: 'Video Cara Crimping Kabel UTP RJ45 (Straight/Cross)',
      type: 'video' as const,
      url: 'https://www.w3schools.com/html/movie.mp4'
    },
    {
      label: 'Voice Note Pengantar Simulasi Jaringan Komputer',
      type: 'audio' as const,
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' // Light audio sample
    },
    {
      label: 'Dokumen Praktik Konfigurasi Routing Mikrotik & VLAN',
      type: 'link' as const,
      url: 'https://wiki.mikrotik.com/'
    },
    {
      label: 'Tutorial Penyambungan Splicing Fiber Optic',
      type: 'link' as const,
      url: 'https://www.computernetworkingnotes.com'
    }
  ];

  // Local file processing simulation (Base64) to show full capability without storage cost
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = () => {
      let fType: DirectMessage['mediaType'] = 'image';
      if (file.type.startsWith('image/')) fType = 'image';
      else if (file.type.startsWith('video/')) fType = 'video';
      else if (file.type.startsWith('audio/')) fType = 'audio';
      else fType = 'link';

      setMediaInput({
        url: fileReader.result as string,
        type: fType,
        label: `File lokal - ${file.name}`
      });
    };
    fileReader.readAsDataURL(file);
  };

  // Filtered directories user list
  const filteredUsers = allUsers.filter(u => {
    // Exclude current user from their own directory
    if (u.id === student?.id) return false;
    
    // Filter by role
    const matchedRole = (u.role || 'student') === roleFilter;
    
    // Filter by search query
    const matchedQuery = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchedRole && matchedQuery;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 bg-gray-50 min-h-screen pb-24 md:pb-8">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Collaboration & DM Hub</h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-1">Diskusikan tugas proyek kelas atau kirim pesan personal secara langsung.</p>
        </div>

        {/* Tab Central Selectors - Grid layout to fit mobile perfectly with no cutoff/overflow and beautiful round edges */}
        <div className="grid grid-cols-2 sm:flex bg-gray-200/60 dark:bg-slate-900/80 p-1 rounded-2xl border border-gray-200/50 dark:border-slate-800 w-full sm:w-auto gap-1">
          <button
            onClick={() => setCollabTab('forum')}
            className={`px-3 sm:px-6 py-2.5 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              collabTab === 'forum' 
                ? 'bg-white dark:bg-[#131926] text-indigo-700 dark:text-indigo-400 shadow-sm font-black' 
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-slate-100'
            }`}
          >
            <Compass size={14} className="sm:w-4 sm:h-4" />
            <span>Forum Diskusi</span>
          </button>
          <button
            onClick={() => setCollabTab('dm')}
            className={`px-3 sm:px-6 py-2.5 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              collabTab === 'dm' 
                ? 'bg-white dark:bg-[#131926] text-indigo-700 dark:text-indigo-400 shadow-sm font-black' 
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-slate-100'
            }`}
          >
            <MessageSquare size={14} className="sm:w-4 sm:h-4" />
            <span>Direktori & DM</span>
          </button>
        </div>
      </header>

      {/* RENDER TAB 1: PUBLIC FORUM */}
      {collabTab === 'forum' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Create Post Section */}
            <div className="bg-white dark:bg-[#131926] p-4 sm:p-6 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800">
              <form onSubmit={handlePost} className="space-y-4">
                <textarea 
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Sampaikan aspirasi, pertanyaan seputar Cisco, Mikrotik, atau progres PjBL kelompok Anda di sini..."
                  className="w-full p-4 sm:p-5 bg-gray-50 dark:bg-slate-900 border border-transparent dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl sm:rounded-2xl resize-none h-28 sm:h-32 transition-all focus:outline-none text-gray-800 dark:text-gray-100 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600/10 placeholder-gray-400"
                />
                
                {/* Advanced Tag Attachment flow - Custom tag inputs & defaults */}
                <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-slate-800/60">
                  <div>
                    <p className="text-[10px] sm:text-xs font-extrabold text-indigo-605 dark:text-indigo-455 uppercase tracking-wider mb-2">Tagar Terlampir Untuk Pos Ini:</p>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50/60 dark:bg-slate-900/60 rounded-xl border border-gray-150 dark:border-slate-805/40">
                      {selectedTags.map(tag => (
                        <div key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] sm:text-xs font-bold shadow-sm">
                          <span>#{tag}</span>
                          {selectedTags.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSelectedTag(tag)}
                              className="hover:bg-indigo-700 p-0.5 rounded-full transition-all focus:outline-none cursor-pointer flex items-center justify-center"
                              title="Hapus tag ini"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Add Recommendations */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] sm:text-xs font-extrabold text-gray-400 dark:text-gray-550 uppercase tracking-wider">Pilih Tagar Rekomendasi:</p>
                      <div className="flex flex-wrap gap-1">
                        {['TanyaJaringan', 'PjBL', 'SMKN1Ujungbatu', 'Cisco', 'Mikrotik', 'FiberOptic'].map(tag => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => toggleTagSelection(tag)}
                              className={cn(
                                "px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer border",
                                isSelected 
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-850 dark:text-indigo-300" 
                                  : "bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750"
                              )}
                            >
                              + #{tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Add Custom Tag */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] sm:text-xs font-extrabold text-gray-400 dark:text-gray-550 uppercase tracking-wider">Buat Tagar Kustom Sendiri:</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-xs font-bold">#</span>
                          <input 
                            type="text"
                            value={customTagInput}
                            onChange={(e) => setCustomTagInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} // only alphanumeric
                            placeholder="Tulis topik (misal: Tugas3, VLAN)"
                            className="w-full pl-5 pr-2.5 py-1.5 bg-gray-50 dark:bg-slate-900 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-xs focus:outline-none dark:text-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomTag();
                              }
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddCustomTag}
                          disabled={!customTagInput.trim()}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shrink-0"
                        >
                          Sematkan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button 
                    type="submit"
                    disabled={!newPost.trim() || isPosting}
                    className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Send size={16} />
                    {isPosting ? "Posting..." : "Kirim Diskusi"}
                  </button>
                </div>
              </form>
            </div>

            {/* Robust Multi-Select Topic Filters Header */}
            <div className="bg-white dark:bg-[#131926] p-4 sm:p-5 rounded-2xl md:rounded-[24px] border border-gray-150 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                  <Filter size={12} /> Filter Topik Jaringan & Proyek (Bisa klik beberapa):
                </span>
                {activeFilterTags.length > 0 && (
                  <button 
                    onClick={() => setActiveFilterTags([])}
                    className="text-[10px] font-black text-rose-500 dark:text-rose-400 hover:underline cursor-pointer tracking-wider shrink-0"
                  >
                    Mulai Ulang (Clear)
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-none pb-0.5">
                <button
                  key="ALL"
                  onClick={() => setActiveFilterTags([])}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all border cursor-pointer",
                    activeFilterTags.length === 0
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm font-extrabold"
                      : "bg-gray-50 text-gray-500 border-gray-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-405 hover:bg-gray-100"
                  )}
                >
                  🔥 Semua Pembahasan
                </button>
                {dynamicTags.map(tag => {
                  const isSelected = activeFilterTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        if (isSelected) {
                          setActiveFilterTags(activeFilterTags.filter(t => t !== tag));
                        } else {
                          setActiveFilterTags([...activeFilterTags, tag]);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-0.5",
                        isSelected
                          ? "bg-indigo-150 border-indigo-300 dark:bg-indigo-950 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 font-extrabold"
                          : "bg-white text-gray-500 hover:bg-gray-50 border-gray-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800"
                      )}
                    >
                      <span>#</span>{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {loadingForum ? (
                <div className="flex justify-center p-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full"
                  />
                </div>
              ) : (() => {
                const filteredDiscussions = discussions.filter(post => {
                  if (activeFilterTags.length === 0) return true;
                  return post.tags && post.tags.some(tag => activeFilterTags.includes(tag));
                });

                if (filteredDiscussions.length === 0) {
                  return (
                    <div className="text-center p-12 bg-white dark:bg-[#131926] rounded-2xl md:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                      <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada postingan dalam topik: {activeFilterTags.map(t => `#${t}`).join(', ')}.</p>
                    </div>
                  );
                }

                return filteredDiscussions.map((post) => {
                  const isExpanded = expandedPostId === post.id;
                  const replyCount = (post.replies || []).length;
                  return (
                    <motion.div 
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-[#131926] p-5 sm:p-6 rounded-2xl md:rounded-[28px] shadow-sm border border-gray-100 dark:border-slate-800 space-y-4 hover:border-indigo-250 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-605 dark:text-indigo-300 font-extrabold text-sm uppercase shadow-inner shrink-0">
                            {post.authorName ? post.authorName[0] : 'U'}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-tight">{post.authorName}</h4>
                            <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-0.5">
                              {post.timestamp && typeof post.timestamp.toDate === 'function' ? post.timestamp.toDate().toLocaleString('id-ID') : 'Baru saja'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                          {post.tags && post.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-405 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md border border-gray-100 dark:border-slate-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">{post.content}</p>
                      
                      <div className="flex items-center gap-6 pt-3 border-t border-gray-50 dark:border-slate-800/80">
                        <button 
                          type="button"
                          onClick={() => handleLikePost(post.id, post.likes)}
                          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <ThumbsUp size={14} />
                          <span>{post.likes || 0} Suka</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                          className={cn(
                            "flex items-center gap-2 text-xs font-extrabold transition-all cursor-pointer hover:text-indigo-600",
                            isExpanded ? "text-indigo-605 dark:text-indigo-400" : "text-gray-400 dark:text-slate-400"
                          )}
                        >
                          <Reply size={14} />
                          <span>{replyCount} Balasan</span>
                        </button>
                      </div>

                      {/* Comment section expanded drawer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-4 overflow-hidden"
                          >
                            <h5 className="text-[10px] sm:text-[11px] font-black tracking-widest text-indigo-600 uppercase dark:text-indigo-400">Hub Diskusi & Komentar ({replyCount})</h5>
                            
                            {/* Comments/Replies list */}
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 select-none">
                              {replyCount === 0 ? (
                                <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2 pl-2">Belum ada tanggapan. Jadilah yang pertama memberikan solusi/balasan!</p>
                              ) : (
                                (post.replies || []).map((replyStr, rIdx) => {
                                  const rParsed = parseReply(replyStr);
                                  return (
                                    <div key={rIdx} className="bg-gray-50 dark:bg-slate-900 border border-neutral-100 dark:border-slate-800/60 p-3 rounded-2xl flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-800 flex items-center justify-center font-bold text-gray-600 dark:text-slate-305 text-xs shrink-0">
                                        {rParsed.authorName ? rParsed.authorName[0].toUpperCase() : 'S'}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate">{rParsed.authorName}</p>
                                          <span className="text-[9px] text-gray-400 dark:text-gray-550 shrink-0">
                                            {rParsed.timestamp ? new Date(rParsed.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru'}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 leading-relaxed whitespace-pre-wrap">{rParsed.content}</p>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Comment Input box */}
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleReplyPost(post.id, post.replies || []);
                              }}
                              className="flex items-center gap-2 pt-2"
                            >
                              <input 
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Tulis masukan, feedback, atau jawaban Anda..."
                                className="flex-1 py-2 px-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white dark:placeholder-gray-500"
                              />
                              <button
                                type="submit"
                                disabled={!replyText.trim() || isReplying}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                {isReplying ? 'Mengirim...' : 'Kirim'}
                              </button>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Right Sidebar - Team info */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Users size={16} />
                Anggota Tim Proyek Anda
              </h3>
              <div className="space-y-4">
                {student?.teamIds && student.teamIds.length > 0 ? (
                  student.teamIds.map((memberId) => {
                    const matched = allUsers.find(u => u.id === memberId);
                    return (
                      <div key={memberId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all">
                        <div className="flex items-center gap-3">
                          <img 
                            src={matched?.avatar || `https://picsum.photos/seed/${memberId}/40/40`} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-xl object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{matched?.name || 'Rekan Tim'}</p>
                            <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider flex items-center gap-1">● Aktif</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (matched) {
                              setSelectedUser(matched);
                              setCollabTab('dm');
                            }
                          }}
                          className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                          title="Kirim Chat DM"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 italic">Anda belum terdaftar dalam grup proyek manapun.</p>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950 p-8 rounded-[32px] shadow-xl text-white relative overflow-hidden flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white/10 text-amber-400 rounded-2xl flex items-center justify-center animate-pulse">
                    <Sparkles size={24} />
                  </div>
                  {currentChallenge && (
                    <div className="flex flex-col items-end gap-1 text-[10px] uppercase tracking-wider font-extrabold text-indigo-300">
                      <span className="px-2 py-0.5 bg-indigo-500/20 rounded-md">
                        {currentChallenge.source === 'completed_project' ? 'Portofolio Alumni' : 'Tugas Baru Guru'}
                      </span>
                      <span className="px-2 py-0.5 bg-white/10 rounded-md">
                        {currentChallenge.difficulty || 'Sedang'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold tracking-tight">Tantangan Mingguan</h3>
                  <p className="text-slate-400 text-xs mt-1">Acak tugas variatif yang diberikan oleh bapak/ibu guru Anda:</p>
                </div>

                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 leading-relaxed space-y-2">
                  {currentChallenge ? (
                    <>
                      <h4 className="font-extrabold text-sm text-indigo-250">
                        {currentChallenge.title}
                      </h4>
                      <p className="text-slate-205 text-xs text-justify">
                        "{currentChallenge.description}"
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                        <span className="capitalize">Kategori: {currentChallenge.type}</span>
                        <span>Oleh: {currentChallenge.creatorName}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="font-extrabold text-sm text-indigo-250">
                        Perancangan Jaringan Client-Server TJKT
                      </h4>
                      <p className="text-slate-205 text-xs text-justify">
                        "Buatlah desain rancangan topologi jaringan Client-Server menggunakan 1 Router, 2 Switch, dan 4 PC pada Lembar Perencanaan kelompok!"
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                        <span>Kategori: Jaringan</span>
                        <span>Oleh: Guru SMKN 1</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => setCollabTab('dm')}
                  className="w-full bg-indigo-650 hover:bg-indigo-600 text-white py-3.5 rounded-xl font-bold transition-all text-sm shadow-md cursor-pointer"
                >
                  Minta Masukan dari Guru & Rekan
                </button>
                {challenges.length > 1 && (
                  <button 
                    onClick={handleRandomizeChallenge}
                    className="w-full bg-white/10 text-white py-3.5 rounded-xl font-bold hover:bg-white/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={14} className="animate-spin-slow" />
                    Acak Tantangan Lain
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: DIRECT DIRECTORY AND DMs */}
      {collabTab === 'dm' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-stretch h-[calc(100vh-240px)] lg:h-[calc(100vh-280px)] min-h-[500px]">
          
          {/* LEFT COLUMN: LIST DIRECTORY BY ROLES */}
          <div className={cn("lg:col-span-12 xl:col-span-5 bg-white dark:bg-[#131926] border border-gray-150 dark:border-slate-800 rounded-2xl md:rounded-[32px] shadow-sm flex flex-col overflow-hidden max-h-full lg:col-span-5", selectedUser ? "hidden lg:flex" : "flex")}>
            
            {/* Header, Search and Segment Selector */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Direktori & Kontak</h3>
                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-605 dark:text-indigo-400 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                  TJKT SMKN 1
                </span>
              </div>

              {/* SearchBar */}
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, email, atau bio..."
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:text-white dark:placeholder-gray-500 shadow-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Segments (Tabs for Student, Teacher, Admin) */}
              <div className="grid grid-cols-3 bg-gray-200/50 dark:bg-slate-900/80 p-0.5 sm:p-1 rounded-xl border border-gray-200/20 dark:border-slate-800 w-full gap-0.5 xs:gap-1">
                {(['student', 'teacher', 'admin'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap truncate text-center ${
                      roleFilter === role 
                        ? 'bg-white dark:bg-[#131926] text-indigo-600 dark:text-indigo-400 shadow-sm font-black shadow-indigo-100/10' 
                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {role === 'student' ? 'Siswa' : role === 'teacher' ? 'Guru' : 'Admin'}
                  </button>
                ))}
              </div>
            </div>

            {/* User Row Lists */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-3 space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <User size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="text-xs">Tidak ada pengguna ditemukan.</p>
                </div>
              ) : (
                filteredUsers.map(u => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <div 
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`p-4 rounded-2xl flex items-start gap-4 transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-800/40 shadow-sm' 
                          : 'bg-white dark:bg-slate-900 border-transparent dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <img 
                        src={u.avatar} 
                        alt={u.name} 
                        className="w-11 h-11 rounded-xl object-cover shrink-0" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm">{u.name}</h4>
                          <span className={`text-[9px] font-bold uppercase tracking-widest shrink-0 px-2 py-0.5 rounded-md ${
                            u.role === 'admin' 
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' 
                              : u.role === 'teacher' 
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' 
                              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-450'
                          }`}>
                            {u.role === 'student' ? 'Siswa' : u.role === 'teacher' ? 'Guru' : 'Admin'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{u.email}</p>
                        {u.bio && (
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 truncate max-w-xs italic leading-relaxed">
                            "{u.bio}"
                          </p>
                        )}

                        {/* Fast Call, WA, Email actions */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100/30 dark:border-slate-800/50">
                          <a 
                            href={`mailto:${u.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-gray-50 hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 dark:bg-slate-950 dark:hover:bg-indigo-900/60 dark:text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="Kirim Email"
                          >
                            <Mail size={12} />
                          </a>
                          {u.whatsapp && (
                            <a 
                              href={`https://wa.me/${u.whatsapp}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-slate-950 dark:hover:bg-emerald-900/60 dark:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                              title="Hubungi WhatsApp"
                            >
                              <Phone size={12} />
                            </a>
                          )}
                          {u.instagram && (
                            <a 
                              href={`https://instagram.com/${u.instagram}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 dark:bg-[#131926] dark:hover:bg-pink-905/30 dark:text-pink-400 rounded-lg transition-colors cursor-pointer text-[10px] font-bold px-2 py-1"
                              title="Lihat Instagram"
                            >
                              @
                            </a>
                          )}
                          {u.phone && (
                            <a 
                              href={`tel:${u.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-slate-950 dark:hover:bg-blue-900/60 dark:text-blue-400 rounded-lg transition-colors cursor-pointer"
                              title="Panggil Telepon"
                            >
                              <Phone size={12} />
                            </a>
                          )}
                          <span className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold ml-auto flex items-center gap-1 cursor-pointer">
                            Chat DM <CornerDownRight size={10} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE DIRECT MESSAGE THREAD */}
          <div className={cn("lg:col-span-12 xl:col-span-7 bg-white border border-gray-100 rounded-2xl md:rounded-[32px] shadow-sm flex flex-col overflow-hidden max-h-full lg:col-span-7", !selectedUser ? "hidden lg:flex" : "flex")}>
            
            {/* If no selected partner */}
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/20">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center mb-6 shadow-md shadow-indigo-100/50">
                  <MessageSquare size={32} />
                </div>
                <h4 className="text-xl font-bold text-gray-900">Platform Pesan Mandiri TJKT</h4>
                <p className="text-sm text-gray-500 max-w-sm mt-2 leading-relaxed">
                  Pilih seseorang dari Direktori Siswa, Guru, atau Administrator di panel sebelah kiri untuk memulai diskusi personal, konsultasi tugas, atau mengirim media secara aman.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  <div className="p-3 bg-white border border-gray-100 rounded-2xl text-xs text-left">
                    <span className="font-bold text-indigo-600 text-[10px] uppercase block tracking-wider mb-0.5">Untuk Siswa</span>
                    Tanyakan penyelesaian kendala topologi, coding, atau bagi kontribusi tugas.
                  </div>
                  <div className="p-3 bg-white border border-gray-100 rounded-2xl text-xs text-left">
                    <span className="font-bold text-indigo-600 text-[10px] uppercase block tracking-wider mb-0.5">Untuk Guru/Admin</span>
                    Konsultasikan tugas PjBL untuk mendapatkan nilai dan feedback produktif.
                  </div>
                </div>
              </div>
            ) : (
              // Active chat panel
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Active Chat Header */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img 
                      src={selectedUser.avatar} 
                      alt={selectedUser.name} 
                      className="w-11 h-11 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{selectedUser.name}</h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                          selectedUser.role === 'admin' ? 'bg-red-100 text-red-600' : 
                          selectedUser.role === 'teacher' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {selectedUser.role || 'student'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">{selectedUser.email}</p>
                    </div>
                  </div>

                  {/* Fast Dial badges inside Conversation screen */}
                  <div className="flex items-center gap-2">
                    {/* Kembali (Back) button for mobile users */}
                    <button 
                      type="button"
                      onClick={() => setSelectedUser(null)} 
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer lg:hidden border border-gray-200 dark:border-slate-700"
                      title="Kembali ke Direktori"
                    >
                      <ArrowLeft size={14} />
                      <span>Kembali</span>
                    </button>

                    {selectedUser.whatsapp && (
                      <a 
                        href={`https://wa.me/${selectedUser.whatsapp}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-1 border border-transparent dark:border-emerald-800/40"
                        title="Alihkan ke WhatsApp pribadi"
                      >
                        <Phone size={12} />
                        <span className="hidden sm:inline">WA</span>
                      </a>
                    )}
                    <button 
                      type="button"
                      onClick={() => setSelectedUser(null)} 
                      className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Tutup Chat"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Message Streams (Scroll Container) */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
                  {loadingDm ? (
                    <div className="flex justify-center py-10">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                    </div>
                  ) : dmMessages.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                      <MessageSquare size={36} className="mx-auto mb-3 opacity-20" />
                      <p className="text-xs">Ucapkan halo! Kirim pesan pertama Anda ke {selectedUser.name}.</p>
                    </div>
                  ) : (
                    dmMessages.map((msg) => {
                      const isMe = msg.senderId === student?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                          }`}>
                            <p className="font-bold text-[10px] opacity-75 mb-1">
                              {isMe ? 'Anda' : msg.senderName}
                            </p>
                            
                            {/* Rendering text body */}
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            
                            {/* RENDERING RICH MEDIA PREVIEWS */}
                            {msg.mediaUrl && (
                              <div className="mt-3.5 pt-3.5 border-t border-black/10">
                                
                                {msg.mediaType === 'image' && (
                                  <div className="relative group overflow-hidden rounded-xl border border-black/5 bg-black/5">
                                    <img 
                                      src={msg.mediaUrl} 
                                      alt="Attachment" 
                                      className="max-h-56 w-full object-contain hover:scale-105 transition-transform duration-300 pointer-events-auto"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        // Fallback if URL is empty or fails
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=400";
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white text-gray-900 rounded-full shadow-lg">
                                        <ExternalLink size={16} />
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {msg.mediaType === 'video' && (
                                  <div className="rounded-xl overflow-hidden border border-black/5 bg-black/5">
                                    <video 
                                      src={msg.mediaUrl} 
                                      controls 
                                      className="w-full max-h-56 object-cover" 
                                      onError={(e) => {
                                        console.warn("Media file fail to load, showing preview placeholder");
                                      }}
                                    />
                                  </div>
                                )}

                                {msg.mediaType === 'audio' && (
                                  <div className="p-1 rounded-xl bg-black/10 overflow-hidden">
                                    <audio 
                                      src={msg.mediaUrl} 
                                      controls 
                                      className="w-full h-8 outline-none" 
                                    />
                                  </div>
                                )}

                                {msg.mediaType === 'link' && (
                                  msg.mediaUrl.startsWith('data:') ? (
                                    <div className="flex flex-col gap-2 p-3 bg-black/10 rounded-xl mt-1 text-left min-w-[200px]">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                                          <Paperclip size={14} className={isMe ? "text-white" : "text-indigo-600"} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold text-[11px] truncate leading-tight opacity-90">{msg.message || 'File Lampiran'}</p>
                                          <p className="text-[9px] opacity-65">Berkas Tugas Sekolah</p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          downloadBase64File(msg.mediaUrl!, msg.message || 'file_tugas');
                                        }}
                                        className={`w-full py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm shrink-0 uppercase tracking-wider cursor-pointer ${
                                          isMe ? 'bg-white text-indigo-700 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                      >
                                        <Download size={11} />
                                        Unduh File
                                      </button>
                                    </div>
                                  ) : (
                                    <a 
                                      href={msg.mediaUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-colors ${
                                        isMe ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-50 hover:bg-gray-100 text-indigo-600'
                                      }`}
                                    >
                                      <Globe size={14} />
                                      <span className="underline truncate flex-1">{msg.mediaUrl}</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  )
                                )}
                              </div>
                            )}

                            <span className="text-[9px] opacity-60 block text-right mt-1.5">
                              {msg.timestamp && typeof msg.timestamp.toDate === 'function' 
                                ? msg.timestamp.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
                                : 'Baru saja'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messageEndRef} />
                </div>

                {/* Selected Attachment Preview Banner */}
                {mediaInput.url && (
                  <div className="px-5 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-700 animate-slide-up">
                    <div className="flex items-center gap-2.5">
                      {mediaInput.type === 'image' && <Image size={15} />}
                      {mediaInput.type === 'video' && <Video size={15} />}
                      {mediaInput.type === 'audio' && <Volume2 size={15} />}
                      {mediaInput.type === 'link' && <Globe size={15} />}
                      <span>Terlampir: <strong>{mediaInput.label || "Link Kustom"}</strong></span>
                    </div>
                    <button 
                      onClick={() => setMediaInput({ url: '', type: 'image', label: '' })}
                      className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-md"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* DM Message Input area */}
                <form onSubmit={handleSendDm} className="p-4 border-t border-gray-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAttachModal(true)}
                    className="p-3 bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors rounded-2xl flex items-center justify-center shrink-0"
                    title="Lampirkan File & Contoh Media (Bebas Quota)"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input 
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    placeholder={`Kirim pesan rahasia ke ${selectedUser.name}...`}
                    className="flex-1 py-3 px-4 bg-gray-50 border-none rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/10 placeholder-gray-400"
                  />

                  <button
                    type="submit"
                    disabled={(!typedMessage.trim() && !mediaInput.url) || isSendingDm}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-2xl transition-all shadow-md shadow-indigo-100 shrink-0 flex items-center justify-center"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIGHT FLUID ATTACHMENT MODAL */}
      <AnimatePresence>
        {showAttachModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-6 space-y-6 overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Paperclip className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900 border-none">Lampirkan File Media</h3>
                </div>
                <button 
                  onClick={() => setShowAttachModal(false)} 
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-indigo-50 p-4.5 rounded-2xl text-[11px] text-indigo-900 leading-relaxed space-y-2">
                <p className="font-black text-xs flex items-center gap-1.5 text-indigo-950">💡 Tips Berbagi File Gambar, Video, atau Berkas Tugas:</p>
                <p>
                  Agar pengiriman file berjalan lancar dan cepat, disarankan untuk mengunggah berkas Anda ke <strong>Google Drive</strong>, <strong>OneDrive</strong>, atau media penyimpanan online sejenis terlebih dahulu.
                </p>
                <p className="font-semibold text-indigo-950 bg-indigo-100/50 p-2.5 rounded-xl border border-indigo-200/40">
                  Penting: Pastikan Anda telah mengubah pengaturan berbagi file tersebut menjadi <strong>"Siapa saja yang memiliki link dapat melihat"</strong>, lalu salin (copy) tautannya dan tempelkan pada kolom di bawah!
                </p>
              </div>

              {/* OPTION 1: PASTE PUBLIC LINK URL */}
              <div className="space-y-3">
                <span className="text-[11.5px] font-black tracking-widest text-indigo-600 uppercase block">Opsi 1: Paling Direkomendasikan (Tautan Google Drive / Cloud)</span>
                <p className="text-[11px] text-gray-500 -mt-2">Tempel link berbagi Google Drive Anda di sini, lalu pilih kategori berkasnya:</p>
                <div className="grid grid-cols-1 gap-2">
                  <input 
                    type="url"
                    value={mediaInput.url}
                    onChange={(e) => setMediaInput({ ...mediaInput, url: e.target.value, label: 'Custom URL' })}
                    placeholder="Contoh: https://drive.google.com/file/d/.../view?usp=sharing"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-600/20 focus:bg-white focus:outline-none transition-all placeholder-gray-400"
                  />
                  <div className="flex bg-gray-100/80 rounded-xl p-1 w-full text-center">
                    {(['image', 'video', 'audio', 'link'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMediaInput({ ...mediaInput, type })}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                          mediaInput.type === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {type === 'image' ? 'Gambar' : type === 'video' ? 'Video' : type === 'audio' ? 'Suara' : 'Link Web'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* OPTION 2: SIMULATED SAMPLE ATTACHMENTS (Network Engineering presets with Search) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11.5px] font-black tracking-widest text-indigo-600 uppercase block">Opsi 2: Cari & Pilih Bahan Kolaborasi Projek Jaringan</span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Simulasi</span>
                </div>
                <p className="text-[11px] text-gray-500 -mt-2">Cari dari daftar materi, diagram topologi, atau latihan kerja yang pernah dikerjakan:</p>
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text"
                    value={collabProjectSearch}
                    onChange={(e) => setCollabProjectSearch(e.target.value)}
                    placeholder="Ketik topik proyek: topologi, cisco, mikrotik, crimping..."
                    className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/10 placeholder-gray-400"
                  />
                  {collabProjectSearch && (
                    <button 
                      type="button"
                      onClick={() => setCollabProjectSearch('')} 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {SAMPLE_MEDIA.filter(item => 
                    item.label.toLowerCase().includes(collabProjectSearch.toLowerCase())
                  ).length === 0 ? (
                    <div className="p-4 text-center bg-gray-50 rounded-xl text-[11px] text-gray-400 italic border border-dashed border-gray-200">
                      Topik proyek tidak ditemukan. Silakan ketik kata kunci lain!
                    </div>
                  ) : (
                    SAMPLE_MEDIA.filter(item => 
                      item.label.toLowerCase().includes(collabProjectSearch.toLowerCase())
                    ).map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMediaInput({ url: item.url, type: item.type, label: item.label });
                          setShowAttachModal(false);
                        }}
                        className="p-3 border border-gray-100 hover:border-indigo-100 bg-gray-50/50 hover:bg-white text-left rounded-2xl flex items-center gap-3 transition-all text-xs text-gray-700 font-bold shadow-sm"
                      >
                        {item.type === 'image' && <Image className="text-emerald-500 shrink-0" size={15} />}
                        {item.type === 'video' && <Video className="text-blue-500 shrink-0" size={15} />}
                        {item.type === 'audio' && <Volume2 className="text-pink-500 shrink-0" size={15} />}
                        {item.type === 'link' && <Globe className="text-amber-500 shrink-0" size={15} />}
                        <span className="truncate flex-1">{item.label}</span>
                        <span className="text-[9px] bg-indigo-50 px-2 py-0.5 rounded-md text-indigo-600 font-normal shrink-0">Pilih</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* OPTION 3: PROMPT FOR DIRECT HTML5 LOCAL UPLOADS */}
              <div className="space-y-3">
                <span className="text-[11.5px] font-black tracking-widest text-indigo-600 uppercase block">Opsi 3: Kirim Berkas Langsung Komputer/HP</span>
                <p className="text-[11px] text-gray-500 -mt-2">Digunakan untuk ukuran berkas kecil (Foto screenshot, audio singkat, dll):</p>
                <label className="p-4 border-2 border-dashed border-gray-200 hover:border-indigo-500 rounded-2xl text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/20 hover:bg-indigo-50/10">
                  <input 
                    type="file" 
                    accept="image/*,video/*,audio/*"
                    onChange={handleLocalFileUpload}
                    className="hidden" 
                  />
                  <Paperclip className="text-indigo-500 mb-1" size={20} />
                  <span className="text-xs font-bold text-gray-750">Pilih berkas dari Perangkat Saya</span>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-sm leading-relaxed px-2">
                    💡 <strong>Cara Kerja:</strong> Berkas akan dibaca lokal dan diubah menjadi teks aman (Base64) di dalam pesan chat pribadi, sehingga aman tanpa biaya tambahan. Hindari file berukuran sangat besar (&gt;1MB) agar pesan terkirim dengan lancar.
                  </p>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAttachModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={!mediaInput.url}
                  onClick={() => setShowAttachModal(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  Gunakan Lampiran
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
