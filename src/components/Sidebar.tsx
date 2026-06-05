import { LayoutDashboard, FolderKanban, Briefcase, Users, Settings, LogOut, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useFirebase } from './FirebaseProvider';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'PjBL Projects', icon: FolderKanban },
  { id: 'portfolio', label: 'Digital Portfolio', icon: Briefcase },
  { id: 'collaboration', label: 'Collaboration', icon: Users },
  { id: 'teacher', label: 'Teacher Console', icon: Users, teacherOnly: true },
  { id: 'admin', label: 'Admin Center', icon: Settings, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }: SidebarProps) {
  const { signOut, isAdmin, isTeacher } = useFirebase();

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

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out md:flex hidden relative shrink-0 z-30",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Absolute Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 flex items-center justify-center rounded-full hover:bg-indigo-50 hover:border-indigo-200 focus:outline-none shadow-sm text-gray-400 hover:text-indigo-600 z-50 cursor-pointer transition-all"
        title={isCollapsed ? "Buka Sidebar" : "Tutul Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={cn(
        "flex items-center gap-3 transition-all duration-300",
        isCollapsed ? "p-5 justify-center" : "p-6"
      )}>
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-100">
          <GraduationCap size={24} />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col min-w-0"
          >
            <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate">PjBL Classroom</h1>
            <span className="text-[10px] font-semibold text-indigo-600 tracking-widest uppercase">SMKN 1 Ujungbatu</span>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                isActive 
                  ? "bg-indigo-50 text-indigo-700 font-bold" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={20} className={cn(isActive ? "text-indigo-600" : "text-gray-400", "shrink-0")} />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!isCollapsed && isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className={cn("border-t border-gray-100 transition-all duration-300", isCollapsed ? "p-2" : "p-4")}>
        <button 
          onClick={signOut}
          title={isCollapsed ? "Sign Out" : undefined}
          className={cn(
            "w-full flex items-center text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-250",
            isCollapsed ? "p-3.5 justify-center" : "gap-3 px-4 py-3"
          )}
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

