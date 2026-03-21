import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  User, 
  Settings,
  BookOpen, // Classrooms
  QrCode,   // Attendance
  History,  // History/Reports
  Users     // Students/Teachers
} from 'lucide-react';

const AppLayout = ({ children }) => {
  const { user, profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const role = profile?.role;

  const getNavItems = () => {
    switch(role) {
      case 'student':
        return [
          { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
          { name: 'My Classrooms', path: '/student/classrooms', icon: BookOpen },
          { name: 'Scan Attendance', path: '/student/scan', icon: QrCode },
          { name: 'History', path: '/student/history', icon: History },
          { name: 'Profile', path: '/student/profile', icon: User },
        ];
      case 'teacher':
        return [
          { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
          { name: 'Classrooms', path: '/teacher/classrooms', icon: BookOpen },
          { name: 'Reports', path: '/teacher/reports', icon: History },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'Teachers', path: '/admin/teachers', icon: Users },
          { name: 'Settings', path: '/admin/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 bg-slate-800">
          <span className="text-xl font-bold">Attendance Sys</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center px-4 py-2 text-sm font-medium rounded-md group transition-colors
                  ${isActive 
                    ? 'bg-slate-800 text-white' 
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'}
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 flex-shrink-0 h-6 w-6" aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 bg-slate-800">
           <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{profile?.full_name || user?.email}</p>
                <p className="text-xs text-gray-400 capitalize">{role}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Menu size={24} />
            </button>
            <div className="flex justify-end w-full">
              <button
                onClick={signOut}
                className="flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
