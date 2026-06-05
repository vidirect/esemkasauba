/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import Portfolio from './components/Portfolio';
import Collaboration from './components/Collaboration';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import { motion, AnimatePresence } from 'motion/react';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { GraduationCap, LogIn, LogOut, LayoutDashboard, FolderKanban, Briefcase, Users, Settings as SettingsIcon } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'PjBL Projects', icon: FolderKanban },
  { id: 'portfolio', label: 'Digital Portfolio', icon: Briefcase },
  { id: 'collaboration', label: 'Collaboration', icon: Users },
  { id: 'teacher', label: 'Teacher Console', icon: Users, teacherOnly: true },
  { id: 'admin', label: 'Admin Center', icon: SettingsIcon, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

function AppContent() {
  const { user, loading, signIn, isSigningIn, isAdmin, isTeacher, signOut } = useFirebase();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [adminSubTab, setAdminSubTab] = useState<'projects' | 'kits' | 'students' | 'acl' | 'challenges'>('projects');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 rounded-[40px] shadow-xl border border-gray-100 max-w-md w-full text-center space-y-8"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-200">
            <GraduationCap size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PjBL Digital Classroom</h1>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">SMK Negeri 1 Ujungbatu</p>
            <p className="text-sm text-gray-500 leading-relaxed pt-1">Platform pembelajaran e-learning berbasis proyek digital (PjBL) untuk meningkatkan kompetensi teknologi informasi Kelas X TJKT.</p>
          </div>
          <button
            onClick={signIn}
            disabled={isSigningIn}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            )}
            {isSigningIn ? 'Connecting...' : 'Sign in with Google'}
          </button>
        </motion.div>
      </div>
    );
  }

  const filteredMenuItems = menuItems.filter(item => {
    // 1. If admin, they ONLY see dashboard, admin center, and settings
    if (isAdmin) {
      return ['dashboard', 'admin', 'settings'].includes(item.id);
    }
    // 2. If teacher, they ONLY see dashboard, teacher console, collaboration, and settings
    if (isTeacher) {
      return ['dashboard', 'teacher', 'collaboration', 'settings'].includes(item.id);
    }
    // 3. If student, they see dashboard, projects, portfolio, collaboration, and settings
    return ['dashboard', 'projects', 'portfolio', 'collaboration', 'settings'].includes(item.id);
  });

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('project-detail');
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setActiveTab('projects');
  };

  const renderContent = () => {
    // Role-based page access protection
    if (isAdmin && !['dashboard', 'admin', 'settings'].includes(activeTab)) {
      return <Dashboard setActiveTab={setActiveTab} setAdminSubTab={setAdminSubTab} />;
    }
    if (isTeacher && !['dashboard', 'teacher', 'collaboration', 'settings'].includes(activeTab)) {
      return <Dashboard setActiveTab={setActiveTab} setAdminSubTab={setAdminSubTab} />;
    }
    if (!isAdmin && !isTeacher && !['dashboard', 'projects', 'project-detail', 'portfolio', 'collaboration', 'settings'].includes(activeTab)) {
      return <Dashboard setActiveTab={setActiveTab} setAdminSubTab={setAdminSubTab} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} setAdminSubTab={setAdminSubTab} />;
      case 'projects':
        return <ProjectList onSelectProject={handleSelectProject} />;
      case 'project-detail':
        return selectedProjectId ? (
          <ProjectDetail projectId={selectedProjectId} onBack={handleBackToProjects} />
        ) : (
          <ProjectList onSelectProject={handleSelectProject} />
        );
      case 'portfolio':
        return <Portfolio />;
      case 'collaboration':
        return <Collaboration />;
      case 'teacher':
        return isTeacher ? <AdminPanel activeSubTab={adminSubTab} setActiveSubTab={setAdminSubTab} /> : <Dashboard setActiveTab={setActiveTab} setAdminSubTab={setAdminSubTab} />;
      case 'admin':
        return isAdmin ? <AdminPanel activeSubTab={adminSubTab} setActiveSubTab={setAdminSubTab} /> : <Dashboard setActiveTab={setActiveTab} setAdminSubTab={setAdminSubTab} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} setAdminSubTab={setAdminSubTab} />;
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans antialiased text-gray-900 flex-col md:flex-row">
      <Sidebar 
        activeTab={activeTab === 'project-detail' ? 'projects' : activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-gray-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
            <GraduationCap size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-gray-900 leading-none">PjBL Classroom</span>
            <span className="text-[8.5px] font-bold text-indigo-600 uppercase tracking-widest mt-1">SMKN 1 Ujungbatu</span>
          </div>
        </div>
        <button 
          onClick={signOut}
          className="p-1.5 px-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black flex items-center gap-1 hover:bg-red-100 transition-colors cursor-pointer"
        >
          <LogOut size={12} />
          Keluar
        </button>
      </div>
      
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedProjectId || '')}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-150 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] px-1.5 py-2.5 flex justify-around items-center z-40 pb-safe">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = (activeTab === 'project-detail' && item.id === 'projects') || activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'projects') {
                  setSelectedProjectId(null);
                }
              }}
              className="flex flex-col items-center justify-center flex-1 py-0.5 px-1 relative transition-all duration-200"
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                isActive ? "bg-indigo-50 text-indigo-600 scale-105" : "text-gray-400"
              )}>
                <Icon size={18} />
              </div>
              <span className={cn(
                "text-[9px] font-bold tracking-tight mt-0.5 whitespace-nowrap transition-all duration-200",
                isActive ? "text-indigo-600 font-extrabold" : "text-gray-500"
              )}>
                {item.label === 'Dashboard' ? 'Home' : 
                 item.label === 'PjBL Projects' ? 'Projek' : 
                 item.label === 'Digital Portfolio' ? 'Portofolio' : 
                 item.label === 'Collaboration' ? 'Diskusi' : 
                 item.label === 'Teacher Console' ? 'Guru' : 
                 item.label === 'Admin Center' ? 'Admin' : 
                 item.label === 'Settings' ? 'Setelan' : item.label}
              </span>
              {isActive && (
                <div className="absolute -top-2.5 w-8 h-1 bg-indigo-600 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <AppContent />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}


